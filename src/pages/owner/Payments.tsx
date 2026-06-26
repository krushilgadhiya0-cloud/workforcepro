import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useData, useCurrentCompany } from '../../contexts/DataContext';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { downloadReceipt } from '../../utils/pdf';

export function Payments() {
  const { payments, workers, addPayment, markPaymentPaid } = useData();
  const company = useCurrentCompany();
  const { checkSubscription } = useSubscriptionGuard();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ workerId: '', amount: '', dueDate: '' });

  const openAdd = () => {
    if (!checkSubscription()) return;
    const firstWorkerId = companyWorkers[0]?.id || '';
    setForm({ workerId: firstWorkerId, amount: '', dueDate: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  };


  const companyPayments = payments.filter((p) => p.companyId === company?.id);
  const companyWorkers = workers.filter((w) => w.companyId === company?.id);
  const workerOptions = companyWorkers.map((w) => ({ value: w.id, label: w.name }));

  const getWorkerName = (id: string) => companyWorkers.find((w) => w.id === id)?.name || 'Unknown';

  const [formError, setFormError] = useState('');

  const handleAdd = () => {
    if (!company) {
      setFormError('No business found.');
      return;
    }
    if (!form.workerId) {
      setFormError('Please select a worker.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('Please enter a valid salary amount.');
      return;
    }
    if (!form.dueDate) {
      setFormError('Please select a due date.');
      return;
    }
    
    addPayment({ companyId: company.id, workerId: form.workerId, amount: Number(form.amount), dueDate: form.dueDate });
    setShowModal(false);
    setForm({ workerId: '', amount: '', dueDate: '' });
    setFormError('');
  };

  const handleReceipt = (paymentId: string) => {
    const payment = companyPayments.find((p) => p.id === paymentId);
    if (!payment || !company) return;
    downloadReceipt({
      companyName: company.name,
      workerName: getWorkerName(payment.workerId),
      amount: payment.amount,
      paymentDate: payment.paidDate || new Date().toISOString().split('T')[0],
      transactionId: payment.transactionId || 'N/A',
    });
  };

  return (
    <div>
      <PageHeader title="Worker Payments" subtitle="Manage salary payments" action={<Button onClick={openAdd}><Plus size={18} /> Add Payment</Button>} showBack={false} />

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Worker Name</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Salary Amount</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Due Date</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyPayments.map((payment) => (
                <tr key={payment.id} className={`border-b border-[var(--border)] hover:bg-[var(--border)]/10 ${payment.status === 'due' ? 'bg-red-500/5' : ''}`}>
                  <td className="p-4 font-medium">{getWorkerName(payment.workerId)}</td>
                  <td className="p-4">₹{payment.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-[var(--text-muted)]">{payment.dueDate}</td>
                  <td className="p-4"><Badge status={payment.status} /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {payment.status !== 'paid' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => markPaymentPaid(payment.id)}>Mark as Paid</Button>
                          <Button size="sm" variant="outline" className="text-blue-500 border-blue-500/30 hover:bg-blue-50" onClick={() => alert("Online bank transfer feature is being activated for your account. Please use 'Mark as Paid' for now.")}>
                            Pay Online
                          </Button>
                        </div>
                      )}

                      {payment.status === 'paid' && (
                        <Button size="sm" variant="outline" onClick={() => handleReceipt(payment.id)}><FileText size={14} /> Receipt</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companyPayments.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No payments recorded</p>}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError(''); }} title="Add Payment">
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{formError}</div>}
          <Select label="Worker" options={workerOptions.length ? workerOptions : [{ value: '', label: 'No workers' }]} value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} />
          <Input label="Salary Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleAdd}>Add Payment</Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
