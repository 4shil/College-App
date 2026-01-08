// Test script for Lesson Planner database migrations and functionality
// Run with: node test-lesson-planner.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHdmY2ZsY29mZWpqcGtwZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEzNTQsImV4cCI6MjA3OTgzNzM1NH0.hDdQIjIy5fkmdXV2GjWlATujnXgVcXZD932_k1KvLwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabase() {
  console.log('\n🔍 Testing Lesson Planner Database Schema...\n');

  const tests = [];

  // Test 1: Check if lesson_planners table exists
  tests.push({
    name: 'lesson_planners table exists',
    test: async () => {
      const { data, error } = await supabase
        .from('lesson_planners')
        .select('*')
        .limit(1);
      return !error;
    }
  });

  // Test 2: Check if new columns exist in lesson_planners
  tests.push({
    name: 'lesson_planners has new metrics columns',
    test: async () => {
      const { data, error } = await supabase
        .from('lesson_planners')
        .select('total_periods_planned, total_periods_completed, syllabus_coverage_percentage')
        .limit(1);
      return !error;
    }
  });

  // Test 3: Check if syllabus_units table exists
  tests.push({
    name: 'syllabus_units table exists',
    test: async () => {
      const { data, error } = await supabase
        .from('syllabus_units')
        .select('*')
        .limit(1);
      return !error;
    }
  });

  // Test 4: Check if lesson_planner_audit_log table exists
  tests.push({
    name: 'lesson_planner_audit_log table exists',
    test: async () => {
      const { data, error } = await supabase
        .from('lesson_planner_audit_log')
        .select('*')
        .limit(1);
      return !error;
    }
  });

  // Test 5: Check if lesson_planner_comments table exists
  tests.push({
    name: 'lesson_planner_comments table exists',
    test: async () => {
      const { data, error } = await supabase
        .from('lesson_planner_comments')
        .select('*')
        .limit(1);
      return !error;
    }
  });

  // Test 6: Check if RPC functions exist
  tests.push({
    name: 'approve_lesson_planner RPC exists',
    test: async () => {
      // Try calling with invalid params to see if function exists
      const { error } = await supabase
        .rpc('approve_lesson_planner', {
          planner_id: '00000000-0000-0000-0000-000000000000',
          approver_user_id: '00000000-0000-0000-0000-000000000000'
        });
      // Function exists if error is NOT "function not found"
      return !error || !error.message.includes('Could not find the function');
    }
  });

  tests.push({
    name: 'reject_lesson_planner RPC exists',
    test: async () => {
      const { error } = await supabase
        .rpc('reject_lesson_planner', {
          planner_id: '00000000-0000-0000-0000-000000000000',
          rejector_user_id: '00000000-0000-0000-0000-000000000000',
          reason: 'test'
        });
      return !error || !error.message.includes('Could not find the function');
    }
  });

  // Test 7: Check existing lesson planners
  tests.push({
    name: 'Query existing lesson planners',
    test: async () => {
      const { data, error } = await supabase
        .from('lesson_planners')
        .select('id, status, week_start_date, total_periods_planned')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) return false;
      
      console.log(`      Found ${data?.length || 0} existing planners`);
      if (data && data.length > 0) {
        data.forEach(p => {
          console.log(`      - ID: ${p.id.substring(0, 8)}... Status: ${p.status}, Periods: ${p.total_periods_planned || 0}`);
        });
      }
      return true;
    }
  });

  // Run all tests
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed\n`);

  // Additional info
  if (failed > 0) {
    console.log('⚠️  Some tests failed. This could mean:');
    console.log('   1. Migrations have not been applied yet');
    console.log('   2. Remote Supabase instance needs migration');
    console.log('   3. You need to apply migrations via Supabase Dashboard\n');
    console.log('💡 To apply migrations:');
    console.log('   1. Go to Supabase Dashboard > SQL Editor');
    console.log('   2. Copy content from migration files');
    console.log('   3. Run each migration in order\n');
  } else {
    console.log('✨ All tests passed! Database schema is ready.\n');
  }
}

// Run functional tests if schema is ready
async function testFunctionality() {
  console.log('🧪 Testing Lesson Planner Functionality...\n');

  // These tests require actual data and user authentication
  // For now, just check if we can query the tables
  
  try {
    // Test JSONB structure for planned_topics
    const { data, error } = await supabase
      .from('lesson_planners')
      .select('planned_topics, completed_topics')
      .limit(1)
      .single();

    if (data) {
      console.log('✅ Can read JSONB columns');
      console.log('   Sample planned_topics structure:', 
        JSON.stringify(data.planned_topics, null, 2).substring(0, 200) + '...');
    } else {
      console.log('ℹ️  No existing planner data to test');
    }
  } catch (err) {
    console.log('ℹ️  No existing planner data to test');
  }

  console.log('\n');
}

// Main execution
(async () => {
  try {
    await testDatabase();
    await testFunctionality();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
})();
