import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';

export function SuperAdminUsers() {
  const { users, companies } = useData();

  const platformUsers = users.filter((u) => u.role !== 'superadmin');
  const getCompanyName = (companyId?: string) => companyId ? companies.find((c) => c.id === companyId)?.name || '—' : '—';

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { owner: 'high', admin: 'in_progress', worker: 'low' };
    return map[role] || 'pending';
  };

  return (
    <div>
      <PageHeader title="All Users" subtitle={`${platformUsers.length} registered users`} showBack={false} />

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
              {platformUsers.map((user) => (
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
          {platformUsers.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No users yet</p>}
        </div>
      </div>
    </div>
  );
}
