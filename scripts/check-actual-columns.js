// Get actual schema information from Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function getTableSchema(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) throw error;
    
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    // If no data, try to infer from empty result
    const { data: emptyData, error: emptyError } = await supabase.from(tableName).select('*').limit(0);
    if (emptyError) throw emptyError;
    return ['No data to infer columns'];
  } catch (err) {
    return null;
  }
}

async function checkViews() {
  console.log('🔍 CHECKING FOR VIEWS/ALIASES\n');
  
  const suspiciousTables = ['users', 'library_books', 'bus_subscriptions', 'assignments'];
  
  for (const table of suspiciousTables) {
    console.log(`\n📋 ${table.toUpperCase()}:`);
    const cols = await getTableSchema(table);
    if (cols) {
      console.log(`  ✅ Table exists`);
      console.log(`  Columns: ${cols.join(', ')}`);
    } else {
      console.log(`  ❌ Table does not exist`);
    }
  }
  
  // Check actual column names for problematic tables
  console.log('\n\n🔍 VERIFYING COLUMN NAMES\n');
  
  const tests = [
    { table: 'attendance', expectedMissing: 'status', expectedExists: ['id', 'date', 'period'] },
    { table: 'profiles', expectedMissing: 'is_active', expectedExists: ['id', 'status'] },
    { table: 'students', expectedMissing: 'batch_id', expectedExists: ['id', 'user_id'] },
    { table: 'exams', expectedMissing: 'date', expectedExists: ['id', 'start_date', 'end_date'] },
    { table: 'notices', expectedMissing: 'is_published', expectedExists: ['id', 'is_active'] }
  ];
  
  for (const test of tests) {
    console.log(`\n📋 ${test.table.toUpperCase()}:`);
    const cols = await getTableSchema(test.table);
    if (cols) {
      console.log(`  All columns: ${cols.join(', ')}`);
      console.log(`  Expected missing "${test.expectedMissing}": ${cols.includes(test.expectedMissing) ? '❌ EXISTS (unexpected)' : '✅ MISSING (as expected)'}`);
      for (const exp of test.expectedExists) {
        console.log(`  Expected exists "${exp}": ${cols.includes(exp) ? '✅ EXISTS' : '❌ MISSING'}`);
      }
    }
  }
}

checkViews().catch(console.error);
