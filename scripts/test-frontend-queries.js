/**
 * Test script for Frontend Queries - simulates what the React components do
 * Run with: node scripts/test-frontend-queries.js
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('\n🧪 Running Frontend Query Tests\n');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Timetable Index - Fetch Programs
  try {
    const { data, error } = await supabase
      .from('programs')
      .select('id, name, code')
      .order('name');
    
    if (error) throw error;
    console.log(`📋 Test 1: Fetch Programs`);
    console.log(`   ✅ Found ${data.length} programs`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 1: Fetch Programs`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 2: Timetable Index - Fetch Years
  try {
    const { data, error } = await supabase
      .from('years')
      .select('id, year_number, name')
      .order('year_number');
    
    if (error) throw error;
    console.log(`📋 Test 2: Fetch Years`);
    console.log(`   ✅ Found ${data.length} years`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 2: Fetch Years`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 3: Timetable Index - Fetch Entries with Joins
  try {
    const { data, error } = await supabase
      .from('timetable_entries')
      .select(`
        id,
        day_of_week,
        period,
        room,
        courses(id, code, name, short_name),
        teachers(id, profiles(full_name))
      `)
      .order('day_of_week')
      .order('period');
    
    if (error) throw error;
    console.log(`📋 Test 3: Timetable Entries with Joins`);
    console.log(`   ✅ Query succeeded with ${data.length} entries`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 3: Timetable Entries with Joins`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 4: Timetable Create - Fetch Courses
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, code, name, short_name')
      .order('name');
    
    if (error) throw error;
    console.log(`📋 Test 4: Fetch Courses`);
    console.log(`   ✅ Found ${data.length} courses`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 4: Fetch Courses`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 5: Timetable Create - Fetch Teachers
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select(`
        id,
        user_id,
        employee_id,
        profiles:user_id(full_name)
      `)
      .order('employee_id');
    
    if (error) throw error;
    console.log(`📋 Test 5: Fetch Teachers with Profile Join`);
    console.log(`   ✅ Query succeeded with ${data.length} teachers`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 5: Fetch Teachers with Profile Join`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 6: Attendance Mark - Fetch Students
  try {
    const { data: yearData } = await supabase
      .from('years')
      .select('id')
      .eq('year_number', 1)
      .single();

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        roll_number,
        registration_number,
        user_id,
        profiles:user_id(full_name)
      `)
      .eq('current_year_id', yearData?.id || '')
      .order('roll_number');
    
    if (error) throw error;
    console.log(`📋 Test 6: Fetch Students for Attendance`);
    console.log(`   ✅ Query succeeded with ${data.length} students`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 6: Fetch Students for Attendance`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 7: Attendance Reports - Complex Query
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        period,
        is_locked,
        programs(name, code),
        years(name, year_number),
        timetable_entries!inner(
          id,
          courses(name, code)
        ),
        attendance_records(
          id,
          status,
          late_minutes,
          students(
            roll_number,
            profiles:user_id(full_name)
          )
        )
      `)
      .gte('date', '2024-01-01')
      .lte('date', today)
      .order('date', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    console.log(`📋 Test 7: Attendance Reports Complex Query`);
    console.log(`   ✅ Query succeeded with ${data.length} records`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 7: Attendance Reports Complex Query`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 8: Holidays Table
  try {
    const { data, error } = await supabase
      .from('holidays')
      .select('*')
      .order('date');
    
    if (error) throw error;
    console.log(`📋 Test 8: Fetch Holidays`);
    console.log(`   ✅ Query succeeded with ${data.length} holidays`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 8: Fetch Holidays`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 9: Attendance Logs
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        action_type,
        performed_by,
        performer_role,
        target_type,
        target_id,
        student_id,
        timetable_entry_id,
        details,
        created_at,
        performer:profiles!attendance_logs_performed_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    console.log(`📋 Test 9: Attendance Logs with Performer Join`);
    console.log(`   ✅ Query succeeded with ${data.length} logs`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 9: Attendance Logs with Performer Join`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 10: Attendance Stats (for dashboard/index)
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Today's attendance count
    const { count: todayCount, error: err1 } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('date', today);
    
    if (err1) throw err1;

    // Total attendance records
    const { count: totalRecords, error: err2 } = await supabase
      .from('attendance_records')
      .select('id', { count: 'exact', head: true });
    
    if (err2) throw err2;

    console.log(`📋 Test 10: Attendance Statistics`);
    console.log(`   ✅ Today: ${todayCount || 0} sessions, Total Records: ${totalRecords || 0}`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 10: Attendance Statistics`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 11: Students with year/program
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        roll_number,
        registration_number,
        current_year_id,
        program_id,
        user_id,
        profiles:user_id(full_name, email),
        programs(name, code),
        years:current_year_id(name, year_number)
      `)
      .limit(10);
    
    if (error) throw error;
    console.log(`📋 Test 11: Students with Program/Year Joins`);
    console.log(`   ✅ Query succeeded with ${data.length} students`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 11: Students with Program/Year Joins`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // Test 12: Late Passes
  try {
    const { data, error } = await supabase
      .from('late_passes')
      .select(`
        id,
        month,
        year,
        late_count,
        half_day_leaves_deducted,
        students(
          roll_number,
          profiles:user_id(full_name)
        )
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    console.log(`📋 Test 12: Late Passes with Joins`);
    console.log(`   ✅ Query succeeded with ${data.length} late passes`);
    passed++;
  } catch (e) {
    console.log(`📋 Test 12: Late Passes with Joins`);
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All frontend queries work correctly!\n');
  } else {
    console.log('⚠️ Some queries failed. Check the errors above.\n');
  }
}

runTests().catch(console.error);
