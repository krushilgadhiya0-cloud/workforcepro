import { NotificationBell } from '../notifications/NotificationBell';
import { useCurrentUser, useCurrentCompany } from '../../contexts/DataContext';

export function TopBar() {
  const user = useCurrentUser();
  const company = useCurrentCompany();

  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
      <div>
        <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role} account</p>
        <p className="text-sm font-medium text-[var(--text)]">
          {company?.name || user?.name || 'WorkForce Pro'}
        </p>
      </div>
      <NotificationBell />
    </div>
  );
}
