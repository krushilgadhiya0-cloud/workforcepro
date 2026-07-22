/**
 * Phase 6: Delete legacy JSON blob from app_storage after relational migration is verified.
 */
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const KV_KEY = 'workforce:app-data';
const SUPABASE_TABLE = 'app_storage';

async function cleanupJsonStorage() {
  const { getMigrationMeta } = await import('../lib/supabase-relational.js');
  const { supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');

  console.log('Phase 6: Cleaning up legacy JSON storage...\n');

  if (process.env.CONFIRM_JSON_CLEANUP !== 'true') {
    console.error('Set CONFIRM_JSON_CLEANUP=true to confirm deletion of app_storage JSON.');
    process.exit(1);
  }

  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured.');
    process.exit(1);
  }

  const meta = await getMigrationMeta();
  if (!meta?.migrated_at) {
    console.error('No migration_meta found. Run migrate:json-to-tables and migrate:verify first.');
    process.exit(1);
  }

  const { error } = await supabaseAdmin
    .from(SUPABASE_TABLE)
    .delete()
    .eq('key', KV_KEY);

  if (error) {
    console.error('Failed to delete JSON blob:', error.message);
    process.exit(1);
  }

  await supabaseAdmin.from('migration_meta').upsert({
    key: 'json_to_relational',
    value: { ...meta, json_cleaned_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  });

  console.log('Legacy JSON blob removed from app_storage.');
  console.log('Relational tables are now the only data source.');
}

cleanupJsonStorage().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
