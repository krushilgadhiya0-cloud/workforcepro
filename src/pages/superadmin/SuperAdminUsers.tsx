import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';

export function SuperAdminUsers() {
  const { users, companies } = useData();
  const [search, setSearch] = useState('');

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

  return (
    <div>
      <PageHeader title="All Users" subtitle={`${filtered.length} users matched`} showBack={false} />

      <div className="relative mb-6">
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
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Role</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Company</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/10">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-[var(--text-muted)]">{user.email}</td>
                  <td className="p-4"><Badge status={roleBadge(user.role)} label={user.role} /></td>
                  <td className="p-4 text-[var(--text-muted)]">{getCompanyName(user.companyId)}</td>
                  <td className="p-4 text-[var(--text-muted)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No users found</p>}
        </div>
      </div>
    </div>
  );
}
