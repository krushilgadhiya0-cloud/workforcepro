import { head, put } from '@vercel/blob';
import type { AppData } from '../src/types';
import { mergeAppData, normalizeAppData } from './data-sync';
import { getKvStore, getRedisEnvStatus, isKvConfigured } from './kv-store';
import { getTcpRedisUrl, isTcpRedisConfigured, tcpRedisGet, tcpRedisSet } from './redis-tcp';

const KV_KEY = 'workforce:app-data';
const BLOB_PATH = 'workforce-app-data.json';

export type StorageBackend = 'redis' | 'redis-tcp' | 'blob' | 'none';

export function getStorageBackend(): StorageBackend {
  if (isKvConfigured()) return 'redis';
  if (isTcpRedisConfigured()) return 'redis-tcp';
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
    redisTcp: {
      configured: isTcpRedisConfigured(),
      urlKey: isTcpRedisConfigured() ? 'KV_REST_API_REDIS_URL or REDIS_URL' : null,
      urlType: getTcpRedisUrl()?.startsWith('rediss://') ? 'rediss' : 'redis',
    },
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
}

async function loadFromRestRedis(): Promise<AppData | null> {
  const kv = getKvStore();
  const data = await kv.get(KV_KEY);
  return data ? normalizeAppData(data as object) : null;
}

async function saveToRestRedis(data: AppData): Promise<AppData> {
  const kv = getKvStore();
  const existing = await kv.get(KV_KEY);
  const merged = mergeAppData(
    existing ? normalizeAppData(existing as object) : {},
    data,
  );
  await kv.set(KV_KEY, merged);
  return merged;
}

async function loadFromTcpRedis(): Promise<AppData | null> {
  const data = await tcpRedisGet<AppData>(KV_KEY);
  return data ? normalizeAppData(data) : null;
}

async function saveToTcpRedis(data: AppData): Promise<AppData> {
  const existing = await loadFromTcpRedis();
  const merged = mergeAppData(existing ?? {}, data);
  await tcpRedisSet(KV_KEY, merged);
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
  if (backend === 'redis') return loadFromRestRedis();
  if (backend === 'redis-tcp') return loadFromTcpRedis();
  if (backend === 'blob') return loadFromBlob();
  return null;
}

export async function saveStoredAppData(data: AppData): Promise<AppData> {
  const backend = getStorageBackend();
  if (backend === 'redis') return saveToRestRedis(data);
  if (backend === 'redis-tcp') return saveToTcpRedis(data);
  if (backend === 'blob') return saveToBlob(data);
  throw new Error('No cloud storage configured. Connect Redis to your Vercel project and redeploy.');
}
