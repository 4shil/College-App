# JPM College App - Complete Project Plan

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [User Roles & Hierarchy](#user-roles--hierarchy)
4. [Database Schema](#database-schema)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Module Breakdown](#module-breakdown)
8. [API Endpoints](#api-endpoints)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Current Status](#current-status)

---

## 🎯 Project Overview

**JPM College App** is a comprehensive college management system built with React Native (Expo) and Supabase. It provides role-based access for administrators, teachers, and students.

### Key Features:
- Multi-role authentication (Admin/Teacher/Student)
- Academic management (Departments, Courses, Timetables)
- Student lifecycle management (Registration, Attendance, Results)
- Communication (Notices, Announcements)
- Utility modules (Library, Bus, Canteen, Fees)

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React Native | Mobile app framework |
| Expo | Development platform |
| Expo Router | File-based navigation |
| TypeScript | Type safety |
| Zustand | State management |
| React Native Reanimated | Animations |
| Expo Linear Gradient | Gradient effects |
| Expo Blur | iOS blur effects |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service |
| Supabase CLI | Local dev, migrations, type generation |
| Hasura | GraphQL API layer |
| Hasura CLI | Migrations, metadata, console |
| PostgreSQL | Database |
| Supabase Auth | Authentication |
| Supabase Storage | File storage |
| Row Level Security | Data protection |
| Edge Functions | Serverless functions (future) |

---

## 🖥️ CLI Setup & Productivity Commands

### Supabase CLI Installation & Setup

```powershell
# Install Supabase CLI (Windows - using scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR using npm (cross-platform)
npm install -g supabase

# Login to Supabase
supabase login

# Link to existing project
supabase link --project-ref celwfcflcofejjpkpgcq

# Initialize local development
supabase init
```

### Hasura CLI Installation & Setup

```powershell
# Install Hasura CLI (Windows)
npm install -g hasura-cli

# OR using curl (Linux/Mac)
# curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash

# Initialize Hasura in project
hasura init hasura --endpoint https://your-hasura-endpoint.hasura.app

# Set admin secret
cd hasura
# Create .env file with HASURA_GRAPHQL_ADMIN_SECRET=your-secret
```

---

## 🚀 Supabase CLI Productivity Commands

### Database Migrations

```powershell
# Create a new migration
supabase migration new add_attendance_table

# Apply migrations to remote
supabase db push

# Pull remote schema changes
supabase db pull

# Reset local database
supabase db reset

# Diff local vs remote
supabase db diff --use-migra
```

### TypeScript Type Generation (CRITICAL for productivity!)

```powershell
# Generate types from database schema
supabase gen types typescript --project-id celwfcflcofejjpkpgcq > types/supabase.ts

# Auto-generate on schema change (add to package.json)
# "gen:types": "supabase gen types typescript --project-id celwfcflcofejjpkpgcq > types/supabase.ts"
```

### Local Development

```powershell
# Start local Supabase stack (Postgres, Auth, Storage, etc.)
supabase start

# Stop local stack
supabase stop

# View local status
supabase status

# View local logs
supabase logs
```

### Edge Functions

```powershell
# Create new function
supabase functions new send-notification

# Serve locally
supabase functions serve send-notification

# Deploy to production
supabase functions deploy send-notification

# Deploy all functions
supabase functions deploy
```

### Database Seeding

```powershell
# Run seed file
supabase db seed

# Execute SQL file directly
supabase db execute --file supabase/seed.sql
```

### Branching (Preview Environments)

```powershell
# Create a database branch
supabase branches create feature-attendance

# Switch branches
supabase branches switch feature-attendance

# Delete branch
supabase branches delete feature-attendance
```

---

## 🔷 Hasura CLI Productivity Commands

### Console & Development

```powershell
# Open Hasura Console (auto-tracks changes)
cd hasura
hasura console

# This opens browser console and auto-generates migrations!
```

### Migrations

```powershell
# Create migration manually
hasura migrate create add_attendance_table --from-server

# Apply migrations
hasura migrate apply

# Apply to specific database
hasura migrate apply --database-name default

# Rollback last migration
hasura migrate apply --down 1

# Check migration status
hasura migrate status
```

### Metadata Management

```powershell
# Export all metadata (permissions, relationships, etc.)
hasura metadata export

# Apply metadata
hasura metadata apply

# Clear metadata
hasura metadata clear

# Reload metadata
hasura metadata reload

# Check inconsistencies
hasura metadata inconsistency list
```

### Seeds

```powershell
# Create seed file
hasura seed create initial_data --from-table departments --from-table roles

# Apply seeds
hasura seed apply
```

### Squash Migrations (Cleanup)

```powershell
# Squash multiple migrations into one
hasura migrate squash --from 1234567890123 --name combined_schema
```

---

## 📦 Package.json Scripts for Maximum Productivity

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "dev": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    
    "// === SUPABASE COMMANDS ===": "",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:status": "supabase status",
    "db:reset": "supabase db reset",
    "db:push": "supabase db push",
    "db:pull": "supabase db pull",
    "db:diff": "supabase db diff --use-migra",
    "db:migrate": "supabase migration new",
    "db:seed": "supabase db seed",
    
    "// === TYPE GENERATION ===": "",
    "gen:types": "supabase gen types typescript --project-id celwfcflcofejjpkpgcq > types/supabase.ts",
    "gen:types:local": "supabase gen types typescript --local > types/supabase.ts",
    
    "// === EDGE FUNCTIONS ===": "",
    "fn:new": "supabase functions new",
    "fn:serve": "supabase functions serve",
    "fn:deploy": "supabase functions deploy",
    
    "// === HASURA COMMANDS ===": "",
    "hasura:console": "cd hasura && hasura console",
    "hasura:migrate": "cd hasura && hasura migrate apply",
    "hasura:migrate:create": "cd hasura && hasura migrate create",
    "hasura:metadata": "cd hasura && hasura metadata apply",
    "hasura:metadata:export": "cd hasura && hasura metadata export",
    "hasura:seed": "cd hasura && hasura seed apply",
    
    "// === COMBINED WORKFLOWS ===": "",
    "db:sync": "npm run db:pull && npm run gen:types",
    "deploy:db": "npm run db:push && npm run gen:types",
    "setup": "supabase link --project-ref celwfcflcofejjpkpgcq && npm run gen:types"
  }
}
```

---

## 🔄 Recommended Development Workflow

### Daily Development Workflow

```powershell
# 1. Start your day - ensure types are fresh
npm run gen:types

# 2. Start local Supabase (optional, for offline dev)
npm run db:start

# 3. Start Expo
npm run dev

# 4. When making DB changes, use Hasura Console
npm run hasura:console
# Make changes in browser - migrations auto-generated!

# 5. After DB changes, regenerate types
npm run gen:types
```

### Creating New Tables Workflow

```powershell
# Option A: Using Supabase CLI
supabase migration new create_attendance_table
# Edit: supabase/migrations/xxx_create_attendance_table.sql
supabase db push
npm run gen:types

# Option B: Using Hasura Console (Recommended - Visual!)
npm run hasura:console
# Create table in UI → migrations auto-generated
npm run gen:types
```

### Deploying Changes Workflow

```powershell
# 1. Check what will be deployed
npm run db:diff

# 2. Push changes to production
npm run db:push

# 3. Regenerate types for production schema
npm run gen:types

# 4. Apply Hasura metadata
npm run hasura:metadata

# 5. Commit everything
git add .
git commit -m "feat: add attendance table"
git push
```

---

## 📁 Hasura Project Structure

```
hasura/
├── config.yaml              # Hasura configuration
├── metadata/
│   ├── version.yaml
│   ├── databases/
│   │   └── default/
│   │       ├── tables/
│   │       │   ├── public_profiles.yaml
│   │       │   ├── public_students.yaml
│   │       │   ├── public_teachers.yaml
│   │       │   └── ...
│   │       └── functions/
│   ├── actions.yaml         # Custom actions
│   ├── cron_triggers.yaml   # Scheduled jobs
│   └── remote_schemas.yaml  # Remote GraphQL schemas
├── migrations/
│   └── default/
│       ├── 1234567890123_init/
│       │   ├── up.sql
│       │   └── down.sql
│       └── 1234567890124_add_attendance/
│           ├── up.sql
│           └── down.sql
└── seeds/
    └── default/
        └── 1234567890123_initial_data.sql
```

---

## 🔗 Connecting Hasura to Supabase

### Step 1: Create Hasura Cloud Project

```powershell
# Go to https://cloud.hasura.io
# Create new project
# Note the GraphQL endpoint
```

### Step 2: Connect to Supabase Database

```yaml
# In Hasura Console → Data → Connect Database
Database URL: postgresql://postgres:[PASSWORD]@db.celwfcflcofejjpkpgcq.supabase.co:5432/postgres
```

### Step 3: Track Tables

```powershell
# In Hasura Console → Data → Track All tables
# This creates GraphQL API for all tables automatically!
```

### Step 4: Set Up Relationships

```powershell
# Hasura auto-detects foreign keys
# Go to each table → Relationships → Track suggested relationships
```

### Step 5: Configure Permissions

```yaml
# In Hasura Console → Table → Permissions
# Set up role-based permissions:
# - admin: full access
# - teacher: read students in section, write attendance
# - student: read own data only
```

---

## 🎯 GraphQL Queries with Hasura (Super Fast!)

### Auto-generated Queries

```graphql
# Get all students with their department
query GetStudents {
  students {
    id
    registration_number
    roll_number
    profile {
      full_name
      email
    }
    department {
      name
    }
    section {
      name
    }
  }
}

# Get student with nested data
query GetStudentDetails($id: uuid!) {
  students_by_pk(id: $id) {
    id
    registration_number
    profile {
      full_name
      email
      phone
    }
    department { name }
    attendance(limit: 10, order_by: {date: desc}) {
      date
      status
      course { name }
    }
    marks {
      marks_obtained
      max_marks
      exam { name }
      course { name }
    }
  }
}

# Real-time subscriptions (automatic!)
subscription WatchPendingApprovals {
  profiles(where: {status: {_eq: "pending_approval"}}) {
    id
    full_name
    email
    created_at
  }
}
```

### Mutations

```graphql
# Mark attendance for multiple students
mutation MarkAttendance($objects: [attendance_insert_input!]!) {
  insert_attendance(objects: $objects) {
    affected_rows
  }
}

# Update student status
mutation ApproveStudent($id: uuid!) {
  update_students_by_pk(
    pk_columns: {id: $id}
    _set: {current_status: "active"}
  ) {
    id
    current_status
  }
}
```

---

## 📱 React Native Integration

### Update GraphQL Client

```typescript
// lib/graphql/client.ts
import { createClient } from 'graphql-ws';
import { createClient as createUrqlClient, subscriptionExchange, fetchExchange } from 'urql';

const HASURA_ENDPOINT = 'https://your-project.hasura.app/v1/graphql';
const HASURA_WS_ENDPOINT = 'wss://your-project.hasura.app/v1/graphql';

// WebSocket client for subscriptions
const wsClient = createClient({
  url: HASURA_WS_ENDPOINT,
  connectionParams: async () => {
    const session = await supabase.auth.getSession();
    return {
      headers: {
        Authorization: `Bearer ${session.data.session?.access_token}`,
      },
    };
  },
});

// URQL client with subscriptions
export const urqlClient = createUrqlClient({
  url: HASURA_ENDPOINT,
  fetchOptions: async () => {
    const session = await supabase.auth.getSession();
    return {
      headers: {
        Authorization: `Bearer ${session.data.session?.access_token}`,
      },
    };
  },
  exchanges: [
    fetchExchange,
    subscriptionExchange({
      forwardSubscription: (operation) => ({
        subscribe: (sink) => ({
          unsubscribe: wsClient.subscribe(operation, sink),
        }),
      }),
    }),
  ],
});
```

### Example Hook with Real-time Updates

```typescript
// hooks/usePendingApprovals.ts
import { useSubscription } from 'urql';

const PENDING_APPROVALS_SUBSCRIPTION = `
  subscription WatchPendingApprovals {
    profiles(
      where: { status: { _eq: "pending_approval" } }
      order_by: { created_at: desc }
    ) {
      id
      full_name
      email
      created_at
    }
  }
`;

export function usePendingApprovals() {
  const [result] = useSubscription({ query: PENDING_APPROVALS_SUBSCRIPTION });
  
  return {
    approvals: result.data?.profiles ?? [],
    loading: result.fetching,
    error: result.error,
  };
}
```

---

## 👥 User Roles & Hierarchy

### 🔴 Admin Roles (9 TRUE ADMIN ROLES)
```
├── super_admin          → GOD MODE - Full system access to everything
├── principal            → Academic top authority (Approver, not operational)
├── department_admin     → Department-level user & info management
├── hod                  → Head of Department (Teacher role with admin powers)
├── exam_cell_admin      → Exam scheduling + marks verification
├── library_admin        → Full library management
├── bus_admin            → Transportation management
├── canteen_admin        → Canteen token system management
└── finance_admin        → Fee and payment management
```

### 🟡 Teacher Roles (Category: `teacher`) - STACKED HIERARCHY
```
├── subject_teacher      → Base role (every teacher gets this)
│   ├── class_teacher    → + In-charge of a class/section
│   │   ├── mentor       → + Mentors specific students
│   │   └── coordinator  → + Manages substitute assignments
└── hod                  → + Department head (highest teacher role)
```

📌 **Only 9 Admin roles = TRUE ADMIN ROLES**
📌 **All teaching roles (Coordinator, Class Teacher, Subject Teacher) are NOT admins**

### 🟢 Student Role (Category: `student`)
```
└── student              → Regular enrolled student
```

### Role Permissions Matrix (Updated 2025)
| Feature | Super Admin | Principal | Dept Admin | HOD | Exam Cell | Library | Bus | Canteen | Finance |
|---------|-------------|-----------|------------|-----|-----------|---------|-----|---------|---------|
| Full System Access | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create/Delete Admins | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Users | ✅ | ✅ | ⚠️ Dept | ⚠️ Dept | ❌ | ❌ | ❌ | ❌ | ❌ |
| Block/Unblock Users | ✅ | ✅ | ⚠️ Dept | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Academic Structure | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Timetable Control | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exam Scheduling | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify Marks | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Approve Planner | ✅ | ⚠️ Monitor | ❌ | ✅ Level 1 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Diary | ✅ | ✅ Final | ❌ | ✅ Level 1 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Library Management | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Bus Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Canteen Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Fee Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Post Notices | ✅ | ✅ | ⚠️ Dept | ⚠️ Dept | ❌ | ❌ | ❌ | ❌ | ❌ |
| Global Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 🎓 TEACHER MODULE — COMPLETE FEATURE SPECIFICATION (2025)

### ⚡ System Rules Applied
- ✅ **Email-only login** (NO phone login)
- ✅ **Teachers upload ONLY internal marks** (External marks uploaded by students)
- ✅ **Admin sets exam dates & timetable** → Teacher only enters internal marks
- ✅ **No QR attendance in events**
- ✅ **No extra admin-level operations inside teacher module**
- ✅ **Lesson Planner + Diary approvals** → HoD → Principal flow

---

### ⭐ 0. UNIVERSAL LOGIN & PROFILE

#### Features
| Feature | Description |
|---------|-------------|
| Email Login | Login with email + password only |
| Multi-role Detection | Detect all assigned roles (Subject/Class/Mentor/Coordinator/HoD) |
| Auto-route Dashboard | Route to highest role dashboard |
| Profile View & Edit | View and update personal info |
| Profile Photo Upload | Upload/change profile photo |
| Secure Session | JWT-based session management |

#### Functions
```typescript
// Auth Functions
loginWithEmail(email, password)
fetchAssignedRoles(userId)
loadRolePermissions(roles)
updateProfile(profileData)
uploadProfilePhoto(file)
refreshSessionToken()
logout()
```

---

### 🟦 1. SUBJECT TEACHER MODULE (Base Role)

*Every teacher gets this role. Core teaching functions.*

#### A) Daily Class Handling

| Feature | Description |
|---------|-------------|
| View Timetable | Daily/weekly timetable view |
| Start Class Session | Begin class and access period tools |
| Period Tools | Attendance, Materials, Assignments for that period |
| Substitute Mode | Teach another teacher's class if assigned |

```typescript
// Functions
fetchTimetable(teacherId, date | week)
startClassSession(periodId)
loadPeriodTools(periodId)
enableSubstituteMode(assignmentId)
```

#### B) Attendance (Subject-wise)

| Feature | Description |
|---------|-------------|
| Mark Attendance | Mark P/A/L for subject students |
| Edit Attendance | Edit within grace window (e.g., 2 hours) |
| View Summary | Subject-wise attendance summary |
| Auto-lock | Lock after grace window expires |

```typescript
// Functions
loadStudentList(courseId, sectionId)
markAttendance(studentId, status: 'P' | 'A' | 'L')
saveAttendance(attendanceData[])
editAttendance(attendanceId, newStatus) // Within window
isAttendanceLocked(attendanceId) → boolean
getAttendanceSummary(courseId, dateRange)
```

#### C) Teaching Materials

| Feature | Description |
|---------|-------------|
| Upload Materials | Notes, PDFs, PPTs, Links, Videos |
| Upload Syllabus | Syllabus PDF for subject |
| Manage Files | Edit/Delete uploaded files |
| Auto-notify | Push notification to students on upload |

```typescript
// Functions
uploadMaterial(file, metadata: {courseId, title, type})
uploadSyllabus(file, courseId)
getMaterialsList(courseId)
deleteMaterial(materialId)
replaceMaterial(materialId, newFile)
notifyStudents(courseId, message)
```

#### D) Assignment Management

| Feature | Description |
|---------|-------------|
| Create Assignment | Title, instructions, due date |
| Add Attachments | Question files, reference docs |
| View Submissions | List of student submissions |
| Grade Submissions | Marks + feedback per student |

```typescript
// Functions
createAssignment(assignmentData)
uploadQuestionFile(assignmentId, file)
getSubmissionsList(assignmentId)
gradeSubmission(submissionId, marks, feedback)
getAssignmentStats(assignmentId)
```

#### E) Exams Module (Internal + Model ONLY)

| Feature | Description |
|---------|-------------|
| Create Internal Exam | Internal exam metadata |
| Create Model Exam | Model exam for practice |
| Upload Question Paper | PDF question paper |
| Manual Marks Entry | Enter marks (sorted by student name) |
| CSV Marks Upload | Bulk upload with name matching |
| View Performance | Subject performance graphs |
| Lock Marks | Final submission locks marks |

```typescript
// Functions
createExam(examData: {type: 'internal' | 'model', ...})
uploadQuestionPaper(examId, file)

// Manual Entry
getStudentsForMarks(examId) → Student[] (sorted by name)
enterMarks(examId, studentId, marks)
saveMarks(examId, marksData[])

// CSV Upload
parseMarksCSV(file) → ParsedMarks[]
validateMarksCSV(parsedData) → ValidationResult
matchStudentNames(parsedData) → MatchedMarks[]
uploadMarksFromCSV(examId, matchedMarks[])

// Finalization
lockMarks(examId) // No more edits after this
getSubjectPerformance(courseId, examId) → PerformanceData
```

#### F) Lesson Planner (Weekly + Monthly)

| Feature | Description |
|---------|-------------|
| Upload Syllabus | PDF or CSV syllabus file |
| Auto-parse CSV | Convert CSV to topic sections |
| Mark Completed | Check off completed topics |
| Weekly Progress | Save weekly completion status |
| Submit for Approval | Teacher → HoD → Principal |
| View Approval Status | Track pending/approved/rejected |

```typescript
// Functions
uploadSyllabusFile(courseId, file: PDF | CSV)
parseCSVToSections(csvFile) → Section[]
autoGenerateWeeklyPlan(sections[]) → WeeklyPlan[]
markTopicCompleted(topicId, completedAt: timestamp)
saveWeeklyProgress(weekId, progressData)
generateWeeklyReport(weekId) → Report

// Approval Flow
submitPlannerForApproval(plannerId)
getPlannerApprovalStatus(plannerId) → 'pending' | 'hod_approved' | 'principal_approved' | 'rejected'
getPlannerFeedback(plannerId) → Feedback[]
```

#### G) Faculty Work Diary (Daily → Monthly)

| Feature | Description |
|---------|-------------|
| Daily Entry | Log periods, subjects, hours |
| Special Categories | OD, DL, Leave, Extra Classes |
| Auto-calculate | Total periods, working days, OD/Leave counts |
| Monthly Submission | Submit monthly diary for approval |
| Approval Tracking | Track HoD → Principal approval |

```typescript
// Functions
createDailyEntry(date, entries: DiaryEntry[])
saveDiaryEntry(entryData: {subject, period, hours, category})
markSpecialCategory(date, category: 'OD' | 'DL' | 'LEAVE' | 'EXTRA')

// Monthly Summary
getMonthlyStats(month, year) → {
  totalPeriods: number,
  totalWorkingDays: number,
  odCount: number,
  leaveCount: number,
  dlCount: number,
  extraClassCount: number
}

// Approval Flow
submitMonthlyDiary(month, year)
getDiaryApprovalStatus(diaryId) → 'pending' | 'hod_approved' | 'principal_approved' | 'rejected'
getDiaryFeedback(diaryId) → Feedback[]
```

#### H) Communication (Subject-Level)

| Feature | Description |
|---------|-------------|
| Send Announcement | Subject-specific announcements |
| Attach Files | PDFs, images with announcements |
| Push Notification | Auto-notify subject students |

```typescript
// Functions
createAnnouncement(courseId, title, content)
attachFile(announcementId, file)
sendToSubjectBatch(announcementId, courseId)
pushNotification(studentIds[], message)
```

---

### 🟧 2. CLASS TEACHER MODULE (Stacked Role)

*Added on top of Subject Teacher. Full class visibility.*

#### A) Class Administration

| Feature | Description |
|---------|-------------|
| Full Student List | Complete list of class students |
| Student Profiles | View full profile of any student |
| Cross-teacher Attendance | View attendance from all subjects |
| Cross-teacher Marks | View marks from all teachers |
| Identify At-risk | Weak/shortage students filter |
| Class Ranking | Performance-based ranking |

```typescript
// Functions
getClassStudents(sectionId) → Student[]
getStudentFullProfile(studentId) → Profile
getCrossTeacherAttendance(sectionId) → AttendanceMatrix
getCrossTeacherMarks(sectionId) → MarksMatrix
filterAtRiskStudents(sectionId, criteria) → Student[]
getClassRanking(sectionId, examId) → RankedStudents[]
```

#### B) Class Reporting

| Feature | Description |
|---------|-------------|
| Performance Summary | Class-wide performance graphs |
| Attendance Reports | Detailed attendance reports |
| Progress Cards | Generate student progress cards |
| Export Reports | PDF/CSV export |

```typescript
// Functions
getClassPerformanceSummary(sectionId) → Summary
generateAttendanceReport(sectionId, dateRange) → Report
generateProgressCard(studentId) → ProgressCard
exportReportPDF(reportId) → PDFBlob
exportReportCSV(reportId) → CSVBlob
```

#### C) Class Communication

| Feature | Description |
|---------|-------------|
| Class Announcements | Send to entire class |
| Parent Communication | SMS/App notification to parents |

```typescript
// Functions
sendClassAnnouncement(sectionId, announcement)
notifyParents(studentIds[], message)
```

---

### 🟩 3. MENTOR MODULE (Supporting Role)

*Add-on role for student mentoring.*

#### A) Mentee Access

| Feature | Description |
|---------|-------------|
| Mentee List | View assigned mentees |
| Mentee Attendance | Attendance summary per mentee |
| Mentee Performance | Academic performance overview |

```typescript
// Functions
getMenteeList(mentorId) → Student[]
getMenteeAttendance(studentId) → AttendanceSummary
getMenteePerformance(studentId) → PerformanceData
```

#### B) Counselling

| Feature | Description |
|---------|-------------|
| Counselling Notes | Add notes per session |
| Meeting Summaries | Upload meeting summaries |
| Follow-up Reminders | Schedule follow-up sessions |
| Escalate Concerns | Escalate to Class Teacher/HoD |

```typescript
// Functions
addCounsellingNote(studentId, note, timestamp)
uploadMeetingSummary(studentId, file)
scheduleFollowUp(studentId, date, reminder)
escalateConcern(studentId, concernData, escalateTo: 'class_teacher' | 'hod')
```

---

### 🟨 4. COORDINATOR MODULE (Single-Purpose Role)

*Strictly for substitute management. No other permissions.*

#### A) Substitute Assignment

| Feature | Description |
|---------|-------------|
| Detect Absent | View absent teachers for the day |
| Assign Substitute | Assign another teacher temporarily |
| Set Time Window | Access start and end time |
| Auto-expire | Access removed when time expires |
| Audit Log | Log all substitutions |

```typescript
// Functions
getAbsentTeachers(date) → Teacher[]
assignSubstitute(absentTeacherId, substituteTeacherId, periodIds[])
setAccessWindow(assignmentId, startTime, endTime)
getActiveSubstitutions() → Substitution[]
autoExpireAccess(assignmentId) // Triggered by system
logSubstitution(substitutionData) // Audit trail
```

---

### 🟥 5. HOD MODULE (Department Head)

*Highest teacher role. Department-wide authority.*

#### A) Teacher & Subject Management

| Feature | Description |
|---------|-------------|
| Assign Subjects | Map teachers to subjects |
| Reassign Subjects | Change teacher-subject mapping |
| Cross-dept Teaching | Approve teachers from other depts |
| View Workload | Department workload distribution |

```typescript
// Functions
assignSubjectToTeacher(teacherId, courseId)
reassignSubject(courseId, fromTeacherId, toTeacherId)
approveCrossDeptTeaching(requestId)
getDepartmentWorkload() → WorkloadMatrix
```

#### B) Academic Oversight

| Feature | Description |
|---------|-------------|
| Dept Attendance Analytics | Department-wide attendance data |
| Syllabus Completion Tracking | Track lesson planner progress |
| Performance Analysis | Internal/model exam performance |
| At-risk Identification | Identify struggling subjects/students |

```typescript
// Functions
getDeptAttendanceAnalytics(departmentId) → Analytics
getSyllabusCompletionStatus(departmentId) → CompletionMatrix
getExamPerformanceAnalysis(departmentId, examId) → Analysis
identifyAtRiskAreas(departmentId) → RiskReport
compareTeacherProgress(departmentId) → Comparison
```

#### C) Approvals

| Feature | Description |
|---------|-------------|
| Approve Lesson Planner | Weekly planner approval |
| Approve Work Diary | Monthly diary approval |
| Approve Leave | Teacher leave requests |
| Add Feedback | Comments on approvals |

```typescript
// Functions
getPendingPlannerApprovals() → Planner[]
approvePlanner(plannerId, comments?)
rejectPlanner(plannerId, reason)

getPendingDiaryApprovals() → Diary[]
approveDiary(diaryId, comments?)
rejectDiary(diaryId, reason)

getPendingLeaveRequests() → LeaveRequest[]
approveLeave(leaveId)
rejectLeave(leaveId, reason)
```

#### D) Substitute Management (Override)

| Feature | Description |
|---------|-------------|
| Direct Assignment | Assign substitutes directly |
| Override Coordinator | Override coordinator decisions |

```typescript
// Functions
assignSubstituteDirectly(absentTeacherId, substituteTeacherId, periodIds[])
overrideSubstitution(assignmentId, newSubstituteId)
```

#### E) Department Communications

| Feature | Description |
|---------|-------------|
| Dept Announcements | Send to all dept members |
| Meeting Notices | Schedule and notify meetings |
| Attach Documents | PDFs, agendas, etc. |

```typescript
// Functions
sendDeptAnnouncement(departmentId, announcement)
createMeetingNotice(meetingData)
attachDocument(noticeId, file)
```

---

### ⭐ 6. SYSTEM-WIDE FEATURES (All Teacher Roles)

#### A) Push Notifications

Triggered for:
- 📚 New assignments posted
- ✅ Marks uploaded
- 📢 Announcements published
- 📋 Planner status updates (approved/rejected)
- 📝 Diary approval updates
- 🔄 Substitute teacher alerts
- 📅 Exam timetable updates

#### B) Audit Logging

Tracks all critical actions:
- Attendance entries & edits
- Marks entries & edits
- Planner submissions & approvals
- Diary submissions & approvals
- Substitution events
- HoD decisions (approvals/rejections)

```typescript
// Audit Functions
logAction(action: AuditAction)
getAuditTrail(entityType, entityId) → AuditLog[]
```

#### C) Offline Support

Available offline with auto-sync:
- ✅ Attendance marking
- ✅ Marks entry
- ✅ Diary entry
- ✅ Planner checklist

```typescript
// Offline Functions
saveOffline(action, data)
getSyncQueue() → PendingActions[]
syncWhenOnline()
resolveConflicts(conflicts[])
```

---

### 📱 Teacher Module - Screen Architecture

```
app/(teacher)/
├── _layout.tsx                    ✅ Built
├── dashboard.tsx                  ⚠️ Basic (needs enhancement)
├── profile.tsx                    ❌ TODO
│
├── timetable/
│   └── index.tsx                  ❌ TODO - View daily/weekly timetable
│
├── attendance/
│   ├── index.tsx                  ❌ TODO - Mark attendance
│   ├── [courseId].tsx             ❌ TODO - Subject attendance
│   ├── history.tsx                ❌ TODO - View history
│   └── reports.tsx                ❌ TODO - Attendance reports
│
├── materials/
│   ├── index.tsx                  ❌ TODO - My materials
│   ├── upload.tsx                 ❌ TODO - Upload new
│   └── [materialId].tsx           ❌ TODO - View/Edit
│
├── assignments/
│   ├── index.tsx                  ❌ TODO - All assignments
│   ├── create.tsx                 ❌ TODO - Create new
│   ├── [assignmentId].tsx         ❌ TODO - View submissions
│   └── grade.tsx                  ❌ TODO - Grade submissions
│
├── exams/
│   ├── index.tsx                  ❌ TODO - My exams
│   ├── create.tsx                 ❌ TODO - Create internal/model
│   ├── marks/
│   │   ├── [examId].tsx           ❌ TODO - Manual entry
│   │   └── upload.tsx             ❌ TODO - CSV upload
│   └── results.tsx                ❌ TODO - View performance
│
├── planner/
│   ├── index.tsx                  ❌ TODO - Lesson planner
│   ├── upload.tsx                 ❌ TODO - Upload syllabus
│   ├── weekly.tsx                 ❌ TODO - Weekly view
│   └── status.tsx                 ❌ TODO - Approval status
│
├── diary/
│   ├── index.tsx                  ❌ TODO - Work diary
│   ├── entry.tsx                  ❌ TODO - Daily entry
│   ├── monthly.tsx                ❌ TODO - Monthly summary
│   └── status.tsx                 ❌ TODO - Approval status
│
├── students/                      # Class Teacher only
│   ├── index.tsx                  ❌ TODO - Class students
│   ├── [studentId].tsx            ❌ TODO - Student detail
│   ├── attendance.tsx             ❌ TODO - Class attendance
│   ├── marks.tsx                  ❌ TODO - Class marks
│   └── reports.tsx                ❌ TODO - Class reports
│
├── mentees/                       # Mentor only
│   ├── index.tsx                  ❌ TODO - My mentees
│   ├── [studentId].tsx            ❌ TODO - Mentee detail
│   └── counselling.tsx            ❌ TODO - Add notes
│
├── substitutes/                   # Coordinator only
│   ├── index.tsx                  ❌ TODO - Manage substitutes
│   └── assign.tsx                 ❌ TODO - Assign substitute
│
├── department/                    # HoD only
│   ├── index.tsx                  ❌ TODO - Dept overview
│   ├── teachers.tsx               ❌ TODO - Dept teachers
│   ├── subjects.tsx               ❌ TODO - Subject mapping
│   ├── approvals/
│   │   ├── planners.tsx           ❌ TODO - Approve planners
│   │   ├── diaries.tsx            ❌ TODO - Approve diaries
│   │   └── leaves.tsx             ❌ TODO - Approve leaves
│   ├── analytics.tsx              ❌ TODO - Dept analytics
│   └── announcements.tsx          ❌ TODO - Dept notices
│
└── settings.tsx                   ❌ TODO - Teacher settings
```

---

### 🗄️ Teacher Module - Database Tables

#### New Tables Required

```sql
-- 1. Lesson Planner
CREATE TABLE lesson_planners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  course_id UUID REFERENCES courses(id),
  semester_id UUID REFERENCES semesters(id),
  syllabus_file_url TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft/submitted/hod_approved/principal_approved/rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Planner Topics
CREATE TABLE planner_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID REFERENCES lesson_planners(id),
  week_number INT,
  topic_title TEXT NOT NULL,
  description TEXT,
  planned_date DATE,
  completed_at TIMESTAMPTZ,
  order_index INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Planner Approvals
CREATE TABLE planner_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID REFERENCES lesson_planners(id),
  approved_by UUID REFERENCES profiles(id),
  approval_level VARCHAR(20), -- hod/principal
  status VARCHAR(20), -- approved/rejected
  comments TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Work Diary
CREATE TABLE work_diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  month INT,
  year INT,
  status VARCHAR(20) DEFAULT 'draft', -- draft/submitted/hod_approved/principal_approved/rejected
  total_periods INT DEFAULT 0,
  total_working_days INT DEFAULT 0,
  od_count INT DEFAULT 0,
  leave_count INT DEFAULT 0,
  dl_count INT DEFAULT 0,
  extra_class_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, month, year)
);

-- 5. Diary Entries
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES work_diaries(id),
  entry_date DATE NOT NULL,
  course_id UUID REFERENCES courses(id),
  period_number INT,
  hours DECIMAL(3,1),
  category VARCHAR(20) DEFAULT 'regular', -- regular/od/dl/leave/extra
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Diary Approvals
CREATE TABLE diary_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES work_diaries(id),
  approved_by UUID REFERENCES profiles(id),
  approval_level VARCHAR(20), -- hod/principal
  status VARCHAR(20), -- approved/rejected
  comments TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Substitutions
CREATE TABLE substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  absent_teacher_id UUID REFERENCES teachers(id),
  substitute_teacher_id UUID REFERENCES teachers(id),
  assigned_by UUID REFERENCES profiles(id), -- coordinator or hod
  date DATE NOT NULL,
  period_ids UUID[], -- array of period IDs
  access_start TIMESTAMPTZ,
  access_end TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active', -- active/completed/cancelled
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Mentee Assignments
CREATE TABLE mentor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  academic_year_id UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(mentor_id, student_id, academic_year_id)
);

-- 9. Counselling Notes
CREATE TABLE counselling_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  note TEXT NOT NULL,
  meeting_date DATE,
  follow_up_date DATE,
  follow_up_reminder BOOLEAN DEFAULT false,
  escalated_to VARCHAR(20), -- class_teacher/hod
  escalated_at TIMESTAMPTZ,
  attachments TEXT[], -- file URLs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Teaching Materials
CREATE TABLE teaching_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  course_id UUID REFERENCES courses(id),
  title TEXT NOT NULL,
  description TEXT,
  material_type VARCHAR(20), -- notes/pdf/ppt/link/video/syllabus
  file_url TEXT,
  external_link TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🟥 ADMIN MODULE — COMPLETE FEATURE SPECIFICATION (2025)

### ⚡ System Rules Applied
- ✅ **Email-only login** (NO phone login anywhere)
- ✅ **Super Admin = God Mode** (Full access to everything)
- ✅ **Only 9 TRUE Admin roles** (Teaching roles are NOT admins)
- ✅ **Admin sets exam dates** → Teachers upload internal marks → Students upload external marks
- ✅ **Exam Cell Admin verifies both internal & external marks** (NO marks upload by admin)
- ✅ **Events = External Link only** (NO QR, NO internal registration, NO attendance tracking)
- ✅ **NO credit system** (Honors/Minor without credit tracking)
- ✅ **Library Admin manages everything** (NO department-level approvals)
- ✅ **Lesson Planner/Diary approval** → HoD → Principal flow (Admin only monitors)

---

## ⭐ SECTION 1 — ADMIN HIERARCHY (TOP → BOTTOM)

### 🟩 1. SUPER ADMIN (ROOT ADMIN – GOD MODE)

*Full access to every module + every admin role + every teacher role.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| EVERYTHING | Full system access |
| Create/Delete Admins | Manage all admin accounts |
| Assign/Revoke Roles | Any role to any user |
| Academic Structure | Full control (departments, courses, subjects) |
| Timetable Control | Full create/edit/publish |
| Attendance Control | Full view/edit/correct |
| Exam Control | Full schedule/publish/verify |
| Event Control | Full create/edit/publish |
| Library/Bus/Canteen/Fees | Full control of all modules |
| Global Settings | Academic year, maintenance, backups |
| Force Logout | Force logout all users |

**Super Admin overrides ALL lower roles.**

---

### 🟧 2. PRINCIPAL

*Academic top authority. Approver-level, not operational.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| Final Monthly Diary Approval | Approves work diary (after HoD) |
| Monitor Lesson Planner | Views all planner status |
| College Analytics | View entire college analytics |
| Block/Unblock Users | Teachers & students |
| View All | Exam timetables, events, notices, departments |

#### Cannot:
- Edit timetable
- Edit academic structure
- Manage library/bus/canteen/fees

---

### 🟦 3. DEPARTMENT ADMIN

*Manages department-level users & info.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| View Dept Students | List of department students |
| Block/Unblock Dept Students | Department level only |
| View Dept Teachers | List of department teachers |
| View Dept Attendance | Department attendance data |
| View Dept Exam Timetable | Department exams only |
| View Planner/Diary Status | Status only (no approvals) |
| Publish Dept Notices | Department-only notices |

#### Cannot:
- Approve planners/diaries
- Approve library requests
- Edit timetable
- Set exam dates

---

### 🟨 4. HOD (Department Academic Head)

*Teacher role with admin-like powers.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| Approve Weekly Planner | First-level approval |
| Approve Monthly Diary | Level 1 (before Principal) |
| Assign Subjects | Assign subjects to teachers |
| Assign Substitutes | Assign substitute teachers |
| View Dept Analytics | Department performance |
| Publish Dept Academic Notices | Department notices |

---

### 🟥 5. EXAM CELL ADMIN

*Manages all exam-related operations.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| Set Exam Dates | Internal, Model, University |
| Assign Exam Rooms | Optional room assignment |
| Publish Exam Timetable | Push to students & teachers |
| Verify Internal Marks | Verify teacher uploads |
| Verify External Marks | Verify student uploads |
| Push Exam Notifications | Exam alerts |
| View Exam Analytics | Exam performance data |

#### Cannot:
- Upload marks themselves (Teachers upload internal, Students upload external)

---

### 🟫 6. LIBRARY ADMIN

*Full library management.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| Add/Edit Books | Book inventory management |
| Issue/Return/Renew | Book transactions |
| Manage Availability | Stock and availability |
| Reservation Queue | Notify next student |
| Library Analytics | Usage statistics |

---

### 🟪 7. BUS ADMIN

*Transportation management.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| Create/Edit Routes | Bus route management |
| Add Stops & Timings | Stop and time management |
| Approve Bus Selection | Student bus approvals |
| Update Arrival Times | Daily timing updates |
| Publish Bus Alerts | Holiday/payment alerts |

---

### 🟫 8. CANTEEN ADMIN

*Canteen token system management.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| Add/Edit Menu | Daily menu management |
| Mark Sold Out | Availability updates |
| View Tokens | All student tokens |
| Update Token Status | Ready/collected/refunded |
| Sales Summary | Canteen analytics |

---

### 🟫 9. FINANCE / FEE ADMIN

*Fee and payment management.*

#### Permissions:
| Permission | Description |
|------------|-------------|
| Add Fee Structure | Semester-wise fee setup |
| Verify Payments | Payment verification |
| Upload Receipts | Receipt management |
| Send Fee Reminders | Due date notifications |
| Fee Analytics | Payment statistics |

---

📌 **Only these 9 roles = TRUE ADMIN ROLES.**
📌 **All teaching roles (Coordinator, Class Teacher, Subject Teacher) are NOT admins.**

---

## ⭐ SECTION 2 — ADMIN MODULE (FULL FEATURE LIST)

---

### 🟥 0) Authentication (Email Only)

#### Features
| Feature | Description |
|---------|-------------|
| Email Login | Email + password login |
| Forgot Password | Email reset link |
| Multi-role Access | Access multiple admin roles |
| Secure Sessions | JWT-based sessions |

#### Functions
```typescript
// Admin Auth
loginAdmin(email, password)
sendPasswordResetLink(email)
resetPassword(token, newPassword)
getAdminRoles(userId) → Role[]
validateSession() → boolean
logout()
```

**NO phone login anywhere.**

---

### 🟥 1) User Management

#### Teachers:
| Feature | Description |
|---------|-------------|
| Create Teacher | Add new teacher account |
| Edit Teacher | Update teacher info |
| Assign Teacher Roles | Subject/Class/Mentor/Coordinator/HoD |
| Assign Department | Link to department |
| Disable/Enable Teacher | Active status toggle |
| Reset Password | Admin password reset |

#### Students:
| Feature | Description |
|---------|-------------|
| View Student List | All students with filters |
| Block/Unblock | Active status toggle |
| Approve External Uploads | Verify external result PDFs |
| Edit Contact Details | Email/phone updates |

#### Permissions:
- Super Admin → Full access
- Dept Admin → View/block department only

#### Functions
```typescript
// Teacher Management
createTeacher(teacherData)
updateTeacher(teacherId, updates)
assignTeacherRole(teacherId, role)
assignDepartment(teacherId, departmentId)
toggleTeacherStatus(teacherId, isActive)
resetTeacherPassword(teacherId)

// Student Management
getStudentList(filters) → Student[]
toggleStudentBlock(studentId, blocked)
approveExternalUpload(uploadId)
updateStudentContact(studentId, contactData)
```

---

### 🟥 2) Academic Structure

#### Features
| Feature | Description |
|---------|-------------|
| Departments | Create/Edit departments |
| Courses | Create/Edit courses |
| Years/Semesters | Academic year structure |
| Divisions | Class divisions |
| Subjects | Subject master |
| Subject Mapping | Map subjects to departments |
| Honors/Minor Rules | Major-Minor setup (NO credit system) |

#### Functions
```typescript
// Academic Structure
createDepartment(name, shortName)
updateDepartment(deptId, updates)
createCourse(courseData)
updateCourse(courseId, updates)
createAcademicYear(year, startDate, endDate)
createSemester(yearId, semesterData)
createDivision(courseId, divisionData)
createSubject(subjectData)
mapSubjectToDepartment(subjectId, departmentId)
setupMinorRules(minorConfig) // NO credit tracking
```

---

### 🟥 3) Exam Management

#### A. Exam Date Assignment
| Feature | Description |
|---------|-------------|
| Internal Exam Schedule | Set internal exam dates |
| Model Exam Schedule | Set model exam dates |
| University Exam Schedule | Set university exam dates |
| Subject-wise Date/Time | Per-subject scheduling |
| Room Assignment | Optional room allocation |

#### B. Exam Timetable Publishing
| Feature | Description |
|---------|-------------|
| Publish to Students | Student-facing timetable |
| Publish to Teachers | Teacher-facing timetable |
| Push Notifications | Exam alerts |

#### C. Marks System
| Role | Action |
|------|--------|
| Teachers | Upload internal marks |
| Students | Upload external marks (PDF/photo) |
| Exam Cell Admin | Verify internal marks |
| Exam Cell Admin | Verify external marks |

**NO marks upload by admin.**

#### Functions
```typescript
// Exam Scheduling
setExamSchedule(examType, scheduleData)
assignExamRoom(examId, roomId)
publishExamTimetable(semesterId, targetAudience)
sendExamNotification(examId, message)

// Marks Verification (Exam Cell Admin)
getInternalMarksForVerification(examId) → MarksSubmission[]
verifyInternalMarks(submissionId, status, remarks)
getExternalUploadsForVerification() → ExternalUpload[]
verifyExternalUpload(uploadId, status, remarks)

// Analytics
getExamAnalytics(examId) → ExamStats
getDepartmentExamPerformance(deptId) → PerformanceData
```

---

### 🟥 4) Attendance Control

#### Features
| Feature | Description |
|---------|-------------|
| View Attendance | Class-wise + dept-wise view |
| Edit Attendance | Correct mistakes (logged) |
| Set Rules | Attendance percentage rules |
| Publish Shortage List | Low attendance alerts |

#### Functions
```typescript
// Attendance Admin
getClassAttendance(classId, dateRange) → AttendanceData[]
getDepartmentAttendance(deptId, dateRange) → AttendanceData[]
editAttendance(attendanceId, newStatus, reason) // Logged in audit
setAttendanceRules(rules: {minPercentage, warningThreshold})
publishShortageList(semesterId) → ShortageReport
```

---

### 🟥 5) Timetable Management

#### Features
| Feature | Description |
|---------|-------------|
| Create Master Timetable | Weekly timetable |
| Assign Teachers | Teachers to subjects/periods |
| Add Rooms | Room allocation |
| Publish Timetable | Make live |
| Edit Live Timetable | Real-time updates |
| Override Substitution | Manual substitute override |

#### Functions
```typescript
// Timetable Admin
createMasterTimetable(semesterId, timetableData)
assignTeacherToPeriod(periodId, teacherId)
assignRoomToPeriod(periodId, roomId)
publishTimetable(timetableId)
updateLiveTimetable(periodId, updates)
overrideSubstitution(periodId, substituteTeacherId)
```

---

### 🟥 6) Lesson Planner & Work Diary

#### Workflow:
| Role | Action |
|------|--------|
| Teacher | Submits planner/diary |
| HoD | First-level approval |
| Principal | Final approval (diary) / Monitors (planner) |
| Admin | Monitor only (NO approvals) |

#### Functions
```typescript
// Admin Monitoring Only
getAllPlannerStatus(filters) → PlannerStatus[]
getAllDiaryStatus(filters) → DiaryStatus[]
getPlannerAnalytics(departmentId) → PlannerStats
getDiaryAnalytics(departmentId) → DiaryStats
// NO approval functions for admin
```

---

### 🟥 7) Notice System

#### Features
| Feature | Description |
|---------|-------------|
| College-wide Notices | All users |
| Department Notices | Department specific |
| Teacher-only Notices | Teachers only |
| Class Notices | Year/Sem/Class specific |
| Attachments | PDF/Image attachments |
| Schedule Notices | Future publishing |
| Push Notifications | Instant alerts |

#### Functions
```typescript
// Notice Management
createNotice(noticeData: {
  title: string,
  content: string,
  audience: 'all' | 'department' | 'teachers' | 'class',
  departmentId?: UUID,
  yearId?: UUID,
  attachments?: File[],
  scheduledAt?: Date
})
publishNotice(noticeId)
scheduleNotice(noticeId, publishAt)
sendPushNotification(noticeId)
```

---

### 🟥 8) Library Management

#### Features
| Feature | Description |
|---------|-------------|
| Add/Edit Books | Book inventory |
| Issue/Return/Renew | Transactions |
| Availability Control | Stock management |
| Reservation Queue | Next student notification |
| Library Analytics | Usage stats |

**NO fines auto-calculation, NO QR.**

#### Functions
```typescript
// Library Admin
addBook(bookData)
updateBook(bookId, updates)
issueBook(bookId, studentId, dueDate)
returnBook(transactionId)
renewBook(transactionId, newDueDate)
manageAvailability(bookId, available)
processReservationQueue(bookId) // Notify next student
getLibraryAnalytics() → LibraryStats
```

---

### 🟥 9) Bus Management

#### Features
| Feature | Description |
|---------|-------------|
| Create Bus Routes | Route master |
| Add Stops & Timings | Stop schedule |
| Approve Bus Selection | Student approvals |
| Update Arrival Times | Daily updates |
| Holiday Alerts | Bus service alerts |

#### Functions
```typescript
// Bus Admin
createBusRoute(routeData)
updateBusRoute(routeId, updates)
addStopToRoute(routeId, stopData)
updateStopTiming(stopId, timing)
approveStudentBusSelection(selectionId)
updateArrivalTime(routeId, arrivalTime)
publishBusAlert(alertData)
```

---

### 🟥 10) Canteen Management

#### Features
| Feature | Description |
|---------|-------------|
| Add Daily Menu | Menu items |
| Set Prices | Item pricing |
| Mark Sold Out | Availability |
| View Tokens | All student tokens |
| Update Token Status | Ready/collected |
| Sales Summary | Daily reports |

#### Functions
```typescript
// Canteen Admin
addMenuItem(menuData)
updateMenuItem(itemId, updates)
markSoldOut(itemId, soldOut)
getTodayTokens() → Token[]
updateTokenStatus(tokenId, status: 'ready' | 'collected')
getSalesSummary(dateRange) → SalesReport
```

---

### 🟥 11) Fee Management

#### Features
| Feature | Description |
|---------|-------------|
| Add Fee Structure | Semester fees |
| Verify Payment | Payment confirmation |
| Upload Receipt | Receipt management |
| Send Reminder | Due date alerts |
| Fee Analytics | Payment stats |

#### Functions
```typescript
// Finance Admin
createFeeStructure(feeData)
updateFeeStructure(feeId, updates)
verifyPayment(paymentId, verified)
uploadReceipt(paymentId, receiptFile)
sendFeeReminder(studentId | batchReminder)
getFeeAnalytics() → FeeStats
```

---

### 🟥 12) Event Management (External Link Only)

#### Features
| Feature | Description |
|---------|-------------|
| Create Event | Event master |
| Event Details | Title, description, date, venue |
| Add Poster | Event poster image |
| External Registration Link | Third-party registration |
| Publish Event | Make visible |
| Optional Certificate | Upload after event |

**NO QR, NO attendance, NO deadlines, NO internal registration.**

#### Functions
```typescript
// Event Admin
createEvent(eventData: {
  title: string,
  description: string,
  eventDate: Date,
  startTime: Time,
  endTime: Time,
  venue: string,
  posterUrl?: string,
  externalRegistrationLink: string // REQUIRED
})
updateEvent(eventId, updates)
publishEvent(eventId)
uploadCertificate(eventId, certificateFile) // Optional post-event
```

---

### 🟥 13) Event Calendar System

#### Student Calendar:
- Events
- Exam timetable
- Holidays

#### Teacher Calendar:
- Events
- Meetings
- Planner deadlines
- Diary deadlines
- Exam timetable

#### Functions
```typescript
// Calendar
getStudentCalendar(studentId, month) → CalendarEvents[]
getTeacherCalendar(teacherId, month) → CalendarEvents[]
addHoliday(date, description)
addMeeting(meetingData)
```

---

### 🟥 14) Analytics & Reports

#### Available Analytics:
| Report | Description |
|--------|-------------|
| Attendance Analytics | Class/dept attendance trends |
| Exam Analytics | Performance by exam/subject |
| Dept Performance | Department comparisons |
| Library Usage | Book circulation stats |
| Bus Usage | Route utilization |
| Canteen Reports | Sales and token data |
| Fee Analytics | Payment statistics |
| Export | PDF/CSV export |

#### Functions
```typescript
// Analytics
getAttendanceAnalytics(filters) → AttendanceReport
getExamAnalytics(filters) → ExamReport
getDepartmentPerformance(deptId) → PerformanceReport
getLibraryUsage(dateRange) → LibraryReport
getBusUsage(dateRange) → BusReport
getCanteenReports(dateRange) → CanteenReport
getFeeAnalytics(dateRange) → FeeReport
exportReport(reportType, format: 'pdf' | 'csv')
```

---

### 🟥 15) Audit Logging

#### Logged Actions:
- Attendance edits
- Exam timetable updates
- External mark approvals
- Planner/Diary approvals
- Library issue/return
- Bus route changes
- Notice publishing
- Event edits
- Canteen menu edits
- User status changes
- Role assignments

#### Functions
```typescript
// Audit
getAuditLog(entityType, entityId) → AuditEntry[]
getAuditLogByUser(userId, dateRange) → AuditEntry[]
searchAuditLog(searchParams) → AuditEntry[]
```

---

### 🟥 16) Global Settings

#### Features
| Feature | Description |
|---------|-------------|
| Academic Year | Start/end dates |
| College Info | Name, logo, contact |
| Module Enable/Disable | Feature toggles |
| Backup/Restore | Data backup |
| Maintenance Mode | System maintenance |
| Force Logout | Logout all users |

#### Functions
```typescript
// Settings
setAcademicYear(startDate, endDate)
updateCollegeInfo(infoData)
toggleModule(moduleName, enabled)
createBackup() → BackupId
restoreFromBackup(backupId)
setMaintenanceMode(enabled)
forceLogoutAllUsers()
```

---

## ⭐ SECTION 3 — ADMIN WORKFLOWS (END-TO-END)

---

### 🔵 WORKFLOW 1: EXAM WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Admin/Exam Cell → Set exam dates (Internal/Model/University)│
│                ↓                                            │
│ Admin/Exam Cell → Publish exam timetable                    │
│                ↓                                            │
│ Teacher → Upload internal marks                             │
│                ↓                                            │
│ Student → Upload external marks (PDF/photo)                 │
│                ↓                                            │
│ Exam Cell Admin → Verify internal marks                     │
│ Exam Cell Admin → Verify external results                   │
│                ↓                                            │
│ Principal/Super Admin → View analytics                      │
└─────────────────────────────────────────────────────────────┘
```

---

### 🟢 WORKFLOW 2: ATTENDANCE WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Teacher → Marks attendance (subject-wise)                   │
│                ↓                                            │
│ HoD → Monitors department attendance                        │
│                ↓                                            │
│ Admin → Corrects mistakes (logged in audit)                 │
│                ↓                                            │
│ Admin → Publishes shortage lists                            │
│                ↓                                            │
│ Student → Views attendance                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### 🟣 WORKFLOW 3: LESSON PLANNER WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Teacher → Submits weekly planner                            │
│                ↓                                            │
│ HoD → Approves planner (Level 1)                            │
│                ↓                                            │
│ Principal → Monitors planner status                         │
│                ↓                                            │
│ Admin → Observes only (no approvals)                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 🔴 WORKFLOW 4: WORK DIARY WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Teacher → Submits monthly work diary                        │
│                ↓                                            │
│ HoD → Approves diary (Level 1)                              │
│                ↓                                            │
│ Principal → Final approval                                  │
│                ↓                                            │
│ Admin → Monitors only (no approvals)                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 🟡 WORKFLOW 5: EVENT WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Admin → Creates event                                       │
│                ↓                                            │
│ Admin → Adds external registration link                     │
│                ↓                                            │
│ System → Publishes on calendars                             │
│                ↓                                            │
│ Students/Teachers → Click link to register externally       │
│                ↓                                            │
│ Admin → Optionally uploads certificates post-event          │
└─────────────────────────────────────────────────────────────┘
```

**NO QR, NO internal registration, NO attendance tracking.**

---

### 🟤 WORKFLOW 6: LIBRARY WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Student → Requests book (or walks in)                       │
│                ↓                                            │
│ Library Admin → Issues book                                 │
│                ↓                                            │
│ Student → Returns or renews book                            │
│                ↓                                            │
│ Library Admin → Processes return/renewal                    │
│                ↓                                            │
│ Library Admin → Notifies next student in reservation queue  │
└─────────────────────────────────────────────────────────────┘
```

---

### 🟠 WORKFLOW 7: BUS WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Student → Selects bus route (one-time)                      │
│                ↓                                            │
│ Bus Admin → Approves bus selection                          │
│                ↓                                            │
│ Bus Admin → Updates timings daily                           │
│                ↓                                            │
│ Student → Views route & arrival time                        │
└─────────────────────────────────────────────────────────────┘
```

---

### 🟣 WORKFLOW 8: FEE WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ Admin → Adds fee structure                                  │
│                ↓                                            │
│ Student → Pays online or uploads payment proof              │
│                ↓                                            │
│ Finance Admin → Verifies payment                            │
│                ↓                                            │
│ Admin → Uploads receipt (if manual)                         │
│                ↓                                            │
│ Admin → Sends reminders for dues                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 🗄️ Admin Module - Database Tables

#### Tables Required

```sql
-- 1. Events (External Link System)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(20), -- cultural/technical/sports/workshop/seminar
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(200),
  poster_url TEXT,
  external_registration_link TEXT NOT NULL, -- REQUIRED
  is_published BOOLEAN DEFAULT false,
  certificate_template_url TEXT, -- Optional for post-event
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NO event_registrations table (external registration only)
-- NO event_attendance table (no attendance tracking)

-- 2. Admin Settings
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Holidays
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL,
  description VARCHAR(200),
  affects VARCHAR(20) DEFAULT 'all', -- all/students/teachers
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Meetings (Teacher Calendar)
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(200),
  attendee_type VARCHAR(20), -- all_teachers/department/individual
  department_id UUID REFERENCES departments(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Module Toggles
CREATE TABLE module_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name VARCHAR(50) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 📊 Admin Module - Zustand Stores

```
store/
├── adminAuthStore.ts              ❌ TODO
│   - adminUser, roles
│   - loginAdmin(), logout(), getRoles()
│
├── userManagementStore.ts         ❌ TODO
│   - teachers, students
│   - createTeacher(), updateTeacher(), toggleStatus()
│
├── academicStructureStore.ts      ❌ TODO
│   - departments, courses, subjects
│   - createDepartment(), createCourse(), mapSubject()
│
├── examAdminStore.ts              ❌ TODO
│   - examSchedules, marksVerification
│   - setExamSchedule(), verifyMarks()
│
├── attendanceAdminStore.ts        ❌ TODO
│   - attendanceData, shortageList
│   - editAttendance(), publishShortageList()
│
├── timetableAdminStore.ts         ❌ TODO
│   - masterTimetable, assignments
│   - createTimetable(), publishTimetable()
│
├── noticeAdminStore.ts            ❌ TODO
│   - notices, scheduled
│   - createNotice(), publishNotice()
│
├── libraryAdminStore.ts           ❌ TODO
│   - books, transactions
│   - addBook(), issueBook(), returnBook()
│
├── busAdminStore.ts               ❌ TODO
│   - routes, approvals
│   - createRoute(), approveBusSelection()
│
├── canteenAdminStore.ts           ❌ TODO
│   - menu, tokens
│   - addMenuItem(), updateTokenStatus()
│
├── feeAdminStore.ts               ❌ TODO
│   - feeStructure, payments
│   - createFeeStructure(), verifyPayment()
│
├── eventAdminStore.ts             ❌ TODO
│   - events
│   - createEvent(), publishEvent()
│
├── analyticsStore.ts              ❌ TODO
│   - reports
│   - getAnalytics(), exportReport()
│
├── auditStore.ts                  ❌ TODO
│   - auditLogs
│   - getAuditLog(), searchAuditLog()
│
└── settingsAdminStore.ts          ❌ TODO
    - settings, academicYear
    - updateSettings(), toggleModule(), forceLogout()
```

---

### 📱 Admin Module - Screen Architecture

```
app/(admin)/
├── _layout.tsx                    ✅ Built
├── dashboard.tsx                  ⚠️ Basic (needs enhancement)
│
├── users/
│   ├── teachers/
│   │   ├── index.tsx              ❌ TODO - Teacher list
│   │   ├── create.tsx             ❌ TODO - Create teacher
│   │   ├── [teacherId].tsx        ❌ TODO - Teacher details
│   │   └── roles.tsx              ❌ TODO - Assign roles
│   └── students/
│       ├── index.tsx              ❌ TODO - Student list
│       ├── [studentId].tsx        ❌ TODO - Student details
│       └── external-uploads.tsx   ❌ TODO - Verify uploads
│
├── academic/
│   ├── departments.tsx            ❌ TODO - Department management
│   ├── courses.tsx                ❌ TODO - Course management
│   ├── subjects.tsx               ❌ TODO - Subject management
│   ├── semesters.tsx              ❌ TODO - Semester management
│   └── minor-programs.tsx         ❌ TODO - Minor setup (no credits)
│
├── exams/
│   ├── schedule.tsx               ❌ TODO - Set exam dates
│   ├── timetable.tsx              ❌ TODO - Publish timetable
│   ├── verify-internal.tsx        ❌ TODO - Verify internal marks
│   ├── verify-external.tsx        ❌ TODO - Verify external marks
│   └── analytics.tsx              ❌ TODO - Exam analytics
│
├── attendance/
│   ├── view.tsx                   ❌ TODO - View attendance
│   ├── edit.tsx                   ❌ TODO - Edit with logging
│   ├── rules.tsx                  ❌ TODO - Set rules
│   └── shortage.tsx               ❌ TODO - Shortage list
│
├── timetable/
│   ├── create.tsx                 ❌ TODO - Create master
│   ├── assign.tsx                 ❌ TODO - Assign teachers
│   ├── rooms.tsx                  ❌ TODO - Room management
│   └── publish.tsx                ❌ TODO - Publish timetable
│
├── planner-diary/
│   ├── planners.tsx               ❌ TODO - Monitor planners
│   └── diaries.tsx                ❌ TODO - Monitor diaries
│
├── notices/
│   ├── index.tsx                  ✅ Built
│   ├── create.tsx                 ❌ TODO - Create notice
│   └── scheduled.tsx              ❌ TODO - Scheduled notices
│
├── library/
│   ├── books.tsx                  ❌ TODO - Book management
│   ├── issue-return.tsx           ❌ TODO - Transactions
│   ├── reservations.tsx           ❌ TODO - Queue management
│   └── analytics.tsx              ❌ TODO - Library stats
│
├── bus/
│   ├── routes.tsx                 ❌ TODO - Route management
│   ├── stops.tsx                  ❌ TODO - Stop management
│   ├── approvals.tsx              ❌ TODO - Student approvals
│   └── alerts.tsx                 ❌ TODO - Holiday alerts
│
├── canteen/
│   ├── menu.tsx                   ❌ TODO - Menu management
│   ├── tokens.tsx                 ❌ TODO - Token view
│   └── reports.tsx                ❌ TODO - Sales reports
│
├── fees/
│   ├── structure.tsx              ❌ TODO - Fee structure
│   ├── payments.tsx               ❌ TODO - Payment verification
│   ├── receipts.tsx               ❌ TODO - Receipt management
│   └── reminders.tsx              ❌ TODO - Send reminders
│
├── events/
│   ├── index.tsx                  ❌ TODO - Event list
│   ├── create.tsx                 ❌ TODO - Create event (external link)
│   └── certificates.tsx           ❌ TODO - Upload certificates
│
├── calendar/
│   ├── holidays.tsx               ❌ TODO - Holiday management
│   └── meetings.tsx               ❌ TODO - Meeting scheduler
│
├── analytics/
│   ├── attendance.tsx             ❌ TODO - Attendance reports
│   ├── exams.tsx                  ❌ TODO - Exam reports
│   ├── departments.tsx            ❌ TODO - Dept performance
│   └── export.tsx                 ❌ TODO - Export reports
│
├── audit/
│   └── logs.tsx                   ❌ TODO - Audit log viewer
│
└── settings/
    ├── academic-year.tsx          ❌ TODO - Year settings
    ├── college-info.tsx           ❌ TODO - College details
    ├── modules.tsx                ❌ TODO - Module toggles
    ├── backup.tsx                 ❌ TODO - Backup/restore
    └── maintenance.tsx            ❌ TODO - Maintenance mode
```

### ⚡ System Rules Applied
- ✅ **Email-only registration** (NO mobile OTP)
- ✅ **Email login** (Email + Password)
- ✅ **Profile photo upload by students**
- ✅ **Students upload external marks** (Teachers upload internal only)
- ✅ **Bus selection requires admin approval**
- ✅ **NO event QR attendance** (Manual/simple registration only)
- ✅ **Honors/Major-Minor system** (NO credit tracking)
- ✅ **Canteen Token System** (Online payment → Token → Collect/Refund)

---

### ⭐ 1. AUTHENTICATION & PROFILE

#### Features
| Feature | Description |
|---------|-------------|
| Create Account | Email + Password registration |
| Login/Logout | Email + Password |
| Forgot Password | Reset via email link |
| Profile View | Complete student profile |
| Profile Edit | Update allowed fields |
| Photo Upload | Student uploads/changes profile photo |
| Auto-sync | Course + Year + Department auto-linked |

#### Functions
```typescript
// Auth Functions
registerWithEmail(email, password, profileData)
verifyEmail(token) // Email verification link
loginWithEmail(email, password)
logout()
forgotPassword(email)
resetPassword(token, newPassword)

// Profile Functions
getProfile(studentId) → StudentProfile
updateProfile(studentId, updates)
uploadProfilePhoto(studentId, file) → photoUrl // Student uploads
syncAcademicInfo(studentId) // Auto-sync course/year/dept
```

---

### ⭐ 2. DASHBOARD (HOME)

#### Features
| Feature | Description |
|---------|-------------|
| Today's Timetable | Current day class schedule |
| Quick Attendance % | Overall attendance percentage |
| Assignment Alerts | Pending/due assignments |
| Internal Marks Snapshot | Latest marks overview |
| Canteen Menu | Today's menu items |
| Bus Arrival Time | Expected bus time (if subscribed) |
| Library Shortcut | Borrowed books quick view |
| Notifications Hub | All notifications in one place |

#### Functions
```typescript
// Dashboard Functions
getDashboardData(studentId) → {
  todayTimetable: Period[],
  attendancePercentage: number,
  pendingAssignments: Assignment[],
  recentMarks: Marks[],
  todayMenu: MenuItem[],
  busArrivalTime: string | null,
  borrowedBooks: Book[],
  notifications: Notification[]
}

refreshDashboard(studentId)
markNotificationRead(notificationId)
```

---

### ⭐ 3. ATTENDANCE MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Subject-wise % | Attendance percentage per subject |
| Daily Timeline | Detailed daily attendance log |
| Monthly Calendar | Calendar view with P/A/L markers |
| Shortage Alerts | Alerts when below threshold |
| Rules Display | 80% minimum rule, consequences |

#### Functions
```typescript
// Attendance Functions
getSubjectWiseAttendance(studentId, semesterId) → SubjectAttendance[]
getDailyAttendance(studentId, date) → DailyAttendance
getMonthlyCalendar(studentId, month, year) → CalendarData
getAttendanceShortages(studentId) → ShortageAlert[]
getAttendanceRules() → Rules

// Types
interface SubjectAttendance {
  courseId: string;
  courseName: string;
  totalClasses: number;
  present: number;
  absent: number;
  percentage: number;
  isShortage: boolean;
}
```

---

### ⭐ 4. TIMETABLE MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Day-wise View | Today's schedule |
| Weekly View | Full week timetable |
| Substitution Alerts | Teacher substitution notices |
| Class Info | Classroom & teacher details |

#### Functions
```typescript
// Timetable Functions
getDailyTimetable(sectionId, date) → Period[]
getWeeklyTimetable(sectionId) → WeeklySchedule
getSubstitutionAlerts(sectionId) → Substitution[]

// Types
interface Period {
  periodNumber: number;
  startTime: string;
  endTime: string;
  courseName: string;
  teacherName: string;
  classroom: string;
  isSubstitute: boolean;
  substituteTeacher?: string;
}
```

---

### ⭐ 5. ASSIGNMENTS MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Subject-wise List | Assignments grouped by subject |
| Due Dates Calendar | Calendar with assignment due dates |
| Upload Submission | Submit PDF/Photo |
| Status Tracking | Pending/Submitted/Graded |
| Teacher Feedback | View grades and comments |

#### Functions
```typescript
// Assignment Functions
getAssignments(studentId, filters?) → Assignment[]
getAssignmentDetails(assignmentId) → AssignmentDetail
uploadSubmission(assignmentId, file: PDF | Image) → Submission
getSubmissionStatus(assignmentId, studentId) → Status
getTeacherFeedback(submissionId) → Feedback

// Types
interface Assignment {
  id: string;
  title: string;
  courseName: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  marks?: number;
  maxMarks: number;
}
```

---

### ⭐ 6. ACADEMIC MATERIALS MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Subject-wise Materials | Materials organized by subject |
| Material Types | Notes, PPT, PDFs, Videos, Links |
| Downloads Section | Downloaded materials offline |
| Search | Search within subjects |

#### Functions
```typescript
// Materials Functions
getMaterials(courseId) → Material[]
getMaterialsBySubject(studentId) → { [courseId]: Material[] }
downloadMaterial(materialId) → FileBlob
searchMaterials(query, courseId?) → Material[]
getDownloadedMaterials() → Material[] // Offline

// Types
interface Material {
  id: string;
  title: string;
  description: string;
  type: 'notes' | 'ppt' | 'pdf' | 'video' | 'link';
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileSize: number;
}
```

---

### ⭐ 7. INTERNAL MARKS MODULE

#### Features
| Feature | Description |
|---------|-------------|
| CAT/Series Marks | Continuous Assessment Test marks |
| Assignment Marks | Marks from assignments |
| Attendance Marks | Marks based on attendance |
| Final Internal | Calculated final internal marks |
| Semester Breakdown | Semester-wise marks history |

#### Functions
```typescript
// Internal Marks Functions
getInternalMarks(studentId, semesterId) → InternalMarks[]
getMarkBreakdown(studentId, courseId) → MarkBreakdown
getSemesterHistory(studentId) → SemesterMarks[]

// Types
interface InternalMarks {
  courseId: string;
  courseName: string;
  cat1: number;
  cat2: number;
  cat3: number;
  assignmentMarks: number;
  attendanceMarks: number;
  totalInternal: number;
  maxInternal: number;
}

interface MarkBreakdown {
  courseId: string;
  components: {
    name: string;
    marks: number;
    maxMarks: number;
    weightage: number;
  }[];
  finalInternal: number;
}
```

---

### ⭐ 8. LIBRARY MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Search Books | Search by title, author, ISBN |
| Borrowed Books | Currently borrowed list |
| Due Dates | Return due dates |
| Renew Book | Renew if eligible |
| Fine Details | Outstanding fines |
| Book Request | Request unavailable books |
| Reservation | Reserve books (if allowed) |

#### Functions
```typescript
// Library Functions
searchBooks(query, filters?) → Book[]
getBorrowedBooks(studentId) → BorrowedBook[]
getBookDueDates(studentId) → DueDate[]
renewBook(transactionId) → RenewalResult
getFineDetails(studentId) → Fine[]
requestBook(bookId, studentId) → Request
reserveBook(bookId, studentId) → Reservation

// Types
interface BorrowedBook {
  transactionId: string;
  bookId: string;
  title: string;
  author: string;
  issuedDate: Date;
  dueDate: Date;
  isOverdue: boolean;
  fineAmount: number;
  canRenew: boolean;
}
```

---

### ⭐ 9. EXAM SECTION

#### Features
| Feature | Description |
|---------|-------------|
| Exam Timetable | Upcoming exam schedule |
| Hall Ticket | Download hall ticket PDF |
| Internal Results | View internal marks |
| External Results | View external exam results |
| Pass/Fail Indicators | Clear status indicators |
| Grade Points | Subject-wise grade points |
| SGPA/CGPA | Semester and cumulative GPA |

#### Functions
```typescript
// Exam Functions
getExamTimetable(studentId, examType?) → ExamSchedule[]
downloadHallTicket(studentId, examId) → PDFBlob
getInternalResults(studentId, semesterId) → InternalResult[]
getExternalResults(studentId, semesterId) → ExternalResult[]
uploadExternalMarks(studentId, examId, marks) → Result // Student uploads
getGradePoints(studentId, semesterId) → GradePoint[]
getSGPA(studentId, semesterId) → number
getCGPA(studentId) → number

// Types
interface ExamResult {
  courseId: string;
  courseName: string;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: string;
  gradePoint: number;
  credits: number;
  status: 'pass' | 'fail' | 'withheld';
}
```

---

### ⭐ 10. CANTEEN MODULE (Complete Token System)

#### 🎯 How It Works
```
Pay Online → Token Generated → Staff Updates → Collect Food OR Refund
```

#### Features
| Feature | Description |
|---------|-------------|
| Daily Menu | Today's available items with prices |
| Online Payment | Pay for food inside app (mandatory) |
| Token Generation | Get token number after successful payment |
| My Orders | View token status (pending/ready/done) |
| Availability | "Sold Out" / "Available" indicators |

#### Token Statuses
| Status | Meaning |
|--------|--------|
| `pending` | Student paid, waiting for food preparation |
| `ready` | Canteen prepared food, come collect |
| `done` | Student collected the food |
| `refunded` | Student didn't collect / couldn't serve → money returned |

#### Student Functions
```typescript
// Menu Functions
getDailyMenu(date?) → MenuItem[]
checkAvailability(itemId) → boolean

// Order & Payment Functions
initiatePayment(items: OrderItem[]) → PaymentSession
verifyPayment(paymentId, transactionId) → PaymentResult
generateToken(paymentId) → Token // Called after payment success

// My Orders Functions
getMyOrders(studentId) → Token[]
getOrderStatus(tokenId) → TokenStatus
getOrderHistory(studentId, dateRange?) → Token[]

// Types
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'snacks' | 'beverages';
  isAvailable: boolean;
  soldOut: boolean;
  image?: string;
}

interface Token {
  tokenNumber: number; // Resets daily (1, 2, 3...)
  studentId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentId: string;
  status: 'pending' | 'ready' | 'done' | 'refunded';
  orderTime: Date;
  readyTime?: Date;
  collectedTime?: Date;
  refundedTime?: Date;
}
```

#### Staff Dashboard Functions (Canteen Admin)
```typescript
// View Orders
getAllTokens(date: Date) → Token[]
getPendingTokens() → Token[]
getReadyTokens() → Token[]

// Update Status
markAsReady(tokenId) → Result     // Food prepared
markAsCollected(tokenId) → Result // Student collected
initiateRefund(tokenId) → Result  // Refund money

// Daily Reset
resetDailyTokens() → Result // Runs at midnight, token numbers restart from 1

// Reports
getDailySalesReport(date) → SalesReport
getRefundReport(dateRange) → RefundReport
```

#### Canteen System Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT FLOW                              │
├─────────────────────────────────────────────────────────────┤
│  1. Browse Menu → 2. Add Items → 3. Pay Online              │
│       ↓                                                      │
│  4. Payment Verified → 5. Token #43 Generated               │
│       ↓                                                      │
│  6. Check "My Orders" → Status: pending/ready/done          │
│       ↓                                                      │
│  7. When status = "ready" → Go collect food                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    STAFF FLOW                                │
├─────────────────────────────────────────────────────────────┤
│  1. View Dashboard → See all pending tokens                 │
│       ↓                                                      │
│  2. Prepare food → Press "Ready" button                     │
│       ↓                                                      │
│  3. Student comes → Press "Collected" button                │
│       ↓                                                      │
│  OR Student doesn't come → Press "Refund" button            │
│       ↓                                                      │
│  4. Daily reset at midnight → Token #1 starts again         │
└─────────────────────────────────────────────────────────────┘
```

---

### ⭐ 11. BUS MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Bus Selection | Select bus route (once, needs approval) |
| Route Overview | View route map/stops |
| Arrival Time | Expected bus arrival time |
| Payment Alerts | Fee payment reminders |
| Holiday Alerts | Bus holiday notifications |
| **NO** driver/conductor details | Privacy restriction |
| **NO** pickup/drop listing | Privacy restriction |

#### Functions
```typescript
// Bus Functions
getAvailableRoutes() → BusRoute[]
selectBusRoute(studentId, routeId, pickupStop) → PendingApproval
getBusSubscription(studentId) → BusSubscription | null
getRouteOverview(routeId) → RouteOverview
getArrivalTime(routeId, stopId) → ArrivalTime
getBusPaymentAlerts(studentId) → PaymentAlert[]
getHolidayAlerts() → HolidayAlert[]

// Types
interface BusSubscription {
  routeId: string;
  routeName: string;
  pickupStop: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  feePaid: boolean;
  academicYear: string;
}

interface RouteOverview {
  routeId: string;
  routeName: string;
  stops: string[]; // Stop names only, no specific timing
  vehicleNumber: string;
  estimatedDuration: string;
}
```

---

### ⭐ 12. NOTICES & ANNOUNCEMENTS

#### Features
| Feature | Description |
|---------|-------------|
| College Notices | General college announcements |
| Department Notices | Department-specific notices |
| Exam Notifications | Exam-related updates |
| Event Updates | Event announcements |
| Push Notifications | Real-time push alerts |

#### Functions
```typescript
// Notice Functions
getNotices(filters?: NoticeFilters) → Notice[]
getCollegeNotices() → Notice[]
getDepartmentNotices(departmentId) → Notice[]
getExamNotifications(studentId) → Notice[]
getEventUpdates() → Notice[]
markNoticeRead(noticeId, studentId)

// Push Notification Functions
registerPushToken(studentId, token)
getUnreadCount(studentId) → number

// Types
interface Notice {
  id: string;
  title: string;
  content: string;
  category: 'college' | 'department' | 'exam' | 'event';
  postedBy: string;
  postedAt: Date;
  expiresAt?: Date;
  isPinned: boolean;
  attachments: string[];
  isRead: boolean;
}
```

---

### ⭐ 13. EVENTS & ACTIVITIES MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Upcoming Events | List of upcoming events |
| Event Details | View event info, venue, timing |
| Event Registration | Register for events |
| My Registrations | View registered events |
| Certificate Download | Download participation certificates |
| **NO QR Attendance** | Manual attendance by organizers |

#### Functions
```typescript
// Event Functions
getUpcomingEvents() → Event[]
getEventDetails(eventId) → EventDetail
registerForEvent(eventId, studentId) → Registration
getMyRegistrations(studentId) → Registration[]
downloadCertificate(eventId, studentId) → PDFBlob // If available

// Types
interface Event {
  id: string;
  title: string;
  description: string;
  eventType: 'cultural' | 'technical' | 'sports' | 'workshop' | 'seminar';
  date: Date;
  venue: string;
  registrationDeadline: Date;
  isRegistered: boolean;
  hasAttended: boolean; // Marked by organizers manually
  hasCertificate: boolean;
}
```

---

### ⭐ 14. FEEDBACK & COMPLAINTS

#### Features
| Feature | Description |
|---------|-------------|
| Teacher Feedback | Submit feedback for teachers |
| College Feedback | General college feedback |
| Complaint Ticket | Raise issue/complaint |
| Status Tracking | Track complaint resolution |

#### Functions
```typescript
// Feedback Functions
submitTeacherFeedback(teacherId, feedback) → Result
submitCollegeFeedback(feedback) → Result
getMyFeedbackHistory(studentId) → Feedback[]

// Complaint Functions
raiseComplaint(complaintData) → Ticket
getMyComplaints(studentId) → Ticket[]
getComplaintStatus(ticketId) → TicketStatus
addComplaintComment(ticketId, comment) → Result

// Types
interface Ticket {
  ticketId: string;
  category: 'academic' | 'infrastructure' | 'hostel' | 'transport' | 'other';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  resolvedAt?: Date;
  comments: Comment[];
}
```

---

### ⭐ 15. FEE MODULE

#### Features
| Feature | Description |
|---------|-------------|
| Semester Fee Details | Fee breakdown per semester |
| Paid Receipts | Download payment receipts |
| Upcoming Dues | Pending fee payments |
| Online Payment | Payment gateway (if integrated) |

#### Functions
```typescript
// Fee Functions
getSemesterFees(studentId, semesterId) → FeeDetails
getPaymentHistory(studentId) → Payment[]
downloadReceipt(paymentId) → PDFBlob
getUpcomingDues(studentId) → Due[]
initiatePayment(studentId, feeId, amount) → PaymentSession
verifyPayment(paymentId, transactionId) → PaymentResult

// Types
interface FeeDetails {
  semesterId: string;
  totalFee: number;
  components: {
    name: string;
    amount: number;
    type: 'tuition' | 'exam' | 'library' | 'lab' | 'other';
  }[];
  paidAmount: number;
  pendingAmount: number;
  dueDate: Date;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
}
```

---

### ⭐ 16. HONORS/MAJOR-MINOR SYSTEM

#### Features
| Feature | Description |
|---------|-------------|
| Major View | View major (from enrolled course) |
| Minor Subjects | View available minor options |
| Selection Window | Apply during selection period |
| Approval Status | Track application status |
| **NO Credits Tracking** | Handled by academic office |

#### Functions
```typescript
// Honors/Minor Functions
getMajor(studentId) → Major
getAvailableMinors(studentId) → Minor[]
selectMinor(studentId, minorId) → Application
getMinorApplication(studentId) → MinorApplication | null

// Types
interface Major {
  id: string;
  name: string;
  department: string;
  program: string;
}

interface Minor {
  id: string;
  name: string;
  department: string;
  description: string;
  isAvailable: boolean; // Selection window open?
}

interface MinorApplication {
  id: string;
  minorId: string;
  minorName: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Date;
  approvedAt?: Date;
  remarks?: string;
}
```

---

### ⭐ 17. SETTINGS

#### Features
| Feature | Description |
|---------|-------------|
| Dark/Light Mode | Theme toggle |
| Notification Control | Enable/disable notifications |
| About/Version | App version info |

#### Functions
```typescript
// Settings Functions
getSettings(studentId) → Settings
updateTheme(studentId, theme: 'light' | 'dark' | 'system')
updateNotificationPreferences(studentId, prefs)
getAppVersion() → VersionInfo

// Types
interface Settings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    push: boolean;
    email: boolean;
    assignment: boolean;
    attendance: boolean;
    exam: boolean;
    notices: boolean;
  };
}
```

---

### ⭐ 18. SUPPORT

#### Features
| Feature | Description |
|---------|-------------|
| Contact College | College contact information |
| Helpdesk | Chat support (optional) |
| FAQs | Frequently asked questions |

#### Functions
```typescript
// Support Functions
getCollegeContacts() → Contact[]
getFAQs(category?) → FAQ[]
searchFAQs(query) → FAQ[]
startChatSession(studentId) → ChatSession // Optional
sendChatMessage(sessionId, message) → Result

// Types
interface Contact {
  department: string;
  name: string;
  email: string;
  phone?: string;
  timing?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}
```

---

### 📱 Student Module - Screen Architecture

```
app/(student)/
├── _layout.tsx                    ✅ Built
├── dashboard.tsx                  ⚠️ Basic (needs enhancement)
├── profile.tsx                    ❌ TODO - View & edit profile
├── profile-photo.tsx              ❌ TODO - Upload/change photo
│
├── attendance/
│   ├── index.tsx                  ❌ TODO - Subject-wise %
│   ├── daily.tsx                  ❌ TODO - Daily timeline
│   ├── calendar.tsx               ❌ TODO - Monthly calendar
│   └── alerts.tsx                 ❌ TODO - Shortage alerts
│
├── timetable/
│   ├── index.tsx                  ❌ TODO - Today's schedule
│   ├── weekly.tsx                 ❌ TODO - Weekly view
│   └── substitutions.tsx          ❌ TODO - Substitution alerts
│
├── assignments/
│   ├── index.tsx                  ❌ TODO - All assignments
│   ├── [assignmentId].tsx         ❌ TODO - Assignment detail
│   ├── submit.tsx                 ❌ TODO - Upload submission
│   └── calendar.tsx               ❌ TODO - Due dates calendar
│
├── materials/
│   ├── index.tsx                  ❌ TODO - Subject-wise materials
│   ├── [courseId].tsx             ❌ TODO - Course materials
│   ├── downloads.tsx              ❌ TODO - Downloaded files
│   └── search.tsx                 ❌ TODO - Search materials
│
├── marks/
│   ├── index.tsx                  ❌ TODO - Internal marks
│   ├── [courseId].tsx             ❌ TODO - Mark breakdown
│   └── history.tsx                ❌ TODO - Semester history
│
├── library/
│   ├── index.tsx                  ❌ TODO - Library home
│   ├── search.tsx                 ❌ TODO - Search books
│   ├── borrowed.tsx               ❌ TODO - My books
│   ├── fines.tsx                  ❌ TODO - Fine details
│   └── request.tsx                ❌ TODO - Book request
│
├── exams/
│   ├── index.tsx                  ❌ TODO - Exam home
│   ├── timetable.tsx              ❌ TODO - Exam schedule
│   ├── hallticket.tsx             ❌ TODO - Hall ticket
│   ├── results.tsx                ❌ TODO - All results
│   ├── upload-external.tsx        ❌ TODO - Upload external marks
│   └── gpa.tsx                    ❌ TODO - SGPA/CGPA view
│
├── canteen/
│   ├── index.tsx                  ❌ TODO - Today's menu
│   ├── order.tsx                  ❌ TODO - Place order + payment
│   ├── token-status.tsx           ❌ TODO - Current token status
│   ├── my-orders.tsx              ❌ TODO - Order history
│   └── request-refund.tsx         ❌ TODO - Refund request

├── canteen-staff/                   # Staff only screens
│   ├── dashboard.tsx              ❌ TODO - Staff dashboard (tokens list)
│   ├── update-status.tsx          ❌ TODO - Mark ready/done
│   └── refunds.tsx                ❌ TODO - Process refunds
│
├── bus/
│   ├── index.tsx                  ❌ TODO - Bus home
│   ├── select.tsx                 ❌ TODO - Select route
│   ├── route.tsx                  ❌ TODO - Route overview
│   └── alerts.tsx                 ❌ TODO - Payment/holiday alerts
│
├── notices/
│   ├── index.tsx                  ❌ TODO - All notices
│   ├── [noticeId].tsx             ❌ TODO - Notice detail
│   └── notifications.tsx          ❌ TODO - Notification hub
│
├── events/
│   ├── index.tsx                  ❌ TODO - Upcoming events
│   ├── [eventId].tsx              ❌ TODO - Event detail
│   ├── registered.tsx             ❌ TODO - My registrations
│   └── certificates.tsx           ❌ TODO - Certificates
│
├── feedback/
│   ├── index.tsx                  ❌ TODO - Feedback home
│   ├── teacher.tsx                ❌ TODO - Teacher feedback
│   ├── college.tsx                ❌ TODO - College feedback
│   └── complaints.tsx             ❌ TODO - Complaints
│
├── fees/
│   ├── index.tsx                  ❌ TODO - Fee details
│   ├── receipts.tsx               ❌ TODO - Payment receipts
│   ├── dues.tsx                   ❌ TODO - Upcoming dues
│   └── pay.tsx                    ❌ TODO - Payment gateway
│
├── honors/
│   ├── index.tsx                  ❌ TODO - Honors/Minor home
│   ├── minor.tsx                  ❌ TODO - Minor selection
│   └── courses.tsx                ❌ TODO - Minor courses list
│
├── settings/
│   ├── index.tsx                  ❌ TODO - Settings home
│   ├── notifications.tsx          ❌ TODO - Notification prefs
│   └── about.tsx                  ❌ TODO - App version/info
│
└── support/
    ├── index.tsx                  ❌ TODO - Support home
    ├── contacts.tsx               ❌ TODO - College contacts
    ├── faq.tsx                    ❌ TODO - FAQs
    └── chat.tsx                   ❌ TODO - Helpdesk chat
```

---

### 🗄️ Student Module - Database Tables

#### New Tables Required

```sql
-- 1. Canteen Menu
CREATE TABLE canteen_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(20), -- breakfast/lunch/snacks/beverages
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  sold_out BOOLEAN DEFAULT false,
  available_date DATE, -- Menu for specific date
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Canteen Tokens (Complete Token System)
CREATE TABLE canteen_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number INT NOT NULL, -- Resets daily (1, 2, 3...)
  token_date DATE NOT NULL DEFAULT CURRENT_DATE,
  student_id UUID REFERENCES students(id),
  items JSONB NOT NULL, -- [{itemId, name, quantity, price}]
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment Info
  payment_id VARCHAR(100), -- Payment gateway transaction ID
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending/verified/failed
  payment_verified_at TIMESTAMPTZ,
  
  -- Token Status
  status VARCHAR(20) DEFAULT 'pending', -- pending/ready/done/refunded
  
  -- Timestamps
  order_time TIMESTAMPTZ DEFAULT NOW(),
  ready_time TIMESTAMPTZ, -- When staff marked ready
  collected_time TIMESTAMPTZ, -- When student collected
  refunded_time TIMESTAMPTZ, -- When refund initiated
  refund_reason TEXT,
  
  -- Staff who updated
  updated_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_number, token_date) -- Unique token per day
);

-- 3. Canteen Daily Token Counter (For daily reset)
CREATE TABLE canteen_token_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  last_token_number INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Canteen Payments
CREATE TABLE canteen_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES canteen_tokens(id),
  student_id UUID REFERENCES students(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_gateway VARCHAR(50), -- razorpay/paytm/upi
  gateway_transaction_id VARCHAR(100),
  gateway_order_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'initiated', -- initiated/success/failed/refunded
  refund_id VARCHAR(100),
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(20), -- cultural/technical/sports/workshop/seminar
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(200),
  max_participants INT,
  registration_deadline DATE,
  is_registration_open BOOLEAN DEFAULT true,
  has_certificate BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Event Registrations (NO QR - Manual attendance)
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  student_id UUID REFERENCES students(id),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT false, -- Marked manually by organizers
  marked_by UUID REFERENCES profiles(id), -- Who marked attendance
  marked_at TIMESTAMPTZ,
  certificate_url TEXT,
  UNIQUE(event_id, student_id)
);

-- 7. Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  feedback_type VARCHAR(20), -- teacher/college/course
  target_id UUID, -- teacher_id or null for college
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  semester_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Complaints
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE,
  student_id UUID REFERENCES students(id),
  category VARCHAR(30), -- academic/infrastructure/hostel/transport/other
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium', -- low/medium/high
  status VARCHAR(20) DEFAULT 'open', -- open/in_progress/resolved/closed
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 9. Complaint Comments
CREATE TABLE complaint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id),
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Admin-only comments
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Minor Programs (NO credits tracking)
CREATE TABLE minor_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20),
  department_id UUID REFERENCES departments(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  selection_open BOOLEAN DEFAULT false, -- Is selection window open?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Minor Applications
CREATE TABLE minor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  minor_program_id UUID REFERENCES minor_programs(id),
  academic_year_id UUID,
  status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  remarks TEXT,
  UNIQUE(student_id, minor_program_id, academic_year_id)
);

-- NOTE: NO student_credits table - Credits handled by academic office

-- 12. FAQs
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  order_index INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. College Contacts
CREATE TABLE college_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department VARCHAR(100) NOT NULL,
  contact_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  timing VARCHAR(50),
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 14. Student Settings
CREATE TABLE student_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) UNIQUE,
  theme VARCHAR(10) DEFAULT 'system', -- light/dark/system
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  assignment_alerts BOOLEAN DEFAULT true,
  attendance_alerts BOOLEAN DEFAULT true,
  exam_alerts BOOLEAN DEFAULT true,
  notice_alerts BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. External Marks Upload (Student uploads)
CREATE TABLE external_marks_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  exam_id UUID REFERENCES exams(id),
  course_id UUID REFERENCES courses(id),
  marks_obtained DECIMAL(5,2),
  max_marks DECIMAL(5,2) DEFAULT 100,
  proof_url TEXT, -- Screenshot/document proof
  status VARCHAR(20) DEFAULT 'pending', -- pending/verified/rejected
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  remarks TEXT
);
```

---

### 📊 Student Module - Zustand Stores

```
store/
├── studentDashboardStore.ts       ❌ TODO
│   - dashboardData
│   - fetchDashboard(), refreshDashboard()
│
├── attendanceStore.ts             ❌ TODO (shared)
│   - subjectAttendance, dailyAttendance
│   - getSubjectWise(), getMonthly()
│
├── timetableStore.ts              ❌ TODO
│   - todaySchedule, weeklySchedule
│   - substitutions
│
├── assignmentStore.ts             ❌ TODO (shared)
│   - assignments, submissions
│   - uploadSubmission()
│
├── materialsStore.ts              ❌ TODO
│   - materials, downloads
│   - downloadMaterial(), searchMaterials()
│
├── marksStore.ts                  ❌ TODO
│   - internalMarks, externalMarks
│   - uploadExternalMarks()
│
├── libraryStore.ts                ❌ TODO
│   - borrowedBooks, fines
│   - searchBooks(), renewBook()
│
├── examStore.ts                   ❌ TODO (shared)
│   - examSchedule, results, gpa
│
├── canteenStore.ts                ❌ TODO
│   - menu, currentToken, orderHistory
│   - placeOrder(), verifyPayment(), checkTokenStatus()
│   - requestRefund(), fetchMyOrders()
│
├── canteenStaffStore.ts           ❌ TODO (Staff only)
│   - todayTokens, pendingTokens
│   - markReady(), markCollected(), processRefund()
│
├── busStore.ts                    ❌ TODO
│   - subscription, routes
│   - selectRoute(), getArrivalTime()
│
├── noticeStore.ts                 ❌ TODO (shared)
│   - notices, unreadCount
│   - markRead()
│
├── eventStore.ts                  ❌ TODO
│   - events, registrations
│   - register(), getCertificates()
│
├── feedbackStore.ts               ❌ TODO
│   - feedback, complaints
│   - submitFeedback(), raiseComplaint()
│
├── feeStore.ts                    ❌ TODO
│   - fees, payments, dues
│   - initiatePayment()
│
├── honorsStore.ts                 ❌ TODO
│   - minorPrograms, myMinor, courses
│   - applyMinor(), getMinorCourses()
│
└── settingsStore.ts               ❌ TODO (shared)
    - settings
    - updateTheme(), updateNotifications()
```

---

### Core Tables

```sql
┌─────────────────────────────────────────────────────────────┐
│                        AUTH LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  auth.users (Supabase)  ←──→  profiles (Extended info)      │
│                               user_roles (Many-to-Many)     │
│                               roles (Role definitions)      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ACADEMIC STRUCTURE                        │
├─────────────────────────────────────────────────────────────┤
│  departments ──→ programs ──→ years ──→ semesters           │
│       │              │           │          │               │
│       └──────────────┴───────────┴──────────┴──→ │
│                                                    │        │
│  courses ←── teacher_courses ──→ teachers          │        │
│     │                              │               │        │
│     └──────────────────────────────┴───────────────┘        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      USER ENTITIES                           │
├─────────────────────────────────────────────────────────────┤
│  students ──→ profiles ──→ sections                         │
│     │              │                                        │
│     ├── student_attendance                                  │
│     ├── student_marks                                       │
│     ├── student_fees                                        │
│     └── mentor_assignments ←── teachers                     │
│                                    │                        │
│  teachers ──→ profiles ──→ departments                      │
│     │                                                       │
│     ├── teacher_courses                                     │
│     └── teacher_attendance                                  │
└─────────────────────────────────────────────────────────────┘
```

### Table Details

#### 1. `profiles` - Extended User Info
```sql
- id (UUID, FK → auth.users)
- email, full_name, phone, photo_url
- date_of_birth, gender
- address_line1, address_line2, city, state, pincode
- status (active/inactive/suspended/graduated)
- primary_role
- created_at, updated_at
```

#### 2. `students` - Student Records
```sql
- id (UUID)
- user_id (FK → profiles)
- registration_number, roll_number, hall_ticket_number
- department_id, year_id, semester_id, section_id
- admission_year, admission_date, admitted_through
- father_name, mother_name, parent_phone
- blood_group, category, aadhar_number_encrypted
- current_status
```

#### 3. `teachers` - Teacher Records
```sql
- id (UUID)
- user_id (FK → profiles)
- employee_id
- department_id
- designation (professor/associate/assistant/lecturer)
- teacher_type (full_time/part_time/visiting)
- qualification, specialization
- experience_years, joining_date
```

#### 4. `departments`
```sql
- id, code, name, short_name
- hod_user_id (FK → profiles)
- is_active
```

#### 5. `programs` (UG/PG Courses)
```sql
- id, code, name, short_name
- program_type (undergraduate/postgraduate)
- department_id
- duration_years, total_semesters
```

#### 6. `courses` (Subjects)
```sql
- id, code, name, short_name
- department_id, semester_id
- course_type (core/elective/lab)
- theory_hours, lab_hours, credits
```

### Additional Tables (To Be Created)

#### 7. `attendance`
```sql
- id, student_id, course_id, date
- status (present/absent/late/excused)
- marked_by (teacher_id)
- remarks
```

#### 8. `exams`
```sql
- id, name, exam_type (internal/external/practical)
- academic_year_id, semester_id
- start_date, end_date
- is_published
```

#### 9. `exam_marks`
```sql
- id, exam_id, student_id, course_id
- marks_obtained, max_marks
- grade, remarks
- entered_by, verified_by
```

#### 10. `fees`
```sql
- id, student_id, academic_year_id
- fee_type (tuition/exam/library/hostel)
- amount, due_date
- paid_amount, paid_date
- status (pending/paid/partial/overdue)
```

#### 11. `notices`
```sql
- id, title, content, category
- target_audience (all/department/section/individual)
- target_ids (array)
- posted_by, posted_at
- expires_at, is_pinned
- attachments (array of URLs)
```

#### 12. `timetable`
```sql
- id, section_id, day_of_week
- period_number, start_time, end_time
- course_id, teacher_id
- room_number
```

#### 13. `library_books`
```sql
- id, isbn, title, author, publisher
- category, copies_total, copies_available
- location
```

#### 14. `library_transactions`
```sql
- id, book_id, user_id
- issued_date, due_date, returned_date
- fine_amount
```

#### 15. `bus_routes`
```sql
- id, route_number, route_name
- stops (JSONB array)
- driver_name, driver_phone
- vehicle_number
```

#### 16. `bus_subscriptions`
```sql
- id, student_id, route_id
- pickup_stop, academic_year_id
- fee_paid
```

---

## 📱 Frontend Architecture

### Directory Structure
```
app/
├── _layout.tsx                 # Root layout
├── index.tsx                   # Entry redirect
│
├── (auth)/                     # Auth screens (public)
│   ├── _layout.tsx
│   ├── login.tsx              ✅ Built
│   ├── register.tsx           ✅ Built
│   ├── verify-otp.tsx         ✅ Built
│   └── forgot-password.tsx    ✅ Built
│
├── (admin)/                    # Admin screens
│   ├── _layout.tsx            ✅ Built
│   ├── dashboard.tsx          ✅ Built
│   ├── settings.tsx           ✅ Built
│   ├── notices.tsx            ✅ Built
│   ├── users.tsx              ✅ Built
│   ├── academic.tsx           ✅ Built
│   │
│   ├── users/                  # User management
│   │   ├── pending.tsx        ❌ TODO
│   │   ├── students.tsx       ❌ TODO
│   │   ├── teachers.tsx       ❌ TODO
│   │   └── [id].tsx           ❌ TODO (User detail)
│   │
│   ├── academic/               # Academic management
│   │   ├── departments.tsx    ❌ TODO
│   │   ├── programs.tsx       ❌ TODO
│   │   ├── courses.tsx        ❌ TODO
│   │   ├── sections.tsx       ❌ TODO
│   │   └── timetable.tsx      ❌ TODO
│   │
│   ├── exams/                  # Exam management
│   │   ├── index.tsx          ❌ TODO
│   │   ├── create.tsx         ❌ TODO
│   │   ├── results.tsx        ❌ TODO
│   │   └── [id].tsx           ❌ TODO
│   │
│   ├── fees/                   # Fee management
│   │   ├── index.tsx          ❌ TODO
│   │   ├── collection.tsx     ❌ TODO
│   │   └── reports.tsx        ❌ TODO
│   │
│   ├── library/                # Library management
│   │   ├── index.tsx          ❌ TODO
│   │   ├── books.tsx          ❌ TODO
│   │   └── transactions.tsx   ❌ TODO
│   │
│   └── bus/                    # Bus management
│       ├── index.tsx          ❌ TODO
│       ├── routes.tsx         ❌ TODO
│       └── subscriptions.tsx  ❌ TODO
│
├── (teacher)/                  # Teacher screens
│   ├── _layout.tsx            ✅ Built
│   ├── dashboard.tsx          ⚠️ Basic (needs enhancement)
│   ├── profile.tsx            ❌ TODO
│   ├── settings.tsx           ❌ TODO
│   │
│   ├── timetable/             # Daily/Weekly Schedule
│   │   └── index.tsx          ❌ TODO
│   │
│   ├── attendance/            # Subject Attendance
│   │   ├── index.tsx          ❌ TODO - Mark attendance
│   │   ├── [courseId].tsx     ❌ TODO - Subject attendance
│   │   ├── history.tsx        ❌ TODO - View history
│   │   └── reports.tsx        ❌ TODO - Reports
│   │
│   ├── materials/             # Teaching Materials
│   │   ├── index.tsx          ❌ TODO - My materials
│   │   ├── upload.tsx         ❌ TODO - Upload new
│   │   └── [materialId].tsx   ❌ TODO - View/Edit
│   │
│   ├── assignments/           # Assignment Management
│   │   ├── index.tsx          ❌ TODO - All assignments
│   │   ├── create.tsx         ❌ TODO - Create new
│   │   ├── [assignmentId].tsx ❌ TODO - View submissions
│   │   └── grade.tsx          ❌ TODO - Grade submissions
│   │
│   ├── exams/                 # Internal/Model Exams
│   │   ├── index.tsx          ❌ TODO - My exams
│   │   ├── create.tsx         ❌ TODO - Create exam
│   │   ├── marks/
│   │   │   ├── [examId].tsx   ❌ TODO - Manual entry
│   │   │   └── upload.tsx     ❌ TODO - CSV upload
│   │   └── results.tsx        ❌ TODO - Performance view
│   │
│   ├── planner/               # Lesson Planner
│   │   ├── index.tsx          ❌ TODO - Planner home
│   │   ├── upload.tsx         ❌ TODO - Upload syllabus
│   │   ├── weekly.tsx         ❌ TODO - Weekly view
│   │   └── status.tsx         ❌ TODO - Approval status
│   │
│   ├── diary/                 # Work Diary
│   │   ├── index.tsx          ❌ TODO - Diary home
│   │   ├── entry.tsx          ❌ TODO - Daily entry
│   │   ├── monthly.tsx        ❌ TODO - Monthly summary
│   │   └── status.tsx         ❌ TODO - Approval status
│   │
│   ├── students/              # Class Teacher only
│   │   ├── index.tsx          ❌ TODO - Class students
│   │   ├── [studentId].tsx    ❌ TODO - Student detail
│   │   ├── attendance.tsx     ❌ TODO - Class attendance
│   │   ├── marks.tsx          ❌ TODO - Class marks
│   │   └── reports.tsx        ❌ TODO - Class reports
│   │
│   ├── mentees/               # Mentor only
│   │   ├── index.tsx          ❌ TODO - My mentees
│   │   ├── [studentId].tsx    ❌ TODO - Mentee detail
│   │   └── counselling.tsx    ❌ TODO - Add notes
│   │
│   ├── substitutes/           # Coordinator only
│   │   ├── index.tsx          ❌ TODO - View substitutes
│   │   └── assign.tsx         ❌ TODO - Assign substitute
│   │
│   └── department/            # HoD only
│       ├── index.tsx          ❌ TODO - Dept overview
│       ├── teachers.tsx       ❌ TODO - Dept teachers
│       ├── subjects.tsx       ❌ TODO - Subject mapping
│       ├── approvals/
│       │   ├── planners.tsx   ❌ TODO - Approve planners
│       │   ├── diaries.tsx    ❌ TODO - Approve diaries
│       │   └── leaves.tsx     ❌ TODO - Approve leaves
│       ├── analytics.tsx      ❌ TODO - Dept analytics
│       └── announcements.tsx  ❌ TODO - Dept notices
│
├── (student)/                  # Student screens
│   ├── _layout.tsx            ✅ Built
│   ├── dashboard.tsx          ✅ Built (Basic)
│   │
│   ├── attendance/            ❌ TODO
│   │   └── index.tsx          # My attendance
│   │
│   ├── results/               ❌ TODO
│   │   ├── index.tsx          # All results
│   │   └── [examId].tsx       # Exam detail
│   │
│   ├── fees/                  ❌ TODO
│   │   └── index.tsx          # My fees
│   │
│   ├── timetable/             ❌ TODO
│   │   └── index.tsx          # My timetable
│   │
│   ├── library/               ❌ TODO
│   │   └── index.tsx          # My books
│   │
│   ├── notices/               ❌ TODO
│   │   └── index.tsx          # View notices
│   │
│   └── profile.tsx            ❌ TODO
│
components/
├── ui/                         # Reusable UI components
│   ├── AnimatedBackground.tsx ✅ Built
│   ├── GlassCard.tsx          ✅ Built
│   ├── GlassInput.tsx         ✅ Built
│   ├── PrimaryButton.tsx      ✅ Built
│   ├── ThemeToggle.tsx        ✅ Built
│   └── index.ts               ✅ Built
│
├── admin/                      # Admin-specific components
│   ├── StatCard.tsx           ❌ TODO
│   ├── UserList.tsx           ❌ TODO
│   ├── ApprovalCard.tsx       ❌ TODO
│   └── QuickActionGrid.tsx    ❌ TODO
│
├── teacher/                    # Teacher-specific components
│   ├── AttendanceSheet.tsx    ❌ TODO
│   ├── MarksEntry.tsx         ❌ TODO
│   └── StudentCard.tsx        ❌ TODO
│
├── student/                    # Student-specific components
│   ├── AttendanceCalendar.tsx ❌ TODO
│   ├── ResultCard.tsx         ❌ TODO
│   └── FeeCard.tsx            ❌ TODO
│
└── shared/                     # Shared components
    ├── Avatar.tsx             ❌ TODO
    ├── Badge.tsx              ❌ TODO
    ├── EmptyState.tsx         ❌ TODO
    ├── ErrorState.tsx         ❌ TODO
    ├── LoadingState.tsx       ❌ TODO
    ├── SearchBar.tsx          ❌ TODO
    ├── FilterChips.tsx        ❌ TODO
    ├── BottomSheet.tsx        ❌ TODO
    ├── Modal.tsx              ❌ TODO
    └── DatePicker.tsx         ❌ TODO
```

### State Management (Zustand Stores)

```
store/
├── authStore.ts               ✅ Built
│   - user, profile, session
│   - isAuthenticated, primaryRole
│   - login(), logout(), setSession()
│
├── themeStore.ts              ✅ Built
│   - isDark, mode, colors
│   - animationsEnabled
│   - toggleTheme(), toggleAnimations()
│
├── createStore.ts             ✅ Built
│   - persist middleware
│
├── attendanceStore.ts         ❌ TODO
│   - currentAttendance, students
│   - markAttendance(), saveAttendance()
│   - editAttendance(), lockAttendance()
│
├── academicStore.ts           ❌ TODO
│   - departments, programs, sections
│   - fetchDepartments(), etc.
│
├── teacherStore.ts            ❌ TODO (NEW)
│   - mySubjects, myClasses, mySections
│   - timetable, currentPeriod
│   - fetchTimetable(), startClass()
│
├── materialsStore.ts          ❌ TODO (NEW)
│   - materials, uploads
│   - uploadMaterial(), deleteMaterial()
│
├── assignmentStore.ts         ❌ TODO (NEW)
│   - assignments, submissions
│   - createAssignment(), gradeSubmission()
│
├── examStore.ts               ❌ TODO (NEW)
│   - exams, marks
│   - createExam(), enterMarks(), uploadCSV()
│
├── plannerStore.ts            ❌ TODO (NEW)
│   - planners, topics, weeklyProgress
│   - uploadSyllabus(), markCompleted()
│   - submitForApproval()
│
├── diaryStore.ts              ❌ TODO (NEW)
│   - diaries, entries, monthlySummary
│   - createEntry(), submitMonthly()
│
├── mentorStore.ts             ❌ TODO (NEW)
│   - mentees, counsellingNotes
│   - addNote(), scheduleFollowUp()
│
├── substitutionStore.ts       ❌ TODO (NEW)
│   - absentTeachers, substitutions
│   - assignSubstitute(), getActiveSubstitutions()
│
├── hodStore.ts                ❌ TODO (NEW)
│   - pendingApprovals, deptAnalytics
│   - approvePlanner(), approveDiary()
│   - getDeptWorkload()
│
├── offlineStore.ts            ❌ TODO (NEW)
│   - syncQueue, lastSynced
│   - saveOffline(), syncWhenOnline()
│
└── notificationStore.ts       ❌ TODO
    - notifications, unreadCount
    - markAsRead(), clearAll()
```

---

## ⚙️ Backend Architecture

### Supabase Configuration

#### Authentication
```
- Email/Password authentication
- OTP verification for registration
- Password reset via email
- Session management with JWT
```

#### Row Level Security (RLS) Policies

```sql
-- Profiles: Users can read/update own profile
-- Admins: Full access to all tables
-- Teachers: Read students in their sections, write attendance/marks
-- Students: Read own data only

-- Helper Functions
is_admin()     → Returns true if user has admin role
is_teacher()   → Returns true if user has teacher role
is_student()   → Returns true if user has student role
```

#### Database Functions (RPC)

```sql
-- Existing
verify_apaar_id(p_apaar_id)     → Verify student APAAR ID
generate_otp(p_email, p_purpose) → Generate OTP for verification
get_user_roles(user_uuid)        → Get all roles for a user
get_current_academic_year()      → Get current academic year

-- To Be Created
get_student_dashboard(user_id)   → Dashboard stats for student
get_teacher_dashboard(user_id)   → Dashboard stats for teacher
get_admin_dashboard()            → Dashboard stats for admin
get_attendance_summary(student_id, semester_id)
get_marks_summary(student_id, exam_id)
get_fee_summary(student_id, academic_year_id)
```

#### Triggers

```sql
-- Existing
on_auth_user_created → Auto-create profile
update_updated_at    → Auto-update timestamps

-- To Be Created
on_student_created   → Assign student role
on_teacher_created   → Assign teacher role
on_attendance_marked → Update attendance percentage
on_fee_paid          → Update payment status
```

### Storage Buckets

```
├── avatars/              # User profile photos
├── documents/            # Uploaded documents (PDFs, etc.)
├── notices/              # Notice attachments
└── library/              # Book covers, resources
```

---

## 📦 Module Breakdown

### Module 1: Authentication ✅ DONE
- [x] Login screen (Email + Password only)
- [x] Student registration (4-step wizard)
- [x] OTP verification
- [x] Password reset
- [x] Auto-redirect based on role
- [x] Multi-role detection

### Module 2: Admin Dashboard ⚠️ PARTIAL
- [x] Dashboard with stats
- [x] Quick actions grid
- [x] Recent activity feed
- [ ] Real-time stats updates
- [ ] Notifications bell

### Module 3: User Management ❌ TODO
- [ ] View all students (with filters)
- [ ] View all teachers
- [ ] Pending approvals list
- [ ] User detail view
- [ ] Edit user
- [ ] Suspend/Activate user
- [ ] Assign roles
- [ ] Bulk actions

### Module 4: Academic Management ❌ TODO
- [ ] Departments CRUD
- [ ] Programs CRUD
- [ ] Courses CRUD
- [ ] Sections management
- [ ] Timetable builder
- [ ] Academic year management

### Module 5: Teacher Module ❌ TODO (DETAILED ABOVE)

#### 5.1 Subject Teacher Features
- [ ] View daily/weekly timetable
- [ ] Mark subject attendance (P/A/L)
- [ ] Edit attendance within grace window
- [ ] Upload teaching materials (PDF/PPT/Video/Links)
- [ ] Create & manage assignments
- [ ] Grade student submissions
- [ ] Create internal/model exams
- [ ] Enter marks manually (sorted by name)
- [ ] Upload marks via CSV (auto name-matching)
- [ ] Lesson planner (upload syllabus, track completion)
- [ ] Submit weekly planner → HoD → Principal
- [ ] Work diary (daily entries)
- [ ] Submit monthly diary → HoD → Principal
- [ ] Subject-level announcements

#### 5.2 Class Teacher Features
- [ ] Full class student list
- [ ] View student profiles
- [ ] Cross-teacher attendance view
- [ ] Cross-teacher marks view
- [ ] Identify at-risk students
- [ ] Class ranking
- [ ] Generate progress cards
- [ ] Class announcements
- [ ] Parent communication

#### 5.3 Mentor Features
- [ ] View mentee list
- [ ] Mentee attendance summary
- [ ] Mentee performance overview
- [ ] Add counselling notes
- [ ] Schedule follow-up reminders
- [ ] Escalate concerns

#### 5.4 Coordinator Features
- [ ] Detect absent teachers
- [ ] Assign substitute teachers
- [ ] Set access time window
- [ ] Auto-expire access
- [ ] Substitution audit log

#### 5.5 HoD Features
- [ ] Assign teachers to subjects
- [ ] Department workload view
- [ ] Approve lesson planners
- [ ] Approve work diaries
- [ ] Approve leave requests
- [ ] Department analytics
- [ ] Override substitutions
- [ ] Department announcements

### Module 6: Student Module ❌ TODO (DETAILED ABOVE)

#### 6.1 Authentication & Profile
- [ ] Email-only registration (NO mobile OTP)
- [ ] Email login/logout
- [ ] Forgot password/reset (email link)
- [ ] Profile view & edit
- [ ] Photo upload (by student)
- [ ] Course/Year/Dept auto-sync

#### 6.2 Dashboard
- [ ] Today's timetable widget
- [ ] Quick attendance %
- [ ] Assignment alerts
- [ ] Internal marks snapshot
- [ ] Canteen menu today
- [ ] Bus arrival time
- [ ] Library borrowed books
- [ ] Notifications hub

#### 6.3 Attendance
- [ ] Subject-wise attendance %
- [ ] Daily attendance timeline
- [ ] Monthly calendar view
- [ ] Shortage alerts
- [ ] Rules display (80% minimum)

#### 6.4 Timetable
- [ ] Day-wise timetable
- [ ] Weekly timetable
- [ ] Substitution alerts
- [ ] Classroom & teacher info

#### 6.5 Assignments
- [ ] Subject-wise assignment list
- [ ] Due dates calendar
- [ ] Upload submission (PDF/Photo)
- [ ] Status tracking (Pending/Submitted/Graded)
- [ ] Teacher feedback view

#### 6.6 Academic Materials
- [ ] Subject-wise materials
- [ ] Notes/PPT/PDF/Videos
- [ ] Downloads section (offline)
- [ ] Search within subjects

#### 6.7 Internal Marks
- [ ] CAT/Series marks
- [ ] Assignment marks
- [ ] Attendance marks
- [ ] Final internal calculation
- [ ] Semester-wise breakdown

#### 6.8 Library
- [ ] Search books
- [ ] Borrowed books list
- [ ] Due dates
- [ ] Renew book
- [ ] Fine details
- [ ] Book request
- [ ] Book reservation

#### 6.9 Exams
- [ ] Exam timetable
- [ ] Hall ticket download
- [ ] Internal results
- [ ] External results (student upload)
- [ ] Pass/Fail indicators
- [ ] Grade points
- [ ] SGPA/CGPA view

#### 6.10 Canteen (Complete Token System)
- [ ] Today's menu view
- [ ] Place order (select items)
- [ ] Online payment (Razorpay/Paytm/UPI)
- [ ] Token generation on payment
- [ ] Token status tracking (pending/ready/done)
- [ ] My orders history
- [ ] Refund request
- [ ] Staff Dashboard:
  - [ ] View all today's tokens
  - [ ] Mark token ready
  - [ ] Mark token collected
  - [ ] Process refunds
- [ ] Daily token counter reset

#### 6.11 Bus
- [ ] Bus selection (once, admin approval)
- [ ] Route overview
- [ ] Bus arrival time
- [ ] Payment alerts
- [ ] Holiday alerts
- [ ] NO driver/conductor details
- [ ] NO pickup/drop listing

#### 6.12 Notices & Announcements
- [ ] College notices
- [ ] Department notices
- [ ] Exam notifications
- [ ] Event updates
- [ ] Push notifications

#### 6.13 Events & Activities
- [ ] Upcoming events
- [ ] Event registration
- [ ] Manual attendance (by organizers)
- [ ] Certificate download

#### 6.14 Feedback & Complaints
- [ ] Teacher feedback
- [ ] College feedback
- [ ] Complaint/Issue ticket
- [ ] Status tracking

#### 6.15 Fees
- [ ] Semester fee details
- [ ] Paid receipts
- [ ] Upcoming dues
- [ ] Online payment gateway

#### 6.16 Honors/Major-Minor
- [ ] View major (from course)
- [ ] Available minor subjects
- [ ] Selection window
- [ ] Approval status
- [ ] NO credits tracking (handled by academic office)

#### 6.17 Settings
- [ ] Dark/Light mode
- [ ] Notification control
- [ ] About/App version

#### 6.18 Support
- [ ] Contact college
- [ ] Helpdesk chat (optional)
- [ ] FAQs

### Module 7: Attendance ❌ TODO
- [ ] Take attendance (Teacher - subject-wise)
- [ ] Edit within grace window
- [ ] View attendance history (Teacher)
- [ ] Attendance reports (Admin/Teacher/HoD)
- [ ] My attendance (Student)
- [ ] Attendance calendar view
- [ ] Low attendance alerts

### Module 7: Exams & Results ❌ TODO
- [ ] Create exam (Admin sets dates/timetable)
- [ ] Exam timetable view
- [ ] Enter internal marks (Teacher)
- [ ] CSV marks upload (Teacher)
- [ ] Enter external marks (Student self-upload)
- [ ] Verify marks (HOD)
- [ ] Publish results (Admin)
- [ ] View results (Student)
- [ ] Download marksheet

### Module 8: Fees ❌ TODO
- [ ] Fee structure setup
- [ ] Generate fee challans
- [ ] Record payments
- [ ] Fee reports
- [ ] View my fees (Student)
- [ ] Payment reminders
- [ ] Defaulters list

### Module 9: Notices ⚠️ PARTIAL
- [x] Notices list view
- [ ] Create notice (Admin/Teacher)
- [ ] Target specific audience
- [ ] Attach files
- [ ] Pin important notices
- [ ] Push notifications

### Module 10: Library ❌ TODO
- [ ] Book catalog
- [ ] Issue book
- [ ] Return book
- [ ] Fine calculation
- [ ] My issued books (Student)
- [ ] Book reservation

### Module 11: Transport ❌ TODO
- [ ] Bus routes management
- [ ] Route stops
- [ ] Student subscriptions
- [ ] Driver assignment
- [ ] My bus route (Student)

### Module 12: Profile ❌ TODO
- [ ] View profile (all roles)
- [ ] Edit profile
- [ ] Change password
- [ ] Upload photo
- [ ] View academic history (Student)

### Module 13: Reports ❌ TODO
- [ ] Attendance reports
- [ ] Result analytics
- [ ] Fee collection reports
- [ ] Student strength reports
- [ ] Export to PDF/Excel

### Module 14: System Features ❌ TODO
- [ ] Push notifications
- [ ] Audit logging
- [ ] Offline support (attendance, marks, diary, planner)
- [ ] Auto-sync when online

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login (email only) |
| POST | `/auth/signout` | Logout |
| POST | `/auth/otp` | Send OTP |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/reset-password` | Reset password |

### Users & Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profiles/{id}` | Get user profile |
| PATCH | `/profiles/{id}` | Update profile |
| POST | `/profiles/{id}/photo` | Upload profile photo |
| GET | `/students` | List students (filtered) |
| GET | `/students/{id}` | Get student details |
| GET | `/teachers` | List teachers |
| GET | `/teachers/{id}` | Get teacher details |
| POST | `/user-roles` | Assign role |
| DELETE | `/user-roles/{id}` | Remove role |

### Academic
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | List departments |
| POST | `/departments` | Create department |
| GET | `/programs` | List programs |
| GET | `/courses` | List courses |
| GET | `/sections` | List sections |
| GET | `/timetable/{section_id}` | Get timetable |
| GET | `/timetable/teacher/{teacher_id}` | Teacher timetable |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance` | Mark attendance |
| PATCH | `/attendance/{id}` | Edit attendance (within window) |
| GET | `/attendance/student/{id}` | Get student attendance |
| GET | `/attendance/section/{id}` | Get section attendance |
| GET | `/attendance/course/{id}` | Get subject attendance |
| GET | `/attendance/report` | Attendance report |

### Teaching Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/materials` | List my materials |
| GET | `/materials/course/{id}` | Materials by course |
| POST | `/materials` | Upload material |
| PATCH | `/materials/{id}` | Update material |
| DELETE | `/materials/{id}` | Delete material |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assignments` | List assignments |
| POST | `/assignments` | Create assignment |
| GET | `/assignments/{id}` | Get assignment |
| GET | `/assignments/{id}/submissions` | Get submissions |
| POST | `/assignments/{id}/grade` | Grade submission |

### Exams & Marks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams` | List exams |
| POST | `/exams` | Create exam |
| POST | `/exams/{id}/question-paper` | Upload question paper |
| POST | `/marks` | Enter marks |
| POST | `/marks/csv` | Upload marks via CSV |
| GET | `/marks/student/{id}` | Get student marks |
| GET | `/results/{exam_id}` | Get exam results |
| POST | `/marks/{exam_id}/lock` | Lock marks |

### Lesson Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/planners` | List my planners |
| POST | `/planners` | Create planner |
| POST | `/planners/{id}/syllabus` | Upload syllabus |
| GET | `/planners/{id}/topics` | Get topics |
| PATCH | `/planners/topics/{id}` | Mark topic completed |
| POST | `/planners/{id}/submit` | Submit for approval |
| GET | `/planners/pending` | Get pending approvals (HoD) |
| POST | `/planners/{id}/approve` | Approve planner |
| POST | `/planners/{id}/reject` | Reject planner |

### Work Diary
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/diaries` | List my diaries |
| POST | `/diaries/entries` | Add daily entry |
| GET | `/diaries/{month}/{year}` | Get monthly diary |
| POST | `/diaries/{id}/submit` | Submit for approval |
| GET | `/diaries/pending` | Get pending approvals (HoD) |
| POST | `/diaries/{id}/approve` | Approve diary |
| POST | `/diaries/{id}/reject` | Reject diary |

### Mentoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mentees` | Get my mentees |
| GET | `/mentees/{id}` | Get mentee details |
| POST | `/counselling` | Add counselling note |
| GET | `/counselling/{student_id}` | Get counselling history |
| POST | `/counselling/{id}/followup` | Schedule follow-up |
| POST | `/counselling/{id}/escalate` | Escalate concern |

### Substitutions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/substitutions/absent` | Get absent teachers |
| POST | `/substitutions` | Assign substitute |
| GET | `/substitutions/active` | Get active substitutions |
| DELETE | `/substitutions/{id}` | Cancel substitution |

### Fees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fees/student/{id}` | Get student fees |
| POST | `/fees/payment` | Record payment |
| GET | `/fees/report` | Fee collection report |
| GET | `/fees/receipts/{id}` | Download receipt |
| POST | `/fees/initiate-payment` | Start online payment |
| POST | `/fees/verify-payment` | Verify payment |

### Notices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notices` | List notices |
| POST | `/notices` | Create notice |
| GET | `/notices/{id}` | Get notice detail |
| DELETE | `/notices/{id}` | Delete notice |
| PATCH | `/notices/{id}/read` | Mark as read |

### Student Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/dashboard` | Get dashboard data |
| GET | `/student/dashboard/refresh` | Refresh dashboard |

### Student Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/assignments` | My assignments |
| GET | `/student/assignments/{id}` | Assignment details |
| POST | `/student/assignments/{id}/submit` | Upload submission |
| GET | `/student/assignments/{id}/feedback` | Get teacher feedback |

### Student Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/materials` | All materials |
| GET | `/student/materials/{courseId}` | Course materials |
| GET | `/student/materials/search` | Search materials |
| POST | `/student/materials/{id}/download` | Download material |

### Student Library
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/library/search` | Search books |
| GET | `/library/borrowed` | My borrowed books |
| POST | `/library/{transactionId}/renew` | Renew book |
| GET | `/library/fines` | My fines |
| POST | `/library/request` | Request book |
| POST | `/library/reserve` | Reserve book |

### Student Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/exams/timetable` | Exam timetable |
| GET | `/student/exams/hallticket/{id}` | Download hall ticket |
| GET | `/student/results` | All results |
| POST | `/student/results/external` | Upload external marks |
| GET | `/student/gpa` | SGPA/CGPA |

### Canteen (Complete Token System)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/canteen/menu` | Today's menu |
| GET | `/canteen/menu?date=YYYY-MM-DD` | Menu for specific date |
| POST | `/canteen/order` | Create order (initiate payment) |
| POST | `/canteen/payment/verify` | Verify payment & generate token |
| GET | `/canteen/tokens/current` | My current/active token |
| GET | `/canteen/tokens` | My token history |
| GET | `/canteen/tokens/{id}` | Token status & details |
| POST | `/canteen/tokens/{id}/refund` | Request refund |
| **Staff Endpoints** | | |
| GET | `/canteen/staff/tokens` | Today's all tokens (staff) |
| GET | `/canteen/staff/pending` | Pending tokens (staff) |
| PATCH | `/canteen/staff/tokens/{id}/ready` | Mark token ready (staff) |
| PATCH | `/canteen/staff/tokens/{id}/collected` | Mark token collected (staff) |
| POST | `/canteen/staff/refund/{id}` | Process refund (staff) |

### Bus
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bus/routes` | Available routes |
| POST | `/bus/select` | Select route |
| GET | `/bus/subscription` | My subscription |
| GET | `/bus/routes/{id}` | Route overview |
| GET | `/bus/arrival` | Arrival time |
| GET | `/bus/alerts` | Holiday/payment alerts |

### Events (External Link Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | Upcoming events |
| GET | `/events/{id}` | Event details (includes external link) |
| GET | `/events/{id}/certificate` | Download certificate (if available) |
| **Admin Endpoints** | | |
| POST | `/admin/events` | Create event (external link required) |
| PATCH | `/admin/events/{id}` | Update event |
| POST | `/admin/events/{id}/publish` | Publish event |
| POST | `/admin/events/{id}/certificate` | Upload certificate template |

**NO registration endpoint (external link only). NO attendance tracking.**

### Feedback & Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/feedback/teacher` | Submit teacher feedback |
| POST | `/feedback/college` | Submit college feedback |
| GET | `/feedback/history` | My feedback history |
| POST | `/complaints` | Raise complaint |
| GET | `/complaints` | My complaints |
| GET | `/complaints/{id}` | Complaint details |
| POST | `/complaints/{id}/comment` | Add comment |

### Honors/Minor (NO Credits)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/student/major` | Get major |
| GET | `/student/minors/available` | Available minors |
| POST | `/student/minors/apply` | Apply for minor |
| GET | `/student/minors/application` | Application status |

### Settings & Support
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get settings |
| PATCH | `/settings` | Update settings (theme, notifications) |
| GET | `/support/contacts` | College contacts |
| GET | `/support/faq` | FAQs |
| POST | `/support/chat` | Start chat session |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit/{entity_type}/{id}` | Get audit trail |

---

### Admin API Endpoints

#### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/teachers` | List teachers |
| POST | `/admin/teachers` | Create teacher |
| PATCH | `/admin/teachers/{id}` | Update teacher |
| POST | `/admin/teachers/{id}/roles` | Assign roles |
| PATCH | `/admin/teachers/{id}/status` | Enable/disable |
| POST | `/admin/teachers/{id}/reset-password` | Reset password |
| GET | `/admin/students` | List students |
| PATCH | `/admin/students/{id}/block` | Block/unblock |
| GET | `/admin/external-uploads` | Pending external uploads |
| POST | `/admin/external-uploads/{id}/verify` | Verify upload |

#### Academic Structure
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/departments` | Create department |
| PATCH | `/admin/departments/{id}` | Update department |
| POST | `/admin/courses` | Create course |
| PATCH | `/admin/courses/{id}` | Update course |
| POST | `/admin/subjects` | Create subject |
| POST | `/admin/subjects/{id}/map` | Map to department |
| POST | `/admin/semesters` | Create semester |
| POST | `/admin/minor-programs` | Create minor program |

#### Exam Management (Exam Cell Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/exams/schedule` | Set exam schedule |
| PATCH | `/admin/exams/schedule/{id}` | Update schedule |
| POST | `/admin/exams/timetable/publish` | Publish timetable |
| GET | `/admin/exams/internal-marks` | Pending internal marks |
| POST | `/admin/exams/internal-marks/{id}/verify` | Verify internal marks |
| GET | `/admin/exams/external-uploads` | Pending external uploads |
| POST | `/admin/exams/external-uploads/{id}/verify` | Verify external marks |
| GET | `/admin/exams/analytics` | Exam analytics |

#### Attendance Control
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/attendance/class/{id}` | Class attendance |
| GET | `/admin/attendance/department/{id}` | Dept attendance |
| PATCH | `/admin/attendance/{id}` | Edit attendance (logged) |
| POST | `/admin/attendance/rules` | Set rules |
| POST | `/admin/attendance/shortage-list` | Publish shortage |

#### Timetable Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/timetable` | Create master timetable |
| POST | `/admin/timetable/{id}/assign` | Assign teacher to period |
| POST | `/admin/timetable/{id}/room` | Assign room |
| POST | `/admin/timetable/{id}/publish` | Publish timetable |
| PATCH | `/admin/timetable/period/{id}` | Update live period |

#### Library Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/library/books` | Add book |
| PATCH | `/admin/library/books/{id}` | Update book |
| POST | `/admin/library/issue` | Issue book |
| POST | `/admin/library/return/{id}` | Return book |
| POST | `/admin/library/renew/{id}` | Renew book |
| GET | `/admin/library/reservations` | Reservation queue |
| GET | `/admin/library/analytics` | Library analytics |

#### Bus Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/bus/routes` | Create route |
| PATCH | `/admin/bus/routes/{id}` | Update route |
| POST | `/admin/bus/routes/{id}/stops` | Add stop |
| GET | `/admin/bus/approvals` | Pending approvals |
| POST | `/admin/bus/approvals/{id}` | Approve selection |
| POST | `/admin/bus/alerts` | Publish alert |

#### Canteen Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/canteen/menu` | Add menu item |
| PATCH | `/admin/canteen/menu/{id}` | Update item |
| PATCH | `/admin/canteen/menu/{id}/soldout` | Mark sold out |
| GET | `/admin/canteen/tokens` | Today's tokens |
| PATCH | `/admin/canteen/tokens/{id}/status` | Update status |
| GET | `/admin/canteen/reports` | Sales summary |

#### Fee Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/fees/structure` | Create fee structure |
| PATCH | `/admin/fees/structure/{id}` | Update structure |
| GET | `/admin/fees/payments` | Pending payments |
| POST | `/admin/fees/payments/{id}/verify` | Verify payment |
| POST | `/admin/fees/receipts/{id}` | Upload receipt |
| POST | `/admin/fees/reminders` | Send reminders |
| GET | `/admin/fees/analytics` | Fee analytics |

#### Analytics & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/analytics/attendance` | Attendance analytics |
| GET | `/admin/analytics/exams` | Exam analytics |
| GET | `/admin/analytics/departments` | Dept performance |
| GET | `/admin/analytics/library` | Library usage |
| GET | `/admin/analytics/bus` | Bus usage |
| GET | `/admin/analytics/canteen` | Canteen reports |
| GET | `/admin/analytics/fees` | Fee analytics |
| POST | `/admin/analytics/export` | Export PDF/CSV |

#### Global Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/settings` | Get all settings |
| PATCH | `/admin/settings/academic-year` | Set academic year |
| PATCH | `/admin/settings/college-info` | Update college info |
| POST | `/admin/settings/modules/{name}/toggle` | Toggle module |
| POST | `/admin/settings/backup` | Create backup |
| POST | `/admin/settings/restore` | Restore backup |
| POST | `/admin/settings/maintenance` | Toggle maintenance |
| POST | `/admin/settings/force-logout` | Force logout all |

#### Admin Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/audit` | Search audit logs |
| GET | `/admin/audit/user/{id}` | User audit trail |
| GET | `/admin/audit/entity/{type}/{id}` | Entity audit |

---

## 🗓 Implementation Roadmap

### Phase 1: Core Foundation ✅ COMPLETE
**Timeline: Week 1-2**
- [x] Project setup (Expo, TypeScript)
- [x] UI component library
- [x] Theme system (Dark/Light)
- [x] Authentication flow (Email only)
- [x] Database schema design
- [x] Basic navigation structure

### Phase 2: Admin Module 🔄 IN PROGRESS
**Timeline: Week 3-4**
- [x] Admin dashboard
- [x] Settings screen
- [ ] User management (Students list)
- [ ] User management (Teachers list)
- [ ] Pending approvals
- [ ] Department management
- [ ] Basic notices

### Phase 3: Teacher Module - Core ❌ TODO
**Timeline: Week 5-7**
- [ ] Teacher dashboard (enhanced)
- [ ] Timetable view
- [ ] Attendance marking (subject-wise)
- [ ] Teaching materials upload
- [ ] Assignment management
- [ ] Profile & settings

### Phase 4: Teacher Module - Advanced ❌ TODO
**Timeline: Week 8-9**
- [ ] Internal/Model exams
- [ ] Manual marks entry
- [ ] CSV marks upload
- [ ] Lesson planner
- [ ] Work diary
- [ ] Approval workflows (HoD → Principal)

### Phase 5: Teacher Module - Role-Specific ❌ TODO
**Timeline: Week 10-11**
- [ ] Class Teacher features
- [ ] Mentor features
- [ ] Coordinator (substitution) features
- [ ] HoD features
- [ ] Department analytics

### Phase 6: Student Module - Core ❌ TODO
**Timeline: Week 12-14**
- [ ] Student dashboard (enhanced)
- [ ] Profile view & edit
- [ ] Attendance module (subject-wise, calendar, alerts)
- [ ] Timetable module (daily, weekly, substitutions)
- [ ] Assignments module (list, submit, feedback)
- [ ] Academic materials (download, search)

### Phase 7: Student Module - Academic ❌ TODO
**Timeline: Week 15-16**
- [ ] Internal marks module
- [ ] External marks upload (student)
- [ ] Exam section (timetable, hall ticket, results)
- [ ] SGPA/CGPA calculation
- [ ] Library module
- [ ] Honors/Major-Minor system

### Phase 8: Student Module - Utilities ❌ TODO
**Timeline: Week 17-18**
- [ ] Canteen module (menu, pre-order tokens)
- [ ] Bus module (selection, arrival, alerts)
- [ ] Fees module (details, receipts, payment)
- [ ] Events & Activities module
- [ ] Feedback & Complaints

### Phase 9: Communication & System ❌ TODO
**Timeline: Week 19-20**
- [ ] Notices & Announcements
- [ ] Push notifications
- [ ] Settings (theme, notifications, mobile)
- [ ] Support (contacts, FAQ, chat)
- [ ] Offline support

### Phase 10: Polish & Launch ❌ TODO
**Timeline: Week 21-24**
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Security audit
- [ ] Audit logging
- [ ] App store deployment

---

## 📊 Current Status

### Overall Progress
```
██████░░░░░░░░░░░░░░ 25%
```

### By Module
| Module | Status | Progress |
|--------|--------|----------|
| Authentication | ✅ Complete | 100% |
| Admin Dashboard | ⚠️ Partial | 60% |
| User Management | ❌ Not Started | 0% |
| Academic Management | ❌ Not Started | 0% |
| **Teacher Module** | ❌ Not Started | 0% |
| ↳ Subject Teacher | ❌ Not Started | 0% |
| ↳ Class Teacher | ❌ Not Started | 0% |
| ↳ Mentor | ❌ Not Started | 0% |
| ↳ Coordinator | ❌ Not Started | 0% |
| ↳ HoD | ❌ Not Started | 0% |
| **Student Module** | ❌ Not Started | 0% |
| ↳ Dashboard | ❌ Not Started | 0% |
| ↳ Attendance | ❌ Not Started | 0% |
| ↳ Timetable | ❌ Not Started | 0% |
| ↳ Assignments | ❌ Not Started | 0% |
| ↳ Materials | ❌ Not Started | 0% |
| ↳ Internal Marks | ❌ Not Started | 0% |
| ↳ Exams | ❌ Not Started | 0% |
| ↳ Library | ❌ Not Started | 0% |
| ↳ Canteen | ❌ Not Started | 0% |
| ↳ Bus | ❌ Not Started | 0% |
| ↳ Fees | ❌ Not Started | 0% |
| ↳ Events | ❌ Not Started | 0% |
| ↳ Feedback | ❌ Not Started | 0% |
| ↳ Honors/Minor | ❌ Not Started | 0% |
| Notices | ⚠️ Partial | 30% |
| Reports | ❌ Not Started | 0% |
| System Features | ❌ Not Started | 0% |

### Files Summary
| Category | Built | Pending | Total |
|----------|-------|---------|-------|
| Auth Screens | 4 | 0 | 4 |
| Admin Screens | 5 | 15 | 20 |
| Teacher Screens | 1 | 35 | 36 |
| Student Screens | 1 | 55 | 56 |
| UI Components | 6 | 20 | 26 |
| Database Tables | 10 | 25 | 35 |
| Zustand Stores | 3 | 18 | 21 |

---

## 🚀 Next Steps

### Immediate (This Week)
1. Build `/(admin)/users/pending.tsx` - Pending approvals
2. Build `/(admin)/users/students.tsx` - Students list
3. Build `/(admin)/users/teachers.tsx` - Teachers list
4. Create reusable `UserList` and `UserCard` components

### Short Term (Next 2 Weeks)
1. Complete User Management module
2. Build Academic Management screens
3. Implement Teacher dashboard properly
4. Add attendance marking feature

### Medium Term (Next Month)
1. Complete Teacher module
2. Complete Student module
3. Implement Exams & Results
4. Add Fee management

---

## 📝 Notes

### Design Guidelines
- Use glassmorphism for cards (dark mode only)
- Clean white theme for light mode (no animations)
- Purple/Blue accent colors for dark mode
- Blue accent for light mode
- Consistent 16px/20px spacing
- Border radius: 14-20px for cards

### Performance Considerations
- Reduce animations on Android
- Use React.memo for list items
- Implement pagination for large lists
- Cache API responses with React Query (future)

### Security Notes
- All sensitive data encrypted
- RLS policies on all tables
- Role validation on API calls
- Session expiry handling

---

## ⚡ Quick Reference Card

### Most Used Commands

```powershell
# === DAILY WORKFLOW ===
npm run gen:types              # Regenerate TypeScript types
npm run dev                    # Start Expo
npm run hasura:console         # Open Hasura Console (visual DB editor)

# === DATABASE CHANGES ===
supabase migration new NAME    # Create new migration
supabase db push               # Deploy to production
supabase db pull               # Pull remote changes

# === HASURA ===
hasura console                 # Visual editor + auto migrations
hasura migrate apply           # Apply migrations
hasura metadata apply          # Apply permissions/relationships

# === TYPE SAFETY ===
supabase gen types typescript --project-id celwfcflcofejjpkpgcq > types/supabase.ts
```

### Environment Variables Needed

```env
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://celwfcflcofejjpkpgcq.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_HASURA_ENDPOINT=https://your-project.hasura.app/v1/graphql
HASURA_GRAPHQL_ADMIN_SECRET=your-hasura-admin-secret
```

### CLI Installation One-Liner

```powershell
# Windows (run as admin)
npm install -g supabase hasura-cli && supabase login
```

---

*Last Updated: November 30, 2025*

---

# 🏗️ TEAM PHASE PLAN — JPM COLLEGE APP (4-PERSON TEAM)

## 🌐 GLOBAL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              JPM COLLEGE APP - SYSTEM ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              📱 MOBILE APP (React Native + Expo)                     │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│   │  │   Admin     │  │   Teacher   │  │   Student   │  │    Auth     │                 │   │
│   │  │   Module    │  │   Module    │  │   Module    │  │   Module    │                 │   │
│   │  │  (9 roles)  │  │  (5 roles)  │  │ (18 features)│  │ (email only)│                 │   │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │   │
│   │         │                │                │                │                         │   │
│   │  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐                 │   │
│   │  │                    Zustand State Management                     │                 │   │
│   │  │   (authStore, themeStore, adminStores, teacherStores, etc.)    │                 │   │
│   │  └──────────────────────────────┬──────────────────────────────────┘                 │   │
│   │                                 │                                                    │   │
│   │  ┌──────────────────────────────┴──────────────────────────────────┐                 │   │
│   │  │                     GraphQL Client Layer                         │                 │   │
│   │  │        (Apollo Client / urql connecting to Hasura)              │                 │   │
│   │  └──────────────────────────────┬──────────────────────────────────┘                 │   │
│   └─────────────────────────────────┼───────────────────────────────────────────────────┘   │
│                                     │                                                       │
│                                     │ HTTPS/WSS                                             │
│                                     ▼                                                       │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              🔷 HASURA GRAPHQL ENGINE                                │   │
│   │  ┌─────────────────────────────────────────────────────────────────────────────┐    │   │
│   │  │  • Auto-generates GraphQL API from PostgreSQL schema                         │    │   │
│   │  │  • Real-time subscriptions (WebSocket)                                       │    │   │
│   │  │  • Role-based permissions (Admin/Teacher/Student)                            │    │   │
│   │  │  • Relationship tracking (foreign keys → GraphQL joins)                      │    │   │
│   │  │  • Actions (custom business logic via webhooks)                              │    │   │
│   │  │  • Event triggers (async processing)                                         │    │   │
│   │  └─────────────────────────────────┬───────────────────────────────────────────┘    │   │
│   └─────────────────────────────────────┼───────────────────────────────────────────────┘   │
│                                         │                                                   │
│                                         │ PostgreSQL Wire Protocol                         │
│                                         ▼                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              🟢 SUPABASE BACKEND                                     │   │
│   │                                                                                      │   │
│   │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐         │   │
│   │  │  PostgreSQL   │  │  Supabase     │  │  Supabase     │  │    Edge       │         │   │
│   │  │   Database    │  │    Auth       │  │   Storage     │  │  Functions    │         │   │
│   │  │  (35+ tables) │  │ (JWT, email)  │  │ (files, PDFs) │  │  (webhooks)   │         │   │
│   │  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘         │   │
│   │          │                  │                  │                  │                  │   │
│   │  ┌───────┴──────────────────┴──────────────────┴──────────────────┴───────┐         │   │
│   │  │                      Row Level Security (RLS)                           │         │   │
│   │  │   • Super Admin → Full access                                           │         │   │
│   │  │   • Admin roles → Scoped to their permissions                          │         │   │
│   │  │   • Teachers → Own data + assigned classes/subjects                    │         │   │
│   │  │   • Students → Own data only                                           │         │   │
│   │  └─────────────────────────────────────────────────────────────────────────┘         │   │
│   │                                                                                      │   │
│   └──────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA FLOW DIAGRAM                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│  │   Admin     │     │   Teacher   │     │   Student   │     │   Public    │               │
│  │   (Web/App) │     │    (App)    │     │    (App)    │     │   (View)    │               │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘               │
│         │                   │                   │                   │                       │
│         └─────────────┬─────┴─────────────┬─────┴───────────────────┘                       │
│                       │                   │                                                 │
│                       ▼                   ▼                                                 │
│         ┌─────────────────────────────────────────────────┐                                 │
│         │              Supabase Auth (JWT)                 │                                 │
│         │  • Email login → JWT token                       │                                 │
│         │  • Token contains: user_id, role, permissions    │                                 │
│         │  • Auto-refresh on expiry                        │                                 │
│         └────────────────────┬────────────────────────────┘                                 │
│                              │                                                              │
│                              ▼                                                              │
│         ┌─────────────────────────────────────────────────┐                                 │
│         │              Hasura GraphQL                      │                                 │
│         │  ┌─────────────────────────────────────────┐    │                                 │
│         │  │ Query: Get data (with RLS filtering)    │    │                                 │
│         │  │ Mutation: Create/Update/Delete          │    │                                 │
│         │  │ Subscription: Real-time updates         │    │                                 │
│         │  └─────────────────────────────────────────┘    │                                 │
│         └────────────────────┬────────────────────────────┘                                 │
│                              │                                                              │
│                              ▼                                                              │
│         ┌─────────────────────────────────────────────────┐                                 │
│         │              PostgreSQL + RLS                    │                                 │
│         │  ┌─────────────────────────────────────────┐    │                                 │
│         │  │ • profiles, roles, user_roles           │    │                                 │
│         │  │ • departments, courses, subjects        │    │                                 │
│         │  │ • students, teachers, attendance        │    │                                 │
│         │  │ • exams, marks, assignments             │    │                                 │
│         │  │ • canteen, library, bus, fees           │    │                                 │
│         │  │ • notices, events, feedback             │    │                                 │
│         │  │ • audit_logs (all actions logged)       │    │                                 │
│         │  └─────────────────────────────────────────┘    │                                 │
│         └────────────────────┬────────────────────────────┘                                 │
│                              │                                                              │
│                              ▼                                                              │
│         ┌─────────────────────────────────────────────────┐                                 │
│         │              Supabase Storage                    │                                 │
│         │  • /profile-photos/{user_id}                    │                                 │
│         │  • /materials/{course_id}/{file}                │                                 │
│         │  • /assignments/{assignment_id}/submissions     │                                 │
│         │  • /external-marks/{student_id}/{exam_id}       │                                 │
│         │  • /notices/{notice_id}/attachments             │                                 │
│         │  • /events/{event_id}/posters                   │                                 │
│         └─────────────────────────────────────────────────┘                                 │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 MODULE DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              MODULE DEPENDENCY GRAPH                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│                              ┌─────────────────────┐                                        │
│                              │    FOUNDATION       │                                        │
│                              │  (Phase 1 - Done)   │                                        │
│                              │  • Auth System      │                                        │
│                              │  • UI Components    │                                        │
│                              │  • Theme System     │                                        │
│                              │  • Navigation       │                                        │
│                              │  • Core DB Tables   │                                        │
│                              └──────────┬──────────┘                                        │
│                                         │                                                   │
│              ┌──────────────────────────┼──────────────────────────┐                        │
│              │                          │                          │                        │
│              ▼                          ▼                          ▼                        │
│  ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐               │
│  │   ADMIN MODULE    │      │  TEACHER MODULE   │      │  STUDENT MODULE   │               │
│  │    (Phase 2-3)    │      │   (Phase 4-5)     │      │    (Phase 6-7)    │               │
│  │                   │      │                   │      │                   │               │
│  │ • User Mgmt       │◄────►│ • Timetable View  │◄────►│ • Timetable View  │               │
│  │ • Academic Struct │      │ • Attendance Mark │      │ • Attendance View │               │
│  │ • Timetable Mgmt  │      │ • Materials Upload│      │ • Materials DL    │               │
│  │ • Exam Scheduling │      │ • Marks Entry     │      │ • Marks View      │               │
│  │ • Marks Verify    │      │ • Assignments     │      │ • Assignments Sub │               │
│  │ • Planner Monitor │      │ • Planner/Diary   │      │ • Exams/Results   │               │
│  └─────────┬─────────┘      └─────────┬─────────┘      └─────────┬─────────┘               │
│            │                          │                          │                          │
│            └──────────────────────────┼──────────────────────────┘                          │
│                                       │                                                     │
│                                       ▼                                                     │
│                         ┌─────────────────────────┐                                         │
│                         │    UTILITY MODULES      │                                         │
│                         │     (Phase 8-9)         │                                         │
│                         │                         │                                         │
│                         │  ┌─────────┐ ┌───────┐  │                                         │
│                         │  │ Library │ │  Bus  │  │                                         │
│                         │  └─────────┘ └───────┘  │                                         │
│                         │  ┌─────────┐ ┌───────┐  │                                         │
│                         │  │ Canteen │ │ Fees  │  │                                         │
│                         │  └─────────┘ └───────┘  │                                         │
│                         │  ┌─────────┐ ┌───────┐  │                                         │
│                         │  │ Events  │ │Notices│  │                                         │
│                         │  └─────────┘ └───────┘  │                                         │
│                         └─────────────────────────┘                                         │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 TEAM STRUCTURE & RESPONSIBILITIES

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TEAM STRUCTURE                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│                                   ┌─────────────┐                                           │
│                                   │     ASH     │                                           │
│                                   │  (Master)   │                                           │
│                                   │             │                                           │
│                                   │ • System    │                                           │
│                                   │   Architect │                                           │
│                                   │ • DB Design │                                           │
│                                   │ • Code Rev  │                                           │
│                                   │ • Core APIs │                                           │
│                                   │ • Auth/RLS  │                                           │
│                                   └──────┬──────┘                                           │
│                                          │                                                  │
│                   ┌──────────────────────┴──────────────────────┐                           │
│                   │                                             │                           │
│                   ▼                                             ▼                           │
│           ┌─────────────┐                               ┌─────────────┐                     │
│           │    ABIN     │                               │   CHRISTO   │                     │
│           │ (Assistant) │                               │   & DEON    │                     │
│           │             │                               │             │                     │
│           │ • Teacher   │                               │ • Student   │                     │
│           │   Module    │                               │   Module    │                     │
│           │ • Admin UI  │                               │ • UI/UX     │                     │
│           │ • GraphQL   │                               │ • Screens   │                     │
│           │   Queries   │                               │ • Testing   │                     │
│           └─────────────┘                               └─────────────┘                     │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 📅 DETAILED PHASE PLAN (12 WEEKS)

---

## 📌 PHASE 1: FOUNDATION & DATABASE (Week 1-2) ✅ COMPLETE

**Status: DONE**

| Task | Owner | Duration | Status |
|------|-------|----------|--------|
| Project Setup (Expo, TS, ESLint) | Ash | 1 day | ✅ |
| UI Component Library | Christo | 3 days | ✅ |
| Theme System (Dark/Light) | Deon | 2 days | ✅ |
| Auth Flow (Email only) | Ash | 2 days | ✅ |
| Database Schema Design | Ash | 2 days | ✅ |
| Core Navigation Setup | Abin | 1 day | ✅ |
| Supabase + Hasura Integration | Ash | 2 days | ✅ |

---

## 📌 PHASE 2: CORE DATABASE & ADMIN FOUNDATION (Week 3-4)

**Goal: Complete database schema + Admin core screens**

### Week 3: Database Layer

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Core Tables Migration** | Ash | 2 days | Phase 1 | profiles, roles, user_roles, departments, courses, subjects, semesters |
| **Academic Tables** | Ash | 1 day | Core Tables | timetable_master, periods, rooms |
| **Student/Teacher Tables** | Ash | 1 day | Core Tables | students, teachers, teacher_subjects, teacher_classes |
| **RLS Policies - Core** | Ash | 1 day | All Tables | Super Admin, Principal, Dept Admin policies |
| **Hasura Setup** | Abin | 2 days | Tables Done | Track all tables, relationships, permissions |
| **Type Generation Script** | Abin | 0.5 day | Hasura | npm run gen:types working |
| **GraphQL Queries Setup** | Abin | 1.5 days | Hasura | lib/graphql/queries.ts, mutations.ts |

### Week 4: Admin Module - Core

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Admin Dashboard Enhancement** | Abin | 2 days | GraphQL Ready | Stats cards, quick actions, pending counts |
| **User List Components** | Christo | 2 days | Types Ready | UserCard, UserList, filters, search |
| **Students Management Screen** | Deon | 2 days | Components | /(admin)/users/students.tsx - list, block/unblock |
| **Teachers Management Screen** | Deon | 2 days | Components | /(admin)/users/teachers.tsx - list, roles view |
| **Pending Approvals Screen** | Christo | 1.5 days | GraphQL | /(admin)/users/pending.tsx |
| **Admin Store Setup** | Abin | 1 day | Screens | userManagementStore.ts |

### Week 3-4 Deliverables Checklist:

```
DATABASE (Ash):
□ Migration: 20241201_core_tables.sql
  - profiles (extended)
  - roles (9 admin + 5 teacher)
  - user_roles (many-to-many)
  - departments
  - courses
  - subjects
  - academic_years
  - semesters

□ Migration: 20241202_academic_tables.sql
  - timetable_master
  - periods
  - rooms
  - students (extended)
  - teachers (extended)
  - teacher_subjects
  - teacher_classes

□ Migration: 20241203_rls_policies.sql
  - Super Admin: full access
  - Principal: read all, limited write
  - Dept Admin: dept scope
  - HOD: dept + approval scope
  - Teachers: own data
  - Students: own data

HASURA (Abin):
□ Track all tables in Hasura Console
□ Setup relationships:
  - profiles → user_roles → roles
  - students → profiles
  - teachers → profiles
  - courses → departments
  - subjects → departments
□ Permission rules per role
□ Generated TypeScript types

FRONTEND (Christo + Deon):
□ Components:
  - UserCard.tsx
  - UserList.tsx
  - FilterBar.tsx
  - SearchInput.tsx
  - StatusBadge.tsx
  
□ Screens:
  - /(admin)/users/students.tsx
  - /(admin)/users/teachers.tsx
  - /(admin)/users/pending.tsx
  - /(admin)/dashboard.tsx (enhanced)

□ Stores:
  - userManagementStore.ts
```

---

## 📌 PHASE 3: ADMIN MODULE COMPLETE (Week 5-6)

**Goal: Full Admin module with all 16 features**

### Week 5: Academic Management + Exams

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Departments CRUD** | Christo | 1.5 days | Phase 2 | /(admin)/academic/departments.tsx |
| **Courses CRUD** | Christo | 1.5 days | Departments | /(admin)/academic/courses.tsx |
| **Subjects CRUD** | Deon | 1.5 days | Courses | /(admin)/academic/subjects.tsx |
| **Timetable Builder** | Abin | 3 days | Subjects | /(admin)/timetable/create.tsx, assign.tsx, publish.tsx |
| **Exam Tables Migration** | Ash | 1 day | Phase 2 | exams, exam_schedules, internal_marks, external_uploads |
| **Exam Scheduling Screen** | Deon | 2 days | Exam Tables | /(admin)/exams/schedule.tsx |
| **Exam Timetable Publish** | Deon | 1 day | Scheduling | /(admin)/exams/timetable.tsx |
| **Marks Verification Screens** | Abin | 2 days | Exam Tables | verify-internal.tsx, verify-external.tsx |

### Week 6: Notices, Analytics, Settings

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Notices Tables** | Ash | 0.5 day | Phase 2 | notices, notice_attachments |
| **Notice Create Screen** | Christo | 1.5 days | Tables | /(admin)/notices/create.tsx |
| **Notice Scheduling** | Christo | 1 day | Create | /(admin)/notices/scheduled.tsx |
| **Analytics Dashboard** | Abin | 2 days | All Data | /(admin)/analytics/*.tsx (attendance, exams, dept) |
| **Export Reports** | Abin | 1 day | Analytics | PDF/CSV export function |
| **Settings Screens** | Deon | 2 days | - | academic-year.tsx, college-info.tsx, modules.tsx |
| **Audit Log Viewer** | Deon | 1.5 days | audit_logs table | /(admin)/audit/logs.tsx |
| **Admin Stores Complete** | Abin | 1 day | All Screens | All 15 admin stores |

### Week 5-6 Deliverables Checklist:

```
DATABASE (Ash):
□ Migration: 20241205_exam_tables.sql
  - exams
  - exam_schedules
  - internal_marks
  - external_uploads (student marks)
  
□ Migration: 20241206_notices_tables.sql
  - notices
  - notice_attachments
  - notice_reads
  
□ Migration: 20241207_settings_tables.sql
  - admin_settings
  - holidays
  - module_toggles

FRONTEND (All):
□ Academic Screens:
  - departments.tsx
  - courses.tsx
  - subjects.tsx
  - semesters.tsx
  - minor-programs.tsx

□ Timetable Screens:
  - create.tsx (master timetable)
  - assign.tsx (teacher assignment)
  - rooms.tsx (room management)
  - publish.tsx

□ Exam Screens:
  - schedule.tsx
  - timetable.tsx
  - verify-internal.tsx
  - verify-external.tsx
  - analytics.tsx

□ Notice Screens:
  - create.tsx
  - scheduled.tsx
  - index.tsx (enhanced)

□ Analytics Screens:
  - attendance.tsx
  - exams.tsx
  - departments.tsx
  - export.tsx

□ Settings Screens:
  - academic-year.tsx
  - college-info.tsx
  - modules.tsx
  - backup.tsx
  - maintenance.tsx

□ Audit Screen:
  - logs.tsx

STORES (Abin):
□ academicStructureStore.ts
□ examAdminStore.ts
□ timetableAdminStore.ts
□ noticeAdminStore.ts
□ analyticsStore.ts
□ settingsAdminStore.ts
□ auditStore.ts
```

---

## 📌 PHASE 4: TEACHER MODULE - CORE (Week 7-8)

**Goal: Subject Teacher functionality complete**

### Week 7: Base Teacher Features

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Teacher Tables** | Ash | 1 day | Phase 3 | teacher_subjects, attendance_records |
| **Teacher Dashboard** | Abin | 2 days | Tables | /(teacher)/dashboard.tsx (enhanced) |
| **Timetable View (Teacher)** | Christo | 1.5 days | timetable_master | /(teacher)/timetable/*.tsx |
| **Attendance Tables** | Ash | 1 day | Teacher Tables | attendance, attendance_records |
| **Attendance Marking UI** | Deon | 3 days | Tables | /(teacher)/attendance/mark.tsx, summary.tsx |
| **Attendance Store** | Abin | 1 day | UI Done | attendanceStore.ts |
| **Subject Teacher Store** | Abin | 1 day | - | subjectTeacherStore.ts |

### Week 8: Materials, Assignments, Marks

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Materials Tables** | Ash | 0.5 day | - | teaching_materials |
| **Materials Upload Screen** | Christo | 2 days | Storage Setup | /(teacher)/materials/upload.tsx |
| **Materials List Screen** | Christo | 1 day | Upload | /(teacher)/materials/index.tsx |
| **Assignment Tables** | Ash | 0.5 day | - | assignments, submissions |
| **Assignment CRUD** | Deon | 2.5 days | Tables | /(teacher)/assignments/*.tsx |
| **Submission Grading** | Deon | 1.5 days | CRUD | grade.tsx, feedback |
| **Internal Marks Entry** | Abin | 2 days | exam tables | /(teacher)/marks/entry.tsx |
| **CSV Upload for Marks** | Abin | 1 day | Entry | /(teacher)/marks/csv-upload.tsx |
| **Materials Store** | Abin | 0.5 day | - | materialsStore.ts |
| **Assignment Store** | Abin | 0.5 day | - | assignmentStore.ts |

### Week 7-8 Deliverables Checklist:

```
DATABASE (Ash):
□ Migration: 20241210_teacher_tables.sql
  - teacher_subjects (junction)
  - teacher_classes (junction)
  
□ Migration: 20241211_attendance_tables.sql
  - attendance_sessions
  - attendance_records
  
□ Migration: 20241212_materials_assignments.sql
  - teaching_materials
  - assignments
  - submissions
  
□ Storage Buckets:
  - materials (public read, auth upload)
  - submissions (private)

FRONTEND (All):
□ Teacher Dashboard:
  - Today's classes widget
  - Quick attendance actions
  - Pending submissions count
  - Recent marks updates

□ Timetable Screens:
  - /(teacher)/timetable/index.tsx (today)
  - /(teacher)/timetable/weekly.tsx
  
□ Attendance Screens:
  - /(teacher)/attendance/mark.tsx
  - /(teacher)/attendance/summary.tsx
  - /(teacher)/attendance/history.tsx
  
□ Materials Screens:
  - /(teacher)/materials/index.tsx
  - /(teacher)/materials/upload.tsx
  - /(teacher)/materials/[id].tsx
  
□ Assignment Screens:
  - /(teacher)/assignments/index.tsx
  - /(teacher)/assignments/create.tsx
  - /(teacher)/assignments/[id].tsx
  - /(teacher)/assignments/grade.tsx
  
□ Marks Screens:
  - /(teacher)/marks/entry.tsx
  - /(teacher)/marks/csv-upload.tsx
  - /(teacher)/marks/subject-report.tsx

STORES (Abin):
□ teacherDashboardStore.ts
□ timetableStore.ts
□ attendanceStore.ts
□ materialsStore.ts
□ assignmentStore.ts
□ marksStore.ts
```

---

## 📌 PHASE 5: TEACHER MODULE - ADVANCED (Week 9-10)

**Goal: Lesson Planner, Work Diary, Role-specific features**

### Week 9: Planner & Diary

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Planner Tables** | Ash | 1 day | - | lesson_planners, planner_topics, planner_approvals |
| **Diary Tables** | Ash | 1 day | - | work_diaries, diary_entries, diary_approvals |
| **Syllabus Upload** | Christo | 1.5 days | Planner Tables | /(teacher)/planner/upload.tsx |
| **Weekly Planner View** | Christo | 2 days | Upload | /(teacher)/planner/weekly.tsx |
| **Mark Completed Topics** | Christo | 1 day | View | Completion toggle in view |
| **Submit for Approval** | Abin | 1 day | View | Approval submission flow |
| **Daily Diary Entry** | Deon | 2 days | Diary Tables | /(teacher)/diary/daily.tsx |
| **Monthly Diary View** | Deon | 1.5 days | Daily | /(teacher)/diary/monthly.tsx |
| **Diary Approval Submit** | Deon | 1 day | Monthly | Submit + status tracking |
| **Planner/Diary Stores** | Abin | 1 day | All Screens | plannerStore.ts, diaryStore.ts |

### Week 10: Role-Specific Features

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Substitution Tables** | Ash | 0.5 day | - | substitutions |
| **Mentor Assignment Tables** | Ash | 0.5 day | - | mentor_assignments, counselling_notes |
| **Class Teacher Dashboard** | Abin | 2 days | Tables | /(teacher)/class-teacher/dashboard.tsx |
| **Class Attendance Overview** | Abin | 1 day | Dashboard | Full class attendance view |
| **Mentor Dashboard** | Christo | 2 days | Tables | /(teacher)/mentor/dashboard.tsx |
| **Counselling Notes** | Christo | 1.5 days | Dashboard | /(teacher)/mentor/notes.tsx |
| **Coordinator Dashboard** | Deon | 2 days | Substitution | /(teacher)/coordinator/dashboard.tsx |
| **Substitution Assignment** | Deon | 1.5 days | Dashboard | /(teacher)/coordinator/assign.tsx |
| **HoD Dashboard** | Abin | 2 days | All | /(teacher)/hod/dashboard.tsx |
| **Approval Screens (HoD)** | Abin | 1.5 days | Dashboard | Planner/Diary approval screens |

### Week 9-10 Deliverables Checklist:

```
DATABASE (Ash):
□ Migration: 20241215_planner_tables.sql
  - lesson_planners
  - planner_topics
  - planner_approvals
  
□ Migration: 20241216_diary_tables.sql
  - work_diaries
  - diary_entries
  - diary_approvals
  
□ Migration: 20241217_teacher_roles_tables.sql
  - substitutions
  - mentor_assignments
  - counselling_notes

FRONTEND (All):
□ Lesson Planner Screens:
  - /(teacher)/planner/upload.tsx
  - /(teacher)/planner/weekly.tsx
  - /(teacher)/planner/monthly.tsx
  - /(teacher)/planner/status.tsx
  
□ Work Diary Screens:
  - /(teacher)/diary/daily.tsx
  - /(teacher)/diary/monthly.tsx
  - /(teacher)/diary/status.tsx
  
□ Class Teacher Screens:
  - /(teacher)/class-teacher/dashboard.tsx
  - /(teacher)/class-teacher/students.tsx
  - /(teacher)/class-teacher/attendance.tsx
  
□ Mentor Screens:
  - /(teacher)/mentor/dashboard.tsx
  - /(teacher)/mentor/students.tsx
  - /(teacher)/mentor/notes.tsx
  - /(teacher)/mentor/follow-up.tsx
  
□ Coordinator Screens:
  - /(teacher)/coordinator/dashboard.tsx
  - /(teacher)/coordinator/assign.tsx
  - /(teacher)/coordinator/pending.tsx
  
□ HoD Screens:
  - /(teacher)/hod/dashboard.tsx
  - /(teacher)/hod/planners.tsx
  - /(teacher)/hod/diaries.tsx
  - /(teacher)/hod/analytics.tsx

STORES (Abin):
□ plannerStore.ts
□ diaryStore.ts
□ classTeacherStore.ts
□ mentorStore.ts
□ coordinatorStore.ts
□ hodStore.ts
```

---

## 📌 PHASE 6: STUDENT MODULE - CORE (Week 11-12)

**Goal: Dashboard, Attendance, Timetable, Materials, Assignments**

### Week 11: Student Core

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Student Dashboard** | Abin | 2 days | Teacher Done | /(student)/dashboard.tsx (full) |
| **Profile View/Edit** | Christo | 1.5 days | - | /(student)/profile.tsx |
| **Profile Photo Upload** | Christo | 1 day | Storage | /(student)/profile-photo.tsx |
| **Attendance View** | Deon | 2 days | attendance tables | /(student)/attendance/index.tsx |
| **Attendance Calendar** | Deon | 1.5 days | View | /(student)/attendance/calendar.tsx |
| **Shortage Alerts** | Deon | 1 day | View | /(student)/attendance/alerts.tsx |
| **Student Timetable** | Christo | 1.5 days | timetable tables | /(student)/timetable/*.tsx |
| **Student Dashboard Store** | Abin | 1 day | Dashboard | studentDashboardStore.ts |
| **Attendance Store (Student)** | Abin | 0.5 day | Attendance | attendanceStore.ts (student) |

### Week 12: Materials, Assignments, Marks

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Materials Download** | Christo | 1.5 days | Teacher materials | /(student)/materials/index.tsx |
| **Materials Search** | Christo | 1 day | Download | /(student)/materials/search.tsx |
| **Offline Downloads** | Christo | 1 day | Download | /(student)/materials/downloads.tsx |
| **Assignment List** | Deon | 1.5 days | Teacher assignments | /(student)/assignments/index.tsx |
| **Assignment Submit** | Deon | 2 days | List | /(student)/assignments/submit.tsx |
| **Assignment Feedback** | Deon | 1 day | Submit | /(student)/assignments/[id].tsx |
| **Internal Marks View** | Abin | 1.5 days | marks tables | /(student)/marks/index.tsx |
| **External Marks Upload** | Abin | 2 days | Storage | /(student)/marks/upload-external.tsx |
| **Marks Store** | Abin | 0.5 day | Marks Screens | marksStore.ts (student) |
| **Materials Store** | Abin | 0.5 day | Materials | materialsStore.ts (student) |

### Week 11-12 Deliverables Checklist:

```
FRONTEND (All):
□ Student Dashboard:
  - Today's timetable widget
  - Attendance percentage
  - Pending assignments
  - Recent marks
  - Quick actions

□ Profile Screens:
  - /(student)/profile.tsx
  - /(student)/profile-photo.tsx
  
□ Attendance Screens:
  - /(student)/attendance/index.tsx
  - /(student)/attendance/daily.tsx
  - /(student)/attendance/calendar.tsx
  - /(student)/attendance/alerts.tsx
  
□ Timetable Screens:
  - /(student)/timetable/index.tsx
  - /(student)/timetable/weekly.tsx
  - /(student)/timetable/substitutions.tsx
  
□ Materials Screens:
  - /(student)/materials/index.tsx
  - /(student)/materials/[courseId].tsx
  - /(student)/materials/downloads.tsx
  - /(student)/materials/search.tsx
  
□ Assignment Screens:
  - /(student)/assignments/index.tsx
  - /(student)/assignments/[id].tsx
  - /(student)/assignments/submit.tsx
  - /(student)/assignments/calendar.tsx
  
□ Marks Screens:
  - /(student)/marks/index.tsx
  - /(student)/marks/[courseId].tsx
  - /(student)/marks/history.tsx
  - /(student)/marks/upload-external.tsx

STORES (Abin):
□ studentDashboardStore.ts
□ attendanceStore.ts (student version)
□ timetableStore.ts (student version)
□ materialsStore.ts (student version)
□ assignmentStore.ts (student version)
□ marksStore.ts (student version)
```

---

## 📌 PHASE 7: STUDENT MODULE - ACADEMIC + UTILITIES (Week 13-14)

**Goal: Exams, Library, Canteen, Bus, Fees**

### Week 13: Exams & Library

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Exam Timetable View** | Christo | 1.5 days | exam tables | /(student)/exams/timetable.tsx |
| **Hall Ticket Screen** | Christo | 1 day | Exam View | /(student)/exams/hallticket.tsx |
| **Results View** | Christo | 1.5 days | Results | /(student)/exams/results.tsx |
| **GPA Calculator** | Christo | 1 day | Results | /(student)/exams/gpa.tsx |
| **Library Tables** | Ash | 1 day | - | books, book_transactions, reservations |
| **Library Search** | Deon | 1.5 days | Tables | /(student)/library/search.tsx |
| **Borrowed Books** | Deon | 1 day | Search | /(student)/library/borrowed.tsx |
| **Book Request** | Deon | 1 day | Borrowed | /(student)/library/request.tsx |
| **Library Fines** | Deon | 0.5 day | Borrowed | /(student)/library/fines.tsx |
| **Exam Store** | Abin | 1 day | Exam Screens | examStore.ts |
| **Library Store** | Abin | 1 day | Library Screens | libraryStore.ts |

### Week 14: Canteen, Bus, Fees

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Canteen Tables** | Ash | 1 day | - | canteen_menu, canteen_tokens, canteen_payments |
| **Canteen Menu View** | Christo | 1 day | Tables | /(student)/canteen/index.tsx |
| **Token Order System** | Christo | 2 days | Menu | /(student)/canteen/order.tsx, token-status.tsx |
| **My Orders** | Christo | 1 day | Order | /(student)/canteen/my-orders.tsx |
| **Bus Tables** | Ash | 0.5 day | - | bus_routes, bus_stops, bus_subscriptions |
| **Bus Selection** | Deon | 1.5 days | Tables | /(student)/bus/select.tsx |
| **Bus Route View** | Deon | 1 day | Selection | /(student)/bus/route.tsx |
| **Bus Alerts** | Deon | 0.5 day | Route | /(student)/bus/alerts.tsx |
| **Fee Tables** | Ash | 0.5 day | - | fee_structure, payments, receipts |
| **Fee Details** | Abin | 1.5 days | Tables | /(student)/fees/index.tsx |
| **Fee Payment** | Abin | 1.5 days | Details | /(student)/fees/pay.tsx |
| **Fee Receipts** | Abin | 1 day | Payment | /(student)/fees/receipts.tsx |
| **Canteen Store** | Abin | 0.5 day | Canteen | canteenStore.ts |
| **Bus Store** | Abin | 0.5 day | Bus | busStore.ts |
| **Fee Store** | Abin | 0.5 day | Fee | feeStore.ts |

### Week 13-14 Deliverables Checklist:

```
DATABASE (Ash):
□ Migration: 20241220_library_tables.sql
  - books
  - book_transactions
  - reservations
  
□ Migration: 20241221_canteen_tables.sql
  - canteen_menu
  - canteen_tokens
  - canteen_token_counter
  - canteen_payments
  
□ Migration: 20241222_bus_tables.sql
  - bus_routes
  - bus_stops
  - bus_subscriptions
  - bus_approvals
  
□ Migration: 20241223_fee_tables.sql
  - fee_structure
  - payments
  - receipts

FRONTEND (All):
□ Exam Screens:
  - /(student)/exams/index.tsx
  - /(student)/exams/timetable.tsx
  - /(student)/exams/hallticket.tsx
  - /(student)/exams/results.tsx
  - /(student)/exams/gpa.tsx
  
□ Library Screens:
  - /(student)/library/index.tsx
  - /(student)/library/search.tsx
  - /(student)/library/borrowed.tsx
  - /(student)/library/fines.tsx
  - /(student)/library/request.tsx
  
□ Canteen Screens:
  - /(student)/canteen/index.tsx
  - /(student)/canteen/order.tsx
  - /(student)/canteen/token-status.tsx
  - /(student)/canteen/my-orders.tsx
  - /(student)/canteen/request-refund.tsx
  
□ Bus Screens:
  - /(student)/bus/index.tsx
  - /(student)/bus/select.tsx
  - /(student)/bus/route.tsx
  - /(student)/bus/alerts.tsx
  
□ Fee Screens:
  - /(student)/fees/index.tsx
  - /(student)/fees/receipts.tsx
  - /(student)/fees/dues.tsx
  - /(student)/fees/pay.tsx

STORES (Abin):
□ examStore.ts
□ libraryStore.ts
□ canteenStore.ts
□ busStore.ts
□ feeStore.ts
```

---

## 📌 PHASE 8: REMAINING FEATURES & POLISH (Week 15-16)

**Goal: Events, Feedback, Notices, Settings, Honors/Minor**

### Week 15: Events, Feedback, Notices

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Events List** | Christo | 1 day | events table | /(student)/events/index.tsx |
| **Event Details** | Christo | 1 day | List | /(student)/events/[id].tsx |
| **Certificates** | Christo | 1 day | Details | /(student)/events/certificates.tsx |
| **Feedback Tables** | Ash | 0.5 day | - | feedback, complaints, complaint_comments |
| **Teacher Feedback** | Deon | 1.5 days | Tables | /(student)/feedback/teacher.tsx |
| **College Feedback** | Deon | 1 day | Tables | /(student)/feedback/college.tsx |
| **Complaints System** | Deon | 2 days | Tables | /(student)/feedback/complaints.tsx |
| **Notices View** | Abin | 1.5 days | notice tables | /(student)/notices/index.tsx |
| **Notice Details** | Abin | 1 day | View | /(student)/notices/[id].tsx |
| **Push Notifications** | Abin | 1.5 days | All | Notification service setup |
| **Event Store** | Abin | 0.5 day | Events | eventStore.ts |
| **Feedback Store** | Abin | 0.5 day | Feedback | feedbackStore.ts |
| **Notice Store** | Abin | 0.5 day | Notices | noticeStore.ts |

### Week 16: Honors/Minor, Settings, Admin Utilities

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Minor Programs Tables** | Ash | 0.5 day | - | minor_programs, minor_applications |
| **Honors/Minor View** | Christo | 1.5 days | Tables | /(student)/honors/index.tsx |
| **Minor Selection** | Christo | 1.5 days | View | /(student)/honors/minor.tsx |
| **Settings Screen** | Deon | 1.5 days | - | /(student)/settings/index.tsx |
| **Notification Prefs** | Deon | 1 day | Settings | /(student)/settings/notifications.tsx |
| **Support Screens** | Deon | 1.5 days | - | /(student)/support/*.tsx (contacts, faq) |
| **Admin Library Screens** | Christo | 2 days | Library Tables | /(admin)/library/*.tsx |
| **Admin Bus Screens** | Deon | 2 days | Bus Tables | /(admin)/bus/*.tsx |
| **Admin Canteen Screens** | Abin | 2 days | Canteen Tables | /(admin)/canteen/*.tsx |
| **Admin Fee Screens** | Abin | 2 days | Fee Tables | /(admin)/fees/*.tsx |
| **Canteen Staff Screens** | Ash | 1 day | Canteen | canteen-staff/*.tsx (dashboard, status) |

### Week 15-16 Deliverables Checklist:

```
DATABASE (Ash):
□ Migration: 20241225_feedback_tables.sql
  - feedback
  - complaints
  - complaint_comments
  
□ Migration: 20241226_honors_tables.sql
  - minor_programs
  - minor_applications
  
□ Migration: 20241227_student_settings.sql
  - student_settings

FRONTEND (All):
□ Event Screens:
  - /(student)/events/index.tsx
  - /(student)/events/[id].tsx
  - /(student)/events/certificates.tsx
  
□ Feedback Screens:
  - /(student)/feedback/index.tsx
  - /(student)/feedback/teacher.tsx
  - /(student)/feedback/college.tsx
  - /(student)/feedback/complaints.tsx
  
□ Notice Screens:
  - /(student)/notices/index.tsx
  - /(student)/notices/[id].tsx
  - /(student)/notices/notifications.tsx
  
□ Honors/Minor Screens:
  - /(student)/honors/index.tsx
  - /(student)/honors/minor.tsx
  - /(student)/honors/courses.tsx
  
□ Settings Screens:
  - /(student)/settings/index.tsx
  - /(student)/settings/notifications.tsx
  - /(student)/settings/about.tsx
  
□ Support Screens:
  - /(student)/support/index.tsx
  - /(student)/support/contacts.tsx
  - /(student)/support/faq.tsx
  
□ Admin Utility Screens:
  - /(admin)/library/*.tsx
  - /(admin)/bus/*.tsx
  - /(admin)/canteen/*.tsx
  - /(admin)/fees/*.tsx

STORES (Abin):
□ honorsStore.ts
□ settingsStore.ts (student)
```

---

## 📌 PHASE 9: TESTING & OPTIMIZATION (Week 17-18)

**Goal: Full testing, performance optimization, bug fixes**

### Week 17: Testing

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Unit Tests Setup** | Ash | 1 day | - | Jest config, test utils |
| **Auth Tests** | Ash | 1 day | Unit Tests | auth flow tests |
| **Admin Module Tests** | Abin | 2 days | Unit Tests | All admin store tests |
| **Teacher Module Tests** | Abin | 2 days | Unit Tests | All teacher store tests |
| **Student Module Tests** | Christo | 2 days | Unit Tests | All student store tests |
| **Integration Tests** | Deon | 2 days | All | API integration tests |
| **E2E Test Setup** | Deon | 1 day | - | Detox config |
| **Critical Path E2E** | Deon | 2 days | E2E Setup | Login, Dashboard, Attendance flows |

### Week 18: Optimization

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Performance Audit** | Ash | 1 day | All Modules | Performance report |
| **List Virtualization** | Christo | 2 days | Audit | FlatList optimizations |
| **Image Optimization** | Christo | 1 day | Audit | Lazy loading, caching |
| **Bundle Size Reduction** | Abin | 1.5 days | Audit | Tree shaking, code splitting |
| **API Caching** | Abin | 1.5 days | Audit | React Query integration |
| **Offline Support** | Deon | 2 days | Caching | AsyncStorage caching |
| **Memory Leaks Fix** | Ash | 1 day | Audit | Memory profiling fixes |
| **Android Performance** | Ash | 1 day | Audit | Android-specific optimizations |
| **Bug Fixes** | All | 2 days | Testing | Critical bug fixes |

---

## 📌 PHASE 10: SECURITY & LAUNCH (Week 19-20)

**Goal: Security audit, final polish, deployment**

### Week 19: Security

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Security Audit** | Ash | 2 days | - | Security report |
| **RLS Policy Review** | Ash | 1 day | Audit | RLS fixes |
| **API Security Review** | Ash | 1 day | Audit | API hardening |
| **Input Validation** | Abin | 2 days | Audit | Zod schemas everywhere |
| **Error Handling** | Abin | 1 day | Audit | Global error boundaries |
| **Audit Logging Complete** | Christo | 2 days | - | All actions logged |
| **Session Security** | Deon | 1 day | Audit | Token refresh, expiry handling |
| **Data Encryption** | Deon | 1 day | Audit | Sensitive data encryption |

### Week 20: Launch

| Task | Owner | Duration | Dependencies | Deliverables |
|------|-------|----------|--------------|--------------|
| **Final Bug Fixes** | All | 2 days | Testing | All critical bugs fixed |
| **App Icons & Splash** | Christo | 1 day | - | Final assets |
| **Play Store Prep** | Deon | 1 day | Assets | Listing, screenshots |
| **App Store Prep** | Deon | 1 day | Assets | Listing, screenshots |
| **Production Deploy** | Ash | 1 day | All | Production Supabase/Hasura |
| **CI/CD Setup** | Ash | 1 day | Deploy | GitHub Actions |
| **Documentation** | Abin | 2 days | All | User guide, API docs |
| **Team Training** | Ash | 1 day | Docs | Admin training session |
| **Launch!** | All | - | All | 🚀 |

---

## 📊 PHASE SUMMARY TABLE

| Phase | Week | Focus | Ash | Abin | Christo | Deon |
|-------|------|-------|-----|------|---------|------|
| 1 | 1-2 | Foundation | ✅ Setup, Auth, DB | ✅ Nav | ✅ UI Components | ✅ Theme |
| 2 | 3-4 | DB + Admin Core | DB, RLS | Hasura, Stores | Components | Screens |
| 3 | 5-6 | Admin Complete | Exam Tables | Analytics, Marks | Academic, Notices | Exams, Settings |
| 4 | 7-8 | Teacher Core | Attendance Tables | Dashboard, Marks | Materials | Attendance, Assign |
| 5 | 9-10 | Teacher Advanced | Planner/Diary Tables | HoD, Approvals | Planner, Mentor | Diary, Coordinator |
| 6 | 11-12 | Student Core | - | Dashboard, Stores | Profile, Materials | Attendance, Assign |
| 7 | 13-14 | Student Utilities | Utility Tables | Fees | Exams, Canteen | Library, Bus |
| 8 | 15-16 | Remaining | Feedback Tables | Notices, Admin Utils | Events, Honors | Feedback, Settings |
| 9 | 17-18 | Testing | Unit Tests, Perf | Store Tests, Caching | UI Tests, Images | Integration, E2E |
| 10 | 19-20 | Launch | Security, Deploy | Validation, Docs | Audit Log, Assets | Security, Stores |

---

## 🔑 KEY MILESTONES

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| Database Schema Complete | Week 4 | All migrations applied |
| Admin Module Complete | Week 6 | All 16 admin features working |
| Teacher Module Complete | Week 10 | All 5 teacher roles working |
| Student Core Complete | Week 12 | Dashboard, Attendance, Assignments |
| Student Full Complete | Week 14 | All 18 student features |
| All Features Complete | Week 16 | Full app functionality |
| Testing Complete | Week 18 | All tests passing |
| Launch Ready | Week 20 | App deployed to stores |

---

## 📝 DAILY STANDUP FORMAT

Each day, all team members report:

1. **Yesterday**: What was completed
2. **Today**: What will be worked on
3. **Blockers**: Any issues needing help

**Standup Time**: 9:00 AM daily (15 min max)

---

## 🔄 CODE REVIEW PROCESS

1. **All PRs require review** before merge
2. **Ash reviews**: Database changes, Auth, Security
3. **Abin reviews**: GraphQL, State management, API
4. **Cross-review**: Christo ↔ Deon for UI screens

**PR Template**:
```markdown
## Summary
[What does this PR do?]

## Type
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor

## Screens/Components
- List of affected files

## Testing
- How was this tested?

## Screenshots (if UI)
[Add screenshots]
```

---

## 📁 BRANCH STRATEGY

```
main (production)
  │
  └── develop (integration)
        │
        ├── feature/admin-users      (Abin)
        ├── feature/admin-academic   (Christo)
        ├── feature/admin-exams      (Deon)
        ├── feature/teacher-core     (Abin)
        ├── feature/teacher-planner  (Christo)
        ├── feature/student-core     (Deon)
        └── fix/bug-name             (anyone)
```

**Naming Convention**:
- `feature/module-feature` for new features
- `fix/bug-description` for bug fixes
- `refactor/area` for refactoring

---

*Team Phase Plan - Last Updated: November 30, 2025*
