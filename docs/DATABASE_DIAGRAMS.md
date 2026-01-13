# College App Database Architecture

**Date:** 2026-01-13  
**Database:** PostgreSQL (Supabase)  
**Total Tables:** 40+  
**Security:** Row Level Security (RLS) Enabled

---

## Table of Contents

1. [Complete Database Schema Overview](#complete-database-schema-overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Database Flow Architecture](#database-flow-architecture)
4. [Row Level Security (RLS) Overview](#row-level-security-rls-overview)
5. [RLS Policy Visualization](#rls-policy-visualization)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Table Relationships](#table-relationships)
8. [Security Functions](#security-functions)

---

## Complete Database Schema Overview

### Database Architecture at a Glance

```mermaid
graph TB
    subgraph "Authentication Layer"
        AUTH[Supabase Auth]
        PROFILES[profiles table]
        AUTH --> PROFILES
    end
    
    subgraph "Authorization Layer"
        ROLES[roles table]
        USER_ROLES[user_roles table]
        RBAC[RBAC Functions]
        PROFILES --> USER_ROLES
        ROLES --> USER_ROLES
        USER_ROLES --> RBAC
    end
    
    subgraph "Core Academic"
        DEPTS[departments]
        YEARS[years]
        SEMS[semesters]
        SECTIONS[sections]
        COURSES[courses]
        ACAD_YEARS[academic_years]
        
        DEPTS --> SECTIONS
        YEARS --> SEMS
        YEARS --> SECTIONS
        SEMS --> COURSES
        DEPTS --> COURSES
    end
    
    subgraph "User Management"
        STUDENTS[students]
        TEACHERS[teachers]
        MENTOR[mentor_assignments]
        TEACHER_COURSES[teacher_courses]
        
        PROFILES --> STUDENTS
        PROFILES --> TEACHERS
        STUDENTS --> SECTIONS
        TEACHERS --> DEPTS
        TEACHERS --> MENTOR
        STUDENTS --> MENTOR
        TEACHERS --> TEACHER_COURSES
        COURSES --> TEACHER_COURSES
    end
    
    subgraph "Timetable & Attendance"
        TIMETABLE[timetable_entries]
        ATTENDANCE[attendance]
        ATT_RECORDS[attendance_records]
        ATT_ALERTS[attendance_alerts]
        SUBSTITUTIONS[substitutions]
        LATE_PASSES[late_passes]
        HOLIDAYS[holidays]
        LEAVES[student_leave_applications]
        
        TEACHER_COURSES --> TIMETABLE
        TIMETABLE --> ATTENDANCE
        ATTENDANCE --> ATT_RECORDS
        STUDENTS --> ATT_RECORDS
        STUDENTS --> ATT_ALERTS
        TIMETABLE --> SUBSTITUTIONS
        STUDENTS --> LATE_PASSES
        STUDENTS --> LEAVES
    end
    
    subgraph "Examination System"
        EXAMS[exams]
        EXAM_SCHEDULES[exam_schedules]
        EXAM_MARKS[exam_marks]
        EXTERNAL_MARKS[external_marks]
        
        EXAMS --> EXAM_SCHEDULES
        COURSES --> EXAM_SCHEDULES
        EXAM_SCHEDULES --> EXAM_MARKS
        STUDENTS --> EXAM_MARKS
        STUDENTS --> EXTERNAL_MARKS
    end
    
    subgraph "Assignments & Materials"
        ASSIGNMENTS[assignments]
        SUBMISSIONS[assignment_submissions]
        MATERIALS[teaching_materials]
        
        TEACHERS --> ASSIGNMENTS
        COURSES --> ASSIGNMENTS
        ASSIGNMENTS --> SUBMISSIONS
        STUDENTS --> SUBMISSIONS
        TEACHERS --> MATERIALS
        COURSES --> MATERIALS
    end
    
    subgraph "Library System"
        BOOKS[books]
        BOOK_ISSUES[book_issues]
        BOOK_RESERVATIONS[book_reservations]
        
        BOOKS --> BOOK_ISSUES
        BOOKS --> BOOK_RESERVATIONS
        STUDENTS --> BOOK_ISSUES
        STUDENTS --> BOOK_RESERVATIONS
    end
    
    subgraph "Financial System"
        FEE_STRUCTURES[fee_structures]
        STUDENT_FEES[student_fees]
        FEE_PAYMENTS[fee_payments]
        
        FEE_STRUCTURES --> STUDENT_FEES
        STUDENTS --> STUDENT_FEES
        STUDENT_FEES --> FEE_PAYMENTS
    end
    
    subgraph "Transport System"
        BUS_ROUTES[bus_routes]
        BUS_STOPS[bus_stops]
        BUS_VEHICLES[bus_vehicles]
        BUS_SUBS[bus_subscriptions]
        BUS_ALERTS[bus_alerts]
        
        BUS_ROUTES --> BUS_STOPS
        BUS_ROUTES --> BUS_VEHICLES
        BUS_ROUTES --> BUS_SUBS
        STUDENTS --> BUS_SUBS
        BUS_VEHICLES --> BUS_ALERTS
    end
    
    subgraph "Canteen System"
        MENU_ITEMS[canteen_menu_items]
        DAILY_MENU[canteen_daily_menu]
        TOKENS[canteen_tokens]
        
        MENU_ITEMS --> DAILY_MENU
        DAILY_MENU --> TOKENS
        STUDENTS --> TOKENS
    end
    
    subgraph "Communication"
        NOTICES[notices]
        NOTICE_READS[notice_reads]
        EVENTS[events]
        EVENT_CERTS[event_certificates]
        FEEDBACK[feedback]
        COMPLAINTS[complaints]
        
        NOTICES --> NOTICE_READS
        PROFILES --> NOTICE_READS
        EVENTS --> EVENT_CERTS
        STUDENTS --> EVENT_CERTS
        PROFILES --> FEEDBACK
        PROFILES --> COMPLAINTS
    end
    
    subgraph "Teacher Workflows"
        LESSON_PLANNERS[lesson_planners]
        WORK_DIARY[work_diary_entries]
        
        TEACHERS --> LESSON_PLANNERS
        COURSES --> LESSON_PLANNERS
        TEACHERS --> WORK_DIARY
        COURSES --> WORK_DIARY
    end
    
    subgraph "Reception"
        GATE_PASSES[gate_passes]
        
        STUDENTS --> GATE_PASSES
    end
    
    subgraph "Miscellaneous"
        MINOR_SUBJECTS[minor_subjects]
        STUDENT_MINORS[student_minor_registrations]
        COLLEGE_INFO[college_info]
        
        MINOR_SUBJECTS --> STUDENT_MINORS
        STUDENTS --> STUDENT_MINORS
    end
    
    subgraph "Storage Buckets"
        BUCKET_MATERIALS[teaching-materials]
        BUCKET_SUBMISSIONS[assignment-submissions]
        BUCKET_PROFILES[profile-photos]
        BUCKET_DOCS[documents]
    end
    
    MATERIALS -.-> BUCKET_MATERIALS
    SUBMISSIONS -.-> BUCKET_SUBMISSIONS
    PROFILES -.-> BUCKET_PROFILES
    
    style AUTH fill:#4CAF50
    style PROFILES fill:#4CAF50
    style RBAC fill:#2196F3
    style ROLES fill:#FF9800
    style USER_ROLES fill:#FF9800
```

### Table Categories

```mermaid
pie title "Database Tables by Category (42 Tables)"
    "Core Academic" : 7
    "User Management" : 5
    "Timetable & Attendance" : 7
    "Examination" : 4
    "Assignments" : 3
    "Library" : 3
    "Financial" : 3
    "Transport" : 5
    "Canteen" : 3
    "Communication" : 6
    "Teacher Workflows" : 2
    "Reception" : 2
    "Miscellaneous" : 3
```

---

## Entity Relationship Diagram

### Core Academic Structure

```mermaid
erDiagram
    %% Core Tables
    PROFILES ||--o{ USER_ROLES : has
    PROFILES ||--o| STUDENTS : "is a"
    PROFILES ||--o| TEACHERS : "is a"
    
    ROLES ||--o{ USER_ROLES : assigned
    DEPARTMENTS ||--o{ USER_ROLES : "scoped to"
    
    %% Academic Structure
    DEPARTMENTS ||--o{ COURSES : offers
    DEPARTMENTS ||--o{ STUDENTS : enrolled
    DEPARTMENTS ||--o{ TEACHERS : works_in
    DEPARTMENTS ||--o| TEACHERS : "has HOD"
    
    YEARS ||--o{ SEMESTERS : contains
    SEMESTERS ||--o{ COURSES : "taught in"
    
    YEARS ||--o{ SECTIONS : "has year level"
    DEPARTMENTS ||--o{ SECTIONS : "owns section"
    SECTIONS ||--o{ STUDENTS : "assigned to"
    SECTIONS ||--o| TEACHERS : "has class teacher"
    
    %% Academic Year
    ACADEMIC_YEARS ||--o{ STUDENTS : "enrolled in"
    ACADEMIC_YEARS ||--o{ EXAMS : "conducted in"
    ACADEMIC_YEARS ||--o{ EXTERNAL_MARKS : "results for"
    
    %% Teaching
    TEACHERS ||--o{ TEACHER_COURSES : teaches
    COURSES ||--o{ TEACHER_COURSES : "taught by"
    SECTIONS ||--o{ TEACHER_COURSES : "assigned to"
    
    TEACHERS ||--o{ MENTOR_ASSIGNMENTS : mentors
    STUDENTS ||--o{ MENTOR_ASSIGNMENTS : "mentored by"

    %% Entity Definitions
    PROFILES {
        uuid id PK
        string email UK
        string full_name
        string phone
        enum primary_role
        enum status
        timestamp created_at
    }
    
    USER_ROLES {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        uuid department_id FK
        boolean is_active
    }
    
    ROLES {
        uuid id PK
        string name UK
        string display_name
        enum category
        jsonb permissions
    }
    
    DEPARTMENTS {
        uuid id PK
        string code UK
        string name
        uuid hod_user_id FK
    }
    
    STUDENTS {
        uuid id PK
        uuid user_id FK
        string registration_number UK
        string roll_number
        uuid department_id FK
        uuid section_id FK
        uuid academic_year_id FK
    }
    
    TEACHERS {
        uuid id PK
        uuid user_id FK
        string employee_id UK
        uuid department_id FK
        enum designation
        enum teacher_type
    }
    
    YEARS {
        uuid id PK
        int year_number
        string name
    }
    
    SEMESTERS {
        uuid id PK
        int semester_number
        uuid year_id FK
    }
    
    SECTIONS {
        uuid id PK
        string name
        uuid department_id FK
        uuid year_id FK
        uuid class_teacher_id FK
    }
    
    COURSES {
        uuid id PK
        string code UK
        string name
        uuid department_id FK
        uuid semester_id FK
        enum course_type
        int credits
    }
    
    ACADEMIC_YEARS {
        uuid id PK
        string name
        date start_date
        date end_date
        boolean is_current
    }
```

### Timetable & Attendance Module

```mermaid
erDiagram
    TIMETABLE_ENTRIES ||--o{ ATTENDANCE : "has session"
    TIMETABLE_ENTRIES ||--o{ SUBSTITUTIONS : "may need"
    
    ATTENDANCE ||--o{ ATTENDANCE_RECORDS : contains
    ATTENDANCE_RECORDS }o--|| STUDENTS : "for student"
    
    STUDENTS ||--o{ ATTENDANCE_ALERTS : "receives alert"
    STUDENTS ||--o{ LATE_PASSES : "issued to"
    STUDENTS ||--o{ STUDENT_LEAVE_APPLICATIONS : applies
    
    HOLIDAYS ||--o{ DEPARTMENTS : "applicable to"
    ACADEMIC_YEARS ||--o{ HOLIDAYS : "in year"

    TIMETABLE_ENTRIES {
        uuid id PK
        uuid teacher_course_id FK
        enum day_of_week
        time start_time
        time end_time
        string room_number
        boolean is_active
    }
    
    ATTENDANCE {
        uuid id PK
        uuid timetable_entry_id FK
        date session_date
        enum status
        uuid marked_by FK
        timestamp marked_at
        boolean is_locked
    }
    
    ATTENDANCE_RECORDS {
        uuid id PK
        uuid attendance_id FK
        uuid student_id FK
        enum status
        string remarks
    }
    
    SUBSTITUTIONS {
        uuid id PK
        uuid original_entry_id FK
        uuid substitute_teacher_id FK
        date substitute_date
        enum status
        string reason
    }
    
    ATTENDANCE_ALERTS {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        float attendance_percentage
        timestamp alert_date
    }
    
    LATE_PASSES {
        uuid id PK
        uuid student_id FK
        date pass_date
        time arrival_time
        string reason
        uuid issued_by FK
    }
    
    STUDENT_LEAVE_APPLICATIONS {
        uuid id PK
        uuid student_id FK
        date from_date
        date to_date
        string reason
        enum status
        uuid reviewed_by FK
    }
    
    HOLIDAYS {
        uuid id PK
        string name
        date date
        uuid department_id FK
        uuid academic_year_id FK
    }
```

### Examination Module

```mermaid
erDiagram
    EXAMS ||--o{ EXAM_SCHEDULES : "has schedule"
    EXAM_SCHEDULES ||--o{ EXAM_MARKS : "marks for"
    
    COURSES ||--o{ EXAM_SCHEDULES : "exam for"
    STUDENTS ||--o{ EXAM_MARKS : "obtained by"
    
    STUDENTS ||--o{ EXTERNAL_MARKS : "university results"
    SEMESTERS ||--o{ EXTERNAL_MARKS : "for semester"
    ACADEMIC_YEARS ||--o{ EXTERNAL_MARKS : "in year"

    EXAMS {
        uuid id PK
        string name
        enum exam_type
        uuid academic_year_id FK
        date start_date
        date end_date
        enum status
    }
    
    EXAM_SCHEDULES {
        uuid id PK
        uuid exam_id FK
        uuid course_id FK
        date date
        time start_time
        time end_time
        int max_marks
        string exam_center
    }
    
    EXAM_MARKS {
        uuid id PK
        uuid exam_schedule_id FK
        uuid student_id FK
        float marks_obtained
        boolean is_absent
        string remarks
        uuid entered_by FK
        uuid verified_by FK
        timestamp verified_at
        boolean is_locked
    }
    
    EXTERNAL_MARKS {
        uuid id PK
        uuid student_id FK
        uuid semester_id FK
        uuid academic_year_id FK
        string result_pdf_url
        float sgpa
        float cgpa
        enum upload_status
        uuid verified_by FK
        timestamp verified_at
        string rejection_reason
    }
```

### Assignments Module

```mermaid
erDiagram
    TEACHERS ||--o{ ASSIGNMENTS : creates
    COURSES ||--o{ ASSIGNMENTS : "assignment for"
    SECTIONS ||--o{ ASSIGNMENTS : "assigned to"
    
    ASSIGNMENTS ||--o{ ASSIGNMENT_SUBMISSIONS : receives
    STUDENTS ||--o{ ASSIGNMENT_SUBMISSIONS : submits
    
    TEACHERS ||--o{ TEACHING_MATERIALS : uploads
    COURSES ||--o{ TEACHING_MATERIALS : "material for"

    ASSIGNMENTS {
        uuid id PK
        string title
        text description
        uuid course_id FK
        uuid section_id FK
        uuid teacher_id FK
        date due_date
        int max_marks
        enum status
    }
    
    ASSIGNMENT_SUBMISSIONS {
        uuid id PK
        uuid assignment_id FK
        uuid student_id FK
        text submission_text
        string file_url
        timestamp submitted_at
        float marks_awarded
        text feedback
        uuid graded_by FK
        timestamp graded_at
    }
    
    TEACHING_MATERIALS {
        uuid id PK
        string title
        text description
        uuid course_id FK
        uuid teacher_id FK
        string file_url
        string file_type
        timestamp uploaded_at
    }
```

### Library Module

```mermaid
erDiagram
    BOOKS ||--o{ BOOK_ISSUES : "issued as"
    BOOKS ||--o{ BOOK_RESERVATIONS : "reserved as"
    
    STUDENTS ||--o{ BOOK_ISSUES : borrows
    STUDENTS ||--o{ BOOK_RESERVATIONS : reserves
    
    PROFILES ||--o{ BOOK_ISSUES : "issued by"

    BOOKS {
        uuid id PK
        string isbn UK
        string title
        string author
        string publisher
        int total_copies
        int available_copies
        enum status
    }
    
    BOOK_ISSUES {
        uuid id PK
        uuid book_id FK
        uuid student_id FK
        date issue_date
        date due_date
        date return_date
        uuid issued_by FK
        float fine_amount
        enum status
    }
    
    BOOK_RESERVATIONS {
        uuid id PK
        uuid book_id FK
        uuid student_id FK
        timestamp reservation_date
        enum status
    }
```

### Fees Module

```mermaid
erDiagram
    DEPARTMENTS ||--o{ FEE_STRUCTURES : "has structure"
    YEARS ||--o{ FEE_STRUCTURES : "for year"
    ACADEMIC_YEARS ||--o{ FEE_STRUCTURES : "in year"
    
    FEE_STRUCTURES ||--o{ STUDENT_FEES : "applied to"
    STUDENTS ||--o{ STUDENT_FEES : "pays fee"
    
    STUDENT_FEES ||--o{ FEE_PAYMENTS : "payments for"

    FEE_STRUCTURES {
        uuid id PK
        string name
        uuid department_id FK
        uuid year_id FK
        uuid academic_year_id FK
        decimal amount
        date due_date
        enum fee_type
    }
    
    STUDENT_FEES {
        uuid id PK
        uuid student_id FK
        uuid fee_structure_id FK
        decimal total_amount
        decimal paid_amount
        decimal pending_amount
        enum status
    }
    
    FEE_PAYMENTS {
        uuid id PK
        uuid student_fee_id FK
        decimal amount
        date payment_date
        string payment_mode
        string transaction_id
        uuid received_by FK
    }
```

### Bus Transport Module

```mermaid
erDiagram
    BUS_ROUTES ||--o{ BUS_STOPS : contains
    BUS_ROUTES ||--o{ BUS_VEHICLES : assigned
    BUS_ROUTES ||--o{ BUS_SUBSCRIPTIONS : "subscribed to"
    
    STUDENTS ||--o{ BUS_SUBSCRIPTIONS : subscribes
    BUS_VEHICLES ||--o{ BUS_ALERTS : "alerts for"

    BUS_ROUTES {
        uuid id PK
        string route_name
        string route_number
        decimal fee_per_month
        boolean is_active
    }
    
    BUS_STOPS {
        uuid id PK
        uuid route_id FK
        string stop_name
        int stop_order
        time pickup_time
        time drop_time
    }
    
    BUS_VEHICLES {
        uuid id PK
        string vehicle_number UK
        uuid route_id FK
        int capacity
        uuid driver_id FK
        enum status
    }
    
    BUS_SUBSCRIPTIONS {
        uuid id PK
        uuid student_id FK
        uuid route_id FK
        uuid stop_id FK
        date from_date
        date to_date
        enum status
        uuid approved_by FK
    }
    
    BUS_ALERTS {
        uuid id PK
        uuid vehicle_id FK
        string alert_type
        text message
        timestamp alert_time
    }
```

### Canteen Module

```mermaid
erDiagram
    CANTEEN_MENU_ITEMS ||--o{ CANTEEN_DAILY_MENU : "available in"
    CANTEEN_DAILY_MENU ||--o{ CANTEEN_TOKENS : "ordered from"
    
    STUDENTS ||--o{ CANTEEN_TOKENS : places
    PROFILES ||--o{ CANTEEN_TOKENS : "prepared by"

    CANTEEN_MENU_ITEMS {
        uuid id PK
        string item_name
        string category
        decimal price
        boolean is_available
    }
    
    CANTEEN_DAILY_MENU {
        uuid id PK
        uuid menu_item_id FK
        date available_date
        int quantity_available
        boolean is_active
    }
    
    CANTEEN_TOKENS {
        uuid id PK
        uuid student_id FK
        uuid menu_item_id FK
        int quantity
        decimal total_amount
        timestamp order_time
        enum status
        uuid prepared_by FK
        timestamp ready_time
    }
```

### Communication Module

```mermaid
erDiagram
    PROFILES ||--o{ NOTICES : creates
    DEPARTMENTS ||--o{ NOTICES : "targeted to"
    NOTICES ||--o{ NOTICE_READS : "read by"
    PROFILES ||--o{ NOTICE_READS : reads
    
    PROFILES ||--o{ EVENTS : creates
    EVENTS ||--o{ EVENT_CERTIFICATES : "certificates for"
    STUDENTS ||--o{ EVENT_CERTIFICATES : "awarded to"
    
    PROFILES ||--o{ FEEDBACK : submits
    PROFILES ||--o{ COMPLAINTS : files

    NOTICES {
        uuid id PK
        string title
        text content
        uuid created_by FK
        uuid department_id FK
        enum priority
        timestamp created_at
        boolean is_active
    }
    
    NOTICE_READS {
        uuid id PK
        uuid notice_id FK
        uuid user_id FK
        timestamp read_at
    }
    
    EVENTS {
        uuid id PK
        string title
        text description
        date event_date
        string venue
        uuid created_by FK
        enum status
    }
    
    EVENT_CERTIFICATES {
        uuid id PK
        uuid event_id FK
        uuid student_id FK
        string certificate_url
        timestamp issued_at
    }
    
    FEEDBACK {
        uuid id PK
        uuid user_id FK
        string subject
        text message
        enum category
        timestamp created_at
    }
    
    COMPLAINTS {
        uuid id PK
        uuid user_id FK
        string subject
        text description
        enum status
        uuid resolved_by FK
        timestamp created_at
    }
```

### Teacher Workflow Module

```mermaid
erDiagram
    TEACHERS ||--o{ LESSON_PLANNERS : creates
    COURSES ||--o{ LESSON_PLANNERS : "plan for"
    SECTIONS ||--o{ LESSON_PLANNERS : "targeted at"
    
    TEACHERS ||--o{ WORK_DIARY_ENTRIES : writes
    COURSES ||--o{ WORK_DIARY_ENTRIES : "entry for"
    
    PROFILES ||--o{ LESSON_PLANNERS : "approves L1"
    PROFILES ||--o{ LESSON_PLANNERS : "approves final"
    PROFILES ||--o{ WORK_DIARY_ENTRIES : "approves L1"
    PROFILES ||--o{ WORK_DIARY_ENTRIES : "approves final"

    LESSON_PLANNERS {
        uuid id PK
        uuid teacher_id FK
        uuid course_id FK
        uuid section_id FK
        date from_date
        date to_date
        jsonb units_data
        enum approval_status_l1
        enum approval_status_final
        uuid approved_by_l1 FK
        uuid approved_by_final FK
    }
    
    WORK_DIARY_ENTRIES {
        uuid id PK
        uuid teacher_id FK
        uuid course_id FK
        uuid section_id FK
        date entry_date
        int unit_number
        text topics_covered
        text remarks
        enum approval_status_l1
        enum approval_status_final
        uuid approved_by_l1 FK
        uuid approved_by_final FK
    }
```

### Reception Module

```mermaid
erDiagram
    STUDENTS ||--o{ GATE_PASSES : requests
    PROFILES ||--o{ GATE_PASSES : "approved by"
    PROFILES ||--o{ GATE_PASSES : "issued by"

    GATE_PASSES {
        uuid id PK
        uuid student_id FK
        date pass_date
        time exit_time
        time expected_return
        string reason
        enum status
        uuid approved_by FK
        uuid issued_by FK
        timestamp created_at
    }
```

### Miscellaneous

```mermaid
erDiagram
    STUDENTS ||--o{ STUDENT_MINOR_REGISTRATIONS : registers
    MINOR_SUBJECTS ||--o{ STUDENT_MINOR_REGISTRATIONS : "registered for"
    
    COLLEGE_INFO {
        uuid id PK
        string college_name
        string address
        string phone
        string email
        string logo_url
        jsonb settings
    }
    
    MINOR_SUBJECTS {
        uuid id PK
        string subject_name
        string subject_code
        uuid offering_department_id FK
        int max_students
    }
    
    STUDENT_MINOR_REGISTRATIONS {
        uuid id PK
        uuid student_id FK
        uuid minor_subject_id FK
        uuid academic_year_id FK
        enum status
    }
```

---

## Database Flow Architecture

### Authentication & Authorization Flow

```mermaid
flowchart TD
    A[User Signs Up] --> B{Supabase Auth}
    B --> C[Create auth.users record]
    C --> D[Trigger: handle_new_user]
    D --> E[Create profiles record]
    E --> F[Set primary_role = 'student']
    
    G[User Login] --> H{Supabase Auth}
    H --> I[Get Session]
    I --> J[Fetch Profile]
    J --> K[Query user_roles]
    K --> L[Get Role Permissions]
    L --> M{Check Role}
    M -->|Admin| N[Admin Dashboard]
    M -->|Teacher| O[Teacher Dashboard]
    M -->|Student| P[Student Dashboard]
    
    style B fill:#4CAF50
    style H fill:#4CAF50
    style D fill:#FF9800
    style L fill:#2196F3
```

### Data Access with RLS

```mermaid
flowchart TD
    A[Client Request] --> B{Authenticated?}
    B -->|No| C[Reject: 401]
    B -->|Yes| D[Get User ID]
    D --> E[Query Database]
    E --> F{RLS Policy Check}
    
    F --> G[Check is_admin]
    F --> H[Check is_teacher]
    F --> I[Check is_owner]
    F --> J[Check department_scope]
    
    G -->|True| K[Grant Full Access]
    H -->|True| L[Grant Teacher Scope]
    I -->|True| M[Grant Own Records]
    J -->|True| N[Grant Department Data]
    
    G -->|False| O{Next Policy}
    H -->|False| O
    I -->|False| O
    J -->|False| O
    
    O --> P{Any Policy Passed?}
    P -->|Yes| Q[Return Filtered Data]
    P -->|No| R[Reject: 403]
    
    style B fill:#FF9800
    style F fill:#2196F3
    style K fill:#4CAF50
    style R fill:#F44336
```

### Student Data Access Flow

```mermaid
flowchart LR
    A[Student Login] --> B[Get student_id]
    B --> C[Query Attendance]
    B --> D[Query Marks]
    B --> E[Query Assignments]
    B --> F[Query Fees]
    B --> G[Query Library]
    
    C --> H{RLS Check}
    D --> H
    E --> H
    F --> H
    G --> H
    
    H -->|student_id = auth.uid| I[Return Own Data Only]
    H -->|Different student_id| J[Reject]
    
    style H fill:#2196F3
    style I fill:#4CAF50
    style J fill:#F44336
```

### Admin Data Management Flow

```mermaid
flowchart TD
    A[Admin Action] --> B{Check Permission}
    B -->|No Permission| C[Reject: 403]
    B -->|Has Permission| D{Action Type}
    
    D -->|Create| E[Create Record]
    D -->|Read| F[Query Records]
    D -->|Update| G[Update Record]
    D -->|Delete| H[Delete Record]
    
    E --> I{RLS: is_admin}
    F --> I
    G --> I
    H --> I
    
    I -->|True| J[Execute Query]
    I -->|False| K[Reject]
    
    J --> L[Log to audit_logs]
    L --> M[Return Success]
    
    style B fill:#FF9800
    style I fill:#2196F3
    style J fill:#4CAF50
    style K fill:#F44336
```

### Teacher Workflow: Mark Attendance

```mermaid
flowchart TD
    A[Teacher Opens Class] --> B[Get Timetable Entry]
    B --> C[Check: Is Teacher Assigned?]
    C -->|No| D[Reject: Not Your Class]
    C -->|Yes| E[Create Attendance Session]
    
    E --> F[Get Section Students]
    F --> G[Display Student List]
    G --> H[Mark Present/Absent]
    
    H --> I[Create attendance_records]
    I --> J{Within Lock Window?}
    J -->|Yes| K[Save Records]
    J -->|No| L[Check: Can Override?]
    
    L -->|Admin/HOD| K
    L -->|No Permission| M[Reject: Locked]
    
    K --> N[Update Attendance %]
    N --> O{Below Threshold?}
    O -->|Yes| P[Create attendance_alert]
    O -->|No| Q[Complete]
    
    style C fill:#FF9800
    style J fill:#2196F3
    style L fill:#FF9800
    style K fill:#4CAF50
```

### Exam Marks Entry & Verification

```mermaid
flowchart TD
    A[Teacher Enters Marks] --> B{Is Exam Published?}
    B -->|No| C[Reject: Exam Not Active]
    B -->|Yes| D{Is Course Teacher?}
    
    D -->|No| E[Reject: Not Authorized]
    D -->|Yes| F[Enter Marks]
    
    F --> G[Save to exam_marks]
    G --> H[Status: Pending]
    
    I[Admin/HOD Reviews] --> J{Valid Marks?}
    J -->|No| K[Reject with Reason]
    J -->|Yes| L[Set verified_by]
    
    L --> M[Update verified_at]
    M --> N{Lock Marks?}
    N -->|Yes| O[Set is_locked = true]
    N -->|No| P[Keep Unlocked]
    
    O --> Q[Student Can View]
    P --> Q
    
    style B fill:#FF9800
    style D fill:#FF9800
    style J fill:#2196F3
    style O fill:#4CAF50
```

---

## Row Level Security (RLS) Overview

### RLS Enabled Tables

All tables in the database have RLS enabled for security.

### Common RLS Policies

#### 1. **Self-Access Policy** (profiles, students, teachers)

```sql
-- Users can view their own record
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

#### 2. **Admin Full Access Policy** (all tables)

```sql
-- Admins can perform all operations
CREATE POLICY "Admins full access"
ON [table_name] FOR ALL
USING (is_admin());
```

#### 3. **Teacher Access Policy** (students, attendance, marks)

```sql
-- Teachers can view all students
CREATE POLICY "Teachers can view students"
ON students FOR SELECT
USING (is_teacher());

-- Teachers can mark attendance for their classes
CREATE POLICY "Teachers mark attendance"
ON attendance FOR INSERT
USING (
    is_teacher() AND
    EXISTS (
        SELECT 1 FROM timetable_entries te
        JOIN teacher_courses tc ON te.teacher_course_id = tc.id
        WHERE tc.teacher_id = get_teacher_id(auth.uid())
        AND te.id = timetable_entry_id
    )
);
```

#### 4. **Student Read-Only Policy** (own data)

```sql
-- Students can view their own records
CREATE POLICY "Students view own records"
ON exam_marks FOR SELECT
USING (
    student_id = get_student_id(auth.uid()) AND
    verified_at IS NOT NULL
);

-- Students can view their attendance
CREATE POLICY "Students view own attendance"
ON attendance_records FOR SELECT
USING (student_id = get_student_id(auth.uid()));
```

#### 5. **Department Scope Policy** (department admins)

```sql
-- Department admins can view department students
CREATE POLICY "Dept admin view dept students"
ON students FOR SELECT
USING (
    is_admin() AND
    department_id IN (
        SELECT department_id FROM user_roles
        WHERE user_id = auth.uid()
        AND role_id IN (SELECT id FROM roles WHERE name = 'department_admin')
    )
);
```

### RLS Security Functions

#### is_admin()
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.category IN ('super_admin', 'admin')
        AND ur.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### is_teacher()
```sql
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.category = 'teacher'
        AND ur.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### get_student_id()
```sql
CREATE OR REPLACE FUNCTION get_student_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM students WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### get_teacher_id()
```sql
CREATE OR REPLACE FUNCTION get_teacher_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM teachers WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policy Matrix

| Table | Admin | Teacher | Student | Public |
|-------|-------|---------|---------|--------|
| **profiles** | Full | Read All | Own Only | None |
| **user_roles** | Full | Read Own | Read Own | None |
| **students** | Full | Read All | Own Only | None |
| **teachers** | Full | Read All | Own Only | None |
| **departments** | Full | Read All | Read All | None |
| **courses** | Full | Read All | Read All | None |
| **timetable_entries** | Full | Read + Assigned | Read Own | None |
| **attendance** | Full | CRUD Assigned | Read Own | None |
| **attendance_records** | Full | CRUD Assigned | Read Own | None |
| **exam_marks** | Full | CRUD Assigned | Read Verified | None |
| **external_marks** | Full | Read All | Own Only | None |
| **assignments** | Full | CRUD Own | Read + Submit | None |
| **assignment_submissions** | Full | Read + Grade | Own CRUD | None |
| **teaching_materials** | Full | CRUD Own | Read All | None |
| **books** | Full + Library | Read All | Read All | None |
| **book_issues** | Full + Library | Read All | Own Only | None |
| **fee_structures** | Full + Finance | Read All | Read All | None |
| **student_fees** | Full + Finance | Read All | Own Only | None |
| **fee_payments** | Full + Finance | Read All | Own Only | None |
| **bus_routes** | Full + Bus | Read All | Read All | None |
| **bus_subscriptions** | Full + Bus | Read All | Own CRUD | None |
| **canteen_menu_items** | Full + Canteen | Read All | Read All | None |
| **canteen_tokens** | Full + Canteen | Read + Update | Own CRUD | None |
| **notices** | Full + Create | Create Dept | Read All | None |
| **events** | Full + Create | Read All | Read All | None |
| **lesson_planners** | Full + Approve | Own CRUD | None | None |
| **work_diary_entries** | Full + Approve | Own CRUD | None | None |
| **gate_passes** | Full + Reception | Read All | Own CRUD | None |
| **late_passes** | Full + Reception | Read All | Own Only | None |
| **feedback** | Full | Read All | Own CRUD | None |
| **complaints** | Full | Read All | Own CRUD | None |

### Special RLS Scenarios

#### 1. **Approval Workflows**
```sql
-- HOD can approve level 1
CREATE POLICY "HOD approve L1"
ON lesson_planners FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'hod'
        AND ur.department_id = (
            SELECT department_id FROM teachers
            WHERE id = lesson_planners.teacher_id
        )
    )
)
WITH CHECK (approval_status_l1 IN ('approved', 'rejected'));

-- Principal can approve final
CREATE POLICY "Principal approve final"
ON lesson_planners FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'principal'
    )
)
WITH CHECK (approval_status_final IN ('approved', 'rejected'));
```

#### 2. **Time-Based Locks**
```sql
-- Can only edit attendance within lock window
CREATE POLICY "Edit within lock window"
ON attendance FOR UPDATE
USING (
    (is_admin() OR is_teacher()) AND
    (is_locked = false OR is_admin())
);
```

#### 3. **Department-Scoped Access**
```sql
-- Department admin can only manage own department
CREATE POLICY "Dept admin dept scope"
ON students FOR ALL
USING (
    is_admin() AND
    (
        is_super_admin() OR
        department_id IN (
            SELECT department_id FROM user_roles
            WHERE user_id = auth.uid()
        )
    )
);
```

---

## Table Relationships

### Foreign Key Summary

| Child Table | Parent Table | Relationship | Constraint |
|-------------|--------------|--------------|------------|
| user_roles | profiles | Many-to-One | ON DELETE CASCADE |
| user_roles | roles | Many-to-One | ON DELETE CASCADE |
| user_roles | departments | Many-to-One | ON DELETE SET NULL |
| students | profiles | One-to-One | ON DELETE CASCADE |
| students | departments | Many-to-One | ON DELETE SET NULL |
| students | sections | Many-to-One | ON DELETE SET NULL |
| students | academic_years | Many-to-One | ON DELETE SET NULL |
| teachers | profiles | One-to-One | ON DELETE CASCADE |
| teachers | departments | Many-to-One | ON DELETE SET NULL |
| sections | departments | Many-to-One | ON DELETE CASCADE |
| sections | years | Many-to-One | ON DELETE CASCADE |
| sections | teachers | Many-to-One (class_teacher) | ON DELETE SET NULL |
| courses | departments | Many-to-One | ON DELETE CASCADE |
| courses | semesters | Many-to-One | ON DELETE CASCADE |
| teacher_courses | teachers | Many-to-One | ON DELETE CASCADE |
| teacher_courses | courses | Many-to-One | ON DELETE CASCADE |
| teacher_courses | sections | Many-to-One | ON DELETE CASCADE |
| timetable_entries | teacher_courses | Many-to-One | ON DELETE CASCADE |
| attendance | timetable_entries | Many-to-One | ON DELETE CASCADE |
| attendance_records | attendance | Many-to-One | ON DELETE CASCADE |
| attendance_records | students | Many-to-One | ON DELETE CASCADE |
| exam_schedules | exams | Many-to-One | ON DELETE CASCADE |
| exam_schedules | courses | Many-to-One | ON DELETE CASCADE |
| exam_marks | exam_schedules | Many-to-One | ON DELETE CASCADE |
| exam_marks | students | Many-to-One | ON DELETE CASCADE |
| external_marks | students | Many-to-One | ON DELETE CASCADE |
| assignments | teachers | Many-to-One | ON DELETE CASCADE |
| assignments | courses | Many-to-One | ON DELETE CASCADE |
| assignment_submissions | assignments | Many-to-One | ON DELETE CASCADE |
| assignment_submissions | students | Many-to-One | ON DELETE CASCADE |
| book_issues | books | Many-to-One | ON DELETE CASCADE |
| book_issues | students | Many-to-One | ON DELETE CASCADE |
| student_fees | students | Many-to-One | ON DELETE CASCADE |
| student_fees | fee_structures | Many-to-One | ON DELETE CASCADE |
| fee_payments | student_fees | Many-to-One | ON DELETE CASCADE |
| bus_subscriptions | students | Many-to-One | ON DELETE CASCADE |
| bus_subscriptions | bus_routes | Many-to-One | ON DELETE CASCADE |
| canteen_tokens | students | Many-to-One | ON DELETE CASCADE |
| canteen_tokens | canteen_menu_items | Many-to-One | ON DELETE CASCADE |

### Index Strategy

Key indexes for performance:

```sql
-- User lookup
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Student lookups
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_registration ON students(registration_number);
CREATE INDEX idx_students_section ON students(section_id);

-- Teacher lookups
CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_department ON teachers(department_id);
CREATE INDEX idx_teacher_courses_teacher ON teacher_courses(teacher_id);

-- Attendance queries
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_attendance ON attendance_records(attendance_id);
CREATE INDEX idx_attendance_date ON attendance(session_date);

-- Exam marks
CREATE INDEX idx_exam_marks_student ON exam_marks(student_id);
CREATE INDEX idx_exam_marks_schedule ON exam_marks(exam_schedule_id);

-- Assignments
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
```

---

## Security Functions

### Complete Function List

| Function | Purpose | Security Level |
|----------|---------|----------------|
| `is_admin()` | Check if user has admin role | SECURITY DEFINER |
| `is_teacher()` | Check if user has teacher role | SECURITY DEFINER |
| `is_super_admin()` | Check if user is super admin | SECURITY DEFINER |
| `get_student_id(uuid)` | Get student ID from user ID | SECURITY DEFINER |
| `get_teacher_id(uuid)` | Get teacher ID from user ID | SECURITY DEFINER |
| `get_user_roles(uuid)` | Get all roles for user | SECURITY DEFINER |
| `get_current_academic_year()` | Get active academic year | SECURITY DEFINER |
| `handle_new_user()` | Auto-create profile on signup | SECURITY DEFINER |
| `update_updated_at()` | Auto-update timestamps | SECURITY DEFINER |

### Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| on_auth_user_created | auth.users | INSERT | handle_new_user() |
| update_profiles_updated_at | profiles | UPDATE | update_updated_at() |
| update_students_updated_at | students | UPDATE | update_updated_at() |
| update_teachers_updated_at | teachers | UPDATE | update_updated_at() |

---

## Database Statistics

| Metric | Count |
|--------|-------|
| Total Tables | 42 |
| Total Views | 0 |
| Total Functions | 9 |
| Total Triggers | 4+ |
| Total Indexes | 50+ |
| Total RLS Policies | 150+ |
| Storage Buckets | 4 |

---

## Notes

1. **RLS is Mandatory**: All tables have RLS enabled with no exceptions
2. **Audit Trail**: Consider adding audit_logs table for tracking changes
3. **Soft Deletes**: Most tables use status fields rather than hard deletes
4. **Timestamps**: All tables have created_at and updated_at
5. **UUIDs**: All primary keys use UUID type for security
6. **Cascading**: Carefully designed CASCADE and SET NULL rules
7. **Performance**: Strategic indexes on frequently queried columns

---

*Generated: 2026-01-13*
