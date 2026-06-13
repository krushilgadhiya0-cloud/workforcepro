import type { VercelRequest, VercelResponse } from '@vercel/node';
import { normalizeAppData } from '../lib/data-sync.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { getStorageBackend, getStorageStatus, loadStoredAppData, saveStoredAppData } = await import('../lib/app-store.js');
    const backend = getStorageBackend();

    if (backend === 'none') {
      return res.status(503).json({
        error: 'Cloud storage is not configured. Connect Redis to your Vercel project and redeploy.',
        status: getStorageStatus(),
      });
    }

    if (req.method === 'GET') {
      const data = await loadStoredAppData();
      return res.status(200).json(data);
    }

    const merged = await saveStoredAppData(normalizeAppData(req.body ?? {}));
    return res.status(200).json({ ok: true, data: merged, backend });
  } catch (error) {
    console.error('Vercel API Data Error:', error);
    const message = error instanceof Error ? error.message : 'Data sync failed';
    return res.status(500).json({ error: message });
  }
}
