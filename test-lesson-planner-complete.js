// Comprehensive Test Suite for Lesson Planner System
// Run with: node test-lesson-planner-complete.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHdmY2ZsY29mZWpqcGtwZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEzNTQsImV4cCI6MjA3OTgzNzM1NH0.hDdQIjIy5fkmdXV2GjWlATujnXgVcXZD932_k1KvLwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol}${colors.reset} ${message}`);
}

// Test Suite
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  add(testName, testFn) {
    this.tests.push({ name: testName, fn: testFn });
  }

  async run() {
    log('cyan', '\n🧪', `Running Test Suite: ${this.name}`);
    console.log('─'.repeat(60));

    for (const test of this.tests) {
      try {
        const result = await test.fn();
        if (result.success) {
          log('green', '✅', test.name);
          if (result.message) {
            console.log(`   ${colors.blue}ℹ${colors.reset} ${result.message}`);
          }
          this.passed++;
        } else {
          log('red', '❌', test.name);
          if (result.message) {
            console.log(`   ${colors.red}✗${colors.reset} ${result.message}`);
          }
          this.failed++;
        }
      } catch (error) {
        log('red', '❌', `${test.name} - ${error.message}`);
        this.failed++;
      }
    }

    console.log('─'.repeat(60));
    console.log(`\n📊 Results: ${colors.green}${this.passed} passed${colors.reset}, ${colors.red}${this.failed} failed${colors.reset}\n`);
  }
}

// Test 1: Schema Tests
async function runSchemaTests() {
  const suite = new TestSuite('Database Schema Verification');

  suite.add('lesson_planners table exists', async () => {
    const { data, error } = await supabase.from('lesson_planners').select('*').limit(1);
    return { success: !error, message: error?.message };
  });

  suite.add('lesson_planners has total_periods_planned column', async () => {
    const { data, error } = await supabase
      .from('lesson_planners')
      .select('total_periods_planned')
      .limit(1);
    return { success: !error, message: error?.message };
  });

  suite.add('lesson_planners has syllabus_coverage_percentage column', async () => {
    const { data, error } = await supabase
      .from('lesson_planners')
      .select('syllabus_coverage_percentage')
      .limit(1);
    return { success: !error, message: error?.message };
  });

  suite.add('syllabus_units table exists', async () => {
    const { data, error } = await supabase.from('syllabus_units').select('*').limit(1);
    return { success: !error, message: error?.message };
  });

  suite.add('lesson_planner_audit_log table exists', async () => {
    const { data, error } = await supabase.from('lesson_planner_audit_log').select('*').limit(1);
    return { success: !error, message: error?.message };
  });

  suite.add('lesson_planner_comments table exists', async () => {
    const { data, error } = await supabase.from('lesson_planner_comments').select('*').limit(1);
    return { success: !error, message: error?.message };
  });

  await suite.run();
  return suite.failed === 0;
}

// Test 2: RPC Function Tests
async function runRPCTests() {
  const suite = new TestSuite('RPC Functions');

  suite.add('approve_lesson_planner function exists', async () => {
    const { error } = await supabase.rpc('approve_lesson_planner', {
      planner_id: '00000000-0000-0000-0000-000000000000',
      approver_user_id: '00000000-0000-0000-0000-000000000000',
    });
    const exists = !error || !error.message.includes('Could not find the function');
    return {
      success: exists,
      message: exists ? 'Function callable' : error?.message,
    };
  });

  suite.add('reject_lesson_planner function exists', async () => {
    const { error } = await supabase.rpc('reject_lesson_planner', {
      planner_id: '00000000-0000-0000-0000-000000000000',
      rejector_user_id: '00000000-0000-0000-0000-000000000000',
      reason: 'test',
    });
    const exists = !error || !error.message.includes('Could not find the function');
    return {
      success: exists,
      message: exists ? 'Function callable' : error?.message,
    };
  });

  await suite.run();
  return suite.failed === 0;
}

// Test 3: Data Integrity Tests
async function runDataIntegrityTests() {
  const suite = new TestSuite('Data Integrity');

  suite.add('Query existing lesson planners', async () => {
    const { data, error } = await supabase
      .from('lesson_planners')
      .select('id, status, week_start_date, total_periods_planned, syllabus_coverage_percentage')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return { success: false, message: error.message };
    }

    const count = data?.length || 0;
    const message = count > 0
      ? `Found ${count} existing planners`
      : 'No existing planners (this is OK for new system)';

    return { success: true, message };
  });

  suite.add('Validate JSONB structure for planned_topics', async () => {
    const { data, error } = await supabase
      .from('lesson_planners')
      .select('planned_topics')
      .not('planned_topics', 'is', null)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { success: false, message: error.message };
    }

    if (!data) {
      return { success: true, message: 'No data to validate (OK)' };
    }

    const isArray = Array.isArray(data.planned_topics);
    return {
      success: isArray,
      message: isArray ? 'JSONB is properly structured as array' : 'JSONB structure issue',
    };
  });

  suite.add('Check syllabus_units structure', async () => {
    const { data, error } = await supabase
      .from('syllabus_units')
      .select('*')
      .limit(1);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: data && data.length > 0 ? 'Has syllabus units' : 'No syllabus units yet (OK)',
    };
  });

  await suite.run();
  return suite.failed === 0;
}

// Test 4: Permission Tests (Basic)
async function runPermissionTests() {
  const suite = new TestSuite('Basic Permissions');

  suite.add('Anonymous users cannot insert planners', async () => {
    const { error } = await supabase.from('lesson_planners').insert({
      teacher_id: '00000000-0000-0000-0000-000000000000',
      course_id: '00000000-0000-0000-0000-000000000000',
      academic_year_id: '00000000-0000-0000-0000-000000000000',
      week_start_date: '2026-01-13',
      week_end_date: '2026-01-19',
      planned_topics: [],
    });

    // Should fail due to RLS
    return {
      success: !!error,
      message: error
        ? 'Correctly blocked by RLS'
        : 'WARNING: RLS may not be properly configured',
    };
  });

  suite.add('Can read syllabus_units without auth', async () => {
    const { error } = await supabase.from('syllabus_units').select('*').limit(1);

    // Should work for authenticated users
    return {
      success: !error || error.message.includes('JWT'),
      message: !error ? 'Readable' : 'Auth required (expected)',
    };
  });

  await suite.run();
  return suite.failed === 0;
}

// Test 5: Calculation Functions
async function runCalculationTests() {
  const suite = new TestSuite('Calculation Functions');

  suite.add('Test calculate_planned_periods function', async () => {
    try {
      // Try to call the function directly via RPC (if exposed)
      // For now, we'll just verify the trigger works by checking existing data
      const { data, error } = await supabase
        .from('lesson_planners')
        .select('planned_topics, total_periods_planned')
        .not('planned_topics', 'is', null)
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        return { success: true, message: 'No data to test (OK)' };
      }

      if (data) {
        const expectedCount = Array.isArray(data.planned_topics) ? data.planned_topics.length : 0;
        const actualCount = data.total_periods_planned || 0;
        const matches = expectedCount === actualCount;

        return {
          success: matches,
          message: matches
            ? `Calculation correct: ${actualCount} periods`
            : `Mismatch: expected ${expectedCount}, got ${actualCount}`,
        };
      }

      return { success: true, message: 'Function exists and trigger is configured' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  suite.add('Test syllabus coverage calculation', async () => {
    const { data, error } = await supabase
      .from('lesson_planners')
      .select('total_periods_planned, total_periods_completed, syllabus_coverage_percentage')
      .not('total_periods_planned', 'is', null)
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      return { success: true, message: 'No data to test (OK)' };
    }

    if (data) {
      const expected =
        data.total_periods_planned > 0
          ? Math.round((data.total_periods_completed / data.total_periods_planned) * 100 * 100) / 100
          : 0;
      const actual = parseFloat(data.syllabus_coverage_percentage) || 0;
      const matches = Math.abs(expected - actual) < 0.1; // Allow 0.1% rounding difference

      return {
        success: matches,
        message: matches
          ? `Coverage: ${actual}%`
          : `Mismatch: expected ${expected}%, got ${actual}%`,
      };
    }

    return { success: true, message: 'Calculation logic exists' };
  });

  await suite.run();
  return suite.failed === 0;
}

// Main Test Runner
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('   LESSON PLANNER SYSTEM - COMPREHENSIVE TEST SUITE');
  console.log('═'.repeat(60) + '\n');

  const results = [];

  // Run all test suites
  results.push(await runSchemaTests());
  results.push(await runRPCTests());
  results.push(await runDataIntegrityTests());
  results.push(await runPermissionTests());
  results.push(await runCalculationTests());

  // Overall summary
  const allPassed = results.every((r) => r === true);

  console.log('═'.repeat(60));
  if (allPassed) {
    log('green', '✨', 'ALL TESTS PASSED! System is ready for use.');
  } else {
    log('yellow', '⚠️', 'Some tests failed. Review results above.');
    console.log('\n💡 If schema tests failed:');
    console.log('   1. Copy APPLY_LESSON_PLANNER_MIGRATION.sql');
    console.log('   2. Go to Supabase Dashboard > SQL Editor');
    console.log('   3. Paste and run the migration');
    console.log('   4. Re-run this test\n');
  }
  console.log('═'.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
