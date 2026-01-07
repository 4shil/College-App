# Student Module Audit — Features, Data Dependencies, and Plan Coverage

Date: 2026-01-07

This document audits the **entire Student module** implementation in the repo and compares it against the blueprint in [STUDENT_MODULE_PLAN.md](../STUDENT_MODULE_PLAN.md).

Legend:
- ✅ Implemented end-to-end (UI exists + reads/writes correct tables)
- 🟡 Partially implemented (UI exists but missing key plan features, or uses placeholders)
- ❌ Not implemented (no UI/flow, or only stub)

---

## 1) Student module route map (what exists in `app/(student)`)

Navigation container: [app/(student)/_layout.tsx](../app/%28student%29/_layout.tsx)

Stack screens registered:
- `dashboard`, `attendance`, `timetable`, `materials`, `marks`, `assignments`, `profile`
- plus: `library`, `notices`, `canteen`, `bus`, `fees`, `events`, `feedback`, `honors`, `support`, `settings`

Actual route files/folders found:
- Home: [app/(student)/dashboard.tsx](../app/%28student%29/dashboard.tsx)
- Attendance: [app/(student)/attendance.tsx](../app/%28student%29/attendance.tsx)
  - Note: folder [app/(student)/attendance/](../app/%28student%29/attendance/) is empty (likely leftover from planned structure)
- Timetable: [app/(student)/timetable/index.tsx](../app/%28student%29/timetable/index.tsx)
- Materials: [app/(student)/materials.tsx](../app/%28student%29/materials.tsx)
  - Note: folder [app/(student)/materials/](../app/%28student%29/materials/) is empty
- Marks: [app/(student)/marks/index.tsx](../app/%28student%29/marks/index.tsx)
- Exams: [app/(student)/exams/index.tsx](../app/%28student%29/exams/index.tsx)
- Results: [app/(student)/results.tsx](../app/%28student%29/results.tsx)
- Assignments: [app/(student)/assignments/index.tsx](../app/%28student%29/assignments/index.tsx), [app/(student)/assignments/[id].tsx](../app/%28student%29/assignments/%5Bid%5D.tsx)
- Notices: [app/(student)/notices/index.tsx](../app/%28student%29/notices/index.tsx), [app/(student)/notices/[id].tsx](../app/%28student%29/notices/%5Bid%5D.tsx)
- Events: [app/(student)/events/index.tsx](../app/%28student%29/events/index.tsx), [app/(student)/events/[id].tsx](../app/%28student%29/events/%5Bid%5D.tsx)
- Library: [app/(student)/library/index.tsx](../app/%28student%29/library/index.tsx)
- Canteen: [app/(student)/canteen/index.tsx](../app/%28student%29/canteen/index.tsx)
- Bus: [app/(student)/bus/index.tsx](../app/%28student%29/bus/index.tsx)
- Fees: [app/(student)/fees/index.tsx](../app/%28student%29/fees/index.tsx)
- Feedback/Complaints: [app/(student)/feedback/index.tsx](../app/%28student%29/feedback/index.tsx)
- Honors/Minor: [app/(student)/honors/index.tsx](../app/%28student%29/honors/index.tsx)
- Support: [app/(student)/support/index.tsx](../app/%28student%29/support/index.tsx)
- Settings: [app/(student)/settings/index.tsx](../app/%28student%29/settings/index.tsx)
- Profile: [app/(student)/profile.tsx](../app/%28student%29/profile.tsx)

---

## 2) Cross-cutting dependencies (used by many screens)

### 2.1 Auth + student identity
Most student screens do one of these:
- `getStudentByUserId(user.id)` (link-check) from [lib/database.ts](../lib/database.ts)
- `getStudentWithDetails(user.id)` (dashboard/profile) from [lib/database.ts](../lib/database.ts)

If a user exists in Supabase Auth but has no `students` row linked, many screens show “Student profile not found”.

### 2.2 Supabase tables frequently touched by the student module
Based on implemented queries:
- `students`, `profiles`, `departments`, `sections`
- Attendance: `attendance_records`, `attendance`
- Timetable: `timetable_entries`, `substitutions`
- Assignments: `assignments`, `assignment_submissions`
- Materials: `teaching_materials`
- Marks/Results: `exam_marks`, `exam_schedules`, `exams`, `external_marks`
- Notices: `notices`, `notice_reads`
- Events: `events`, `event_certificates`
- Library: `books`, `book_issues`
- Canteen: `canteen_daily_menu`, `canteen_menu_items`, `canteen_tokens`
- Bus: `bus_routes`, `bus_stops`, `bus_subscriptions`, `academic_years`
- Fees: `student_fees`, `fee_payments`, `fee_structures`
- Feedback: `feedback`, `complaints`
- Honors: `minor_subjects`, `student_minor_registrations`

### 2.3 RLS note
Student screens depend on RLS allowing students to read:
- their own student-owned rows (`student_id` / `user_id`)
- common-read tables (menu, books, routes)

A policy coverage patch was added previously for student-used tables:
- [supabase/migrations/20260107000001_student_module_missing_rls.sql](../supabase/migrations/20260107000001_student_module_missing_rls.sql)

---

## 3) Plan vs Implementation — per feature area

This section maps the plan in [STUDENT_MODULE_PLAN.md](../STUDENT_MODULE_PLAN.md) to current code.

### 3.0 Authentication & Profile
Plan target: login/logout, forgot password, profile view/edit, profile photo upload.

Status: 🟡 Partial

Implemented:
- Student login + module routing exists (see [docs/STUDENT_LOGIN_FLOW_ANALYSIS.md](STUDENT_LOGIN_FLOW_ANALYSIS.md))
- Profile view (student info + academic details): [app/(student)/profile.tsx](../app/%28student%29/profile.tsx)
- Settings page provides theme + animations + logout: [app/(student)/settings/index.tsx](../app/%28student%29/settings/index.tsx)

Missing vs plan:
- Profile edit UI (phone/email changes, editable fields)
- Profile photo upload flow (only displays `profile.photo_url`)
- “Clear cache”, notification preferences, about/version

DB expectations:
- `profiles` row for display name/photo
- `students` row for academic details

---

### 3.1 Dashboard (home overview)
Plan target: today timetable, attendance %, assignments, marks snapshot, notices hub, canteen/bus/library previews.

Status: 🟡 Partial

Implemented:
- Dashboard UI + cards + navigation: [app/(student)/dashboard.tsx](../app/%28student%29/dashboard.tsx)
- Data hook: [hooks/useStudentDashboard.ts](../hooks/useStudentDashboard.ts)
  - Today timetable: reads `timetable_entries`
  - Attendance snapshot: uses `getAttendanceSummary()`
  - Upcoming assignments: reads `assignments`
  - Marks preview: reads latest `exam_marks`

Not implemented / placeholder inside hook:
- `quickNoticesCount` and `unreadNoticesCount` are hard-coded to `0`
- `nextClass` is always `null`
- No canteen/bus/library preview widgets

---

### 3.2 Attendance
Plan target: subject-wise %, daily timeline, monthly calendar, shortage alerts.

Status: 🟡 Partial

Implemented:
- Monthly summary + recent records list: [app/(student)/attendance.tsx](../app/%28student%29/attendance.tsx)
- Uses:
  - `getAttendanceSummary(studentId, start, end)`
  - `attendance_records` joined to `attendance(date, period, course)`

Missing vs plan:
- Subject-wise breakdown page
- Calendar view
- Shortage alerts list
- Teacher remarks display (if desired)

---

### 3.3 Timetable
Plan target: day-wise, weekly, substitutions.

Status: ✅ Implemented (core)

Implemented:
- Day view + week view + substitutions tab: [app/(student)/timetable/index.tsx](../app/%28student%29/timetable/index.tsx)
- Reads:
  - `timetable_entries` by `section_id`, `academic_year_id`, `day_of_week`
  - `substitutions` with inner join `timetable_entries` (approved for current week)

Missing vs plan:
- Teacher info (not currently queried)
- Classroom info beyond `room` string

---

### 3.4 Assignments
Plan target: list, filters, detail, submission upload (PDF/photo), submission status, marks/feedback.

Status: 🟡 Partial

Implemented:
- Assignment list + filters: [app/(student)/assignments/index.tsx](../app/%28student%29/assignments/index.tsx)
  - Reads `assignments` by `section_id`
  - Reads `assignment_submissions` by `student_id`
- Assignment detail page: [app/(student)/assignments/[id].tsx](../app/%28student%29/assignments/%5Bid%5D.tsx)
  - Reads one `assignments` row
  - Reads/upserts `assignment_submissions` (onConflict `assignment_id,student_id`)
  - Submission method: **URLs typed/pasted** (not file upload)

Missing vs plan:
- Native file upload (PDF/photo) + storage integration
- Calendar view
- Rich submission history
- Teacher feedback/marks display beyond fields already present

---

### 3.5 Academic Materials
Plan target: subject-wise library, downloads, offline access, search.

Status: 🟡 Partial

Implemented:
- Materials list + open link: [app/(student)/materials.tsx](../app/%28student%29/materials.tsx)
- Reads `teaching_materials` where `is_active = true`

Missing vs plan:
- Subject-wise grouping/filtering
- Download manager + offline access
- Search

---

### 3.6 Internal Marks
Plan target: breakdowns, graphs, semester-wise.

Status: 🟡 Partial

Implemented:
- Marks list + basic stats: [app/(student)/marks/index.tsx](../app/%28student%29/marks/index.tsx)
- Reads `exam_marks` joined to `exam_schedules` + `exams` + `courses`

Missing vs plan:
- CAT/Series breakdown types, graphs
- Semester-wise analytics/history screens

---

### 3.7 External Marks (upload + exam cell verifies)
Plan target: student uploads PDF/image, track status, download approved file.

Status: 🟡 Partial (view-only)

Implemented:
- External marks list is shown in Results screen: [app/(student)/results.tsx](../app/%28student%29/results.tsx)
- Latest external status shown in Exams: [app/(student)/exams/index.tsx](../app/%28student%29/exams/index.tsx)
- Reads `external_marks` (status, rejection_reason, sgpa/cgpa, result_pdf_url)

Missing vs plan:
- Student upload UI (file picker + storage upload + insert into `external_marks` with `upload_status='pending'`)
- Download-only gating for approved file (currently just opens whatever URL is present)

---

### 3.8 Exams module
Plan target: exam timetable, hall ticket, results, archives, SGPA/CGPA.

Status: 🟡 Partial

Implemented:
- Exam schedule list: [app/(student)/exams/index.tsx](../app/%28student%29/exams/index.tsx)
  - Reads published `exams` filtered by student academic_year + semester
  - Reads `exam_schedules` for those exams
  - Shows latest `external_marks` status

Missing vs plan:
- Hall ticket download
- Previous semester archive
- SGPA/CGPA calculation UI beyond displaying values from `external_marks`

---

### 3.9 Library
Plan target: search, borrowed, renew, request/reserve, fine details.

Status: 🟡 Partial

Implemented:
- Book list + local search filter + my issues: [app/(student)/library/index.tsx](../app/%28student%29/library/index.tsx)
- Reads:
  - `books` (active)
  - `book_issues` filtered by `user_id`

Missing vs plan:
- Renew action
- Book request / reservation queue
- Notifications for due soon/overdue

---

### 3.10 Canteen
Plan target: menu + token ordering + token history.

Status: 🟡 Partial

Implemented:
- Menu for today + token history list: [app/(student)/canteen/index.tsx](../app/%28student%29/canteen/index.tsx)
- Reads:
  - `canteen_daily_menu` joined to `canteen_menu_items`
  - `canteen_tokens` filtered by `user_id`

Missing vs plan:
- Create token / preorder flow
- Payment integration/history (if desired)

---

### 3.11 Bus
Plan target: apply selection, status, route overview, arrival time, alerts.

Status: 🟡 Partial

Implemented:
- Bus subscription request + status: [app/(student)/bus/index.tsx](../app/%28student%29/bus/index.tsx)
- Reads:
  - `bus_subscriptions` (per student + academic_year)
  - `bus_routes`
  - `bus_stops`
  - `academic_years` (fallback to current year)
- Writes:
  - inserts into `bus_subscriptions` with `approval_status='pending'`

Missing vs plan:
- Arrival time tracking
- Payment alerts/history
- Holiday alerts

---

### 3.12 Notices & Announcements
Plan target: notices list/detail + mark read + push notifications (later).

Status: ✅ Implemented (core)

Implemented:
- Notices list with unread filter: [app/(student)/notices/index.tsx](../app/%28student%29/notices/index.tsx)
  - Reads `notices` for scope: section/department/college
  - Reads `notice_reads` to compute unread
- Notice detail marks read: [app/(student)/notices/[id].tsx](../app/%28student%29/notices/%5Bid%5D.tsx)
  - Upserts `notice_reads` (`notice_id`, `user_id`)

Missing vs plan:
- Push notification pipeline (explicitly listed as later)

---

### 3.13 Events & Activities
Plan target: list/detail, external registration link, optional certificate download.

Status: ✅ Implemented (aligned with constraints)

Implemented:
- Events list: [app/(student)/events/index.tsx](../app/%28student%29/events/index.tsx)
- Event detail:
  - opens external registration link
  - downloads certificate if present
  - [app/(student)/events/[id].tsx](../app/%28student%29/events/%5Bid%5D.tsx)
- Reads:
  - `events` (active, department-scoped)
  - `event_certificates` by `student_id`

---

### 3.14 Feedback & Complaints
Plan target: feedback + complaint ticketing + attachments + status.

Status: 🟡 Partial

Implemented:
- Feedback submission and list: `feedback` table
- Complaints submission and list: `complaints` table
- UI: [app/(student)/feedback/index.tsx](../app/%28student%29/feedback/index.tsx)

Missing vs plan:
- Attachment upload (currently only an `attachment_url` string field)
- Dedicated “track status” beyond the list (though status is displayed)

---

### 3.15 Fees
Plan target: fee status, receipts, optional online payment.

Status: 🟡 Partial

Implemented:
- Fee items + recent payments + open receipt URLs: [app/(student)/fees/index.tsx](../app/%28student%29/fees/index.tsx)
- Reads:
  - `student_fees` joined with `fee_structures`
  - `fee_payments` for those fees

Missing vs plan:
- Online pay flow
- Full payment history browsing/filtering

---

### 3.16 Honors / Major–Minor
Plan target: list minors, submit choice, track approval.

Status: ✅ Implemented (core)

Implemented:
- Honors/minor selection + approval status + resubmit on rejection: [app/(student)/honors/index.tsx](../app/%28student%29/honors/index.tsx)
- Reads:
  - `student_minor_registrations` (my current)
  - `minor_subjects` joined to `courses`
- Writes:
  - insert/update `student_minor_registrations`

---

### 3.17 Settings
Plan target: dark mode, notifications toggles, update email/phone, clear cache, about.

Status: 🟡 Partial

Implemented:
- Theme toggle + animations toggle + sign-out: [app/(student)/settings/index.tsx](../app/%28student%29/settings/index.tsx)

Missing vs plan:
- Notification settings
- Update email/phone
- About/version
- Clear cache

---

### 3.18 Support
Plan target: support contacts, helpdesk/chat (optional), FAQ, support ticket.

Status: 🟡 Partial

Implemented:
- Contacts: class teacher + HOD (queries `sections.class_teacher_id` and `departments.hod_user_id`, then loads `profiles`)
- FAQ static list
- Button routes to complaints for tickets
- UI: [app/(student)/support/index.tsx](../app/%28student%29/support/index.tsx)

Missing vs plan:
- Real helpdesk/chat
- Dedicated “send support request” separate from complaints

---

## 4) Biggest mismatches vs `STUDENT_MODULE_PLAN.md`

The plan file’s “Current Repo Reality” section is outdated: many modules that it marked as missing are now present as routes.

What is now implemented (at least partially) beyond the earlier plan summary:
- Timetable ✅
- Assignments 🟡
- Notices ✅
- Events ✅
- Library 🟡
- Canteen 🟡
- Bus 🟡
- Fees 🟡
- Feedback/Complaints 🟡
- Honors/Minor ✅
- Support 🟡
- Settings 🟡

---

## 5) Top “not implemented” items that block the full plan

If you want the Student module to match the blueprint, the biggest remaining gaps are:

1) External marks upload flow (file picker + storage upload + insert `external_marks` with `pending`)
2) Materials downloads + offline access + search
3) Attendance subject-wise + calendar + shortage alerts
4) Exam extras (hall ticket + archives)
5) Library renew/reserve/request flows
6) Canteen token creation/preorder flow
7) Bus arrival/payment/holiday alerts
8) Settings: notification prefs + about/version + profile edit

---

## 6) Suggested next steps (minimal, plan-aligned)

If you want a clean staged rollout (without adding “nice-to-have” features):

- P0: External marks upload (student) + verification workflow (exam cell/admin)
- P1: Dashboard notices count + unread tracking (`notice_reads`)
- P1: Materials subject filters + simple search
- P2: Attendance subject breakdown + shortage alert list

(Everything else can be scheduled after these without breaking core academics.)
