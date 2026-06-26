import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Shield, IndianRupee, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { useData, useCurrentCompany } from '../../contexts/DataContext';
import { useEmailValidation } from '../../hooks/useEmailValidation';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { validatePasswordStrength, type PasswordStrength } from '../../utils/password';
import type { Admin, AdminRole } from '../../types';

const roleOptions = [
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'finance', label: 'Finance' },
];

export function Admins() {
  const { admins, addAdmin, updateAdmin, deleteAdmin, updateMonthlyRevenue } = useData();
  const company = useCurrentCompany();
  const { checkSubscription } = useSubscriptionGuard();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'manager' as AdminRole, password: 'admin123' });
  const [credentials, setCredentials] = useState<{ email: string; password: string; name: string } | null>(null);
  const [formError, setFormError] = useState('');
  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();
  const [passStrength, setPassStrength] = useState<PasswordStrength>(validatePasswordStrength('admin123'));
  const [monthlyRevenue, setMonthlyRevenue] = useState(String(company?.monthlyRevenue || ''));
  const [revenueSaved, setRevenueSaved] = useState(false);

  const companyAdmins = admins.filter((a) => a.companyId === company?.id);

  const getLabel = (singular = false) => {
    if (singular) return company?.adminLabel || 'Admin';
    return company?.adminLabel ? `${company.adminLabel}s` : 'Admins';
  };

  useEffect(() => {
    setMonthlyRevenue(String(company?.monthlyRevenue || ''));
  }, [company?.id, company?.monthlyRevenue]);

  const openAdd = () => {
    if (!checkSubscription()) return;
    setEditing(null);
    setForm({ name: '', email: '', phone: '', role: 'manager', password: 'admin123' });
    setPassStrength(validatePasswordStrength('admin123'));
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (admin: Admin) => {
    setEditing(admin);
    setForm({ name: admin.name, email: admin.email, phone: admin.phone, role: admin.role, password: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!company) return;
    if (!form.name || !form.email) {
      setFormError('Name and email are required');
      return;
    }
    const emailCheck = await validateEmail(form.email, { checkDeliverability: true });
    if (!emailCheck.valid) {
      setFormError(emailCheck.message);
      return;
    }
    try {
      if (editing) {
        const ok = updateAdmin(editing.id, { name: form.name, email: form.email, phone: form.phone, role: form.role });
        if (!ok) {
          setFormError('Email already in use by another account');
          return;
        }
      } else {
        if (!passStrength.isValid) {
          setFormError('Password does not meet requirements');
          return;
        }
        const admin = addAdmin({ ...form, companyId: company.id });
        if (!admin) {
          setFormError('Email already registered. This admin may already have an account.');
          return;
        }
        setCredentials({ email: admin.email, password: form.password, name: admin.name });
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save admin');
    }
  };

  const handleSaveRevenue = () => {
    if (!checkSubscription()) return;
    if (!company) return;
    updateMonthlyRevenue(company.id, Number(monthlyRevenue) || 0);
    setRevenueSaved(true);
    setTimeout(() => setRevenueSaved(false), 2500);
  };

  return (
    <div>
      <PageHeader 
        title={`${getLabel(true)} Management`} 
        subtitle={`Manage ${getLabel().toLowerCase()}, monthly revenue, and auto-registered accounts`} 
        action={<Button onClick={openAdd}><Plus size={18} /> Add {getLabel(true)}</Button>} 
        showBack={false} 
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee size={20} className="text-[var(--accent)]" />
              <h3 className="font-semibold text-[var(--text)]">Monthly Revenue</h3>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-3">Enter your business monthly revenue. Visible on the dashboard.</p>
            <Input
              label="Revenue Amount (₹)"
              type="number"
              min="0"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              placeholder="e.g. 150000"
            />
            {company?.monthlyRevenueUpdatedAt && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Last updated: {new Date(company.monthlyRevenueUpdatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button onClick={handleSaveRevenue} className="sm:mb-1">
            {revenueSaved ? <><CheckCircle size={16} /> Saved</> : 'Save Revenue'}
          </Button>
        </div>
      </Card>

      <div className="mb-4 p-3 rounded-xl bg-[var(--primary)]/10 text-sm text-[var(--text-muted)]">
        <strong className="text-[var(--text)]">Auto-registration:</strong> When you add an admin or worker, a login account is created automatically. Share the email and password with them — they can sign in immediately. Workers cannot self-register.
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Name</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Email</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Phone</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Role</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Status</th>
                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyAdmins.map((admin) => (
                <tr key={admin.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-[var(--primary)]" />
                      {admin.name}
                    </div>
                  </td>
                  <td className="p-4 text-[var(--text-muted)]">{admin.email}</td>
                  <td className="p-4 text-[var(--text-muted)]">{admin.phone}</td>
                  <td className="p-4"><Badge status="in_progress" label={admin.role} /></td>
                  <td className="p-4"><Badge status="completed" label="Registered" /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(admin)} className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 cursor-pointer"><Pencil size={16} /></button>
                      <button onClick={() => deleteAdmin(admin.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {companyAdmins.length === 0 && (
            <p className="text-center py-12 text-[var(--text-muted)]">No admins added yet</p>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Admin' : 'Add Admin'}>
        <div className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{formError}</div>}
          {!editing && (
            <div className="p-3 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
              Login account will be auto-registered. Admin can sign in immediately after creation.
            </div>
          )}
          <Input label="Admin Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); clearEmailError(); setFormError(''); }}
            onBlur={() => { if (form.email.trim()) void validateEmail(form.email, { checkDeliverability: true }); }}
            error={emailError}
          />
          <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Role" options={roleOptions} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })} />
          {!editing && (
            <>
              <Input 
                label="Login Password" 
                type="text" 
                value={form.password} 
                onChange={(e) => { 
                  setForm({ ...form, password: e.target.value });
                  setPassStrength(validatePasswordStrength(e.target.value));
                }} 
              />
              <PasswordStrengthMeter strength={passStrength} />
            </>
          )}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => void handleSubmit()} disabled={checking}>
              {checking ? 'Checking email…' : editing ? 'Update' : 'Add Admin'}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!credentials} onClose={() => setCredentials(null)} title="Admin Account Auto-Registered">
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle size={16} className="inline mr-1" />
            <strong>{credentials?.name}</strong> can login now with these credentials:
          </div>
          <div className="p-4 rounded-xl bg-[var(--border)]/20 space-y-2">
            <p className="text-sm"><strong>Email:</strong> {credentials?.email}</p>
            <p className="text-sm"><strong>Password:</strong> {credentials?.password}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Share these credentials securely. The admin does not need to register — account is already active.</p>
          <Button className="w-full" onClick={() => setCredentials(null)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
