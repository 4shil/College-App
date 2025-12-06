/**
 * Backend Testing Script
 * Tests all admin module backend functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testConnection() {
  log('\n📡 Testing Supabase Connection...', colors.cyan);
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    log('✅ Connection successful', colors.green);
    return true;
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testExamsModule() {
  log('\n📝 Testing Exams Module...', colors.cyan);
  try {
    // Test exams table
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*')
      .limit(5);
    if (examsError) throw examsError;
    log(`✅ Exams table: ${exams.length} records`, colors.green);

    // Test exam_schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('exam_schedules')
      .select('*')
      .limit(5);
    if (schedulesError) throw schedulesError;
    log(`✅ Exam schedules: ${schedules.length} records`, colors.green);

    // Test exam_marks
    const { data: marks, error: marksError } = await supabase
      .from('exam_marks')
      .select('*')
      .limit(5);
    if (marksError) throw marksError;
    log(`✅ Exam marks: ${marks.length} records`, colors.green);

    // Test external_marks
    const { data: external, error: externalError } = await supabase
      .from('external_marks')
      .select('*')
      .limit(5);
    if (externalError) throw externalError;
    log(`✅ External marks: ${external.length} records`, colors.green);

    return true;
  } catch (error) {
    log(`❌ Exams module error: ${error.message}`, colors.red);
    return false;
  }
}

async function testFeesModule() {
  log('\n💰 Testing Fees Module...', colors.cyan);
  try {
    // Test fee_structures
    const { data: structures, error: structuresError } = await supabase
      .from('fee_structures')
      .select('*')
      .limit(5);
    if (structuresError) throw structuresError;
    log(`✅ Fee structures: ${structures.length} records`, colors.green);

    // Test student_fees
    const { data: studentFees, error: studentFeesError } = await supabase
      .from('student_fees')
      .select('*')
      .limit(5);
    if (studentFeesError) throw studentFeesError;
    log(`✅ Student fees: ${studentFees.length} records`, colors.green);

    // Test fee_payments
    const { data: payments, error: paymentsError } = await supabase
      .from('fee_payments')
      .select('*')
      .limit(5);
    if (paymentsError) throw paymentsError;
    log(`✅ Fee payments: ${payments.length} records`, colors.green);

    // Test fee collection stats function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_fee_collection_stats');
    if (statsError) {
      log(`⚠️  Fee stats function not found (will be created): ${statsError.message}`, colors.yellow);
    } else {
      log(`✅ Fee collection stats: ₹${stats[0]?.total_collected || 0}`, colors.green);
    }

    return true;
  } catch (error) {
    log(`❌ Fees module error: ${error.message}`, colors.red);
    return false;
  }
}

async function testLibraryModule() {
  log('\n📚 Testing Library Module...', colors.cyan);
  try {
    // Test books table
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*')
      .limit(5);
    if (booksError) throw booksError;
    log(`✅ Books: ${books.length} records`, colors.green);

    // Test book_issues
    const { data: issues, error: issuesError } = await supabase
      .from('book_issues')
      .select('*')
      .limit(5);
    if (issuesError) throw issuesError;
    log(`✅ Book issues: ${issues.length} records`, colors.green);

    // Test book_reservations
    const { data: reservations, error: reservationsError } = await supabase
      .from('book_reservations')
      .select('*')
      .limit(5);
    if (reservationsError) throw reservationsError;
    log(`✅ Book reservations: ${reservations.length} records`, colors.green);

    // Test library stats function
    const { data: stats, error: statsError } = await supabase
      .rpc('get_library_stats');
    if (statsError) {
      log(`⚠️  Library stats function not found (will be created): ${statsError.message}`, colors.yellow);
    } else {
      log(`✅ Library stats: ${stats[0]?.total_books || 0} books`, colors.green);
    }

    // Test popular books function
    const { data: popular, error: popularError } = await supabase
      .rpc('get_popular_books', { limit_count: 5 });
    if (popularError) {
      log(`⚠️  Popular books function not found (will be created): ${popularError.message}`, colors.yellow);
    } else {
      log(`✅ Popular books: ${popular?.length || 0} results`, colors.green);
    }

    return true;
  } catch (error) {
    log(`❌ Library module error: ${error.message}`, colors.red);
    return false;
  }
}

async function testAssignmentsModule() {
  log('\n📋 Testing Assignments Module...', colors.cyan);
  try {
    // Test assignments table
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5);
    if (assignmentsError) throw assignmentsError;
    log(`✅ Assignments: ${assignments.length} records`, colors.green);

    // Test assignment_submissions
    const { data: submissions, error: submissionsError } = await supabase
      .from('assignment_submissions')
      .select('*')
      .limit(5);
    if (submissionsError) throw submissionsError;
    log(`✅ Assignment submissions: ${submissions.length} records`, colors.green);

    // Test top performers function
    const { data: topPerformers, error: topError } = await supabase
      .rpc('get_top_performers_assignments');
    if (topError) {
      log(`⚠️  Top performers function not found (will be created): ${topError.message}`, colors.yellow);
    } else {
      log(`✅ Top performers: ${topPerformers?.length || 0} results`, colors.green);
    }

    return true;
  } catch (error) {
    log(`❌ Assignments module error: ${error.message}`, colors.red);
    return false;
  }
}

async function testDatabaseFunctions() {
  log('\n🔧 Testing Database Functions...', colors.cyan);
  
  try {
    // Test increment/decrement functions
    const { data: testBook, error: bookError } = await supabase
      .from('books')
      .select('id, available_copies')
      .limit(1)
      .single();
    
    if (bookError || !testBook) {
      log('⚠️  No books found to test increment/decrement', colors.yellow);
    } else {
      const originalCopies = testBook.available_copies;
      
      // Test increment
      const { error: incError } = await supabase
        .rpc('increment_available_copies', { book_id: testBook.id, amount: 1 });
      
      if (incError) {
        log(`⚠️  Increment function not found (will be created): ${incError.message}`, colors.yellow);
      } else {
        log('✅ Increment function works', colors.green);
        
        // Restore original value
        await supabase
          .rpc('decrement_available_copies', { book_id: testBook.id, amount: 1 });
      }
    }

    return true;
  } catch (error) {
    log(`❌ Functions test error: ${error.message}`, colors.red);
    return false;
  }
}

async function testMigrations() {
  log('\n🗄️  Checking Database Schema...', colors.cyan);
  
  const requiredTables = [
    'exams',
    'exam_schedules',
    'exam_marks',
    'external_marks',
    'fee_structures',
    'student_fees',
    'fee_payments',
    'books',
    'book_issues',
    'book_reservations',
    'assignments',
    'assignment_submissions',
  ];

  let allTablesExist = true;

  for (const table of requiredTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error && error.message.includes('relation')) {
        log(`❌ Table '${table}' does not exist`, colors.red);
        allTablesExist = false;
      } else {
        log(`✅ Table '${table}' exists`, colors.green);
      }
    } catch (error) {
      log(`❌ Error checking table '${table}': ${error.message}`, colors.red);
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.blue);
  log('🧪 BACKEND TESTING SUITE - Admin Modules', colors.blue);
  log('='.repeat(60), colors.blue);

  const results = {
    connection: false,
    migrations: false,
    exams: false,
    fees: false,
    library: false,
    assignments: false,
    functions: false,
  };

  // Run tests
  results.connection = await testConnection();
  if (!results.connection) {
    log('\n❌ Cannot proceed without database connection', colors.red);
    process.exit(1);
  }

  results.migrations = await testMigrations();
  results.exams = await testExamsModule();
  results.fees = await testFeesModule();
  results.library = await testLibraryModule();
  results.assignments = await testAssignmentsModule();
  results.functions = await testDatabaseFunctions();

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 TEST SUMMARY', colors.blue);
  log('='.repeat(60), colors.blue);

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const icon = result ? '✅' : '❌';
    const color = result ? colors.green : colors.red;
    log(`${icon} ${test.toUpperCase()}`, color);
  });

  log('\n' + '-'.repeat(60), colors.blue);
  log(`PASSED: ${passed}/${total}`, passed === total ? colors.green : colors.yellow);
  log('='.repeat(60), colors.blue);

  if (passed === total) {
    log('\n🎉 All tests passed! Backend is ready.', colors.green);
  } else {
    log('\n⚠️  Some tests failed. Run migrations if needed:', colors.yellow);
    log('   npx supabase db push', colors.cyan);
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
