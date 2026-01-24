/**
 * Events Backend Smoke Test
 * - Logs in as an admin (email/password)
 * - Verifies SELECT/INSERT/UPDATE permissions on `events`
 * - Cleans up the created test row
 *
 * Usage:
 *   node scripts/test-events-backend.js
 *
 * Env (all required):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   EVENTS_TEST_EMAIL - Admin email for testing
 *   EVENTS_TEST_PASSWORD - Admin password for testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const email = process.env.EVENTS_TEST_EMAIL;
const password = process.env.EVENTS_TEST_PASSWORD;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase env vars: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!email || !password) {
  console.error('❌ Missing test credentials: EVENTS_TEST_EMAIL / EVENTS_TEST_PASSWORD');
  console.error('   Set these environment variables with admin credentials to run this test.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  log('\n🧪 Events Backend Smoke Test', colors.cyan);

  // 1) Login
  log(`\n🔐 Signing in as ${email}...`, colors.cyan);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    log(`❌ Auth failed: ${authError.message}`, colors.red);
    log('ℹ️  If you have not seeded verified admin users yet, run scripts/create-verified-admin-users.sql in Supabase.', colors.yellow);
    process.exit(1);
  }

  if (!authData?.session?.user?.id) {
    log('❌ Auth returned no session/user id', colors.red);
    process.exit(1);
  }

  log(`✅ Signed in (user id: ${authData.session.user.id})`, colors.green);

  // 2) Read
  log('\n📥 SELECT latest events...', colors.cyan);
  const { data: events, error: selectError } = await supabase
    .from('events')
    .select('id,title,is_active,start_datetime,created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (selectError) {
    log(`❌ SELECT failed: ${selectError.message}`, colors.red);
    process.exit(1);
  }
  log(`✅ SELECT ok (${events?.length ?? 0} rows)`, colors.green);

  // 3) Insert
  const now = new Date();
  const start = new Date(now.getTime() + 10 * 60 * 1000);
  const title = `__smoke_test_event__ ${now.toISOString()}`;

  const insertPayload = {
    title,
    event_type: 'smoke_test',
    start_datetime: start.toISOString(),
    end_datetime: null,
    venue: 'Smoke Test',
    registration_link: 'https://example.com',
    poster_url: null,
    description: 'Automated smoke test row. Safe to delete.',
    is_active: false,
    created_by: authData.session.user.id,
  };

  log('\n📝 INSERT test event...', colors.cyan);
  const { data: inserted, error: insertError } = await supabase
    .from('events')
    .insert(insertPayload)
    .select('id,title,is_active')
    .single();

  if (insertError) {
    log(`❌ INSERT failed: ${insertError.message}`, colors.red);
    log('ℹ️  Likely causes:', colors.yellow);
    log('   - RLS: user is not considered admin by is_admin()', colors.yellow);
    log('   - events table not migrated / missing columns', colors.yellow);
    process.exit(1);
  }

  log(`✅ INSERT ok (id: ${inserted.id})`, colors.green);

  // 4) Update
  log('\n✏️  UPDATE test event (set is_active=true)...', colors.cyan);
  const { error: updateError } = await supabase
    .from('events')
    .update({ is_active: true })
    .eq('id', inserted.id);

  if (updateError) {
    log(`❌ UPDATE failed: ${updateError.message}`, colors.red);
    process.exit(1);
  }
  log('✅ UPDATE ok', colors.green);

  // 5) Cleanup
  log('\n🧹 DELETE test event...', colors.cyan);
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('id', inserted.id);

  if (deleteError) {
    log(`❌ DELETE failed: ${deleteError.message}`, colors.red);
    process.exit(1);
  }
  log('✅ DELETE ok', colors.green);

  log('\n✅ Events backend looks good (CRUD + RLS for admin user).', colors.green);
}

main().catch((err) => {
  log(`\n❌ Unexpected error: ${err?.message || String(err)}`, colors.red);
  process.exit(1);
});
