/**
 * Phase 1: Apply supabase/schema.sql via direct Postgres connection.
 * Usage: npm run migrate:apply-schema
 */
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

// Required for Supabase pooler TLS on some Windows Node builds during one-time migration.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, '..', 'supabase', 'schema.sql');

async function applySchema() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error('POSTGRES_URL is not set in .env.local');
    process.exit(1);
  }

  const connectionString = url
    .replace(/[?&]sslmode=[^&]*/g, '')
    .replace(/[?&]supa=[^&]*/g, '');

  const { default: pg } = await import('pg');
  const sql = readFileSync(SCHEMA_PATH, 'utf-8');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to Postgres. Applying schema...');

  try {
    await client.query(sql);
    console.log('Schema applied successfully.');
  } finally {
    await client.end();
  }
}

applySchema().catch((err) => {
  console.error('Schema apply failed:', err.message);
  process.exit(1);
});
