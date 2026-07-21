export type SubscriptionPlan = 'trial' | 'free' | 'starter' | 'pro' | 'enterprise';

export const PLAN_AMOUNTS_PAISE: Record<SubscriptionPlan, number> = {
  free: 29900,
  trial: 100,
  starter: 59900,
  pro: 159900,
  enterprise: 1000000,
};

export const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  free: 'Basic Plan (₹299)',
  trial: '1 Month Free Trial (₹1)',
  starter: 'Starter Plan (₹599)',
  pro: 'Pro Plan (₹1,599)',
  enterprise: 'Enterprise Plan (₹10,000)',
};

export function isValidPlan(plan: unknown): plan is SubscriptionPlan {
  return plan === 'trial' || plan === 'free' || plan === 'starter' || plan === 'pro' || plan === 'enterprise';
}

export function getPlanAmount(plan: SubscriptionPlan): number {
  return PLAN_AMOUNTS_PAISE[plan] || 0;
}
