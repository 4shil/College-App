// Test script for Faculty Work Diary enhancements
// Run with: node test-work-diary.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHdmY2ZsY29mZWpqcGtwZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEzNTQsImV4cCI6MjA3OTgzNzM1NH0.hDdQIjIy5fkmdXV2GjWlATujnXgVcXZD932_k1KvLwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('\n🔍 Testing Faculty Work Diary schema...\n');

  const tests = [];

  tests.push({
    name: 'work_diaries table exists',
    fn: async () => {
      const { error } = await supabase.from('work_diaries').select('id').limit(1);
      return { ok: !error, msg: error?.message };
    },
  });

  tests.push({
    name: 'work_diary_summaries table exists',
    fn: async () => {
      const { error } = await supabase.from('work_diary_summaries').select('id').limit(1);
      return { ok: !error, msg: error?.message };
    },
  });

  tests.push({
    name: 'work_diary_audit_log table exists',
    fn: async () => {
      const { error } = await supabase.from('work_diary_audit_log').select('id').limit(1);
      return { ok: !error, msg: error?.message };
    },
  });

  tests.push({
    name: 'class_code_mappings table exists',
    fn: async () => {
      const { error } = await supabase.from('class_code_mappings').select('id').limit(1);
      return { ok: !error, msg: error?.message };
    },
  });

  tests.push({
    name: 'work_diary_daily_entries table exists',
    fn: async () => {
      const { error } = await supabase.from('work_diary_daily_entries').select('id').limit(1);
      return { ok: !error, msg: error?.message };
    },
  });

  tests.push({
    name: 'approve_work_diary RPC exists',
    fn: async () => {
      const { error } = await supabase.rpc('approve_work_diary', {
        p_diary_id: '00000000-0000-0000-0000-000000000000',
        p_decision: 'approve',
        p_reason: null,
      });
      const missing = !!error && /Could not find the function/i.test(error.message || '');
      return { ok: !missing, msg: missing ? error?.message : (error ? `Callable (got: ${error.message})` : 'Callable') };
    },
  });

  tests.push({
    name: 'RLS blocks anon insert into work_diaries',
    fn: async () => {
      const { error } = await supabase.from('work_diaries').insert({
        teacher_id: '00000000-0000-0000-0000-000000000000',
        month: 1,
        year: 2026,
        daily_entries: [],
      });
      return { ok: !!error, msg: error ? 'Correctly blocked by RLS' : 'WARNING: anon insert allowed' };
    },
  });

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const { ok, msg } = await t.fn();
      if (ok) {
        console.log(`✅ ${t.name}${msg ? `\n   ℹ ${msg}` : ''}`);
        passed++;
      } else {
        console.log(`❌ ${t.name}${msg ? `\n   ✗ ${msg}` : ''}`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ${t.name}\n   ✗ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) {
    console.log('💡 If tables/functions are missing, run APPLY_WORK_DIARY_MIGRATION.sql in Supabase SQL Editor.');
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
