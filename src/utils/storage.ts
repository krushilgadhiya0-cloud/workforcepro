import type { AppData } from '../types';

const STORAGE_KEY = 'workforce_app_data';

export const SUPER_ADMIN_ID = 'super-admin-system';
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? '';
export const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD ?? '';

const defaultData: AppData = {
  users: [],
  companies: [],
  admins: [],
  workers: [],
  tasks: [],
  leaves: [],
  payments: [],
  notifications: [],
  settings: {
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
  },
  currentUserId: null,
  currentCompanyId: null,
};

function migrateCompanies(data: AppData): AppData {
  data.companies = data.companies.map((c) => ({
    ...c,
    monthlyRevenue: c.monthlyRevenue ?? 0,
    monthlyRevenueUpdatedAt: c.monthlyRevenueUpdatedAt ?? null,
  }));
  return data;
}

function ensureSuperAdmin(data: AppData): AppData {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) return migrateCompanies(data);

  const exists = data.users.some((u) => u.role === 'superadmin');
  if (!exists) {
    data.users.push({
      id: SUPER_ADMIN_ID,
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      name: 'Super Admin',
      role: 'superadmin',
      createdAt: new Date().toISOString(),
    });
    saveData(data);
  }
  return migrateCompanies(data);
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = migrateCompanies(raw ? { ...defaultData, ...JSON.parse(raw) } : { ...defaultData });
    return ensureSuperAdmin(data);
  } catch {
    return ensureSuperAdmin(migrateCompanies({ ...defaultData }));
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateTransactionId(): string {
  return `TXN${Date.now().toString(36).toUpperCase()}`;
}
