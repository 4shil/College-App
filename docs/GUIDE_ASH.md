# 🔴 ASH's DEVELOPMENT GUIDE
## Role: Master / System Architect

---

## 🎯 YOUR RESPONSIBILITIES

1. **Database Design & Migrations** - All SQL schema
2. **Supabase Setup** - Auth, Storage, RLS policies
3. **Hasura Configuration** - Permissions, relationships
4. **Security** - RLS, API security, audit logging
5. **Code Review** - All PRs for DB/Auth/Security
6. **Architecture Decisions** - Technical leadership

---

## 📅 YOUR TIMELINE

### PHASE 2 (Week 3-4): Database Foundation

#### Week 3: Core Tables
```sql
-- Migration: 20241201_core_tables.sql

-- 1. Extended Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  phone VARCHAR(15),
  address TEXT,
  date_of_birth DATE,
  gender VARCHAR(10),
  blood_group VARCHAR(5),
  emergency_contact VARCHAR(15),
  photo_url TEXT;

-- 2. Roles Table (9 Admin + 5 Teacher)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(20) NOT NULL, -- admin/teacher/student
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all roles
INSERT INTO roles (name, category, description) VALUES
  ('super_admin', 'admin', 'Full system access'),
  ('principal', 'admin', 'Academic top authority'),
  ('department_admin', 'admin', 'Department management'),
  ('hod', 'admin', 'Head of Department'),
  ('exam_cell_admin', 'admin', 'Exam management'),
  ('library_admin', 'admin', 'Library management'),
  ('bus_admin', 'admin', 'Transport management'),
  ('canteen_admin', 'admin', 'Canteen management'),
  ('finance_admin', 'admin', 'Fee management'),
  ('subject_teacher', 'teacher', 'Base teacher role'),
  ('class_teacher', 'teacher', 'Class in-charge'),
  ('mentor', 'teacher', 'Student mentor'),
  ('coordinator', 'teacher', 'Substitution coordinator'),
  ('student', 'student', 'Regular student');

-- 3. User Roles (Many-to-Many)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  department_id UUID, -- Scope for dept-specific roles
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(user_id, role_id, department_id)
);

-- 4. Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(10) NOT NULL,
  hod_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20) NOT NULL,
  department_id UUID REFERENCES departments(id),
  duration_years INT DEFAULT 3,
  total_semesters INT DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Academic Years
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_name VARCHAR(20) NOT NULL, -- "2024-25"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Semesters
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES academic_years(id),
  semester_number INT NOT NULL,
  name VARCHAR(50) NOT NULL, -- "Semester 1"
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false
);

-- 8. Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  credits INT DEFAULT 3,
  is_lab BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Week 3: Academic Tables
```sql
-- Migration: 20241202_academic_tables.sql

-- 1. Students (Extended)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) UNIQUE,
  enrollment_number VARCHAR(30) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  course_id UUID REFERENCES courses(id),
  current_semester INT DEFAULT 1,
  current_year INT DEFAULT 1,
  division VARCHAR(5),
  roll_number VARCHAR(10),
  admission_year INT,
  admission_date DATE,
  status VARCHAR(20) DEFAULT 'active', -- active/blocked/graduated
  bus_subscription_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teachers (Extended)
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) UNIQUE,
  employee_id VARCHAR(30) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  designation VARCHAR(50),
  qualification TEXT,
  experience_years INT,
  specialization TEXT,
  joining_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Teacher-Subject Mapping
CREATE TABLE teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  academic_year_id UUID REFERENCES academic_years(id),
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, subject_id, academic_year_id)
);

-- 4. Teacher-Class Mapping (for Class Teachers)
CREATE TABLE teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  division VARCHAR(5),
  academic_year_id UUID REFERENCES academic_years(id),
  role VARCHAR(20) DEFAULT 'class_teacher',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, semester_number, division, academic_year_id)
);

-- 5. Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  building VARCHAR(50),
  floor INT,
  capacity INT,
  room_type VARCHAR(20), -- classroom/lab/hall
  is_active BOOLEAN DEFAULT true
);

-- 6. Timetable Master
CREATE TABLE timetable_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID REFERENCES academic_years(id),
  semester_id UUID REFERENCES semesters(id),
  course_id UUID REFERENCES courses(id),
  division VARCHAR(5),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Periods
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES timetable_master(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 1=Monday, 7=Sunday
  period_number INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES teachers(id),
  room_id UUID REFERENCES rooms(id),
  is_break BOOLEAN DEFAULT false,
  break_name VARCHAR(50), -- "Lunch Break"
  UNIQUE(timetable_id, day_of_week, period_number)
);
```

#### Week 4: RLS Policies
```sql
-- Migration: 20241203_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user has role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN has_role('super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if any admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.category = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read all, update own
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (is_super_admin());

-- Students: Admins see all, students see own
CREATE POLICY "students_admin_all" ON students
  FOR ALL USING (is_admin());

CREATE POLICY "students_own" ON students
  FOR SELECT USING (profile_id = auth.uid());

-- Teachers: Admins see all, teachers see own
CREATE POLICY "teachers_admin_all" ON teachers
  FOR ALL USING (is_admin());

CREATE POLICY "teachers_own" ON teachers
  FOR SELECT USING (profile_id = auth.uid());

-- Departments: All can read, admins can write
CREATE POLICY "departments_read" ON departments
  FOR SELECT USING (true);

CREATE POLICY "departments_write" ON departments
  FOR ALL USING (is_super_admin() OR has_role('principal'));
```

---

### PHASE 3 (Week 5-6): Exam & Notice Tables

```sql
-- Migration: 20241205_exam_tables.sql

-- 1. Exams
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  exam_type VARCHAR(20) NOT NULL, -- internal/model/university
  academic_year_id UUID REFERENCES academic_years(id),
  semester_id UUID REFERENCES semesters(id),
  start_date DATE,
  end_date DATE,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Exam Schedules
CREATE TABLE exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  room_id UUID REFERENCES rooms(id),
  max_marks INT DEFAULT 100,
  passing_marks INT DEFAULT 40,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Internal Marks (Teacher uploads)
CREATE TABLE internal_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_schedule_id UUID REFERENCES exam_schedules(id),
  student_id UUID REFERENCES students(id),
  teacher_id UUID REFERENCES teachers(id),
  marks_obtained DECIMAL(5,2),
  is_absent BOOLEAN DEFAULT false,
  remarks TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_schedule_id, student_id)
);

-- 4. External Uploads (Student uploads)
CREATE TABLE external_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  exam_id UUID REFERENCES exams(id),
  subject_id UUID REFERENCES subjects(id),
  file_url TEXT NOT NULL,
  file_type VARCHAR(20), -- pdf/image
  marks_obtained DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending/verified/rejected
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: 20241206_notices_tables.sql

-- 1. Notices
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  notice_type VARCHAR(20) DEFAULT 'general', -- general/academic/exam/event
  audience VARCHAR(20) DEFAULT 'all', -- all/students/teachers/department
  department_id UUID REFERENCES departments(id), -- if dept specific
  course_id UUID REFERENCES courses(id), -- if course specific
  semester_number INT, -- if semester specific
  priority VARCHAR(10) DEFAULT 'normal', -- low/normal/high/urgent
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ, -- for scheduled publishing
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Notice Attachments
CREATE TABLE notice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(200),
  file_type VARCHAR(50),
  file_size INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notice Reads (Track who read)
CREATE TABLE notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notice_id, user_id)
);
```

---

### PHASE 4-5 (Week 7-10): Teacher Tables

```sql
-- Migration: 20241210_attendance_tables.sql

-- 1. Attendance Sessions
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  period_id UUID REFERENCES periods(id),
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  division VARCHAR(5),
  session_date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT false,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance Records
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  status VARCHAR(10) NOT NULL, -- P/A/L (Present/Absent/Leave)
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  marked_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Migration: 20241212_materials_assignments.sql

-- 1. Teaching Materials
CREATE TABLE teaching_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  course_id UUID REFERENCES courses(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  material_type VARCHAR(20), -- notes/pdf/ppt/video/link/syllabus
  file_url TEXT,
  external_link TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  division VARCHAR(5),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  instructions TEXT,
  max_marks INT DEFAULT 10,
  due_date TIMESTAMPTZ NOT NULL,
  allow_late BOOLEAN DEFAULT false,
  late_penalty_percent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Assignment Files
CREATE TABLE assignment_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(200),
  file_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES students(id),
  file_url TEXT,
  submission_text TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_late BOOLEAN DEFAULT false,
  marks_obtained DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES teachers(id),
  UNIQUE(assignment_id, student_id)
);

-- Migration: 20241215_planner_diary.sql

-- 1. Lesson Planners
CREATE TABLE lesson_planners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  academic_year_id UUID REFERENCES academic_years(id),
  semester_id UUID REFERENCES semesters(id),
  syllabus_file_url TEXT,
  status VARCHAR(20) DEFAULT 'draft', -- draft/submitted/hod_approved/principal_approved/rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Planner Topics
CREATE TABLE planner_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID REFERENCES lesson_planners(id) ON DELETE CASCADE,
  week_number INT NOT NULL,
  topic_name VARCHAR(200) NOT NULL,
  learning_objectives TEXT,
  planned_hours INT DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  order_index INT DEFAULT 0
);

-- 3. Planner Approvals
CREATE TABLE planner_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID REFERENCES lesson_planners(id),
  approver_id UUID REFERENCES profiles(id),
  approval_level VARCHAR(20), -- hod/principal
  status VARCHAR(20), -- approved/rejected
  comments TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Work Diaries
CREATE TABLE work_diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  month INT NOT NULL,
  year INT NOT NULL,
  total_working_days INT DEFAULT 0,
  total_periods INT DEFAULT 0,
  od_count INT DEFAULT 0,
  leave_count INT DEFAULT 0,
  dl_count INT DEFAULT 0,
  extra_class_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, month, year)
);

-- 5. Diary Entries
CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES work_diaries(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  periods_taken INT DEFAULT 0,
  topics_covered TEXT,
  category VARCHAR(20) DEFAULT 'regular', -- regular/od/leave/dl/extra
  remarks TEXT
);

-- 6. Diary Approvals
CREATE TABLE diary_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID REFERENCES work_diaries(id),
  approver_id UUID REFERENCES profiles(id),
  approval_level VARCHAR(20),
  status VARCHAR(20),
  comments TEXT,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Substitutions
CREATE TABLE substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_teacher_id UUID REFERENCES teachers(id),
  substitute_teacher_id UUID REFERENCES teachers(id),
  period_id UUID REFERENCES periods(id),
  substitution_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending/accepted/rejected/completed
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Mentor Assignments
CREATE TABLE mentor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  academic_year_id UUID REFERENCES academic_years(id),
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, academic_year_id)
);

-- 9. Counselling Notes
CREATE TABLE counselling_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID REFERENCES teachers(id),
  student_id UUID REFERENCES students(id),
  note TEXT NOT NULL,
  meeting_date DATE,
  follow_up_date DATE,
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### PHASE 7 (Week 13-14): Utility Tables

```sql
-- Migration: 20241220_library_tables.sql

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  author VARCHAR(200),
  isbn VARCHAR(20),
  publisher VARCHAR(100),
  edition VARCHAR(50),
  category VARCHAR(50),
  department_id UUID REFERENCES departments(id),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  shelf_location VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE book_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id),
  student_id UUID REFERENCES students(id),
  issued_by UUID REFERENCES profiles(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE NOT NULL,
  returned_at TIMESTAMPTZ,
  returned_to UUID REFERENCES profiles(id),
  is_renewed BOOLEAN DEFAULT false,
  renewal_count INT DEFAULT 0,
  fine_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'issued' -- issued/returned/overdue
);

CREATE TABLE book_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id),
  student_id UUID REFERENCES students(id),
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'waiting' -- waiting/notified/fulfilled/expired
);

-- Migration: 20241221_canteen_tables.sql

CREATE TABLE canteen_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(30), -- breakfast/lunch/snacks/beverages
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_sold_out BOOLEAN DEFAULT false,
  available_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE canteen_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number INT NOT NULL,
  token_date DATE NOT NULL DEFAULT CURRENT_DATE,
  student_id UUID REFERENCES students(id),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending/ready/collected/refunded
  order_time TIMESTAMPTZ DEFAULT NOW(),
  ready_time TIMESTAMPTZ,
  collected_time TIMESTAMPTZ,
  UNIQUE(token_number, token_date)
);

CREATE TABLE canteen_token_counter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_date DATE UNIQUE DEFAULT CURRENT_DATE,
  last_token_number INT DEFAULT 0
);

-- Migration: 20241222_bus_tables.sql

CREATE TABLE bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name VARCHAR(100) NOT NULL,
  route_number VARCHAR(20),
  start_point VARCHAR(100),
  end_point VARCHAR(100),
  departure_time TIME,
  arrival_time TIME,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE bus_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES bus_routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(100) NOT NULL,
  stop_order INT NOT NULL,
  arrival_time TIME,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);

CREATE TABLE bus_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  route_id UUID REFERENCES bus_routes(id),
  stop_id UUID REFERENCES bus_stops(id),
  academic_year_id UUID REFERENCES academic_years(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: 20241223_fee_tables.sql

CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  course_id UUID REFERENCES courses(id),
  academic_year_id UUID REFERENCES academic_years(id),
  semester_number INT,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  fee_type VARCHAR(30), -- tuition/exam/library/lab/misc
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  fee_structure_id UUID REFERENCES fee_structures(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method VARCHAR(30), -- online/cash/cheque
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50),
  receipt_url TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending/verified/rejected
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ
);
```

---

### PHASE 8 (Week 15-16): Remaining Tables

```sql
-- Migration: 20241225_feedback_tables.sql

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  feedback_type VARCHAR(20), -- teacher/college/course
  target_id UUID, -- teacher_id for teacher feedback
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  semester_id UUID REFERENCES semesters(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(20) UNIQUE,
  student_id UUID REFERENCES students(id),
  category VARCHAR(30),
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  assigned_to UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: 20241226_events_settings.sql

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(30),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(200),
  poster_url TEXT,
  external_link TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  certificate_template_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE minor_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20),
  department_id UUID REFERENCES departments(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  selection_open BOOLEAN DEFAULT false
);

CREATE TABLE minor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  minor_program_id UUID REFERENCES minor_programs(id),
  academic_year_id UUID REFERENCES academic_years(id),
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  remarks TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) UNIQUE,
  theme VARCHAR(10) DEFAULT 'system',
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 STORAGE BUCKETS SETUP

```sql
-- Create storage buckets via Supabase Dashboard or SQL

-- 1. Profile Photos (public read)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- 2. Teaching Materials (authenticated)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', false);

-- 3. Submissions (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', false);

-- 4. External Marks (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('external-marks', 'external-marks', false);

-- 5. Notices (public read)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('notices', 'notices', true);

-- 6. Events (public read)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('events', 'events', true);

-- Storage policies
CREATE POLICY "Avatar read" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Avatar upload own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Materials read authenticated" ON storage.objects FOR SELECT
  USING (bucket_id = 'materials' AND auth.role() = 'authenticated');

CREATE POLICY "Materials upload teacher" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'materials' AND has_role('subject_teacher'));
```

---

## ✅ YOUR CHECKLIST

### Week 3-4
- [ ] Migration: 20241201_core_tables.sql
- [ ] Migration: 20241202_academic_tables.sql
- [ ] Migration: 20241203_rls_policies.sql
- [ ] Test RLS with different roles
- [ ] Hasura tracking (verify Abin's work)

### Week 5-6
- [ ] Migration: 20241205_exam_tables.sql
- [ ] Migration: 20241206_notices_tables.sql
- [ ] Migration: 20241207_settings_tables.sql
- [ ] RLS for exam/notice tables

### Week 7-10
- [ ] Migration: 20241210_attendance_tables.sql
- [ ] Migration: 20241212_materials_assignments.sql
- [ ] Migration: 20241215_planner_diary.sql
- [ ] Storage buckets setup
- [ ] RLS for all teacher tables

### Week 13-16
- [ ] Migration: 20241220_library_tables.sql
- [ ] Migration: 20241221_canteen_tables.sql
- [ ] Migration: 20241222_bus_tables.sql
- [ ] Migration: 20241223_fee_tables.sql
- [ ] Migration: 20241225_feedback_tables.sql
- [ ] Migration: 20241226_events_settings.sql
- [ ] All storage policies

### Week 17-20
- [ ] Security audit
- [ ] Performance optimization (indexes)
- [ ] Production deployment
- [ ] CI/CD pipeline

---

## 🚨 CRITICAL REMINDERS

1. **Always test RLS** before marking migration complete
2. **Coordinate with Abin** for Hasura tracking after each migration
3. **Generate types** after each migration: `npm run gen:types`
4. **Review all PRs** related to DB, Auth, Security
5. **Document breaking changes** in migration comments

---

*Guide for Ash - Last Updated: November 30, 2025*
