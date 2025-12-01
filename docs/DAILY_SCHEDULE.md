# JPM College App - Daily Schedule

## Team: Ash, Abin, Christo, Deon
## Start Date: December 1, 2025
## Timeline: 1 complete page per person per day

---

# ADMIN MODULE (Days 1-20)

---

## Day 1

### Ash → Login Screen
**Backend:**
- Create `profiles` table with all fields
- Create `roles` table with 9 admin roles + teacher + student roles
- Create `user_roles` junction table
- Set up RLS policies for auth.users access
- Create login trigger to set last_login timestamp

**Frontend:**
- Login screen UI with email + password fields
- Form validation (email format, password length)
- Error handling (invalid credentials, network error)
- Loading state during login
- Navigate to role-based dashboard on success

**Store:**
- `authStore.ts` with signIn(), user state, loading, error

---

### Abin → Register Screen
**Backend:**
- Create `students` table with all registration fields
- Create `teachers` table with all registration fields
- RLS for new user registration
- Email verification trigger via Supabase Auth

**Frontend:**
- Register screen UI with step-by-step form
- Role selection (Student/Teacher)
- Form validation for all fields
- Password strength indicator
- Terms & conditions checkbox

**Store:**
- `authStore.ts` signUp() function
- Profile creation after auth signup

---

### Christo → Admin Dashboard
**Backend:**
- Create `departments` table
- Create `courses` table
- Create dashboard stats view (total students, teachers, pending approvals)
- RLS for admin-only access

**Frontend:**
- Dashboard UI with stat cards
- Quick action buttons (Users, Academic, Notices, Settings)
- Today's summary section
- Navigation to all admin modules
- Pull-to-refresh functionality

**Store:**
- `adminDashboardStore.ts` with stats query

---

### Deon → OTP Verification Screen
**Backend:**
- OTP verification via Supabase Auth email
- Resend OTP logic with cooldown timer
- Update profile status on verification

**Frontend:**
- 6-digit OTP input boxes
- Auto-focus next box on input
- Countdown timer for resend
- Resend OTP button
- Success navigation to dashboard

**Store:**
- `authStore.ts` verifyOTP(), resendOTP()

---

## Day 2

### Ash → Forgot Password Screen
**Backend:**
- Password reset via Supabase Auth
- Email template for reset link
- Reset token validation

**Frontend:**
- Email input form
- Send reset link button
- Success message with email confirmation
- Loading and error states

**Store:**
- `authStore.ts` resetPassword()

---

### Abin → Users List Screen (Teachers)
**Backend:**
- Teacher list query with pagination
- Filter by department, status
- Search by name, email, employee ID
- RLS for admin viewing

**Frontend:**
- Teachers list with tabs (Active/Inactive/All)
- Search bar with filters
- Teacher card with photo, name, department
- Pagination or infinite scroll
- Add teacher FAB button

**Store:**
- `userManagementStore.ts` with getTeachers(), filters

---

### Christo → Users List Screen (Students)
**Backend:**
- Student list query with pagination
- Filter by department, year, semester, section
- Search by name, email, registration number
- RLS for admin viewing

**Frontend:**
- Students list with filters
- Search bar
- Student card with photo, name, course, year
- Filter dropdown (Department, Year, Semester)
- Pagination

**Store:**
- `userManagementStore.ts` getStudents()

---

### Deon → Add Teacher Screen
**Backend:**
- Teacher creation mutation
- Role assignment (Subject Teacher default)
- Department assignment
- Profile photo upload to Supabase Storage

**Frontend:**
- Add teacher form (all fields)
- Department dropdown
- Role checkboxes
- Photo upload picker
- Form validation
- Submit button with loading state

**Store:**
- `userManagementStore.ts` createTeacher()

---

## Day 3

### Ash → Add Student Screen
**Backend:**
- Student creation mutation
- Auto-generate registration number
- Section assignment
- Profile photo upload

**Frontend:**
- Add student form (all fields)
- Department/Year/Semester/Section dropdowns
- Photo upload picker
- Parent details section
- Form validation

**Store:**
- `userManagementStore.ts` createStudent()

---

### Abin → Teacher Detail Screen
**Backend:**
- Get teacher by ID query
- Update teacher mutation
- Block/unblock teacher mutation
- Reset password mutation

**Frontend:**
- Teacher profile view
- Edit mode toggle
- Assigned subjects list
- Assigned classes list
- Block/Unblock button
- Reset password button

**Store:**
- `userManagementStore.ts` getTeacher(), updateTeacher()

---

### Christo → Student Detail Screen
**Backend:**
- Get student by ID query
- Update student mutation
- Block/unblock student mutation
- View attendance summary

**Frontend:**
- Student profile view
- Edit mode toggle
- Attendance percentage display
- Fee status display
- Block/Unblock button

**Store:**
- `userManagementStore.ts` getStudent(), updateStudent()

---

### Deon → Assign Teacher Roles Screen
**Backend:**
- Get teacher's current roles query
- Assign/remove role mutation
- Role hierarchy validation

**Frontend:**
- Role selection checkboxes
- Role descriptions
- Save changes button
- Warning for removing roles

**Store:**
- `userManagementStore.ts` assignRole(), removeRole()

---

## Day 4

### Ash → Departments Screen
**Backend:**
- Departments CRUD mutations
- HoD assignment mutation
- Department stats query

**Frontend:**
- Department list
- Add/Edit department modal
- HoD dropdown selector
- Department card with stats
- Delete confirmation

**Store:**
- `academicStructureStore.ts` departments CRUD

---

### Abin → Courses Screen
**Backend:**
- Courses CRUD mutations
- Course-department relationship
- Course stats query

**Frontend:**
- Course list by department
- Add/Edit course modal
- Department filter
- Course card with details

**Store:**
- `academicStructureStore.ts` courses CRUD

---

### Christo → Subjects Screen
**Backend:**
- Subjects CRUD mutations
- Subject-course relationship
- Credits, hours fields

**Frontend:**
- Subject list by course
- Add/Edit subject modal
- Course/Semester filter
- Subject card with credits, type

**Store:**
- `academicStructureStore.ts` subjects CRUD

---

### Deon → Semesters Screen
**Backend:**
- Semesters CRUD mutations
- Academic year relationship
- Start/end dates

**Frontend:**
- Semester list
- Add/Edit semester modal
- Year filter
- Set active semester

**Store:**
- `academicStructureStore.ts` semesters CRUD

---

## Day 5

### Ash → Sections Screen
**Backend:**
- Sections CRUD mutations
- Section-course-semester relationship
- Class teacher assignment

**Frontend:**
- Section list
- Add/Edit section modal
- Assign class teacher dropdown
- Student count display

**Store:**
- `academicStructureStore.ts` sections CRUD

---

### Abin → Exam Schedule Screen
**Backend:**
- `exams` table with type, dates
- Exam schedule CRUD mutations
- Publish/unpublish mutation

**Frontend:**
- Exam list (Internal/Model/University)
- Add exam schedule form
- Date/time picker
- Subject-wise schedule grid
- Publish button

**Store:**
- `examAdminStore.ts` examSchedules CRUD

---

### Christo → Exam Timetable Screen
**Backend:**
- Exam timetable query by semester
- Room assignment mutation
- Timetable publish mutation

**Frontend:**
- Timetable grid view
- Room assignment dropdown
- Publish to students/teachers
- Print/export button

**Store:**
- `examAdminStore.ts` timetable query

---

### Deon → Verify Internal Marks Screen
**Backend:**
- Get pending internal marks query
- Verify/reject marks mutation
- Audit log entry

**Frontend:**
- Pending marks list
- Filter by subject, exam
- Marks preview modal
- Verify/Reject buttons
- Remarks input

**Store:**
- `examAdminStore.ts` verifyMarks()

---

## Day 6

### Ash → Verify External Marks Screen
**Backend:**
- Get pending external uploads query
- Verify/reject upload mutation
- Audit log entry

**Frontend:**
- Pending uploads list
- Document preview (PDF/image)
- Marks entry form
- Verify/Reject buttons

**Store:**
- `examAdminStore.ts` verifyExternalMarks()

---

### Abin → Attendance View Screen
**Backend:**
- Attendance summary query by class
- Department-wise attendance query
- Date range filter

**Frontend:**
- Attendance summary cards
- Filter by department, class, date
- Percentage charts
- Drill down to student list

**Store:**
- `attendanceAdminStore.ts` getAttendanceSummary()

---

### Christo → Attendance Edit Screen
**Backend:**
- Edit attendance mutation with reason
- Audit log for all edits
- Grace period check

**Frontend:**
- Student attendance list
- Edit status dropdown
- Reason input (required)
- Save with confirmation
- Audit trail display

**Store:**
- `attendanceAdminStore.ts` editAttendance()

---

### Deon → Shortage List Screen
**Backend:**
- Get students below threshold query
- Shortage list publish mutation
- Notification trigger

**Frontend:**
- Shortage students list
- Filter by percentage threshold
- Publish shortage list button
- Send notification toggle

**Store:**
- `attendanceAdminStore.ts` getShortageList()

---

## Day 7

### Ash → Master Timetable Screen
**Backend:**
- `timetable` table with periods
- Timetable CRUD mutations
- Period validation (no conflicts)

**Frontend:**
- Timetable grid editor
- Add period modal
- Drag-drop reorder
- Conflict warnings
- Section selector

**Store:**
- `timetableAdminStore.ts` timetable CRUD

---

### Abin → Teacher-Period Assignment Screen
**Backend:**
- Assign teacher to period mutation
- Workload calculation query
- Conflict check query

**Frontend:**
- Teacher dropdown per period
- Workload display per teacher
- Conflict warnings
- Bulk assign mode

**Store:**
- `timetableAdminStore.ts` assignTeacher()

---

### Christo → Room Management Screen
**Backend:**
- `rooms` table CRUD
- Room-period assignment
- Capacity tracking

**Frontend:**
- Room list
- Add/Edit room modal
- Assign to periods
- Capacity indicator

**Store:**
- `timetableAdminStore.ts` rooms CRUD

---

### Deon → Publish Timetable Screen
**Backend:**
- Timetable publish mutation
- Push notification trigger
- Version tracking

**Frontend:**
- Preview timetable
- Publish confirmation
- Notify students/teachers checkboxes
- Publish history

**Store:**
- `timetableAdminStore.ts` publishTimetable()

---

## Day 8

### Ash → Notices List Screen
**Backend:**
- Notices query with filters
- Scheduled notices query
- Notice stats query

**Frontend:**
- Notices list
- Filter by category, status
- Pinned notices section
- Add notice FAB

**Store:**
- `noticeAdminStore.ts` getNotices()

---

### Abin → Create Notice Screen
**Backend:**
- Create notice mutation
- Attachment upload
- Target audience selection

**Frontend:**
- Notice form (title, content)
- Rich text editor
- Audience selector (All/Dept/Class)
- Attachment picker
- Schedule date picker

**Store:**
- `noticeAdminStore.ts` createNotice()

---

### Christo → Notice Detail Screen
**Backend:**
- Get notice by ID query
- Update notice mutation
- Delete notice mutation

**Frontend:**
- Notice full view
- Edit mode
- Attachment preview
- Delete confirmation
- View count display

**Store:**
- `noticeAdminStore.ts` updateNotice()

---

### Deon → Scheduled Notices Screen
**Backend:**
- Scheduled notices query
- Cancel scheduled mutation
- Reschedule mutation

**Frontend:**
- Scheduled notices list
- Calendar view
- Cancel/Reschedule buttons
- Edit scheduled notice

**Store:**
- `noticeAdminStore.ts` scheduledNotices

---

## Day 9

### Ash → Library Books Screen
**Backend:**
- `library_books` table CRUD
- Book availability query
- Search books query

**Frontend:**
- Books list with search
- Add/Edit book modal
- Availability indicator
- Filter by category

**Store:**
- `libraryAdminStore.ts` books CRUD

---

### Abin → Issue/Return Book Screen
**Backend:**
- `library_transactions` table
- Issue book mutation
- Return book mutation
- Calculate fine mutation

**Frontend:**
- Issue form (student, book)
- Return form (scan/search)
- Due date picker
- Fine display
- Transaction history

**Store:**
- `libraryAdminStore.ts` issueBook(), returnBook()

---

### Christo → Library Reservations Screen
**Backend:**
- Reservations queue query
- Process reservation mutation
- Notify student trigger

**Frontend:**
- Reservation queue list
- Process next button
- Student notification status
- Cancel reservation

**Store:**
- `libraryAdminStore.ts` reservations

---

### Deon → Library Analytics Screen
**Backend:**
- Library stats query
- Popular books query
- Overdue books query

**Frontend:**
- Usage stats cards
- Popular books chart
- Overdue list
- Export report button

**Store:**
- `libraryAdminStore.ts` analytics

---

## Day 10

### Ash → Bus Routes Screen
**Backend:**
- `bus_routes` table CRUD
- Route stops JSONB handling
- Route stats query

**Frontend:**
- Routes list
- Add/Edit route modal
- Stops editor (add/remove/reorder)
- Vehicle assignment

**Store:**
- `busAdminStore.ts` routes CRUD

---

### Abin → Bus Stops Screen
**Backend:**
- Stops management
- Timing per stop
- Stop sequence update

**Frontend:**
- Stops list per route
- Add/Edit stop modal
- Time picker per stop
- Reorder stops

**Store:**
- `busAdminStore.ts` stops CRUD

---

### Christo → Bus Approvals Screen
**Backend:**
- Pending approvals query
- Approve/reject mutation
- Notification trigger

**Frontend:**
- Pending requests list
- Student details view
- Approve/Reject buttons
- Bulk approve mode

**Store:**
- `busAdminStore.ts` approvals

---

### Deon → Bus Alerts Screen
**Backend:**
- Bus alerts CRUD
- Schedule alert mutation
- Push notification trigger

**Frontend:**
- Alerts list
- Create alert form
- Target route selector
- Schedule date picker
- Send now button

**Store:**
- `busAdminStore.ts` alerts

---

## Day 11

### Ash → Canteen Menu Screen
**Backend:**
- `canteen_menu` table CRUD
- Daily menu management
- Price update mutation

**Frontend:**
- Menu items list
- Add/Edit item modal
- Category tabs
- Image upload
- Set sold out toggle

**Store:**
- `canteenAdminStore.ts` menu CRUD

---

### Abin → Canteen Tokens Screen
**Backend:**
- Today's tokens query
- Token status update mutation
- Daily reset function

**Frontend:**
- Tokens list with status
- Filter by status
- Mark ready/collected buttons
- Token details modal

**Store:**
- `canteenAdminStore.ts` tokens

---

### Christo → Canteen Refunds Screen
**Backend:**
- Refund request query
- Process refund mutation
- Payment gateway refund API

**Frontend:**
- Refund requests list
- Refund details modal
- Approve/Reject buttons
- Refund reason input

**Store:**
- `canteenAdminStore.ts` refunds

---

### Deon → Canteen Reports Screen
**Backend:**
- Daily sales query
- Category-wise sales query
- Export report mutation

**Frontend:**
- Sales summary cards
- Category breakdown chart
- Date range picker
- Export PDF/CSV button

**Store:**
- `canteenAdminStore.ts` reports

---

## Day 12

### Ash → Fee Structure Screen
**Backend:**
- `fee_structure` table CRUD
- Semester-wise fee setup
- Component breakdown

**Frontend:**
- Fee structure list
- Add/Edit fee modal
- Components editor
- Semester selector
- Due date picker

**Store:**
- `feeAdminStore.ts` structure CRUD

---

### Abin → Payment Verification Screen
**Backend:**
- Pending payments query
- Verify payment mutation
- Receipt generation

**Frontend:**
- Pending payments list
- Payment details modal
- Verify button
- Reject with reason
- View proof image

**Store:**
- `feeAdminStore.ts` verifyPayment()

---

### Christo → Fee Receipts Screen
**Backend:**
- Receipts query
- Upload receipt mutation
- Receipt template

**Frontend:**
- Receipts list
- Upload receipt form
- Preview receipt
- Download/Print button

**Store:**
- `feeAdminStore.ts` receipts

---

### Deon → Fee Reminders Screen
**Backend:**
- Overdue students query
- Send reminder mutation
- Bulk reminder mutation

**Frontend:**
- Overdue list
- Select students
- Send reminder button
- Bulk send mode
- Message template editor

**Store:**
- `feeAdminStore.ts` reminders

---

## Day 13

### Ash → Events List Screen
**Backend:**
- `events` table CRUD
- Events query with filters
- Publish mutation

**Frontend:**
- Events list
- Filter by type, status
- Add event FAB
- Event card with poster

**Store:**
- `eventAdminStore.ts` events

---

### Abin → Create Event Screen
**Backend:**
- Create event mutation
- Poster upload
- External link validation

**Frontend:**
- Event form (all fields)
- Date/time picker
- Poster upload
- External registration link input
- Venue input

**Store:**
- `eventAdminStore.ts` createEvent()

---

### Christo → Event Detail Screen
**Backend:**
- Get event by ID query
- Update event mutation
- Delete event mutation

**Frontend:**
- Event full view
- Edit mode
- Poster preview
- Publish/Unpublish button
- Delete confirmation

**Store:**
- `eventAdminStore.ts` updateEvent()

---

### Deon → Event Certificates Screen
**Backend:**
- Certificate upload mutation
- Bulk certificate assignment

**Frontend:**
- Event selector
- Upload certificate template
- Generate for participants
- Download all certificates

**Store:**
- `eventAdminStore.ts` certificates

---

## Day 14

### Ash → Holidays Screen
**Backend:**
- `holidays` table CRUD
- Holiday query by month
- Affects filter (all/students/teachers)

**Frontend:**
- Holidays calendar view
- Add/Edit holiday modal
- Affects selector
- Monthly view

**Store:**
- `calendarStore.ts` holidays CRUD

---

### Abin → Meetings Screen
**Backend:**
- `meetings` table CRUD
- Meeting invites
- Department filter

**Frontend:**
- Meetings list
- Add meeting modal
- Attendee type selector
- Date/time/venue inputs
- Send invites button

**Store:**
- `calendarStore.ts` meetings CRUD

---

### Christo → Attendance Analytics Screen
**Backend:**
- Attendance trends query
- Department comparison query
- Subject-wise stats

**Frontend:**
- Attendance charts
- Department comparison
- Subject breakdown
- Date range picker
- Export button

**Store:**
- `analyticsStore.ts` attendance

---

### Deon → Exam Analytics Screen
**Backend:**
- Exam performance query
- Pass/fail statistics
- Subject-wise analysis

**Frontend:**
- Performance charts
- Pass/fail pie chart
- Subject comparison
- Semester filter

**Store:**
- `analyticsStore.ts` exams

---

## Day 15

### Ash → Department Analytics Screen
**Backend:**
- Department performance query
- Teacher workload query
- Student distribution

**Frontend:**
- Department stats cards
- Teacher workload chart
- Student count per year
- Export report

**Store:**
- `analyticsStore.ts` departments

---

### Abin → Export Reports Screen
**Backend:**
- Report generation functions
- PDF/CSV export
- Scheduled reports

**Frontend:**
- Report type selector
- Date range picker
- Format selector (PDF/CSV)
- Download button
- Email report option

**Store:**
- `analyticsStore.ts` export

---

### Christo → Audit Logs Screen
**Backend:**
- Audit logs query
- Filter by action, user, entity
- Date range filter

**Frontend:**
- Audit log list
- Filter dropdowns
- Date range picker
- Log detail modal
- Export logs

**Store:**
- `auditStore.ts` logs

---

### Deon → Academic Year Settings Screen
**Backend:**
- Academic year CRUD
- Set active year mutation
- Year transition logic

**Frontend:**
- Year list
- Add/Edit year modal
- Start/end date pickers
- Set active button
- Transition wizard

**Store:**
- `settingsAdminStore.ts` academicYear

---

## Day 16

### Ash → College Info Settings Screen
**Backend:**
- College info update mutation
- Logo upload
- Contact details

**Frontend:**
- College name, address inputs
- Logo upload picker
- Contact details form
- Save button

**Store:**
- `settingsAdminStore.ts` collegeInfo

---

### Abin → Module Toggles Screen
**Backend:**
- `module_toggles` table
- Toggle module mutation
- Module status query

**Frontend:**
- Module list with toggles
- Enable/Disable switches
- Module descriptions
- Warning on disable

**Store:**
- `settingsAdminStore.ts` modules

---

### Christo → Backup Settings Screen
**Backend:**
- Backup trigger function
- Backup history query
- Restore function

**Frontend:**
- Backup now button
- Backup history list
- Restore button
- Confirmation modal

**Store:**
- `settingsAdminStore.ts` backup

---

### Deon → Maintenance Mode Screen
**Backend:**
- Maintenance mode toggle
- Force logout all users
- Scheduled maintenance

**Frontend:**
- Maintenance toggle
- Message input
- Schedule maintenance picker
- Force logout button

**Store:**
- `settingsAdminStore.ts` maintenance

---

## Day 17

### Ash → Monitor Planners Screen
**Backend:**
- All planners query
- Status filter
- Department filter

**Frontend:**
- Planners list
- Status tabs
- Department filter
- Planner preview modal

**Store:**
- `plannerDiaryStore.ts` planners

---

### Abin → Monitor Diaries Screen
**Backend:**
- All diaries query
- Status filter
- Month/year filter

**Frontend:**
- Diaries list
- Status tabs
- Month picker
- Diary preview modal

**Store:**
- `plannerDiaryStore.ts` diaries

---

### Christo → Minor Programs Screen
**Backend:**
- `minor_programs` table CRUD
- Selection window toggle
- Enrollment stats

**Frontend:**
- Minor programs list
- Add/Edit modal
- Open/close selection toggle
- Enrollment count display

**Store:**
- `academicStructureStore.ts` minorPrograms

---

### Deon → Minor Applications Screen
**Backend:**
- Applications query
- Approve/reject mutation
- Notification trigger

**Frontend:**
- Applications list
- Filter by program, status
- Approve/Reject buttons
- Bulk actions

**Store:**
- `academicStructureStore.ts` minorApplications

---

## Day 18

### Ash → External Uploads Review Screen
**Backend:**
- Pending uploads query
- Document preview query
- Approve with marks mutation

**Frontend:**
- Uploads list
- Document viewer (PDF/image)
- Marks input form
- Approve/Reject buttons

**Store:**
- `examAdminStore.ts` externalUploads

---

### Abin → Fee Analytics Screen
**Backend:**
- Payment statistics query
- Pending dues query
- Monthly collection query

**Frontend:**
- Collection stats cards
- Pending dues chart
- Monthly trend chart
- Export report

**Store:**
- `analyticsStore.ts` fees

---

### Christo → Library Fine Management Screen
**Backend:**
- Fines query
- Waive fine mutation
- Fine collection mutation

**Frontend:**
- Fines list
- Waive fine button
- Collect fine button
- Fine details modal

**Store:**
- `libraryAdminStore.ts` fines

---

### Deon → Substitution Override Screen
**Backend:**
- Active substitutions query
- Override substitution mutation
- Cancel substitution mutation

**Frontend:**
- Substitutions list
- Override teacher dropdown
- Cancel button
- History view

**Store:**
- `timetableAdminStore.ts` substitutions

---

## Day 19

### Ash → Pending Approvals Summary Screen
**Backend:**
- Pending counts query (users, marks, etc.)
- Quick action links

**Frontend:**
- Pending counts cards
- Quick navigation to each
- Refresh button
- Priority indicators

**Store:**
- `adminDashboardStore.ts` pendingCounts

---

### Abin → Student Bulk Import Screen
**Backend:**
- CSV parsing function
- Bulk create students mutation
- Error handling per row

**Frontend:**
- CSV upload picker
- Preview data table
- Column mapping
- Import button
- Error log display

**Store:**
- `userManagementStore.ts` bulkImport

---

### Christo → Teacher Bulk Import Screen
**Backend:**
- CSV parsing function
- Bulk create teachers mutation
- Role assignment

**Frontend:**
- CSV upload picker
- Preview data table
- Column mapping
- Import button
- Error log display

**Store:**
- `userManagementStore.ts` bulkImportTeachers

---

### Deon → Admin Profile Screen
**Backend:**
- Get admin profile query
- Update profile mutation
- Change password mutation

**Frontend:**
- Profile view
- Edit mode
- Change password form
- Photo upload
- Save button

**Store:**
- `authStore.ts` profile

---

## Day 20

### Ash → Admin Notifications Screen
**Backend:**
- Admin notifications query
- Mark read mutation
- Notification preferences

**Frontend:**
- Notifications list
- Mark all read button
- Notification preferences toggles
- Delete old notifications

**Store:**
- `notificationStore.ts` adminNotifications

---

### Abin → System Health Screen
**Backend:**
- Database stats query
- Storage usage query
- API response times

**Frontend:**
- Health status indicators
- Database size display
- Storage usage bar
- Performance metrics

**Store:**
- `settingsAdminStore.ts` systemHealth

---

### Christo → Role Permissions Screen
**Backend:**
- Permissions matrix query
- Update permissions mutation

**Frontend:**
- Roles list
- Permissions checkboxes per role
- Save changes button
- Reset to default

**Store:**
- `settingsAdminStore.ts` permissions

---

### Deon → Admin Settings Screen
**Backend:**
- Admin preferences query
- Update preferences mutation

**Frontend:**
- Theme toggle
- Notification preferences
- Session timeout settings
- About/version info

**Store:**
- `settingsAdminStore.ts` preferences

---

# END OF ADMIN MODULE (20 Days)

Next: Teacher Module (Days 21-35), Student Module (Days 36-50)
