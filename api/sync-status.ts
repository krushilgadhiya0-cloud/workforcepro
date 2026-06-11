import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStorageBackend, getStorageStatus } from '../lib/app-store.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const backend = getStorageBackend();
  return res.status(backend === 'none' ? 503 : 200).json({
    ok: backend !== 'none',
    backend,
    status: getStorageStatus(),
  });
}
