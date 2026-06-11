import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../contexts/DataContext';

function getHomeForRole(role: string) {
  if (role === 'superadmin') return '/superadmin';
  if (role === 'worker') return '/worker';
  return '/dashboard';
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: ('owner' | 'admin' | 'worker' | 'superadmin')[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const user = useCurrentUser();
  const location = useLocation();

  if (!user) {
    const isSuperAdminRoute = location.pathname.startsWith('/superadmin') && location.pathname !== '/superadmin/login';
    return <Navigate to={isSuperAdminRoute ? '/superadmin/login' : '/login'} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getHomeForRole(user.role)} replace />;
  }

  return <>{children}</>;
}
