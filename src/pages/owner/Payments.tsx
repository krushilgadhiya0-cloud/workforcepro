import { useState } from 'react';
import { Plus, FileText, QrCode, Banknote } from 'lucide-react';
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
  const [viewUpi, setViewUpi] = useState<string | null>(null);

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

  const upiId = companyWorkers.find(w => w.id === viewUpi)?.paymentUpiId || '';
  const workerName = getWorkerName(viewUpi || '');
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(workerName)}&cu=INR`;

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
                          <Button size="sm" onClick={() => markPaymentPaid(payment.id, 'online')}>
                            Mark as Paid
                          </Button>
                          <Button size="sm" variant="outline" className="text-green-500 border-green-500/30 hover:bg-green-50" onClick={() => markPaymentPaid(payment.id, 'cash')}>
                            <Banknote size={14} /> Pay via Cash
                          </Button>
                          {companyWorkers.find(w => w.id === payment.workerId)?.paymentUpiId && (
                            <Button size="sm" variant="outline" className="text-blue-500 border-blue-500/30 hover:bg-blue-50" onClick={() => setViewUpi(payment.workerId)}>
                              <QrCode size={14} /> View UPI Info
                            </Button>
                          )}
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

      <Modal isOpen={!!viewUpi} onClose={() => setViewUpi(null)} title="Worker UPI Info">
        <div className="text-center p-6 space-y-4">
          <div className="hidden md:flex flex-col items-center justify-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`} 
              alt="UPI QR Code" 
              className="w-[200px] h-[200px] rounded-xl shadow-sm border border-slate-200 mb-4 bg-white p-2"
            />
            <h3 className="text-lg font-bold text-[var(--text)]">{workerName}</h3>
            <p className="text-[var(--text-muted)] text-sm">Scan this QR code from any UPI app to transfer the salary.</p>
          </div>

          <div className="md:hidden space-y-4">
            <div className="w-20 h-20 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center mx-auto mb-2">
              <QrCode size={40} />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)]">{workerName}</h3>
            <p className="text-[var(--text-muted)] text-sm">Tap the button below to directly open a UPI app on your device.</p>
            <a href={upiLink} target="_blank" rel="noopener noreferrer" className="mt-4 flex w-full items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
              <QrCode size={18} /> Pay Directly via UPI App
            </a>
          </div>
          
          <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl font-mono text-lg font-bold tracking-wider mt-4 text-[var(--text)] select-all break-all text-center">
            {upiId || 'Not set'}
          </div>

          <Button className="w-full mt-4" onClick={() => setViewUpi(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
