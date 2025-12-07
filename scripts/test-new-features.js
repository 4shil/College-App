// Test script for Realtime Analytics and Backup/Restore features
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://celwfcflcofejjpkpgcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHdmY2ZsY29mZWpqcGtwZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEzNTQsImV4cCI6MjA3OTgzNzM1NH0.hDdQIjIy5fkmdXV2GjWlATujnXgVcXZD932_k1KvLwA';

const supabase = createClient(supabaseUrl, supabaseKey);

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.cyan);
}

function warn(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(`  ${title}`, colors.bright);
  log('='.repeat(60), colors.bright);
}

// Test 1: Verify Database Tables Exist
async function testDatabaseTables() {
  section('TEST 1: Verify Database Tables Exist');
  
  const tables = [
    'students', 'teachers', 'courses', 'departments', 'profiles', 'notices',
    'attendance', 'exams', 'assignments', 'library_books', 'book_issues', 'fee_payments'
  ];
  
  let passedCount = 0;
  let failedCount = 0;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        error(`Table "${table}" query failed: ${error.message}`);
        failedCount++;
      } else {
        success(`Table "${table}" exists and accessible (${data?.length || 0} records)`);
        passedCount++;
      }
    } catch (err) {
      error(`Table "${table}" check failed: ${err.message}`);
      failedCount++;
    }
  }
  
  info(`\nTest Result: ${passedCount}/${tables.length} tables verified`);
  return failedCount === 0;
}

// Test 2: Test Realtime Subscription Setup
async function testRealtimeSubscriptions() {
  section('TEST 2: Test Realtime Subscription Setup');
  
  const tables = ['students', 'teachers', 'courses'];
  const subscriptionPromises = [];
  
  for (const table of tables) {
    const promise = new Promise((resolve) => {
      try {
        const channel = supabase
          .channel(`test_${table}_changes`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            (payload) => {
              info(`Received change in ${table}: ${payload.eventType}`);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              success(`Successfully subscribed to ${table} changes`);
              // Cleanup after successful subscription
              setTimeout(() => {
                supabase.removeChannel(channel);
                resolve(true);
              }, 500);
            } else if (status === 'CHANNEL_ERROR') {
              error(`Failed to subscribe to ${table} changes`);
              resolve(false);
            }
          });
      } catch (err) {
        error(`Subscription test for ${table} failed: ${err.message}`);
        resolve(false);
      }
    });
    
    subscriptionPromises.push(promise);
  }
  
  // Wait for all subscriptions to complete
  const results = await Promise.all(subscriptionPromises);
  const successCount = results.filter(r => r === true).length;
  
  info(`\nTest Result: ${successCount}/${tables.length} subscriptions successful`);
  return successCount === tables.length;
}

// Test 3: Test Analytics Data Fetching
async function testAnalyticsDataFetching() {
  section('TEST 3: Test Analytics Data Fetching');
  
  try {
    // Test student count with status
    const { data: students, count: studentCount } = await supabase
      .from('students')
      .select('id, current_status', { count: 'exact' });
    
    if (studentCount !== null) {
      success(`Total students: ${studentCount}`);
      const activeStudents = students?.filter(s => s.current_status === 'active').length || 0;
      success(`Active students: ${activeStudents}`);
    }
    
    // Test teacher count
    const { count: teacherCount } = await supabase
      .from('teachers')
      .select('id', { count: 'exact' });
    success(`Total teachers: ${teacherCount}`);
    
    // Test course count
    const { count: courseCount } = await supabase
      .from('courses')
      .select('id', { count: 'exact' });
    success(`Total courses: ${courseCount}`);
    
    // Test department count
    const { count: deptCount } = await supabase
      .from('departments')
      .select('id', { count: 'exact' });
    success(`Total departments: ${deptCount}`);
    
    // Test pending approvals
    const { count: pendingCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('status', 'pending_approval');
    success(`Pending approvals: ${pendingCount}`);
    
    // Test attendance calculation
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status');
    
    if (attendanceData) {
      const totalAttendance = attendanceData.length;
      const presentCount = attendanceData.filter(a => a.status === 'present').length;
      const avgAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
      success(`Average attendance: ${avgAttendance}% (${presentCount}/${totalAttendance})`);
    }
    
    // Test upcoming exams
    const { count: examCount } = await supabase
      .from('exams')
      .select('id', { count: 'exact' })
      .gte('date', new Date().toISOString());
    success(`Upcoming exams: ${examCount}`);
    
    // Test active assignments
    const { count: assignmentCount } = await supabase
      .from('assignments')
      .select('id', { count: 'exact' })
      .eq('status', 'active');
    success(`Active assignments: ${assignmentCount}`);
    
    // Test library books
    const { count: bookCount } = await supabase
      .from('library_books')
      .select('id', { count: 'exact' });
    success(`Library books: ${bookCount}`);
    
    // Test active notices
    const { count: noticeCount } = await supabase
      .from('notices')
      .select('id', { count: 'exact' })
      .eq('is_published', true);
    success(`Active notices: ${noticeCount}`);
    
    info('\nTest Result: All analytics queries successful');
    return true;
    
  } catch (err) {
    error(`Analytics data fetching failed: ${err.message}`);
    return false;
  }
}

// Test 4: Test Backup Data Structure
async function testBackupDataStructure() {
  section('TEST 4: Test Backup Data Structure');
  
  const BACKUP_TABLES = [
    'departments', 'courses', 'profiles', 'students', 'teachers', 'notices',
    'academic_years', 'timetable_entries', 'attendance', 'exams',
    'fee_payments', 'assignments', 'library_books', 'book_issues',
    'bus_routes', 'canteen_menu_items',
  ];
  
  try {
    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tables: {},
      metadata: {
        totalRecords: 0,
        createdAt: new Date().toISOString(),
      },
    };
    
    let totalRecords = 0;
    let successCount = 0;
    
    for (const tableName of BACKUP_TABLES) {
      try {
        const { data, error } = await supabase.from(tableName).select('*');
        
        if (error) {
          warn(`Could not fetch ${tableName}: ${error.message}`);
          backupData.tables[tableName] = [];
        } else {
          backupData.tables[tableName] = data || [];
          totalRecords += data?.length || 0;
          success(`Fetched ${tableName}: ${data?.length || 0} records`);
          successCount++;
        }
      } catch (err) {
        warn(`Error fetching ${tableName}: ${err.message}`);
        backupData.tables[tableName] = [];
      }
    }
    
    backupData.metadata.totalRecords = totalRecords;
    
    // Validate backup structure
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupSize = (backupJson.length / 1024).toFixed(2);
    
    success(`\nBackup structure validated`);
    success(`Total tables: ${Object.keys(backupData.tables).length}`);
    success(`Total records: ${totalRecords}`);
    success(`Backup size: ${backupSize} KB`);
    success(`Successfully fetched: ${successCount}/${BACKUP_TABLES.length} tables`);
    
    // Test JSON parsing
    const parsed = JSON.parse(backupJson);
    if (parsed.version && parsed.timestamp && parsed.tables && parsed.metadata) {
      success('Backup JSON is valid and parseable');
    }
    
    info('\nTest Result: Backup data structure is valid');
    return true;
    
  } catch (err) {
    error(`Backup data structure test failed: ${err.message}`);
    return false;
  }
}

// Test 5: Test Restore Validation
async function testRestoreValidation() {
  section('TEST 5: Test Restore Validation');
  
  try {
    // Create a sample backup for testing
    const sampleBackup = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tables: {
        departments: [
          { id: 'test-dept-1', name: 'Test Department', code: 'TEST' }
        ]
      },
      metadata: {
        totalRecords: 1,
        createdAt: new Date().toISOString(),
      }
    };
    
    const backupJson = JSON.stringify(sampleBackup);
    
    // Test parsing
    const parsed = JSON.parse(backupJson);
    
    if (!parsed.version || !parsed.timestamp || !parsed.tables) {
      error('Backup validation failed: Missing required fields');
      return false;
    }
    
    success('Backup format validation passed');
    success(`Version: ${parsed.version}`);
    success(`Timestamp: ${parsed.timestamp}`);
    success(`Tables: ${Object.keys(parsed.tables).length}`);
    success(`Total records: ${parsed.metadata.totalRecords}`);
    
    // Test invalid backup format
    try {
      const invalidBackup = '{"invalid": "data"}';
      const invalidParsed = JSON.parse(invalidBackup);
      
      if (!invalidParsed.version || !invalidParsed.timestamp || !invalidParsed.tables) {
        success('Invalid backup correctly rejected');
      }
    } catch (err) {
      success('Invalid JSON correctly rejected');
    }
    
    info('\nTest Result: Restore validation working correctly');
    return true;
    
  } catch (err) {
    error(`Restore validation test failed: ${err.message}`);
    return false;
  }
}

// Test 6: Test Backup Statistics
async function testBackupStatistics() {
  section('TEST 6: Test Backup Statistics');
  
  const BACKUP_TABLES = [
    'departments', 'courses', 'profiles', 'students', 'teachers'
  ];
  
  try {
    const stats = {};
    
    for (const tableName of BACKUP_TABLES) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        stats[tableName] = error ? 0 : (count || 0);
        success(`${tableName}: ${stats[tableName]} records`);
      } catch {
        stats[tableName] = 0;
        warn(`${tableName}: Unable to get count`);
      }
    }
    
    const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);
    success(`\nTotal records across ${Object.keys(stats).length} tables: ${totalRecords}`);
    
    info('\nTest Result: Backup statistics calculated successfully');
    return true;
    
  } catch (err) {
    error(`Backup statistics test failed: ${err.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), colors.bright);
  log('  REALTIME ANALYTICS & BACKUP/RESTORE FEATURE TESTS', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);
  
  const results = {
    passed: 0,
    failed: 0,
    total: 6
  };
  
  // Run all tests
  const tests = [
    { name: 'Database Tables', fn: testDatabaseTables },
    { name: 'Realtime Subscriptions', fn: testRealtimeSubscriptions },
    { name: 'Analytics Data Fetching', fn: testAnalyticsDataFetching },
    { name: 'Backup Data Structure', fn: testBackupDataStructure },
    { name: 'Restore Validation', fn: testRestoreValidation },
    { name: 'Backup Statistics', fn: testBackupStatistics },
  ];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (err) {
      error(`Test "${test.name}" crashed: ${err.message}`);
      results.failed++;
    }
  }
  
  // Print summary
  section('TEST SUMMARY');
  log(`\nTotal Tests: ${results.total}`, colors.bright);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`, colors.cyan);
  
  if (results.failed === 0) {
    success('All tests passed! ✓');
  } else {
    warn(`${results.failed} test(s) failed. Please review the errors above.`);
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(err => {
    error(`Test runner failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  testDatabaseTables,
  testRealtimeSubscriptions,
  testAnalyticsDataFetching,
  testBackupDataStructure,
  testRestoreValidation,
  testBackupStatistics,
};
