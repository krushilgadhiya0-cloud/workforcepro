import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useData } from '../../contexts/DataContext';

export function SuperAdminPayments() {
  const { companies } = useData();
  const [search, setSearch] = useState('');

  const subscriptionPayments = companies
    .filter((c) => c.subscription && c.name.toLowerCase().includes(search.toLowerCase()))
    .map((c) => {
      let amount = c.subscriptionPrice;
      if (amount === undefined || amount === null) {
        if (c.subscription === 'trial') amount = 1;
        else if (c.subscription === 'monthly') amount = 799;
        else if (c.subscription === 'yearly') amount = 4999;
        else amount = 0;
      }
      return {
        id: c.id,
        companyName: c.name,
        plan: c.subscription!,
        amount,
        date: c.subscriptionDate,
        status: 'paid' as const,
      };
    });

  const totalSubscription = subscriptionPayments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <PageHeader title="All Subscription Payments" subtitle={`${subscriptionPayments.length} plans matched`} showBack={false} />

      <div className="relative mb-8">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search by company name..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--primary)] transition-all" 
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card><p className="text-sm text-[var(--text-muted)]">Total Subscription Revenue</p><p className="text-2xl font-bold mt-1">₹{totalSubscription.toLocaleString('en-IN')}</p></Card>
        <Card><p className="text-sm text-[var(--text-muted)]">Active Subscriptions</p><p className="text-2xl font-bold mt-1 text-[var(--primary)]">{subscriptionPayments.length}</p></Card>
      </div>

      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Subscription Payments (Owner Plans)</h3>
      <div className="glass-card rounded-2xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Company</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Plan</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Amount Paid</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Date</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionPayments.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)]">
                  <td className="p-4 font-medium">{p.companyName}</td>
                  <td className="p-4 capitalize">{p.plan}</td>
                  <td className="p-4">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-[var(--text-muted)]">{p.date ? new Date(p.date).toLocaleDateString() : '—'}</td>
                  <td className="p-4"><Badge status="paid" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptionPayments.length === 0 && <p className="text-center py-8 text-[var(--text-muted)]">No subscription payments</p>}
        </div>
      </div>
    </div>
  );
}
