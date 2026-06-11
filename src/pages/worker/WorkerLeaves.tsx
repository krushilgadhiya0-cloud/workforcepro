import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useData, useCurrentUser } from '../../contexts/DataContext';

export function WorkerLeaves() {
  const { leaves, workers, applyLeave } = useData();
  const user = useCurrentUser();
  const [form, setForm] = useState({ leaveDate: '', days: '1', reason: '' });
  const [submitted, setSubmitted] = useState(false);

  const worker = workers.find((w) => w.userId === user?.id);
  const myLeaves = leaves.filter((l) => l.workerId === worker?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) return;
    applyLeave({
      companyId: worker.companyId,
      workerId: worker.id,
      leaveDate: form.leaveDate,
      days: Number(form.days),
      reason: form.reason,
    });
    setForm({ leaveDate: '', days: '1', reason: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Apply for leave and track requests" showBack={false} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Apply Leave</h3>
          {submitted && <div className="mb-4 p-3 rounded-xl bg-green-500/10 text-green-600 text-sm">Leave request submitted successfully!</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Leave Date" type="date" value={form.leaveDate} onChange={(e) => setForm({ ...form, leaveDate: e.target.value })} required />
            <Input label="Number of Days" type="number" min="1" value={form.days} onChange={(e) => setForm({ ...form, days: e.target.value })} required />
            <Textarea label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
            <div className="flex gap-3">
              <Button type="submit" className="flex-1">Submit Leave Request</Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setForm({ leaveDate: '', days: '1', reason: '' })}>Cancel</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">My Leave History</h3>
          <div className="space-y-3">
            {myLeaves.map((leave) => (
              <div key={leave.id} className="p-4 rounded-xl bg-[var(--border)]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-[var(--text)]">{leave.leaveDate}</span>
                  <Badge status={leave.status} />
                </div>
                <p className="text-sm text-[var(--text-muted)]">{leave.days} day(s) — {leave.reason}</p>
              </div>
            ))}
            {myLeaves.length === 0 && <p className="text-center py-8 text-[var(--text-muted)]">No leave requests yet</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
