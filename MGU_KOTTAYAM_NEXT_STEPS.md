# MGU Kottayam — Recommended Next Steps (End-to-End)

Date: 2025-12-26

This repo is already strong on **Admin + RBAC + DB fixes**. The next wins are (1) removing schema drift, then (2) finishing **Teacher + Student** daily workflows.

---

## P0 — Stabilize the Data Model (must do first)

### 1) Decide the canonical “class identity” model
MGU colleges typically operate by **Department + Year + Division/Section**. Your baseline schema already includes `sections`.

**Recommendation (simplest + consistent with existing tables):**
- Keep using `sections` as the canonical “class”.
- Timetable, attendance, assignments, marks entry should all link to `section_id`.

**Why:** Many tables already reference `section_id` (attendance, timetable_entries in older schema, assignments, planners). Teacher results UI also expects `section_id`.

**Acceptance:** One clear rule:
- `section_id` = the class/division
- `courses` = programmes + subject-courses (dual-purpose)
- `subjects` = subject definitions (preferred for teaching identity)

### 2) Resolve timetable schema drift (critical)
Your repo contains *two competing timetable approaches*:
- `timetable_entries(section_id, period 1–10)` (from extended schema)
- later migration introduces a program/year-based timetable with different constraints

**Recommended canonical timetable (MGU-friendly):**
- `timetable_entries`
  - `section_id` (class)
  - `academic_year_id`
  - `day_of_week` 1–5
  - `period` 1–5 (or 1–10 if your college uses more)
  - `start_time`, `end_time`
  - `teacher_id`
  - `course_id` (subject-course) OR `subject_id` (preferred long-term)

**Acceptance:**
- Teacher Timetable screen, Teacher Attendance, and Teacher Results all read the *same keys*.

### 3) Confirm teacher identity link
**Rule:** `teachers.user_id` must map to `profiles.id` (Supabase auth uid).

**Acceptance:**
- From `auth.uid()` the app can reliably derive exactly one `teacher_id`.

### 4) RLS / RBAC enforcement (action-level)
You already have screen-level RBAC.

**Now ensure action-level:**
- Teachers can only mark attendance for their own timetable entries.
- Teachers can only create/update their own materials/assignments.
- Teachers can only enter internal marks for schedules they are assigned.

**Acceptance:**
- A non-privileged user cannot write outside scope even via API calls.

---

## P1 — Teacher MVP (ship these in order)

### 1) Teacher Timetable (read-only)
- Show today/week schedule from `timetable_entries`.

### 2) Attendance (daily driver)
- Today classes → Mark attendance → Save
- Lock/edit policy can be minimal initially.

### 3) Materials
- Teacher creates materials linked to their assigned subject-course.

### 4) Internal Marks
- Only internal/model exams (MGU university marks remain student-uploaded as PDFs if that’s the current rule).

---

## P1 — Student MVP

### 1) Student timetable + attendance read-only
- Read attendance by student’s `section_id`.

### 2) External marks upload (MGU university)
- Student uploads result PDF + SGPA/CGPA.
- Admin verifies.

---

## P2 — Ops + Compliance (India)

### DPDP Act 2023 practical checklist
- Minimize sensitive identifiers (APAAR only if required; avoid collecting Aadhaar numbers).
- Add retention policy for documents (result PDFs) and logs.
- Ensure role-based access to student documents.

### Operational
- Enable audit logs for attendance edits + marks edits.
- Backups: keep manual backups (already implemented) before enabling scheduled backups.

---

## What I recommend we do next in this repo

1) Pick the canonical timetable: **section-based** (fastest to align with existing tables).
2) Apply a small migration to remove broken/legacy timetable indexes.
3) Align Teacher screens to the canonical timetable shape.

If you confirm whether JPM runs **5 periods** or **10 periods**, I’ll implement the timetable alignment + teacher screen fixes in code + SQL.
