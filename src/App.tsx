import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider, useCurrentUser } from './contexts/DataContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';

function HomeRedirect() {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'worker') return <Navigate to="/worker" replace />;
  return <Navigate to="/dashboard" replace />;
}
import { OwnerDashboard } from './pages/owner/Dashboard';
import { Companies } from './pages/owner/Companies';
import { Admins } from './pages/owner/Admins';
import { Workers } from './pages/owner/Workers';
import { Tasks } from './pages/owner/Tasks';
import { Leaves } from './pages/owner/Leaves';
import { Payments } from './pages/owner/Payments';
import { OwnerPayments } from './pages/owner/OwnerPayments';
import { Reports } from './pages/owner/Reports';
import { Settings } from './pages/owner/Settings';
import { Notifications } from './pages/owner/Notifications';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerTasks } from './pages/worker/WorkerTasks';
import { WorkerLeaves } from './pages/worker/WorkerLeaves';
import { WorkerPayments } from './pages/worker/WorkerPayments';
import { WorkerSettings } from './pages/worker/WorkerSettings';
import { WorkerNotifications } from './pages/worker/WorkerNotifications';
import { SuperAdminLogin } from './pages/superadmin/SuperAdminLogin';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { SuperAdminCompanies } from './pages/superadmin/SuperAdminCompanies';
import { SuperAdminPayments } from './pages/superadmin/SuperAdminPayments';
import { SuperAdminWorkers } from './pages/superadmin/SuperAdminWorkers';
import { SuperAdminUsers } from './pages/superadmin/SuperAdminUsers';
import { SuperAdminSettings } from './pages/superadmin/SuperAdminSettings';
import { SuperAdminNotifications } from './pages/superadmin/SuperAdminNotifications';
import { SuperAdminActivity } from './pages/superadmin/SuperAdminActivity';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />

            <Route path="/superadmin" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/companies" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminCompanies /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/payments" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminPayments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/workers" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminWorkers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/users" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminUsers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/activity" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminActivity /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/settings" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminSettings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/notifications" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminNotifications /></DashboardLayout></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><OwnerDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/companies" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Companies /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admins" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Admins /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/workers" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Workers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/tasks" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Tasks /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/leaves" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Leaves /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Payments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/owner-payments" element={<ProtectedRoute roles={['owner']}><DashboardLayout><OwnerPayments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />

            <Route path="/worker" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/tasks" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerTasks /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/leaves" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerLeaves /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/payments" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerPayments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/notifications" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerNotifications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/settings" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerSettings /></DashboardLayout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
