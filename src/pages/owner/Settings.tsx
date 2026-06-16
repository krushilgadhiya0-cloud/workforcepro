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
import { useTheme } from '../../contexts/ThemeContext';
import { useEmailValidation } from '../../hooks/useEmailValidation';
import type { Company } from '../../types';

const industries = [
  'Technology', 'Retail', 'Manufacturing', 'Healthcare', 'Education', 'Finance', 'Hospitality', 'Other',
].map((i) => ({ value: i, label: i }));

const emptyForm = {
  name: '', ownerName: '', email: '', phone: '', address: '', industry: 'Technology', ownerPassword: '',
};

export function Settings() {
  const {
    settings, updateSettings, changePassword, updateCompany,
    companies, createCompany, setCurrentCompany, removeCompany, currentCompanyId,
  } = useData();
  const company = useCurrentCompany();
  const user = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const isOwner = user?.role === 'owner';

  const myCompanies = isOwner
    ? companies.filter((c) => c.ownerId === user?.id)
    : company ? [company] : [];

  const [profile, setProfile] = useState({ name: '', ownerName: '', email: '', phone: '', address: '', industry: '' });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
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
      });
    }
  }, [company?.id, company?.name, company?.ownerName, company?.email, company?.phone, company?.address, company?.industry]);

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

  const handleChangePassword = async () => {
    if (!user) return;
    setPasswordMsg('');
    if (!passwords.old || !passwords.new) {
      setPasswordMsg('Please fill in all password fields');
      return;
    }
    if (passwords.new.length < 6) {
      setPasswordMsg('New password must be at least 6 characters');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordMsg('Passwords do not match');
      return;
    }
    try {
      const success = await changePassword(user.id, passwords.old, passwords.new);
      setPasswordMsg(success ? 'Password updated successfully' : 'Incorrect current password');
      if (success) setPasswords({ old: '', new: '', confirm: '' });
    } catch (err) {
      setPasswordMsg('Failed to update password. Cloud sync issue.');
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
      {!showEditModal && (
        <Input label="Owner Password" type="password" hint="Required to remove this business later. Not your login password." value={companyForm.ownerPassword} onChange={(e) => setCompanyForm({ ...companyForm, ownerPassword: e.target.value })} required />
      )}
      {companyFormError && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{companyFormError}</div>}
      {companyFormMsg && <div className="p-3 rounded-xl bg-green-500/10 text-green-600 text-sm">{companyFormMsg}</div>}
    </div>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage companies, profile, and preferences" showBack={false} />

      <div className="space-y-6 max-w-2xl">
        {/* Manage Companies */}
        {isOwner && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">Manage Companies</h3>
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

        {/* Business Profile - quick edit for active company */}
        <Card>
          <div className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-[var(--primary)]/10">
            <Info size={18} className="text-[var(--primary)] mt-0.5 shrink-0" />
            <p className="text-xs text-[var(--text-muted)]">
              <strong className="text-[var(--text)]">Business Profile</strong> edits the currently active company. Used on receipts, reports, and dashboards.
              {isOwner ? ' Use Manage Companies above to switch, add, or edit businesses.' : ' View only for admins.'}
            </p>
          </div>

          {!company ? (
            <div className="text-center py-8 text-[var(--text-muted)]">
              <Building2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active business. {isOwner ? 'Create or select a business above.' : 'Contact your owner.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input label="Business Name" hint="Shown on dashboard, reports, and receipts." value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} disabled={!isOwner} />
              <Input label="Owner Name" hint="Displayed on company cards and documents." value={profile.ownerName} onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })} disabled={!isOwner} />
              <Input
                label="Business Email"
                hint="Contact email for notifications."
                type="email"
                value={profile.email}
                onChange={(e) => { setProfile({ ...profile, email: e.target.value }); clearEmailError(); setProfileError(''); }}
                onBlur={() => { if (profile.email.trim()) void validateEmail(profile.email, { checkDeliverability: true }); }}
                error={emailError}
                disabled={!isOwner}
              />
              <Input label="Phone Number" hint="Contact number for workers and admins." value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={!isOwner} />
              <Input label="Business Address" hint="Shown on reports and company profile." value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} disabled={!isOwner} />
              <Input label="Industry Type" hint="Used for dashboard categorization." value={profile.industry} onChange={(e) => setProfile({ ...profile, industry: e.target.value })} disabled={!isOwner} />

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

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Change Password</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Update your login password. Does not change worker or admin passwords.</p>
          <div className="space-y-4">
            <Input label="Current Password" type="password" value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} />
            <Input label="New Password" type="password" hint="Minimum 6 characters" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
            <Input label="Confirm Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
            {passwordMsg && <p className={`text-sm ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{passwordMsg}</p>}
            <Button onClick={handleChangePassword}>Update Password</Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Theme Settings</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Saved automatically across all pages.</p>
          <div className="flex gap-3">
            <button onClick={() => setTheme('light')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'light' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)]'}`}>
              <span className="text-2xl">☀️</span>
              <p className="text-sm font-medium mt-2">Light Mode</p>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)]'}`}>
              <span className="text-2xl">🌙</span>
              <p className="text-sm font-medium mt-2">Dark Mode</p>
            </button>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Notification Settings</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">Saved automatically.</p>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <span className="text-sm text-[var(--text)] block">Email Notifications</span>
                <span className="text-xs text-[var(--text-muted)]">Task, leave, and payment alerts by email (demo)</span>
              </div>
              <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => updateSettings({ emailNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)] shrink-0" />
            </label>
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <span className="text-sm text-[var(--text)] block">In-App Notifications</span>
                <span className="text-xs text-[var(--text-muted)]">Updates in notification bell and sidebar</span>
              </div>
              <input type="checkbox" checked={settings.pushNotifications} onChange={(e) => updateSettings({ pushNotifications: e.target.checked })} className="w-5 h-5 accent-[var(--primary)] shrink-0" />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Manage Subscription</h3>
          <p className="text-xs text-[var(--text-muted)] mb-3">Platform plan for active business.</p>
          <p className="text-sm text-[var(--text-muted)]">
            Current plan: <strong className="text-[var(--text)]">{company?.subscription ? `${company.subscription} (₹${company.subscription === 'monthly' ? '799/mo' : '4,999/yr'})` : 'None'}</strong>
          </p>
          {company?.subscriptionDate && (
            <p className="text-xs text-[var(--text-muted)] mt-1">Subscribed: {new Date(company.subscriptionDate).toLocaleDateString()}</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Account Info</h3>
          <div className="space-y-2 text-sm mt-3">
            <p><span className="text-[var(--text-muted)]">Login Email:</span> <strong>{user?.email}</strong></p>
            <p><span className="text-[var(--text-muted)]">Role:</span> <strong className="capitalize">{user?.role}</strong></p>
            <p><span className="text-[var(--text-muted)]">Active Business:</span> <strong>{company?.name || 'None'}</strong></p>
            {isOwner && <p><span className="text-[var(--text-muted)]">Total Businesses:</span> <strong>{myCompanies.length}</strong></p>}
          </div>
        </Card>
      </div>

      {/* New Company Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Start New Business" size="lg">
        {companyFormFields}
        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={() => void handleCreateCompany()} disabled={checking}>
            <Plus size={16} /> {checking ? 'Checking email…' : 'Create Business'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setShowNewModal(false)}>Cancel</Button>
        </div>
      </Modal>

      {/* Edit Company Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingCompany(null); }} title={`Edit — ${editingCompany?.name || 'Business'}`} size="lg">
        {companyFormFields}
        <div className="flex gap-3 mt-4">
          <Button className="flex-1" onClick={() => void handleEditCompany()} disabled={checking}>
            <CheckCircle size={16} /> {checking ? 'Checking email…' : 'Save Changes'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => { setShowEditModal(false); setEditingCompany(null); }}>Cancel</Button>
        </div>
      </Modal>

      {/* Delete Company Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteId(null); setDeletePassword(''); setDeleteError(''); }} title="Remove Business">
        <p className="text-sm text-[var(--text-muted)] mb-4">Enter the owner password for this business to confirm removal. All workers, tasks, and payments will be deleted.</p>
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
