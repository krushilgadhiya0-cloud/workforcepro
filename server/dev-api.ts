import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import express from 'express';

if (existsSync('.env.local')) loadEnv({ path: '.env.local', override: true });
loadEnv({ override: true });
import { handleCreateOrder, handleVerifyPayment, handleWebhook } from '../lib/payments/handlers.js';
import { getPaymentStatus } from '../lib/payments/razorpay.js';
import { verifyEmailAddress } from '../lib/email/verify.js';

const app = express();
const PORT = Number(process.env.API_PORT || 3001);

app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-razorpay-signature');
  next();
});

app.options('/api/create-order', (_req, res) => res.status(204).end());
app.options('/api/verify-payment', (_req, res) => res.status(204).end());
app.options('/api/webhook', (_req, res) => res.status(204).end());
app.options('/api/verify-email', (_req, res) => res.status(204).end());

app.post('/api/create-order', async (req, res) => {
  try {
    const result = await handleCreateOrder(req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    const status = message.includes('not configured') ? 503 : 400;
    res.status(status).json({ error: message });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const result = await handleVerifyPayment(req.body ?? {});
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Payment verification failed';
    const status = message.includes('not configured') ? 503 : 400;
    res.status(status).json({ error: message });
  }
});

app.post('/api/webhook', async (req, res) => {
  try {
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    const signature = req.headers['x-razorpay-signature'];
    const result = await handleWebhook(rawBody, typeof signature === 'string' ? signature : undefined);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    res.status(400).json({ error: message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'workforcepro-payments' });
});

app.get('/api/payment-status', (_req, res) => {
  res.json(getPaymentStatus());
});

app.post('/api/verify-email', async (req, res) => {
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
});

const DATA_FILE = join(process.cwd(), 'data', 'app-data.json');

app.get('/api/data', (_req, res) => {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.json(null);
    }
  } catch {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to save data' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Payment API running at http://localhost:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other payment API process or set API_PORT in .env.local`);
  } else {
    console.error('Payment API failed to start:', error.message);
  }
  process.exit(1);
});
