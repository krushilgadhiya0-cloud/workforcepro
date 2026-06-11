import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mergeAppData, normalizeAppData } from '../lib/data-sync.js';
import { getKvStore, isKvConfigured } from '../lib/kv-store.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

const DATA_KEY = 'workforce:app-data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isKvConfigured()) {
    return res.status(503).json({
      error: 'Redis is not configured. Add a Redis database in Vercel Storage and redeploy.',
    });
  }

  try {
    const kv = getKvStore();

    if (req.method === 'GET') {
      const data = await kv.get(DATA_KEY);
      return res.status(200).json(data ? normalizeAppData(data as object) : null);
    }

    const existing = await kv.get(DATA_KEY);
    const merged = mergeAppData(
      existing ? normalizeAppData(existing as object) : {},
      normalizeAppData(req.body ?? {}),
    );
    await kv.set(DATA_KEY, merged);
    return res.status(200).json({ ok: true, data: merged });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Data sync failed';
    return res.status(500).json({ error: message });
  }
}
