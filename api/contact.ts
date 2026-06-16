import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendContactEmail } from '../lib/email/gmail.js';
import { setCorsHeaders, handleOptions } from './_cors.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, date, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  try {
    const result = await sendContactEmail({ name, email, date, message });
    
    if (result.success) {
      return res.status(200).json({ ok: true, message: 'Message sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Contact API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
