# 📊 JPM College App - Complete Database Documentation

## 🏗️ Database Architecture Overview

The JPM College App uses **Supabase** (PostgreSQL) as its backend database with Row Level Security (RLS) for data protection.

---

## 📋 Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [All Tables with Full Details](#all-tables-with-full-details)
4. [Foreign Key Relationships](#foreign-key-relationships)
5. [Page-to-Database Mapping](#page-to-database-mapping)
6. [Enums & Custom Types](#enums--custom-types)
7. [Indexes](#indexes)
8. [RLS Policies](#rls-policies)
9. [Triggers & Functions](#triggers--functions)

---

## 🗄️ Database Schema Overview

### Core Tables (18 Total)

| Category | Tables |
|----------|--------|
| **User Management** | `profiles`, `roles`, `user_roles` |
| **Academic Structure** | `departments`, `academic_years`, `years`, `semesters`, `sections`, `courses`, `programs`, `batches` |
| **People** | `students`, `teachers`, `parents`, `teacher_courses`, `mentor_assignments` |
| **Attendance** | `attendance`, `attendance_records`, `attendance_logs`, `holidays`, `late_passes` |
| **Timetable** | `timetable_entries`, `period_timings`, `substitutions` |
| **Library** | `books`, `book_issues`, `book_reservations` |
| **Exams** | `exams`, `exam_schedules`, `exam_results` |
| **Assignments** | `assignments`, `assignment_submissions` |
| **Fees** | `fee_structures`, `student_fees`, `fee_payments` |
| **Bus** | `bus_routes`, `bus_subscriptions`, `bus_stops` |
| **Notices** | `notices` |
| **Audit** | `audit_logs` |

---

## 🔗 Entity Relationship Diagram

```
                                    ┌─────────────────┐
                                    │   auth.users    │
                                    │     (Supabase)  │
                                    └────────┬────────┘
                                             │ 1:1
                                             ▼
┌───────────────┐                  ┌─────────────────┐                  ┌───────────────┐
│    roles      │◄─────────────────│    profiles     │─────────────────►│  departments  │
│               │   primary_role   │                 │   department_id  │               │
└───────┬───────┘                  └────────┬────────┘                  └───────┬───────┘
        │                                   │                                   │
        │ M:N                               │ 1:1                               │
        ▼                                   ▼                                   │
┌───────────────┐                  ┌─────────────────┐                         │
│  user_roles   │                  │    students     │◄────────────────────────┤
│               │                  │                 │                         │
└───────────────┘                  └────────┬────────┘                         │
                                            │                                   │
                                            │                          ┌───────┴───────┐
                                            │                          │   teachers    │
                                            │                          └───────┬───────┘
                                            │                                  │
                    ┌───────────────────────┴──────────────────────────────────┤
                    │                                                          │
                    ▼                                                          ▼
           ┌─────────────────┐                                        ┌───────────────┐
           │    sections     │                                        │teacher_courses│
           └─────────────────┘                                        └───────────────┘
                    │                                                          │
                    │                                                          │
                    ▼                                                          ▼
           ┌─────────────────┐                                        ┌───────────────┐
           │   attendance    │                                        │    courses    │
           └─────────────────┘                                        └───────────────┘
                    │                                                          │
                    ▼                                                          │
           ┌─────────────────┐                                                │
           │attendance_records│                                               │
           └─────────────────┘                                                │
                                                                              │
                    ┌─────────────────────────────────────────────────────────┘
                    │
                    ▼
           ┌─────────────────┐         ┌─────────────────┐
           │    semesters    │◄────────│      years      │
           └─────────────────┘         └─────────────────┘
                                               │
                                               ▼
                                       ┌─────────────────┐
                                       │ academic_years  │
                                       └─────────────────┘
```

---

## 📊 All Tables with Full Details

### 1. 👤 PROFILES (Core User Table)

**Purpose:** Extended user information linked to Supabase Auth

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK**, FK → auth.users(id) | Links to Supabase Auth |
| `email` | VARCHAR(255) | NOT NULL | User email |
| `full_name` | VARCHAR(100) | NOT NULL | Full name |
| `phone` | VARCHAR(20) | | Phone number |
| `photo_url` | TEXT | | Profile photo URL |
| `date_of_birth` | DATE | | DOB |
| `gender` | gender_type | | male/female/other |
| `address_line1` | TEXT | | Address line 1 |
| `address_line2` | TEXT | | Address line 2 |
| `city` | VARCHAR(100) | | City |
| `district` | VARCHAR(100) | | District |
| `state` | VARCHAR(100) | | State |
| `pincode` | VARCHAR(10) | | PIN code |
| `status` | user_status | DEFAULT 'active' | active/inactive/suspended/pending |
| `primary_role` | VARCHAR(50) | FK → roles(name) | Main role for quick access |
| `department_id` | UUID | FK → departments(id) | Associated department |
| `last_login_at` | TIMESTAMPTZ | | Last login timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated timestamp |

**Indexes:**
- `idx_profiles_email` on email
- `idx_profiles_primary_role` on primary_role
- `idx_profiles_status` on status

---

### 2. 🔐 ROLES

**Purpose:** Define system roles and permissions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Role ID |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Role name (super_admin, student, etc.) |
| `display_name` | VARCHAR(100) | NOT NULL | Human-readable name |
| `description` | TEXT | | Role description |
| `category` | VARCHAR(20) | CHECK (admin/teacher/student) | Role category |
| `permissions` | JSONB | DEFAULT '{}' | JSON permissions object |
| `is_active` | BOOLEAN | DEFAULT true | Is role active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated timestamp |

**Default Roles:**
```
Admin: super_admin, principal, department_admin, hod, exam_cell_admin, 
       library_admin, bus_admin, canteen_admin, finance_admin
Teacher: subject_teacher, class_teacher, mentor, coordinator
Student: student
```

---

### 3. 👥 USER_ROLES (Many-to-Many)

**Purpose:** Assign multiple roles to users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Assignment ID |
| `user_id` | UUID | NOT NULL, **FK → profiles(id)** | User reference |
| `role_id` | UUID | NOT NULL, **FK → roles(id)** | Role reference |
| `department_id` | UUID | **FK → departments(id)** | Department-specific role |
| `assigned_by` | UUID | FK → profiles(id) | Who assigned the role |
| `assigned_at` | TIMESTAMPTZ | DEFAULT NOW() | When assigned |
| `is_active` | BOOLEAN | DEFAULT true | Is assignment active |

**Unique Constraint:** (user_id, role_id, department_id)

---

### 4. 🏢 DEPARTMENTS

**Purpose:** Academic departments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Department ID |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Dept code (CSE, ECE) |
| `name` | VARCHAR(100) | NOT NULL | Full name |
| `short_name` | VARCHAR(20) | | Short name |
| `description` | TEXT | | Description |
| `hod_user_id` | UUID | **FK → profiles(id)** | HOD reference |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

---

### 5. 📅 ACADEMIC_YEARS

**Purpose:** Academic year periods

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Year ID |
| `name` | VARCHAR(20) | NOT NULL | Name (2024-2025) |
| `start_date` | DATE | NOT NULL | Start date |
| `end_date` | DATE | NOT NULL | End date |
| `is_current` | BOOLEAN | DEFAULT false | Current academic year |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

---

### 6. 📚 YEARS

**Purpose:** Academic years (1st, 2nd, 3rd, 4th)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Year ID |
| `year_number` | INTEGER | CHECK (1-6) | Year number |
| `name` | VARCHAR(20) | NOT NULL | Name (1st Year) |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 7. 📖 SEMESTERS

**Purpose:** Semesters within years

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Semester ID |
| `semester_number` | INTEGER | CHECK (1-8) | Semester number |
| `name` | VARCHAR(20) | NOT NULL | Name (Semester 1) |
| `year_id` | UUID | NOT NULL, **FK → years(id)** | Parent year |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 8. 🏫 SECTIONS

**Purpose:** Class sections (A, B, C)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Section ID |
| `name` | VARCHAR(10) | NOT NULL | Section name (A, B) |
| `department_id` | UUID | NOT NULL, **FK → departments(id)** | Department |
| `year_id` | UUID | NOT NULL, **FK → years(id)** | Year |
| `academic_year_id` | UUID | NOT NULL, **FK → academic_years(id)** | Academic year |
| `max_students` | INTEGER | DEFAULT 60 | Maximum capacity |
| `class_teacher_id` | UUID | **FK → profiles(id)** | Class teacher |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Unique Constraint:** (name, department_id, year_id, academic_year_id)

---

### 9. 🎓 STUDENTS

**Purpose:** Student records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Student ID |
| `user_id` | UUID | NOT NULL, UNIQUE, **FK → profiles(id)** | Profile link |
| `registration_number` | VARCHAR(50) | NOT NULL, UNIQUE | Reg number |
| `roll_number` | VARCHAR(50) | | Roll number |
| `hall_ticket_number` | VARCHAR(50) | | Hall ticket |
| `apaar_id` | VARCHAR(50) | | APAAR ID |
| `program_id` | UUID | **FK → programs(id)** | Enrolled program |
| `department_id` | UUID | NOT NULL, **FK → departments(id)** | Department |
| `year_id` | UUID | NOT NULL, **FK → years(id)** | Current year |
| `current_year_id` | UUID | **FK → years(id)** | Active year |
| `semester_id` | UUID | NOT NULL, **FK → semesters(id)** | Current semester |
| `section_id` | UUID | **FK → sections(id)** | Section |
| `academic_year_id` | UUID | NOT NULL, **FK → academic_years(id)** | Academic year |
| `admission_year` | INTEGER | NOT NULL | Admission year |
| `admission_date` | DATE | | Admission date |
| `admitted_through` | VARCHAR(50) | | EAMCET/Management/Sports |
| `father_name` | VARCHAR(100) | | Father's name |
| `mother_name` | VARCHAR(100) | | Mother's name |
| `guardian_name` | VARCHAR(100) | | Guardian's name |
| `parent_phone` | VARCHAR(20) | | Parent phone |
| `parent_email` | VARCHAR(255) | | Parent email |
| `parent_occupation` | VARCHAR(100) | | Parent occupation |
| `blood_group` | VARCHAR(5) | | Blood group |
| `category` | VARCHAR(50) | | Category (General/OBC/SC/ST) |
| `aadhar_number_encrypted` | TEXT | | Encrypted Aadhar |
| `current_status` | user_status | DEFAULT 'active' | Status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes:**
- `idx_students_registration` on registration_number
- `idx_students_department` on department_id
- `idx_students_section` on section_id
- `idx_students_year` on year_id

---

### 10. 👨‍🏫 TEACHERS

**Purpose:** Teacher records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Teacher ID |
| `user_id` | UUID | NOT NULL, UNIQUE, **FK → profiles(id)** | Profile link |
| `employee_id` | VARCHAR(50) | NOT NULL, UNIQUE | Employee ID |
| `department_id` | UUID | NOT NULL, **FK → departments(id)** | Department |
| `designation` | teacher_designation | NOT NULL | professor/lecturer/etc |
| `teacher_type` | teacher_type | DEFAULT 'full_time' | Type |
| `qualification` | VARCHAR(100) | | PhD/M.Tech/etc |
| `specialization` | VARCHAR(200) | | Specialization |
| `experience_years` | INTEGER | DEFAULT 0 | Experience |
| `joining_date` | DATE | | Joining date |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `is_hod` | BOOLEAN | DEFAULT false | Is HOD |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes:**
- `idx_teachers_employee_id` on employee_id
- `idx_teachers_department` on department_id

---

### 11. 📚 COURSES

**Purpose:** Subjects/Courses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Course ID |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Course code |
| `name` | VARCHAR(200) | NOT NULL | Course name |
| `short_name` | VARCHAR(50) | | Short name |
| `description` | TEXT | | Description |
| `department_id` | UUID | NOT NULL, **FK → departments(id)** | Department |
| `semester_id` | UUID | NOT NULL, **FK → semesters(id)** | Semester |
| `course_type` | course_type | DEFAULT 'core' | core/elective/lab |
| `program_type` | VARCHAR(50) | | UG/PG |
| `is_degree_program` | BOOLEAN | DEFAULT false | Is degree program |
| `theory_hours` | INTEGER | DEFAULT 0 | Theory hours/week |
| `lab_hours` | INTEGER | DEFAULT 0 | Lab hours/week |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

**Indexes:**
- `idx_courses_department` on department_id
- `idx_courses_semester` on semester_id

---

### 12. 👨‍🏫 TEACHER_COURSES

**Purpose:** Teacher-Course assignments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Assignment ID |
| `teacher_id` | UUID | NOT NULL, **FK → teachers(id)** | Teacher |
| `course_id` | UUID | NOT NULL, **FK → courses(id)** | Course |
| `section_id` | UUID | **FK → sections(id)** | Section |
| `academic_year_id` | UUID | NOT NULL, **FK → academic_years(id)** | Academic year |
| `is_primary` | BOOLEAN | DEFAULT true | Primary teacher |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

**Unique Constraint:** (teacher_id, course_id, section_id, academic_year_id)

---

### 13. 📅 ATTENDANCE

**Purpose:** Attendance session records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Attendance ID |
| `date` | DATE | NOT NULL | Date |
| `period` | INTEGER | NOT NULL | Period number |
| `course_id` | UUID | NOT NULL, **FK → courses(id)** | Course |
| `section_id` | UUID | **FK → sections(id)** | Section |
| `program_id` | UUID | **FK → programs(id)** | Program |
| `year_id` | UUID | **FK → years(id)** | Year |
| `academic_year_id` | UUID | NOT NULL, **FK → academic_years(id)** | Academic year |
| `timetable_entry_id` | UUID | **FK → timetable_entries(id)** | Timetable link |
| `marked_by` | UUID | NOT NULL, **FK → profiles(id)** | Teacher who marked |
| `marked_at` | TIMESTAMPTZ | NOT NULL | When marked |
| `is_locked` | BOOLEAN | DEFAULT false | Is locked |
| `locked_at` | TIMESTAMPTZ | | When locked |
| `late_minutes` | INTEGER | DEFAULT 0 | Late minutes threshold |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 14. 📋 ATTENDANCE_RECORDS

**Purpose:** Individual student attendance entries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Record ID |
| `attendance_id` | UUID | NOT NULL, **FK → attendance(id)** | Attendance session |
| `student_id` | UUID | NOT NULL, **FK → students(id)** | Student |
| `status` | attendance_status | NOT NULL | present/absent/late/excused/od |
| `late_minutes` | INTEGER | DEFAULT 0 | Minutes late |
| `marked_at` | TIMESTAMPTZ | NOT NULL | When marked |
| `edited_at` | TIMESTAMPTZ | | When edited |
| `edit_reason` | TEXT | | Reason for edit |
| `edited_by` | UUID | **FK → profiles(id)** | Who edited |
| `edit_count` | INTEGER | DEFAULT 0 | Number of edits |

---

### 15. 📕 BOOKS (Library)

**Purpose:** Library book catalog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Book ID |
| `title` | VARCHAR(200) | NOT NULL | Book title |
| `isbn` | VARCHAR(20) | UNIQUE | ISBN |
| `author` | VARCHAR(200) | | Author |
| `publisher` | VARCHAR(200) | | Publisher |
| `category` | VARCHAR(100) | | Category |
| `total_copies` | INTEGER | DEFAULT 1 | Total copies |
| `available_copies` | INTEGER | DEFAULT 1 | Available copies |
| `location` | VARCHAR(100) | | Shelf location |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

---

### 16. 📖 BOOK_ISSUES

**Purpose:** Book lending records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Issue ID |
| `book_id` | UUID | NOT NULL, **FK → books(id)** | Book |
| `user_id` | UUID | NOT NULL, **FK → profiles(id)** | Borrower |
| `issue_date` | DATE | NOT NULL | Issue date |
| `due_date` | DATE | NOT NULL | Due date |
| `return_date` | DATE | | Actual return date |
| `status` | VARCHAR(20) | | issued/returned/overdue |
| `fine_amount` | DECIMAL(10,2) | DEFAULT 0 | Fine if any |
| `issued_by` | UUID | **FK → profiles(id)** | Librarian |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 17. 📝 EXAMS

**Purpose:** Examination records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Exam ID |
| `name` | VARCHAR(200) | NOT NULL | Exam name |
| `exam_type` | VARCHAR(50) | | internal/external/mid-term |
| `department_id` | UUID | **FK → departments(id)** | Department |
| `semester_id` | UUID | **FK → semesters(id)** | Semester |
| `academic_year_id` | UUID | **FK → academic_years(id)** | Academic year |
| `start_date` | DATE | | Start date |
| `end_date` | DATE | | End date |
| `date` | DATE | | Single exam date |
| `max_marks` | INTEGER | | Maximum marks |
| `pass_marks` | INTEGER | | Passing marks |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 18. 📋 ASSIGNMENTS

**Purpose:** Assignment records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Assignment ID |
| `title` | VARCHAR(200) | NOT NULL | Title |
| `description` | TEXT | | Description |
| `course_id` | UUID | NOT NULL, **FK → courses(id)** | Course |
| `section_id` | UUID | **FK → sections(id)** | Section |
| `teacher_id` | UUID | NOT NULL, **FK → teachers(id)** | Assigned by |
| `due_date` | TIMESTAMPTZ | NOT NULL | Due date |
| `max_marks` | INTEGER | | Maximum marks |
| `status` | VARCHAR(20) | DEFAULT 'active' | active/closed |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 19. 💰 FEE_STRUCTURES

**Purpose:** Fee structure definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Structure ID |
| `name` | VARCHAR(100) | NOT NULL | Structure name |
| `department_id` | UUID | **FK → departments(id)** | Department |
| `year_id` | UUID | **FK → years(id)** | Year |
| `semester_id` | UUID | **FK → semesters(id)** | Semester |
| `academic_year_id` | UUID | **FK → academic_years(id)** | Academic year |
| `tuition_fee` | DECIMAL(12,2) | | Tuition fee |
| `exam_fee` | DECIMAL(12,2) | | Exam fee |
| `library_fee` | DECIMAL(12,2) | | Library fee |
| `lab_fee` | DECIMAL(12,2) | | Lab fee |
| `other_fee` | DECIMAL(12,2) | | Other fees |
| `total_fee` | DECIMAL(12,2) | | Total fee |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 20. 🚌 BUS_ROUTES

**Purpose:** Bus route information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Route ID |
| `route_number` | VARCHAR(20) | NOT NULL | Route number |
| `route_name` | VARCHAR(200) | NOT NULL | Route name |
| `start_point` | VARCHAR(200) | | Start location |
| `end_point` | VARCHAR(200) | | End location |
| `stops` | JSONB | | Array of stops |
| `driver_name` | VARCHAR(100) | | Driver name |
| `driver_phone` | VARCHAR(20) | | Driver phone |
| `bus_number` | VARCHAR(20) | | Vehicle number |
| `capacity` | INTEGER | | Bus capacity |
| `monthly_fee` | DECIMAL(10,2) | | Monthly fee |
| `is_active` | BOOLEAN | DEFAULT true | Is active |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |

---

### 21. 📢 NOTICES

**Purpose:** College notices/announcements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Notice ID |
| `title` | VARCHAR(200) | NOT NULL | Title |
| `content` | TEXT | NOT NULL | Content |
| `category` | VARCHAR(50) | | Category |
| `priority` | VARCHAR(20) | | low/medium/high/urgent |
| `target_roles` | JSONB | | Target audience roles |
| `department_id` | UUID | **FK → departments(id)** | Target department |
| `is_published` | BOOLEAN | DEFAULT false | Is published |
| `published_at` | TIMESTAMPTZ | | Published date |
| `expires_at` | TIMESTAMPTZ | | Expiry date |
| `created_by` | UUID | **FK → profiles(id)** | Author |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Created |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Updated |

---

### 22. 📊 AUDIT_LOGS

**Purpose:** System audit trail

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | **PK** | Log ID |
| `user_id` | UUID | **FK → profiles(id)** | User who performed action |
| `action` | VARCHAR(100) | NOT NULL | Action type |
| `table_name` | VARCHAR(100) | | Affected table |
| `record_id` | UUID | | Affected record |
| `old_values` | JSONB | | Previous values |
| `new_values` | JSONB | | New values |
| `ip_address` | VARCHAR(50) | | IP address |
| `user_agent` | TEXT | | Browser/app info |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | When logged |

---

## 🔗 Foreign Key Relationships Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          FOREIGN KEY RELATIONSHIPS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  profiles(id)         → auth.users(id)           [1:1 - CASCADE DELETE]         │
│  profiles(primary_role) → roles(name)            [N:1]                          │
│  profiles(department_id) → departments(id)       [N:1]                          │
│                                                                                  │
│  user_roles(user_id)  → profiles(id)             [N:1 - CASCADE DELETE]         │
│  user_roles(role_id)  → roles(id)                [N:1 - CASCADE DELETE]         │
│  user_roles(department_id) → departments(id)     [N:1 - SET NULL]               │
│                                                                                  │
│  departments(hod_user_id) → profiles(id)         [N:1 - SET NULL]               │
│                                                                                  │
│  sections(department_id) → departments(id)       [N:1 - CASCADE DELETE]         │
│  sections(year_id)    → years(id)                [N:1 - CASCADE DELETE]         │
│  sections(academic_year_id) → academic_years(id) [N:1 - CASCADE DELETE]         │
│  sections(class_teacher_id) → profiles(id)       [N:1 - SET NULL]               │
│                                                                                  │
│  semesters(year_id)   → years(id)                [N:1 - CASCADE DELETE]         │
│                                                                                  │
│  students(user_id)    → profiles(id)             [1:1 - CASCADE DELETE]         │
│  students(department_id) → departments(id)       [N:1]                          │
│  students(year_id)    → years(id)                [N:1]                          │
│  students(semester_id) → semesters(id)           [N:1]                          │
│  students(section_id) → sections(id)             [N:1]                          │
│  students(academic_year_id) → academic_years(id) [N:1]                          │
│  students(program_id) → programs(id)             [N:1]                          │
│                                                                                  │
│  teachers(user_id)    → profiles(id)             [1:1 - CASCADE DELETE]         │
│  teachers(department_id) → departments(id)       [N:1]                          │
│                                                                                  │
│  courses(department_id) → departments(id)        [N:1]                          │
│  courses(semester_id) → semesters(id)            [N:1]                          │
│                                                                                  │
│  teacher_courses(teacher_id) → teachers(id)      [N:1 - CASCADE DELETE]         │
│  teacher_courses(course_id) → courses(id)        [N:1 - CASCADE DELETE]         │
│  teacher_courses(section_id) → sections(id)      [N:1 - CASCADE DELETE]         │
│  teacher_courses(academic_year_id) → academic_years(id) [N:1]                   │
│                                                                                  │
│  attendance(course_id) → courses(id)             [N:1]                          │
│  attendance(section_id) → sections(id)           [N:1]                          │
│  attendance(marked_by) → profiles(id)            [N:1]                          │
│                                                                                  │
│  attendance_records(attendance_id) → attendance(id) [N:1]                       │
│  attendance_records(student_id) → students(id)   [N:1]                          │
│                                                                                  │
│  book_issues(book_id) → books(id)                [N:1]                          │
│  book_issues(user_id) → profiles(id)             [N:1]                          │
│                                                                                  │
│  assignments(course_id) → courses(id)            [N:1]                          │
│  assignments(teacher_id) → teachers(id)          [N:1]                          │
│                                                                                  │
│  notices(created_by)  → profiles(id)             [N:1]                          │
│  notices(department_id) → departments(id)        [N:1]                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 Page-to-Database Mapping

### Admin Dashboard (`app/(admin)/dashboard.tsx`)

| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `students` | SELECT (count) | Total students count |
| `teachers` | SELECT (count) | Total teachers count |
| `departments` | SELECT (count) | Active departments count |
| `courses` | SELECT (count) | Active courses count |
| `profiles` | SELECT (count) | Pending approvals, students, teachers by role |
| `audit_logs` | SELECT | Recent activity feed |

**Real-time Subscriptions:**
- `profiles` - User changes
- `courses` - Course updates
- `departments` - Department changes
- `notices` - New notices
- `attendance` - Attendance updates
- `exams` - Exam updates
- `assignments` - Assignment changes
- `library_books` - Library updates

---

### Analytics (`app/(admin)/analytics/index.tsx`)

| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `profiles` | SELECT | Student/teacher counts by role |
| `courses` | SELECT (count) | Total courses |
| `departments` | SELECT | Department stats |
| `notices` | SELECT (count) | Active notices |
| `attendance` | SELECT | Today's attendance, historical data |
| `exams` | SELECT (count) | Upcoming exams |
| `assignments` | SELECT (count) | Active assignments |
| `library_books` | SELECT (count) | Library stats |

---

### User Management (`app/(admin)/users/`)

#### Students List (`users/students/index.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `departments` | SELECT | Department filter |
| `students` | SELECT | Student list with profiles |
| `profiles` | SELECT (join) | Student profile info |

#### Create Student (`users/students/create.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `departments` | SELECT | Department selection |
| `courses` | SELECT | Program selection |
| `years` | SELECT | Year selection |
| `academic_years` | SELECT | Current academic year |
| `semesters` | SELECT | Semester selection |
| `profiles` | INSERT | Create user profile |
| `students` | INSERT | Create student record |
| `user_roles` | INSERT | Assign student role |

#### Teachers List (`users/teachers/index.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `teachers` | SELECT | Teacher list with profiles |
| `profiles` | SELECT (join) | Teacher profile info |
| `departments` | SELECT (join) | Department info |

#### Create Teacher (`users/teachers/create.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `departments` | SELECT | Department selection |
| `profiles` | INSERT | Create user profile |
| `teachers` | INSERT | Create teacher record |
| `roles` | SELECT | Get teacher role ID |
| `user_roles` | INSERT | Assign teacher role |

#### Assign Roles (`users/assign-roles.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `roles` | SELECT | Available roles |
| `profiles` | SELECT | User list |
| `user_roles` | SELECT, INSERT, DELETE | Role assignments |

---

### Academic Management (`app/(admin)/academic/`)

#### Academic Index (`academic/index.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `departments` | SELECT (count) | Department count |
| `courses` | SELECT (count) | Course count |
| `subjects` | SELECT (count) | Subject count |
| `years` | SELECT (count) | Year count |
| `semesters` | SELECT (count) | Semester count |

#### Departments (`academic/departments/`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `departments` | SELECT, INSERT, UPDATE, DELETE | CRUD operations |
| `profiles` | SELECT | HOD selection |

#### Courses (`academic/courses/`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `courses` | SELECT, INSERT, UPDATE, DELETE | CRUD operations |
| `departments` | SELECT | Department selection |
| `semesters` | SELECT | Semester selection |

---

### Attendance (`app/(admin)/attendance/`)

| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `attendance` | SELECT | Today's/pending attendance |
| `attendance_records` | SELECT | Individual records |
| `holidays` | SELECT | Holiday information |
| `timetable_entries` | SELECT | Expected classes |
| `attendance_logs` | SELECT | Recent activity |

---

### Library (`app/(admin)/library/`)

#### Library Index
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `books` | SELECT | Total/available books |
| `book_issues` | SELECT (count) | Issued/overdue books |

#### Books Management (`library/books.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `books` | SELECT, INSERT, UPDATE, DELETE | CRUD operations |

#### Issue Books (`library/issue.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `book_issues` | SELECT, INSERT | Issue records |
| `books` | SELECT, UPDATE | Book availability |
| `users` | SELECT | User selection |

#### Return Books (`library/return.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `book_issues` | SELECT, UPDATE | Return processing |
| `books` | SELECT (join) | Book info |

---

### Exams (`app/(admin)/exams/`)

| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `exams` | SELECT (count) | Upcoming/ongoing/completed exams |
| `exam_schedules` | SELECT | Exam schedules |

---

### Assignments (`app/(admin)/assignments/`)

| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `assignments` | SELECT (count) | Active/overdue assignments |
| `assignment_submissions` | SELECT | Submission stats |

---

### Fees (`app/(admin)/fees/`)

#### Fee Structures (`fees/structures.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `departments` | SELECT | Department filter |
| `academic_years` | SELECT | Academic year filter |
| `years` | SELECT | Year filter |
| `semesters` | SELECT | Semester filter |
| `fee_structures` | SELECT, INSERT, UPDATE, DELETE | CRUD operations |

#### Fee Payments (`fees/payment.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `fee_payments` | INSERT | Record payments |
| `student_fees` | SELECT, UPDATE | Student fee status |

#### Reports (`fees/reports.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `student_fees` | SELECT | Fee collection data |
| `fee_payments` | SELECT | Payment history |

---

### Timetable (`app/(admin)/timetable/`)

#### Timetable Index
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `courses` | SELECT | Course/program selection |
| `years` | SELECT | Year selection |

#### Create Timetable (`timetable/create.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `courses` | SELECT | Course info |
| `years` | SELECT | Year info |
| `academic_years` | SELECT | Current academic year |
| `teachers` | SELECT | Teacher selection |
| `timetable_entries` | SELECT, INSERT | Create/view entries |

#### Substitutions (`timetable/substitutions.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `substitutions` | SELECT (count), INSERT | Substitution records |

---

### Bus Management (`app/(admin)/bus/`)

| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `bus_routes` | SELECT (count) | Active routes |
| `bus_subscriptions` | SELECT (count) | Pending/approved subscriptions |

---

### Notices (`app/(admin)/notices.tsx`)

| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `notices` | SELECT, INSERT, UPDATE, DELETE | CRUD operations |
| `departments` | SELECT | Target department |

---

### Settings (`app/(admin)/settings/`)

#### Academic Year (`settings/academic-year.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `academic_years` | SELECT, INSERT, UPDATE | Manage academic years |

---

### Teacher Portal (`app/(teacher)/`)

#### Mark Attendance (`attendance/mark.tsx`)
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `attendance` | INSERT | Create attendance session |
| `attendance_records` | INSERT, UPDATE | Mark individual students |
| `attendance_logs` | INSERT | Log activity |
| `students` | SELECT | Student list for marking |

---

### Student Portal (`app/(student)/`)

#### Dashboard
| Database Table | Operations | Purpose |
|----------------|------------|---------|
| `students` | SELECT | Own student record |
| `attendance_records` | SELECT | Own attendance |
| `assignments` | SELECT | Assigned work |
| `notices` | SELECT | Relevant notices |

---

## 📝 Enums & Custom Types

```sql
-- User status
CREATE TYPE user_status AS ENUM (
    'active', 
    'inactive', 
    'suspended', 
    'graduated', 
    'dropout',
    'pending'
);

-- Gender
CREATE TYPE gender_type AS ENUM (
    'male', 
    'female', 
    'other'
);

-- Teacher type
CREATE TYPE teacher_type AS ENUM (
    'full_time', 
    'part_time', 
    'visiting', 
    'guest', 
    'lab_assistant'
);

-- Teacher designation
CREATE TYPE teacher_designation AS ENUM (
    'professor', 
    'associate_professor', 
    'assistant_professor', 
    'lecturer', 
    'lab_instructor'
);

-- Course type
CREATE TYPE course_type AS ENUM (
    'core', 
    'elective', 
    'open_elective', 
    'lab', 
    'mandatory', 
    'major', 
    'minor'
);

-- Attendance status
CREATE TYPE attendance_status AS ENUM (
    'present', 
    'absent', 
    'late', 
    'excused', 
    'od'  -- On Duty
);
```

---

## 🔒 Row Level Security (RLS) Policies

```sql
-- All tables have RLS enabled:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Key Policies:

-- 1. Users can view/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Authenticated users can read reference data
CREATE POLICY "Authenticated users can read roles" ON roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read departments" ON departments
    FOR SELECT TO authenticated USING (true);

-- 3. Admins have full access (via is_admin() function)
CREATE POLICY "Admins have full access to profiles" ON profiles
    FOR ALL USING (is_admin());

-- 4. Teachers can view students (for attendance, grades)
CREATE POLICY "Teachers can view all students" ON students
    FOR SELECT USING (is_teacher());
```

---

## ⚙️ Triggers & Functions

### Auto-create Profile on Signup
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, primary_role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Auto-update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to: profiles, students, teachers, departments, sections, courses
```

### Helper Functions
```sql
-- Check if user is admin
CREATE FUNCTION is_admin() RETURNS BOOLEAN;

-- Check if user is teacher
CREATE FUNCTION is_teacher() RETURNS BOOLEAN;

-- Get user's roles
CREATE FUNCTION get_user_roles(user_uuid UUID) 
    RETURNS TABLE(role_name VARCHAR, role_category VARCHAR, department_code VARCHAR);

-- Get current academic year
CREATE FUNCTION get_current_academic_year() RETURNS UUID;
```

---

## 📊 Database Statistics

| Metric | Value |
|--------|-------|
| **Total Tables** | 22+ |
| **Total Foreign Keys** | 40+ |
| **Custom Enums** | 6 |
| **RLS Policies** | 15+ |
| **Triggers** | 6+ |
| **Helper Functions** | 4+ |
| **Indexes** | 15+ |

---

## 🔄 Data Flow Examples

### Student Registration Flow
```
1. Auth signup → auth.users (Supabase Auth)
2. Trigger → profiles (auto-created)
3. Admin creates → students (linked to profile)
4. Admin assigns → user_roles (student role)
```

### Attendance Marking Flow
```
1. Teacher creates → attendance (session)
2. For each student → attendance_records (status)
3. Activity logged → attendance_logs
```

### Library Book Issue Flow
```
1. Check availability → books.available_copies
2. Create record → book_issues (status: issued)
3. Update stock → books (available_copies - 1)
```

---

## 📦 NEW TABLES (Added December 17, 2025)

### 🎓 Batches Table

**Purpose:** Manage student batches/cohorts by academic year, department, and section.

**Table:** `batches`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique batch identifier |
| `batch_name` | VARCHAR(100) | NOT NULL | Batch display name (e.g., "CSE 2021-2025") |
| `academic_year_id` | UUID | FK → academic_years | Academic year reference |
| `department_id` | UUID | FK → departments | Department reference |
| `year_id` | UUID | FK → years | Year reference (1st, 2nd, etc.) |
| `section_id` | UUID | FK → sections | Section reference |
| `start_year` | INTEGER | NOT NULL | Batch start year (e.g., 2021) |
| `end_year` | INTEGER | NOT NULL | Batch end year (e.g., 2025) |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_batches_academic_year` on `academic_year_id`
- `idx_batches_department` on `department_id`
- `idx_batches_year` on `year_id`
- `idx_batches_section` on `section_id`
- `idx_batches_active` on `is_active`

**RLS Policies:**
- Admins: Full access
- Teachers: View all batches
- Students: View their own batch only

**Used By Pages:**
- Admin → Academic → Batches Management
- Admin → Reports → Batch-wise Analytics

**Relations:**
- `students.batch_id` → `batches.id` (One batch has many students)

---

### 👨‍👩‍👧 Parents Table

**Purpose:** Store parent/guardian information for students separately from student records.

**Table:** `parents`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique parent record identifier |
| `student_id` | UUID | FK → students, UNIQUE | Student reference (1:1) |
| `father_name` | VARCHAR(100) | - | Father's full name |
| `mother_name` | VARCHAR(100) | - | Mother's full name |
| `guardian_name` | VARCHAR(100) | - | Guardian's name (if applicable) |
| `father_phone` | VARCHAR(20) | - | Father's contact number |
| `mother_phone` | VARCHAR(20) | - | Mother's contact number |
| `father_email` | VARCHAR(255) | - | Father's email address |
| `mother_email` | VARCHAR(255) | - | Mother's email address |
| `address` | TEXT | - | Complete residential address |
| `emergency_contact` | VARCHAR(20) | - | Emergency contact number |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_parents_student` on `student_id`

**RLS Policies:**
- Students: View their own parent info only
- Teachers: View all parent info
- Admins: Full access

**Used By Pages:**
- Admin → Users → Students → [Student Detail] (Parent Info Tab)
- Teacher → Students → [Student Profile] (Contact Info)

**Note:** Parent info also exists in `students` table (father_name, mother_name, parent_phone) for backward compatibility. This table provides extended parent information.

---

### 🚌 Bus Subscriptions Table

**Purpose:** Manage student bus service subscriptions with approval workflow.

**Table:** `bus_subscriptions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique subscription identifier |
| `student_id` | UUID | FK → students | Student reference |
| `route_id` | UUID | FK → bus_routes | Bus route reference |
| `stop_id` | UUID | FK → bus_stops | Bus stop reference |
| `academic_year_id` | UUID | FK → academic_years | Academic year reference |
| `approval_status` | VARCHAR(20) | CHECK constraint | Status: pending/approved/rejected |
| `approved_by` | UUID | FK → profiles | Approver reference (admin) |
| `approved_at` | TIMESTAMPTZ | - | Approval timestamp |
| `rejection_reason` | TEXT | - | Reason if rejected |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraint:** `(student_id, academic_year_id)` - One subscription per student per year

**Indexes:**
- `idx_bus_subscriptions_student` on `student_id`
- `idx_bus_subscriptions_route` on `route_id`
- `idx_bus_subscriptions_status` on `approval_status`
- `idx_bus_subscriptions_academic_year` on `academic_year_id`

**RLS Policies:**
- Students: View and insert their own subscription
- Admins: Full access (approve/reject/modify)

**Used By Pages:**
- Admin → Bus → Management (All subscriptions)
- Admin → Bus → Approvals (Pending requests)
- Admin → Bus → Reports (Route-wise stats)
- Student → Bus → Apply for Service

**Status Flow:**
```
pending → approved (by admin)
pending → rejected (by admin with reason)
```

---

*Document Version: 2.0*  
*Last Updated: December 17, 2025*  
*Database: Supabase (PostgreSQL)*  
*Recent Changes: Added batches, parents, and bus_subscriptions tables*
