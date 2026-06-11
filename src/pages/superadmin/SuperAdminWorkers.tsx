import { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';

export function SuperAdminWorkers() {
  const { workers, companies, tasks } = useData();
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');

  const filtered = workers.filter((w) => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.email.toLowerCase().includes(search.toLowerCase());
    const matchCompany = companyFilter === 'all' || w.companyId === companyFilter;
    return matchSearch && matchCompany;
  });

  const getCompanyName = (id: string) => companies.find((c) => c.id === id)?.name || 'Unknown';

  return (
    <div>
      <PageHeader title="All Workers" subtitle={`${workers.length} workers across all companies`} showBack={false} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workers..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--primary)]" />
        </div>
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none">
          <option value="all">All Companies</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--border)]/20">
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Name</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Company</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Department</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Email</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Tasks</th>
                <th className="text-left p-4 font-medium text-[var(--text-muted)]">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((worker) => (
                <tr key={worker.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/10">
                  <td className="p-4 font-medium">{worker.name}<br /><span className="text-xs text-[var(--text-muted)]">{worker.designation}</span></td>
                  <td className="p-4 text-[var(--text-muted)]">{getCompanyName(worker.companyId)}</td>
                  <td className="p-4">{worker.department}</td>
                  <td className="p-4 text-[var(--text-muted)]">{worker.email}</td>
                  <td className="p-4">{tasks.filter((t) => t.workerId === worker.id).length}</td>
                  <td className="p-4">
                    <Badge status={worker.attendanceStatus === 'present' ? 'completed' : 'pending'} label={worker.attendanceStatus.replace('_', ' ')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-12 text-[var(--text-muted)]">No workers found</p>}
        </div>
      </div>
    </div>
  );
}
