# Teacher Module Plan (MVP → Full)

Date: 2026-01-03

## Current State (Repo Reality)
- Teacher module is already **multi-module** in the repo (not dashboard-only):
  - Navbar: GlassDock with multiple tabs (dashboard, profile, timetable, attendance, results, materials, assignments, notices, planner, diary)
  - Attendance:
    - Mark attendance (existing)
    - Attendance history screen is implemented and routed: `/(teacher)/attendance/history`
  - Materials: list + create routes exist
  - Results: marks entry routes exist
  - Assignments: list + create routes exist
    - Submissions + grading screen is implemented and routed: `/(teacher)/assignments/submissions`
  - Notices: list + create routes exist

## Implementation Audit (As of 2026-01-03)

### Recent completions (since last audit)
- **Planner/Diary approvals backend enforcement:** approvals are enforced via RPC functions + RLS (admins can’t bypass workflow via direct table updates).
- **Admin approvals UI:** a styled screen exists to approve/reject planners/diaries.
- **Teacher rejection loop:** teacher lists show rejection reason and allow resubmission for rejected planners/diaries.
- **Edit & Resubmit screens (Teacher):** dedicated edit routes added for rejected planners/diaries so teachers can update JSON content then resubmit.
- **Teacher RBAC wrapper (layout-level):** `/(teacher)` routes are now gated via `Restricted` to teacher/HOD roles.
- **RLS tightened for teachers:** teachers can no longer directly set “approved” statuses; they can only edit/submit in allowed states.

### What is completed now (MVP core flows)
This section answers: **“How much is completed and how much is left?”** using two scopes:

**Scope A — Teacher Navbar Modules (MVP):** 10/10 implemented (100%)
- Dashboard
- Profile (basic view/edit)
- Timetable
- Attendance (mark + history)
- Results (internal/model marks entry)
- Materials (create + list)
- Assignments (create + list + grade submissions)
- Notices (list + create class notice)
- Lesson Planner (draft + submit)
- Work Diary (draft + submit)

**Scope B — Teacher Routes/Screens:** 22/22 implemented (100%)
- `/(teacher)/dashboard`
- `/(teacher)/profile`
- `/(teacher)/timetable`
- `/(teacher)/attendance` + `/(teacher)/attendance/mark` + `/(teacher)/attendance/history`
- `/(teacher)/results` + `/(teacher)/results/mark`
- `/(teacher)/materials` + `/(teacher)/materials/create`
- `/(teacher)/assignments` + `/(teacher)/assignments/create` + `/(teacher)/assignments/submissions`
- `/(teacher)/notices` + `/(teacher)/notices/create`
- `/(teacher)/planner` + `/(teacher)/planner/create` + `/(teacher)/planner/edit/[id]`
- `/(teacher)/diary` + `/(teacher)/diary/create` + `/(teacher)/diary/edit/[id]`
- `/(teacher)/principal`

### What works end-to-end today
- **Timetable:** teacher can view assigned `timetable_entries` for current academic year.
- **Attendance:** teacher can load today’s periods, mark P/A/L, and view/edit recent history.
  - Server-side enforcement: attendance marking/editing is allowed only within a time window (period end + grace) via RLS.
- **Materials:** teacher can create materials (link/URL) and toggle visibility (active/hidden).
- **Assignments:** teacher can create assignments, view submissions, and enter marks + feedback.
- **Results (internal/model):** teacher can pick academic year → exam → subject schedule → section → enter marks.
- **Notices (Class Notices):** teacher can list relevant notices and create **class-scoped** notices for sections they teach (timetable-based).
- **Lesson Planner:** teacher can create a weekly planner draft and submit.
- **Work Diary:** teacher can create a monthly diary draft and submit.

### What is left / not implemented yet (Full scope)
The following items are planned in the “Full Feature Catalogue (2025)” below but are **not implemented** (or only partially implemented) in the Teacher module UI:

**Role expansion (Class Teacher / Mentor / Coordinator / HOD / Principal)**
- Class teacher tools: class roster, cross-subject summaries, shortage/weak student workflows.
- Mentor tools: mentee list, counselling notes, follow-up reminders.
- Coordinator substitution workflow: ✅ request creation + list implemented; ⚠️ auto-expire + richer audit views not implemented.
- HOD tools inside Teacher module: ✅ substitution approve/reject implemented; ⚠️ broader approval dashboards stay in Admin.
- Principal tools inside Teacher module: ✅ read-only monitoring screen implemented; ⚠️ principal approval dashboard stays in Admin.

**Approvals workflow (HOD → Principal)**
- **Implemented (Admin module):** HOD/Principal approvals are available via the Admin approvals screen, and approvals are backend-enforced.
- For the current app scope, approvals stay in the Admin module (no separate Teacher approvals area).
- **Completed (teacher edit loop):** teachers can open rejected items, edit the stored JSON content, then resubmit.

**Attendance hard rules**
- Grace window + auto-locking edits, and policy-based restrictions (now enforced server-side via RLS time window).

**Marks advanced features**
- CSV upload/import for internal marks.
- Lock/final-submit flows for marks (final submit creates a server-enforced lock per exam schedule + class).

**Content uploads**
- File upload to storage (implemented: materials + assignment attachments upload to Supabase Storage and save public URLs).

**System-level features**
- Push notifications triggers (assignments/materials/marks/planner/diary updates).
- Offline-first mode and sync.
- Audit dashboards for teachers (beyond basic lists).

## Mapping to the simplified spec (your checklist)

Roles:
- ✅ Subject Teacher (base) — implemented
- ✅ Class Teacher tools — implemented (MVP: read-only class roster)
- ✅ Class Teacher tools — implemented (MVP: roster + basic today summary card)
- ✅ Mentor tools — implemented (mentee list + session notes)
- ✅ Coordinator substitutions — implemented (request creation + list; approvals handled by HoD/Admin)
- ⚠️ HoD tools inside Teacher module — partial (MVP: department overview + substitution approve/reject; other approvals still in Admin)
- ✅ Principal tools inside Teacher module — implemented (MVP: read-only monitoring screen)

0) Login + Profile
- ✅ Email login + multi-role detection
- ✅ Profile edit (basic: name/phone)
- ✅ Profile photo upload (Storage + profiles.photo_url)

1) Subject Teacher (Base)
- Daily class handling: ✅ Timetable + per-period “Session tools” screen (quick actions for Attendance/Materials/Assignments/Notices/Marks)
- Attendance: ✅ mark + edit-with-window + history (server-side lock enforced)
- Materials: ✅ upload links/files + list (student push notification is NOT IMPLEMENTED)
- Assignments: ✅ create + view submissions + grade submissions
- Exams: ✅ internal/model marks entry + CSV upload + lock; ✅ basic class performance stats/distribution (in marks screen)
- Lesson Planner: ✅ create + submit + edit/resubmit rejected
- Work Diary: ✅ create + submit + edit/resubmit rejected
- Subject announcements: ✅ implemented as **Class Notices** (not subject-batch announcements); ❌ push notifications

### Dependencies (why some features may appear “missing”)
- Many advanced flows depend on the canonical timetable + section/program mapping being consistent (see P0 prerequisites below).
- Security should primarily rely on **Postgres RLS** (now tightened for planner/diary approvals); teacher screens still do not use a component-level RBAC wrapper.

## Next steps (recommended, highest impact)
1. **Apply DB migration + validate RLS:** deploy latest migrations and confirm teachers cannot approve by direct updates; only RPC-based approvals work.
2. **Edit & Resubmit screens:** completed (teacher can edit rejected planner/diary content and resubmit).
3. **Attendance hard rules:** completed (server-side enforced) + optional UI messaging refinements.
4. **Marks advanced:** CSV import for internal marks + locking/final-submit flow.

### Concrete backlog (remaining not-implemented scopes)
This is the “make the not implemented scopes” list in a buildable order, without expanding UX beyond the spec.

P0 — Security + correctness
- **Teacher RBAC wrapper (layout-level):** completed (teacher routes gated via `Restricted`; RLS still enforces real permissions).
- **Timetable canonicalization confirmation:** verify teacher timetable/attendance/results all read the same canonical keys and constraints.

P1 — Attendance hard rules (server-side)
- **Grace window + auto-lock edits:** completed (enforced via DB RLS time window); UI shows a clear error when blocked.

P2 — Marks advanced
- **CSV import for internal marks:** completed (import CSV into the marks grid, then save).
- **Lock/final-submit flow:** completed (server-side lock table + RLS blocks edits after lock).

P2 — Content uploads
- **Supabase Storage uploads:** completed (pick file → upload → public URL stored in DB).

P3 — Role expansion tools
- **Class teacher tools:** roster + summaries.
- **Mentor tools:** mentee list + notes.
- **Coordinator substitutions workflow:** time-bound access + audit.
- **HOD/Principal teacher-module monitoring:** read-only dashboards.

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
- `class_teacher` — in-charge of a class (student-level responsibilities). **Also a subject teacher** (base teaching role implied).
- `mentor` — mentors assigned students. **Also a teacher** (may also be a `class_teacher` / `coordinator`).
- `coordinator` — coordinates substitutions / operational coordination. **Also a teacher** (may also be a `class_teacher` / `mentor`).

Elevated roles that may also use teacher flows:
- `hod` — seeded as **admin category** in DB, but described as “teacher role with admin powers” (approvals, dept attendance, holidays)
- `principal` — seeded as **admin category** in DB (final approvals + monitoring)

Notes (important):
- **Roles are stackable.** A single user can hold multiple roles at once (e.g., `hod` + `mentor` + `class_teacher`).
- **HOD is teacher-capable.** Even though `hod` is stored as admin-category in the DB, they should still be able to use the Teacher module day-to-day flows.
- **Default landing:** if a user has `hod`, route them to the Teacher dashboard by default.
- **Hierarchy rule:** treat `subject_teacher` as the **base** capability. `class_teacher` implies subject-teacher capability (plus extra responsibilities).
- **Mentor/coordinator are add-ons:** they can coexist with `subject_teacher` and/or `class_teacher`.

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
- `subject_teacher` is the **common/base** teaching capability (other teacher roles stack on top)
- Auto-route dashboard based on landing rules:
  - `hod` defaults to **Teacher dashboard** (even though admin-category)
  - Other admin-category roles default to **Admin dashboard**
  - Teacher-category roles default to **Teacher dashboard**
- Profile view/edit (basic fields like name/phone)
- Profile photo upload (Storage + profiles.photo_url) — implemented
- Secure session management

Functions:
- Email authentication
- Fetch assigned roles + permissions
- Refresh session token
- Update profile

### 1) Subject Teacher (Base)
Daily class handling:
- View daily/weekly timetable
- Start class session (context for Attendance / Materials / Assignments / Internal marks) — implemented (Session tools)
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

Implementation status note:
- ✅ Teacher can post **class-scoped notices** (list + create) for sections they teach (based on current timetable)
- ✅ Optional attachment upload via Supabase Storage
- ❌ Push notifications for notices (NOT IMPLEMENTED)

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
- If an account is **coordinator-only**, it should have **no other** teacher permissions beyond substitution workflow.
- If a user is both `coordinator` + `subject_teacher`/`class_teacher`, they get the combined permissions (stacked roles).

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
