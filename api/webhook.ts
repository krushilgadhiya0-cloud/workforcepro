import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleWebhook } from '../lib/payments/handlers.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    const result = await handleWebhook(rawBody, typeof signature === 'string' ? signature : undefined);
    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return res.status(400).json({ error: message });
  }
}
