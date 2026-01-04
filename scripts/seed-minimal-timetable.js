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

async function ensureCourse(departmentId) {
  // Try to find any existing course in the department.
  let course = await firstRow(`/rest/v1/courses?department_id=eq.${departmentId}&select=id&limit=1`);
  if (course?.id) return course.id;

  // Create a minimal course (non-destructive) if none exist.
  const semester = await mustSingleRow('/rest/v1/semesters?select=id,semester_number&order=semester_number.asc&limit=1', 'Semester');
  const code = `TEST${Date.now().toString().slice(-6)}`;

  const created = await request('/rest/v1/courses', 'POST', {
    code,
    name: 'Test Course',
    short_name: 'TEST',
    department_id: departmentId,
    semester_id: semester.id,
    course_type: 'core',
    theory_hours: 3,
    lab_hours: 0,
    is_active: true,
  });

  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body) || !created.body[0]?.id) {
    throw new Error(
      `Failed to create course (status ${created.status}): ${typeof created.body === 'string' ? created.body : JSON.stringify(created.body)}`,
    );
  }

  return created.body[0].id;
}

async function main() {
  const teacherEmail = process.env.TEACHER_EMAIL || '';
  const employeeId = process.env.TEACHER_EMPLOYEE_ID || 'EMP001';

  // 1) Resolve the target teachers row.
  // Prefer email (more stable), fallback to employee_id.
  let teacher = null;

  if (teacherEmail) {
    const prof = await request(`/rest/v1/profiles?email=eq.${encodeURIComponent(teacherEmail)}&select=id&limit=1`, 'GET');
    const userId = Array.isArray(prof.body) ? prof.body[0]?.id : null;
    if (!userId) throw new Error(`Profile not found for email: ${teacherEmail}`);

    teacher = await firstRow(`/rest/v1/teachers?user_id=eq.${userId}&select=id,department_id&order=created_at.desc&limit=1`);
    if (!teacher) throw new Error(`Teacher not found for user_id of ${teacherEmail}`);
  } else {
    teacher = await firstRow(
      `/rest/v1/teachers?employee_id=eq.${encodeURIComponent(employeeId)}&select=id,department_id&order=created_at.desc&limit=1`,
    );
    if (!teacher) throw new Error('Teacher not found');
  }

  // 2) Current academic year
  const academicYear = await mustSingleRow('/rest/v1/academic_years?is_current=eq.true&select=id&limit=1', 'Current academic year');

  // 3) If teacher already has an entry, do nothing
  const existing = await request(
    `/rest/v1/timetable_entries?teacher_id=eq.${teacher.id}&academic_year_id=eq.${academicYear.id}&is_active=eq.true&select=id,course_id&limit=1`,
  );
  const existingEntry =
    existing.status >= 200 && existing.status < 300 && Array.isArray(existing.body) && existing.body.length > 0 ? existing.body[0] : null;

  // 4) Pick or create required references.
  const section = await ensureSection(teacher.department_id, academicYear.id);

  const courseId = await ensureCourse(teacher.department_id);

  // If an entry already exists but course_id is missing, patch it (so attendance tests can run).
  if (existingEntry?.id) {
    if (!existingEntry.course_id) {
      const patch = await request(`/rest/v1/timetable_entries?id=eq.${existingEntry.id}`, 'PATCH', { course_id: courseId });
      if (!(patch.status >= 200 && patch.status < 300)) {
        throw new Error(
          `Failed to patch timetable entry with course_id (status ${patch.status}): ${typeof patch.body === 'string' ? patch.body : JSON.stringify(patch.body)}`,
        );
      }
      console.log('✅ Timetable already assigned; patched existing entry with course_id.');
    } else {
      console.log('✅ Timetable already assigned for test teacher; no changes made.');
    }
    return;
  }

  // 5) Insert one entry (Mon, Period 1)
  const payload = {
    academic_year_id: academicYear.id,
    day_of_week: 1,
    period: 1,
    start_time: '09:40',
    end_time: '10:35',
    course_id: courseId,
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
