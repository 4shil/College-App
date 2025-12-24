# Teacher Module Plan (MVP → Full)

Date: 2025-12-24

## Current State (Repo Reality)
- Teacher module is intentionally minimal right now:
  - Routes kept: `/(teacher)/dashboard` only
  - Navbar: GlassDock with **Home** only (admin-style dock UI)
- Previous teacher attendance/materials/results/profile routes were removed to avoid unfinished modules being exposed.

## 2025 System Rules (Must Stay Aligned)
These constraints are treated as **requirements** for all teacher features:
- **Email-only login** (no phone login).
- **Teachers upload ONLY internal marks**.
- **External marks uploaded by students**.
- **Admin sets exam dates & timetable** → teachers consume schedules and only enter internal marks.
- **No QR attendance in events** (event attendance is not QR-based).
- **No extra admin-level operations inside Teacher module** (admin tasks remain in Admin module).
- **Lesson Planner + Diary approvals** follow: Teacher → **HOD (L1)** → **Principal (Final)**.
- Must stay aligned with current Admin + Student modules and RBAC/RLS enforcement.

## Goals
- Deliver a **teacher-facing workflow** for day-to-day operations:
  1. View timetable / assigned periods
  2. Mark attendance
  3. Upload and manage teaching materials
  4. Enter and review marks/results
  5. Optional: lesson planner + work diary
- Ensure **server-side enforcement** via Postgres RLS (not UI-only gating).

## Non-Goals (For MVP)
- “Nice to have” dashboards, analytics, or advanced filters.
- Scheduling local backups from teacher device.
- Building additional navigation icons/tabs before modules exist.

---

## Teacher Hierarchy & Feature Access (By Role)

This section maps **what each teacher-type role can do** in the Teacher module.

### Roles (Seeded in DB)
Teacher-category roles (non-admin):
- `subject_teacher` — base teaching role
- `class_teacher` — in-charge of a class (student-level responsibilities)
- `mentor` — mentors assigned students
- `coordinator` — coordinates substitutions / operational coordination

Elevated roles that may also use teacher flows:
- `hod` — seeded as **admin category** in DB, but described as “teacher role with admin powers” (approvals, dept attendance, holidays)
- `principal` — seeded as **admin category** in DB (final approvals + monitoring)

### Practical hierarchy (simplified)
1. Subject Teacher (`subject_teacher`)
2. Class Teacher (`class_teacher`) / Mentor (`mentor`) / Coordinator (`coordinator`) — peer roles with extra scope
3. HOD (`hod`) — department authority (L1 approvals + department controls)
4. Principal (`principal`) — final authority (final approvals + monitoring)

### Feature access matrix (proposed)
Legend: ✅ allowed, ➖ not applicable / not planned, 🔒 read-only

| Feature | subject_teacher | class_teacher | mentor | coordinator | hod | principal |
|---|---:|---:|---:|---:|---:|---:|
| Home / basic profile info | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own timetable (assigned periods) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Mark attendance for assigned periods | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ |
| View attendance history (own assigned periods) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Department attendance overview | ➖ | ➖ | ➖ | ➖ | ✅ | 🔒 |
| Attendance delegation (assign/approve/monitor) | ➖ | ➖ | ➖ | ✅ (manage substitutions context) | ✅ | 🔒 |
| Create/update department holidays | ➖ | ➖ | ➖ | ➖ | ✅ | ➖ |
| Teaching materials CRUD (own) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Assignments (create/grade for assigned subjects) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Enter marks (for assigned schedules) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Upload external marks | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ (student-side) |
| Publish results | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ (admin/exam-cell-side) |
| Lesson planner submit (own) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Work diary submit (own) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔒 |
| Approve planner/diary (L1) | ➖ | ➖ | ➖ | ➖ | ✅ | ➖ |
| Approve planner/diary (Final) | ➖ | ➖ | ➖ | ➖ | ➖ | ✅ |
| Substitutions: create/assign (dept) | ➖ | ➖ | ➖ | ✅ | ✅ | 🔒 |
| Mentor tools (view assigned mentees) | ➖ | ➖ | ✅ | ➖ | ✅ | 🔒 |
| Class teacher tools (class roster + summaries) | ➖ | ✅ | ➖ | ➖ | ✅ | 🔒 |

Notes:
- Even if the Teacher module UI allows navigation, **RLS must enforce** the real permissions.
- Some approval features can live in Admin module screens (current RBAC docs focus there). If you prefer, we can add a dedicated teacher approval area later for `hod`/`principal`.

---

## Full Feature Catalogue (2025) — By Role
This is the “complete list” to implement over time, while keeping the current app UI minimal until each module is built.

### 0) Universal (All Teacher Roles)
Features:
- Email + password login
- Multi-role detection (subject_teacher / class_teacher / mentor / coordinator / hod)
- Auto-route dashboard based on **highest role**
- Profile view/edit + profile photo
- Secure session management

Functions:
- Email authentication
- Fetch assigned roles + permissions
- Refresh session token
- Update profile

### 1) Subject Teacher (Base)
Daily class handling:
- View daily/weekly timetable
- Start class session (context for Attendance / Materials / Assignments / Internal marks)
- Substitute-teacher mode (if assigned)

Attendance (subject-wise):
- Mark P/A/L (and other supported statuses)
- Edit within grace window
- Auto-lock after window closes
- View attendance summary

Teaching materials:
- Upload notes/PDF/PPT/links/videos
- Upload syllabus PDF
- Manage materials (edit/delete)
- Notify students

Assignments:
- Create assignments with instructions + attachments
- View submissions
- Grade + feedback

Internal/Model exams (teacher inputs ONLY internal marks):
- Enter internal marks manually
- Upload internal marks via CSV (match by student identifiers)
- Lock marks after final submission
- View subject performance summaries

Lesson planner:
- Upload syllabus (PDF/CSV)
- Track topic completion
- Submit weekly planner for approval

Work diary:
- Daily entries (periods taken, OD/DL/leave/extra)
- Monthly submission
- Track approval status

Communication (subject-level):
- Announcements to subject batch
- Attachments

### 2) Class Teacher (Stacked on Subject Teacher)
Class administration:
- Full student roster + profiles
- View cross-subject attendance and internal/model marks (read-only where applicable)
- Identify shortage/weak students
- Class ranking / summaries

Class reporting:
- Attendance and performance reports
- Export PDF/CSV (optional)

Communication:
- Class-wide announcements
- Parent communication (optional; only if system supports it)

### 3) Mentor
Mentee access:
- View mentee list
- View attendance + academic summaries for mentees

Counselling:
- Counselling notes + attachments
- Follow-up reminders
- Escalation path (mentor → class_teacher/hod)

### 4) Coordinator (Strict scope)
Temporary assignment / substitution support:
- Detect absent teachers (if data exists)
- Assign substitutes (time-bound)
- Grant temporary access to a class session context
- Auto-expire access
- Log substitution for audit

Constraint:
- Coordinator should have **no other** teacher permissions beyond substitution workflow.

### 5) HOD (Department Authority)
Teacher/subject management:
- Assign/reassign subjects to teachers (if this remains in Admin module, HOD gets read-only here)
- Approve cross-department teaching
- Approve coordinator assignments

Academic oversight:
- Department-level attendance analytics
- Syllabus completion tracking
- Internal/model performance insights

Approvals:
- Approve weekly lesson planner (L1)
- Approve monthly work diary (L1)
- Approve leave requests (if implemented)

Substitutions:
- Override coordinator substitution assignments

Communications:
- Department-wide announcements

### 6) Principal (Final Authority)
- Final approval for planners/diaries
- Monitoring dashboards (read-only)

---

## Marks Ownership Rule (Critical)
- **Teacher module:** internal marks entry + internal performance views only.
- **Student module:** external marks upload (as specified).
- **Admin/Exam Cell:** exam schedules/dates/timetable setup + publishing.

---

## System-Wide Functions (Shared)
Push notifications (triggered for):
- New assignments
- Marks uploaded
- Announcements
- Planner/diary status updates
- Substitution alerts
- Exam timetable updates

Audit logging tracks:
- Attendance edits
- Marks edits
- Planner submissions/approvals
- Diary submissions/approvals
- Substitution events
- HOD decisions

Offline support (optional):
- Attendance marking
- Marks entry
- Diary entry
- Planner checklist
- Auto-sync when online

Events note:
- No QR attendance in events.

---

## P0 — Hard Prerequisites (Do First)

### 1) Canonical Timetable Model (Resolve Schema Drift)
The migrations currently show conflicting timetable history (sections-based vs program/year vs courses-only).

**Decision required:** choose ONE canonical timetable shape and update both DB + app accordingly.

Recommended canonical model (clean + future-proof):
- `timetable_entries`
  - `academic_year_id`
  - `day_of_week`, `period`, `start_time`, `end_time`
  - `teacher_id`
  - `year_id`
  - `degree_course_id` (the degree program, stored in `courses` with `program_type IS NOT NULL`)
  - `subject_id` (from `subjects` table)
  - `is_active`

Why:
- You already have `subjects(course_id, semester_id, ...)` in migrations, which is the correct place for “what is being taught”.
- Avoid overloading `courses` for both “degree programs” and “subjects”.

Acceptance criteria:
- Target Supabase DB has the chosen columns and FKs.
- Admin timetable UI and teacher timetable/attendance use the same keys.

### 2) Confirm Teacher Identity Link
- Ensure `teachers.user_id -> profiles.id` (or auth uid) mapping is consistent.
- Acceptance criteria:
  - Given `auth.uid()`, you can reliably derive `teacher_id`.

### 3) RLS Validation (Action-Level)
For each teacher feature, validate:
- Teacher can access ONLY their assigned records
- Teacher cannot write outside their scope

Deliverable:
- A small set of manual test cases + at least one script check (optional) confirming key RLS paths.

---

## P1 — Teacher Module MVP (Core Workflows)

### Navigation / Structure (Match Admin Style)
- Keep GlassDock navbar structure, but add icons only when the module exists.

**Phase 1 navbar (Home only):**
- Home → `/(teacher)/dashboard`

**Phase 2 navbar (after Attendance MVP ships):**
- Home
- Attendance

**Phase 3 navbar:**
- Home
- Attendance
- Materials
- Results

Implementation note:
- Follow the same layout approach as `/(admin)/_layout.tsx` (dock UI), just with a smaller `navItems` list.

### Module 1: Teacher Timetable (Read-only)
Routes:
- `/(teacher)/timetable` (list)

UI requirements (minimal):
- Today view + week view (simple list is fine)
- Show period, subject, year, room

DB needs:
- `timetable_entries` aligned with canonical model
- RLS: teacher can `SELECT` entries where `teacher_id` matches

### Module 2: Attendance (MVP)
Routes:
- `/(teacher)/attendance` (today’s classes)
- `/(teacher)/attendance/mark` (mark attendance for one period)
- `/(teacher)/attendance/history` (optional for MVP)

DB tables (expected):
- `attendance` (header)
- `attendance_records` (per-student status)
- Optional: `attendance_logs` / `attendance_delegations` if you want delegation/proxy detection

Rules:
- One attendance header per (date, period, timetable_entry_id)
- Attendance marking limited to assigned teacher
- Locking/edit window policy (optional for MVP)

Acceptance criteria:
- Teacher marks attendance, refresh shows completion
- Cannot mark other teacher’s class

### Module 3: Teaching Materials (MVP CRUD)
Routes:
- `/(teacher)/materials` (list)
- `/(teacher)/materials/create` (optional; can be inline modal later)

DB tables (expected from migrations):
- `teaching_materials`

Data:
- Title, description, subject/year linkage, file URL (Supabase Storage) OR attachment metadata

Acceptance criteria:
- Teacher can create/list/delete their own materials
- Other teachers cannot see/edit materials unless policy allows

### Module 4: Results / Marks (MVP)
Routes:
- `/(teacher)/results` (select exam + subject + year)
- `/(teacher)/results/mark` (enter marks)

DB tables:
- `exams`
- `exam_schedules`
- `exam_marks`

Rules:
- Teacher can enter marks only for schedules they are responsible for (via timetable/assignment mapping)
- Publishing results remains admin-only (recommended)

Acceptance criteria:
- Teacher enters marks; re-open shows saved values
- RLS prevents writing marks for other schedules

---

## P2 — Secondary Teacher Tools

### Lesson Planner
- Use `lesson_planners` table
- Add route `/(teacher)/planner`

### Work Diary
- Use `work_diaries` table
- Add route `/(teacher)/diary`

### Substitutions (Read-only first)
- Use `substitutions` table
- Teacher can see substitution assignments

---

## Milestones (Practical Build Order)
1. Canonical timetable schema finalized + migrations applied
2. Teacher timetable (read-only)
3. Attendance marking workflow
4. Materials CRUD
5. Marks entry workflow
6. Planner/Diary

---

## Risks / Known Tricky Areas
- Timetable schema drift across migrations (must be resolved before building features).
- Courses vs subjects confusion (avoid treating a degree program as a “subject”).
- RLS correctness: UI restrictions are not security.

---

## Definition of Done (Teacher Module)
- Each module has:
  - Stable routes
  - DB tables and RLS policies verified
  - Basic UI and error handling
  - Manual test checklist covering permissions
- Navbar only exposes modules that exist and are tested.
