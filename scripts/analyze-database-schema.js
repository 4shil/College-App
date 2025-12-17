// Database Schema Analyzer - Check actual database structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function getTableColumns(tableName) {
  try {
    // Try to query the table with limit 0 to get column structure
    const { data, error } = await supabase.from(tableName).select('*').limit(0);
    if (error) {
      return { exists: false, error: error.message };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function testQuery(tableName, query) {
  try {
    const { data, error, count } = await supabase.from(tableName).select(query, { count: 'exact', head: true });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, count: count || 0 };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function analyzeDatabase() {
  console.log('🔍 ANALYZING DATABASE SCHEMA\n');
  console.log('='.repeat(80));

  // Tables that code queries
  const tablesUsedInCode = [
    'academic_years',
    'assignment_submissions',
    'assignments',
    'attendance',
    'attendance_delegations',
    'attendance_logs',
    'attendance_records',
    'batches',
    'book_issues',
    'book_reservations',
    'books',
    'bus_routes',
    'bus_subscriptions',
    'canteen_tokens',
    'courses',
    'departments',
    'exam_marks',
    'exams',
    'external_marks',
    'fee_payments',
    'fee_structures',
    'holidays',
    'library_books',
    'notices',
    'parents',
    'profiles',
    'roles',
    'sections',
    'semesters',
    'student_fees',
    'students',
    'subjects',
    'substitutions',
    'teachers',
    'timetable_entries',
    'user_roles',
    'users',
    'years'
  ];

  console.log('\n📊 TABLE EXISTENCE CHECK\n');
  const missingTables = [];
  const existingTables = [];

  for (const table of tablesUsedInCode) {
    const result = await getTableColumns(table);
    if (result.exists) {
      console.log(`✅ ${table}`);
      existingTables.push(table);
    } else {
      console.log(`❌ ${table} - ${result.error}`);
      missingTables.push({ table, error: result.error });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n🔴 CRITICAL ISSUES - MISSING TABLES\n');
  missingTables.forEach(({ table, error }) => {
    console.log(`- ${table}: ${error}`);
  });

  // Test specific queries that are likely to fail
  console.log('\n' + '='.repeat(80));
  console.log('\n🧪 TESTING PROBLEMATIC QUERIES\n');

  const queryTests = [
    {
      name: 'Analytics: Attendance with status',
      table: 'attendance',
      query: 'id, status',
      expected: 'FAIL - status is in attendance_records'
    },
    {
      name: 'Analytics: Exams with date',
      table: 'exams',
      query: 'id, date',
      expected: 'FAIL - should be start_date'
    },
    {
      name: 'Analytics: Assignments with status',
      table: 'assignments',
      query: 'id, status',
      expected: 'FAIL - should be is_active'
    },
    {
      name: 'Analytics: Notices with is_published',
      table: 'notices',
      query: 'id, is_published',
      expected: 'FAIL - should be is_active'
    },
    {
      name: 'Analytics: Library books table',
      table: 'library_books',
      query: 'id',
      expected: 'FAIL - should be books'
    },
    {
      name: 'Students: batch_id column',
      table: 'students',
      query: 'id, batch_id',
      expected: 'Check if column exists'
    },
    {
      name: 'Library: users table',
      table: 'users',
      query: 'id, full_name',
      expected: 'FAIL - should be profiles'
    },
    {
      name: 'Profiles: is_active column',
      table: 'profiles',
      query: 'id, is_active',
      expected: 'Check if column exists (should be status)'
    }
  ];

  for (const test of queryTests) {
    const result = await testQuery(test.table, test.query);
    if (result.success) {
      console.log(`✅ ${test.name}`);
      console.log(`   Query: ${test.table}.select('${test.query}')`);
      console.log(`   Status: SUCCESS (${result.count} records)`);
    } else {
      console.log(`❌ ${test.name}`);
      console.log(`   Query: ${test.table}.select('${test.query}')`);
      console.log(`   Error: ${result.error}`);
      console.log(`   Expected: ${test.expected}`);
    }
    console.log('');
  }

  // Test actual column existence on existing tables
  console.log('='.repeat(80));
  console.log('\n🔍 DETAILED COLUMN CHECKS\n');

  // Check attendance table structure
  console.log('📋 ATTENDANCE TABLE:');
  const attTests = [
    { col: 'id, date, period, course_id', desc: 'Basic structure' },
    { col: 'id, status', desc: 'Status column (should FAIL)' },
    { col: 'id, marked_by, marked_at', desc: 'Metadata columns' }
  ];
  for (const t of attTests) {
    const r = await testQuery('attendance', t.col);
    console.log(`  ${r.success ? '✅' : '❌'} ${t.desc}: ${t.col}`);
    if (!r.success) console.log(`     Error: ${r.error}`);
  }

  console.log('\n📋 ATTENDANCE_RECORDS TABLE:');
  const attRecTests = [
    { col: 'id, status', desc: 'Status column (should PASS)' },
    { col: 'id, student_id, attendance_id', desc: 'Basic structure' }
  ];
  for (const t of attRecTests) {
    const r = await testQuery('attendance_records', t.col);
    console.log(`  ${r.success ? '✅' : '❌'} ${t.desc}: ${t.col}`);
    if (!r.success) console.log(`     Error: ${r.error}`);
  }

  console.log('\n📋 PROFILES TABLE:');
  const profTests = [
    { col: 'id, email, full_name', desc: 'Basic columns' },
    { col: 'id, is_active', desc: 'is_active column (check existence)' },
    { col: 'id, status', desc: 'status column (should PASS)' },
    { col: 'id, primary_role', desc: 'primary_role column' }
  ];
  for (const t of profTests) {
    const r = await testQuery('profiles', t.col);
    console.log(`  ${r.success ? '✅' : '❌'} ${t.desc}: ${t.col}`);
    if (!r.success) console.log(`     Error: ${r.error}`);
  }

  console.log('\n📋 STUDENTS TABLE:');
  const studTests = [
    { col: 'id, user_id, registration_number', desc: 'Basic columns' },
    { col: 'id, batch_id', desc: 'batch_id column (check existence)' },
    { col: 'id, department_id, year_id, section_id', desc: 'Academic links' }
  ];
  for (const t of studTests) {
    const r = await testQuery('students', t.col);
    console.log(`  ${r.success ? '✅' : '❌'} ${t.desc}: ${t.col}`);
    if (!r.success) console.log(`     Error: ${r.error}`);
  }

  console.log('\n📋 EXAMS TABLE:');
  const examTests = [
    { col: 'id, name, exam_type', desc: 'Basic columns' },
    { col: 'id, date', desc: 'date column (should FAIL)' },
    { col: 'id, start_date, end_date', desc: 'start_date/end_date (should PASS)' }
  ];
  for (const t of examTests) {
    const r = await testQuery('exams', t.col);
    console.log(`  ${r.success ? '✅' : '❌'} ${t.desc}: ${t.col}`);
    if (!r.success) console.log(`     Error: ${r.error}`);
  }

  console.log('\n📋 ASSIGNMENTS TABLE:');
  const assignTests = [
    { col: 'id, title, course_id', desc: 'Basic columns' },
    { col: 'id, status', desc: 'status column (should FAIL)' },
    { col: 'id, is_active', desc: 'is_active column (should PASS)' }
  ];
  for (const t of assignTests) {
    const r = await testQuery('assignments', t.col);
    console.log(`  ${r.success ? '✅' : '❌'} ${t.desc}: ${t.col}`);
    if (!r.success) console.log(`     Error: ${r.error}`);
  }

  console.log('\n📋 NOTICES TABLE:');
  const noticeTests = [
    { col: 'id, title, content', desc: 'Basic columns' },
    { col: 'id, is_published', desc: 'is_published column (should FAIL)' },
    { col: 'id, is_active', desc: 'is_active column (should PASS)' }
  ];
  for (const t of noticeTests) {
    const r = await testQuery('notices', t.col);
    console.log(`  ${r.success ? '✅' : '❌'} ${t.desc}: ${t.col}`);
    if (!r.success) console.log(`     Error: ${r.error}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY\n');
  console.log(`Total tables checked: ${tablesUsedInCode.length}`);
  console.log(`✅ Existing tables: ${existingTables.length}`);
  console.log(`❌ Missing tables: ${missingTables.length}`);
  console.log('\nMissing tables:', missingTables.map(t => t.table).join(', '));

  console.log('\n' + '='.repeat(80));
}

analyzeDatabase().catch(console.error);
