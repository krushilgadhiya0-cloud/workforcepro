import { useState } from 'react';
import { Building2, Trash2, Mail, Phone, MapPin, Briefcase, Users, CreditCard } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';

export function SuperAdminCompanies() {
  const { companies, workers, payments, tasks, removeCompanyAsSuperAdmin } = useData();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  const company = companies.find((c) => c.id === viewId);

  const getCompanyStats = (companyId: string) => ({
    workers: workers.filter((w) => w.companyId === companyId).length,
    payments: payments.filter((p) => p.companyId === companyId).length,
    tasks: tasks.filter((t) => t.companyId === companyId).length,
    paid: payments.filter((p) => p.companyId === companyId && p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    due: payments.filter((p) => p.companyId === companyId && p.status === 'due').length,
  });

  return (
    <div>
      <PageHeader title="All Companies" subtitle={`${companies.length} companies on the platform`} showBack={false} />

      <div className="grid md:grid-cols-2 gap-6">
        {companies.map((c) => {
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
                {c.subscription ? <Badge status="paid" label={`${c.subscription} plan`} /> : <Badge status="due" label="No subscription" />}
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
                <Button size="sm" variant="danger" onClick={() => setDeleteId(c.id)}><Trash2 size={16} /></Button>
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

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Company">
        <p className="text-sm text-[var(--text-muted)] mb-4">As Super Admin, you can permanently remove this company and all its data (workers, tasks, payments, leaves).</p>
        <div className="flex gap-3">
          <Button variant="danger" className="flex-1" onClick={() => { if (deleteId) { removeCompanyAsSuperAdmin(deleteId); setDeleteId(null); } }}>Remove Company</Button>
          <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
