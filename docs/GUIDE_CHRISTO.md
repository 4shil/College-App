# 🟢 CHRISTO's VIBE GUIDE
## Role: UI Lead / Student Module
## Target: 4-5 screens per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **UI Component Library** - All reusable components
2. **Auth Screens** - Login, Register, Forgot, OTP
3. **Admin Screens** - Dashboard, Academic, Library, Canteen, Honors
4. **Student Screens** - Profile, Attendance, Assignments, Exams, Results

---

# WEEK 1: COMPONENTS + AUTH + ADMIN

## Day 1 - Core Components + Login
**Components to Create:**
- `components/ui/GlassCard.tsx` - Glassmorphic card with blur, fade-in animation
- `components/ui/GlassInput.tsx` - Input with label, icon, error state
- `components/ui/PrimaryButton.tsx` - Button with loading, disabled, variants (primary/outline), press animation
- `components/ui/Badge.tsx` - Status badges (default, success, warning, error, primary)
- `components/ui/Avatar.tsx` - Image or initials fallback
- `components/ui/Modal.tsx` - Reusable modal with GlassCard

**Screens to Create:**
- `app/(auth)/login.tsx` - Email, password fields, login button, forgot password link, register link

---

## Day 2 - More Auth + Admin Layout
**Screens to Create:**
- `app/(auth)/forgot-password.tsx` - Email input, send reset link, success state with checkmark
- `components/ui/AnimatedBackground.tsx` - Gradient background with animated orbs
- `app/(admin)/_layout.tsx` - Tabs: Dashboard, Users, Academic, Notices, Settings
- `app/(auth)/_layout.tsx` - Stack with fade animation

---

## Day 3 - Admin Dashboard + Users
**Components to Create:**
- `components/ui/StatCard.tsx` - Icon, value, title, trend badge
- `components/ui/QuickActions.tsx` - Grid of action buttons with icons

**Screens to Create:**
- `app/(admin)/dashboard.tsx`
  - Stats row: Students, Teachers, Departments, Courses
  - Quick actions: Add Student, Add Teacher, Create Notice, Create Event
  - Recent activity section

- `app/(admin)/users.tsx`
  - Tabs: Students / Teachers
  - FlatList with user cards (avatar, name, email, status badge)
  - FAB for add user modal
  - Pull to refresh

---

## Day 4 - Academic CRUD + Notices + Events
**Screens to Create:**
- `app/(admin)/academic/index.tsx` - Navigation cards: Departments, Courses, Subjects, Semesters
- `app/(admin)/academic/departments.tsx` - List with edit/delete, FAB for create
- `app/(admin)/academic/courses.tsx` - Similar CRUD pattern
- `app/(admin)/academic/subjects.tsx` - Similar CRUD pattern
- `app/(admin)/notices.tsx` - List with create modal, publish/delete actions
- `app/(admin)/events.tsx` - Similar pattern

---

## Day 5 - Library + Room Allocation
**Screens to Create:**
- `app/(admin)/library/index.tsx`
  - Tabs: Catalog, Issued, Overdue
  - Search bar for books
  - Issue/return actions
  - Add book modal

- `app/(admin)/exams/rooms.tsx` - Room allocation for exam schedules

---

# WEEK 2: CANTEEN + TEACHER SCREENS

## Day 6 - Canteen Admin
**Screens to Create:**
- `app/(admin)/canteen/index.tsx`
  - Tabs: Menu, Tokens, Sales
  - Menu list with availability toggle
  - Token list with status change
  - Sales summary component

---

## Day 7 - Honors Admin + Teacher Layout
**Screens to Create:**
- `app/(admin)/honors/index.tsx` - Programs CRUD
- `app/(admin)/honors/enrollments.tsx` - Enrollment management, approve/reject

- `app/(teacher)/_layout.tsx` - Tabs: Home, Attendance, Marks, Assignments, More

---

## Day 8 - Teacher Attendance
**Screens to Create:**
- `app/(teacher)/attendance/index.tsx` - Class/date selection
- `app/(teacher)/attendance/mark.tsx` - Student list with P/A/L toggles
- `app/(teacher)/attendance/history.tsx` - Calendar view with past sessions

---

## Day 9 - Assignments (Teacher)
**Screens to Create:**
- `app/(teacher)/assignments/index.tsx` - List of assignments
- `app/(teacher)/assignments/create.tsx` - Create form with file upload
- `app/(teacher)/assignments/submissions.tsx` - List of student submissions
- `app/(teacher)/assignments/grade.tsx` - Grading form with feedback

---

## Day 10 - Planner + Diary
**Screens to Create:**
- `app/(teacher)/planner/index.tsx` - Calendar view of lesson plans
- `app/(teacher)/planner/create.tsx` - Create/edit plan form
- `app/(teacher)/diary/index.tsx` - List of diary entries by date
- `app/(teacher)/diary/add.tsx` - Add entry form

---

# WEEK 3-4: STUDENT MODULE

## Day 11-12 - HoD + Student Foundation
**Screens to Create:**
- HoD screens (department overview, marks verification)
- `app/(student)/_layout.tsx` - Tabs: Home, Attendance, Academics, Services, Profile
- `app/(student)/dashboard.tsx` - Overview with stats
- `app/(student)/profile/index.tsx` - View/edit profile

---

## Day 13-15 - Student Academic
**Screens to Create:**
- `app/(student)/attendance/index.tsx` - Overall %, calendar, subject-wise
- `app/(student)/academics/timetable.tsx` - Weekly timetable view
- `app/(student)/academics/materials.tsx` - List of study materials
- `app/(student)/academics/assignments/index.tsx` - Assignment list
- `app/(student)/academics/assignments/submit.tsx` - Submission form

---

## Day 16-18 - Student Exams + Services
**Screens to Create:**
- `app/(student)/academics/exams.tsx` - Exam schedule
- `app/(student)/academics/marks.tsx` - Internal marks view
- `app/(student)/academics/results.tsx` - External results with upload
- `app/(student)/services/library.tsx` - Search, issued books, reserve
- `app/(student)/services/bus.tsx` - Pass info, route, tracking
- `app/(student)/services/canteen.tsx` - Menu, order, token status

---

## Day 19-20 - Finish Student
**Screens to Create:**
- `app/(student)/services/events.tsx` - Event list with external links
- `app/(student)/services/honors.tsx` - Programs list, apply, status
- `app/(student)/services/feedback.tsx` - Submit feedback form
- `app/(student)/profile/settings.tsx` - Notification toggles, theme, logout

---

# ✅ DAILY CHECKLIST

- [ ] 4-5 screens completed
- [ ] Use stores from Abin
- [ ] Consistent styling (colors, spacing, fonts)
- [ ] Add testIDs for testing
- [ ] Commit with clear messages

---

*Vibe Coder Christo - Ship 4-5 screens daily! 🚀*
