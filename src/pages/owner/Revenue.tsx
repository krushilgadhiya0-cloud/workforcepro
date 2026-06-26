import { useState } from 'react';
import { DollarSign, Calendar, FileText, Plus, Search, TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useData, useCurrentCompany } from '../../contexts/DataContext';

export function Revenue() {
  const { addDailyRevenue, getDailyRevenue } = useData();
  const company = useCurrentCompany();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const records = company ? getDailyRevenue(company.id) : [];
  const filteredRecords = records.filter(r => 
    r.date.includes(search) || 
    (r.notes?.toLowerCase().includes(search.toLowerCase()))
  );

  const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);
  const averageRevenue = records.length > 0 ? totalRevenue / records.length : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;
    addDailyRevenue(Number(amount), date, notes);
    setAmount('');
    setNotes('');
    setShowAdd(false);
  };

  return (
    <div>
      <PageHeader 
        title="Revenue Management" 
        subtitle="Track and monitor your daily business income" 
        showBack={false}
        action={<Button onClick={() => setShowAdd(true)} className="glow-primary flex items-center gap-2"><Plus size={18} /> Add Entry</Button>}
      />

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={<TrendingUp size={24} className="text-green-500" />} color="bg-green-500/10" />
        <StatCard title="Daily Average" value={`₹${Math.round(averageRevenue).toLocaleString('en-IN')}`} icon={<DollarSign size={24} className="text-blue-500" />} color="bg-blue-500/10" />
        <StatCard title="Entries" value={records.length.toString()} icon={<FileText size={24} className="text-purple-500" />} color="bg-purple-500/10" />
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by date or notes..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--primary)] transition-all"
        />
      </div>

      <Card className="p-0 overflow-hidden glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/10">
                <th className="text-left p-4 font-bold text-[var(--text-muted)]">Date</th>
                <th className="text-left p-4 font-bold text-[var(--text-muted)]">Amount</th>
                <th className="text-left p-4 font-bold text-[var(--text-muted)]">Notes</th>
                <th className="text-left p-4 font-bold text-[var(--text-muted)]">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--border)]/5 transition-colors">
                  <td className="p-4 font-medium flex items-center gap-2"><Calendar size={14} className="text-[var(--text-muted)]" /> {new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-green-600">₹{r.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-[var(--text-muted)]">{r.notes || '—'}</td>
                  <td className="p-4 text-xs text-[var(--text-muted)]">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[var(--text-muted)] italic">No revenue records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Revenue Entry" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Amount (₹)</label>
            <input 
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Date</label>
            <input 
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm outline-none focus:border-[var(--primary)] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1.5">Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details about this revenue..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm outline-none focus:border-[var(--primary)] transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 glow-primary">Save Entry</Button>
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
