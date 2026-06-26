import { useState } from 'react';
import { Building2, Search, Mail, Phone, MapPin, Briefcase, Users, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';

export function SuperAdminCompanies() {
  const { companies, workers, payments, tasks, removeCompanyAsSuperAdmin, updateCompanySubscription } = useData();
  const [search, setSearch] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [newPlan, setNewPlan] = useState<'trial' | 'monthly' | 'yearly' | 'none'>('none');
  const [trialDays, setTrialDays] = useState(30);

  const filtered = companies.filter((c) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.industry.toLowerCase().includes(search.toLowerCase()) ||
    c.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  const company = companies.find((c) => c.id === viewId);

  const getCompanyStats = (companyId: string) => ({
    workers: workers.filter((w) => w.companyId === companyId).length,
    payments: payments.filter((p) => p.companyId === companyId).length,
    tasks: tasks.filter((t) => t.companyId === companyId).length,
    paid: payments.filter((p) => p.companyId === companyId && p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    due: payments.filter((p) => p.companyId === companyId && p.status === 'due').length,
  });

  const getTrialDaysLeft = (trialEndDate?: string) => {
    if (!trialEndDate) return 0;
    const end = new Date(trialEndDate).getTime();
    const now = new Date().getTime();
    const dif = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    return dif;
  };

  return (
    <div>
      <PageHeader title="All Companies" subtitle={`${filtered.length} companies matched`} showBack={false} />

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          placeholder="Search by name, industry or owner..." 
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--primary)] transition-all" 
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((c) => {
          const stats = getCompanyStats(c.id);
          return (
            <Card key={c.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                    <Building2 size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">{c.name}</h3>
                    <p className="text-sm text-[var(--text-muted)]">{c.industry}</p>
                  </div>
                </div>
                {c.subscription === 'trial' ? (
                  <Badge status="pending" label={`${getTrialDaysLeft(c.trialEndDate)} Days Trial Left`} />
                ) : (
                  c.subscription ? <Badge status="paid" label={`${c.subscription} plan`} /> : <Badge status="due" label="No subscription" />
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm text-[var(--text-muted)]">
                <div className="flex items-center gap-2"><Briefcase size={14} /> Owner: {c.ownerName}</div>
                <div className="flex items-center gap-2"><Mail size={14} /> {c.email}</div>
                <div className="flex items-center gap-2"><Phone size={14} /> {c.phone}</div>
                <div className="flex items-center gap-2"><MapPin size={14} /> {c.address || 'No address'}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[var(--border)]/20 text-center">
                  <Users size={14} className="mx-auto mb-1 text-[var(--primary)]" />
                  <p className="text-xs text-[var(--text-muted)]">Workers</p>
                  <p className="font-semibold text-sm">{stats.workers}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--border)]/20 text-center">
                  <CreditCard size={14} className="mx-auto mb-1 text-[var(--accent)]" />
                  <p className="text-xs text-[var(--text-muted)]">Payments</p>
                  <p className="font-semibold text-sm">{stats.payments}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--border)]/20 text-center">
                  <p className="text-xs text-[var(--text-muted)]">Paid</p>
                  <p className="font-semibold text-sm">₹{stats.paid.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setViewId(c.id)}>View Details</Button>
                <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => { setSubId(c.id); setNewPlan((c.subscription as any) || 'none'); }}>
                  <Pencil size={14} className="mr-1" /> Plan
                </Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { if(confirm(`Are you sure you want to delete ${c.name}? This will remove all their data permanently.`)) removeCompanyAsSuperAdmin(c.id); }}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          );
        })}
        {companies.length === 0 && (
          <div className="col-span-2 text-center py-16 text-[var(--text-muted)]">
            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
            <p>No companies registered yet</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!viewId && !!company} onClose={() => setViewId(null)} title={company?.name || 'Company Details'} size="lg">
        {company && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-[var(--text-muted)]">Owner:</span> <strong>{company.ownerName}</strong></div>
              <div><span className="text-[var(--text-muted)]">Industry:</span> <strong>{company.industry}</strong></div>
              <div><span className="text-[var(--text-muted)]">Email:</span> <strong>{company.email}</strong></div>
              <div><span className="text-[var(--text-muted)]">Phone:</span> <strong>{company.phone}</strong></div>
              <div className="sm:col-span-2"><span className="text-[var(--text-muted)]">Address:</span> <strong>{company.address || '—'}</strong></div>
              <div><span className="text-[var(--text-muted)]">Subscription:</span> <strong>{company.subscription || 'None'}</strong></div>
              {company.subscription === 'trial' && (
                <div><span className="text-[var(--text-muted)]">Trial Ends:</span> <strong>{company.trialEndDate ? new Date(company.trialEndDate).toLocaleDateString() : '—'}</strong></div>
              )}
              <div><span className="text-[var(--text-muted)]">Joined:</span> <strong>{new Date(company.createdAt).toLocaleDateString()}</strong></div>
            </div>
            <div className="p-4 rounded-xl bg-[var(--border)]/20">
              <h4 className="font-medium mb-2">Company Stats</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(getCompanyStats(company.id)).map(([key, val]) => (
                  <div key={key}><span className="text-[var(--text-muted)] capitalize">{key}:</span> {typeof val === 'number' && key === 'paid' ? `₹${val.toLocaleString('en-IN')}` : val}</div>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => setViewId(null)}>Close</Button>
          </div>
        )}
      </Modal>
      <Modal isOpen={!!subId} onClose={() => setSubId(null)} title="Manage Subscription" size="sm">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Select Subscription Plan</label>
            <select 
              value={newPlan} 
              onChange={(e) => setNewPlan(e.target.value as any)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="none">No Subscription</option>
              <option value="trial">Trial Access</option>
              <option value="monthly">Monthly Plan (₹799)</option>
              <option value="yearly">Yearly Plan (₹4999)</option>
            </select>
          </div>

          {newPlan === 'trial' && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Trial Duration (Days)</label>
              <input 
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value) || 1)}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setSubId(null)}>Cancel</Button>
            <Button className="flex-1" onClick={() => {
              if (subId) {
                updateCompanySubscription(subId, newPlan === 'none' ? null : newPlan as any, newPlan === 'trial' ? trialDays : undefined);
                setSubId(null);
              }
            }}>Update Plan</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
