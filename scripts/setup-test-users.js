// Script to run SQL setup functions for test users
// Run: node scripts/setup-test-users.js

const https = require('https');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY environment variable required');
  process.exit(1);
}

async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/`);
    
    // Extract function name and parameter from SQL like: SELECT setup_test_admin('email@test.com')
    const match = sql.match(/SELECT\s+(\w+)\('([^']+)'\)/i);
    if (!match) {
      reject(new Error('Invalid SQL format'));
      return;
    }
    
    const functionName = match[1];
    const email = match[2];
    
    const data = JSON.stringify({ user_email: email });
    
    const options = {
      hostname: url.hostname,
      path: `/rest/v1/rpc/${functionName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, result: body });
        } else {
          resolve({ success: false, error: body, status: res.statusCode });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Setting up test user profiles and roles...\n');
  
  const setupCommands = [
    { sql: "SELECT setup_test_admin('admin@jpmcollege.edu')", label: 'Admin' },
    { sql: "SELECT setup_test_teacher('teacher@jpmcollege.edu')", label: 'Teacher' },
    { sql: "SELECT setup_test_student('student@jpmcollege.edu')", label: 'Student' },
  ];
  
  for (const cmd of setupCommands) {
    try {
      const result = await runSQL(cmd.sql);
      if (result.success) {
        console.log(`✅ ${cmd.label} setup complete: ${result.result}`);
      } else {
        console.log(`⚠️  ${cmd.label} setup issue: ${result.error}`);
      }
    } catch (err) {
      console.log(`❌ ${cmd.label} error: ${err.message}`);
    }
  }
  
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test users are ready! You can now log in with:

  Admin:   admin@jpmcollege.edu    / Admin@123
  Teacher: teacher@jpmcollege.edu  / Teacher@123
  Student: student@jpmcollege.edu  / Student@123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch(console.error);
