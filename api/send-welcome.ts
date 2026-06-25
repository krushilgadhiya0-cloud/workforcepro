import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendWelcomeEmail } from '../lib/email/gmail.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, name, password } = req.body;
  
  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Email and name are required' });
  }

  try {
    const result = await sendWelcomeEmail(email, name, password);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
