// Run seed SQL via Supabase client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
// You need SERVICE_ROLE key to run admin SQL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  SUPABASE SERVICE ROLE KEY REQUIRED                               ║
╠═══════════════════════════════════════════════════════════════════╣
║  To run seed SQL via CLI, you need the service role key.          ║
║                                                                   ║
║  Option 1: Set environment variable and re-run:                   ║
║  $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"         ║
║  node scripts/seed-db.js                                          ║
║                                                                   ║
║  Option 2: Run SQL directly in Supabase Dashboard:                ║
║  1. Go to: https://supabase.com/dashboard/project/celwfcflcofejjpkpgcq/sql  
║  2. Copy contents of: supabase/run_seed.sql                       ║
║  3. Paste and Run                                                 ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runSeed() {
  try {
    console.log('Reading seed file...');
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'run_seed.sql'),
      'utf8'
    );

    console.log('Executing seed SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: seedSQL });
    
    if (error) {
      // Try running individual statements
      console.log('Running statements individually...');
      const statements = seedSQL
        .split(/;\s*$/m)
        .filter(s => s.trim() && !s.trim().startsWith('--'));
      
      for (const stmt of statements) {
        if (stmt.trim()) {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: stmt });
          if (stmtError) {
            console.error('Statement error:', stmtError.message);
          }
        }
      }
    }

    console.log('✅ Seed completed!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

runSeed();
