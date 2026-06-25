import { useState } from 'react';
import { Search, Trash2, Eye, EyeOff, ShieldCheck, Key, CreditCard } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useData } from '../../contexts/DataContext';
import type { User } from '../../types';

export function SuperAdminUsers() {
  const { users, companies, workers, payments, removeUserAsSuperAdmin, verifyHostPassword } = useData();
  const [search, setSearch] = useState('');
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<User | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [showHostPassModal, setShowHostPassModal] = useState(false);
  const [hostPass, setHostPass] = useState('');
  const [hostPassError, setHostPassError] = useState('');

  const filtered = users.filter((u) => {
    if (u.role === 'superadmin') return false;
    const match = u.name.toLowerCase().includes(search.toLowerCase()) ||
                  u.email.toLowerCase().includes(search.toLowerCase()) ||
                  u.role.toLowerCase().includes(search.toLowerCase());
    return match;
  });

  const getCompanyName = (companyId?: string) => companyId ? companies.find((c) => c.id === companyId)?.name || '—' : '—';

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { owner: 'high', admin: 'in_progress', worker: 'low' };
    return map[role] || 'pending';
  };

  const removeWarning = (user: User) => {
    if (user.role === 'owner') {
      const owned = companies.filter((c) => c.ownerId === user.id);
      if (owned.length > 0) {
        return `This will permanently remove ${user.name}, delete their company data (${owned.map((c) => c.name).join(', ')}), and REMOVE ALL company staff. This cannot be undone.`;
      }
    }
    return `This will permanently remove ${user.name} (${user.email}) and their records. This cannot be undone.`;
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    const ok = removeUserAsSuperAdmin(removeTarget.id);
    if (ok) {
      setStatusMsg(`User ${removeTarget.name} removed successfully`);
      setTimeout(() => setStatusMsg(''), 3000);
    }
    setRemoveTarget(null);
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

  return (
    <div>
      <PageHeader
        title="All Users"
        subtitle={`${filtered.length} users matched`}
        showBack={false}
        action={
          <Button
            variant={revealed ? 'outline' : 'primary'}
            onClick={() => revealed ? setRevealed(false) : setShowHostPassModal(true)}
            className="gap-2"
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
            {revealed ? 'Hide Passwords' : 'Reveal Passwords'}
          </Button>
        }
      />

      <div className="relative mb-6">
        {statusMsg && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 text-green-600 text-sm animate-in fade-in slide-in-from-top-4">
            {statusMsg}
          </div>
        )}
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or role..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--primary)] transition-all"
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Name</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Email</th>
                {revealed && <th className="text-left p-4 font-medium text-[var(--text-muted)]">Password</th>}
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Role</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Company</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Joined</th>
                <th className="text-right p-4 font-medium text-[var(--text-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/10">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-[var(--text-muted)]">{user.email}</td>
                  {revealed && <td className="p-4"><code className="bg-[var(--border)]/30 px-2 py-1 rounded text-xs">{user.password}</code></td>}
                  <td className="p-4"><Badge status={roleBadge(user.role)} label={user.role} /></td>
                  <td className="p-4 text-[var(--text-muted)]">{getCompanyName(user.companyId)}</td>
                  <td className="p-4 text-[var(--text-muted)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setPaymentTarget(user)}
                      className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 cursor-pointer mr-1"
                      title="View payments"
                    >
                      <CreditCard size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(user)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 cursor-pointer"
                      title="Remove user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No users found</p>}
        </div>
      </div>

      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove User">
        <p className="text-sm text-[var(--text-muted)] mb-4">
          {removeTarget ? removeWarning(removeTarget) : ''}
        </p>
        <div className="flex gap-3">
          <Button variant="danger" className="flex-1" onClick={handleRemove}>Remove User</Button>
          <Button variant="outline" className="flex-1" onClick={() => setRemoveTarget(null)}>Cancel</Button>
        </div>
      </Modal>

      <Modal isOpen={!!paymentTarget} onClose={() => setPaymentTarget(null)} title={`Payments — ${paymentTarget?.name}`} size="lg">
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-left">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {payments
                  .filter(p => p.workerId === workers.find(w => w.userId === paymentTarget?.id)?.id || (paymentTarget?.role === 'owner' && p.companyId === paymentTarget.companyId))
                  .map(p => (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="p-3">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-medium text-[var(--text)]">₹{p.amount.toLocaleString()}</td>
                      <td className="p-3"><Badge status={p.status} label={p.status} /></td>
                      <td className="p-3 text-xs text-[var(--text-muted)]">{p.transactionId || 'Manual/Pending'}</td>
                    </tr>
                  ))}
                {payments.filter(p => p.workerId === workers.find(w => w.userId === paymentTarget?.id)?.id || (paymentTarget?.role === 'owner' && p.companyId === paymentTarget.companyId)).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">No payments found for this user.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setPaymentTarget(null)}>Close</Button>
        </div>
      </Modal>

      <Modal isOpen={showHostPassModal} onClose={() => { setShowHostPassModal(false); setHostPass(''); setHostPassError(''); }} title="Verify Host Access">
        <form onSubmit={handleReveal} className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3 mb-2">
            <ShieldCheck className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Viewing passwords is restricted. Please enter the <strong>Host Security Password</strong> (Super Admin Password) to reveal all user credentials.
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
