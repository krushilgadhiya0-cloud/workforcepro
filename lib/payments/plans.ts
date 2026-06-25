export type SubscriptionPlan = 'trial' | 'monthly' | 'yearly';

export const PLAN_AMOUNTS_PAISE: Record<SubscriptionPlan, number> = {
  trial: 100,
  monthly: 79900,
  yearly: 499900,
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  trial: '1 Month Free Trial (₹1)',
  monthly: 'Monthly Plan (₹799)',
  yearly: 'Yearly Plan (₹4,999)',
};

export function isValidPlan(plan: unknown): plan is SubscriptionPlan {
  return plan === 'trial' || plan === 'monthly' || plan === 'yearly';
}

export function getPlanAmount(plan: SubscriptionPlan): number {
  return PLAN_AMOUNTS_PAISE[plan];
}
