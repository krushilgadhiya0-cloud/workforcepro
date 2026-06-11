import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchPaymentStatus, type PaymentStatus } from '../../utils/payments';

export function RazorpayStatus() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStatus()
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-4 p-3 rounded-xl bg-[var(--border)]/20 text-sm text-[var(--text-muted)] flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        Checking Razorpay connection…
      </div>
    );
  }

  if (!status?.configured) {
    return (
      <div className="mb-4 p-3 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Razorpay not connected yet</p>
            <p className="mt-1 text-xs opacity-90">{status?.message}</p>
            <ol className="mt-2 text-xs space-y-1 list-decimal list-inside opacity-90">
              <li>Create account at <strong>dashboard.razorpay.com</strong></li>
              <li>Copy <strong>Test API Keys</strong> (Key ID + Secret)</li>
              <li>Paste into <strong>.env.local</strong> as RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET</li>
              <li>Restart with <strong>npm run dev</strong></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
      <CheckCircle2 size={16} />
      Razorpay connected ({status.mode} mode) — checkout will open when you click Pay
    </div>
  );
}
