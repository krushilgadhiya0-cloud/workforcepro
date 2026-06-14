import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getKvStore } from '../lib/kv-store.js';
import { sendWelcomeEmail } from '../lib/email/gmail.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email: rawEmail, otp, name } = req.body;
  if (!rawEmail || !otp) return res.status(400).json({ error: 'Missing information' });
  const email = rawEmail.toLowerCase().trim();

  const kv = getKvStore();

  try {
    const storedOtp = await kv.get(`otp:${email}`);
    
    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    if (storedOtp === otp) {
      // Clean up OTP
      await kv.del(`otp:${email}`);
      
      // If name is provided, send welcome email
      if (name) {
        await sendWelcomeEmail(email, name);
      }
      
      return res.status(200).json({ ok: true, message: 'OTP verified' });
    } else {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('OTP Verify Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
