import { FileText } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useData } from '../../contexts/DataContext';
import { downloadReceipt } from '../../utils/pdf';

export function SuperAdminPayments() {
  const { payments, workers, companies, markPaymentPaid } = useData();

  const getWorkerName = (workerId: string) => workers.find((w) => w.id === workerId)?.name || 'Unknown';
  const getCompanyName = (companyId: string) => companies.find((c) => c.id === companyId)?.name || 'Unknown';

  const subscriptionPayments = companies
    .filter((c) => c.subscription)
    .map((c) => ({
      id: c.id,
      companyName: c.name,
      plan: c.subscription!,
      amount: c.subscription === 'monthly' ? 799 : 4999,
      date: c.subscriptionDate,
      status: 'paid' as const,
    }));

  const totalWorkerPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalSubscription = subscriptionPayments.reduce((s, p) => s + p.amount, 0);

  const handleReceipt = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) return;
    const company = companies.find((c) => c.id === payment.companyId);
    downloadReceipt({
      companyName: company?.name || 'Company',
      workerName: getWorkerName(payment.workerId),
      amount: payment.amount,
      paymentDate: payment.paidDate || new Date().toISOString().split('T')[0],
      transactionId: payment.transactionId || 'N/A',
    });
  };

  return (
    <div>
      <PageHeader title="All Payments" subtitle="Worker salaries and subscription payments across all companies" showBack={false} />

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card><p className="text-sm text-[var(--text-muted)]">Worker Payments (Paid)</p><p className="text-2xl font-bold mt-1">₹{totalWorkerPaid.toLocaleString('en-IN')}</p></Card>
        <Card><p className="text-sm text-[var(--text-muted)]">Subscription Revenue</p><p className="text-2xl font-bold mt-1">₹{totalSubscription.toLocaleString('en-IN')}</p></Card>
        <Card><p className="text-sm text-[var(--text-muted)]">Due Payments</p><p className="text-2xl font-bold mt-1 text-red-500">{payments.filter((p) => p.status === 'due').length}</p></Card>
      </div>

      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Subscription Payments (Owner Plans)</h3>
      <div className="glass-card rounded-2xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Company</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Plan</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Amount</th>
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

      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Worker Salary Payments (All Companies)</h3>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Company</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Worker</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Amount</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Due Date</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className={`border-b border-[var(--border)] ${payment.status === 'due' ? 'bg-red-500/5' : ''}`}>
                  <td className="p-4 text-[var(--text-muted)]">{getCompanyName(payment.companyId)}</td>
                  <td className="p-4 font-medium">{getWorkerName(payment.workerId)}</td>
                  <td className="p-4">₹{payment.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-[var(--text-muted)]">{payment.dueDate}</td>
                  <td className="p-4"><Badge status={payment.status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payment.status !== 'paid' && (
                        <Button size="sm" onClick={() => markPaymentPaid(payment.id)}>Mark Paid</Button>
                      )}
                      {payment.status === 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => handleReceipt(payment.id)}><FileText size={14} /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="text-center py-8 text-[var(--text-muted)]">No worker payments</p>}
        </div>
      </div>
    </div>
  );
}
