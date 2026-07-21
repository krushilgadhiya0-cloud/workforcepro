import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useCurrentUser } from '../../contexts/DataContext';
import { TrialPromoModal } from '../TrialPromoModal';
import { SideCommunication } from './SideCommunication';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = useCurrentUser();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  
  const role = (user?.role === 'superadmin' || user?.role === 'worker' || user?.role === 'admin' || user?.role === 'owner')
    ? user.role
    : 'owner';

  return (
    <div className="min-h-screen bg-[var(--bg)] flex overflow-x-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar 
        role={role} 
        mobileOpen={mobileMenuOpen} 
        setMobileOpen={setMobileMenuOpen} 
        collapsed={desktopCollapsed} 
        setCollapsed={setDesktopCollapsed} 
      />
      
      <main className={`flex-1 p-4 lg:p-8 transition-all duration-300 relative w-full lg:w-auto ${desktopCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        <TopBar 
          onToggleChat={() => setIsChatOpen(!isChatOpen)} 
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        {children}
      </main>
      <SideCommunication isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <TrialPromoModal />
    </div>
  );
}

