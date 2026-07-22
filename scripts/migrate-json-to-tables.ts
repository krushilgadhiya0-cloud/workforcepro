/**
 * Phase 2-3: Read JSON from app_storage and split into relational tables.
 */
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const KV_KEY = 'workforce:app-data';
const SUPABASE_TABLE = 'app_storage';

async function migrateJsonToTables() {
  const { normalizeAppData } = await import('../lib/data-sync.js');
  const { importAppDataToRelationalTables } = await import('../lib/supabase-relational.js');
  const { supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');

  console.log('Phase 2: Reading JSON from app_storage...');

  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const { data, error } = await supabaseAdmin
    .from(SUPABASE_TABLE)
    .select('data, updated_at')
    .eq('key', KV_KEY)
    .maybeSingle();

  if (error) {
    console.error('Failed to read app_storage:', error.message);
    if (error.code === '42P01') {
      console.log('The app_storage table does not exist. Nothing to migrate from JSON.');
    }
    process.exit(1);
  }

  if (!data?.data) {
    console.log('No JSON blob found in app_storage. Starting with empty relational tables.');
    await importAppDataToRelationalTables(normalizeAppData(null));
    console.log('Done. Relational mode will auto-enable after migration_meta is set.');
    return;
  }

  const json = normalizeAppData(data.data as object);
  console.log(`Found JSON blob (updated ${data.updated_at ?? 'unknown'})`);
  console.log(`  users: ${json.users.length}`);
  console.log(`  companies: ${json.companies.length}`);
  console.log(`  employees (workers): ${json.workers.length}`);
  console.log(`  tasks: ${json.tasks.length}`);
  console.log(`  payments: ${json.payments.length}`);

  console.log('\nPhase 3: Splitting JSON into relational tables...');
  const saved = await importAppDataToRelationalTables(json);

  console.log('\nMigration complete.');
  console.log(`  users: ${saved.users.length}`);
  console.log(`  employees: ${saved.workers.length}`);
  console.log(`  tasks: ${saved.tasks.length}`);
  console.log(`  attendance: ${saved.workers.length} (today's records)`);
  console.log(`  payments: ${saved.payments.length}`);
}

migrateJsonToTables().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
