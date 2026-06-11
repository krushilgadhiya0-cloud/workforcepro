import { Wallet, CreditCard, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useCurrentCompany } from '../../contexts/DataContext';

export function OwnerPayments() {
  const company = useCurrentCompany();

  const plans = {
    monthly: { name: 'Monthly Plan', price: 799, features: ['Unlimited Tasks', 'Worker Management', 'Payment Tracking'] },
    yearly: { name: 'Yearly Plan', price: 4999, features: ['Save More', 'Priority Support', 'Premium Features'] },
  };

  const currentPlan = company?.subscription ? plans[company.subscription] : null;

  return (
    <div>
      <PageHeader title="Owner Subscription Payments" subtitle="Manage your platform subscription" showBack={false} />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Current Plan" value={currentPlan?.name || 'None'} icon={<Wallet size={22} className="text-[var(--primary)]" />} />
        <StatCard title="Plan Cost" value={currentPlan ? `₹${currentPlan.price}` : '—'} icon={<CreditCard size={22} className="text-[var(--accent)]" />} />
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
              </div>
              <Badge status="paid" label="Active" />
            </div>
            <ul className="space-y-2">
              {currentPlan?.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <CheckCircle size={14} className="text-green-500" /> {f}
                </li>
              ))}
            </ul>
            <p className="text-xs text-[var(--text-muted)]">Demo mode — no real billing</p>
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No active subscription. Subscribe from the home page when creating a business.</p>
        )}
      </Card>
    </div>
  );
}
