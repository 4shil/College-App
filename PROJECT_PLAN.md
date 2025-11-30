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

### 🔴 Admin Roles (Category: `admin`)
```
├── super_admin          → Full system access
├── principal            → College principal (Approves diaries/planners)
├── department_admin     → Department level admin
├── hod                  → Head of Department (Approves planners/diaries/leaves)
├── exam_cell_admin      → Manages exams & results
├── library_admin        → Manages library
├── bus_admin            → Manages transportation
├── canteen_admin        → Manages canteen
└── finance_admin        → Manages fees & finances
```

### 🟡 Teacher Roles (Category: `teacher`) - STACKED HIERARCHY
```
├── subject_teacher      → Base role (every teacher gets this)
│   ├── class_teacher    → + In-charge of a class/section
│   │   ├── mentor       → + Mentors specific students
│   │   └── coordinator  → + Manages substitute assignments
└── hod                  → + Department head (highest teacher role)
```

### 🟢 Student Role (Category: `student`)
```
└── student              → Regular enrolled student
```

### Role Permissions Matrix (Updated 2025)
| Feature | Super Admin | Principal | HOD | Class Teacher | Subject Teacher | Student |
|---------|-------------|-----------|-----|---------------|-----------------|---------|
| Manage Users | ✅ | ✅ | ⚠️ Dept | ❌ | ❌ | ❌ |
| View All Students | ✅ | ✅ | ✅ Dept | ✅ Class | ✅ Subject | ❌ |
| Manage Courses | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Take Attendance | ✅ | ✅ | ✅ | ✅ | ✅ Own Subject | ❌ |
| Enter Internal Marks | ✅ | ✅ | ✅ | ✅ | ✅ Own Subject | ❌ |
| Enter External Marks | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Own |
| Approve Lesson Planner | ✅ | ✅ Final | ✅ First | ❌ | ❌ | ❌ |
| Approve Work Diary | ✅ | ✅ Final | ✅ First | ❌ | ❌ | ❌ |
| Assign Substitutes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Post Notices | ✅ | ✅ | ✅ Dept | ✅ Class | ✅ Subject | ❌ |

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

## 🗄 Database Schema

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

### Module 6: Attendance ❌ TODO
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

### Notices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notices` | List notices |
| POST | `/notices` | Create notice |
| GET | `/notices/{id}` | Get notice detail |
| DELETE | `/notices/{id}` | Delete notice |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit/{entity_type}/{id}` | Get audit trail |

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

### Phase 6: Student Module ❌ TODO
**Timeline: Week 12-13**
- [ ] Student dashboard
- [ ] View attendance
- [ ] View results
- [ ] Upload external marks
- [ ] View timetable
- [ ] Profile management

### Phase 7: Advanced Features ❌ TODO
**Timeline: Week 14-15**
- [ ] Exam management
- [ ] Fee management
- [ ] Library module
- [ ] Transport module
- [ ] Reports & Analytics

### Phase 8: System Features ❌ TODO
**Timeline: Week 16-17**
- [ ] Push notifications
- [ ] Offline support (attendance, marks, diary, planner)
- [ ] Audit logging
- [ ] Auto-sync

### Phase 9: Polish & Launch ❌ TODO
**Timeline: Week 18-20**
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] Security audit
- [ ] App store deployment

---

## 📊 Current Status

### Overall Progress
```
██████░░░░░░░░░░░░░░ 30%
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
| Attendance | ❌ Not Started | 0% |
| Exams & Results | ❌ Not Started | 0% |
| Fees | ❌ Not Started | 0% |
| Notices | ⚠️ Partial | 30% |
| Library | ❌ Not Started | 0% |
| Transport | ❌ Not Started | 0% |
| Profile | ❌ Not Started | 0% |
| Reports | ❌ Not Started | 0% |
| System Features | ❌ Not Started | 0% |

### Files Summary
| Category | Built | Pending | Total |
|----------|-------|---------|-------|
| Auth Screens | 4 | 0 | 4 |
| Admin Screens | 5 | 15 | 20 |
| Teacher Screens | 1 | 35 | 36 |
| Student Screens | 1 | 10 | 11 |
| UI Components | 6 | 15 | 21 |
| Database Tables | 10 | 11 | 21 |
| Zustand Stores | 3 | 10 | 13 |

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
