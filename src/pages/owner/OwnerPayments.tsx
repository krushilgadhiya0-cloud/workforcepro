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
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('monthly');
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
    trial: { name: 'Free Trial', price: 0, features: ['Limited Tasks', 'Basic Management'] },
    monthly: { name: 'Monthly Plan', price: 799, features: ['Unlimited Tasks', 'Worker Management', 'Payment Tracking'] },
    yearly: { name: 'Yearly Plan', price: 4999, features: ['Save More', 'Priority Support', 'Premium Features'] },
  };

  const currentPlan = company?.subscription ? plans[company.subscription] : null;

  const calculateRemainingDays = () => {
    if (!company?.subscriptionDate || !company?.subscription) return null;
    const start = new Date(company.subscriptionDate);
    const now = new Date();
    const durationDays = company.subscription === 'yearly' ? 365 : 30; // 1 month for trial/monthly, 1 year for yearly
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);
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
        <StatCard title="Current Plan" value={currentPlan?.name || 'None'} icon={<Wallet size={22} className="text-[var(--primary)]" />} />
        <StatCard title="Plan Cost" value={company?.subscriptionPrice ? `₹${company.subscriptionPrice}` : (currentPlan ? `₹${currentPlan.price}` : '—')} icon={<CreditCard size={22} className="text-[var(--accent)]" />} />
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
              {currentPlan?.features.map((f: string) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <CheckCircle size={14} className="text-green-500" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" onClick={() => setShowUpgrade(true)}>Change Plan</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[var(--text-muted)]">No active subscription. Subscribe to unlock full platform access.</p>
            <Button onClick={() => setShowUpgrade(true)}>Choose a Plan</Button>
          </div>
        )}
      </Card>

      <Modal isOpen={showUpgrade} onClose={() => !paying && setShowUpgrade(false)} title="Choose Your Plan" size="lg">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {!company?.hasUsedTrial && (
            <button
              type="button"
              onClick={() => setSelectedPlan('trial')}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                selectedPlan === 'trial' ? 'border-green-500 bg-green-500/5' : 'border-[var(--border)] hover:border-green-500/50'
              }`}
            >
              <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium">New User</span>
              <p className="text-sm text-[var(--text-muted)] capitalize">Trial Plan</p>
              <p className="text-3xl font-bold text-[var(--text)] mt-1">₹1<span className="text-sm font-normal text-[var(--text-muted)]">/month</span></p>
              <ul className="mt-4 space-y-2">
                {plans.trial.features.map((f) => (
                  <li key={f} className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {f}
                  </li>
                ))}
              </ul>
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            className={`relative p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              selectedPlan === 'monthly' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--primary)]/50'
            }`}
          >
            <p className="text-sm text-[var(--text-muted)] capitalize">Monthly Plan</p>
            <p className="text-3xl font-bold text-[var(--text)] mt-1">₹799<span className="text-sm font-normal text-[var(--text-muted)]">/month</span></p>
            <ul className="mt-4 space-y-2">
              {plans.monthly.features.map((f) => (
                <li key={f} className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" /> {f}
                </li>
              ))}
            </ul>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPlan('yearly')}
            className={`relative p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
              selectedPlan === 'yearly' ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] hover:border-[var(--accent)]/50'
            }`}
          >
            <span className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full gradient-bg text-white text-xs font-medium">Best Value</span>
            <p className="text-sm text-[var(--text-muted)] capitalize">Yearly Plan</p>
            <p className="text-3xl font-bold text-[var(--text)] mt-1">₹4,999<span className="text-sm font-normal text-[var(--text-muted)]">/year</span></p>
            <ul className="mt-4 space-y-2">
              {plans.yearly.features.map((f) => (
                <li key={f} className="text-sm text-[var(--text-muted)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> {f}
                </li>
              ))}
            </ul>
          </button>
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
