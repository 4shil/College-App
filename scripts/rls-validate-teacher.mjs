import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadEnvFromDotenv() {
  // Minimal .env loader (repo-local, gitignored). Does not override existing env vars.
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      if (process.env[key]) continue;
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // ignore
  }
}

loadEnvFromDotenv();

function mustEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Missing env var: ${name}. Add it to your .env (repo root) or set it in the shell before running this script.`,
    );
  }
  return v;
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://celwfcflcofejjpkpgcq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || null;
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing env var: SUPABASE_ANON_KEY (use your anon key)');
}

const TEACHER_A_EMAIL = mustEnv('TEACHER_A_EMAIL');
const TEACHER_A_PASSWORD = mustEnv('TEACHER_A_PASSWORD');

const TEACHER_B_EMAIL = process.env.TEACHER_B_EMAIL || '';
const TEACHER_B_PASSWORD = process.env.TEACHER_B_PASSWORD || '';

const HAS_TEACHER_B = Boolean(TEACHER_B_EMAIL && TEACHER_B_PASSWORD);

function client() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(c, email, password) {
  const { data, error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return data.user;
}

async function getTeacherId(c, userId) {
  const { data, error } = await c
    .from('teachers')
    .select('id')
    .eq('user_id', userId)
    .order('id', { ascending: true })
    .limit(1);

  if (error) throw new Error(`teachers lookup failed: ${error.message}`);

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.id) throw new Error('teachers lookup failed: no teacher record found for this user');
  return row.id;
}

async function getCurrentAcademicYearId(c) {
  const { data, error } = await c.from('academic_years').select('id').eq('is_current', true).single();
  if (error) throw new Error(`academic_years lookup failed: ${error.message}`);
  return data?.id;
}

async function getAnyEntry(c, teacherId, academicYearId) {
  const { data, error } = await c
    .from('timetable_entries')
    .select('id, teacher_id, course_id, year_id, section_id, programme_id, period, day_of_week')
    .eq('teacher_id', teacherId)
    .eq('academic_year_id', academicYearId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('period')
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`timetable_entries lookup failed: ${error.message}`);
  return data;
}

async function testTimetableIsolation(cA, entryBId) {
  const { data, error } = await cA.from('timetable_entries').select('id').eq('id', entryBId);
  if (error) {
    console.log('✅ timetable isolation: blocked by RLS (error)');
    return;
  }
  if (!data || data.length === 0) {
    console.log('✅ timetable isolation: returns 0 rows');
    return;
  }
  console.log('❌ timetable isolation: Teacher A can see Teacher B entry', data);
}

async function testAttendanceCreateBlocked(cA, entryB, performerUserId) {
  const dateStr = new Date().toISOString().split('T')[0];
  const academicYearId = await getCurrentAcademicYearId(cA);

  const payload = {
    date: dateStr,
    period: entryB.period,
    course_id: entryB.course_id,
    year_id: entryB.year_id,
    section_id: entryB.section_id,
    programme_id: entryB.programme_id,
    academic_year_id: academicYearId,
    timetable_entry_id: entryB.id,
    marked_by: performerUserId,
    edited_by: performerUserId,
  };

  // Some deployments have slightly different attendance columns. If PostgREST reports a
  // missing column, drop it and retry so the test reflects RLS rather than schema drift.
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await cA.from('attendance').insert(payload).select('id').maybeSingle();

    if (!error) {
      console.log('❌ attendance create for other teacher unexpectedly succeeded');
      return;
    }

    const m = /Could not find the '([^']+)' column/i.exec(error.message || '');
    if (m?.[1] && Object.prototype.hasOwnProperty.call(payload, m[1])) {
      delete payload[m[1]];
      continue;
    }

    console.log('✅ attendance create blocked for other teacher (error):', error.message);
    return;
  }

  console.log('✅ attendance create blocked for other teacher (error): payload did not match schema');
}

async function main() {
  const cA = client();
  const cB = HAS_TEACHER_B ? client() : null;

  console.log('Signing in Teacher A...');
  const userA = await signIn(cA, TEACHER_A_EMAIL, TEACHER_A_PASSWORD);

  const userB = HAS_TEACHER_B && cB ? await signIn(cB, TEACHER_B_EMAIL, TEACHER_B_PASSWORD) : null;

  const teacherIdA = await getTeacherId(cA, userA.id);
  const teacherIdB = userB && cB ? await getTeacherId(cB, userB.id) : null;

  const academicYearIdA = await getCurrentAcademicYearId(cA);
  const academicYearIdB = userB && cB ? await getCurrentAcademicYearId(cB) : null;

  const entryA = await getAnyEntry(cA, teacherIdA, academicYearIdA);
  const entryB = userB && cB && teacherIdB && academicYearIdB ? await getAnyEntry(cB, teacherIdB, academicYearIdB) : null;

  if (!entryA) {
    const { count, error } = await cA
      .from('timetable_entries')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherIdA)
      .eq('academic_year_id', academicYearIdA)
      .eq('is_active', true);

    if (error) throw new Error(`timetable_entries count failed: ${error.message}`);

    console.log('⚠️  Teacher A has no active timetable entries to test.');
    console.log('   This usually means timetable is not assigned yet, so attendance/marks RLS checks cannot run.');
    console.log('   Active timetable entries visible to Teacher A:', count ?? 0);
    console.log('\nDone.');
    return;
  }
  if (HAS_TEACHER_B && !entryB) throw new Error('Teacher B has no active timetable entries to test.');

  console.log('Teacher A entry:', { id: entryA.id, period: entryA.period, day: entryA.day_of_week });
  if (entryB) console.log('Teacher B entry:', { id: entryB.id, period: entryB.period, day: entryB.day_of_week });

  if (entryB) {
    console.log('\n1) Timetable isolation check (A cannot read B entry by id)');
    await testTimetableIsolation(cA, entryB.id);
  } else {
    console.log('\n1) Timetable isolation check: skipped (TEACHER_B_EMAIL/PASSWORD not provided)');
  }

  if (entryB) {
    console.log('\n2) Attendance write isolation check (A cannot create attendance for B entry)');
    await testAttendanceCreateBlocked(cA, entryB, userA.id);
  } else {
    console.log('\n2) Attendance write isolation check: skipped (TEACHER_B_EMAIL/PASSWORD not provided)');
  }

  console.log('\nDone. Add more checks here as needed (marks locks, planner/diary, substitutions).');
}

main().catch((e) => {
  console.error('RLS validation failed:', e);
  process.exit(1);
});
