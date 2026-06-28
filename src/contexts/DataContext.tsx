import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type {
  AppData, User, Company, Admin, Worker, Task, LeaveRequest, Payment, Notification,
  SubscriptionPlan, AdminRole, LeaveStatus, ActivityLog, CommunicationMessage, PrivateMessage, DailyRevenue,
} from '../types';
import {
  loadData, saveData, syncFromServer, defaultData, generateId, generateTransactionId,
  SUPER_ADMIN_ID, SUPER_ADMIN_EMAIL, getSyncState, getLocalData, ensureSuperAdminFromStorage,
  matchesSuperAdminLogin, type SyncState,
} from '../utils/storage';
import { assertValidEmailFormat, sendWelcomeEmail } from '../utils/email';
import { generateAIResponse } from '../utils/ai';
interface DataContextType extends AppData {
  syncState: SyncState;
  syncError: string;
  refresh: () => Promise<AppData>;
  login: (email: string, password: string) => Promise<User | null>;
  register: (user: Omit<User, 'id' | 'createdAt'>) => Promise<User>;
  logout: () => void;
  setCurrentCompany: (id: string) => void;
  createCompany: (data: Omit<Company, 'id' | 'createdAt' | 'subscription' | 'subscriptionDate' | 'monthlyRevenue' | 'monthlyRevenueUpdatedAt'>) => Company;
  updateMonthlyRevenue: (companyId: string, amount: number) => void;
  isEmailTaken: (email: string, excludeUserId?: string) => boolean;
  subscribe: (companyId: string, plan: SubscriptionPlan) => void;
  removeCompany: (companyId: string, password: string) => boolean;
  removeCompanyAsSuperAdmin: (companyId: string) => void;
  removeUserAsSuperAdmin: (userId: string) => boolean;
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
  forgotPasswordReset: (email: string, newPassword: string) => Promise<boolean>;
  verifyHostPassword: (password: string) => boolean;
  updateCompany: (id: string, data: Partial<Company>) => boolean;
  getCompanyWorkers: (companyId: string) => Worker[];
  getCompanyTasks: (companyId: string) => Task[];
  getCompanyPayments: (companyId: string) => Payment[];
  getCompanyLeaves: (companyId: string) => LeaveRequest[];
  getCompanyMessages: (companyId: string) => CommunicationMessage[];
  getUserNotifications: (userId: string) => Notification[];
  sendMessage: (content: string) => void;
  sendPrivateMessage: (receiverId: string, content: string) => void;
  getPrivateMessages: (userId: string, contactId: string) => PrivateMessage[];
  getPrivateContacts: (userId: string) => User[];
  markPrivateMessageRead: (messageId: string) => void;
  addDailyRevenue: (amount: number, date: string, notes?: string) => void;
  getDailyRevenue: (companyId: string) => DailyRevenue[];
  getUnreadPrivateCount: (userId: string) => number;
  getUnreadCommunicationCount: (userId: string) => number;
  markAllCommunicationRead: (userId: string) => void;
  startTrial: (companyId: string) => void;
  confirmPhone: (userId: string) => void;
  editMessage: (id: string, content: string) => void;
  deleteMessage: (id: string) => void;
  editPrivateMessage: (id: string, content: string) => void;
  deletePrivateMessage: (id: string) => void;
  updateCompanySubscription: (id: string, plan: SubscriptionPlan | null, days?: number) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState('');
  const syncLockRef = useRef(false);
  const sessionRef = useRef({ currentUserId: null as string | null, currentCompanyId: null as string | null });

  const updateSyncStatus = useCallback(() => {
    const { state, error } = getSyncState();
    setSyncState(state);
    setSyncError(error);
  }, []);

  useEffect(() => {
    sessionRef.current = {
      currentUserId: data.currentUserId,
      currentCompanyId: data.currentCompanyId,
    };
  }, [data.currentUserId, data.currentCompanyId]);

  useEffect(() => {
    const fallbackTimer = setTimeout(() => setLoading(false), 8000);
    loadData()
      .then((loaded) => {
        setData(loaded);
        updateSyncStatus();
      })

      .catch(() => {
        const local = ensureSuperAdminFromStorage(getLocalData());
        setData(local);
        updateSyncStatus();
      })
      .finally(() => {
        clearTimeout(fallbackTimer);
        setLoading(false);
      });
  }, [updateSyncStatus]);

  const persist = useCallback(async (newData: AppData) => {
    const session = { currentUserId: newData.currentUserId, currentCompanyId: newData.currentCompanyId };
    syncLockRef.current = true;
    try {
      const saved = await saveData(newData);
      setData({ ...saved, ...session });
    } finally {
      setTimeout(() => { syncLockRef.current = false; }, 3000);
    }
    updateSyncStatus();
  }, [updateSyncStatus]);

  const refresh = useCallback(async (): Promise<AppData> => {
    const synced = await syncFromServer(sessionRef.current);
    updateSyncStatus();
    setData(synced);
    return synced;
  }, [updateSyncStatus]);

  // Background Sync for real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (syncLockRef.current) return;
      
      try {
        const refreshed = await loadData();
        if (!refreshed || syncLockRef.current) return;

        setData(current => ({
          ...refreshed,
          currentUserId: current.currentUserId,
          currentCompanyId: current.currentCompanyId
        }));
        updateSyncStatus();
      } catch (e) {
        console.warn('Background sync failed', e);
      }
    }, 1500);
    return () => clearInterval(interval);

  }, [updateSyncStatus]);

  const appendNotification = (d: AppData, notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    d.notifications.push({ ...notif, id: generateId(), read: false, createdAt: new Date().toISOString() });
  };

  const appendActivity = (d: AppData, activity: Omit<ActivityLog, 'id' | 'createdAt'>) => {
    d.activities.unshift({
      ...activity,
      id: generateId(),
      createdAt: new Date().toISOString(),
    });
    if (d.activities.length > 500) d.activities.length = 500;
  };

  useEffect(() => {
    const userId = data.currentUserId;
    if (!userId) return;
    const user = data.users.find((u) => u.id === userId);
    if (user?.role !== 'superadmin') return;

    const interval = setInterval(() => {
      void refresh();
    }, 8000);
    return () => clearInterval(interval);
  }, [data.currentUserId, data.users, refresh]);

  const addNotification = useCallback(async (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    setData(prev => {
      const d = { ...prev };
      appendNotification(d, notif);
      saveData(d);
      return d;
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    let fresh: AppData;
    try {
      fresh = await Promise.race([
        syncFromServer({ currentUserId: null, currentCompanyId: null }),
        new Promise<AppData>((_, reject) => {
          setTimeout(() => reject(new Error('sync timeout')), 7000);
        }),
      ]);
    } catch {
      fresh = ensureSuperAdminFromStorage(getLocalData());
    }
    fresh = ensureSuperAdminFromStorage(fresh);

    let user = fresh.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );

    if (!user && matchesSuperAdminLogin(email, password)) {
      fresh = ensureSuperAdminFromStorage(fresh);
      user = fresh.users.find((u) => u.role === 'superadmin');
    }

    if (!user) return null;

    const d = { ...fresh };
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

    const company = d.currentCompanyId ? d.companies.find((c) => c.id === d.currentCompanyId) : undefined;
    appendActivity(d, {
      type: 'user_login',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      companyId: company?.id,
      companyName: company?.name,
      message: `${user.name} (${user.role}) signed in`,
    });
    await persist(d);
    return user;
  }, [persist]);

  const register = useCallback(async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    if (userData.role !== 'owner') {
      throw new Error('Only business owners can self-register. Workers and admins must be added by an owner.');
    }
    const fresh = await syncFromServer({ currentUserId: null, currentCompanyId: null });
    const email = assertValidEmailFormat(userData.email);
    if (fresh.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('Email already registered');
    }
    if (userData.phone && fresh.users.some((u) => u.phone === userData.phone)) {
      throw new Error('Phone number already registered to another account');
    }
    const user: User = { ...userData, email, id: generateId(), createdAt: new Date().toISOString() };
    const d = { ...fresh };
    d.users.push(user);
    d.currentUserId = user.id;
    appendActivity(d, {
      type: 'user_registered',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      message: `${user.name} registered as business owner (${email})`,
    });
    await persist(d);
    return user;
  }, [persist]);

  const isEmailTaken = useCallback((email: string, excludeUserId?: string): boolean => {
    return data.users.some(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeUserId,
    );
  }, [data.users]);

  const logout = useCallback(async () => {
    const user = data.users.find((u) => u.id === data.currentUserId);
    const company = data.currentCompanyId
      ? data.companies.find((c) => c.id === data.currentCompanyId)
      : undefined;
    const d = { ...data };
    if (user) {
      appendActivity(d, {
        type: 'user_logout',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        companyId: company?.id,
        companyName: company?.name,
        message: `${user.name} signed out`,
      });
    }
    d.currentUserId = null;
    d.currentCompanyId = null;
    await persist(d);
  }, [data, persist]);

  const setCurrentCompany = useCallback((id: string) => {
    const d = { ...data };
    d.currentCompanyId = id;
    persist(d);
  }, [data, persist]);

  const createCompany = useCallback((companyData: Omit<Company, 'id' | 'createdAt' | 'subscription' | 'subscriptionDate' | 'monthlyRevenue' | 'monthlyRevenueUpdatedAt'>): Company => {
    const email = assertValidEmailFormat(companyData.email);
    const company: Company = {
      ...companyData,
      email,
      id: generateId(),
      subscription: null,
      subscriptionDate: null,
      monthlyRevenue: 0,
      monthlyRevenueUpdatedAt: null,
      createdAt: new Date().toISOString(),
    };
    const d = { ...data };
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
    appendActivity(d, {
      type: 'company_created',
      userId: owner?.id ?? company.ownerId,
      userName: company.ownerName,
      userRole: 'owner',
      companyId: company.id,
      companyName: company.name,
      message: `Business "${company.name}" was created`,
    });
    persist(d);
    return company;
  }, [data, persist]);

  const subscribe = useCallback((companyId: string, plan: SubscriptionPlan) => {
    const d = { ...data };
    const company = d.companies.find((c) => c.id === companyId);
    if (company) {
      company.subscription = plan;
      company.subscriptionDate = new Date().toISOString();
      company.subscriptionPrice = plan === 'trial' ? 1 : plan === 'monthly' ? 799 : 4999;
      if (plan === 'trial') company.hasUsedTrial = true;
      
      const owner = d.users.find((u) => u.id === company.ownerId);
      appendActivity(d, {
        type: 'subscription_started',
        userId: owner?.id ?? company.ownerId,
        userName: company.ownerName,
        userRole: 'owner',
        companyId: company.id,
        companyName: company.name,
        message: `${company.name} subscribed to ${plan} plan`,
      });
      persist(d);
    }
  }, [data, persist]);

  const removeCompany = useCallback((companyId: string, password: string): boolean => {
    const company = data.companies.find((c) => c.id === companyId);
    if (!company || company.ownerPassword !== password) return false;
    const d = { ...data };
    d.companies = d.companies.filter((c) => c.id !== companyId);
    d.admins = d.admins.filter((a) => a.companyId !== companyId);
    d.workers = d.workers.filter((w) => w.companyId !== companyId);
    d.tasks = d.tasks.filter((t) => t.companyId !== companyId);
    d.leaves = d.leaves.filter((l) => l.companyId !== companyId);
    d.payments = d.payments.filter((p) => p.companyId !== companyId);
    if (d.currentCompanyId === companyId) d.currentCompanyId = d.companies[0]?.id || null;
    persist(d);
    return true;
  }, [data, persist]);

  const removeCompanyAsSuperAdmin = useCallback((companyId: string) => {
    const d = { ...data };
    d.companies = d.companies.filter((c) => c.id !== companyId);
    d.admins = d.admins.filter((a) => a.companyId !== companyId);
    d.workers = d.workers.filter((w) => w.companyId !== companyId);
    d.users = d.users.filter((u) => u.companyId !== companyId);
    d.tasks = d.tasks.filter((t) => t.companyId !== companyId);
    d.leaves = d.leaves.filter((l) => l.companyId !== companyId);
    d.payments = d.payments.filter((p) => p.companyId !== companyId);
    d.messages = d.messages.filter((m) => m.companyId !== companyId);
    d.dailyRevenue = d.dailyRevenue.filter((r) => r.companyId !== companyId);
    if (d.currentCompanyId === companyId) d.currentCompanyId = null;
    setData(d); // Update UI immediately
    persist(d);
  }, [data, persist]);

  const removeUserAsSuperAdmin = useCallback((userId: string): boolean => {
    const user = data.users.find((u) => u.id === userId);
    if (!user || user.role === 'superadmin') return false;

    const d = { ...data };

    if (user.role === 'admin') {
      d.admins = d.admins.filter((a) => a.userId !== userId);
    } else if (user.role === 'worker') {
      const worker = d.workers.find((w) => w.userId === userId);
      if (worker) {
        d.workers = d.workers.filter((w) => w.id !== worker.id);
        d.tasks = d.tasks.filter((t) => t.workerId !== worker.id);
        d.leaves = d.leaves.filter((l) => l.workerId !== worker.id);
        d.payments = d.payments.filter((p) => p.workerId !== worker.id);
      }
    } else if (user.role === 'owner') {
      const companyIds = d.companies.filter((c) => c.ownerId === userId).map((c) => c.id);
      companyIds.forEach((companyId) => {
        d.companies = d.companies.filter((c) => c.id !== companyId);
        d.admins = d.admins.filter((a) => a.companyId !== companyId);
        d.workers = d.workers.filter((w) => w.companyId !== companyId);
        d.tasks = d.tasks.filter((t) => t.companyId !== companyId);
        d.leaves = d.leaves.filter((l) => l.companyId !== companyId);
        d.payments = d.payments.filter((p) => p.companyId !== companyId);
        d.users = d.users.filter((u) => u.companyId !== companyId); // Remove all users of this company
        if (d.currentCompanyId === companyId) d.currentCompanyId = null;
      });
    }

    d.users = d.users.filter((u) => u.id !== userId);
    d.notifications = d.notifications.filter((n) => n.userId !== userId);
    if (d.currentUserId === userId) {
      d.currentUserId = null;
      d.currentCompanyId = null;
    }

    setData(d); // Update UI immediately
    persist(d);
    return true;
  }, [data, persist]);

  const addAdmin = useCallback((adminData: Omit<Admin, 'id' | 'createdAt' | 'userId'> & { password: string }): Admin | null => {
    const email = assertValidEmailFormat(adminData.email);
    if (data.users.some((u) => u.email.toLowerCase() === email)) {
      return null;
    }
    if (adminData.phone && data.users.some((u) => u.phone === adminData.phone)) {
      return null;
    }
    const user: User = {
      id: generateId(),
      email,
      password: adminData.password,
      name: adminData.name,
      role: 'admin',
      companyId: adminData.companyId,
      phone: adminData.phone,
      createdAt: new Date().toISOString(),
    };
    const admin: Admin = {
      id: generateId(),
      companyId: adminData.companyId,
      name: adminData.name,
      email,
      phone: adminData.phone,
      role: adminData.role as AdminRole,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    const d = { ...data };
    d.users.push(user);
    d.admins.push(admin);
    appendNotification(d, {
      userId: user.id,
      title: 'Account Registered',
      message: `Your admin account is ready. Login with email: ${adminData.email} and the password shared by your owner.`,
      type: 'general',
    });
    const company = d.companies.find((c) => c.id === adminData.companyId);
    appendActivity(d, {
      type: 'admin_added',
      userId: user.id,
      userName: admin.name,
      userRole: 'admin',
      companyId: company?.id,
      companyName: company?.name,
      message: `Admin ${admin.name} was added to ${company?.name ?? 'a company'}`,
    });
    persist(d);
    
    // SEND WELCOME EMAIL WITH PASSWORD
    void sendWelcomeEmail(adminData.email, adminData.name, adminData.password);
    
    return admin;
  }, [data, persist]);

  const updateAdmin = useCallback((id: string, updates: Partial<Admin>) => {
    const d = { ...data };
    const idx = d.admins.findIndex((a) => a.id === id);
    if (idx >= 0) {
      const admin = d.admins[idx];
      const nextEmail = updates.email ? assertValidEmailFormat(updates.email) : undefined;
      if (nextEmail && d.users.some((u) => u.email.toLowerCase() === nextEmail && u.id !== admin.userId)) {
        return false;
      }
      d.admins[idx] = { ...admin, ...updates, ...(nextEmail ? { email: nextEmail } : {}) };
      const user = d.users.find((u) => u.id === admin.userId);
      if (user) {
        if (updates.name) user.name = updates.name;
        if (nextEmail) user.email = nextEmail;
        if (updates.phone) user.phone = updates.phone;
      }
    }
    persist(d);
    return true;
  }, [data, persist]);

  const deleteAdmin = useCallback((id: string) => {
    const admin = data.admins.find((a) => a.id === id);
    if (admin) {
      const d = { ...data };
      d.users = d.users.filter((u) => u.id !== admin.userId);
      d.admins = d.admins.filter((a) => a.id !== id);
      persist(d);
    }
  }, [data, persist]);

  const addWorker = useCallback((workerData: Omit<Worker, 'id' | 'createdAt' | 'userId' | 'attendanceStatus'> & { password: string }): Worker | null => {
    const email = assertValidEmailFormat(workerData.email);
    if (data.users.some(u => u.email.toLowerCase() === email)) return null;

    const user: User = {
      id: generateId(),
      email,
      password: workerData.password,
      name: workerData.name,
      role: 'worker',
      companyId: workerData.companyId,
      phone: workerData.phone,
      createdAt: new Date().toISOString(),
    };
    const worker: Worker = {
      id: generateId(),
      companyId: workerData.companyId,
      name: workerData.name,
      email,
      phone: workerData.phone,
      department: workerData.department,
      designation: workerData.designation,
      joiningDate: workerData.joiningDate,
      userId: user.id,
      attendanceStatus: 'present',
      createdAt: new Date().toISOString(),
    };

    setData(current => {
      if (current.users.some(u => u.email.toLowerCase() === email)) return current;
      const d = { ...current, users: [...current.users, user], workers: [...current.workers, worker] };
      
      appendNotification(d, {
        userId: user.id,
        title: 'Account Registered',
        message: `Your worker account is ready. Login with email: ${workerData.email}`,
        type: 'general',
      });
      const company = d.companies.find(c => c.id === workerData.companyId);
      appendActivity(d, {
        type: 'worker_added',
        userId: user.id,
        userName: worker.name,
        userRole: 'worker',
        companyId: company?.id,
        companyName: company?.name,
        message: `Worker ${worker.name} was added to ${company?.name || 'company'}`,
      });
      persist(d);
      return d;
    });

    void sendWelcomeEmail(workerData.email, workerData.name, workerData.password);
    return worker;
  }, [data.users, persist]);



  const updateWorker = useCallback((id: string, updates: Partial<Worker>) => {
    const d = { ...data };
    const idx = d.workers.findIndex((w) => w.id === id);
    if (idx >= 0) {
      const worker = d.workers[idx];
      const nextEmail = updates.email ? assertValidEmailFormat(updates.email) : undefined;
      if (nextEmail && d.users.some((u) => u.email.toLowerCase() === nextEmail && u.id !== worker.userId)) {
        return false;
      }
      d.workers[idx] = { ...worker, ...updates, ...(nextEmail ? { email: nextEmail } : {}) };
      const user = d.users.find((u) => u.id === worker.userId);
      if (user) {
        if (updates.name) user.name = updates.name;
        if (nextEmail) user.email = nextEmail;
        if (updates.phone) user.phone = updates.phone;
      }
    }
    persist(d);
    return true;
  }, [data, persist]);

  const deleteWorker = useCallback((id: string) => {
    const worker = data.workers.find((w) => w.id === id);
    if (worker) {
      const d = { ...data };
      d.users = d.users.filter((u) => u.id !== worker.userId);
      d.workers = d.workers.filter((w) => w.id !== id);
      d.tasks = d.tasks.filter((t) => t.workerId !== id);
      d.leaves = d.leaves.filter((l) => l.workerId !== id);
      d.payments = d.payments.filter((p) => p.workerId !== id);
      setData(d);
      persist(d);
    }
  }, [data, persist]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const task: Task = { ...taskData, id: generateId(), status: 'pending', createdAt: new Date().toISOString() };
    const d = { ...data };
    d.tasks.push(task);
    const worker = d.workers.find((w) => w.id === task.workerId);
    if (worker) {
      appendNotification(d, { userId: worker.userId, title: 'New Task Assigned', message: `You have been assigned: ${task.title}`, type: 'task' });
    }
    persist(d);
    return task;
  }, [data, persist]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const d = { ...data };
    const idx = d.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      const oldTask = d.tasks[idx];
      d.tasks[idx] = { ...oldTask, ...updates };
      const task = d.tasks[idx];
      const worker = d.workers.find((w) => w.id === task.workerId);
      if (worker && updates.status === 'completed') {
        const admins = d.admins.filter((a) => a.companyId === task.companyId);
        admins.forEach((a) => appendNotification(d, { userId: a.userId, title: 'Task Completed', message: `${worker.name} completed: ${task.title}`, type: 'task' }));
        const company = d.companies.find((c) => c.id === task.companyId);
        if (company) {
          const ownerUser = d.users.find((u) => u.id === company.ownerId);
          if (ownerUser) appendNotification(d, { userId: ownerUser.id, title: 'Task Completed', message: `${worker.name} completed: ${task.title}`, type: 'task' });
        }
      }
      if (worker && updates.title) {
        appendNotification(d, { userId: worker.userId, title: 'Task Updated', message: `Task "${task.title}" has been updated`, type: 'task' });
      }
    }
    persist(d);
  }, [data, persist]);

  const deleteTask = useCallback((id: string) => {
    const d = { ...data };
    d.tasks = d.tasks.filter((t) => t.id !== id);
    persist(d);
  }, [data, persist]);

  const applyLeave = useCallback((leaveData: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const leave: LeaveRequest = { ...leaveData, id: generateId(), status: 'pending', createdAt: new Date().toISOString() };
    const d = { ...data };
    d.leaves.push(leave);
    const worker = d.workers.find((w) => w.id === leave.workerId);
    const admins = d.admins.filter((a) => a.companyId === leave.companyId);
    admins.forEach((a) => appendNotification(d, { userId: a.userId, title: 'New Leave Request', message: `${worker?.name || 'Worker'} requested leave`, type: 'leave' }));
    const company = d.companies.find((c) => c.id === leave.companyId);
    if (company) {
      const ownerUser = d.users.find((u) => u.id === company.ownerId);
      if (ownerUser) appendNotification(d, { userId: ownerUser.id, title: 'New Leave Request', message: `${worker?.name || 'Worker'} requested leave`, type: 'leave' });
    }
    persist(d);
    return leave;
  }, [data, persist]);

  const updateLeave = useCallback((id: string, status: LeaveStatus) => {
    const d = { ...data };
    const idx = d.leaves.findIndex((l) => l.id === id);
    if (idx >= 0) {
      d.leaves[idx].status = status;
      const leave = d.leaves[idx];
      const worker = d.workers.find((w) => w.id === leave.workerId);
      if (worker) {
        appendNotification(d, {
          userId: worker.userId,
          title: status === 'approved' ? 'Leave Approved' : 'Leave Rejected',
          message: `Your leave request for ${leave.leaveDate} has been ${status}`,
          type: 'leave',
        });
      }
    }
    persist(d);
  }, [data, persist]);

  const addPayment = useCallback((paymentData: Omit<Payment, 'id' | 'createdAt' | 'status'>) => {
    const payment: Payment = { ...paymentData, id: generateId(), status: 'due', createdAt: new Date().toISOString() };
    const d = { ...data, payments: [...data.payments, payment] };
    persist(d);
    return payment;
  }, [data, persist]);

  const markPaymentPaid = useCallback((id: string) => {
    const d = { ...data };
    const idx = d.payments.findIndex((p) => p.id === id);
    if (idx >= 0) {
      d.payments[idx].status = 'paid';
      d.payments[idx].paidDate = new Date().toISOString().split('T')[0];
      d.payments[idx].transactionId = generateTransactionId();
      const payment = d.payments[idx];
      const worker = d.workers.find((w) => w.id === payment.workerId);
      if (worker) {
        appendNotification(d, { userId: worker.userId, title: 'Salary Paid', message: `₹${payment.amount} has been paid to your account`, type: 'payment' });
      }
    }
    persist(d);
  }, [data, persist]);

  const markNotificationRead = useCallback((id: string) => {
    const d = { ...data };
    const notif = d.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    persist(d);
  }, [data, persist]);

  const markAllNotificationsRead = useCallback((userId: string) => {
    const d = { ...data };
    d.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    persist(d);
  }, [data, persist]);

  const updateSettings = useCallback((settings: Partial<AppData['settings']>) => {
    const d = { ...data, settings: { ...data.settings, ...settings } };
    persist(d);
  }, [data, persist]);

  const changePassword = useCallback((userId: string, oldPassword: string, newPassword: string): boolean => {
    const d = { ...data };
    const user = d.users.find((u) => u.id === userId);
    if (!user || user.password !== oldPassword) return false;
    user.password = newPassword;
    persist(d);
    return true;
  }, [data, persist]);
  
  const forgotPasswordReset = useCallback(async (email: string, newPassword: string): Promise<boolean> => {
    const fresh = await refresh();
    const d = { ...fresh };
    const user = d.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return false;
    user.password = newPassword;
    setData(d);
    await persist(d);
    return true;
  }, [refresh, persist]);
  
  const verifyHostPassword = useCallback((password: string): boolean => {
    return matchesSuperAdminLogin(SUPER_ADMIN_EMAIL, password);
  }, []);

  const updateMonthlyRevenue = useCallback((companyId: string, amount: number) => {
    const d = { ...data };
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
  }, [data, persist]);

  const updateCompany = useCallback((id: string, updates: Partial<Company>): boolean => {
    const d = { ...data };
    const idx = d.companies.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    const nextEmail = updates.email ? assertValidEmailFormat(updates.email) : undefined;
    d.companies[idx] = { ...d.companies[idx], ...updates, ...(nextEmail ? { email: nextEmail } : {}) };
    const company = d.companies[idx];
    const owner = d.users.find((u) => u.id === company.ownerId);
    if (owner) {
      if (updates.ownerName) owner.name = updates.ownerName;
      if (updates.phone) owner.phone = updates.phone;
    }
    persist(d);
    return true;
  }, [data, persist]);

  const getCompanyWorkers = useCallback((companyId: string) => data.workers.filter((w) => w.companyId === companyId), [data.workers]);
  const getCompanyTasks = useCallback((companyId: string) => data.tasks.filter((t) => t.workerId && data.workers.find(w => w.id === t.workerId)?.companyId === companyId), [data.tasks, data.workers]);
  const getCompanyPayments = useCallback((companyId: string) => data.payments.filter((p) => p.companyId === companyId), [data.payments]);
  const getCompanyLeaves = useCallback((companyId: string) => data.leaves.filter((l) => l.companyId === companyId), [data.leaves]);
  const getCompanyMessages = useCallback((companyId: string) => data.messages.filter((m) => m.companyId === companyId), [data.messages]);
  const getUserNotifications = useCallback((userId: string) => data.notifications.filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [data.notifications]);

  const sendMessage = useCallback(async (content: string) => {
    // We use a functional update and a promise-based save to ENSURE no race conditions
    setData(current => {
      const user = current.users.find((u) => u.id === current.currentUserId);
      if (!user) return current;
      
      const companyId = current.currentCompanyId || user.companyId || (user.role === 'owner' ? current.companies.find(c => c.ownerId === user.id)?.id : null);
      if (!companyId) return current;

      const newMessage: CommunicationMessage = {
        id: generateId(),
        companyId,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        content,
        createdAt: new Date().toISOString(),
      };

      const updated = { ...current, messages: [...current.messages, newMessage] };

      // Handle AI Mentions if applicable
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('@ai') || lowerContent.includes('@chatgpt')) {
        void persist(updated); // Save the user's message right away

        // Async IIFE to fetch AI response without blocking
        (async () => {
          try {
            const currentUserName = current.users.find(u => u.id === current.currentUserId)?.name;
            const company = current.companies.find(c => c.id === companyId);
            
            const companyWorkers = current.workers.filter(w => w.companyId === company?.id).map(w => ({ name: w.name, designation: w.designation, status: w.attendanceStatus }));
            const companyTasks = current.tasks.filter(t => current.workers.find(w => w.id === t.workerId)?.companyId === company?.id).map(t => ({ title: t.title, status: t.status }));
            const companyRevenue = current.dailyRevenue.filter(r => r.companyId === company?.id);
            const totalRevenue = companyRevenue.reduce((sum, r) => sum + r.amount, 0);
             
            const contextData = {
               companyName: company?.name,
               userAsking: currentUserName,
               totalWorkers: companyWorkers.length,
               workersList: companyWorkers,
               totalTasks: companyTasks.length,
               tasksSummary: companyTasks,
               totalRevenue: `₹${totalRevenue}`,
               recentGroupChat: current.messages.filter(m => m.companyId === companyId).slice(-10).map(m => `${m.senderName}: ${m.content}`)
            };

            const aiResponseText = await generateAIResponse(content, contextData);

            setData(latest => {
              const aiMessage: CommunicationMessage = {
                id: generateId(),
                companyId,
                senderId: 'ai-assistant',
                senderName: 'WorkForce AI',
                senderRole: 'admin',
                content: aiResponseText,
                createdAt: new Date().toISOString(),
              };
              const withAi = { ...latest, messages: [...latest.messages, aiMessage] };
              void persist(withAi);
              return withAi;
            });
          } catch (e) {
            console.error("AI Group Chat Error", e);
          }
        })();
      } else {
        void persist(updated);
      }

      return updated;
    });
  }, [persist]);




  const sendPrivateMessage = useCallback((receiverId: string, content: string) => {
    if (!data.currentUserId) return;
    const newMessage: PrivateMessage = {
      id: generateId(),
      senderId: data.currentUserId,
      receiverId,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const d = { ...data, privateMessages: [...data.privateMessages, newMessage] };
    persist(d);
  }, [data, persist]);

  const editMessage = useCallback((id: string, content: string) => {
    const d = { ...data };
    const msg = d.messages.find(m => m.id === id);
    if (msg && msg.senderId === data.currentUserId) {
      msg.content = content;
      msg.updatedAt = new Date().toISOString();
      persist(d);
    }
  }, [data, persist]);

  const deleteMessage = useCallback((id: string) => {
    const d = { ...data };
    const msg = d.messages.find(m => m.id === id);
    if (msg && (msg.senderId === data.currentUserId || data.users.find(u => u.id === data.currentUserId)?.role === 'owner')) {
      msg.content = 'This message was deleted';
      msg.isDeleted = true;
      msg.updatedAt = new Date().toISOString();
      persist(d);
    }
  }, [data, persist]);

  const editPrivateMessage = useCallback((id: string, content: string) => {
    const d = { ...data };
    const msg = d.privateMessages.find(m => m.id === id);
    if (msg && msg.senderId === data.currentUserId) {
      msg.content = content;
      msg.updatedAt = new Date().toISOString();
      persist(d);
    }
  }, [data, persist]);

  const deletePrivateMessage = useCallback((id: string) => {
    const d = { ...data };
    const msg = d.privateMessages.find(m => m.id === id);
    if (msg && msg.senderId === data.currentUserId) {
      msg.content = 'This message was deleted';
      msg.isDeleted = true;
      msg.updatedAt = new Date().toISOString();
      persist(d);
    }
  }, [data, persist]);

  const getPrivateMessages = useCallback((userId: string, contactId: string) => {
    return data.privateMessages.filter(m => 
      (m.senderId === userId && m.receiverId === contactId) || 
      (m.senderId === contactId && m.receiverId === userId)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [data.privateMessages]);

  const getPrivateContacts = useCallback((userId: string) => {
    const user = data.users.find(u => u.id === userId);
    if (!user) return [];
    
    const companyId = user.companyId || (user.role === 'owner' ? data.companies.find(c => c.ownerId === user.id)?.id : null);
    if (!companyId) return [];

    if (user.role === 'worker') {
      const company = data.companies.find(c => c.id === companyId);
      const companyAdmins = data.admins.filter(a => a.companyId === companyId).map(a => a.userId);
      const ownerId = company?.ownerId;
      return data.users.filter(u => (companyAdmins.includes(u.id) || u.id === ownerId) && u.id !== userId);
    } else {
      const companyAdmins = data.admins.filter(a => a.companyId === companyId).map(a => a.userId);
      const companyWorkers = data.workers.filter(w => w.companyId === companyId).map(w => w.userId);
      const company = data.companies.find(c => c.id === companyId);
      return data.users.filter(u => 
        (companyAdmins.includes(u.id) || companyWorkers.includes(u.id) || u.id === company?.ownerId) && 
        u.id !== userId
      );
    }
  }, [data.users, data.admins, data.workers, data.companies]);

  const markPrivateMessageRead = useCallback((messageId: string) => {
    const d = { ...data };
    const idx = d.privateMessages.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      d.privateMessages[idx] = { ...d.privateMessages[idx], read: true };
      persist(d);
    }
  }, [data, persist]);

  const addDailyRevenue = useCallback((amount: number, date: string, notes?: string) => {
    const user = data.users.find(u => u.id === data.currentUserId);
    const companyId = data.currentCompanyId || user?.companyId || (user?.role === 'owner' ? data.companies.find(c => c.ownerId === user?.id)?.id : null);
    if (!companyId) return;

    const newRev: DailyRevenue = {
      id: generateId(),
      companyId,
      amount,
      date,
      notes,
      createdAt: new Date().toISOString(),
    };
    const d = { ...data, dailyRevenue: [...data.dailyRevenue, newRev] };
    persist(d);
  }, [data, persist]);

  const getDailyRevenue = useCallback((companyId: string) => {
    return data.dailyRevenue.filter(r => r.companyId === companyId);
  }, [data.dailyRevenue]);

  const getUnreadPrivateCount = useCallback((userId: string) => {
    return data.privateMessages.filter(m => m.receiverId === userId && !m.read).length;
  }, [data.privateMessages]);

  const getUnreadCommunicationCount = useCallback((userId: string) => {
    const user = data.users.find(u => u.id === userId);
    if (!user) return 0;
    const companyId = user.companyId || (user.role === 'owner' ? data.companies.find(c => c.ownerId === user.id)?.id : null);
    if (!companyId) return 0;
    
    const companyMessages = data.messages.filter(m => m.companyId === companyId);
    if (!user.lastCommunicationReadAt) return companyMessages.length;
    
    return companyMessages.filter(m => new Date(m.createdAt) > new Date(user.lastCommunicationReadAt!)).length;
  }, [data.messages, data.users, data.companies]);

  const markAllCommunicationRead = useCallback((userId: string) => {
    const d = { ...data };
    const idx = d.users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      d.users[idx] = { ...d.users[idx], lastCommunicationReadAt: new Date().toISOString() };
      persist(d);
    }
  }, [data, persist]);

  const startTrial = useCallback((companyId: string) => {
    const d = { ...data };
    const idx = d.companies.findIndex(c => c.id === companyId);
    if (idx >= 0) {
      const trialEndDate = new Date();
      trialEndDate.setMonth(trialEndDate.getMonth() + 1);
      d.companies[idx] = {
        ...d.companies[idx],
        subscription: 'trial',
        subscriptionDate: new Date().toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        subscriptionPrice: 1, // Trial price is ₹1
        hasUsedTrial: true,
      };
      persist(d);
    }
  }, [data, persist]);

  const confirmPhone = useCallback((userId: string) => {
    const d = { ...data };
    const idx = d.users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      d.users[idx] = { ...d.users[idx], phoneVerified: true };
      persist(d);
    }
  }, [data, persist]);

  const updateCompanySubscription = useCallback((id: string, plan: SubscriptionPlan | null, days?: number) => {
    const d = { ...data };
    const company = d.companies.find(c => c.id === id);
    if (company) {
      company.subscription = plan;
      company.subscriptionDate = plan ? new Date().toISOString() : null;
      
      if (plan === 'trial') {
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + (days || 30));
        company.trialEndDate = trialEndDate.toISOString();
        company.hasUsedTrial = true;
      } else {
        company.trialEndDate = undefined;
      }
      
      persist(d);
    }
  }, [data, persist]);

  return (
    <DataContext.Provider value={{
      ...data,
      syncState,
      syncError,
      refresh,
      login,
      register,
      logout,
      setCurrentCompany,
      createCompany,
      subscribe,
      removeCompany,
      removeCompanyAsSuperAdmin,
      removeUserAsSuperAdmin,
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
      forgotPasswordReset,
      verifyHostPassword,
      updateCompany,
      updateMonthlyRevenue,
      isEmailTaken,
      getCompanyWorkers,
      getCompanyTasks,
      getCompanyPayments,
      getCompanyLeaves,
      getCompanyMessages,
      getUserNotifications,
      sendMessage,
      sendPrivateMessage,
      getPrivateMessages,
      getPrivateContacts,
      markPrivateMessageRead,
      addDailyRevenue,
      getDailyRevenue,
      getUnreadPrivateCount,
      getUnreadCommunicationCount,
      markAllCommunicationRead,
      startTrial,
      confirmPhone,
      editMessage,
      deleteMessage,
      editPrivateMessage,
      deletePrivateMessage,
      updateCompanySubscription,
    }}>
      {!loading && children}
      {loading && (
        <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--primary)] border-t-transparent animate-spin" />
            <p className="text-[var(--text-muted)] animate-pulse">Synchronizing Data...</p>
          </div>
        </div>
      )}
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
