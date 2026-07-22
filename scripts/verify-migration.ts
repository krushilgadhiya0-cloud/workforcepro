/**
 * Phase 5: Verify relational migration matches the legacy JSON blob.
 */
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const KV_KEY = 'workforce:app-data';
const SUPABASE_TABLE = 'app_storage';

function countBy<T>(items: T[], key: keyof T): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of items) {
    const value = String(item[key]);
    map[value] = (map[value] ?? 0) + 1;
  }
  return map;
}

async function verifyMigration() {
  const { normalizeAppData } = await import('../lib/data-sync.js');
  const { loadRelationalAppData, getMigrationMeta } = await import('../lib/supabase-relational.js');
  const { supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');

  console.log('Phase 5: Verifying relational migration...\n');

  if (!isSupabaseConfigured()) {
    console.error('Supabase is not configured.');
    process.exit(1);
  }

  const meta = await getMigrationMeta();
  if (meta) {
    console.log('Migration meta:', meta);
  } else {
    console.warn('No migration_meta record found. Run migrate:json-to-tables first.');
  }

  const relational = await loadRelationalAppData();

  const { data: legacyRow } = await supabaseAdmin
    .from(SUPABASE_TABLE)
    .select('data')
    .eq('key', KV_KEY)
    .maybeSingle();

  const legacy = legacyRow?.data ? normalizeAppData(legacyRow.data as object) : null;

  const checks = [
    { name: 'users', relational: relational.users.length, legacy: legacy?.users.length ?? null },
    { name: 'companies', relational: relational.companies.length, legacy: legacy?.companies.length ?? null },
    { name: 'employees', relational: relational.workers.length, legacy: legacy?.workers.length ?? null },
    { name: 'tasks', relational: relational.tasks.length, legacy: legacy?.tasks.length ?? null },
    { name: 'payments', relational: relational.payments.length, legacy: legacy?.payments.length ?? null },
    { name: 'leaves', relational: relational.leaves.length, legacy: legacy?.leaves.length ?? null },
    { name: 'notifications', relational: relational.notifications.length, legacy: legacy?.notifications.length ?? null },
  ];

  let passed = true;
  console.log('Record counts:');
  for (const check of checks) {
    const legacyLabel = check.legacy == null ? 'n/a' : String(check.legacy);
    const match = check.legacy == null || check.relational === check.legacy;
    const status = match ? 'OK' : 'MISMATCH';
    if (!match) passed = false;
    console.log(`  ${check.name.padEnd(14)} relational=${check.relational}  legacy=${legacyLabel}  [${status}]`);
  }

  if (legacy) {
    const legacyUserIds = new Set(legacy.users.map((u) => u.id));
    const missingUsers = relational.users.filter((u) => !legacyUserIds.has(u.id));
    const extraUsers = legacy.users.filter((u) => !relational.users.some((r) => r.id === u.id));
    if (missingUsers.length > 0 || extraUsers.length > 0) {
      passed = false;
      console.log('\nUser ID drift:');
      if (extraUsers.length) console.log(`  Missing in relational: ${extraUsers.map((u) => u.email).join(', ')}`);
      if (missingUsers.length) console.log(`  Extra in relational: ${missingUsers.map((u) => u.email).join(', ')}`);
    }

    const legacyRoles = countBy(legacy.users, 'role');
    const relationalRoles = countBy(relational.users, 'role');
    console.log('\nUser roles (relational):', relationalRoles);
    console.log('User roles (legacy):     ', legacyRoles);
  }

  console.log(`\nRelational settings: theme=${relational.settings.theme}`);
  console.log(passed ? '\nVerification PASSED.' : '\nVerification FAILED — review counts above.');
  process.exit(passed ? 0 : 1);
}

verifyMigration().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
