import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config as loadEnv } from 'dotenv';
import express from 'express';

if (existsSync('.env.local')) loadEnv({ path: '.env.local', override: true });
loadEnv({ override: true });
import { handleCreateOrder, handleVerifyPayment, handleWebhook } from '../lib/payments/handlers.js';
import { getPaymentStatus } from '../lib/payments/razorpay.js';
import { verifyEmailAddress } from '../lib/email/verify.js';
import { mergeAppData, normalizeAppData } from '../lib/data-sync.js';

const app = express();
const PORT = Number(process.env.API_PORT || 3001);

// Local OTP Store for development
const localOtpStore = new Map<string, string>();

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

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  localOtpStore.set(email.toLowerCase().trim(), otp);
  console.log(`[DEV-API] OTP for ${email}: ${otp}`);
  // In dev mode, we just log it. If GMAIL is configured, we could send it.
  res.json({ ok: true, message: 'OTP logged to console' });
});

app.post('/api/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Missing information' });
  const stored = localOtpStore.get(email.toLowerCase().trim());
  if (stored === otp) {
    localOtpStore.delete(email.toLowerCase().trim());
    res.json({ ok: true, message: 'OTP verified' });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

const DATA_FILE = join(process.cwd(), 'data', 'app-data.json');

app.get('/api/data', async (_req, res) => {
  try {
    const { loadStoredAppData, getStorageBackend } = await import('../lib/app-store.js');
    const backend = getStorageBackend();

    if (backend !== 'none') {
      const data = await loadStoredAppData();
      return res.json(data);
    }

    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf-8');
      res.json(normalizeAppData(JSON.parse(data)));
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Local API read failed:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { saveStoredAppData, getStorageBackend } = await import('../lib/app-store.js');
    const backend = getStorageBackend();

    if (backend !== 'none') {
      const merged = await saveStoredAppData(normalizeAppData(req.body ?? {}));
      return res.json({ ok: true, data: merged, backend });
    }

    let existing = null;
    if (existsSync(DATA_FILE)) {
      existing = normalizeAppData(JSON.parse(readFileSync(DATA_FILE, 'utf-8')));
    }
    const merged = mergeAppData(existing ?? {}, normalizeAppData(req.body ?? {}));
    writeFileSync(DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    res.json({ ok: true, data: merged });
  } catch (error) {
    console.error('Local API save failed:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running at http://localhost:${PORT} (LAN devices can sync via this host)`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other payment API process or set API_PORT in .env.local`);
  } else {
    console.error('Payment API failed to start:', error.message);
  }
  process.exit(1);
});
