import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, CheckCircle, Eye, EyeOff, ShieldCheck, Key } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { Badge } from '../../components/ui/Badge';
import { useData, useCurrentCompany } from '../../contexts/DataContext';
import { useEmailValidation } from '../../hooks/useEmailValidation';
import { useSubscriptionGuard } from '../../hooks/useSubscriptionGuard';
import { validatePasswordStrength, type PasswordStrength } from '../../utils/password';
import type { Worker } from '../../types';

export function Workers() {
  const { users, workers, tasks, payments, addWorker, updateWorker, deleteWorker, verifyHostPassword } = useData();
  const company = useCurrentCompany();
  const { checkSubscription } = useSubscriptionGuard();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', joiningDate: '', password: 'worker123' });
  const [credentials, setCredentials] = useState<{ email: string; password: string; name: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showHostPassModal, setShowHostPassModal] = useState(false);
  const [hostPass, setHostPass] = useState('');
  const [hostPassError, setHostPassError] = useState('');
  const [passStrength, setPassStrength] = useState<PasswordStrength>(validatePasswordStrength('worker123'));
  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();

  const companyWorkers = workers.filter((w) => w.companyId === company?.id);

  const filtered = companyWorkers.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) || w.email.toLowerCase().includes(search.toLowerCase()),
  );

  const getTaskCount = (workerId: string) => tasks.filter((t) => t.workerId === workerId).length;
  const getPaymentStatus = (workerId: string) => {
    const wp = payments.filter((p) => p.workerId === workerId);
    if (wp.some((p) => p.status === 'due')) return 'due';
    if (wp.some((p) => p.status === 'pending')) return 'pending';
    return 'paid';
  };

  const getLabel = (singular = false) => {
    if (singular) return company?.workerLabel || 'Worker';
    return company?.workerLabel ? `${company.workerLabel}s` : 'Workers';
  };

  const openAdd = () => {
    if (!checkSubscription()) return;
    setEditing(null);
    setForm({ name: '', email: '', phone: '', joiningDate: new Date().toISOString().split('T')[0], password: 'worker123' });
    setPassStrength(validatePasswordStrength('worker123'));
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (worker: Worker) => {
    setEditing(worker);
    setForm({ name: worker.name, email: worker.email, phone: worker.phone, joiningDate: worker.joiningDate, password: '' });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!company) {
      setFormError('No business found. Please create a business from the home page first.');
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Name and email are required');
      return;
    }
    if (!form.joiningDate) {
      setFormError('Joining date is required');
      return;
    }
    if (!editing && !form.password.trim()) {
      setFormError('Login password is required');
      return;
    }
    const emailCheck = await validateEmail(form.email, { checkDeliverability: true });
    if (!emailCheck.valid) {
      setFormError(emailCheck.message);
      return;
    }
    try {
      if (!editing && !passStrength.isValid) {
        setFormError('Password does not meet requirements');
        return;
      }
      if (editing) {
        const ok = updateWorker(editing.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone, joiningDate: form.joiningDate });
        if (!ok) {
          setFormError('Email already in use by another account');
          return;
        }
        setShowModal(false);
        return;
      }
      const worker = addWorker({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        joiningDate: form.joiningDate,
        password: form.password,
        companyId: company.id,
        department: '',
        designation: '',
      });
      if (!worker) {
        setFormError('Email already registered. Use a different email for this worker.');
        return;
      }
      setShowModal(false);
      setCredentials({ email: worker.email, password: form.password, name: worker.name });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save worker');
    }
  };

  const handleReveal = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyHostPassword(hostPass)) {
      setRevealed(true);
      setShowHostPassModal(false);
      setHostPass('');
      setHostPassError('');
    } else {
      setHostPassError('Invalid Host Password');
    }
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteWorker(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={`${getLabel(true)} Management`}
        subtitle={`${companyWorkers.length} ${getLabel().toLowerCase()} — accounts auto-registered on add`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => revealed ? setRevealed(false) : setShowHostPassModal(true)}
              className="gap-2"
            >
              {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
              {revealed ? 'Hide Passwords' : 'Reveal Passwords'}
            </Button>
            <Button onClick={openAdd}><Plus size={18} /> Add {getLabel(true)}</Button>
          </div>
        }
        showBack={false}
      />

      {!company && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-600 text-sm">
          No business linked to your account. Go to the home page and click <strong>Start Business</strong> to set up your company first.
        </div>
      )}

      <div className="mb-4 p-3 rounded-xl bg-[var(--primary)]/10 text-sm text-[var(--text-muted)]">
        <strong className="text-[var(--text)]">Note:</strong> Workers cannot self-register. Adding a worker here automatically creates their login account.
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workers..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--primary)]" />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Name</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Email</th>
                {revealed && <th className="text-left p-4 font-medium text-[var(--text-muted)]">Password</th>}
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Phone</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Tasks</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Payment</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Attendance</th>
                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker) => (
                <tr key={worker.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/10">
                  <td className="p-4 font-medium">{worker.name}</td>
                  <td className="p-4 text-[var(--text-muted)]">{worker.email}</td>
                  {revealed && <td className="p-4"><code className="bg-[var(--border)]/30 px-2 py-1 rounded text-xs">{users.find(u => u.id === worker.userId)?.password || '—'}</code></td>}
                  <td className="p-4 text-[var(--text-muted)]">{worker.phone}</td>
                  <td className="p-4">{getTaskCount(worker.id)}</td>
                  <td className="p-4"><Badge status={getPaymentStatus(worker.id)} /></td>
                  <td className="p-4"><Badge status={worker.attendanceStatus === 'present' ? 'completed' : worker.attendanceStatus === 'on_leave' ? 'pending' : 'rejected'} label={worker.attendanceStatus.replace('_', ' ')} /></td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(worker)} className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 cursor-pointer"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteTarget(worker)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer" title="Remove Worker"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No workers found</p>}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError(''); }} title={editing ? 'Edit Worker' : 'Add Worker'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{formError}</div>}
          {!editing && (
            <div className="p-3 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
              Login account will be auto-registered. Worker can sign in with the email and password below.
            </div>
          )}
          <Input label="Worker Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); clearEmailError(); setFormError(''); }}
            onBlur={() => { if (form.email.trim()) void validateEmail(form.email, { checkDeliverability: true }); }}
            error={emailError}
            required
          />
          <Input label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} required />
          {!editing && (
            <>
              <Input 
                label="Login Password" 
                value={form.password} 
                onChange={(e) => { 
                  setForm({ ...form, password: e.target.value });
                  setPassStrength(validatePasswordStrength(e.target.value));
                }} 
                required 
              />
              <PasswordStrengthMeter strength={passStrength} />
            </>
          )}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={checking}>
              {checking ? 'Checking email…' : editing ? 'Update' : 'Add Worker'}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowModal(false); setFormError(''); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!credentials} onClose={() => setCredentials(null)} title="Worker Account Auto-Registered">
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle size={16} className="inline mr-1" />
            <strong>{credentials?.name}</strong> can login now with these credentials:
          </div>
          <div className="p-4 rounded-xl bg-[var(--border)]/20 space-y-2">
            <p className="text-sm"><strong>Email:</strong> {credentials?.email}</p>
            <p className="text-sm"><strong>Password:</strong> {credentials?.password}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Workers cannot register themselves. Share these credentials so they can access their dashboard.</p>
          <Button className="w-full" onClick={() => setCredentials(null)}>Done</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Worker">
        <div className="p-4 text-center">
          <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
          <p className="font-bold text-lg mb-2">Remove {deleteTarget?.name}?</p>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            This will permanently remove the worker account for <strong>{deleteTarget?.email}</strong>. 
            All associated task history and records will also be deleted. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Remove Worker</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showHostPassModal} onClose={() => { setShowHostPassModal(false); setHostPass(''); setHostPassError(''); }} title="Verify Host Access">
        <form onSubmit={handleReveal} className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 mb-2">
            <ShieldCheck className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Viewing worker passwords requires the <strong>Host Security Password</strong> (Super Admin Password).
            </p>
          </div>
          <div className="relative">
            <Key size={18} className="absolute left-3 top-[38px] text-[var(--text-muted)]" />
            <Input
              label="Host Password"
              type="password"
              value={hostPass}
              onChange={(e) => { setHostPass(e.target.value); setHostPassError(''); }}
              placeholder="Enter host password..."
              className="pl-10"
              autoFocus
              required
            />
          </div>
          {hostPassError && <p className="text-xs text-red-500 font-medium">{hostPassError}</p>}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1">Verify & Reveal</Button>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowHostPassModal(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
