# 🟡 ABIN's VIBE GUIDE
## Role: Assistant Lead / GraphQL & State
## Target: 2-3 stores + full API per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **Hasura Configuration** - Track tables, relationships, permissions
2. **GraphQL Layer** - All queries, mutations, subscriptions
3. **State Management** - All Zustand stores
4. **Code Review** - GraphQL, stores, API integration

---

# WEEK 1: FOUNDATION BLITZ

## Day 1 - Hasura + Auth Store
**Hasura Setup:**
- Track tables: profiles, roles, user_roles, departments, courses
- Set up relationships between tables

**Files to Create:**
- `lib/graphql/client.ts` - URQL client with Supabase auth exchange
- `store/authStore.ts` - signIn, signUp, signOut, loadProfile, user state, roles array
- `store/themeStore.ts` - isDark toggle with AsyncStorage persistence

---

## Day 2 - Auth Queries + Navigation
**GraphQL Files:**
- `lib/graphql/queries.ts` - GET_PROFILE_WITH_ROLES query
- `lib/graphql/mutations.ts` - UPDATE_PROFILE mutation

**Navigation Logic:**
- `getInitialRoute(roles)` function - Returns correct route based on user roles
  - Admin roles → /(admin)/dashboard
  - Teacher roles → /(teacher)/dashboard
  - Student → /(student)/dashboard

---

## Day 3 - User Management + Academic Stores
**Stores to Create:**
- `store/userManagementStore.ts`
  - State: students[], teachers[], totalStudents, loading
  - Actions: fetchStudents, fetchTeachers, toggleStudentBlock

- `store/academicStore.ts`
  - State: departments[], courses[], subjects[]
  - Actions: fetchDepartments, fetchCourses, createDepartment, updateDepartment, deleteDepartment (similar for courses, subjects)

**Queries:** GET_STUDENTS, GET_TEACHERS with pagination and filters

---

## Day 4 - Notice + Event + Exam Stores
**Stores to Create:**
- `store/noticeStore.ts`
  - State: notices[]
  - Actions: fetchNotices, createNotice, publishNotice, deleteNotice

- `store/eventStore.ts`
  - State: events[]
  - Actions: fetchEvents, createEvent, updateEvent, deleteEvent

- `store/examAdminStore.ts`
  - State: exams[], schedules[]
  - Actions: fetchExams, createExam, createSchedule, publishExam

**Queries:** GET_TIMETABLE query with periods and subject/teacher info

---

## Day 5 - Library + Bus + Exam Stores
**Stores to Create:**
- `store/libraryStore.ts`
  - State: books[], issues[]
  - Actions: fetchBooks, addBook, issueBook, returnBook, getOverdueBooks

- `store/busStore.ts`
  - State: routes[], subscriptions[]
  - Actions: fetchRoutes, createRoute, createStop, approveSubscription

---

# WEEK 2: TEACHER + CANTEEN + FEES

## Day 6 - Canteen + Fees + Settings
**Stores to Create:**
- `store/canteenAdminStore.ts`
  - State: menuItems[], tokens[]
  - Actions: fetchMenu, addMenuItem, updateAvailability, updateTokenStatus, getDailySales

- `store/feesStore.ts`
  - State: structure[], payments[]
  - Actions: fetchStructure, addFeeStructure, recordPayment, getStudentPayments

- `store/settingsStore.ts`
  - State: settings{}
  - Actions: fetchSettings, updateSetting

---

## Day 7 - Teacher Dashboard Store
**Stores to Create:**
- `store/teacherDashboardStore.ts`
  - State: teacher, todaysPeriods[], pendingCount, loading
  - Actions: fetchDashboard

**Query:** GET_TEACHER_DASHBOARD - teacher info, subjects, classes, today's periods, pending submissions count

---

## Day 8 - Attendance + Marks Stores
**Stores to Create:**
- `store/attendanceStore.ts`
  - State: sessionId, students[], records[], saving
  - Actions: startSession, setStatus, markAllPresent, saveAttendance

- `store/marksStore.ts`
  - State: examScheduleId, entries[], maxMarks, saving
  - Actions: loadStudents, setMarks, setAbsent, parseCSV, submitMarks
  - CSV support for bulk marks upload

---

## Day 9 - Assignment + Materials Stores
**Stores to Create:**
- `store/assignmentStore.ts`
  - State: assignments[], submissions[]
  - Actions: fetchMyAssignments, createAssignment, fetchSubmissions, gradeSubmission

- `store/materialsStore.ts`
  - State: materials[]
  - Actions: fetchMyMaterials, uploadMaterial, publishMaterial, deleteMaterial

---

## Day 10 - Planner + Diary + Mentor
**Stores to Create:**
- `store/plannerStore.ts`
  - State: plans[]
  - Actions: fetchPlans, createPlan, updatePlan, markCompleted

- `store/diaryStore.ts`
  - State: entries[]
  - Actions: fetchEntries, addEntry, updateEntry

**Query:** GET_MENTEES - mentees list with attendance aggregates

---

# WEEK 3: ROLE STORES + STUDENT

## Day 11 - HoD + Coordinator Stores
**Stores to Create:**
- `store/hodStore.ts`
  - State: departmentStats, pendingMarks[]
  - Actions: fetchStats, fetchPendingMarks, verifyMarks

- `store/coordinatorStore.ts`
  - State: pendingSchedules[]
  - Actions: fetchPendingSchedules, approveSchedule

---

## Day 12-15 - Student Stores
**Stores to Create:**
- `store/studentDashboardStore.ts` - student info, attendance %, pending assignments
- `store/assignmentStudentStore.ts` - view assignments, submit work
- `store/examStudentStore.ts` - view exam schedules, results
- `store/externalMarksStore.ts` - upload external marks, view status
- `store/libraryStudentStore.ts` - search books, view issued, renew
- `store/busStudentStore.ts` - apply pass, view route, track bus
- `store/canteenStudentStore.ts` - order food, view token status (realtime)
- `store/honorsStore.ts` - view programs, apply, check status

---

# WEEK 4-5: INTEGRATION

## Day 16-20 - Finish All Stores
- Complete any remaining stores
- Add realtime subscriptions for tokens
- Add optimistic updates

## Day 21-25 - Polish
- Query optimization
- Error handling
- Caching strategies

---

# ✅ DAILY CHECKLIST

## Each Day
- [ ] Track new tables in Hasura (after Ash creates)
- [ ] Set up relationships
- [ ] Create queries/mutations
- [ ] Create Zustand store
- [ ] Test with UI (coordinate with Christo/Deon)
- [ ] Commit and push

## Hasura Permissions
- Admin: Full access
- Teacher: Own data + assigned classes
- Student: Own data only

---

*Vibe Coder Abin - Ship 2-3 stores daily! 🚀*
