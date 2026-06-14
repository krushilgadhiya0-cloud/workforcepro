import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getKvStore } from '../lib/kv-store.js';
import { sendOtpEmail } from '../lib/email/gmail.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const kv = getKvStore();

  try {
    // Store OTP in Redis with 10 minute expiry
    await kv.set(`otp:${email}`, otp, { ex: 600 });
    
    // Send email
    const result = await sendOtpEmail(email, otp);
    
    if (result.success) {
      return res.status(200).json({ ok: true, message: 'OTP sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('OTP Send Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
