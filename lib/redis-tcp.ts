import { getTcpRedisUrl } from './redis-tcp-env';

async function withTcpClient<T>(fn: (client: { get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<unknown> }) => Promise<T>): Promise<T> {
  const url = getTcpRedisUrl();
  if (!url) throw new Error('TCP Redis URL not configured');

  const { createClient } = await import('redis');
  const client = createClient({ url });
  client.on('error', () => {});
  await client.connect();
  try {
    return await fn(client);
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
