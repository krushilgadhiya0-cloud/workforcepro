import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  AppData, User, Company, Admin, Worker, Task, LeaveRequest, Payment, Notification,
  SubscriptionPlan, AdminRole, LeaveStatus,
} from '../types';
import { loadData, saveData, generateId, generateTransactionId, SUPER_ADMIN_ID } from '../utils/storage';

interface DataContextType extends AppData {
  refresh: () => void;
  login: (email: string, password: string) => User | null;
  register: (user: Omit<User, 'id' | 'createdAt'>) => User;
  logout: () => void;
  setCurrentCompany: (id: string) => void;
  createCompany: (data: Omit<Company, 'id' | 'createdAt' | 'subscription' | 'subscriptionDate' | 'monthlyRevenue' | 'monthlyRevenueUpdatedAt'>) => Company;
  updateMonthlyRevenue: (companyId: string, amount: number) => void;
  isEmailTaken: (email: string, excludeUserId?: string) => boolean;
  subscribe: (companyId: string, plan: SubscriptionPlan) => void;
  removeCompany: (companyId: string, password: string) => boolean;
  removeCompanyAsSuperAdmin: (companyId: string) => void;
  addAdmin: (data: Omit<Admin, 'id' | 'createdAt' | 'userId'> & { password: string }) => Admin | null;
  updateAdmin: (id: string, data: Partial<Admin>) => boolean;
  deleteAdmin: (id: string) => void;
  addWorker: (data: Omit<Worker, 'id' | 'createdAt' | 'userId' | 'attendanceStatus'> & { password: string }) => Worker | null;
  updateWorker: (id: string, data: Partial<Worker>) => boolean;
  deleteWorker: (id: string) => void;
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'status'>) => Task;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  applyLeave: (data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => LeaveRequest;
  updateLeave: (id: string, status: LeaveStatus) => void;
  addPayment: (data: Omit<Payment, 'id' | 'createdAt' | 'status'>) => Payment;
  markPaymentPaid: (id: string) => void;
  addNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  updateSettings: (settings: Partial<AppData['settings']>) => void;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => boolean;
  updateCompany: (id: string, data: Partial<Company>) => boolean;
  getCompanyWorkers: (companyId: string) => Worker[];
  getCompanyTasks: (companyId: string) => Task[];
  getCompanyPayments: (companyId: string) => Payment[];
  getCompanyLeaves: (companyId: string) => LeaveRequest[];
  getUserNotifications: (userId: string) => Notification[];
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  const persist = useCallback((newData: AppData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const refresh = useCallback(() => setData(loadData()), []);

  const appendNotification = (d: AppData, notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    d.notifications.push({ ...notif, id: generateId(), read: false, createdAt: new Date().toISOString() });
  };

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const d = loadData();
    appendNotification(d, notif);
    persist(d);
  }, [persist]);

  const login = useCallback((email: string, password: string): User | null => {
    const d = loadData();
    const user = d.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      d.currentUserId = user.id;
      if (user.role === 'superadmin') {
        d.currentCompanyId = null;
      } else if (user.companyId) {
        d.currentCompanyId = user.companyId;
      } else if (user.role === 'owner') {
        const owned = d.companies.find((c) => c.ownerId === user.id);
        if (owned) {
          d.currentCompanyId = owned.id;
          user.companyId = owned.id;
        }
      }
      persist(d);
      return user;
    }
    return null;
  }, [persist]);

  const register = useCallback((userData: Omit<User, 'id' | 'createdAt'>): User => {
    if (userData.role !== 'owner') {
      throw new Error('Only business owners can self-register. Workers and admins must be added by an owner.');
    }
    const d = loadData();
    if (d.users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('Email already registered');
    }
    const user: User = { ...userData, id: generateId(), createdAt: new Date().toISOString() };
    d.users.push(user);
    d.currentUserId = user.id;
    persist(d);
    return user;
  }, [persist]);

  const isEmailTaken = useCallback((email: string, excludeUserId?: string): boolean => {
    const d = loadData();
    return d.users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeUserId,
    );
  }, []);

  const logout = useCallback(() => {
    const d = loadData();
    d.currentUserId = null;
    d.currentCompanyId = null;
    persist(d);
  }, [persist]);

  const setCurrentCompany = useCallback((id: string) => {
    const d = loadData();
    d.currentCompanyId = id;
    persist(d);
  }, [persist]);

  const createCompany = useCallback((companyData: Omit<Company, 'id' | 'createdAt' | 'subscription' | 'subscriptionDate' | 'monthlyRevenue' | 'monthlyRevenueUpdatedAt'>): Company => {
    const d = loadData();
    const company: Company = {
      ...companyData,
      id: generateId(),
      subscription: null,
      subscriptionDate: null,
      monthlyRevenue: 0,
      monthlyRevenueUpdatedAt: null,
      createdAt: new Date().toISOString(),
    };
    d.companies.push(company);
    d.currentCompanyId = company.id;
    const owner = d.users.find((u) => u.id === company.ownerId);
    if (owner) owner.companyId = company.id;
    appendNotification(d, {
      userId: SUPER_ADMIN_ID,
      title: 'New Business Registered',
      message: `${company.name} has joined the platform`,
      type: 'general',
    });
    if (owner) {
      appendNotification(d, {
        userId: owner.id,
        title: 'Business Created',
        message: `${company.name} is ready. Start adding workers and tasks.`,
        type: 'general',
      });
    }
    persist(d);
    return company;
  }, [persist]);

  const subscribe = useCallback((companyId: string, plan: SubscriptionPlan) => {
    const d = loadData();
    const company = d.companies.find((c) => c.id === companyId);
    if (company) {
      company.subscription = plan;
      company.subscriptionDate = new Date().toISOString();
      persist(d);
    }
  }, [persist]);

  const removeCompany = useCallback((companyId: string, password: string): boolean => {
    const d = loadData();
    const company = d.companies.find((c) => c.id === companyId);
    if (!company || company.ownerPassword !== password) return false;
    d.companies = d.companies.filter((c) => c.id !== companyId);
    d.admins = d.admins.filter((a) => a.companyId !== companyId);
    d.workers = d.workers.filter((w) => w.companyId !== companyId);
    d.tasks = d.tasks.filter((t) => t.companyId !== companyId);
    d.leaves = d.leaves.filter((l) => l.companyId !== companyId);
    d.payments = d.payments.filter((p) => p.companyId !== companyId);
    if (d.currentCompanyId === companyId) d.currentCompanyId = d.companies[0]?.id || null;
    persist(d);
    return true;
  }, [persist]);

  const removeCompanyAsSuperAdmin = useCallback((companyId: string) => {
    const d = loadData();
    d.companies = d.companies.filter((c) => c.id !== companyId);
    d.admins = d.admins.filter((a) => a.companyId !== companyId);
    d.workers = d.workers.filter((w) => w.companyId !== companyId);
    d.tasks = d.tasks.filter((t) => t.companyId !== companyId);
    d.leaves = d.leaves.filter((l) => l.companyId !== companyId);
    d.payments = d.payments.filter((p) => p.companyId !== companyId);
    if (d.currentCompanyId === companyId) d.currentCompanyId = null;
    persist(d);
  }, [persist]);

  const addAdmin = useCallback((adminData: Omit<Admin, 'id' | 'createdAt' | 'userId'> & { password: string }): Admin | null => {
    const d = loadData();
    if (d.users.some((u) => u.email.toLowerCase() === adminData.email.toLowerCase())) {
      return null;
    }
    const user: User = {
      id: generateId(),
      email: adminData.email,
      password: adminData.password,
      name: adminData.name,
      role: 'admin',
      companyId: adminData.companyId,
      phone: adminData.phone,
      createdAt: new Date().toISOString(),
    };
    d.users.push(user);
    const admin: Admin = {
      id: generateId(),
      companyId: adminData.companyId,
      name: adminData.name,
      email: adminData.email,
      phone: adminData.phone,
      role: adminData.role as AdminRole,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    d.admins.push(admin);
    appendNotification(d, {
      userId: user.id,
      title: 'Account Registered',
      message: `Your admin account is ready. Login with email: ${adminData.email} and the password shared by your owner.`,
      type: 'general',
    });
    persist(d);
    return admin;
  }, [persist]);

  const updateAdmin = useCallback((id: string, updates: Partial<Admin>) => {
    const d = loadData();
    const idx = d.admins.findIndex((a) => a.id === id);
    if (idx >= 0) {
      const admin = d.admins[idx];
      if (updates.email && d.users.some((u) => u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== admin.userId)) {
        return false;
      }
      d.admins[idx] = { ...admin, ...updates };
      const user = d.users.find((u) => u.id === admin.userId);
      if (user) {
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email;
        if (updates.phone) user.phone = updates.phone;
      }
    }
    persist(d);
    return true;
  }, [persist]);

  const deleteAdmin = useCallback((id: string) => {
    const d = loadData();
    const admin = d.admins.find((a) => a.id === id);
    if (admin) {
      d.users = d.users.filter((u) => u.id !== admin.userId);
      d.admins = d.admins.filter((a) => a.id !== id);
      persist(d);
    }
  }, [persist]);

  const addWorker = useCallback((workerData: Omit<Worker, 'id' | 'createdAt' | 'userId' | 'attendanceStatus'> & { password: string }): Worker | null => {
    const d = loadData();
    if (d.users.some((u) => u.email.toLowerCase() === workerData.email.toLowerCase())) {
      return null;
    }
    const user: User = {
      id: generateId(),
      email: workerData.email,
      password: workerData.password,
      name: workerData.name,
      role: 'worker',
      companyId: workerData.companyId,
      phone: workerData.phone,
      createdAt: new Date().toISOString(),
    };
    d.users.push(user);
    const worker: Worker = {
      id: generateId(),
      companyId: workerData.companyId,
      name: workerData.name,
      email: workerData.email,
      phone: workerData.phone,
      department: workerData.department,
      designation: workerData.designation,
      joiningDate: workerData.joiningDate,
      userId: user.id,
      attendanceStatus: 'present',
      createdAt: new Date().toISOString(),
    };
    d.workers.push(worker);
    appendNotification(d, {
      userId: user.id,
      title: 'Account Registered',
      message: `Your worker account is ready. Login with email: ${workerData.email} and the password shared by your admin.`,
      type: 'general',
    });
    persist(d);
    return worker;
  }, [persist]);

  const updateWorker = useCallback((id: string, updates: Partial<Worker>) => {
    const d = loadData();
    const idx = d.workers.findIndex((w) => w.id === id);
    if (idx >= 0) {
      const worker = d.workers[idx];
      if (updates.email && d.users.some((u) => u.email.toLowerCase() === updates.email!.toLowerCase() && u.id !== worker.userId)) {
        return false;
      }
      d.workers[idx] = { ...worker, ...updates };
      const user = d.users.find((u) => u.id === worker.userId);
      if (user) {
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email;
        if (updates.phone) user.phone = updates.phone;
      }
    }
    persist(d);
    return true;
  }, [persist]);

  const deleteWorker = useCallback((id: string) => {
    const d = loadData();
    const worker = d.workers.find((w) => w.id === id);
    if (worker) {
      d.users = d.users.filter((u) => u.id !== worker.userId);
      d.workers = d.workers.filter((w) => w.id !== id);
      d.tasks = d.tasks.filter((t) => t.workerId !== id);
      persist(d);
    }
  }, [persist]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const d = loadData();
    const task: Task = { ...taskData, id: generateId(), status: 'pending', createdAt: new Date().toISOString() };
    d.tasks.push(task);
    const worker = d.workers.find((w) => w.id === task.workerId);
    if (worker) {
      appendNotification(d, { userId: worker.userId, title: 'New Task Assigned', message: `You have been assigned: ${task.title}`, type: 'task' });
    }
    persist(d);
    return task;
  }, [persist]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const d = loadData();
    const idx = d.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      d.tasks[idx] = { ...d.tasks[idx], ...updates };
      const task = d.tasks[idx];
      const worker = d.workers.find((w) => w.id === task.workerId);
      if (worker && updates.status === 'completed') {
        const admins = d.admins.filter((a) => a.companyId === task.companyId);
        admins.forEach((a) => addNotification({ userId: a.userId, title: 'Task Completed', message: `${worker.name} completed: ${task.title}`, type: 'task' }));
        const owner = d.companies.find((c) => c.id === task.companyId);
        if (owner) {
          const ownerUser = d.users.find((u) => u.id === owner.ownerId);
          if (ownerUser) addNotification({ userId: ownerUser.id, title: 'Task Completed', message: `${worker.name} completed: ${task.title}`, type: 'task' });
        }
      }
      if (worker && updates.title) {
        addNotification({ userId: worker.userId, title: 'Task Updated', message: `Task "${task.title}" has been updated`, type: 'task' });
      }
    }
    persist(d);
  }, [persist, addNotification]);

  const deleteTask = useCallback((id: string) => {
    const d = loadData();
    d.tasks = d.tasks.filter((t) => t.id !== id);
    persist(d);
  }, [persist]);

  const applyLeave = useCallback((leaveData: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const d = loadData();
    const leave: LeaveRequest = { ...leaveData, id: generateId(), status: 'pending', createdAt: new Date().toISOString() };
    d.leaves.push(leave);
    const worker = d.workers.find((w) => w.id === leave.workerId);
    const admins = d.admins.filter((a) => a.companyId === leave.companyId);
    admins.forEach((a) => addNotification({ userId: a.userId, title: 'New Leave Request', message: `${worker?.name || 'Worker'} requested leave`, type: 'leave' }));
    const company = d.companies.find((c) => c.id === leave.companyId);
    if (company) {
      const ownerUser = d.users.find((u) => u.id === company.ownerId);
      if (ownerUser) addNotification({ userId: ownerUser.id, title: 'New Leave Request', message: `${worker?.name || 'Worker'} requested leave`, type: 'leave' });
    }
    persist(d);
    return leave;
  }, [persist, addNotification]);

  const updateLeave = useCallback((id: string, status: LeaveStatus) => {
    const d = loadData();
    const idx = d.leaves.findIndex((l) => l.id === id);
    if (idx >= 0) {
      d.leaves[idx].status = status;
      const leave = d.leaves[idx];
      const worker = d.workers.find((w) => w.id === leave.workerId);
      if (worker) {
        addNotification({
          userId: worker.userId,
          title: status === 'approved' ? 'Leave Approved' : 'Leave Rejected',
          message: `Your leave request for ${leave.leaveDate} has been ${status}`,
          type: 'leave',
        });
      }
    }
    persist(d);
  }, [persist, addNotification]);

  const addPayment = useCallback((paymentData: Omit<Payment, 'id' | 'createdAt' | 'status'>) => {
    const d = loadData();
    const payment: Payment = { ...paymentData, id: generateId(), status: 'due', createdAt: new Date().toISOString() };
    d.payments.push(payment);
    persist(d);
    return payment;
  }, [persist]);

  const markPaymentPaid = useCallback((id: string) => {
    const d = loadData();
    const idx = d.payments.findIndex((p) => p.id === id);
    if (idx >= 0) {
      d.payments[idx].status = 'paid';
      d.payments[idx].paidDate = new Date().toISOString().split('T')[0];
      d.payments[idx].transactionId = generateTransactionId();
      const payment = d.payments[idx];
      const worker = d.workers.find((w) => w.id === payment.workerId);
      if (worker) {
        addNotification({ userId: worker.userId, title: 'Salary Paid', message: `₹${payment.amount} has been paid to your account`, type: 'payment' });
      }
    }
    persist(d);
  }, [persist, addNotification]);

  const markNotificationRead = useCallback((id: string) => {
    const d = loadData();
    const notif = d.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    persist(d);
  }, [persist]);

  const markAllNotificationsRead = useCallback((userId: string) => {
    const d = loadData();
    d.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    persist(d);
  }, [persist]);

  const updateSettings = useCallback((settings: Partial<AppData['settings']>) => {
    const d = loadData();
    d.settings = { ...d.settings, ...settings };
    persist(d);
  }, [persist]);

  const changePassword = useCallback((userId: string, oldPassword: string, newPassword: string): boolean => {
    const d = loadData();
    const user = d.users.find((u) => u.id === userId);
    if (!user || user.password !== oldPassword) return false;
    user.password = newPassword;
    persist(d);
    return true;
  }, [persist]);

  const updateMonthlyRevenue = useCallback((companyId: string, amount: number) => {
    const d = loadData();
    const idx = d.companies.findIndex((c) => c.id === companyId);
    if (idx >= 0) {
      const company = d.companies[idx];
      company.monthlyRevenue = amount;
      company.monthlyRevenueUpdatedAt = new Date().toISOString();
      const msg = `Monthly revenue updated to ₹${amount.toLocaleString('en-IN')} for ${company.name}`;
      const ownerUser = d.users.find((u) => u.id === company.ownerId);
      if (ownerUser) appendNotification(d, { userId: ownerUser.id, title: 'Monthly Revenue Updated', message: msg, type: 'general' });
      d.admins.filter((a) => a.companyId === companyId).forEach((a) => {
        appendNotification(d, { userId: a.userId, title: 'Monthly Revenue Updated', message: msg, type: 'general' });
      });
    }
    persist(d);
  }, [persist]);

  const updateCompany = useCallback((id: string, updates: Partial<Company>): boolean => {
    const d = loadData();
    const idx = d.companies.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    d.companies[idx] = { ...d.companies[idx], ...updates };
    const company = d.companies[idx];
    const owner = d.users.find((u) => u.id === company.ownerId);
    if (owner) {
      if (updates.ownerName) owner.name = updates.ownerName;
      if (updates.phone) owner.phone = updates.phone;
    }
    persist(d);
    return true;
  }, [persist]);

  const getCompanyWorkers = useCallback((companyId: string) => data.workers.filter((w) => w.companyId === companyId), [data.workers]);
  const getCompanyTasks = useCallback((companyId: string) => data.tasks.filter((t) => t.companyId === companyId), [data.tasks]);
  const getCompanyPayments = useCallback((companyId: string) => data.payments.filter((p) => p.companyId === companyId), [data.payments]);
  const getCompanyLeaves = useCallback((companyId: string) => data.leaves.filter((l) => l.companyId === companyId), [data.leaves]);
  const getUserNotifications = useCallback((userId: string) => data.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [data.notifications]);

  return (
    <DataContext.Provider value={{
      ...data,
      refresh,
      login,
      register,
      logout,
      setCurrentCompany,
      createCompany,
      subscribe,
      removeCompany,
      removeCompanyAsSuperAdmin,
      addAdmin,
      updateAdmin,
      deleteAdmin,
      addWorker,
      updateWorker,
      deleteWorker,
      addTask,
      updateTask,
      deleteTask,
      applyLeave,
      updateLeave,
      addPayment,
      markPaymentPaid,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      updateSettings,
      changePassword,
      updateCompany,
      updateMonthlyRevenue,
      isEmailTaken,
      getCompanyWorkers,
      getCompanyTasks,
      getCompanyPayments,
      getCompanyLeaves,
      getUserNotifications,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function useCurrentUser() {
  const { users, currentUserId } = useData();
  return users.find((u) => u.id === currentUserId) || null;
}

export function useCurrentCompany() {
  const { companies, currentCompanyId, users, currentUserId } = useData();

  if (currentCompanyId) {
    const company = companies.find((c) => c.id === currentCompanyId);
    if (company) return company;
  }

  const user = users.find((u) => u.id === currentUserId);
  if (user?.companyId) {
    return companies.find((c) => c.id === user.companyId) ?? null;
  }
  if (user?.role === 'owner') {
    return companies.find((c) => c.ownerId === user.id) ?? null;
  }
  return null;
}
