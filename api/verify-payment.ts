import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleVerifyPayment } from '../lib/payments/handlers.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleVerifyPayment(req.body ?? {});
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed';
    const status = message.includes('not configured') ? 503 : 400;
    return res.status(status).json({ error: message });
  }
}
