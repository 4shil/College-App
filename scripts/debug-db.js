// Debug script to check users and database state
const https = require('https');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const data = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };
    
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody || '{}') });
        } catch {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍 Checking database state...\n');
  
  // Check auth users
  console.log('📋 Auth Users:');
  const authUsers = await request('/auth/v1/admin/users');
  if (authUsers.data.users) {
    authUsers.data.users.forEach(u => {
      console.log(`  - ${u.email} (${u.id})`);
    });
  } else {
    console.log('  No users found or error:', authUsers.data);
  }
  
  // Check profiles table
  console.log('\n📋 Profiles:');
  const profiles = await request('/rest/v1/profiles?select=id,email,full_name,primary_role');
  if (Array.isArray(profiles.data)) {
    if (profiles.data.length === 0) {
      console.log('  No profiles found');
    } else {
      profiles.data.forEach(p => {
        console.log(`  - ${p.email} | ${p.full_name} | Role: ${p.primary_role}`);
      });
    }
  } else {
    console.log('  Error:', profiles.data);
  }
  
  // Check roles
  console.log('\n📋 Roles:');
  const roles = await request('/rest/v1/roles?select=name,category&limit=5');
  if (Array.isArray(roles.data)) {
    roles.data.forEach(r => console.log(`  - ${r.name} (${r.category})`));
    console.log('  ... and more');
  }
  
  // Check departments
  console.log('\n📋 Departments:');
  const depts = await request('/rest/v1/departments?select=code,name');
  if (Array.isArray(depts.data)) {
    depts.data.forEach(d => console.log(`  - ${d.code}: ${d.name}`));
  }
}

main().catch(console.error);
