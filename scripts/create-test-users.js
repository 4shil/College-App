// Script to create test users via Supabase Auth Admin API
// Run: node scripts/create-test-users.js

const https = require('https');

const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║  SERVICE ROLE KEY REQUIRED                                                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Get your service role key from Supabase Dashboard:                       ║
║  Settings > API > service_role (secret)                                   ║
║                                                                           ║
║  Then run:                                                                ║
║  $env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key-here"            ║
║  node scripts/create-test-users.js                                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  process.exit(0);
}

function request(path, method = 'GET', body = null) {
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

const testUsers = [
  { email: 'admin@jpmcollege.edu', password: 'Admin@123', full_name: 'Super Administrator', role: 'super_admin' },
  { email: 'teacher@jpmcollege.edu', password: 'Teacher@123', full_name: 'Dr. John Smith', role: 'subject_teacher' },
  { email: 'student@jpmcollege.edu', password: 'Student@123', full_name: 'Rahul Kumar', role: 'student' },
];

async function createUser(user) {
  // Create user via Auth Admin API
  const result = await request('/auth/v1/admin/users', 'POST', {
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: user.full_name,
      role: user.role
    }
  });
  
  return { 
    success: result.status >= 200 && result.status < 300, 
    userId: result.data?.id,
    email: user.email, 
    error: result.data?.message || result.data?.msg || result.data?.error_description
  };
}

async function setupUserRoles(userId, email, role) {
  // Get role ID
  const roleResult = await request(`/rest/v1/roles?name=eq.${role}&select=id`);
  if (!Array.isArray(roleResult.data) || roleResult.data.length === 0) {
    return { success: false, error: 'Role not found: ' + role };
  }
  const roleId = roleResult.data[0].id;
  
  // Insert user_role
  const insertResult = await request('/rest/v1/user_roles', 'POST', {
    user_id: userId,
    role_id: roleId,
    is_active: true
  });
  
  return { 
    success: insertResult.status >= 200 && insertResult.status < 300,
    error: insertResult.data?.message
  };
}

async function main() {
  console.log('🚀 Creating test users...\n');
  
  for (const user of testUsers) {
    try {
      // Step 1: Create auth user
      const createResult = await createUser(user);
      
      if (createResult.success) {
        console.log(`✅ Created auth user: ${user.email}`);
        
        // Step 2: Setup roles
        const roleResult = await setupUserRoles(createResult.userId, user.email, user.role);
        if (roleResult.success) {
          console.log(`   ✅ Assigned role: ${user.role}`);
        } else {
          console.log(`   ⚠️  Role assignment: ${roleResult.error}`);
        }
      } else if (createResult.error?.includes('already') || createResult.error?.includes('exists')) {
        console.log(`⚠️  ${user.email}: Already exists`);
      } else {
        console.log(`❌ ${user.email}: ${createResult.error}`);
      }
    } catch (err) {
      console.log(`❌ Error with ${user.email}: ${err.message}`);
    }
    console.log('');
  }
  
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test users ready! Login credentials:

  Admin:   admin@jpmcollege.edu    / Admin@123
  Teacher: teacher@jpmcollege.edu  / Teacher@123
  Student: student@jpmcollege.edu  / Student@123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch(console.error);
