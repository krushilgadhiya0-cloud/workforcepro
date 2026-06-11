import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';
import { mergeAppData, normalizeAppData } from '../lib/data-sync.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

const DATA_KEY = 'workforce:app-data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    const missingKv = message.includes('KV') || message.includes('UPSTASH') || !process.env.KV_REST_API_URL;
    return res.status(missingKv ? 503 : 500).json({
      error: missingKv
        ? 'Vercel KV is not configured. Link a KV store in the Vercel project settings.'
        : message,
    });
  }
}
