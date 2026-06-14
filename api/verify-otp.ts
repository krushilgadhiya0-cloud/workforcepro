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
    
    console.log(`Verifying OTP for ${email}:`);
    console.log(`- Provided: "${otp}" (Type: ${typeof otp})`);
    console.log(`- Stored: "${storedOtp}" (Type: ${typeof storedOtp})`);

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    // Convert both to string to be 100% safe
    if (String(storedOtp).trim() === String(otp).trim()) {
      // Clean up OTP
      await kv.del(`otp:${email}`);
      
      // If name is provided, send welcome email
      if (name) {
        console.log(`Sending Welcome Email to ${email} (${name})...`);
        const result = await sendWelcomeEmail(email, name);
        console.log(`Welcome Email Result:`, result);
      } else {
        console.log(`No name provided, skipping Welcome Email.`);
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
