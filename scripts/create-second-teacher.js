// Creates a second test teacher (auth user + profile/roles + teachers row) in a non-destructive way.
// Run: node scripts/create-second-teacher.js
// Requires: SUPABASE_SERVICE_ROLE_KEY in env var or repo-root .env

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://celwfcflcofejjpkpgcq.supabase.co';

function loadEnvVar(name) {
  if (process.env[name]) return process.env[name];
  try {
    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return null;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      if (key !== name) continue;
      let value = trimmed.slice(idx + 1).trim();
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

const SERVICE_ROLE_KEY = loadEnvVar('SUPABASE_SERVICE_ROLE_KEY');
if (!SERVICE_ROLE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY is required (env var or .env file)');
  process.exit(1);
}

function request(pathnameWithQuery, method = 'GET', body = null) {
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

async function main() {
  const teacherB = {
    email: process.env.TEACHER_B_EMAIL || 'teacher2@jpmcollege.edu',
    password: process.env.TEACHER_B_PASSWORD || 'Teacher2@123',
    employee_id: process.env.TEACHER_B_EMPLOYEE_ID || 'EMP002',
    full_name: process.env.TEACHER_B_FULL_NAME || 'Prof. Jane Doe',
  };

  // 1) Find or create auth user
  let userId = null;

  const created = await request('/auth/v1/admin/users', 'POST', {
    email: teacherB.email,
    password: teacherB.password,
    email_confirm: true,
    user_metadata: {
      full_name: teacherB.full_name,
      role: 'subject_teacher',
    },
  });

  if (created.status >= 200 && created.status < 300 && created.body?.id) {
    userId = created.body.id;
    console.log(`✅ Created auth user: ${teacherB.email}`);
  } else {
    const bodyStr = typeof created.body === 'string' ? created.body : JSON.stringify(created.body);
    const already = bodyStr.toLowerCase().includes('already registered') || bodyStr.toLowerCase().includes('already exists');

    if (!already) {
      throw new Error(`Failed to create auth user (status ${created.status}): ${bodyStr}`);
    }

    // User exists: resolve user_id via public.profiles.email (more reliable than Auth list paging).
    const prof = await request(`/rest/v1/profiles?email=eq.${encodeURIComponent(teacherB.email)}&select=id&limit=1`, 'GET');
    userId = Array.isArray(prof.body) ? prof.body[0]?.id : null;
    if (!userId) {
      throw new Error(`Auth user exists but no profiles row found for: ${teacherB.email}`);
    }
    console.log(`✅ Auth user exists: ${teacherB.email}`);
  }

  // 2) Ensure department (CSE) exists and get department_id
  const deptLookup = await request('/rest/v1/departments?code=eq.CSE&select=id&limit=1');
  let deptId = Array.isArray(deptLookup.body) ? deptLookup.body[0]?.id : null;
  if (!deptId) {
    const deptCreate = await request('/rest/v1/departments', 'POST', {
      code: 'CSE',
      name: 'Computer Science and Engineering',
      short_name: 'CSE',
      is_active: true,
    });
    deptId = Array.isArray(deptCreate.body) ? deptCreate.body[0]?.id : null;
  }
  if (!deptId) throw new Error('Unable to resolve department_id for CSE');

  // 3) Update profile (best-effort)
  await request(`/rest/v1/profiles?id=eq.${userId}`, 'PATCH', {
    full_name: teacherB.full_name,
    primary_role: 'subject_teacher',
    status: 'active',
  });

  // 4) Ensure roles exist and assign user_roles with department
  const subjectRole = await request('/rest/v1/roles?name=eq.subject_teacher&select=id&limit=1');
  const mentorRole = await request('/rest/v1/roles?name=eq.mentor&select=id&limit=1');
  const subjectRoleId = Array.isArray(subjectRole.body) ? subjectRole.body[0]?.id : null;
  const mentorRoleId = Array.isArray(mentorRole.body) ? mentorRole.body[0]?.id : null;
  if (!subjectRoleId) throw new Error('Role not found: subject_teacher');
  if (!mentorRoleId) throw new Error('Role not found: mentor');

  // Avoid duplicates by checking existing
  const existingRoles = await request(`/rest/v1/user_roles?user_id=eq.${userId}&select=role_id,department_id`);
  const rows = Array.isArray(existingRoles.body) ? existingRoles.body : [];
  const hasRole = (roleId) => rows.some((r) => r.role_id === roleId);

  if (!hasRole(subjectRoleId)) {
    const ins = await request('/rest/v1/user_roles', 'POST', { user_id: userId, role_id: subjectRoleId, department_id: deptId, is_active: true });
    if (!(ins.status >= 200 && ins.status < 300)) {
      console.log('⚠️  subject_teacher role insert issue:', ins.body);
    }
  }
  if (!hasRole(mentorRoleId)) {
    const ins = await request('/rest/v1/user_roles', 'POST', { user_id: userId, role_id: mentorRoleId, department_id: deptId, is_active: true });
    if (!(ins.status >= 200 && ins.status < 300)) {
      console.log('⚠️  mentor role insert issue:', ins.body);
    }
  }

  // 5) Ensure teachers row exists
  const teacherLookup = await request(`/rest/v1/teachers?user_id=eq.${userId}&select=id&limit=1`);
  if (Array.isArray(teacherLookup.body) && teacherLookup.body[0]?.id) {
    console.log('✅ Teacher record exists');
  } else {
    const teacherIns = await request('/rest/v1/teachers', 'POST', {
      user_id: userId,
      employee_id: teacherB.employee_id,
      department_id: deptId,
      designation: 'assistant_professor',
      teacher_type: 'full_time',
      qualification: 'M.Tech',
      specialization: 'Software Engineering',
      experience_years: 5,
      joining_date: '2021-06-01',
      is_active: true,
    });

    if (!(teacherIns.status >= 200 && teacherIns.status < 300)) {
      throw new Error(
        `Failed to insert teachers row (status ${teacherIns.status}): ${typeof teacherIns.body === 'string' ? teacherIns.body : JSON.stringify(teacherIns.body)}`,
      );
    }

    console.log('✅ Created teacher record');
  }

  console.log('\nSecond teacher ready:');
  console.log(`  Email:    ${teacherB.email}`);
  console.log(`  Password: ${teacherB.password}`);
  console.log(`  Emp ID:   ${teacherB.employee_id}`);
}

main().catch((e) => {
  console.error('❌ create-second-teacher failed:', e.message);
  process.exit(1);
});
