## Teacher Module Plan — Implementation Audit (MVP → Full)

Date: 2026-01-07

This document is an audit of **what is actually implemented in the repo** vs **what is not implemented / partially implemented**.

## TL;DR (Status)

### Implemented (Teacher app UI + routes exist)
- Dashboard + Modules hub
- Profile (basic edit + photo upload)
- Settings + change password
- Timetable (today/week view) + per-period **Session tools** screen
- Attendance: today list, mark screen, history screen (with RLS/time-window error messaging)
- Materials: list + create + file upload to Supabase Storage
- Assignments: list + create + submissions/grading screen
- Notices: list + create + attachment upload
- Results (internal/model): selection flow + marks grid + **CSV import** + **Final submit (lock)**
- Lesson Planner: list + create + submit + rejected edit/resubmit
- Work Diary: list + create + submit + rejected edit/resubmit

### Implemented (Role expansion modules, but scope-limited)
- Class Tools (`class_teacher`/`hod`): class roster + a small “today summary” (attendance counts)
- Mentor (`mentor`/`hod`): mentee list + mentoring session notes
- Coordinator (`coordinator`/`hod`): substitution request creation + list
- Department (`hod`): substitution approve/reject + simple teacher list
- Principal screen exists (read-only monitoring), but see **Known gaps** (currently gated off)

### Not implemented / gaps (still remaining)
- Push notifications (device registration + delivery). Current “Push Notifications” setting is UI-only.
- Offline-first mode + sync
- Teacher-side Planner/Diary approval UI (approvals currently stay in Admin)
- Substitution extras: auto-expire, richer audit timeline, escalation rules
- Department/timetable schema drift areas (see below)

---

## Implemented routes (repo reality)

These are present under `app/(teacher)` and registered in the teacher stack:

Core:
- `/(teacher)/dashboard`
- `/(teacher)/modules`
- `/(teacher)/profile`
- `/(teacher)/settings` + `/(teacher)/change-password`
- `/(teacher)/timetable`
- `/(teacher)/session/[entryId]`

Subject teacher modules:
- `/(teacher)/attendance` + `/(teacher)/attendance/mark` + `/(teacher)/attendance/history`
- `/(teacher)/materials` + `/(teacher)/materials/create`
- `/(teacher)/assignments` + `/(teacher)/assignments/create` + `/(teacher)/assignments/submissions`
- `/(teacher)/notices` + `/(teacher)/notices/create`
- `/(teacher)/results` + `/(teacher)/results/mark`
- `/(teacher)/planner` + `/(teacher)/planner/create` + `/(teacher)/planner/edit/[id]`
- `/(teacher)/diary` + `/(teacher)/diary/create` + `/(teacher)/diary/edit/[id]`

Role expansion modules:
- `/(teacher)/class-tools`
- `/(teacher)/mentor`
- `/(teacher)/coordinator`
- `/(teacher)/department`
- `/(teacher)/principal`

---

## Access control (how it is gated today)

- Layout-level gating: all `/(teacher)` routes are wrapped by `Restricted` and require one of:
  `subject_teacher`, `class_teacher`, `mentor`, `coordinator`, `hod`.
- Navigation unlocks are role-aware via `lib/teacherModules.ts` (module list + `requiresAnyRole`).
- **Coordinator-only strict mode is enforced** (UI/nav): coordinator-only users are forced to `/coordinator` and only see Coordinator + Settings.
- **Important:** security is still expected to be enforced by **Postgres RLS**. UI gating is convenience, not a security boundary.

---

## What works end-to-end today (based on screens + queries)

- Timetable → Session tools: teacher can open a timetable entry and jump to quick actions for attendance/materials/assignments/notices/marks.
- Attendance:
  - Creates/loads an attendance header for (date, period, timetable_entry_id)
  - Upserts `attendance_records`
  - If blocked by policy, UI shows: “Attendance is locked or outside the allowed time window.” (i.e., RLS/policy errors are surfaced).
- Materials/Notices/Profile uploads: file picking + upload to Supabase Storage (`teacher_uploads` bucket) and save public URL.
- Results (internal/model):
  - Exam → schedule → section selection
  - Marks grid saves via upsert
  - CSV import is implemented (DocumentPicker + parsing)
  - Final submit locking is implemented using `exam_marks_locks` (and UI disables edits when locked)
- Planner/Diary:
  - Teacher can create drafts and submit
  - Rejected items show rejection reason
  - Rejected items have dedicated edit screens and resubmission
  - Approvals are performed in the Admin module via RPC functions (`approve_lesson_planner`, `approve_work_diary`) + RLS.
- Coordinator substitutions:
  - Create substitution request (pending)
  - List substitutions (RLS governs visibility)
- HOD Department:
  - Shows departments where the user is `hod_user_id`
  - Approve/reject substitutions (via updating `substitutions.status`; RLS must enforce who can do this)
- Principal:
  - Read-only monitoring (substitution overview)

---

## Known gaps / mismatches (doc vs current code)

1) **Principal route exists but is currently not reachable**
- `app/(teacher)/principal` exists.
- But `app/(teacher)/_layout.tsx`’s `Restricted` roles do **not** include `principal`, and the dock/nav logic also doesn’t expose Principal.
- If Principal should use teacher flows, add `principal` to the `Restricted` role list and decide which modules they can see (read-only vs full).

2) **Push notifications are not implemented (UI-only toggle)**
- Teacher Settings has a “Push Notifications” toggle, but it only flips local state.
- There is no `expo-notifications` registration/token storage and no server-side send pipeline in the app code.

3) Timetable schema drift is still visible in code
- Some screens assume `timetable_entries.section_id`, others have fallbacks around `program_id`.
- This can produce “works in some places, breaks in others” if DB schema/data is not consistent.

---

## Not implemented (full-scope catalogue, remaining items)

System-level:
- Push notification triggers
- Offline-first mode + sync
- Broad teacher analytics dashboards

Approvals UX:
- Teacher-side approval inbox for `hod`/`principal` (approvals stay in Admin today)

Substitutions:
- Auto-expire / time-bound access
- Rich audit views (who changed what, when)

Content:
- Any extra “subject-batch announcements” concept beyond current class-scoped notices

---

## Recommended next steps (highest impact)

P0 — correctness/security
- Confirm/standardize canonical timetable keys (same keys used across timetable/attendance/results/substitutions)
  - Inventory (current code uses these in different places):
    - `timetable_entries`: `id`, `academic_year_id`, `teacher_id`, `day_of_week`, `period`, `course_id`, `year_id`, `section_id`, `room` (+ some fallback code references `program_id`)
    - Attendance writes store extra scoping: `attendance.programme_id` and/or `attendance.department_id` (passed from timetable/history screens)
  - Decide the single canonical shape for class identity:
    - Preferred in UI today: `section_id` (used by results selection + session tools + timetable joins)
    - Avoid split-brain between `section_id` vs (`year_id` + `programme_id`/`department_id`)
  - Acceptance checks (P0 done when true):
    - Teacher timetable shows the same classes that attendance + results screens expect
    - Substitution filtering in Department screen can be done without fallback logic
    - No screen needs to guess between `section_id` and `program_id`

- Coordinator-only strict mode (status + remaining work)
  - ✅ UI/nav enforcement is implemented:
    - `app/(teacher)/_layout.tsx` forces coordinator-only users to `/coordinator` and limits dock items.
    - `lib/teacherModules.ts` hides non-coordinator modules for coordinator-only users.
  - Remaining (security): ensure Postgres RLS enforces the same boundary.
    - Coordinator-only accounts should be able to access only `substitutions` + minimum timetable context needed.
    - Coordinator-only accounts must be blocked from `attendance`, `exam_marks`, `lesson_planners`, `work_diaries`, etc.
  - Acceptance checks (P0 done when true):
    - A coordinator-only user cannot mark attendance or enter marks (even via direct API calls)
    - A coordinator+teacher user retains normal teacher permissions (stacked roles)

- Run an RLS validation checklist (manual, action-level)
  - Setup
    - Use at least 2 teacher users: Teacher A and Teacher B, with non-overlapping timetable entries.
    - Ensure at least 1 section/class exists for each teacher via `timetable_entries`.
    - If testing role-expansion: have one `hod` and one `principal` user.
  - Timetable (`timetable_entries`)
    - Teacher A can `SELECT` only their entries (no Teacher B entries).
    - Teacher A cannot `INSERT/UPDATE/DELETE` timetable entries.
  - Attendance (`attendance`, `attendance_records`)
    - Teacher A can create attendance only for their own `timetable_entry_id`.
    - Teacher A cannot create attendance for Teacher B’s `timetable_entry_id`.
    - Teacher A can upsert records only for attendance headers they are allowed to access.
    - Time-window enforcement: after the allowed window, `UPDATE/UPSERT` must fail and UI should show the locked message.
  - Marks (`exam_marks`, `exam_marks_locks`, `exam_schedules`)
    - Teacher A can `SELECT` only schedules that match their assigned subjects (as defined by your current mapping).
    - Teacher A can `UPSERT` marks only for schedules/sections they are allowed to edit.
    - Locking:
      - Teacher A can create one lock row in `exam_marks_locks` for their allowed schedule+section.
      - After lock exists, Teacher A cannot modify `exam_marks` for that schedule+section.
      - Teacher B cannot lock or edit marks for Teacher A’s schedule+section.
  - Planner (`lesson_planners`)
    - Teacher can create drafts and submit.
    - Teacher cannot set status to `approved` directly.
    - Only approval RPC path (Admin module) can advance approvals.
    - Teacher can update only when `status IN ('draft','rejected')`.
  - Diary (`work_diaries`)
    - Teacher can create drafts and submit.
    - Teacher cannot directly set `hod_approved` / `principal_approved`.
    - Teacher can update only when `status IN ('draft','rejected')`.
  - Substitutions (`substitutions`)
    - Coordinator can create a substitution request for permitted timetable entries (as per your policy).
    - Teacher A cannot approve/reject unless they are `hod` (or explicitly permitted).
    - HOD can approve/reject substitutions only within their department scope.
    - Principal screen is read-only (no mutation permissions).
  - Optional: add a “negative test” for each table
    - Attempt a direct update with Supabase client and confirm it fails with RLS/policy error.

P1 — product polish
- Add push notifications (only if desired)
- Improve substitution lifecycle (expiry + audit)

---

## System rules (must stay aligned)
- Email-only login
- Teacher module: internal/model marks entry only
- Student module: external marks upload
- Admin sets exam schedules & timetables; teachers consume and input within policy
- Lesson Planner + Diary approvals: Teacher → HOD (L1) → Principal (Final)

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
