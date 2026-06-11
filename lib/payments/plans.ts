export type SubscriptionPlan = 'monthly' | 'yearly';

export const PLAN_AMOUNTS_PAISE: Record<SubscriptionPlan, number> = {
  monthly: 79900,
  yearly: 499900,
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  monthly: 'Monthly Plan (₹799)',
  yearly: 'Yearly Plan (₹4,999)',
};

export function isValidPlan(plan: unknown): plan is SubscriptionPlan {
  return plan === 'monthly' || plan === 'yearly';
}

export function getPlanAmount(plan: SubscriptionPlan): number {
  return PLAN_AMOUNTS_PAISE[plan];
}
