# Documentation Status + System Flow

**Generated:** 2025-12-20

This file does two things:
1) Shows **documentation status** as one consolidated table (accurate vs outdated vs missing).
2) Shows an **end-to-end system flow diagram** for the entire app.

---

## 1) Documentation status (single table)

Legend:
- **Accurate** = doc matches what exists in repo now
- **Outdated** = doc exists but needs updates to reflect current implementation
- **Missing** = implementation exists, but there is no dedicated documentation file yet
- **Needs decision** = doc/code conflict requires choosing a single source of truth first

| Item | Type | Status | Implemented? | Evidence (repo) | What to do next |
|---|---|---|---|---|---|
| [BACKEND_TEST_REPORT.md](BACKEND_TEST_REPORT.md) | Doc | Accurate | ✅ Yes | Admin module screens exist under [app/(admin)](app/(admin)) (Exams/Fees/Library/Assignments) | Keep; optionally add “last verified on” date |
| [DATABASE_FIXES_COMPLETE.md](DATABASE_FIXES_COMPLETE.md) | Doc | Accurate | ✅ Yes | Migration present: [supabase/migrations/20251217000001_fix_missing_tables.sql](supabase/migrations/20251217000001_fix_missing_tables.sql) | Keep |
| [CODE_VERIFICATION_REPORT.md](CODE_VERIFICATION_REPORT.md) | Doc | Accurate | ✅ Yes | Verified screens exist (analytics/bus/library/batches) | Keep |
| [RBAC_IMPLEMENTATION.md](RBAC_IMPLEMENTATION.md) | Doc | Accurate | ✅ Yes | [lib/rbac.ts](lib/rbac.ts), [hooks/useRBAC.ts](hooks/useRBAC.ts), [components/Restricted.tsx](components/Restricted.tsx), RBAC migrations | Keep |
| [DELETE_FIX_SUMMARY.md](DELETE_FIX_SUMMARY.md) | Doc | Accurate | ✅ Yes | Academic screens exist (departments/courses) | Keep |
| [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) | Doc | Accurate | ✅ Yes | [scripts/create-verified-admin-users.sql](scripts/create-verified-admin-users.sql) | Keep |
| [ADMIN_CREDENTIALS.md](ADMIN_CREDENTIALS.md) | Doc | Accurate | ✅ Yes | Matches verified-admin SQL script | Keep |
| [COLLEGE_INFO_PAGE_COMPLETE.md](COLLEGE_INFO_PAGE_COMPLETE.md) | Doc | Accurate | ✅ Yes | Screen: [app/(admin)/college-info.tsx](app/(admin)/college-info.tsx); migration: [supabase/migrations/20251218000002_recreate_college_info.sql](supabase/migrations/20251218000002_recreate_college_info.sql) | Keep; ensure DB migration applied in target env |
| [NAVBAR_FIX_SUMMARY.md](NAVBAR_FIX_SUMMARY.md) | Doc | Outdated | ✅ Yes | Student/Teacher layouts exist, but teacher attendance is now substantial ([app/(teacher)/attendance/mark.tsx](app/(teacher)/attendance/mark.tsx)) while student attendance is placeholder ([app/(student)/attendance.tsx](app/(student)/attendance.tsx)) | Update summary: separate ✅ implemented vs 🟡 placeholder |
| [PROJECT_PLAN.md](PROJECT_PLAN.md) | Doc | Outdated | ✅ Partially | Many items marked ❌ TODO in plan, but files exist in repo (admin + teacher + some student) | Refresh “Current Status” + file summary to match reality |
| [REALTIME_ANALYTICS_BACKUP_FEATURES.md](REALTIME_ANALYTICS_BACKUP_FEATURES.md) | Doc | Outdated | ✅ Yes | Backup UI exists: [app/(admin)/settings/backup-restore.tsx](app/(admin)/settings/backup-restore.tsx). Scheduling is placeholder: [lib/backup.ts](lib/backup.ts) `scheduleBackup()` | Update backup coverage list + clearly mark scheduling as TODO |
| [TEST_RESULTS_SUMMARY.md](TEST_RESULTS_SUMMARY.md) | Doc | Accurate | ✅ Yes | Canonical library table is `books` (not `library_books`); code/scripts/docs now aligned | Keep |
| [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md) | Doc | Outdated | ✅ Partially | Mentions `programs` / `library_books`, but degree programs are now inside `courses` (see migrations + [COURSES_UPDATE_SUMMARY.md](COURSES_UPDATE_SUMMARY.md)) | Update “Core Tables” list + ERD + mapping |
| [ACCOUNT_SETUP_PLAN.md](ACCOUNT_SETUP_PLAN.md) | Doc | Outdated (legacy) | ✅ Yes | Newer flow exists via verified-admin SQL + setup instructions | Mark as legacy; link to [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) |
| [RBAC_PROTECTION_COMPLETE.md](RBAC_PROTECTION_COMPLETE.md) | Doc | Outdated (date) | ✅ Yes | RBAC protection exists; “completed” date looks stale | Update date + add “validated on 2025-12-xx” |
| Teacher module status doc | Missing doc | Missing | ✅ Yes | Teacher routes exist: [app/(teacher)](app/(teacher)) | Create `TEACHER_MODULE_STATUS.md` |
| Student module status doc | Missing doc | Missing | ✅ Yes | Student routes exist: [app/(student)](app/(student)) | Create `STUDENT_MODULE_STATUS.md` |
| Audit logging setup doc | Missing doc | Missing | ✅ Yes | UI exists: [app/(admin)/audit/logs.tsx](app/(admin)/audit/logs.tsx); DB table exists in migrations | Create `AUDIT_LOGGING_SETUP.md` |
| Canteen module doc | Missing doc | Missing | ✅ Yes | Admin canteen screens exist: [app/(admin)/canteen/index.tsx](app/(admin)/canteen/index.tsx); canteen tables exist in migrations | Create `CANTEEN_MODULE_NOTES.md` |
| Bus module doc | Missing doc | Missing | ✅ Yes | Admin bus screens exist: [app/(admin)/bus/index.tsx](app/(admin)/bus/index.tsx) | Create `BUS_MODULE_NOTES.md` |

---

## 2) Entire system flow diagram (end-to-end)

```mermaid
flowchart TB
	%% Users
	U[User] -->|Login| APP[Expo Router App\nReact Native + TypeScript]

	%% Auth
	APP --> AUTH[Supabase Auth\nauth.users]
	AUTH -->|Session/JWT| APP

	%% Profile + RBAC
	APP --> PROF[public.profiles\n(user details + status)]
	APP --> RBAC[RBAC Layer\nlib/rbac.ts + hooks/useRBAC.ts]
	RBAC --> ROLES[roles + user_roles\npermissions JSON]
	RBAC -->|Restricted component| UIACL[UI Access Control\ncomponents/Restricted.tsx]

	%% Navigation by role
	UIACL --> ADMIN[Admin Routes\napp/(admin)]
	UIACL --> TEACH[Teacher Routes\napp/(teacher)]
	UIACL --> STUD[Student Routes\napp/(student)]

	%% Core DB access
	ADMIN --> DB[Supabase Postgres\n(public schema + RLS)]
	TEACH --> DB
	STUD --> DB

	%% Major modules (DB)
	DB --> ACADEMICS[Academic Tables\ndepartments/courses/years/semesters/batches]
	DB --> ATT[Attendance Tables\nattendance + attendance_records + logs]
	DB --> TT[Timetable Tables\ntimetable_entries]
	DB --> EXAMS[Exams Tables\nexams/exam_schedules/exam_marks]
	DB --> FEES[Fees Tables\nfee_structures/student_fees/fee_payments]
	DB --> LIB[Library Tables\nbooks/book_issues/book_reservations]
	DB --> BUS[Bus Tables\nbus_routes/bus_stops/bus_subscriptions]
	DB --> CANT[Canteen Tables\ncanteen_menu_items/canteen_daily_menu/canteen_tokens]
	DB --> NOTICES[Notices\nnotices]
	DB --> AUDIT[Audit\naudit_logs]

	%% Realtime
	DB --> RT[Supabase Realtime\npostgres_changes channels]
	RT -->|Live updates| ADMIN

	%% Backup/Restore
	ADMIN --> BACKUP[Backup/Restore UI\napp/(admin)/settings/backup-restore.tsx]
	BACKUP --> BKLIB[Backup Library\nlib/backup.ts]
	BKLIB -->|Export/Import| FS[Device File System\nexpo-file-system + sharing + document-picker]
	BKLIB -->|Read/Write tables| DB

	%% Optional GraphQL layer
	DB -. optional .-> HASURA[Hasura GraphQL Layer\nmetadata + migrations]
	APP -. optional .-> HASURA
```

**Notes**
- RLS is the server-side security boundary; `Restricted` is UI gating.
- Some student screens are still placeholders, but teacher attendance has a real implementation.
- Backup scheduling is currently a placeholder (`scheduleBackup()` shows an alert).
```
