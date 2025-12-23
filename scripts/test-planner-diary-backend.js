/**
 * Planner/Diary Backend Smoke Test (Admin)
 * - Logs in as an admin
 * - Verifies SELECT access to `lesson_planners` and `work_diaries`
 *
 * Usage:
 *   node scripts/test-planner-diary-backend.js
 *
 * Env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   PLANNER_TEST_EMAIL (optional)
 *   PLANNER_TEST_PASSWORD (optional)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const email = process.env.PLANNER_TEST_EMAIL || process.env.EVENTS_TEST_EMAIL || 'admin@jpmcollege.edu';
const password = process.env.PLANNER_TEST_PASSWORD || process.env.EVENTS_TEST_PASSWORD || 'admin@123';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase env vars: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
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

async function selectTable(table, columns) {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .order('created_at', { ascending: false })
    .limit(3);

  return { data, error };
}

async function main() {
  log('\n🧪 Planner/Diary Backend Smoke Test', colors.cyan);
  log(`\n🔐 Signing in as ${email}...`, colors.cyan);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    log(`❌ Auth failed: ${authError.message}`, colors.red);
    process.exit(1);
  }

  log(`✅ Signed in (user id: ${authData.session.user.id})`, colors.green);

  log('\n📥 SELECT latest lesson_planners...', colors.cyan);
  const planners = await selectTable('lesson_planners', 'id,week_start_date,week_end_date,status,created_at');
  if (planners.error) {
    log(`❌ lesson_planners SELECT failed: ${planners.error.message}`, colors.red);
    log('ℹ️  If this is an RLS issue, add an admin SELECT policy for lesson_planners.', colors.yellow);
  } else {
    log(`✅ lesson_planners SELECT ok (${planners.data?.length ?? 0} rows)`, colors.green);
  }

  log('\n📥 SELECT latest work_diaries...', colors.cyan);
  const diaries = await selectTable('work_diaries', 'id,month,year,status,created_at');
  if (diaries.error) {
    log(`❌ work_diaries SELECT failed: ${diaries.error.message}`, colors.red);
    log('ℹ️  If this is an RLS issue, add an admin SELECT policy for work_diaries.', colors.yellow);
  } else {
    log(`✅ work_diaries SELECT ok (${diaries.data?.length ?? 0} rows)`, colors.green);
  }

  const ok = !planners.error && !diaries.error;
  if (ok) {
    log('\n✅ Planner/Diary backend read access looks good.', colors.green);
    process.exit(0);
  }

  log('\n⚠️  Planner/Diary backend needs fixes (see errors above).', colors.yellow);
  process.exit(2);
}

main().catch((err) => {
  log(`\n❌ Unexpected error: ${err?.message || String(err)}`, colors.red);
  process.exit(1);
});
