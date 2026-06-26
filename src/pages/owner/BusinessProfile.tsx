import { useState, useEffect } from 'react';
import { Building2, Info, Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useData, useCurrentCompany, useCurrentUser } from '../../contexts/DataContext';
import { useEmailValidation } from '../../hooks/useEmailValidation';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { validatePasswordStrength, type PasswordStrength } from '../../utils/password';
import type { Company } from '../../types';

const industries = [
  'Technology', 'Retail', 'Manufacturing', 'Healthcare', 'Education', 'Finance', 'Hospitality', 'Other',
].map((i) => ({ value: i, label: i }));

const emptyForm = {
  name: '', ownerName: '', email: '', phone: '', address: '', industry: 'Technology', ownerPassword: '',
  workerLabel: '', adminLabel: '',
};

export function BusinessProfile() {
  const {
    updateCompany, companies, createCompany, setCurrentCompany, removeCompany, currentCompanyId,
  } = useData();
  const company = useCurrentCompany();
  const user = useCurrentUser();
  const isOwner = user?.role === 'owner';

  const myCompanies = isOwner
    ? companies.filter((c) => c.ownerId === user?.id)
    : company ? [company] : [];

  const [profile, setProfile] = useState({ name: '', ownerName: '', email: '', phone: '', address: '', industry: '', workerLabel: '', adminLabel: '' });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [companyForm, setCompanyForm] = useState(emptyForm);
  const [companyFormError, setCompanyFormError] = useState('');
  const [companyFormMsg, setCompanyFormMsg] = useState('');
  const [companyStrength, setCompanyStrength] = useState<PasswordStrength>(validatePasswordStrength(''));
  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();

  useEffect(() => {
    if (company) {
      setProfile({
        name: company.name || '',
        ownerName: company.ownerName || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        industry: company.industry || '',
        workerLabel: company.workerLabel || '',
        adminLabel: company.adminLabel || '',
      });
    }
  }, [company?.id, company?.name, company?.ownerName, company?.email, company?.phone, company?.address, company?.industry, company?.workerLabel, company?.adminLabel]);

  const openNewCompany = () => {
    setCompanyForm({
      ...emptyForm,
      ownerName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setCompanyFormError('');
    setCompanyFormMsg('');
    setShowNewModal(true);
  };

  const openEditCompany = (c: Company) => {
    setEditingCompany(c);
    setCompanyForm({
      name: c.name,
      ownerName: c.ownerName,
      email: c.email,
      phone: c.phone,
      address: c.address,
      industry: c.industry,
      ownerPassword: '',
      workerLabel: c.workerLabel || '',
      adminLabel: c.adminLabel || '',
    });
    setCompanyFormError('');
    setCompanyFormMsg('');
    setShowEditModal(true);
  };

  const handleCreateCompany = async () => {
    setCompanyFormError('');
    if (!user) return;
    if (!companyForm.name.trim() || !companyForm.ownerName.trim() || !companyForm.email.trim()) {
      setCompanyFormError('Business name, owner name, and email are required');
      return;
    }
    if (!companyForm.ownerPassword.trim()) {
      setCompanyFormError('Set an owner password for this business (used to remove it later)');
      return;
    }
    if (!companyStrength.isValid) {
      setCompanyFormError('Owner password does not meet requirements');
      return;
    }
    const emailCheck = await validateEmail(companyForm.email, { checkDeliverability: true });
    if (!emailCheck.valid) {
      setCompanyFormError(emailCheck.message);
      return;
    }
    try {
      createCompany({
        name: companyForm.name.trim(),
        ownerName: companyForm.ownerName.trim(),
        email: companyForm.email.trim(),
        phone: companyForm.phone.trim(),
        address: companyForm.address.trim(),
        industry: companyForm.industry,
        ownerId: user.id,
        ownerPassword: companyForm.ownerPassword,
      });
      setCompanyFormMsg('Business created successfully!');
      setTimeout(() => {
        setShowNewModal(false);
        setCompanyFormMsg('');
      }, 1200);
    } catch (err) {
      setCompanyFormError(err instanceof Error ? err.message : 'Could not create business');
    }
  };

  const handleEditCompany = async () => {
    setCompanyFormError('');
    if (!editingCompany) return;
    if (!companyForm.name.trim() || !companyForm.ownerName.trim() || !companyForm.email.trim()) {
      setCompanyFormError('Business name, owner name, and email are required');
      return;
    }
    const emailCheck = await validateEmail(companyForm.email, { checkDeliverability: true });
    if (!emailCheck.valid) {
      setCompanyFormError(emailCheck.message);
      return;
    }
    try {
      const success = updateCompany(editingCompany.id, {
        name: companyForm.name.trim(),
        ownerName: companyForm.ownerName.trim(),
        email: companyForm.email.trim(),
        phone: companyForm.phone.trim(),
        address: companyForm.address.trim(),
        industry: companyForm.industry,
      });
      if (success) {
        setCompanyFormMsg('Business updated successfully!');
        setTimeout(() => {
          setShowEditModal(false);
          setEditingCompany(null);
          setCompanyFormMsg('');
        }, 1200);
      } else {
        setCompanyFormError('Failed to update business');
      }
    } catch (err) {
      setCompanyFormError(err instanceof Error ? err.message : 'Could not update business');
    }
  };

  const handleDeleteCompany = () => {
    if (!deleteId) return;
    const success = removeCompany(deleteId, deletePassword);
    if (success) {
      setShowDeleteModal(false);
      setDeleteId(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('Incorrect owner password');
    }
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileMsg('');
    if (!company) {
      setProfileError('No business selected. Select or create a business below.');
      return;
    }
    if (!profile.name.trim() || !profile.ownerName.trim() || !profile.email.trim()) {
      setProfileError('Business name, owner name, and email are required');
      return;
    }
    const emailCheck = await validateEmail(profile.email, { checkDeliverability: true });
    if (!emailCheck.valid) {
      setProfileError(emailCheck.message);
      return;
    }
    try {
      const success = updateCompany(company.id, {
        name: profile.name.trim(),
        ownerName: profile.ownerName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        industry: profile.industry.trim(),
        workerLabel: profile.workerLabel.trim(),
        adminLabel: profile.adminLabel.trim(),
      });
      if (success) {
        setProfileMsg('Business profile saved successfully');
        setTimeout(() => setProfileMsg(''), 3000);
      } else {
        setProfileError('Failed to save profile. Please try again.');
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save profile');
    }
  };

  const companyFormFields = (
    <div className="space-y-4">
      <Input label="Business Name" hint="Your company or store name" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
      <Input label="Owner Name" hint="Legal owner of this business" value={companyForm.ownerName} onChange={(e) => setCompanyForm({ ...companyForm, ownerName: e.target.value })} required />
      <Input
        label="Business Email"
        type="email"
        hint="Contact email for this business"
        value={companyForm.email}
        onChange={(e) => { setCompanyForm({ ...companyForm, email: e.target.value }); clearEmailError(); setCompanyFormError(''); }}
        onBlur={() => { if (companyForm.email.trim()) void validateEmail(companyForm.email, { checkDeliverability: true }); }}
        error={emailError}
        required
      />
      <Input label="Phone Number" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
      <Input label="Business Address" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
      <Select label="Industry Type" options={industries} value={companyForm.industry} onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Worker Role Label" hint="e.g. Employee, Staff" value={companyForm.workerLabel} onChange={(e) => setCompanyForm({ ...companyForm, workerLabel: e.target.value })} />
        <Input label="Admin Role Label" hint="e.g. Manager, Lead" value={companyForm.adminLabel} onChange={(e) => setCompanyForm({ ...companyForm, adminLabel: e.target.value })} />
      </div>
      {!showEditModal && (
        <>
          <Input 
            label="Owner Password" 
            type="password" 
            hint="Required to remove this business later. Not your login password." 
            value={companyForm.ownerPassword} 
            onChange={(e) => {
              setCompanyForm({ ...companyForm, ownerPassword: e.target.value });
              setCompanyStrength(validatePasswordStrength(e.target.value));
            }} 
            required 
          />
          <PasswordStrengthMeter strength={companyStrength} />
        </>
      )}
      {companyFormError && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{companyFormError}</div>}
      {companyFormMsg && <div className="p-3 rounded-xl bg-green-500/10 text-green-600 text-sm">{companyFormMsg}</div>}
    </div>
  );

  return (
    <div>
      <PageHeader title="Business Profile" subtitle="Manage your company details and multiple businesses" showBack={false} />

      <div className="space-y-6 max-w-2xl">
        {/* Manage Companies */}
        {isOwner && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">My Businesses</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">Start a new business or edit existing ones</p>
              </div>
              <Button size="sm" onClick={openNewCompany}><Plus size={16} /> Start New Business</Button>
            </div>

            <div className="space-y-3">
              {myCompanies.map((c) => (
                <div key={c.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${currentCompanyId === c.id ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)]'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text)]">{c.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{c.industry} · {c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentCompanyId === c.id && <Badge status="completed" label="Active" />}
                    {currentCompanyId !== c.id && (
                      <Button size="sm" variant="outline" onClick={() => setCurrentCompany(c.id)}>Select</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEditCompany(c)}><Pencil size={14} /> Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => { setDeleteId(c.id); setShowDeleteModal(true); }}><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
              {myCompanies.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <Building2 size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No businesses yet. Click <strong>Start New Business</strong> to create one.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Business Profile Details */}
        <Card>
          <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-[var(--primary)]/10">
            <Info size={18} className="text-[var(--primary)] mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--text-muted)]">
              <strong className="text-[var(--text)]">Company Details</strong> edits the currently active business. Used on receipts and reports.
            </p>
          </div>

          {!company ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active business. {isOwner ? 'Create or select a business above.' : 'Contact your owner.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input label="Business Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={!isOwner} />
              <Input label="Owner Name" value={profile.ownerName} onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })} disabled={!isOwner} />
              <Input
                label="Business Email"
                type="email"
                value={profile.email}
                onChange={(e) => { setProfile({ ...profile, email: e.target.value }); clearEmailError(); setProfileError(''); }}
                onBlur={() => { if (profile.email.trim()) void validateEmail(profile.email, { checkDeliverability: true }); }}
                error={emailError}
                disabled={!isOwner}
              />
              <Input label="Phone Number" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={!isOwner} />
              <Input label="Business Address" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} disabled={!isOwner} />
              <Input label="Industry Type" value={profile.industry} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} disabled={!isOwner} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Worker Role Label" hint="e.g. Employee, Staff" value={profile.workerLabel} onChange={(e) => setProfile({ ...profile, workerLabel: e.target.value })} disabled={!isOwner} />
                <Input label="Admin Role Label" hint="e.g. Manager, Lead" value={profile.adminLabel} onChange={(e) => setProfile({ ...profile, adminLabel: e.target.value })} disabled={!isOwner} />
              </div>

              {profileError && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{profileError}</div>}
              {profileMsg && <div className="p-3 rounded-xl bg-green-500/10 text-green-600 text-sm">{profileMsg}</div>}

              {isOwner && (
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => void handleSaveProfile()} disabled={checking}>
                    {checking ? 'Checking email…' : 'Save Profile'}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => company && openEditCompany(company)}><Pencil size={16} /> Full Edit</Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Modals reuse */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Start New Business" size="lg">
        {companyFormFields}
        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={() => void handleCreateCompany()} disabled={checking}>
            <Plus size={16} /> {checking ? 'Checking email…' : 'Create Business'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowNewModal(false)}>Cancel</Button>
        </div>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingCompany(null); }} title={`Edit — ${editingCompany?.name || 'Business'}`} size="lg">
        {companyFormFields}
        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={() => void handleEditCompany()} disabled={checking}>
            <CheckCircle size={16} /> {checking ? 'Checking email…' : 'Save Changes'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { setShowEditModal(false); setEditingCompany(null); }}>Cancel</Button>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteId(null); setDeletePassword(''); setDeleteError(''); }} title="Remove Business">
        <p className="text-sm text-[var(--text-muted)] mb-4">Enter the owner password for this business to confirm removal. All data will be deleted.</p>
        {deleteError && <p className="text-sm text-red-500 mb-3">{deleteError}</p>}
        <Input label="Owner Password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
        <div className="flex gap-3 mt-4">
          <Button variant="danger" className="flex-1" onClick={handleDeleteCompany}>Remove Business</Button>
          <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
