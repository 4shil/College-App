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
| PostgreSQL | Database |
| Supabase Auth | Authentication |
| Supabase Storage | File storage |
| Row Level Security | Data protection |
| Edge Functions | Serverless functions (future) |

---

## 👥 User Roles & Hierarchy

### 🔴 Admin Roles (Category: `admin`)
```
├── super_admin          → Full system access
├── principal            → College principal
├── department_admin     → Department level admin
├── hod                  → Head of Department
├── exam_cell_admin      → Manages exams & results
├── library_admin        → Manages library
├── bus_admin            → Manages transportation
├── canteen_admin        → Manages canteen
└── finance_admin        → Manages fees & finances
```

### 🟡 Teacher Roles (Category: `teacher`)
```
├── subject_teacher      → Teaches subjects
├── class_teacher        → In-charge of a class/section
├── mentor               → Mentors students
└── coordinator          → Coordinates activities
```

### 🟢 Student Role (Category: `student`)
```
└── student              → Regular enrolled student
```

### Role Permissions Matrix
| Feature | Super Admin | HOD | Teacher | Student |
|---------|-------------|-----|---------|---------|
| Manage Users | ✅ | ⚠️ Dept Only | ❌ | ❌ |
| View All Students | ✅ | ✅ Dept | ✅ Section | ❌ |
| Manage Courses | ✅ | ✅ | ❌ | ❌ |
| Take Attendance | ✅ | ✅ | ✅ | ❌ |
| View Own Attendance | ✅ | ✅ | ✅ | ✅ |
| Manage Exams | ✅ | ⚠️ | ❌ | ❌ |
| Enter Marks | ✅ | ✅ | ✅ Own Subjects | ❌ |
| View Results | ✅ | ✅ | ✅ | ✅ Own |
| Post Notices | ✅ | ✅ | ⚠️ Class | ❌ |
| Manage Fees | ✅ Finance | ❌ | ❌ | ❌ |

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
│       └──────────────┴───────────┴──────────┴──→ sections   │
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
│   ├── dashboard.tsx          ✅ Built (Basic)
│   │
│   ├── attendance/            ❌ TODO
│   │   ├── index.tsx          # Take attendance
│   │   ├── history.tsx        # View history
│   │   └── reports.tsx        # Reports
│   │
│   ├── marks/                 ❌ TODO
│   │   ├── index.tsx          # Enter marks
│   │   └── history.tsx        # View entered marks
│   │
│   ├── students/              ❌ TODO
│   │   ├── index.tsx          # My students
│   │   └── [id].tsx           # Student detail
│   │
│   ├── mentees/               ❌ TODO
│   │   ├── index.tsx          # My mentees
│   │   └── [id].tsx           # Mentee detail
│   │
│   └── profile.tsx            ❌ TODO
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
│   - currentAttendance
│   - markAttendance(), submitAttendance()
│
├── academicStore.ts           ❌ TODO
│   - departments, programs, sections
│   - fetchDepartments(), etc.
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
- [x] Login screen (Student/Staff toggle)
- [x] Student registration (4-step wizard)
- [x] OTP verification
- [x] Password reset
- [x] Auto-redirect based on role

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

### Module 5: Attendance ❌ TODO
- [ ] Take attendance (Teacher)
- [ ] View attendance history (Teacher)
- [ ] Attendance reports (Admin/Teacher)
- [ ] My attendance (Student)
- [ ] Attendance calendar view
- [ ] Low attendance alerts

### Module 6: Exams & Results ❌ TODO
- [ ] Create exam (Admin)
- [ ] Exam timetable
- [ ] Enter marks (Teacher)
- [ ] Verify marks (HOD)
- [ ] Publish results (Admin)
- [ ] View results (Student)
- [ ] Download marksheet

### Module 7: Fees ❌ TODO
- [ ] Fee structure setup
- [ ] Generate fee challans
- [ ] Record payments
- [ ] Fee reports
- [ ] View my fees (Student)
- [ ] Payment reminders
- [ ] Defaulters list

### Module 8: Notices ⚠️ PARTIAL
- [x] Notices list view
- [ ] Create notice (Admin/Teacher)
- [ ] Target specific audience
- [ ] Attach files
- [ ] Pin important notices
- [ ] Push notifications

### Module 9: Library ❌ TODO
- [ ] Book catalog
- [ ] Issue book
- [ ] Return book
- [ ] Fine calculation
- [ ] My issued books (Student)
- [ ] Book reservation

### Module 10: Transport ❌ TODO
- [ ] Bus routes management
- [ ] Route stops
- [ ] Student subscriptions
- [ ] Driver assignment
- [ ] My bus route (Student)

### Module 11: Profile ❌ TODO
- [ ] View profile (all roles)
- [ ] Edit profile
- [ ] Change password
- [ ] Upload photo
- [ ] View academic history (Student)

### Module 12: Reports ❌ TODO
- [ ] Attendance reports
- [ ] Result analytics
- [ ] Fee collection reports
- [ ] Student strength reports
- [ ] Export to PDF/Excel

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/signin` | Login |
| POST | `/auth/signout` | Logout |
| POST | `/auth/otp` | Send OTP |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/reset-password` | Reset password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profiles/{id}` | Get user profile |
| PATCH | `/profiles/{id}` | Update profile |
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

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance` | Mark attendance |
| GET | `/attendance/student/{id}` | Get student attendance |
| GET | `/attendance/section/{id}` | Get section attendance |
| GET | `/attendance/report` | Attendance report |

### Exams & Marks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exams` | List exams |
| POST | `/exams` | Create exam |
| POST | `/marks` | Enter marks |
| GET | `/marks/student/{id}` | Get student marks |
| GET | `/results/{exam_id}` | Get exam results |

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

---

## 🗓 Implementation Roadmap

### Phase 1: Core Foundation ✅ COMPLETE
**Timeline: Week 1-2**
- [x] Project setup (Expo, TypeScript)
- [x] UI component library
- [x] Theme system (Dark/Light)
- [x] Authentication flow
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

### Phase 3: Teacher Module ❌ TODO
**Timeline: Week 5-6**
- [ ] Teacher dashboard
- [ ] Attendance marking
- [ ] Marks entry
- [ ] My students view
- [ ] Mentee management

### Phase 4: Student Module ❌ TODO
**Timeline: Week 7-8**
- [ ] Student dashboard
- [ ] View attendance
- [ ] View results
- [ ] View timetable
- [ ] Profile management

### Phase 5: Advanced Features ❌ TODO
**Timeline: Week 9-10**
- [ ] Exam management
- [ ] Fee management
- [ ] Library module
- [ ] Transport module
- [ ] Reports & Analytics

### Phase 6: Polish & Launch ❌ TODO
**Timeline: Week 11-12**
- [ ] Push notifications
- [ ] Offline support
- [ ] Performance optimization
- [ ] Testing & bug fixes
- [ ] App store deployment

---

## 📊 Current Status

### Overall Progress
```
████████░░░░░░░░░░░░ 40%
```

### By Module
| Module | Status | Progress |
|--------|--------|----------|
| Authentication | ✅ Complete | 100% |
| Admin Dashboard | ⚠️ Partial | 60% |
| User Management | ❌ Not Started | 0% |
| Academic Management | ❌ Not Started | 0% |
| Attendance | ❌ Not Started | 0% |
| Exams & Results | ❌ Not Started | 0% |
| Fees | ❌ Not Started | 0% |
| Notices | ⚠️ Partial | 30% |
| Library | ❌ Not Started | 0% |
| Transport | ❌ Not Started | 0% |
| Profile | ❌ Not Started | 0% |
| Reports | ❌ Not Started | 0% |

### Files Summary
| Category | Built | Pending | Total |
|----------|-------|---------|-------|
| Auth Screens | 4 | 0 | 4 |
| Admin Screens | 5 | 15 | 20 |
| Teacher Screens | 1 | 10 | 11 |
| Student Screens | 1 | 8 | 9 |
| UI Components | 6 | 15 | 21 |
| Database Functions | 6 | 10 | 16 |

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

*Last Updated: November 30, 2025*
