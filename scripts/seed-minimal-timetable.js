// Creates a single timetable entry for the test teacher (non-destructive).
// Run: node scripts/seed-minimal-timetable.js
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

async function mustSingleRow(pathname, label) {
  const res = await request(pathname);
  if (!(res.status >= 200 && res.status < 300)) {
    throw new Error(`${label} request failed (status ${res.status}): ${typeof res.body === 'string' ? res.body : JSON.stringify(res.body)}`);
  }
  if (!Array.isArray(res.body) || !res.body[0]) {
    throw new Error(`${label} not found`);
  }
  return res.body[0];
}

async function firstRow(pathname) {
  const res = await request(pathname);
  if (!(res.status >= 200 && res.status < 300)) return null;
  if (!Array.isArray(res.body) || !res.body[0]) return null;
  return res.body[0];
}

async function ensureSection(departmentId, academicYearId) {
  // Prefer: same department + current academic year
  let section = await firstRow(
    `/rest/v1/sections?department_id=eq.${departmentId}&academic_year_id=eq.${academicYearId}&select=id,year_id&limit=1`,
  );

  if (section) return section;

  // Fallback: any section in department
  section = await firstRow(`/rest/v1/sections?department_id=eq.${departmentId}&select=id,year_id&limit=1`);
  if (section) return section;

  // Create a minimal section (non-destructive) if none exist.
  const year = await mustSingleRow('/rest/v1/years?select=id,year_number&order=year_number.asc&limit=1', 'Year');
  const created = await request('/rest/v1/sections', 'POST', {
    name: 'CSE-A',
    department_id: departmentId,
    year_id: year.id,
    academic_year_id: academicYearId,
    max_students: 60,
  });

  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body) || !created.body[0]?.id) {
    throw new Error(
      `Failed to create section (status ${created.status}): ${typeof created.body === 'string' ? created.body : JSON.stringify(created.body)}`,
    );
  }

  return { id: created.body[0].id, year_id: created.body[0].year_id || year.id };
}

async function main() {
  // 1) Get the test teacher row created by setup_test_teacher
  const teacher = await mustSingleRow('/rest/v1/teachers?employee_id=eq.EMP001&select=id,department_id&order=created_at.desc&limit=1', 'Teacher');

  // 2) Current academic year
  const academicYear = await mustSingleRow('/rest/v1/academic_years?is_current=eq.true&select=id&limit=1', 'Current academic year');

  // 3) If teacher already has an entry, do nothing
  const existing = await request(
    `/rest/v1/timetable_entries?teacher_id=eq.${teacher.id}&academic_year_id=eq.${academicYear.id}&is_active=eq.true&select=id&limit=1`,
  );
  if (existing.status >= 200 && existing.status < 300 && Array.isArray(existing.body) && existing.body.length > 0) {
    console.log('✅ Timetable already assigned for test teacher; no changes made.');
    return;
  }

  // 4) Pick a section + course in the same department (best-effort).
  const section = await ensureSection(teacher.department_id, academicYear.id);

  const course = await firstRow(`/rest/v1/courses?department_id=eq.${teacher.department_id}&select=id&limit=1`);

  // 5) Insert one entry (Mon, Period 1)
  const payload = {
    academic_year_id: academicYear.id,
    day_of_week: 1,
    period: 1,
    start_time: '09:40',
    end_time: '10:35',
    ...(course?.id ? { course_id: course.id } : {}),
    teacher_id: teacher.id,
    year_id: section.year_id,
    section_id: section.id,
    is_active: true,
  };

  const insert = await request('/rest/v1/timetable_entries', 'POST', payload);

  if (insert.status === 409) {
    console.log('✅ Timetable entry already exists (conflict); no changes made.');
    return;
  }

  if (!(insert.status >= 200 && insert.status < 300)) {
    throw new Error(
      `Failed to insert timetable entry (status ${insert.status}): ${typeof insert.body === 'string' ? insert.body : JSON.stringify(insert.body)}`,
    );
  }

  console.log('✅ Inserted 1 timetable entry for test teacher.');
}

main().catch((e) => {
  console.error('❌ seed-minimal-timetable failed:', e.message);
  process.exit(1);
});
