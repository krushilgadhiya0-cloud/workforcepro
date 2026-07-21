import { useState } from 'react';
import { Wallet, CreditCard, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useCurrentCompany, useData, useCurrentUser } from '../../contexts/DataContext';
import { useSubscriptionPayment } from '../../hooks/useSubscriptionPayment';
import { RazorpayStatus } from '../../components/payments/RazorpayStatus';
import type { SubscriptionPlan } from '../../types';

import { fireCelebration } from '../../utils/confetti';

export function OwnerPayments() {
  const company = useCurrentCompany();
  const user = useCurrentUser();
  const { subscribe } = useData();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('starter');
  const [isSuccess, setIsSuccess] = useState(false);

  const { pay, loading: paying, error: paymentError, clearError } = useSubscriptionPayment((plan, companyId) => {
    subscribe(companyId, plan);
    setIsSuccess(true);
    fireCelebration();
    setTimeout(() => {
      setShowUpgrade(false);
      setIsSuccess(false);
    }, 3000);
  });

  const plans = {
    free: { name: 'Free Plan', price: 0, workers: 'Up to 5', features: ['Up to 5 workers', 'Basic Task Management', 'Standard Support'] },
    starter: { name: 'Starter', price: 599, workers: '5 - 20', features: ['Up to 20 workers', 'Advanced Analytics', 'Priority Support'] },
    pro: { name: 'Pro', price: 1599, workers: '20 - 100', features: ['Up to 100 workers', 'Communication Hub', 'AI Integrations'] },
    enterprise: { name: 'Enterprise', price: 10000, workers: '100 - 1,000', features: ['Up to 1,000 workers', 'Dedicated Manager', 'Custom Solutions'] },
  };

  const currentPlan = company?.subscription ? plans[company.subscription] : null;

  const calculateRemainingDays = () => {
    if (!company?.subscriptionDate || !company?.subscription) return null;
    const start = new Date(company.subscriptionDate);
    const now = new Date();
    // Assuming monthly renewal cycles for paid plans
    const end = new Date(start);
    end.setDate(start.getDate() + 30);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const remainingDays = calculateRemainingDays();

  const handleUpgrade = async () => {
    if (!company || !user) return;
    clearError();
    
    // If trial is selected, we can use a simpler flow or just pay ₹1
    await pay(selectedPlan, {
      companyId: company.id,
      companyName: company.name,
      email: company.email,
      ownerName: company.ownerName,
      phone: company.phone,
    });
  };

  return (
    <div>
      <PageHeader
        title="Owner Subscription Payments"
        subtitle="Manage your platform subscription"
        showBack={false}
        action={!company?.subscription ? (
          <Button onClick={() => setShowUpgrade(true)}>Subscribe Now</Button>
        ) : undefined}
      />

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <StatCard title="Current Plan" value={currentPlan?.name || 'Free'} icon={<Wallet size={22} className="text-[var(--primary)]" />} />
        <StatCard title="Plan Cost" value={company?.subscriptionPrice ? `₹${company.subscriptionPrice}` : (currentPlan?.price ? `₹${currentPlan.price}` : 'Free')} icon={<CreditCard size={22} className="text-[var(--accent)]" />} />
        <StatCard title="Remaining Days" value={remainingDays !== null ? `${remainingDays} Days` : '—'} icon={<CheckCircle size={22} className="text-blue-500" />} color="bg-blue-500/10" />
        <StatCard title="Status" value={company?.subscription ? 'Active' : 'Inactive'} icon={<CheckCircle size={22} className="text-green-500" />} color="bg-green-500/10" />
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Subscription Details</h3>
        {company?.subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--border)]/20">
              <div>
                <p className="font-medium text-[var(--text)]">{currentPlan?.name}</p>
                <p className="text-sm text-[var(--text-muted)]">Subscribed on {company.subscriptionDate ? new Date(company.subscriptionDate).toLocaleDateString() : '—'}</p>
                {remainingDays !== null && <p className="text-xs font-medium text-[var(--primary)] mt-1">Expires in {remainingDays} days</p>}
              </div>
              <Badge status="paid" label="Active" />
            </div>
            <ul className="space-y-2">
              {currentPlan?.features?.map((f: string) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <CheckCircle size={14} className="text-green-500" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" onClick={() => setShowUpgrade(true)}>Change Plan</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[var(--text-muted)]">You are currently on the Free plan. Upgrade to unlock more workers and features.</p>
            <Button onClick={() => setShowUpgrade(true)}>Upgrade Plan</Button>
          </div>
        )}
      </Card>

      <Modal isOpen={showUpgrade} onClose={() => !paying && setShowUpgrade(false)} title="Choose Your Plan" size="lg">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {(Object.entries(plans) as [SubscriptionPlan, typeof plans.free][]).map(([key, plan]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPlan(key)}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col ${
                selectedPlan === key ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/50'
              }`}
            >
              {key === 'free' && <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-slate-500 text-white text-[10px] font-bold uppercase">Basic</span>}
              {key === 'starter' && <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold uppercase">Popular</span>}
              {key === 'pro' && <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full gradient-bg text-white text-[10px] font-bold uppercase">Best Value</span>}
              <p className="text-sm text-[var(--text-muted)] capitalize mb-1">{plan.name}</p>
              <p className="text-2xl font-bold text-[var(--text)] mb-3">
                {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                {plan.price > 0 && <span className="text-[10px] font-normal text-[var(--text-muted)]">/mo</span>}
              </p>
              <div className="mb-4 text-xs font-semibold px-2 py-1 bg-[var(--border)]/30 rounded-lg text-center">
                {plan.workers} 
              </div>
              <ul className="mt-auto space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-[11px] text-[var(--text-muted)] flex items-start gap-1.5 leading-tight">
                    <span className="w-1 h-1 mt-1 rounded-full bg-[var(--primary)] shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
        
        <div className="text-center mb-6">
          <p className="text-xs text-[var(--text-muted)]">Need more than 1,000 workers? <a href="mailto:contact@workforcepro.com" className="text-[var(--primary)] hover:underline font-bold">Contact Owner</a></p>
        </div>
        <RazorpayStatus />
        {paymentError && <p className="text-sm text-red-500 text-center mb-4">{paymentError}</p>}
        <div className="flex gap-3">
          <Button 
            className={`flex-1 ${!paying && !isSuccess ? 'glow-primary' : ''}`} 
            onClick={handleUpgrade} 
            disabled={paying || isSuccess || !company}
          >
            {isSuccess ? '✓ Success!' : paying ? 'Processing…' : 'Pay & Subscribe'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowUpgrade(false)} disabled={paying || isSuccess}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
