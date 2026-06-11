import { useState } from 'react';
import { Activity, Search, LogIn, LogOut, UserPlus, Building2, Users, Shield, CreditCard } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useData } from '../../contexts/DataContext';
import type { ActivityType } from '../../types';

const typeLabels: Record<ActivityType, string> = {
  user_registered: 'Registration',
  user_login: 'Login',
  user_logout: 'Logout',
  company_created: 'New Business',
  worker_added: 'Worker Added',
  admin_added: 'Admin Added',
  subscription_started: 'Subscription',
};

const typeIcons: Record<ActivityType, typeof Activity> = {
  user_registered: UserPlus,
  user_login: LogIn,
  user_logout: LogOut,
  company_created: Building2,
  worker_added: Users,
  admin_added: Shield,
  subscription_started: CreditCard,
};

const typeBadge: Record<ActivityType, string> = {
  user_registered: 'in_progress',
  user_login: 'paid',
  user_logout: 'pending',
  company_created: 'high',
  worker_added: 'low',
  admin_added: 'in_progress',
  subscription_started: 'paid',
};

export function SuperAdminActivity() {
  const { activities } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');

  const filtered = activities.filter((a) => {
    const matchFilter = filter === 'all' || a.type === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.userName.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      a.userRole.toLowerCase().includes(q) ||
      (a.companyName?.toLowerCase().includes(q) ?? false);
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <PageHeader
        title="User Activity"
        subtitle="Live feed of registrations, logins, and platform events across all devices"
        showBack={false}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, or message..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ActivityType | 'all')}
          className="px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm"
        >
          <option value="all">All events</option>
          {(Object.keys(typeLabels) as ActivityType[]).map((type) => (
            <option key={type} value={type}>{typeLabels[type]}</option>
          ))}
        </select>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          {filtered.map((activity) => {
            const Icon = typeIcons[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-[var(--border)]/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-[var(--primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-[var(--text)]">{activity.userName}</span>
                    <Badge status={typeBadge[activity.type]} label={activity.userRole} />
                    <Badge status={typeBadge[activity.type]} label={typeLabels[activity.type]} />
                  </div>
                  <p className="text-sm text-[var(--text-muted)]">{activity.message}</p>
                  {activity.companyName && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">Company: {activity.companyName}</p>
                  )}
                </div>
                <time className="text-xs text-[var(--text-muted)] whitespace-nowrap shrink-0">
                  {new Date(activity.createdAt).toLocaleString()}
                </time>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-16 text-[var(--text-muted)]">
            <Activity size={40} className="mx-auto mb-3 opacity-30" />
            No activity recorded yet
          </p>
        )}
      </div>
    </div>
  );
}
