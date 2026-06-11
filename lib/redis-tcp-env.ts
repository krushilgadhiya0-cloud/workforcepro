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
