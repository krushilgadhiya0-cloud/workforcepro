import { Redis } from '@upstash/redis';

const ENV_PAIRS: [string, string][] = [
  ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
  ['KV_REST_API_REDIS_URL', 'KV_REST_API_REDIS_TOKEN'],
  ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  ['REDIS_URL', 'REDIS_TOKEN'],
];

function tokenCandidatesForUrlKey(urlKey: string): string[] {
  const base = urlKey.replace(/_URL$/, '');
  return [
    `${base}_TOKEN`,
    `${base}_REST_TOKEN`,
    `${base}_READ_TOKEN`,
    urlKey.replace(/_REDIS_URL$/, '_REDIS_TOKEN'),
    urlKey.replace(/_REDIS_URL$/, '_REDIS_REST_TOKEN'),
    urlKey.replace(/_REST_API_REDIS_URL$/, '_REST_API_TOKEN'),
    urlKey.replace(/_REST_API_REDIS_URL$/, '_REST_API_REDIS_REST_TOKEN'),
  ];
}

function isTcpRedisUrl(value: string): boolean {
  return value.startsWith('redis://') || value.startsWith('rediss://');
}

function resolveRedisEnv(): { url: string; token: string } | null {
  for (const [urlKey, tokenKey] of ENV_PAIRS) {
    const url = process.env[urlKey]?.trim();
    const token = process.env[tokenKey]?.trim();
    if (url && token && !isTcpRedisUrl(url)) return { url, token };
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!value || !key.endsWith('_URL') || isTcpRedisUrl(value)) continue;
    for (const tokenKey of tokenCandidatesForUrlKey(key)) {
      const token = process.env[tokenKey]?.trim();
      if (token) return { url: value, token };
    }
  }

  return null;
}

let client: Redis | null = null;

export function getRedisEnvStatus(): { configured: boolean; urlKey: string | null; tokenKey: string | null } {
  for (const [urlKey, tokenKey] of ENV_PAIRS) {
    const url = process.env[urlKey];
    const token = process.env[tokenKey];
    if (url && token) return { configured: true, urlKey, tokenKey };
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!value || !key.endsWith('_URL')) continue;
    for (const tokenKey of tokenCandidatesForUrlKey(key)) {
      const token = process.env[tokenKey];
      if (token) return { configured: true, urlKey: key, tokenKey };
    }
  }

  const urlKey = Object.keys(process.env).find((k) => k.endsWith('_URL') && /redis|kv/i.test(k)) ?? null;
  return { configured: false, urlKey, tokenKey: null };
}

export function isKvConfigured(): boolean {
  return resolveRedisEnv() !== null;
}

export function getKvStore(): Redis {
  if (client) return client;
  const config = resolveRedisEnv();
  if (!config) {
    const status = getRedisEnvStatus();
    throw new Error(
      status.urlKey
        ? `Redis URL found (${status.urlKey}) but token is missing. Reconnect Redis in Vercel Storage and redeploy.`
        : 'Redis is not configured. Add Redis in Vercel Storage and connect it to this project.',
    );
  }
  client = new Redis({ url: config.url, token: config.token });
  return client;
}
