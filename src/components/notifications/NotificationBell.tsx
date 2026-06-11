import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useData, useCurrentUser } from '../../contexts/DataContext';

function getNotificationsPath(role: string) {
  if (role === 'worker') return '/worker/notifications';
  if (role === 'superadmin') return '/superadmin/notifications';
  return '/dashboard/notifications';
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useCurrentUser();
  const { getUserNotifications, markNotificationRead } = useData();

  const notifications = user ? getUserNotifications(user.id) : [];
  const unread = notifications.filter((n) => !n.read);
  const recent = notifications.slice(0, 5);
  const path = user ? getNotificationsPath(user.role) : '/dashboard/notifications';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--border)]/30 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[var(--text)]" />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card rounded-2xl border border-[var(--border)] shadow-xl z-50 animate-fade-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-semibold text-sm text-[var(--text)]">Updates</h3>
            {unread.length > 0 && (
              <span className="text-xs text-[var(--primary)] font-medium">{unread.length} new</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">No updates yet</p>
            ) : (
              recent.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--border)]/20 transition-colors cursor-pointer ${!notif.read ? 'bg-[var(--primary)]/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate">{notif.title}</p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{notif.message}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate(path); }}
            className="w-full px-4 py-3 text-sm font-medium text-[var(--primary)] hover:bg-[var(--border)]/20 transition-colors cursor-pointer"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
