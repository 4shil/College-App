// Verify the "full testing" seed data exists and looks consistent.
// Run:
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role>";
//   $env:SUPABASE_URL = "https://<project>.supabase.co"; # optional
//   node scripts/verify-full-testing-seed.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const DEFAULT_SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';

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

const SUPABASE_URL = loadEnvVar('SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const SERVICE_ROLE_KEY = loadEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!SERVICE_ROLE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY is required (env var or .env file)');
  process.exit(1);
}

function request(pathnameWithQuery, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${pathnameWithQuery}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        let parsed = responseBody;
        try {
          parsed = JSON.parse(responseBody || 'null');
        } catch {
          // keep string
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function mustArray(pathname, label) {
  const res = await request(pathname, 'GET');
  if (!(res.status >= 200 && res.status < 300) || !Array.isArray(res.body)) {
    throw new Error(`${label} failed (status ${res.status}): ${typeof res.body === 'string' ? res.body : JSON.stringify(res.body)}`);
  }
  return res.body;
}

async function main() {
  console.log('🔎 Verifying seeded testing data...');
  console.log(`   Project: ${SUPABASE_URL}`);

  const ay = await mustArray('/rest/v1/academic_years?is_current=eq.true&select=id,name&limit=1', 'Academic year');
  const academicYear = ay[0];
  if (!academicYear?.id) throw new Error('No current academic year found');

  const teachers = await mustArray(
    '/rest/v1/teachers?employee_id=in.(EMP1001,EMP1002,EMP1003)&select=id,employee_id,user_id,department_id',
    'Teachers',
  );

  const studentProfiles = await mustArray(
    '/rest/v1/profiles?email=in.(student1@jpmcollege.edu)&select=id,email,primary_role',
    'Student profile',
  );

  const students = await mustArray('/rest/v1/students?select=id,user_id,registration_number,year_id,academic_year_id&limit=50', 'Students');

  const year2 = await mustArray('/rest/v1/years?year_number=eq.2&select=id,year_number&limit=1', 'Year 2');
  const yearId = year2[0]?.id;
  if (!yearId) throw new Error('Year 2 not found');

  const timetable = await mustArray(
    `/rest/v1/timetable_entries?year_id=eq.${yearId}&academic_year_id=eq.${academicYear.id}&select=id,day_of_week,period,course_id,teacher_id&limit=500`,
    'Timetable',
  );

  const missingRefs = timetable.filter((r) => !r.course_id || !r.teacher_id);

  console.log('\n✅ Verification summary:');
  console.log(`   Current academic year: ${academicYear.name}`);
  console.log(`   Teachers found (EMP1001-3): ${teachers.length} (expected 3)`);
  console.log(`   Student profile found: ${studentProfiles.length} (expected 1)`);
  console.log(`   Students total in DB: ${students.length} (>=1 expected)`);
  console.log(`   Timetable entries for Year 2: ${timetable.length} (expected 25)`);
  console.log(`   Timetable missing course/teacher refs: ${missingRefs.length}`);

  if (teachers.length !== 3 || studentProfiles.length !== 1 || timetable.length !== 25 || missingRefs.length) {
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error('❌ Verification failed:', e.message);
  process.exit(1);
});
