# Dashboard + Analytics (Analysis) — Data & DB Mapping

This document maps the **Dashboard** and **Analytics (Analysis)** screens to their **Supabase tables/columns**.

Reference docs already in the repo:
- `DATABASE_SCHEMA_INVENTORY.md` (source-of-truth for tables from migrations)
- `DATABASE_DOCUMENTATION.md` (human-friendly schema + page mappings)

---

## Screens covered

- Admin Dashboard: `app/(admin)/dashboard.tsx`
- Role Modules Dashboard: `app/(admin)/role-dashboard.tsx`
- Admin Analytics (Analysis): `app/(admin)/analytics/index.tsx`
- Student Dashboard (placeholder): `app/(student)/dashboard.tsx`
- Teacher Dashboard (placeholder): `app/(teacher)/dashboard.tsx`

---

## Admin Dashboard — `app/(admin)/dashboard.tsx`

### Overview cards (counts)

The screen fetches counts in parallel and renders 4 stat cards.

**Tables used**
- `students` (count)
- `teachers` (count)
- `departments` (count, filtered)
- `courses` (count, filtered)
- `profiles` (count, filtered)

**Queries and columns**
- Total students:
  - `students`: `select('*', { count: 'exact', head: true })`
  - `profiles`: `select('*', { count: 'exact', head: true }).eq('primary_role','student')`
  - Final count logic: `max(students.count, profiles.count)`

- Total teachers:
  - `teachers`: `select('*', { count: 'exact', head: true })`
  - `profiles`: `select('*', { count: 'exact', head: true }).in('primary_role', ['subject_teacher','class_teacher','mentor','coordinator','hod'])`
  - Final count logic: `max(teachers.count, profiles.count)`

- Total departments:
  - `departments`: `select('*', { count: 'exact', head: true }).eq('is_active', true)`
  - Columns relied on: `departments.is_active`

- Total courses:
  - `courses`: `select('*', { count: 'exact', head: true }).eq('is_active', true).not('program_type','is',null)`
  - Columns relied on: `courses.is_active`, `courses.program_type`
  - Note: `courses.program_type` is defined by migrations (see `DATABASE_SCHEMA_INVENTORY.md`).

- Pending approvals:
  - `profiles`: `select('*', { count: 'exact', head: true }).eq('status', 'pending')`
  - Columns relied on: `profiles.status`

### Today attendance

- Currently hard-coded placeholder: `todayAttendance: 85`.
- No DB query is executed for this value on the Admin Dashboard.

### Recent activity feed

**Table used**
- `audit_logs`

**Query**
- `audit_logs` ordered by newest:
  - `select('id, action, table_name, created_at, user_id, profiles:user_id(full_name)')`
  - `order('created_at', { ascending: false }).limit(5)`

**Columns relied on**
- `audit_logs.id`
- `audit_logs.action` (expected values used for UI coloring: `INSERT`, `UPDATE`, `DELETE`)
- `audit_logs.table_name`
- `audit_logs.created_at`
- `audit_logs.user_id`
- `profiles.full_name` (joined through `user_id`)

**Realtime behavior**
- Subscribes to Postgres changes on `public.audit_logs` and re-fetches the feed.

---

## Admin Analytics (Analysis) — `app/(admin)/analytics/index.tsx`

This screen calculates a dashboard of analytics numbers + simple charts, and can auto-refresh.

### Realtime subscriptions

The screen subscribes to changes in tables that affect analytics and triggers `fetchAnalytics()`.

**Tables subscribed**
- `profiles`
- `courses`
- `departments`
- `notices`
- `attendance`
- `attendance_records`
- `exams`
- `assignments`
- `books`

(These match the tables queried by `fetchAnalytics()`.)

### Metrics + DB sources

#### Student / teacher totals

**Source**: `profiles`
- Query: `profiles.select('id, primary_role, status, department_id')`
- Derived:
  - `totalStudents` = count where `primary_role === 'student'`
  - `totalTeachers` = count where role in `['subject_teacher','class_teacher','mentor','coordinator','hod']`
  - `activeStudents` = students where `status === 'active'`

**Columns relied on**
- `profiles.primary_role`
- `profiles.status` (enum)
- `profiles.department_id`

#### Pending approvals

**Source**: `profiles`
- Query: `profiles.select('id', { count: 'exact' }).eq('status', 'pending')`

#### Courses

**Source**: `courses`
- Query: `courses.select('id', { count: 'exact' }).eq('is_active', true)`
- Column relied on: `courses.is_active`

#### Departments

**Source**: `departments`
- Query: `departments.select('id, name', { count: 'exact' }).eq('is_active', true)`

#### Notices

**Source**: `notices`
- Query: `notices.select('id', { count: 'exact' }).eq('is_active', true)`
- Column relied on: `notices.is_active`

#### Attendance (today)

**Source**: `attendance_records`
- Query: `attendance_records.select('id, status', { count: 'exact' }).gte('marked_at', todayStart).lt('marked_at', tomorrowStart)`
- Derived:
  - `todayAttendance` = round(present/total * 100) where `status === 'present'`

**Columns relied on**
- `attendance_records.status`
- `attendance_records.marked_at`

#### Attendance (average for selected period)

**Source**: `attendance_records`
- Query: `attendance_records.select('status, marked_at').gte('marked_at', periodStart)`
- Derived:
  - `avgAttendance` = round(present/total * 100)
  - `attendanceTrends` = per-month present rate (last 4 buckets)

#### Upcoming exams

**Source**: `exams`
- Query: `exams.select('id', { count: 'exact' }).gte('start_date', now)`
- Columns relied on: `exams.start_date`

#### Active assignments

**Source**: `assignments`
- Query: `assignments.select('id', { count: 'exact' }).eq('status', 'active')`
- Columns relied on: `assignments.status`

#### Library books

**Source**: `books`
- Query: `books.select('id', { count: 'exact' })`

### Department distribution chart

**Source**: `profiles` + `departments`
- Uses student profiles where `status === 'active'` and `department_id` present.
- Groups counts by `department_id`, then maps ids to names from `departments` query.

---

## Student / Teacher Dashboards

- `app/(student)/dashboard.tsx` and `app/(teacher)/dashboard.tsx` are currently placeholders.
- They show the user’s display name using `profile.full_name` from the auth store (not direct DB reads on these screens).

---

## Important schema notes (for analytics/dashboard)

- `database/schema.sql` is not the full schema used by the app.
  - The full schema is primarily in `supabase/migrations/**/*.sql`.
  - See `DATABASE_SCHEMA_INVENTORY.md` for the complete table list.

- `profiles.status` values:
  - According to `types/database.ts`: `active | inactive | suspended | graduated | dropout | pending`.
  - Analytics logic should treat `active` as “approved/active user” and `pending` as “awaiting approval”.

- Library table naming:
  - The schema contains `books` (not `library_books`).
