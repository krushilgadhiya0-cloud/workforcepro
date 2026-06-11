import { createClient, type RedisClientType } from 'redis';

const TCP_URL_KEYS = [
  'KV_REST_API_REDIS_URL',
  'REDIS_URL',
  'KV_URL',
];

export function getTcpRedisUrl(): string | null {
  for (const key of TCP_URL_KEYS) {
    const value = process.env[key]?.trim();
    if (value && (value.startsWith('redis://') || value.startsWith('rediss://'))) {
      return value;
    }
  }
  return null;
}

export function isTcpRedisConfigured(): boolean {
  return getTcpRedisUrl() !== null;
}

async function withTcpClient<T>(fn: (client: RedisClientType) => Promise<T>): Promise<T> {
  const url = getTcpRedisUrl();
  if (!url) throw new Error('TCP Redis URL not configured');

  const client = createClient({ url });
  client.on('error', () => {});
  await client.connect();
  try {
    return await fn(client as RedisClientType);
  } finally {
    await client.quit().catch(() => undefined);
  }
}

export async function tcpRedisGet<T>(key: string): Promise<T | null> {
  return withTcpClient(async (client) => {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  });
}

export async function tcpRedisSet(key: string, value: unknown): Promise<void> {
  await withTcpClient(async (client) => {
    await client.set(key, JSON.stringify(value));
  });
}
