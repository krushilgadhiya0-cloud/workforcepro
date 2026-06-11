import type { AppData } from '../types';
import { defaultAppData, mergeAppData, normalizeAppData, stripSession } from '../../lib/data-sync';

const STORAGE_KEY = 'workforce_app_data';

export const SUPER_ADMIN_ID = 'super-admin-system';
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? '';
export const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD ?? '';

export const defaultData: AppData = defaultAppData;

export const API_URL = import.meta.env.VITE_API_URL || '/api/data';

function ensureSuperAdmin(data: AppData): AppData {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) return data;

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
  return data;
}

export function getLocalData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeAppData(JSON.parse(raw)) : { ...defaultData };
  } catch {
    return { ...defaultData };
  }
}

async function fetchRemoteData(): Promise<AppData | null> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) return null;
    const apiData = await res.json();
    return apiData ? normalizeAppData(apiData) : null;
  } catch {
    return null;
  }
}

export async function loadData(): Promise<AppData> {
  const remote = await fetchRemoteData();
  const local = getLocalData();
  const merged = remote ? mergeAppData(remote, local) : local;
  const data = stripSession(ensureSuperAdmin(merged));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stripSession(data)));
  return data;
}

export async function syncFromServer(
  session: Pick<AppData, 'currentUserId' | 'currentCompanyId'>,
): Promise<AppData> {
  const loaded = await loadData();
  return { ...loaded, ...session };
}

export async function saveData(data: AppData): Promise<AppData> {
  const persisted = stripSession(data);
  const remote = await fetchRemoteData();
  const merged = remote ? mergeAppData(remote, persisted) : persisted;
  const finalData = stripSession(ensureSuperAdmin(merged));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
    });
    if (res.ok) {
      const result = await res.json();
      if (result?.data) {
        const serverData = stripSession(normalizeAppData(result.data));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
        return serverData;
      }
    }
  } catch (error) {
    console.error('Failed to save to API:', error);
  }

  return finalData;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateTransactionId(): string {
  return `TXN${Date.now().toString(36).toUpperCase()}`;
}
