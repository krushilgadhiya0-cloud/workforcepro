import type { AppData } from '../src/types';

export const defaultAppData: AppData = {
  users: [],
  companies: [],
  admins: [],
  workers: [],
  tasks: [],
  leaves: [],
  payments: [],
  notifications: [],
  activities: [],
  messages: [],
  privateMessages: [],
  settings: {
    theme: 'light',
    emailNotifications: true,
    pushNotifications: true,
  },
  currentUserId: null,
  currentCompanyId: null,
};

function mergeById<T extends { id: string }>(base: T[], incoming: T[], syncMode: 'merge' | 'overwrite' = 'merge'): T[] {
  if (syncMode === 'overwrite') return incoming;
  
  const map = new Map<string, T>();
  for (const item of base) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
}

export function normalizeAppData(raw: Partial<AppData> | null | undefined): AppData {
  if (!raw) return { ...defaultAppData };
  return {
    ...defaultAppData,
    ...raw,
    users: raw.users ?? [],
    companies: (raw.companies ?? []).map((c) => ({
      ...c,
      monthlyRevenue: c.monthlyRevenue ?? 0,
      monthlyRevenueUpdatedAt: c.monthlyRevenueUpdatedAt ?? null,
    })),
    admins: raw.admins ?? [],
    workers: raw.workers ?? [],
    tasks: raw.tasks ?? [],
    leaves: raw.leaves ?? [],
    payments: raw.payments ?? [],
    notifications: raw.notifications ?? [],
    activities: raw.activities ?? [],
    messages: raw.messages ?? [],
    privateMessages: raw.privateMessages ?? [],
    settings: { ...defaultAppData.settings, ...raw.settings },
    currentUserId: raw.currentUserId ?? null,
    currentCompanyId: raw.currentCompanyId ?? null,
  };
}

/** Merge remote (base) with local changes (incoming). Incoming wins on id conflicts. */
export function mergeAppData(base: Partial<AppData>, incoming: Partial<AppData>, syncMode: 'merge' | 'overwrite' = 'merge'): AppData {
  const a = normalizeAppData(base);
  const b = normalizeAppData(incoming);

  const merged: AppData = {
    users: mergeById(a.users, b.users, syncMode),
    companies: mergeById(a.companies, b.companies, syncMode),
    admins: mergeById(a.admins, b.admins, syncMode),
    workers: mergeById(a.workers, b.workers, syncMode),
    tasks: mergeById(a.tasks, b.tasks, syncMode),
    leaves: mergeById(a.leaves, b.leaves, syncMode),
    payments: mergeById(a.payments, b.payments, syncMode),
    notifications: mergeById(a.notifications, b.notifications, syncMode),
    activities: mergeById(a.activities, b.activities, 'merge').sort(
      (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
    ),
    messages: mergeById(a.messages, b.messages, syncMode).sort(
      (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime(),
    ),
    privateMessages: mergeById(a.privateMessages, b.privateMessages, syncMode).sort(
      (x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime()
    ),
    settings: { ...a.settings, ...b.settings },
    currentUserId: b.currentUserId === undefined ? a.currentUserId : b.currentUserId,
    currentCompanyId: b.currentCompanyId === undefined ? a.currentCompanyId : b.currentCompanyId,
  };

  if (merged.activities.length > 500) {
    merged.activities = merged.activities.slice(0, 500);
  }

  return merged;
}

export function stripSession(data: AppData): AppData {
  return { ...data, currentUserId: null, currentCompanyId: null };
}
