import Redis from 'ioredis';
import { getTcpRedisUrl } from './redis-tcp-env';

async function withTcpClient<T>(fn: (client: { get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<unknown> }) => Promise<T>): Promise<T> {
  const url = getTcpRedisUrl();
  if (!url) throw new Error('TCP Redis URL not configured');

  const client = new Redis(url);
  try {
    return await fn(client);
  } finally {
    await client.quit();
  }
}

export async function tcpRedisGet<T>(key: string): Promise<T | null> {
  const raw = await withTcpClient(async (client) => {
    return await client.get(key);
  });
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as T;
  }
}

export async function tcpRedisSet(key: string, value: unknown): Promise<void> {
  await withTcpClient(async (client) => {
    await client.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
}
