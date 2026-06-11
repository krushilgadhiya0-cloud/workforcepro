import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { getStorageBackend, getStorageStatus } = await import('../lib/app-store.js');
    const backend = getStorageBackend();
    return res.status(backend === 'none' ? 503 : 200).json({
      ok: backend !== 'none',
      backend,
      status: getStorageStatus(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Status check failed';
    return res.status(500).json({ ok: false, error: message });
  }
}
