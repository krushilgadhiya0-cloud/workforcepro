import { Redis } from '@upstash/redis';

const ENV_PAIRS: [string, string][] = [
  ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
  ['KV_REST_API_REDIS_URL', 'KV_REST_API_REDIS_TOKEN'],
  ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
];

function resolveRedisEnv(): { url: string; token: string } | null {
  for (const [urlKey, tokenKey] of ENV_PAIRS) {
    const url = process.env[urlKey];
    const token = process.env[tokenKey];
    if (url && token) return { url, token };
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!value || !key.endsWith('_URL')) continue;
    const tokenKey = key.replace(/_URL$/, '_TOKEN');
    const token = process.env[tokenKey];
    if (token) return { url: value, token };
  }

  return null;
}

let client: Redis | null = null;

export function isKvConfigured(): boolean {
  return resolveRedisEnv() !== null;
}

export function getKvStore(): Redis {
  if (client) return client;
  const config = resolveRedisEnv();
  if (!config) {
    throw new Error(
      'Redis is not configured. In Vercel: Storage → Create Redis → connect to project → use prefix KV_REST_API → redeploy.',
    );
  }
  client = new Redis({ url: config.url, token: config.token });
  return client;
}
