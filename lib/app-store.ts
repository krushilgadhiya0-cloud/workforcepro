import { head, put } from '@vercel/blob';
import type { AppData } from '../src/types';
import { mergeAppData, normalizeAppData } from './data-sync';
import { getKvStore, getRedisEnvStatus, isKvConfigured } from './kv-store';

const KV_KEY = 'workforce:app-data';
const BLOB_PATH = 'workforce-app-data.json';

export type StorageBackend = 'redis' | 'blob' | 'none';

export function getStorageBackend(): StorageBackend {
  if (isKvConfigured()) return 'redis';
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'blob';
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
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
}

async function loadFromRedis(): Promise<AppData | null> {
  const kv = getKvStore();
  const data = await kv.get(KV_KEY);
  return data ? normalizeAppData(data as object) : null;
}

async function saveToRedis(data: AppData): Promise<AppData> {
  const kv = getKvStore();
  const existing = await kv.get(KV_KEY);
  const merged = mergeAppData(
    existing ? normalizeAppData(existing as object) : {},
    data,
  );
  await kv.set(KV_KEY, merged);
  return merged;
}

async function loadFromBlob(): Promise<AppData | null> {
  try {
    const meta = await head(BLOB_PATH);
    const res = await fetch(meta.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return normalizeAppData(await res.json());
  } catch {
    return null;
  }
}

async function saveToBlob(data: AppData): Promise<AppData> {
  const existing = await loadFromBlob();
  const merged = mergeAppData(existing ?? {}, data);
  await put(BLOB_PATH, JSON.stringify(merged), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return merged;
}

export async function loadStoredAppData(): Promise<AppData | null> {
  const backend = getStorageBackend();
  if (backend === 'redis') return loadFromRedis();
  if (backend === 'blob') return loadFromBlob();
  return null;
}

export async function saveStoredAppData(data: AppData): Promise<AppData> {
  const backend = getStorageBackend();
  if (backend === 'redis') return saveToRedis(data);
  if (backend === 'blob') return saveToBlob(data);
  throw new Error('No cloud storage configured. Add Redis or Blob storage in Vercel and redeploy.');
}
