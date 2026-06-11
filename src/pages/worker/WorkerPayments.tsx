import { FileDown } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData, useCurrentUser, useCurrentCompany } from '../../contexts/DataContext';
import { downloadReceipt } from '../../utils/pdf';

export function WorkerPayments() {
  const { payments, workers } = useData();
  const user = useCurrentUser();
  const company = useCurrentCompany();

  const worker = workers.find((w) => w.userId === user?.id);
  const myPayments = payments.filter((p) => p.workerId === worker?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDownload = (paymentId: string) => {
    const payment = myPayments.find((p) => p.id === paymentId);
    if (!payment || !company) return;
    downloadReceipt({
      companyName: company.name,
      workerName: user?.name || 'Worker',
      amount: payment.amount,
      paymentDate: payment.paidDate || 'N/A',
      transactionId: payment.transactionId || 'N/A',
    });
  };

  return (
    <div>
      <PageHeader title="My Payments" subtitle="Salary history and receipts" showBack={false} />

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Amount</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Due Date</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Paid Date</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {myPayments.map((payment) => (
                <tr key={payment.id} className={`border-b border-[var(--border)] ${payment.status === 'due' ? 'bg-red-500/5' : ''}`}>
                  <td className="p-4 font-medium">₹{payment.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-[var(--text-muted)]">{payment.dueDate}</td>
                  <td className="p-4 text-[var(--text-muted)]">{payment.paidDate || '—'}</td>
                  <td className="p-4"><Badge status={payment.status} /></td>
                  <td className="p-4 text-right">
                    {payment.status === 'paid' && (
                      <Button size="sm" variant="outline" onClick={() => handleDownload(payment.id)}>
                        <FileDown size={14} /> Download
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {myPayments.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No payment records</p>}
        </div>
      </div>
    </div>
  );
}
