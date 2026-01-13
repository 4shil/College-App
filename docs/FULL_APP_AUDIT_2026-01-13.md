# College App — Full Application Audit

**Date:** 2026-01-13  
**Auditor:** GitHub Copilot (Claude Opus 4.5)  
**Version:** 1.0.0

---

## Executive Summary

This document provides a **comprehensive audit** of the College App, covering:

1. **Frontend architecture** — Expo Router navigation, module layouts, and screen inventory
2. **Backend architecture** — Supabase integration, database schema, RLS policies, and helper functions
3. **Feature-by-feature breakdown** — Each module's UI, data dependencies, and implementation status
4. **Cross-cutting concerns** — Authentication, RBAC, theming, storage, exports, and backups

The app is built on **Expo SDK 53** with **React 19**, using **Supabase** as the backend-as-a-service (BaaS) for authentication, database, real-time subscriptions, and storage.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Structure Overview](#2-project-structure-overview)
3. [Authentication System](#3-authentication-system)
4. [Role-Based Access Control (RBAC)](#4-role-based-access-control-rbac)
5. [Admin Module](#5-admin-module)
6. [Teacher Module](#6-teacher-module)
7. [Student Module](#7-student-module)
8. [Shared Libraries & Hooks](#8-shared-libraries--hooks)
9. [Database Schema](#9-database-schema)
10. [Supabase Migrations Inventory](#10-supabase-migrations-inventory)
11. [UI Components Library](#11-ui-components-library)
12. [State Management](#12-state-management)
13. [Theming System](#13-theming-system)
14. [Storage & File Uploads](#14-storage--file-uploads)
15. [Export & Backup System](#15-export--backup-system)
16. [Security Considerations](#16-security-considerations)
17. [Implementation Status Summary](#17-implementation-status-summary)

---

## 1. Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Expo | ~53.0.0 | Cross-platform React Native framework |
| React | 19.0.0 | UI library |
| React Native | 0.79.6 | Mobile runtime |
| Expo Router | ~5.1.8 | File-based routing |
| React Native Reanimated | ~3.17.4 | Animations |
| Expo Blur | ~14.1.5 | Glass-morphism effects |
| Expo Linear Gradient | ~14.1.5 | Gradient backgrounds |
| TypeScript | ~5.9.2 | Type safety |
| TailwindCSS | ^3.4.18 | Utility styling reference |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase JS | ^2.39.0 | Database, Auth, Storage, Realtime |
| PostgreSQL | (Supabase managed) | Relational database |
| Row Level Security | Native | Per-row access control |

### Additional Libraries

| Library | Purpose |
|---------|---------|
| @react-native-async-storage/async-storage | Session persistence |
| @react-native-community/datetimepicker | Date/time inputs |
| @react-native-picker/picker | Dropdown selectors |
| expo-document-picker | File selection |
| expo-file-system | Local file operations |
| expo-sharing | Share files/content |
| three / @react-three/fiber | 3D graphics (loader animation) |

---

## 2. Project Structure Overview

```
college-app/
├── app/                         # Expo Router screens
│   ├── _layout.tsx              # Root layout (theme, splash, navigation)
│   ├── index.tsx                # Entry point (auth check → redirect)
│   ├── (auth)/                  # Authentication screens
│   ├── (admin)/                 # Admin module screens
│   ├── (teacher)/               # Teacher module screens
│   └── (student)/               # Student module screens
├── components/                  # Shared UI components
│   ├── Restricted.tsx           # Role-based access wrapper
│   └── ui/                      # Reusable UI kit
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts               # Authentication hook
│   ├── useRBAC.ts               # RBAC permissions hook
│   ├── useStudentDashboard.ts   # Student dashboard data
│   └── useTeacherDashboardSummary.ts
├── lib/                         # Core libraries
│   ├── supabase.ts              # Supabase client + auth helpers
│   ├── database.ts              # Database query functions
│   ├── rbac.ts                  # RBAC constants & utilities
│   ├── storage.ts               # File upload utilities
│   ├── export.ts                # CSV/report export
│   ├── backup.ts                # Database backup/restore
│   ├── teacherModules.ts        # Teacher navigation config
│   ├── themedAlert.ts           # Themed alert dialogs
│   └── polyfills.ts             # Platform polyfills
├── store/                       # Zustand state stores
│   ├── authStore.ts             # Authentication state
│   ├── themeStore.ts            # Theme/appearance state
│   ├── appSettingsStore.ts      # App settings
│   └── createStore.ts           # Store factory
├── theme/                       # Theme utilities
├── themes/                      # Theme presets
├── types/                       # TypeScript type definitions
│   └── database.ts              # Database types
├── database/                    # Local schema reference
│   └── schema.sql               # Full SQL schema (617 lines)
└── supabase/
    └── migrations/              # 54 migration files
```

---

## 3. Authentication System

### 3.1 Auth Flow Overview

**Entry Point:** [app/index.tsx](../app/index.tsx)

```
User opens app
    │
    ▼
Check Supabase session (getSession)
    │
    ├── No session → Redirect to /(auth)/login
    │
    └── Has session → Fetch AuthUser (getAuthUser)
                │
                ├── isTeacher || roles.includes('hod') → /(teacher)/dashboard
                ├── isAdmin → /(admin)/dashboard
                └── isStudent → /(student)/dashboard
```

### 3.2 Auth Screens

| Screen | Path | Features | Backend Connection |
|--------|------|----------|-------------------|
| Login | `(auth)/login.tsx` | Email/password sign-in | `supabase.auth.signInWithPassword` |
| Register | `(auth)/register.tsx` | Email/password sign-up with metadata | `supabase.auth.signUp` |
| Forgot Password | `(auth)/forgot-password.tsx` | Password reset email | `supabase.auth.resetPasswordForEmail` |
| Verify OTP | `(auth)/verify-otp.tsx` | OTP verification flow | `supabase.auth.verifyOtp` |

### 3.3 Supabase Auth Helpers

**File:** [lib/supabase.ts](../lib/supabase.ts)

| Function | Purpose |
|----------|---------|
| `signInWithEmail(email, password)` | Sign in with credentials |
| `signUpWithEmail(email, password, metadata)` | Create new account |
| `signOut()` | Sign out user |
| `resetPassword(email)` | Send password reset email |
| `getCurrentUser()` | Get current auth user |
| `getSession()` | Get current session |
| `sendOTP(email)` | Send OTP to email |
| `verifyOTP(email, token)` | Verify OTP code |
| `updateUserPassword(password)` | Update password |
| `changePassword(current, new)` | Change password with verification |
| `updateUserMetadata(metadata)` | Update user metadata |

### 3.4 Auth Store

**File:** [store/authStore.ts](../store/authStore.ts)

Manages:
- `user` — Supabase auth user object
- `session` — Current session
- `profile` — User profile from `profiles` table
- `roles` — Array of role names
- `primaryRole` — Primary role for quick access
- `isAuthenticated`, `isLoading` — UI states

---

## 4. Role-Based Access Control (RBAC)

### 4.1 Role Hierarchy

**File:** [lib/rbac.ts](../lib/rbac.ts)

#### Admin Roles (9 types)

| Role | Display Name | Key Permissions |
|------|--------------|-----------------|
| `super_admin` | Super Admin | Full system access, GOD mode |
| `principal` | Principal | View all users, final approvals, global notices |
| `department_admin` | Department Admin | Department-scoped user management |
| `hod` | Head of Department | Department management, L1 approvals |
| `exam_cell_admin` | Exam Cell Admin | Schedule exams, verify marks, publish results |
| `library_admin` | Library Admin | Manage books, issues, returns |
| `bus_admin` | Bus Admin | Manage routes, vehicles, tracking |
| `canteen_admin` | Canteen Admin | Manage menu, tokens, refunds |
| `finance_admin` | Finance Admin | Manage fees, payments, reports |
| `reception_admin` | Reception Admin | Gate passes, late passes, logs |

#### Teacher Roles (4 types)

| Role | Display Name | Unlocked Modules |
|------|--------------|------------------|
| `subject_teacher` | Subject Teacher | Base teaching modules |
| `class_teacher` | Class Teacher | + Class Tools, leave approvals |
| `mentor` | Mentor | + Mentor dashboard |
| `coordinator` | Coordinator | + Coordinator dashboard |

#### Student Role

| Role | Description |
|------|-------------|
| `student` | Regular student with view-only access to own data |

### 4.2 Permission System

**Total Permissions Defined:** 40+

Key permission categories:
- System Administration (`full_system_access`, `create_delete_admins`, `manage_global_settings`)
- User Management (`view_all_users`, `view_dept_users`, `block_unblock_users`)
- Academic (`manage_academic_structure`, `manage_timetable`, `manage_courses`)
- Exams (`schedule_exams`, `verify_marks`, `publish_results`)
- Approvals (`approve_planner_level_1`, `approve_planner_final`, `approve_diary_level_1`, `approve_diary_final`)
- Library, Bus, Canteen, Finance, Notices, Events, Attendance

### 4.3 Module Access Control

| Module | Accessible By |
|--------|---------------|
| `dashboard` | All admin roles |
| `users` | super_admin, principal, department_admin |
| `academic` | super_admin |
| `exams` | super_admin, exam_cell_admin |
| `assignments` | super_admin, hod, exam_cell_admin |
| `library` | super_admin, library_admin |
| `fees` | super_admin, finance_admin |
| `bus` | super_admin, bus_admin |
| `canteen` | super_admin, canteen_admin |
| `notices` | super_admin, principal, department_admin, hod |
| `events` | super_admin |
| `planner-diary` | super_admin, principal, department_admin, hod |
| `reception` | super_admin, reception_admin |
| `settings` | super_admin |
| `attendance` | super_admin, hod |
| `analytics` | super_admin, principal, hod |

### 4.4 RBAC Hook

**File:** [hooks/useRBAC.ts](../hooks/useRBAC.ts)

Returns:
- `userRoles`, `highestRole`, `roleDisplayName`
- `isAdmin`, `isSuperAdmin`
- `permissions`, `hasPermission(permission)`
- `accessibleModules`, `canAccessModule(moduleName)`
- `canManageUsers(scope)`, `canApprove(type, level)`
- `loading`, `refreshRoles()`

Features real-time subscription to `user_roles` table for instant permission updates.

### 4.5 Restricted Component

**File:** [components/Restricted.tsx](../components/Restricted.tsx)

Wrapper component that:
- Checks if user has required role/permission
- Shows fallback content if not authorized
- Supports both role-based and permission-based checks

---

## 5. Admin Module

### 5.1 Navigation Structure

**Layout:** [app/(admin)/_layout.tsx](../app/(admin)/_layout.tsx)

Glass-morphic floating dock navigation with 5 main items:
1. Dashboard
2. Analytics
3. Users
4. Role Dashboard (modules hub)
5. Settings

### 5.2 Screen Inventory (97 screens/routes)

#### Core Screens

| Screen | Path | Features | Backend Tables |
|--------|------|----------|----------------|
| Dashboard | `dashboard.tsx` | Overview stats, quick actions | Multiple aggregations |
| Role Dashboard | `role-dashboard.tsx` | Module grid based on permissions | RBAC check |
| College Info | `college-info.tsx` | Edit college details | `college_info` |
| Change Password | `change-password.tsx` | Password change form | `supabase.auth` |
| Notices | `notices.tsx` | Create/manage notices | `notices` |
| Events | `events.tsx` | Event listing | `events` |
| Events Create | `events-create.tsx` | Create event | `events` |
| Events Edit | `events-edit.tsx` | Edit event | `events` |
| Attendance Alerts | `attendance-alerts.tsx` | Shortage alerts | `attendance_alerts` |

#### Users Module (`users/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | User list with search/filter | `profiles`, `user_roles` |
| `pending.tsx` | Pending registrations | `profiles.status='pending'` |
| `assign-roles.tsx` | Role assignment UI | `user_roles`, `roles` |
| `students/index.tsx` | Student list | `students`, `profiles` |
| `students/[id].tsx` | Student detail | `students`, `profiles` |
| `students/create.tsx` | Create student | `students`, `profiles` |
| `teachers/index.tsx` | Teacher list | `teachers`, `profiles` |
| `teachers/[id].tsx` | Teacher detail | `teachers`, `profiles` |
| `teachers/create.tsx` | Create teacher | `teachers`, `profiles` |

#### Academic Module (`academic/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Academic structure overview | Multiple |
| `departments/index.tsx` | Department management | `departments` |
| `courses/index.tsx` | Course/subject management | `courses` |
| `subjects/index.tsx` | Subject catalog | `courses` |
| `years/index.tsx` | Year levels | `years` |
| `semesters/index.tsx` | Semester management | `semesters` |
| `batches/index.tsx` | Batch management | `sections` |

#### Timetable Module (`timetable/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Timetable viewer | `timetable_entries` |
| `create.tsx` | Create entries | `timetable_entries` |
| `substitutions.tsx` | Manage substitutions | `substitutions` |
| `reports.tsx` | Timetable reports | Aggregations |

#### Attendance Module (`attendance/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Attendance overview | `attendance`, `attendance_records` |
| `mark.tsx` | Mark attendance | `attendance`, `attendance_records` |
| `logs.tsx` | Attendance logs | `attendance` |
| `reports.tsx` | Attendance reports | Aggregations |
| `holidays.tsx` | Manage holidays | `holidays` |

#### Exams Module (`exams/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Exam overview | `exams` |
| `manage.tsx` | Create/edit exams | `exams`, `exam_schedules` |
| `marks.tsx` | Internal marks entry | `exam_marks` |
| `external.tsx` | External marks verification | `external_marks` |
| `reports.tsx` | Exam reports | Aggregations |

#### Assignments Module (`assignments/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Assignment overview | `assignments` |
| `manage.tsx` | Create/edit assignments | `assignments` |
| `submissions.tsx` | View submissions | `assignment_submissions` |
| `grade.tsx` | Grade submissions | `assignment_submissions` |
| `reports.tsx` | Assignment reports | Aggregations |

#### Library Module (`library/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Library overview | `books`, `book_issues` |
| `books.tsx` | Book catalog | `books` |
| `issue.tsx` | Issue books | `book_issues` |
| `return.tsx` | Return books | `book_issues` |
| `overdue.tsx` | Overdue list | `book_issues` |
| `reservations.tsx` | Book reservations | `book_reservations` |
| `reports.tsx` | Library reports | Aggregations |

#### Fees Module (`fees/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Fees overview | `fee_structures`, `student_fees` |
| `structures.tsx` | Fee structures | `fee_structures` |
| `students.tsx` | Student fee status | `student_fees` |
| `payment.tsx` | Record payments | `fee_payments` |
| `defaulters.tsx` | Defaulter list | `student_fees` |
| `reports.tsx` | Financial reports | Aggregations |

#### Bus Module (`bus/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Bus overview | `bus_routes`, `bus_vehicles` |
| `routes.tsx` | Route management | `bus_routes`, `bus_stops` |
| `vehicles.tsx` | Vehicle management | `bus_vehicles` |
| `approvals.tsx` | Subscription approvals | `bus_subscriptions` |
| `alerts.tsx` | Bus alerts | `bus_alerts` |
| `reports.tsx` | Transport reports | Aggregations |

#### Canteen Module (`canteen/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Canteen overview | `canteen_menu_items` |
| `menu.tsx` | Menu management | `canteen_menu_items`, `canteen_daily_menu` |
| `tokens.tsx` | Token management | `canteen_tokens` |
| `ready.tsx` | Ready orders | `canteen_tokens` |
| `refunds.tsx` | Process refunds | `canteen_tokens` |
| `reports.tsx` | Canteen reports | Aggregations |

#### Planner & Diary Module (`planner-diary/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Overview | `lesson_planners`, `work_diary_entries` |
| `planners.tsx` | Planner list | `lesson_planners` |
| `diaries.tsx` | Diary list | `work_diary_entries` |
| `approvals.tsx` | Approve planners/diaries | Status updates |

#### Reception Module (`reception/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Reception overview | Multiple |
| `gate-pass.tsx` | Gate pass management | `gate_passes` |
| `issue-late-pass.tsx` | Issue late passes | `late_passes` |
| `todays-logs.tsx` | Today's logs | `gate_passes`, `late_passes` |
| `notices.tsx` | Reception notices | `notices` |

#### Analytics Module (`analytics/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Analytics dashboard | Multiple aggregations |

#### Settings Module (`settings/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Settings overview | App settings |
| `appearance.tsx` | Theme settings | Local store |
| `academic-year.tsx` | Academic year config | `academic_years` |

#### Audit Module (`audit/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `logs.tsx` | Audit logs | `audit_logs` |

---

## 6. Teacher Module

### 6.1 Navigation Structure

**Layout:** [app/(teacher)/_layout.tsx](../app/(teacher)/_layout.tsx)

Dynamic dock navigation based on teacher roles. Uses [lib/teacherModules.ts](../lib/teacherModules.ts) for configuration.

### 6.2 Teacher Module Access Rules

**File:** [lib/teacherModules.ts](../lib/teacherModules.ts)

| Module | Required Roles | Notes |
|--------|----------------|-------|
| Dashboard | Any teacher role | Base module |
| Profile | Any | Always accessible |
| Settings | Any | Always accessible |
| Timetable | Any teacher role | View assigned classes |
| Attendance | Any teacher role | Mark attendance |
| Results | Any teacher role | Enter internal marks |
| Materials | Any teacher role | Upload teaching materials |
| Assignments | Any teacher role | Create/grade assignments |
| Notices | Any teacher role | Post class notices |
| Planner | Any teacher role | Lesson planning |
| Diary | Any teacher role | Work diary |
| Class Tools | class_teacher, hod | Leave approvals, class reports |
| Mentor | mentor, hod | Mentee management |
| Coordinator | coordinator, hod | Activity coordination |
| Department | hod only | Department management |

### 6.3 Screen Inventory (38 screens)

#### Core Screens

| Screen | Path | Features | Backend Tables |
|--------|------|----------|----------------|
| Dashboard | `dashboard.tsx` | Today's classes, quick stats | `timetable_entries`, aggregations |
| Profile | `profile.tsx` | View/edit profile | `profiles`, `teachers` |
| Modules | `modules.tsx` | Module grid | RBAC-filtered |
| Change Password | `change-password.tsx` | Password change | `supabase.auth` |

#### Attendance Module (`attendance/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Attendance overview | `attendance`, `attendance_records` |
| `mark.tsx` | Mark attendance | `attendance`, `attendance_records` |
| `history.tsx` | Attendance history | `attendance` |

#### Timetable Module (`timetable/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Personal timetable | `timetable_entries`, `teacher_courses` |

#### Session Module (`session/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `[entryId].tsx` | Class session details | `timetable_entries` |

#### Results Module (`results/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Marks overview | `exam_marks` |
| `mark.tsx` | Enter marks | `exam_marks` |

#### Materials Module (`materials/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Materials list | `teaching_materials` |
| `create.tsx` | Upload material | `teaching_materials` + Storage |

#### Assignments Module (`assignments/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Assignment list | `assignments` |
| `create.tsx` | Create assignment | `assignments` |
| `submissions.tsx` | View/grade submissions | `assignment_submissions` |

#### Notices Module (`notices/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Notice list | `notices` |
| `create.tsx` | Create notice | `notices` |

#### Planner Module (`planner/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Planner list | `lesson_planners` |
| `create.tsx` | Create planner | `lesson_planners` |
| `edit/[id].tsx` | Edit planner | `lesson_planners` |

#### Diary Module (`diary/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Diary entries | `work_diary_entries` |
| `create.tsx` | Create entry | `work_diary_entries` |
| `edit/[id].tsx` | Edit entry | `work_diary_entries` |

#### Class Tools Module (`class-tools/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Class tools overview | Section-filtered |
| `leaves/index.tsx` | Leave applications | `student_leave_applications` |
| `leaves/[id].tsx` | Leave detail | `student_leave_applications` |

#### Mentor Module (`mentor/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Mentee list | `mentor_assignments`, `students` |

#### Coordinator Module (`coordinator/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Coordination overview | Role-specific |

#### Department Module (`department/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Department overview | `departments`, `teachers` |

#### Principal Module (`principal/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Principal dashboard | College-wide stats |

#### Settings Module (`settings/`)

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `index.tsx` | Settings overview | Local store |
| `appearance.tsx` | Theme settings | Local store |

---

## 7. Student Module

### 7.1 Navigation Structure

**Layout:** [app/(student)/_layout.tsx](../app/(student)/_layout.tsx)

Fixed dock navigation with student-specific modules.

### 7.2 Screen Inventory (30+ screens)

#### Core Screens

| Screen | Path | Features | Backend Tables |
|--------|------|----------|----------------|
| Dashboard | `dashboard.tsx` | Today timetable, attendance %, assignments | Hook aggregations |
| Profile | `profile.tsx` | View profile | `profiles`, `students` |

#### Academic Screens

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `attendance.tsx` | Attendance summary | `attendance_records`, `attendance` |
| `timetable/index.tsx` | Week view, substitutions | `timetable_entries`, `substitutions` |
| `materials.tsx` | Teaching materials | `teaching_materials` |
| `marks/index.tsx` | Internal marks | `exam_marks`, `exam_schedules` |
| `exams/index.tsx` | Exam schedule | `exams`, `exam_schedules` |
| `results.tsx` | External marks/SGPA | `external_marks` |
| `assignments/index.tsx` | Assignment list | `assignments`, `assignment_submissions` |
| `assignments/[id].tsx` | Assignment detail/submit | `assignment_submissions` |

#### Campus Services

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `library/index.tsx` | Book search, my issues | `books`, `book_issues` |
| `canteen/index.tsx` | Menu, tokens | `canteen_daily_menu`, `canteen_tokens` |
| `bus/index.tsx` | Routes, tracking | `bus_routes`, `bus_subscriptions` |
| `fees/index.tsx` | Fee status, payments | `student_fees`, `fee_payments` |

#### Communication

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `notices/index.tsx` | Notice list | `notices`, `notice_reads` |
| `notices/[id].tsx` | Notice detail | `notices` |
| `events/index.tsx` | Event list | `events` |
| `events/[id].tsx` | Event detail | `events`, `event_certificates` |
| `feedback/index.tsx` | Submit feedback | `feedback`, `complaints` |

#### Other

| Screen | Features | Backend Tables |
|--------|----------|----------------|
| `honors/index.tsx` | Minor/honors registration | `minor_subjects`, `student_minor_registrations` |
| `support/index.tsx` | Help/support | Static content |
| `settings/index.tsx` | App settings | Local store |

### 7.3 Student Dashboard Hook

**File:** [hooks/useStudentDashboard.ts](../hooks/useStudentDashboard.ts)

Fetches:
- Today's timetable entries
- Attendance summary (percentage)
- Upcoming assignments
- Recent marks
- Quick notices count

---

## 8. Shared Libraries & Hooks

### 8.1 Database Library

**File:** [lib/database.ts](../lib/database.ts) (558 lines)

#### Profile Functions
- `getProfile(userId)` — Fetch user profile
- `updateProfile(userId, updates)` — Update profile

#### Role Functions
- `getUserRoles(userId)` — Get user's role names
- `getUserRolesWithDetails(userId)` — Get roles with department info
- `assignRole(userId, roleName, departmentId, assignedBy)` — Assign role to user

#### Auth Helper
- `getAuthUser(userId)` — Comprehensive user object with roles, isAdmin, isTeacher, isStudent flags

#### Student Functions
- `getStudentByUserId(userId)` — Get student record
- `getStudentWithDetails(userId)` — Student with joins (profile, department, section)

#### Teacher Functions
- `getTeacherByUserId(userId)` — Get teacher record
- `getTeacherWithDetails(userId)` — Teacher with courses

#### Academic Functions
- `getAllDepartments()` — All active departments
- `getAllYears()` — Year levels
- `getSemestersByYear(yearId)` — Semesters for year
- `getSectionsByDepartmentAndYear(deptId, yearId)` — Sections
- `getCurrentAcademicYear()` — Current academic year
- `getAllRoles()` — All roles
- `getRolesByCategory(category)` — Roles filtered by category

#### Program Functions
- `getAllPrograms()` — All programs (courses with program_type)
- `getProgramsByDepartment(deptId)` — Department programs
- `getProgramById(programId)` — Single program

#### Holiday Functions
- `getHolidays(start, end, deptId?)` — Holidays in date range
- `createHoliday(holiday)` — Create holiday
- `deleteHoliday(holidayId)` — Delete holiday

#### Attendance Functions
- `getStudentLatePasses(studentId, academicYearId)` — Late passes
- `getAttendanceSummary(studentId, start, end)` — Attendance statistics

### 8.2 Storage Library

**File:** [lib/storage.ts](../lib/storage.ts)

Functions:
- `uploadFileToBucket(options)` — Upload file to Supabase Storage
  - Reads file as base64
  - Converts to Uint8Array
  - Uploads to specified bucket/path
  - Returns public URL

Helpers:
- `sanitizeFileName(name)` — Clean filename for storage
- `base64ToUint8Array(base64)` — Convert base64 to binary
- `randomSuffix()` — Generate random string

### 8.3 Export Library

**File:** [lib/export.ts](../lib/export.ts) (172 lines)

Functions:
- `arrayToCSV(data, headers?)` — Convert array to CSV string
- `exportToCSV(data, filename, headers?)` — Export data as CSV
- `exportReport(title, data, filename, format)` — Export report
- `exportStudents(students, format)` — Export student data
- `exportTeachers(teachers, format)` — Export teacher data
- `exportAttendance(attendance, format)` — Export attendance
- `exportMarks(marks, format)` — Export marks
- `exportFees(payments, format)` — Export fee data

### 8.4 Backup Library

**File:** [lib/backup.ts](../lib/backup.ts) (373 lines)

Functions:
- `createBackup(userId?)` — Create full database backup
- `restoreBackup(backupJson)` — Restore from backup

Backup includes tables:
- departments, courses, profiles, students, teachers
- notices, academic_years, timetable_entries, attendance
- exams, fee_payments, assignments, books, book_issues
- bus_routes, canteen_menu_items

### 8.5 Themed Alert Library

**File:** [lib/themedAlert.ts](../lib/themedAlert.ts)

Provides themed alert dialogs that match current theme colors.

---

## 9. Database Schema

### 9.1 Core Tables

**Reference:** [database/schema.sql](../database/schema.sql) (617 lines)

#### Custom Types (ENUMs)

| Type | Values |
|------|--------|
| `user_status` | active, inactive, suspended, graduated, dropout |
| `gender_type` | male, female, other |
| `teacher_type` | full_time, part_time, visiting, guest, lab_assistant |
| `teacher_designation` | professor, associate_professor, assistant_professor, lecturer, lab_instructor |
| `course_type` | core, elective, open_elective, lab, mandatory, major, minor |

#### Table Inventory

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `roles` | Role definitions | name, display_name, category, permissions |
| `departments` | Academic departments | code, name, hod_user_id |
| `academic_years` | Academic year periods | name, start_date, end_date, is_current |
| `years` | Year levels (1st-4th) | year_number, name |
| `semesters` | Semesters (1-8) | semester_number, year_id |
| `sections` | Class sections | name, department_id, year_id, class_teacher_id |
| `profiles` | User profiles | id (FK auth.users), email, full_name, primary_role |
| `user_roles` | User-role assignments | user_id, role_id, department_id, is_active |
| `students` | Student records | user_id, registration_number, department_id, section_id |
| `teachers` | Teacher records | user_id, employee_id, department_id, designation |
| `courses` | Courses/subjects | code, name, department_id, semester_id, course_type |
| `teacher_courses` | Teacher-course assignments | teacher_id, course_id, section_id |
| `mentor_assignments` | Mentor-student pairs | mentor_id, student_id |

### 9.2 Extended Tables (via migrations)

| Table | Purpose |
|-------|---------|
| `timetable_entries` | Class schedule |
| `substitutions` | Substitution requests |
| `attendance` | Attendance sessions |
| `attendance_records` | Individual attendance |
| `attendance_alerts` | Shortage alerts |
| `late_passes` | Late pass records |
| `student_leave_applications` | Leave requests |
| `exams` | Exam definitions |
| `exam_schedules` | Exam timetable |
| `exam_marks` | Internal marks |
| `external_marks` | External exam results |
| `assignments` | Assignment definitions |
| `assignment_submissions` | Student submissions |
| `teaching_materials` | Uploaded materials |
| `lesson_planners` | Lesson plans |
| `work_diary_entries` | Teacher diary |
| `notices` | Announcements |
| `notice_reads` | Read receipts |
| `events` | College events |
| `event_certificates` | Event participation |
| `books` | Library catalog |
| `book_issues` | Book loans |
| `book_reservations` | Book reservations |
| `fee_structures` | Fee definitions |
| `student_fees` | Student fee records |
| `fee_payments` | Payment transactions |
| `bus_routes` | Transport routes |
| `bus_stops` | Route stops |
| `bus_vehicles` | Vehicle inventory |
| `bus_subscriptions` | Student subscriptions |
| `canteen_menu_items` | Menu catalog |
| `canteen_daily_menu` | Daily availability |
| `canteen_tokens` | Order tokens |
| `feedback` | User feedback |
| `complaints` | Complaints |
| `gate_passes` | Gate pass requests |
| `college_info` | College details |
| `holidays` | Holiday calendar |
| `minor_subjects` | Minor programs |
| `student_minor_registrations` | Minor enrollments |

### 9.3 Row Level Security (RLS)

All tables have RLS enabled with policies:

#### User Self-Access
- `profiles` — Users can view/update own profile
- `user_roles` — Users can view own roles
- `students` — Students can view own record
- `teachers` — Teachers can view own record

#### Admin Full Access
- Function `is_admin()` checks for admin role
- Admin policies grant full access to all tables

#### Teacher Access
- Function `is_teacher()` checks for teacher role
- Teachers can view all students and teachers

#### Authenticated Read Access
- `roles`, `departments`, `courses`, `sections` — Read-only for authenticated users

### 9.4 Database Functions

| Function | Purpose |
|----------|---------|
| `is_admin()` | Check if current user is admin |
| `is_teacher()` | Check if current user is teacher |
| `get_user_roles(user_uuid)` | Get user's roles with department |
| `get_current_academic_year()` | Get current academic year ID |
| `handle_new_user()` | Auto-create profile on signup |
| `update_updated_at()` | Auto-update timestamps |

---

## 10. Supabase Migrations Inventory

**Total Migration Files:** 54

### Migration Categories

#### Core Schema (2024-11)
- `20241127000000_initial_schema.sql` — Base schema
- `20241128000001_fix_trigger.sql` — Trigger fixes

#### Extended Features (2024-11 to 2025-12)
- Student registration, seed data
- Attendance module (v1, v2, delegations, RLS)
- Timetable updates
- Role permissions
- Backend functions
- Program/course extensions

#### Recent Enhancements (2026-01)
- Student module RLS policies
- Teacher assignment submissions RLS
- Planner/diary approval workflows
- Attendance lock windows
- Exam marks locking
- Teacher uploads storage
- Mentor module RLS
- Substitution workflow
- Storage buckets
- Programmes alias
- Work diary 6-unit system
- Lesson planner enhancements
- Student leave applications
- Attendance alerts

---

## 11. UI Components Library

**Location:** [components/ui/](../components/ui/)

| Component | Purpose |
|-----------|---------|
| `AnimatedBackground.tsx` | Animated gradient backgrounds |
| `BottomNav.tsx` | Bottom navigation bar |
| `Card.tsx` | Basic card container |
| `GlassCard.tsx` | Glass-morphic card |
| `GlassIcon.tsx` | Glass-style icon button |
| `GlassInput.tsx` | Glass-style text input |
| `GlassSurface.tsx` | Glass-style surface |
| `IconBadge.tsx` | Icon with badge indicator |
| `LoadingIndicator.tsx` | Loading spinner |
| `PrimaryButton.tsx` | Primary action button |
| `SettingsKit.tsx` | Settings UI components |
| `SolidButton.tsx` | Solid color button |
| `StatCard.tsx` | Statistics display card |
| `ThemeToggle.tsx` | Light/dark mode toggle |
| `ThemedAlertProvider.tsx` | Themed alert context |
| `TriangleLoader.tsx` | 3D triangle loading animation |

---

## 12. State Management

**Library:** Zustand (via create pattern)

### Stores

#### Auth Store (`authStore.ts`)
- User authentication state
- Session management
- Profile and roles
- Login/logout actions

#### Theme Store (`themeStore.ts`)
- Current theme colors
- Dark/light mode
- System theme sync
- Animation preferences

#### App Settings Store (`appSettingsStore.ts`)
- App-level settings
- Persisted preferences

---

## 13. Theming System

### Theme Features
- Light and dark modes
- System theme sync
- Multiple color presets
- Customizable border radius
- Blur intensity control
- Animation toggle

### Theme Colors
- `background`, `surface`, `card`
- `textPrimary`, `textSecondary`, `textMuted`
- `primary`, `secondary`, `accent`
- `success`, `warning`, `error`, `info`
- `border`, `divider`

### Documentation
- [THEME_SYSTEM.md](THEME_SYSTEM.md)
- [THEME_GLOBALIZATION_ARCHITECTURE.md](THEME_GLOBALIZATION_ARCHITECTURE.md)
- [THEME_VIOLET_BLOOM_MAPPING.md](THEME_VIOLET_BLOOM_MAPPING.md)

---

## 14. Storage & File Uploads

### Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `teaching-materials` | Uploaded course materials | Teachers write, students read |
| `assignment-submissions` | Student submission files | Students write own, teachers read assigned |
| `profile-photos` | User avatars | Owner write, authenticated read |
| `documents` | General documents | Role-based |

### Upload Flow

1. User selects file via `expo-document-picker`
2. File read as base64 via `expo-file-system`
3. Converted to Uint8Array
4. Uploaded to Supabase Storage via `uploadFileToBucket()`
5. Public URL returned and stored in database

---

## 15. Export & Backup System

### Export Capabilities
- CSV export for all major data types
- Students, teachers, attendance, marks, fees
- Console logging (file export coming soon)

### Backup Capabilities
- Full database backup to JSON
- Includes 16+ tables
- Backup metadata (version, timestamp, record count)
- Restore with duplicate handling (upsert)
- Share via `expo-sharing`

---

## 16. Security Considerations

### Authentication Security
- Supabase Auth with email/password
- OTP verification support
- Password change with current password verification
- Session auto-refresh
- Secure token storage (AsyncStorage on mobile, localStorage on web)

### Authorization Security
- Row Level Security on all tables
- Role-based module access
- Permission-based action control
- Real-time permission updates via subscription
- `is_admin()` and `is_teacher()` security definer functions

### Data Security
- Encrypted sensitive fields (aadhar_number_encrypted)
- No direct database access from client
- All queries go through Supabase RLS

---

## 17. Implementation Status Summary

### Fully Implemented ✅

| Module | Coverage |
|--------|----------|
| Authentication | Login, register, OTP, password reset |
| RBAC System | 10 admin roles, 4 teacher roles, 40+ permissions |
| Admin Dashboard | Stats, navigation, role-based access |
| User Management | Students, teachers, CRUD, role assignment |
| Academic Structure | Departments, courses, years, semesters, sections |
| Timetable | View, create, substitutions |
| Attendance | Mark, view, reports, holidays |
| Exam Management | Schedule, marks entry, reports |
| Assignment System | Create, submit, grade |
| Library | Books, issue, return, overdue |
| Fees | Structures, payments, defaulters |
| Bus Transport | Routes, vehicles, subscriptions |
| Canteen | Menu, tokens, orders |
| Notices & Events | Create, view, read tracking |
| Planner & Diary | Create, edit, approval workflow |
| Reception | Gate passes, late passes, logs |
| Theme System | Light/dark, presets, animations |
| Storage | File uploads to Supabase |
| Backup/Export | JSON backup, CSV export |

### Partially Implemented 🟡

| Feature | Status |
|---------|--------|
| Profile Photo Upload | Display works, upload flow incomplete |
| File Export | Console logging, file save coming |
| Analytics Dashboard | Basic stats, advanced charts pending |
| Push Notifications | Infrastructure ready, not wired |
| Offline Support | No offline caching yet |

### Planned / Not Implemented ❌

| Feature | Notes |
|---------|-------|
| Hall Ticket Generation | PDF generation needed |
| SGPA/CGPA Calculator | Display only, no calculation |
| Bus Live Tracking | No GPS integration |
| Payment Gateway | Manual payment entry only |
| Biometric Attendance | Future enhancement |

---

## Appendix A: File Counts

| Category | Count |
|----------|-------|
| Frontend Routes | ~170 screens |
| Database Tables | 40+ |
| Migrations | 54 files |
| UI Components | 17 |
| Hooks | 4 |
| Libraries | 9 |
| Stores | 4 |

---

## Appendix B: Key Dependencies

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "expo": "~53.0.0",
  "expo-router": "~5.1.8",
  "react": "19.0.0",
  "react-native": "0.79.6",
  "react-native-reanimated": "~3.17.4",
  "typescript": "~5.9.2"
}
```

---

## Appendix C: Environment Configuration

### Supabase Connection
```typescript
const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SUPABASE_ANON_KEY = '...'; // In lib/supabase.ts
```

### Platform Support
- iOS (via Expo)
- Android (via Expo)
- Web (via Expo Web)

---

## Conclusion

The College App is a comprehensive multi-platform application covering:
- **Admin management** with granular role-based access
- **Teacher workflows** for attendance, marks, planning
- **Student experience** for academics, services, communication

The architecture is modular, with clear separation between:
- UI components (React Native + Expo)
- Business logic (hooks + lib functions)
- Data layer (Supabase + RLS)
- State management (Zustand stores)

The codebase follows TypeScript best practices with strong typing throughout.

---

*Generated: 2026-01-13 | Total Lines: 750+*
