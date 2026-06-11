import type { AppData } from '../types';
import { defaultAppData, mergeAppData, normalizeAppData, stripSession } from '../../lib/data-sync';

const STORAGE_KEY = 'workforce_app_data';

export const SUPER_ADMIN_ID = 'super-admin-system';
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? '';
export const SUPER_ADMIN_PASSWORD = import.meta.env.VITE_SUPER_ADMIN_PASSWORD ?? '';

export const defaultData: AppData = defaultAppData;
export const API_URL = import.meta.env.VITE_API_URL || '/api/data';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline';

let lastSyncState: SyncState = 'idle';
let lastSyncError = '';

export function getSyncState(): { state: SyncState; error: string } {
  return { state: lastSyncState, error: lastSyncError };
}

function setSyncState(state: SyncState, error = '') {
  lastSyncState = state;
  lastSyncError = error;
}

function ensureSuperAdmin(data: AppData): AppData {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) return data;

  const idx = data.users.findIndex((u) => u.role === 'superadmin');
  if (idx === -1) {
    data.users.push({
      id: SUPER_ADMIN_ID,
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_PASSWORD,
      name: 'Super Admin',
      role: 'superadmin',
      createdAt: new Date().toISOString(),
    });
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
    }
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

type RemoteResult =
  | { ok: true; data: AppData | null }
  | { ok: false; error: string };

async function fetchRemoteData(): Promise<RemoteResult> {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const message = typeof body?.error === 'string'
        ? body.error
        : `Cloud sync unavailable (${res.status})`;
      return { ok: false, error: message };
    }

    if (body?.error) {
      return { ok: false, error: body.error };
    }

    if (body?.data && body.ok === true) {
      return { ok: true, data: normalizeAppData(body.data) };
    }

    return { ok: true, data: body ? normalizeAppData(body) : null };
  } catch {
    return { ok: false, error: 'Could not reach cloud storage. Check your connection and redeploy.' };
  }
}

export async function loadData(): Promise<AppData> {
  setSyncState('syncing');
  const local = getLocalData();
  const remote = await fetchRemoteData();

  let data: AppData;
  if (remote.ok) {
    data = remote.data
      ? mergeAppData(local, remote.data)
      : mergeAppData({}, local);
    setSyncState('synced');
  } else {
    data = local;
    setSyncState('offline', remote.error);
    console.warn('Cloud sync load failed:', remote.error);
  }

  data = stripSession(ensureSuperAdmin(data));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export async function syncFromServer(
  session: Pick<AppData, 'currentUserId' | 'currentCompanyId'>,
): Promise<AppData> {
  const loaded = await loadData();
  return { ...loaded, ...session };
}

export async function saveData(data: AppData): Promise<AppData> {
  setSyncState('syncing');
  const persisted = stripSession(data);
  const remote = await fetchRemoteData();

  let merged = persisted;
  if (remote.ok) {
    merged = mergeAppData(remote.data ?? {}, persisted);
  }

  const finalData = stripSession(ensureSuperAdmin(merged));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
    });
    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = typeof result?.error === 'string'
        ? result.error
        : `Cloud save failed (${res.status})`;
      setSyncState('offline', message);
      console.error('Failed to save to cloud:', message);
      return finalData;
    }

    if (result?.data) {
      const serverData = stripSession(normalizeAppData(result.data));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
      setSyncState('synced');
      return serverData;
    }

    setSyncState('synced');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cloud save failed';
    setSyncState('offline', message);
    console.error('Failed to save to cloud:', error);
  }

  return finalData;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateTransactionId(): string {
  return `TXN${Date.now().toString(36).toUpperCase()}`;
}
