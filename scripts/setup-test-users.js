// Script to run SQL setup functions for test users
// Run: node scripts/setup-test-users.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';

function loadServiceRoleKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fallback: read from repo-local .env (gitignored) without requiring dotenv.
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return null;

    const raw = fs.readFileSync(envPath, 'utf8');
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      if (key !== 'SUPABASE_SERVICE_ROLE_KEY') continue;
      let value = trimmed.slice(idx + 1).trim();
      // Strip surrounding quotes.
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      return value || null;
    }
  } catch {
    // ignore
  }

  return null;
}

const SERVICE_ROLE_KEY = loadServiceRoleKey();

if (!SERVICE_ROLE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY is required (env var or .env file)');
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

function restRequest(pathnameWithQuery, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${pathnameWithQuery}`);
    const data = body ? JSON.stringify(body) : null;

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation',
    };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        let parsed = responseBody;
        try {
          parsed = JSON.parse(responseBody || 'null');
        } catch {
          // keep as string
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function ensureCseDepartment() {
  // setup_test_teacher() assumes departments.code='CSE' exists.
  const lookup = await restRequest('/rest/v1/departments?code=eq.CSE&select=id');
  if (lookup.status >= 200 && lookup.status < 300 && Array.isArray(lookup.body) && lookup.body[0]?.id) {
    return lookup.body[0].id;
  }

  const create = await restRequest('/rest/v1/departments', 'POST', {
    code: 'CSE',
    name: 'Computer Science and Engineering',
    short_name: 'CSE',
    is_active: true,
  });

  if (!(create.status >= 200 && create.status < 300) || !Array.isArray(create.body) || !create.body[0]?.id) {
    const msg = typeof create.body === 'string' ? create.body : JSON.stringify(create.body);
    throw new Error(`Failed to ensure CSE department (status ${create.status}): ${msg}`);
  }

  return create.body[0].id;
}

async function main() {
  console.log('Setting up test user profiles and roles...\n');

  try {
    await ensureCseDepartment();
  } catch (e) {
    console.log(`⚠️  Preflight warning: ${e.message}`);
    console.log('   Continuing anyway (RPC functions may still fail if required reference data is missing).\n');
  }
  
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
