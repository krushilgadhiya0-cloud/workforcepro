import type { SubscriptionPlan } from '../types';

export interface CheckoutDetails {
  companyId: string;
  companyName: string;
  email: string;
  ownerName?: string;
  phone?: string;
}

export interface PaymentStatus {
  configured: boolean;
  keyId?: string;
  mode?: 'test' | 'live';
  message?: string;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Payment API is not reachable. Run "npm run dev" (starts frontend + payment API). On Vercel, add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in project settings.',
    );
  }
  return res.json() as Promise<T>;
}

export async function fetchPaymentStatus(): Promise<PaymentStatus> {
  try {
    const res = await fetch('/api/payment-status');
    return parseJsonResponse<PaymentStatus>(res);
  } catch {
    return {
      configured: false,
      message: 'Payment API is offline. Run "npm run dev" to start the backend.',
    };
  }
}

function waitForRazorpay(maxMs = 8000): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.Razorpay) {
        window.clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started > maxMs) {
        window.clearInterval(timer);
        reject(new Error('Razorpay checkout script failed to load. Check your internet connection.'));
      }
    }, 100);
  });
}

export async function startSubscriptionCheckout(
  plan: SubscriptionPlan,
  details: CheckoutDetails,
): Promise<{ plan: SubscriptionPlan; companyId: string; paymentId: string }> {
  const status = await fetchPaymentStatus();
  if (!status.configured) {
    throw new Error(status.message || 'Razorpay is not connected yet.');
  }

  const orderRes = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan,
      companyId: details.companyId,
      companyName: details.companyName,
      email: details.email,
    }),
  });

  const orderData = await parseJsonResponse<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    description: string;
    error?: string;
  }>(orderRes);

  if (!orderRes.ok) {
    throw new Error(orderData.error || 'Could not start payment');
  }

  await waitForRazorpay();

  if (!window.Razorpay) {
    throw new Error('Razorpay checkout is unavailable');
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'WorkforcePro',
      description: orderData.description,
      order_id: orderData.orderId,
      prefill: {
        name: details.ownerName || details.companyName,
        email: details.email,
        contact: details.phone,
      },
      theme: { color: '#2563eb' },
      handler: async (response) => {
        try {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response),
          });
          const verifyData = await parseJsonResponse<{
            plan: SubscriptionPlan;
            companyId: string;
            paymentId: string;
            error?: string;
          }>(verifyRes);
          if (!verifyRes.ok) {
            throw new Error(verifyData.error || 'Payment verification failed');
          }
          resolve({
            plan: verifyData.plan,
            companyId: verifyData.companyId,
            paymentId: verifyData.paymentId,
          });
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    });

    rzp.on('payment.failed', (response) => {
      reject(new Error(response.error.description || 'Payment failed'));
    });

    rzp.open();
  });
}
