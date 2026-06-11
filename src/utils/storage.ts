import type { AppData } from '../types';

const STORAGE_KEY = 'workforce_app_data';

export const SUPER_ADMIN_ID = 'super-admin-system';
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? '';
export const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD ?? '';

export const defaultData: AppData = {
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

  const idx = data.users.findIndex((u) => u.role === 'superadmin');
  let changed = false;

  if (idx === -1) {
    data.users.push({
      id: SUPER_ADMIN_ID,
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      name: 'Super Admin',
      role: 'superadmin',
      createdAt: new Date().toISOString(),
    });
    changed = true;
  } else {
    const admin = data.users[idx];
    if (
      admin.id !== SUPER_ADMIN_ID ||
      admin.email !== SUPER_ADMIN_EMAIL ||
      admin.password !== SUPER_ADMIN_PASSWORD
    ) {
      data.users[idx] = {
        ...admin,
        id: SUPER_ADMIN_ID,
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        role: 'superadmin',
      };
      changed = true;
    }
  }

  if (changed) {
    void saveData(data);
  }
  return migrateCompanies(data);
}

export const API_URL = `http://localhost:${import.meta.env.API_PORT || 3001}/api/data`;

export function getLocalData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultData, ...JSON.parse(raw) } : { ...defaultData };
  } catch {
    return { ...defaultData };
  }
}

function stripSession(data: AppData): AppData {
  return { ...data, currentUserId: null, currentCompanyId: null };
}

export async function loadData(): Promise<AppData> {
  try {
    const res = await fetch(API_URL);
    const apiData = await res.json();
    const data = migrateCompanies(apiData ? { ...defaultData, ...apiData } : getLocalData());
    return stripSession(ensureSuperAdmin(data));
  } catch (error) {
    console.error('Failed to load from API, falling back to local:', error);
    return stripSession(ensureSuperAdmin(migrateCompanies(getLocalData())));
  }
}

export async function saveData(data: AppData): Promise<void> {
  const persisted = stripSession(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  
  // Save to API for sync
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(persisted),
    });
  } catch (error) {
    console.error('Failed to save to API:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateTransactionId(): string {
  return `TXN${Date.now().toString(36).toUpperCase()}`;
}
