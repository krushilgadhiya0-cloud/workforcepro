import { useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { PageHeader } from '../layout/PageHeader';
import { Button } from '../ui/Button';
import { useData, useCurrentUser } from '../../contexts/DataContext';

const typeColors: Record<string, string> = {
  task: 'bg-blue-500/10 text-blue-500',
  leave: 'bg-yellow-500/10 text-yellow-500',
  payment: 'bg-green-500/10 text-green-500',
  general: 'bg-purple-500/10 text-purple-500',
};

const typeLabels: Record<string, string> = {
  task: 'Task Update',
  leave: 'Leave Update',
  payment: 'Payment Update',
  general: 'General',
};

interface NotificationsViewProps {
  title?: string;
}

export function NotificationsView({ title = 'Notifications' }: NotificationsViewProps) {
  const { getUserNotifications, markNotificationRead, markAllNotificationsRead } = useData();
  const user = useCurrentUser();
  const notifications = user ? getUserNotifications(user.id) : [];
  const unread = notifications.filter((n) => !n.read).length;

  // Mark all as read when page is viewed
  useEffect(() => {
    if (user && unread > 0) {
      markAllNotificationsRead(user.id);
    }
  }, [user, unread, markAllNotificationsRead]);

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={`${unread} unread · ${notifications.length} total updates`}
        showBack={false}
        action={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={() => user && markAllNotificationsRead(user.id)}>
              <CheckCheck size={16} /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-3 max-w-2xl">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => markNotificationRead(notif.id)}
            className={`glass-card rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${!notif.read ? 'border-l-4 border-l-[var(--primary)]' : 'opacity-70'}`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${typeColors[notif.type] || typeColors.general}`}>
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-medium text-[var(--text)]">{notif.title}</h4>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />}
              </div>
              <span className="inline-block text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)] mt-1">
                {typeLabels[notif.type] || 'Update'}
              </span>
              <p className="text-sm text-[var(--text-muted)] mt-1">{notif.message}</p>
              <p className="text-xs text-[var(--text-muted)] mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
            </div>
            {notif.read && <CheckCheck size={16} className="text-green-500 mt-1 shrink-0" />}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)] glass-card rounded-2xl">
            <Bell size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm mt-1">New task, leave, and payment updates will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
