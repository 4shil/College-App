/**
 * Test script for Attendance and Timetable modules
 * Run with: node scripts/test-attendance.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load env vars
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('\n🧪 Running Attendance & Timetable Tests\n');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;

  // Test 1: Check attendance table structure
  console.log('\n📋 Test 1: Attendance table structure');
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('id, date, period, course_id, section_id, program_id, year_id, timetable_entry_id, marked_by, is_locked')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Attendance table has correct columns (including program_id, year_id, timetable_entry_id)');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 2: Check attendance_records table structure
  console.log('\n📋 Test 2: Attendance records table structure');
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('id, attendance_id, student_id, status, late_minutes, edit_count, edited_by')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Attendance records table has correct columns (including late_minutes, edit_count)');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 3: Check holidays table
  console.log('\n📋 Test 3: Holidays table');
  try {
    const { data, error } = await supabase
      .from('holidays')
      .select('id, date, title, holiday_type, department_id, created_by')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Holidays table exists with correct structure');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 4: Check late_passes table
  console.log('\n📋 Test 4: Late passes table');
  try {
    const { data, error } = await supabase
      .from('late_passes')
      .select('id, student_id, academic_year_id, month, year, late_count, half_day_leaves_deducted')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Late passes table exists with correct structure');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 5: Check attendance_logs table
  console.log('\n📋 Test 5: Attendance logs table');
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('id, action_type, performed_by, target_type, student_id, details')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Attendance logs table exists with correct structure');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 6: Check timetable_entries table with new columns
  console.log('\n📋 Test 6: Timetable entries table structure');
  try {
    const { data, error } = await supabase
      .from('timetable_entries')
      .select('id, program_id, year_id, day_of_week, period, course_id, teacher_id, is_active')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Timetable entries table has correct columns (program_id, year_id)');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 7: Check period_timings table
  console.log('\n📋 Test 7: Period timings table');
  try {
    const { data, error } = await supabase
      .from('period_timings')
      .select('id, period_number, start_time, end_time, is_break')
      .order('period_number');
    
    if (error) throw error;
    console.log(`   ✅ Period timings table exists with ${data?.length || 0} entries`);
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 8: Check students table for current_year_id
  console.log('\n📋 Test 8: Students table - current_year_id column');
  try {
    const { data, error } = await supabase
      .from('students')
      .select('id, user_id, year_id, current_year_id, program_id')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Students table has current_year_id column');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 9: Check profiles table for department_id
  console.log('\n📋 Test 9: Profiles table - department_id column');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, primary_role, department_id')
      .limit(1);
    
    if (error) throw error;
    console.log('   ✅ Profiles table has department_id column');
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 10: Check programs table
  console.log('\n📋 Test 10: Programs table');
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('id, code, name, department_id')
      .limit(5);
    
    if (error) throw error;
    console.log(`   ✅ Programs table exists with ${data?.length || 0} programs`);
    if (data && data.length > 0) {
      data.forEach(p => console.log(`      - ${p.code}: ${p.name}`));
    }
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 11: Check years table
  console.log('\n📋 Test 11: Years table');
  try {
    const { data, error } = await supabase
      .from('years')
      .select('id, year_number, name')
      .order('year_number');
    
    if (error) throw error;
    console.log(`   ✅ Years table exists with ${data?.length || 0} years`);
    if (data && data.length > 0) {
      data.forEach(y => console.log(`      - Year ${y.year_number}: ${y.name}`));
    }
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 12: Test attendance query with joins (like frontend does)
  console.log('\n📋 Test 12: Complex attendance query with joins');
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        period,
        course_id,
        program_id,
        year_id,
        marked_by,
        courses(name, code),
        profiles:marked_by(full_name)
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   ✅ Complex attendance query works (${data?.length || 0} records)`);
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Test 13: Test attendance_records query with joins
  console.log('\n📋 Test 13: Attendance records with student join');
  try {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(`
        id,
        status,
        late_minutes,
        students!inner(
          id,
          registration_number,
          roll_number,
          profiles:user_id(full_name)
        )
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   ✅ Attendance records join query works (${data?.length || 0} records)`);
    passed++;
  } catch (err) {
    console.log('   ❌ Failed:', err.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The database schema is correctly set up.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
  }

  return failed === 0;
}

runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
