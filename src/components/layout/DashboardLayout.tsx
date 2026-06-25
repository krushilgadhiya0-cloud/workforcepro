import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useCurrentUser } from '../../contexts/DataContext';
import { TrialPromoModal } from '../TrialPromoModal';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = useCurrentUser();
  const role = (user?.role === 'superadmin' || user?.role === 'worker' || user?.role === 'admin' || user?.role === 'owner')
    ? user.role
    : 'owner';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar role={role} />
      <main className="ml-64 max-lg:ml-[72px] p-6 lg:p-8 transition-all duration-300">
        <TopBar />
        {children}
      </main>
      <TrialPromoModal />
    </div>
  );
}
