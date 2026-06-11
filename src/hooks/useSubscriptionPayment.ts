import { useState, useCallback } from 'react';
import type { SubscriptionPlan } from '../types';
import { startSubscriptionCheckout, type CheckoutDetails } from '../utils/payments';

export function useSubscriptionPayment(onSuccess: (plan: SubscriptionPlan, companyId: string) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pay = useCallback(async (plan: SubscriptionPlan, details: CheckoutDetails) => {
    setLoading(true);
    setError('');
    try {
      const result = await startSubscriptionCheckout(plan, details);
      onSuccess(result.plan, result.companyId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      if (message !== 'Payment cancelled') {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { pay, loading, error, clearError: () => setError('') };
}
