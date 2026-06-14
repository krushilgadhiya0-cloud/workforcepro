import { createRazorpayClient, getRazorpayConfig } from './razorpay.js';
import { getPlanAmount, isValidPlan, PLAN_LABELS } from './plans.js';
import { verifyPaymentSignature, verifyWebhookSignature } from './verify.js';
import { loadStoredAppData, saveStoredAppData } from '../app-store.js';
import { sendPaymentReceiptEmail } from '../email/gmail.js';
import type { SubscriptionPlan } from '../types';

export interface CreateOrderInput {
  plan: unknown;
  companyId: string;
  companyName?: string;
  email?: string;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: 'INR';
  keyId: string;
  plan: 'monthly' | 'yearly';
  companyId: string;
  description: string;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResult {
  success: true;
  plan: 'monthly' | 'yearly';
  companyId: string;
  paymentId: string;
  orderId: string;
}

export async function handleCreateOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { plan, companyId, companyName, email } = input;

  if (!companyId || typeof companyId !== 'string') {
    throw new Error('companyId is required');
  }

  if (!isValidPlan(plan)) {
    throw new Error('Invalid plan. Use monthly or yearly.');
  }

  const amount = getPlanAmount(plan);
  const { keyId } = getRazorpayConfig();
  const razorpay = createRazorpayClient();

  let order;
  try {
    order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `sub_${companyId.slice(0, 8)}_${Date.now()}`,
      notes: {
        companyId,
        plan,
        companyName: companyName || '',
        email: email || '',
      },
    });
  } catch (error: unknown) {
    const rzp = error as { error?: { description?: string; reason?: string } };
    const detail = rzp.error?.description || rzp.error?.reason;
    throw new Error(detail || 'Could not create Razorpay order. Check your API keys.', { cause: error });
  }

  return {
    orderId: order.id,
    amount,
    currency: 'INR',
    keyId,
    plan,
    companyId,
    description: PLAN_LABELS[plan],
  };
}

export async function handleVerifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = input;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error('Missing payment verification fields');
  }

  const { keySecret } = getRazorpayConfig();

  const valid = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    keySecret,
  );

  if (!valid) {
    throw new Error('Payment verification failed. Invalid signature.');
  }

  const razorpay = createRazorpayClient();
  const order = await razorpay.orders.fetch(razorpay_order_id);
  const notes = order.notes as Record<string, string> | undefined;
  const plan = notes?.plan;
  const companyId = notes?.companyId;

  if (!isValidPlan(plan) || !companyId) {
    throw new Error('Order metadata is invalid');
  }

  // ACTIVATE SUBSCRIPTION IN DATABASE IMMEDIATELY
  try {
    const data = await loadStoredAppData();
    if (data) {
      const company = data.companies.find((c) => c.id === companyId);
      if (company) {
        console.log(`Activating ${plan} subscription for ${company.name} [Backend]`);
        company.subscription = plan as SubscriptionPlan;
        company.subscriptionDate = new Date().toISOString();
        
        // Add activity log
        data.activities.unshift({
          id: Math.random().toString(36).substring(2, 11),
          type: 'subscription_started',
          userId: company.ownerId,
          userName: company.ownerName,
          userRole: 'owner',
          companyId: company.id,
          companyName: company.name,
          message: `${company.name} subscribed to ${plan} plan (Auto-activated via Payment)`,
          createdAt: new Date().toISOString(),
        });
        
        await saveStoredAppData(data);

        // SEND RECEIPT EMAIL
        console.log(`Sending Receipt Email to ${company.email}...`);
        await sendPaymentReceiptEmail(company.email, company.ownerName, {
          plan: PLAN_LABELS[plan as SubscriptionPlan],
          amount: getPlanAmount(plan as SubscriptionPlan) / 100, // Convert paise to INR
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        });
      }
    }
  } catch (dbError) {
    console.error('Failed to auto-activate subscription in DB:', dbError);
    // We don't throw here because the payment WAS successful, 
    // the frontend will try to activate it again as a fallback.
  }

  return {
    success: true,
    plan: plan as SubscriptionPlan,
    companyId,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  };
}

export async function handleWebhook(rawBody: string, signature: string | undefined) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  }

  if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    throw new Error('Invalid webhook signature');
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    return {
      received: true,
      event: event.event,
      paymentId: payment?.id,
      orderId: payment?.order_id,
      status: payment?.status,
    };
  }

  return { received: true, event: event.event };
}
