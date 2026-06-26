import { MessageSquare } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { useCurrentUser, useCurrentCompany, useData } from '../../contexts/DataContext';

interface TopBarProps {
  onToggleChat?: () => void;
}

export function TopBar({ onToggleChat }: TopBarProps) {
  const user = useCurrentUser();
  const company = useCurrentCompany();
  const { getUnreadCommunicationCount } = useData();
  
  const unreadCount = user ? getUnreadCommunicationCount(user.id) : 0;

  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border)]">
      <div>
        <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role} account</p>
        <p className="text-sm font-medium text-[var(--text)]">
          {company?.name || user?.name || 'WorkForce Pro'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleChat}
          className="relative p-2 rounded-xl bg-white dark:bg-slate-800 border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 hover:shadow-lg transition-all cursor-pointer group"
        >
          <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <NotificationBell />
      </div>
    </div>
  );
}

