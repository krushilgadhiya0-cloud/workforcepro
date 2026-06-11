import { useState } from 'react';
import { Building2, Trash2, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useData, useCurrentUser } from '../../contexts/DataContext';

export function Companies() {
  const { companies, removeCompany, setCurrentCompany, currentCompanyId } = useData();
  const user = useCurrentUser();
  const isOwner = user?.role === 'owner';
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const myCompanies = isOwner
    ? companies.filter((c) => c.ownerId === user?.id)
    : user?.companyId
      ? companies.filter((c) => c.id === user.companyId)
      : [];

  const handleDelete = () => {
    if (!deleteId) return;
    const success = removeCompany(deleteId, password);
    if (success) {
      setDeleteId(null);
      setPassword('');
      setError('');
    } else {
      setError('Incorrect owner password');
    }
  };

  return (
    <div>
      <PageHeader
        title="All Businesses"
        subtitle={isOwner ? `${myCompanies.length} business${myCompanies.length !== 1 ? 'es' : ''} registered` : 'Your assigned business'}
        showBack={false}
      />

      <div className="grid md:grid-cols-2 gap-6">
        {myCompanies.map((company) => (
          <Card key={company.id} hover className={`${currentCompanyId === company.id ? 'ring-2 ring-[var(--primary)]' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
                  <Building2 size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text)]">{company.name}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{company.industry}</p>
                </div>
              </div>
              {company.subscription ? <Badge status="completed" label={`${company.subscription} plan`} /> : <Badge status="due" label="No plan" />}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Briefcase size={14} /> Owner: {company.ownerName}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Mail size={14} /> {company.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Phone size={14} /> {company.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <MapPin size={14} /> {company.address || 'No address'}
              </div>
              {company.monthlyRevenue > 0 && (
                <div className="text-sm text-[var(--text-muted)]">
                  Monthly Revenue: <strong className="text-[var(--text)]">₹{company.monthlyRevenue.toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {isOwner && myCompanies.length > 1 && (
                <Button size="sm" variant={currentCompanyId === company.id ? 'primary' : 'outline'} className="flex-1" onClick={() => setCurrentCompany(company.id)}>
                  {currentCompanyId === company.id ? 'Active' : 'Select'}
                </Button>
              )}
              {isOwner && (
                <Button size="sm" variant="danger" onClick={() => setDeleteId(company.id)}>
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </Card>
        ))}

        {myCompanies.length === 0 && (
          <div className="col-span-2 text-center py-16 text-[var(--text-muted)]">
            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
            <p>{isOwner ? 'No companies yet. Start by creating a business from the home page.' : 'No business assigned to your admin account.'}</p>
          </div>
        )}
      </div>

      {isOwner && (
        <Modal isOpen={!!deleteId} onClose={() => { setDeleteId(null); setPassword(''); setError(''); }} title="Remove Company">
          <p className="text-sm text-[var(--text-muted)] mb-4">Enter your owner password to confirm removal. This action cannot be undone.</p>
          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
          <Input label="Owner Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex gap-3 mt-4">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Remove Company</Button>
            <Button variant="outline" className="flex-1" onClick={() => { setDeleteId(null); setPassword(''); }}>Cancel</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
