## Student Module Plan — Master Blueprint + Implementation Audit (2025)

Date: 2026-01-07

This document combines:
1) **Repo audit** (what is implemented right now in code), and
2) **Full Student Module blueprint** (complete 2025 feature/function list), aligned with the system rules in PROJECT_PLAN.md.

## TL;DR (Status)

### Implemented (Student app UI + routes exist)
- Dashboard (placeholder)
- Attendance (monthly summary + recent attendance list)
- Materials (list + open link)
- Results (internal marks list + external marks list)
- Profile (minimal)

### Not implemented / gaps (still remaining)
- External marks **upload** flow (student upload + exam cell verification workflow)
- Timetable, assignments, notices, events, library, canteen, bus, fees, feedback, honors/minor, settings, support
- Push notifications pipeline
- Offline-first downloads + sync

---

## 1) “Is this important or can do later?” (Teacher Plan follow-up)

From the Teacher audit, the main “important vs later” item is:

- **Principal in Teacher module**: there is a Teacher-side Principal screen at `/(teacher)/principal`, but it is currently **not reachable** because `app/(teacher)/_layout.tsx` does not include `principal` in the `Restricted` role list and the dock does not expose it.
  - **Do now** if principals must use Teacher screens in production.
  - **Can do later** if principals are intended to use the Admin module only (common) and the Teacher Principal screen was just a future/optional route.

Everything else (push notifications, offline-first downloads/sync) is usually **safe to schedule later**, because it adds infra + background behavior and has many edge-cases.

---

## 2) Current Repo Reality (Student Module Audit)

### Implemented routes (exist today)
Under `app/(student)`:
- `/(student)/dashboard` (placeholder UI + sign out)
- `/(student)/attendance` (works: monthly summary + last 20 records)
- `/(student)/materials` (works: lists active teaching materials + open link)
- `/(student)/results` (works: lists internal marks + lists external uploads; **no upload UI**)
- `/(student)/profile` (minimal: shows email + sign out)

### What is already working end-to-end
- **Attendance (student view)**
  - Reads from `attendance_records` + joined `attendance(date, period, course)`.
  - Summary logic exists in `lib/database.ts` (`getAttendanceSummary`).
- **Materials (student view)**
  - Reads `teaching_materials` where `is_active = true`.
  - Opens file URL via `Linking.openURL`.
- **Results (student view)**
  - Internal: reads `exam_marks` joined with `exam_schedules` + `exams`.
  - External: reads `external_marks` joined with semester/year metadata.
  - **Missing**: student-side upload flow for external marks.

### Not implemented in student module (as code)
Not present as routes/screens yet:
- Timetable (today/week/substitution alerts)
- Assignments (list/detail/submit/calendar)
- Notices (college/department/exam/events)
- Events (external link only + optional certificate download)
- Library module
- Canteen module
- Bus module
- Fees module
- Feedback/complaints module
- Honors/minor selection module
- Support module
- Push notifications pipeline (device registration + sending)
- Offline-first mode + sync (and “downloaded materials” storage)

---

## 3) Student Module — System Rules (Must Match Project)

These rules are taken from the project direction and must remain consistent:
- **Email-only login** (no phone login).
- **Internal marks** are entered by teachers; students **view** internal marks.
- **External/university results**: students **upload** marksheet PDF/image; Exam Cell/Admin **verifies**.
- **Events**: no QR attendance; no in-app registration. External registration link only.
- UI gating is convenience; **RLS must enforce** real permissions.

---

## 4) Student Module — Target Screen Architecture (2025)

This is the full target structure, aligned to the Project Plan screen architecture. Some screens already exist today at the “flat” level; the goal is to migrate to the structured folders below as implementation grows.

```
app/(student)/
├── _layout.tsx
├── dashboard.tsx
├── profile.tsx
├── profile-photo.tsx
│
├── attendance/
│   ├── index.tsx
│   ├── daily.tsx
│   ├── calendar.tsx
│   └── alerts.tsx
│
├── timetable/
│   ├── index.tsx
│   ├── weekly.tsx
│   └── substitutions.tsx
│
├── assignments/
│   ├── index.tsx
│   ├── [assignmentId].tsx
│   ├── submit.tsx
│   └── calendar.tsx
│
├── materials/
│   ├── index.tsx
│   ├── [courseId].tsx
│   ├── downloads.tsx
│   └── search.tsx
│
├── marks/
│   ├── index.tsx
│   ├── [courseId].tsx
│   └── history.tsx
│
├── exams/
│   ├── index.tsx
│   ├── timetable.tsx
│   ├── hallticket.tsx
│   ├── results.tsx
│   ├── upload-external.tsx
│   └── gpa.tsx
│
├── library/
│   ├── index.tsx
│   ├── search.tsx
│   ├── borrowed.tsx
│   ├── fines.tsx
│   └── request.tsx
│
├── canteen/
│   ├── index.tsx
│   ├── order.tsx
│   ├── token-status.tsx
│   └── my-orders.tsx
│
├── bus/
│   ├── index.tsx
│   ├── select.tsx
│   ├── route.tsx
│   └── alerts.tsx
│
├── notices/
│   ├── index.tsx
│   ├── [noticeId].tsx
│   └── notifications.tsx
│
├── events/
│   ├── index.tsx
│   ├── [eventId].tsx
│   └── certificates.tsx
│
├── feedback/
│   ├── index.tsx
│   ├── teacher.tsx
│   ├── college.tsx
│   └── complaints.tsx
│
├── fees/
│   ├── index.tsx
│   ├── receipts.tsx
│   ├── dues.tsx
│   └── pay.tsx
│
├── honors/
│   ├── index.tsx
│   ├── minor.tsx
│   └── courses.tsx
│
├── settings/
│   ├── index.tsx
│   ├── notifications.tsx
│   └── about.tsx
│
└── support/
    ├── index.tsx
    ├── contacts.tsx
    ├── faq.tsx
    └── chat.tsx
```

---

## 5) Student Module — Full Feature List + Function List (2025)

Below is the “complete blueprint” of the Student module. This is a product-level spec; code implementation can be staged.

### 0. Authentication & Profile (Email login)

**Features**
- Create account (email + password)
- Optional email verification
- Login/logout
- Forgot password (email reset link)
- Profile view/edit
- Upload profile photo
- Auto-sync: course, year, department, section/division, university reg no (if stored)
- Update phone/email
- Secure session management

**Functions**
- `createAccount`
- `login`
- `logout`
- `refreshSession`
- `sendPasswordReset`
- `resetPassword`
- `getStudentProfile`
- `updateStudentProfile`
- `uploadProfilePhoto`
- `syncCourseAndDepartment`

### 1. Dashboard (Home overview)

**Features**
- Today’s timetable
- Overall attendance %
- Upcoming assignments
- Internal marks snapshot
- Canteen menu preview
- Bus arrival preview
- Library quick view
- Notifications hub
- Quick links to library/bus/canteen/assignments/exams

**Functions**
- `loadDashboardData`
- `loadTodayTimetable`
- `loadQuickAttendance`
- `loadUpcomingAssignments`
- `loadInternalMarksPreview`
- `loadCanteenPreview`
- `loadBusArrivalPreview`
- `loadLibraryQuickView`
- `loadNotificationsPanel`

### 2. Attendance

**Features**
- Subject-wise attendance %
- Daily timeline
- Monthly calendar
- Shortage alerts (below threshold)
- Attendance rules (80% minimum)
- Teacher remarks (optional)

**Functions**
- `getAttendanceSummary`
- `getAttendanceBySubject`
- `getAttendanceCalendar`
- `getAttendanceDailyTimeline`
- `getShortageAlerts`

### 3. Timetable

**Features**
- Day-wise timetable
- Weekly timetable
- Classroom info
- Teacher info
- Substitution alerts

**Functions**
- `getDayTimetable`
- `getWeeklyTimetable`
- `getSubstitutionAlerts`
- `getClassroomInfo`
- `getTeacherInfo`

### 4. Assignments

**Features**
- Subject-wise assignment list
- Filters: pending/submitted/graded
- Due date calendar
- Upload submission (PDF/photo)
- View submission status
- Teacher feedback + marks

**Functions**
- `getAssignments`
- `getAssignmentDetails`
- `uploadAssignmentSubmission`
- `getSubmissionHistory`
- `getAssignmentFeedback`

### 5. Academic Materials

**Features**
- Notes/PDF/PPT/links uploaded by teachers
- Subject-wise library
- File download
- Offline access
- Search within materials

**Functions**
- `getSubjects`
- `getMaterialsBySubject`
- `searchMaterials`
- `downloadMaterial`

### 6. Internal Marks

**Features**
- CAT/Series marks
- Assignment marks
- Attendance marks
- Final internal calculation
- Semester-wise breakdown
- Graphs

**Functions**
- `getInternalMarks`
- `getInternalBreakdown`
- `getAssignmentMarks`
- `getAttendanceMarks`
- `getFinalInternalScore`
- `getSemesterInternalSummary`

### 7. External Marks (Student uploads, exam cell verifies)

Updated rule:
- Admin no longer uploads university results.
- **Student uploads their mark sheet → Exam Cell verifies.**

**Features**
- Upload external result PDF/image
- Track approval status
- View verified external marks
- Download approved result file

**Functions**
- `uploadExternalResult`
- `getExternalResultStatus`
- `getVerifiedExternalResults`
- `downloadExternalResultFile`

### 8. Exam module (timetable + results)

**Features**
- Exam timetable (internal/model/university)
- Hall ticket download
- Internal results
- Verified external results
- Pass/fail indicators
- SGPA/CGPA calculation
- Previous semester archive

**Functions**
- `getExamTimetable`
- `downloadHallTicket`
- `getInternalExamResults`
- `getModelExamResults`
- `getFullExamHistory`

### 9. Library module

**Features**
- Search books
- Borrowed books
- Due dates
- Renew
- Manual fine details display
- Book request
- Reservation queue
- Notifications: due soon/overdue/reserved available

Removed / constraints:
- No QR
- No auto-fine system

**Functions**
- `searchBooks`
- `getBorrowedBooks`
- `renewBook`
- `getBookDueDates`
- `getFineDetails`
- `requestBook`
- `reserveBook`
- `getReservationStatus`

### 10. Canteen module

**Features**
- Daily menu
- Pre-order token system
- Token history
- Payment history (if integrated)
- Item availability (sold out)
- Pickup time indicators

**Functions**
- `getDailyMenu`
- `getAvailabilityStatus`
- `createFoodToken`
- `getTokenHistory`
- `getCanteenPayments`
- `getCanteenNotifications`

### 11. Bus module

**Features**
- Bus selection (one-time; bus admin approves)
- Route overview
- Bus arrival time
- Payment alerts
- Holiday alerts

Removed:
- Driver info
- Conductor info
- Pickup/Drop listing

**Functions**
- `applyBusSelection`
- `getBusSelectionStatus`
- `getBusRoute`
- `getBusArrivalTime`
- `getBusPaymentAlerts`
- `getBusHolidayAlerts`
- `getBusPaymentHistory`

### 12. Notices & Announcements

**Features**
- College notices
- Department notices
- Exam notices
- Event notices
- Holiday updates
- Push notifications (requires infra)

**Functions**
- `getCollegeNotices`
- `getDepartmentNotices`
- `getExamNotices`
- `getEventNotices`
- `markNoticeRead`

### 13. Events & Activities (external registration only)

Internal rules:
- No in-app registration
- External link only
- No QR attendance
- Optional certificate download

**Features**
- Upcoming events
- Event details
- External registration link
- Optional certificate download (if uploaded)
- Event calendar

**Functions**
- `getUpcomingEvents`
- `getEventDetails`
- `openEventRegistrationLink`
- `downloadEventCertificate`

### 14. Feedback & Complaints

**Features**
- Teacher feedback
- College feedback
- Complaint ticketing
- Attachments
- Track status

**Functions**
- `submitTeacherFeedback`
- `submitCollegeFeedback`
- `createComplaint`
- `getComplaintStatus`
- `addComplaintAttachment`

### 15. Fee module

**Features**
- Fee structure
- Payment status
- Paid receipts (PDF)
- Payment history
- Online payment (optional)

**Functions**
- `getFeeStructure`
- `getFeeStatus`
- `getFeeReceipt`
- `payFeeOnline`
- `getFeeHistory`

### 16. Honors / Major–Minor

Removed:
- Credit tracking

**Features**
- View major
- List available minors
- Submit minor choice
- Track approval status

**Functions**
- `getMajorDetails`
- `getAvailableMinors`
- `submitMinorSelection`
- `getMinorSelectionStatus`

### 17. Settings

**Features**
- Dark/light mode
- Notification settings
- Update email/phone
- About/app version
- Clear cache
- Logout

**Functions**
- `toggleDarkMode`
- `updateNotificationPreferences`
- `updateEmailSettings`
- `updateAppInfo`

### 18. Support

**Features**
- Contact admin
- Optional helpdesk/chat
- FAQ
- Support ticket

**Functions**
- `getSupportContacts`
- `getHelpdeskOptions`
- `sendSupportRequest`
- `getFAQs`

---

## 6) Suggested Build Order (Practical)

This sequence matches your current repo (Teacher/Admin already active) and avoids big-infra items until later:

P0 (Core student academic)
1) Replace placeholder `/(student)/dashboard` with real widgets.
2) Split existing flat screens into folder structure (`attendance/`, `materials/`, `marks/`).
3) Implement external marks upload screen + storage upload + status tracking.
4) Add assignments list + submit flow (depends on teacher assignments).
5) Add student timetable screens (today + weekly).

P1 (Communications)
6) Notices list/detail + read tracking.
7) Events list/detail + external link + certificates.

P2 (Utilities)
8) Library, bus, canteen, fees.

P3 (Optional infra)
9) Push notifications.
10) Offline-first downloads + sync.

---

## 7) Key Implementation Notes (So dev doesn’t break rules)

- Use `getStudentByUserId(user.id)` as the canonical “link check” (already used in current screens).
- Ensure Student RLS rules are strict: student can only `SELECT` own records by `student_id` / `user_id` joins.
- External marks upload must write to `external_marks` with `upload_status = 'pending'` and store file URL.
- Event registration: only `Linking.openURL(registration_url)`; do not implement in-app registration.

---

## Appendix: Where current student code lives
- Existing student screens are currently flat under `app/(student)/*.tsx`.
- Existing student helpers already exist in `lib/database.ts` (student fetch + attendance summary).

---

## FINAL CLEAN SUMMARY (Student Module 2025)

### Student Module Includes
- Auth
- Profile
- Dashboard
- Attendance
- Timetable
- Assignments
- Materials
- Internal Marks
- External Marks Upload
- Exams
- Library
- Canteen
- Bus
- Notices
- Events (external registration)
- Feedback
- Fees
- Honors
- Settings
- Support

### Total Functions
- 92+ functions

### Fully aligned with
- Admin Module
- Teacher Module
- Updated hierarchy & rules

