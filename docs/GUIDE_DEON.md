# 🟣 DEON's VIBE GUIDE
## Role: Student Features + Testing Lead
## Target: 3-4 screens + tests per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **Student Screens** - Attendance, Library, Bus, Feedback, Settings
2. **Teacher Screens** - Coordinator, Mentor views
3. **Admin Screens** - Exam management, Bus, Reports
4. **Testing** - E2E + Component testing for all modules

---

# WEEK 1: AUTH + STUDENT FOUNDATION

## Day 1 - Register + OTP Screens
**Screens to Create:**
- `app/(auth)/register.tsx`
  - Fields: Full Name, Email, Phone, Password, Confirm Password
  - Student fields: Admission Number
  - Teacher fields: Employee ID (conditional)
  - Validation with error messages
  - Navigate to OTP on success

- `app/(auth)/verify-otp.tsx`
  - 6-digit OTP input (individual boxes)
  - Auto-focus next input
  - Countdown timer for resend
  - Verify and resend actions

---

## Day 2 - Student Layout + Dashboard
**Screens to Create:**
- `app/(student)/_layout.tsx` - Tabs: Home, Attendance, Academics, Services, Profile

- `app/(student)/dashboard.tsx`
  - Header with avatar, name, course/semester
  - Attendance percentage circle
  - Today's classes list
  - Pending assignments list
  - Latest notices list

---

## Day 3 - Student Attendance + Profile
**Screens to Create:**
- `app/(student)/attendance/index.tsx`
  - Overall attendance with circular progress
  - Stats row: Present, Absent, Late counts
  - Month picker with navigation arrows
  - Calendar with marked attendance days
  - Subject-wise attendance with progress bars

- `app/(student)/profile/index.tsx`
  - Photo with edit option
  - Personal info section: Admission No, DOB, Phone, Blood Group
  - Academic info section: Course, Department, Semester, Section, Batch
  - Guardian info section: Name, Phone, Relation
  - Edit profile button

---

## Day 4 - Library + Bus Screens
**Screens to Create:**
- `app/(student)/services/library.tsx`
  - My Books section with borrowed books, due dates
  - Renew button for eligible books
  - Search section with input and results
  - Reserve button for available books

- `app/(student)/services/bus.tsx`
  - If has pass: Pass card with route, status, validity
  - Map with bus location and stops
  - Route stops list with times
  - If no pass: Apply form with route picker

---

## Day 5 - Feedback + Settings
**Screens to Create:**
- `app/(student)/services/feedback.tsx`
  - Active feedback forms list
  - Each form: title, deadline, submitted status
  - Modal with questions (rating stars, text inputs)
  - Submit action

- `app/(student)/profile/settings.tsx`
  - Appearance: Dark mode toggle
  - Notifications: Push, Email, Assignment reminders, Exam reminders toggles
  - Security: Change password link
  - Support: Help & FAQ, Contact support links
  - Logout button

---

# WEEK 2: TEACHER SCREENS + ADMIN

## Day 6-7 - Coordinator + Mentor
**Screens to Create:**
- `app/(teacher)/coordinator/index.tsx` - Coordinator dashboard
- `app/(teacher)/coordinator/sections.tsx` - Section management
- `app/(teacher)/coordinator/reports.tsx` - Exam reports

- `app/(teacher)/mentor/index.tsx` - Mentee list with stats
- `app/(teacher)/mentor/mentee.tsx` - Individual mentee details, attendance, performance

---

## Day 8-9 - Admin Exams + Bus
**Screens to Create:**
- `app/(admin)/exams/index.tsx` - Exam list with status
- `app/(admin)/exams/schedule.tsx` - Create/edit exam schedule
- `app/(admin)/exams/rooms.tsx` - Room allocation interface

- `app/(admin)/bus/index.tsx` - Routes management
- `app/(admin)/bus/passes.tsx` - Pass approval list
- `app/(admin)/bus/tracking.tsx` - Fleet tracking map

---

## Day 10 - Admin Reports
**Screens to Create:**
- `app/(admin)/reports/index.tsx` - Report type selection
- `app/(admin)/reports/attendance.tsx` - Attendance reports with filters
- `app/(admin)/reports/exams.tsx` - Exam performance reports
- `app/(admin)/reports/fees.tsx` - Fee collection reports

---

# WEEK 3-4: TESTING

## Day 11-15 - E2E Setup + Auth Tests
**Setup:**
- Install Detox and Jest
- Configure detox.config.js for Android/iOS
- Set up e2e folder structure

**Test Files to Create:**
- `e2e/auth.test.ts`
  - Show login screen
  - Validation errors for empty fields
  - Login with valid credentials
  - Error for invalid credentials
  - Navigate to register
  - Navigate to forgot password

- `e2e/register.test.ts`
  - Register new student flow
  - Password mismatch error
  - Navigate to OTP verification

---

## Day 16-20 - Student Module Tests
**Test Files to Create:**
- `e2e/student/dashboard.test.ts`
  - Display student info
  - Show today's classes
  - Navigate to attendance

- `e2e/student/attendance.test.ts`
  - Display attendance calendar
  - Navigate between months
  - Show subject-wise attendance

- `e2e/student/library.test.ts`
  - Search for books
  - Reserve available book
  - Show borrowed books

- `e2e/student/bus.test.ts`
  - Display bus pass if exists
  - Show route stops
  - Apply for pass flow

---

## Day 21-25 - Teacher & Admin Tests
**Test Files to Create:**
- `e2e/teacher/attendance.test.ts`
  - Select class and date
  - Mark attendance
  - Submit successfully

- `e2e/teacher/assignments.test.ts`
  - Create assignment
  - View submissions
  - Grade submission

- `e2e/admin/users.test.ts`
  - List students
  - Add new student
  - Block/unblock student

- `e2e/admin/academic.test.ts`
  - CRUD for departments
  - CRUD for courses

---

## Day 26-30 - Component Tests
**Test Files to Create:**
- `__tests__/components/GlassCard.test.tsx`
  - Renders children
  - Applies custom style

- `__tests__/components/PrimaryButton.test.tsx`
  - Shows loading indicator
  - Disabled when disabled prop

- `__tests__/components/GlassInput.test.tsx`
  - Shows label
  - Shows error state
  - Calls onChangeText

- `__tests__/store/authStore.test.ts`
  - Sign in user
  - Sign out user
  - Load profile

---

# ✅ DAILY CHECKLIST

- [ ] 3-4 screens completed
- [ ] Add testIDs to all interactive elements
- [ ] Write tests for completed features
- [ ] Check console for errors
- [ ] Commit with clear messages

---

*Vibe Coder Deon - Test Everything, Trust Nothing! 🧪*
