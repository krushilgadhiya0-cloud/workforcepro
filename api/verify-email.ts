import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyEmailAddress } from '../lib/email/verify.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email : '';
  if (!email.trim()) {
    return res.status(400).json({ valid: false, message: 'Email is required' });
  }

  try {
    const result = await verifyEmailAddress(email);
    return res.status(result.valid ? 200 : 400).json(result);
  } catch {
    return res.status(500).json({ valid: false, message: 'Could not verify email right now. Try again.' });
  }
}
