import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { OwnerDashboard } from './pages/owner/Dashboard';
import { BusinessProfile } from './pages/owner/BusinessProfile';
import { Admins } from './pages/owner/Admins';
import { Workers } from './pages/owner/Workers';
import { Tasks } from './pages/owner/Tasks';
import { Leaves } from './pages/owner/Leaves';
import { Payments } from './pages/owner/Payments';
import { OwnerPayments } from './pages/owner/OwnerPayments';
import { Reports } from './pages/owner/Reports';
import { Revenue } from './pages/owner/Revenue';
import { AI } from './pages/AI';
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
import { Communication } from './pages/Communication';
import { PrivateMessages } from './pages/PrivateMessages';
import { SuperAdminCommunicationList } from './pages/superadmin/SuperAdminCommunicationList';
import { SuperAdminCommunicationDetail } from './pages/superadmin/SuperAdminCommunicationDetail';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/contact" element={<Contact />} />
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
            <Route path="/superadmin/communication" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminCommunicationList /></DashboardLayout></ProtectedRoute>} />
            <Route path="/superadmin/communication/:companyId" element={<ProtectedRoute roles={['superadmin']}><DashboardLayout><SuperAdminCommunicationDetail /></DashboardLayout></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><OwnerDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><BusinessProfile /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/admins" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Admins /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/workers" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Workers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/tasks" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Tasks /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/leaves" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Leaves /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/payments" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Payments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/owner-payments" element={<ProtectedRoute roles={['owner']}><DashboardLayout><OwnerPayments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Reports /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/revenue" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Revenue /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/ai" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><AI /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/communication" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><Communication /></DashboardLayout></ProtectedRoute>} />
            <Route path="/dashboard/private-messages" element={<ProtectedRoute roles={['owner', 'admin']}><DashboardLayout><PrivateMessages /></DashboardLayout></ProtectedRoute>} />

            <Route path="/worker" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/tasks" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerTasks /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/leaves" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerLeaves /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/payments" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerPayments /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/notifications" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerNotifications /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/settings" element={<ProtectedRoute roles={['worker']}><DashboardLayout><WorkerSettings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/ai" element={<ProtectedRoute roles={['worker']}><DashboardLayout><AI /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/communication" element={<ProtectedRoute roles={['worker']}><DashboardLayout><Communication /></DashboardLayout></ProtectedRoute>} />
            <Route path="/worker/private-messages" element={<ProtectedRoute roles={['worker']}><DashboardLayout><PrivateMessages /></DashboardLayout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
