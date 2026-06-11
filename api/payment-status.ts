import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPaymentStatus } from '../lib/payments/razorpay.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json(getPaymentStatus());
}
