import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Wallet, CalendarOff, BarChart3,
  Settings, LogOut, Building2, ChevronLeft, ChevronRight, Bell, Shield,
  ListTodo, Crown, UserCog, Activity, MessageSquare, BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useData, useCurrentUser } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  role: 'owner' | 'admin' | 'worker' | 'superadmin';
}

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: boolean;
}

const ownerLinks: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/communication', icon: MessageSquare, label: 'Communication' },
  { to: '/dashboard/private-messages', icon: BookOpen, label: 'Private Chat' },
  { to: '/dashboard/profile', icon: Building2, label: 'Business Profile' },
  { to: '/dashboard/admins', icon: Shield, label: 'Admins' },
  { to: '/dashboard/workers', icon: Users, label: 'Workers' },
  { to: '/dashboard/owner-payments', icon: Wallet, label: 'Owner Payments' },
  { to: '/dashboard/payments', icon: CreditCard, label: 'Worker Payments' },
  { to: '/dashboard/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/dashboard/leaves', icon: CalendarOff, label: 'Leave Requests' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  { to: '/dashboard/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const superAdminLinks: NavItem[] = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/superadmin/communication', icon: MessageSquare, label: 'Communications' },
  { to: '/superadmin/companies', icon: Building2, label: 'All Companies' },
  { to: '/superadmin/payments', icon: CreditCard, label: 'All Payments' },
  { to: '/superadmin/workers', icon: Users, label: 'All Workers' },
  { to: '/superadmin/users', icon: UserCog, label: 'All Users' },
  { to: '/superadmin/activity', icon: Activity, label: 'User Activity' },
  { to: '/superadmin/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/superadmin/settings', icon: Settings, label: 'Settings' },
];

const workerLinks: NavItem[] = [
  { to: '/worker', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/worker/communication', icon: MessageSquare, label: 'Communication' },
  { to: '/worker/private-messages', icon: BookOpen, label: 'Private Chat' },
  { to: '/worker/tasks', icon: ListTodo, label: 'My Tasks' },
  { to: '/worker/leaves', icon: CalendarOff, label: 'Leave' },
  { to: '/worker/payments', icon: CreditCard, label: 'Payments' },
  { to: '/worker/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/worker/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, getUserNotifications } = useData();
  const user = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const links = role === 'superadmin'
    ? superAdminLinks
    : role === 'worker'
      ? workerLinks
      : role === 'admin'
        ? ownerLinks.filter((l) => l.to !== '/dashboard/owner-payments')
        : ownerLinks;
  const unread = user ? getUserNotifications(user.id).filter((n) => !n.read).length : 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-0 h-full z-40 glass-card border-r border-[var(--border)] transition-all duration-300 flex flex-col ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role === 'superadmin' ? 'bg-amber-500' : 'gradient-bg'}`}>
              {role === 'superadmin' ? <Crown size={16} className="text-white" /> : <Building2 size={16} className="text-white" />}
            </div>
            <span className="font-bold text-sm gradient-text">{role === 'superadmin' ? 'Super Admin' : 'WorkForce Pro'}</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 transition-colors cursor-pointer">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/worker' || link.to === '/superadmin'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'gradient-bg text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:bg-[var(--border)]/30 hover:text-[var(--text)]'
              }`
            }
          >
            <link.icon size={20} />
            {!collapsed && <span>{link.label}</span>}
            {link.badge && unread > 0 && (
              <span className={`${collapsed ? 'absolute top-1 right-1' : 'ml-auto'} min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center`}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--border)]/30 transition-colors cursor-pointer">
          <span className="text-lg">{theme === 'light' ? '🌙' : '☀️'}</span>
          {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
