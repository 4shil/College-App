// Quick diagnostic script to check table accessibility
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://celwfcflcofejjpkpgcq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHdmY2ZsY29mZWpqcGtwZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEzNTQsImV4cCI6MjA3OTgzNzM1NH0.hDdQIjIy5fkmdXV2GjWlATujnXgVcXZD932_k1KvLwA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableAccess() {
  console.log('\nChecking table accessibility...\n');
  
  const tables = [
    'students', 'teachers', 'courses', 'departments', 
    'profiles', 'notices', 'attendance', 'exams', 
    'assignments', 'library_books', 'book_issues', 
    'fee_payments', 'academic_years', 'timetable_entries'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✓ ${table}: ${count !== null ? count + ' records' : 'accessible'}`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

checkTableAccess().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
