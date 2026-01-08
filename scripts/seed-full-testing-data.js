// Seed full testing data: student account + multiple teachers + full timetable + teacher-course assignments.
// Run (PowerShell):
//   $env:SUPABASE_SERVICE_ROLE_KEY = "<service_role>";
//   $env:SUPABASE_URL = "https://<project>.supabase.co"; # optional
//   node scripts/seed-full-testing-data.js
//
// This script is designed to be idempotent-ish: it will create missing entities,
// and it will reset timetable entries for the target year + academic year.

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

function request(pathnameWithQuery, method = 'GET', body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${pathnameWithQuery}`);
    const data = body ? JSON.stringify(body) : null;

    const headers = {
      'Content-Type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: 'return=representation',
      ...extraHeaders,
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
          // keep string
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function mustArray(pathname, label) {
  const res = await request(pathname, 'GET');
  if (!(res.status >= 200 && res.status < 300)) {
    throw new Error(`${label} request failed (status ${res.status}): ${typeof res.body === 'string' ? res.body : JSON.stringify(res.body)}`);
  }
  if (!Array.isArray(res.body)) {
    throw new Error(`${label} response is not an array`);
  }
  return res.body;
}

async function mustSingle(pathname, label) {
  const rows = await mustArray(pathname, label);
  if (!rows[0]) throw new Error(`${label} not found`);
  return rows[0];
}

async function ensureDepartment(code, name, shortName) {
  const rows = await mustArray(`/rest/v1/departments?code=eq.${encodeURIComponent(code)}&select=id,code`, 'Department lookup');
  if (rows[0]?.id) return rows[0].id;

  const created = await request('/rest/v1/departments', 'POST', { code, name, short_name: shortName, is_active: true });
  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body) || !created.body[0]?.id) {
    throw new Error(`Failed to create department ${code}`);
  }
  return created.body[0].id;
}

async function ensureCurrentAcademicYear() {
  const rows = await mustArray('/rest/v1/academic_years?is_current=eq.true&select=id,name&limit=1', 'Current academic year');
  if (rows[0]?.id) return rows[0];

  // Fallback: pick latest.
  return mustSingle('/rest/v1/academic_years?select=id,name&order=start_date.desc&limit=1', 'Academic year');
}

async function ensureYear(yearNumber) {
  const rows = await mustArray(`/rest/v1/years?year_number=eq.${yearNumber}&select=id,year_number&limit=1`, 'Year lookup');
  if (rows[0]?.id) return rows[0].id;

  const created = await request('/rest/v1/years', 'POST', { year_number: yearNumber, name: `${yearNumber} Year`, is_active: true });
  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body) || !created.body[0]?.id) {
    throw new Error(`Failed to create year ${yearNumber}`);
  }
  return created.body[0].id;
}

async function ensureSemester(semesterNumber, yearId) {
  const rows = await mustArray(`/rest/v1/semesters?semester_number=eq.${semesterNumber}&select=id,semester_number&limit=1`, 'Semester lookup');
  if (rows[0]?.id) return rows[0].id;

  const created = await request('/rest/v1/semesters', 'POST', {
    semester_number: semesterNumber,
    name: `Semester ${semesterNumber}`,
    year_id: yearId,
    is_active: true,
  });
  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body) || !created.body[0]?.id) {
    throw new Error(`Failed to create semester ${semesterNumber}`);
  }
  return created.body[0].id;
}

async function ensureCoursesForDeptSemester(departmentId, semesterId) {
  const existing = await mustArray(
    `/rest/v1/courses?department_id=eq.${departmentId}&semester_id=eq.${semesterId}&select=id,code,name,lab_hours&order=code.asc&limit=20`,
    'Courses lookup',
  );

  if (existing.length >= 5) return existing;

  const needed = 5 - existing.length;
  const payload = [];
  const base = Date.now().toString().slice(-5);

  for (let i = 0; i < needed; i++) {
    const idx = existing.length + i + 1;
    payload.push({
      code: `CSE3T${base}${idx}`,
      name: `Test Subject ${idx} (Sem 3)`,
      short_name: `SUB${idx}`,
      department_id: departmentId,
      semester_id: semesterId,
      course_type: 'core',
      theory_hours: 3,
      lab_hours: idx % 2 === 0 ? 2 : 0,
      is_active: true,
    });
  }

  const created = await request('/rest/v1/courses', 'POST', payload);
  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body)) {
    throw new Error(`Failed to create courses: ${typeof created.body === 'string' ? created.body : JSON.stringify(created.body)}`);
  }

  return [...existing, ...created.body];
}

async function ensureRoleId(roleName) {
  const role = await mustSingle(`/rest/v1/roles?name=eq.${encodeURIComponent(roleName)}&select=id,name&limit=1`, 'Role lookup');
  return role.id;
}

async function createAuthUserIfNeeded(email, password, fullName, primaryRole) {
  // Try create user (idempotent: ignore "already registered").
  const res = await request('/auth/v1/admin/users', 'POST', {
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: primaryRole },
  });

  if (res.status >= 200 && res.status < 300 && res.body?.id) {
    return res.body.id;
  }

  const msg = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
  if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
    // We can fetch the profile by email via PostgREST.
    const prof = await mustSingle(`/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email&limit=1`, 'Profile by email');
    return prof.id;
  }

  throw new Error(`Failed to create auth user ${email}: ${msg}`);
}

async function upsertUserRole(userId, roleId, departmentId) {
  const payload = { user_id: userId, role_id: roleId, department_id: departmentId || null, is_active: true };
  const res = await request('/rest/v1/user_roles', 'POST', payload, { Prefer: 'return=representation,resolution=merge-duplicates' });
  if (res.status === 409) return;
  if (!(res.status >= 200 && res.status < 300)) {
    // If no unique constraint, merge-duplicates might not work; ignore duplicates.
    const msg = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    if (msg.includes('duplicate') || msg.includes('already')) return;
    throw new Error(`Failed to assign role: ${msg}`);
  }
}

async function ensureTeacherProfileAndRow(userId, fullName, roleName, departmentId, employeeId) {
  // Update profile
  await request(`/rest/v1/profiles?id=eq.${userId}`, 'PATCH', { full_name: fullName, primary_role: roleName, status: 'active' });

  // Ensure user role
  const roleId = await ensureRoleId(roleName);
  await upsertUserRole(userId, roleId, departmentId);

  // Ensure teachers row
  const existing = await mustArray(`/rest/v1/teachers?user_id=eq.${userId}&select=id,user_id,employee_id,department_id&limit=1`, 'Teacher lookup');
  if (existing[0]?.id) return existing[0];

  const created = await request('/rest/v1/teachers', 'POST', {
    user_id: userId,
    employee_id: employeeId,
    department_id: departmentId,
    designation: 'assistant_professor',
    teacher_type: 'full_time',
    qualification: 'M.Sc',
    experience_years: 3,
    joining_date: '2022-06-01',
    is_active: true,
  });

  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body) || !created.body[0]?.id) {
    throw new Error(`Failed to create teacher row for ${fullName}`);
  }

  return created.body[0];
}

async function ensureStudentProfileAndRow(userId, fullName, departmentId, yearId, semesterId, academicYearId) {
  await request(`/rest/v1/profiles?id=eq.${userId}`, 'PATCH', { full_name: fullName, primary_role: 'student', status: 'active' });

  const studentRoleId = await ensureRoleId('student');
  await upsertUserRole(userId, studentRoleId, departmentId);

  const existing = await mustArray(`/rest/v1/students?user_id=eq.${userId}&select=id,user_id,registration_number,roll_number&limit=1`, 'Student lookup');
  if (existing[0]?.id) return existing[0];

  // Pick a section if exists; if schema was simplified, section_id is nullable.
  const section = await mustArray(
    `/rest/v1/sections?department_id=eq.${departmentId}&year_id=eq.${yearId}&academic_year_id=eq.${academicYearId}&select=id,name&limit=1`,
    'Section lookup',
  );
  const sectionId = section[0]?.id || null;

  const reg = `JPM${new Date().getFullYear()}CSE${Math.floor(Math.random() * 900 + 100)}`;
  const roll = `CSE${Math.floor(Math.random() * 900 + 100)}`;

  const created = await request('/rest/v1/students', 'POST', {
    user_id: userId,
    registration_number: reg,
    roll_number: roll,
    department_id: departmentId,
    year_id: yearId,
    semester_id: semesterId,
    section_id: sectionId,
    academic_year_id: academicYearId,
    admission_year: new Date().getFullYear() - 1,
    admission_date: `${new Date().getFullYear() - 1}-07-01`,
    father_name: 'Test Parent',
    blood_group: 'O+',
    category: 'General',
  });

  if (!(created.status >= 200 && created.status < 300) || !Array.isArray(created.body) || !created.body[0]?.id) {
    throw new Error(`Failed to create student row for ${fullName}`);
  }

  return created.body[0];
}

async function ensurePeriodTimings() {
  const existing = await mustArray('/rest/v1/period_timings?select=period_number,start_time,end_time,is_break&order=period_number.asc', 'Period timings');
  if (existing.length >= 5) return existing;

  const defaults = [
    { period_number: 1, start_time: '09:40', end_time: '10:35', duration_minutes: 55, is_break: false },
    { period_number: 2, start_time: '10:50', end_time: '11:40', duration_minutes: 50, is_break: false },
    { period_number: 3, start_time: '11:50', end_time: '12:45', duration_minutes: 55, is_break: false },
    { period_number: 4, start_time: '13:25', end_time: '14:15', duration_minutes: 50, is_break: false },
    { period_number: 5, start_time: '14:20', end_time: '15:10', duration_minutes: 50, is_break: false },
  ];

  const created = await request('/rest/v1/period_timings', 'POST', defaults, { Prefer: 'return=representation,resolution=merge-duplicates' });
  if (!(created.status >= 200 && created.status < 300)) {
    throw new Error(`Failed to seed period timings: ${typeof created.body === 'string' ? created.body : JSON.stringify(created.body)}`);
  }

  return mustArray('/rest/v1/period_timings?select=period_number,start_time,end_time,is_break&order=period_number.asc', 'Period timings');
}

async function resetTimetable(yearId, academicYearId) {
  const del = await request(`/rest/v1/timetable_entries?year_id=eq.${yearId}&academic_year_id=eq.${academicYearId}`, 'DELETE');
  if (!(del.status >= 200 && del.status < 300)) {
    // If RLS or policy blocks, service role should still succeed.
    const msg = typeof del.body === 'string' ? del.body : JSON.stringify(del.body);
    throw new Error(`Failed to clear timetable entries: ${msg}`);
  }
}

async function seedTimetable({ yearId, academicYearId, periodTimings, courses, teachers }) {
  // Build a full 5-day x 5-period timetable.
  const entries = [];

  for (let day = 1; day <= 5; day++) {
    for (let period = 1; period <= 5; period++) {
      const timing = periodTimings.find((p) => p.period_number === period);
      const course = courses[(day * 10 + period) % courses.length];
      const teacher = teachers[(day * 10 + period) % teachers.length];

      entries.push({
        year_id: yearId,
        academic_year_id: academicYearId,
        day_of_week: day,
        period,
        start_time: timing?.start_time || '09:40',
        end_time: timing?.end_time || '10:35',
        course_id: course.id,
        teacher_id: teacher.id,
        room: `R-${100 + period}`,
        is_lab: Number(course.lab_hours || 0) > 0 && (period === 4 || period === 5),
        is_active: true,
      });
    }
  }

  const insert = await request('/rest/v1/timetable_entries', 'POST', entries);
  if (!(insert.status >= 200 && insert.status < 300)) {
    const msg = typeof insert.body === 'string' ? insert.body : JSON.stringify(insert.body);
    throw new Error(`Failed to insert timetable entries: ${msg}`);
  }

  return Array.isArray(insert.body) ? insert.body.length : 0;
}

async function seedTeacherCourses(academicYearId, teachers, courses) {
  // Create teacher_courses entries (section_id may be nullable per schema simplification).
  const payload = [];
  for (let i = 0; i < courses.length; i++) {
    const teacher = teachers[i % teachers.length];
    payload.push({
      teacher_id: teacher.id,
      course_id: courses[i].id,
      section_id: null,
      academic_year_id: academicYearId,
      is_primary: true,
      is_active: true,
    });
  }

  const res = await request('/rest/v1/teacher_courses', 'POST', payload, { Prefer: 'return=representation,resolution=merge-duplicates' });
  if (!(res.status >= 200 && res.status < 300) && res.status !== 409) {
    const msg = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    // If unique constraint differs, ignore duplicates.
    if (!msg.includes('duplicate')) {
      throw new Error(`Failed to seed teacher_courses: ${msg}`);
    }
  }
}

async function main() {
  console.log('🌱 Seeding FULL testing database data...');
  console.log(`   Project: ${SUPABASE_URL}`);

  // Core references
  const departmentId = await ensureDepartment('CSE', 'Computer Science and Engineering', 'CSE');
  const academicYear = await ensureCurrentAcademicYear();
  const yearId = await ensureYear(2);
  const semesterId = await ensureSemester(3, yearId);

  // Accounts
  const teacherRoleId = await ensureRoleId('subject_teacher');
  void teacherRoleId;

  const teacher1UserId = await createAuthUserIfNeeded('teacher1@jpmcollege.edu', 'Teacher@123', 'Prof. Test Teacher 1', 'subject_teacher');
  const teacher2UserId = await createAuthUserIfNeeded('teacher2@jpmcollege.edu', 'Teacher@123', 'Prof. Test Teacher 2', 'subject_teacher');
  const teacher3UserId = await createAuthUserIfNeeded('teacher3@jpmcollege.edu', 'Teacher@123', 'Prof. Test Teacher 3', 'subject_teacher');
  const studentUserId = await createAuthUserIfNeeded('student1@jpmcollege.edu', 'Student@123', 'Test Student 1', 'student');

  // Teachers rows
  const t1 = await ensureTeacherProfileAndRow(teacher1UserId, 'Prof. Test Teacher 1', 'subject_teacher', departmentId, 'EMP1001');
  const t2 = await ensureTeacherProfileAndRow(teacher2UserId, 'Prof. Test Teacher 2', 'subject_teacher', departmentId, 'EMP1002');
  const t3 = await ensureTeacherProfileAndRow(teacher3UserId, 'Prof. Test Teacher 3', 'subject_teacher', departmentId, 'EMP1003');

  // Student row
  const student = await ensureStudentProfileAndRow(studentUserId, 'Test Student 1', departmentId, yearId, semesterId, academicYear.id);

  // Courses
  const courses = await ensureCoursesForDeptSemester(departmentId, semesterId);

  // Period timings
  const periodTimings = await ensurePeriodTimings();

  // Timetable reset + seed
  await resetTimetable(yearId, academicYear.id);
  const insertedCount = await seedTimetable({ yearId, academicYearId: academicYear.id, periodTimings, courses, teachers: [t1, t2, t3] });

  // Teacher-course mapping
  await seedTeacherCourses(academicYear.id, [t1, t2, t3], courses);

  // Quick verification
  const ttRows = await mustArray(`/rest/v1/timetable_entries?year_id=eq.${yearId}&academic_year_id=eq.${academicYear.id}&select=id,day_of_week,period,course_id,teacher_id&limit=200`, 'Timetable verify');
  const okAssignments = ttRows.every((r) => r.course_id && r.teacher_id);

  console.log('\n✅ Seed complete. Summary:');
  console.log(`   Academic year: ${academicYear.name}`);
  console.log(`   Student row: ${student.id}`);
  console.log(`   Teachers: ${[t1.id, t2.id, t3.id].join(', ')}`);
  console.log(`   Courses in semester: ${courses.length}`);
  console.log(`   Timetable entries inserted: ${insertedCount}`);
  console.log(`   Timetable assignments OK: ${okAssignments ? 'YES' : 'NO'}`);

  console.log('\n🔑 Test login credentials created/ensured:');
  console.log('   student1@jpmcollege.edu / Student@123');
  console.log('   teacher1@jpmcollege.edu / Teacher@123');
  console.log('   teacher2@jpmcollege.edu / Teacher@123');
  console.log('   teacher3@jpmcollege.edu / Teacher@123');
}

main().catch((e) => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
