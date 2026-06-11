import Razorpay from 'razorpay';

const PLACEHOLDER_MARKERS = ['xxxxxxxx', 'your_razorpay', 'replace_me', 'example'];

function looksLikePlaceholder(value: string) {
  const lower = value.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker));
}

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay is not connected. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local (local) or Vercel Environment Variables (production).',
    );
  }

  if (looksLikePlaceholder(keyId) || looksLikePlaceholder(keySecret)) {
    throw new Error(
      'Razorpay keys are still placeholders. Get test keys from dashboard.razorpay.com → Settings → API Keys, then update .env.local and restart the app.',
    );
  }

  if (!keyId.startsWith('rzp_')) {
    throw new Error('RAZORPAY_KEY_ID must start with rzp_test_ or rzp_live_.');
  }

  return { keyId, keySecret };
}

export function getPaymentStatus() {
  try {
    const { keyId } = getRazorpayConfig();
    return {
      configured: true,
      keyId,
      mode: keyId.includes('_test_') ? 'test' : 'live',
    };
  } catch (error) {
    return {
      configured: false,
      message: error instanceof Error ? error.message : 'Razorpay is not configured',
    };
  }
}

export function createRazorpayClient() {
  const { keyId, keySecret } = getRazorpayConfig();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}
