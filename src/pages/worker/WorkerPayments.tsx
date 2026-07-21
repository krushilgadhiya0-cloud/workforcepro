import { FileDown } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useData, useCurrentUser, useCurrentCompany } from '../../contexts/DataContext';
import { downloadReceipt } from '../../utils/pdf';
import { Input } from '../../components/ui/Input';
import { Save } from 'lucide-react';
import { useState } from 'react';

export function WorkerPayments() {
  const { payments, workers } = useData();
  const user = useCurrentUser();
  const company = useCurrentCompany();

  const worker = workers.find((w) => w.userId === user?.id);
  const myPayments = payments.filter((p) => p.workerId === worker?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [upiId, setUpiId] = useState(worker?.paymentUpiId || '');
  const { updateWorker } = useData();

  const handleSaveContact = () => {
    if (worker) {
      updateWorker(worker.id, { paymentUpiId: upiId });
      alert('Payment details updated successfully.');
    }
  };

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

      <div className="glass-card rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-end md:items-center gap-6">
        <div className="flex-1 w-full">
          <Input 
            label="My Payment UPI ID" 
            value={upiId} 
            onChange={(e) => setUpiId(e.target.value)} 
            placeholder="e.g. 9876543210@ybl"
          />
          <div className="mt-3">
            <Button onClick={handleSaveContact} className="shrink-0">
              <Save size={18} /> Save Details
            </Button>
          </div>
        </div>
        {upiId.trim() && (
          <div className="shrink-0 bg-white p-3 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-500 mb-2 text-center uppercase tracking-wider">Scan to Pay</p>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(user?.name || 'Worker')}&cu=INR`} 
              alt="UPI QR Code" 
              className="w-[120px] h-[120px]"
            />
          </div>
        )}
      </div>

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
