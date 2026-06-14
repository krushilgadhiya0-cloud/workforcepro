import type { AppData } from '../src/types';
import { mergeAppData, normalizeAppData } from './data-sync.js';
import { getKvStore, getRedisEnvStatus, isKvConfigured } from './kv-store.js';
import { isTcpRedisConfigured } from './redis-tcp-env.js';
import { ensureSuperAdminInData } from './super-admin.js';

const KV_KEY = 'workforce:app-data';
const BLOB_PATH = 'workforce-app-data.json';

export type StorageBackend = 'redis' | 'redis-tcp' | 'blob' | 'none';

export function getStorageBackend(): StorageBackend {
  // Always prioritize the fuchsia dog (REST) because it never crashes on Vercel
  if (isKvConfigured()) return 'redis';
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob';
  if (isTcpRedisConfigured()) return 'redis-tcp';
  return 'none';
}

export function getStorageStatus() {
  const backend = getStorageBackend();
  const redis = getRedisEnvStatus();
  return {
    backend,
    redis: {
      configured: redis.configured,
      urlKey: redis.urlKey,
      tokenKey: redis.tokenKey,
    },
    redisTcp: {
      configured: isTcpRedisConfigured(),
    },
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    superAdmin: Boolean(
      process.env.SUPER_ADMIN_EMAIL
      || process.env.VITE_SUPER_ADMIN_EMAIL,
    ),
  };
}

async function loadFromRestRedis(): Promise<AppData | null> {
  const kv = getKvStore();
  const data = await kv.get(KV_KEY);
  return data ? ensureSuperAdminInData(normalizeAppData(data as object)) : ensureSuperAdminInData(normalizeAppData(null));
}

async function saveToRestRedis(data: AppData): Promise<AppData> {
  const kv = getKvStore();
  const finalData = ensureSuperAdminInData(data);
  await kv.set(KV_KEY, finalData);
  return finalData;
}

async function loadFromTcpRedis(): Promise<AppData | null> {
  const { tcpRedisGet } = await import('./redis-tcp.js');
  const data = await tcpRedisGet<AppData>(KV_KEY);
  return data ? ensureSuperAdminInData(normalizeAppData(data)) : ensureSuperAdminInData(normalizeAppData(null));
}

async function saveToTcpRedis(data: AppData): Promise<AppData> {
  const { tcpRedisSet } = await import('./redis-tcp.js');
  const finalData = ensureSuperAdminInData(data);
  await tcpRedisSet(KV_KEY, finalData);
  return finalData;
}

async function loadFromBlob(): Promise<AppData | null> {
  try {
    const { head } = await import('@vercel/blob');
    const meta = await head(BLOB_PATH);
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) return ensureSuperAdminInData(normalizeAppData(null));
    return ensureSuperAdminInData(normalizeAppData(await res.json()));
  } catch {
    return null;
  }
}

async function saveToBlob(data: AppData): Promise<AppData> {
  const { put } = await import('@vercel/blob');
  const existing = await loadFromBlob();
  const merged = mergeAppData(existing ?? {}, ensureSuperAdminInData(data));
  await put(BLOB_PATH, JSON.stringify(merged), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return merged;
}

export async function loadStoredAppData(): Promise<AppData | null> {
  const backend = getStorageBackend();
  try {
    if (backend === 'redis') return await loadFromRestRedis();
    if (backend === 'redis-tcp') return await loadFromTcpRedis();
    if (backend === 'blob') return await loadFromBlob();
  } catch (error) {
    console.error('Storage load failed:', error);
    throw error;
  }
  return null;
}

export async function saveStoredAppData(data: AppData): Promise<AppData> {
  const backend = getStorageBackend();
  const stripped = { ...data, currentUserId: null, currentCompanyId: null };
  if (backend === 'redis') return saveToRestRedis(stripped);
  if (backend === 'redis-tcp') return saveToTcpRedis(stripped);
  if (backend === 'blob') return saveToBlob(stripped);
  throw new Error('No cloud storage configured. Connect Redis to your Vercel project and redeploy.');
}
