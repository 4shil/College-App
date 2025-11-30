# 🔴 ASH's VIBE GUIDE
## Role: Master / System Architect
## Target: 5-7 tables + RLS per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **Database Design** - All SQL schema & migrations
2. **Supabase Setup** - Auth, Storage, RLS policies
3. **Security** - RLS, triggers, audit logging
4. **DevOps** - Production setup, backups

---

# WEEK 1: FOUNDATION BLITZ

## Day 1 - Core Auth + Academic
```sql
-- Run all these TODAY

-- 1. Profiles Extension
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  phone VARCHAR(15),
  address TEXT,
  date_of_birth DATE,
  gender VARCHAR(10),
  photo_url TEXT;

-- 2. Roles (14 total)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(20) NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, category) VALUES
  ('super_admin', 'admin'), ('principal', 'admin'),
  ('department_admin', 'admin'), ('hod', 'admin'),
  ('exam_cell_admin', 'admin'), ('library_admin', 'admin'),
  ('bus_admin', 'admin'), ('canteen_admin', 'admin'),
  ('finance_admin', 'admin'), ('teacher', 'teacher'),
  ('coordinator', 'teacher'), ('class_teacher', 'teacher'),
  ('mentor', 'teacher'), ('student', 'student');

-- 3. User Roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  department_id UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, department_id)
);

-- 4. Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(10) NOT NULL,
  hod_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(20) NOT NULL,
  duration_years INT DEFAULT 3,
  total_semesters INT DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for all 5 tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Admin can read all
CREATE POLICY "Admin read all" ON roles FOR SELECT USING (true);
CREATE POLICY "Admin read all" ON user_roles FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id WHERE r.category = 'admin'));
```

## Day 2 - Students + Teachers + Subjects
```sql
-- 1. Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id),
  enrollment_number VARCHAR(20) UNIQUE,
  roll_number VARCHAR(10),
  course_id UUID REFERENCES courses(id),
  department_id UUID REFERENCES departments(id),
  current_semester INT DEFAULT 1,
  division VARCHAR(5),
  admission_year INT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teachers
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id),
  employee_id VARCHAR(20) UNIQUE,
  department_id UUID REFERENCES departments(id),
  designation VARCHAR(50),
  qualification TEXT,
  joining_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  code VARCHAR(20) UNIQUE,
  name VARCHAR(100) NOT NULL,
  credits INT DEFAULT 3,
  subject_type VARCHAR(20) DEFAULT 'theory',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Semesters
CREATE TABLE semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  semester_number INT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT false,
  UNIQUE(course_id, semester_number)
);

-- Storage Buckets (do in Supabase dashboard)
-- profile-photos, teaching-materials, submissions

-- Seed test users
INSERT INTO profiles (id, email, full_name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@jpm.edu', 'Super Admin'),
  ('22222222-2222-2222-2222-222222222222', 'teacher@jpm.edu', 'Test Teacher'),
  ('33333333-3333-3333-3333-333333333333', 'student@jpm.edu', 'Test Student');
```

## Day 3 - Timetable + Attendance + Notices
```sql
-- 1. Timetable Master
CREATE TABLE timetable_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  division VARCHAR(5),
  academic_year VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Periods
CREATE TABLE periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID REFERENCES timetable_master(id),
  day_of_week INT, -- 1=Mon, 7=Sun
  period_number INT,
  start_time TIME,
  end_time TIME,
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES teachers(id),
  room VARCHAR(20),
  UNIQUE(timetable_id, day_of_week, period_number)
);

-- 3. Attendance Sessions
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID REFERENCES periods(id),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  session_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Attendance Records
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  student_id UUID REFERENCES students(id),
  status VARCHAR(5) DEFAULT 'P', -- P/A/L
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- 5. Notices
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  target_audience JSONB, -- {roles: [], departments: []}
  published_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  venue VARCHAR(100),
  organizer VARCHAR(100),
  external_link TEXT,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Day 4 - Materials + Assignments + Exams
```sql
-- 1. Teaching Materials
CREATE TABLE teaching_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type VARCHAR(50),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_marks NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id),
  student_id UUID REFERENCES students(id),
  file_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  marks_obtained NUMERIC(5,2),
  feedback TEXT,
  graded_by UUID REFERENCES teachers(id),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- 4. Exams
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50), -- internal/external/practical
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Exam Schedule
CREATE TABLE exam_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id),
  subject_id UUID REFERENCES subjects(id),
  exam_date DATE,
  start_time TIME,
  end_time TIME,
  room VARCHAR(50),
  max_marks NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Day 5 - Library + Bus + Marks
```sql
-- 1. Books
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  author VARCHAR(200),
  isbn VARCHAR(20) UNIQUE,
  publisher VARCHAR(100),
  category VARCHAR(50),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Book Issues
CREATE TABLE book_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id),
  student_id UUID REFERENCES students(id),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  return_date DATE,
  fine_amount NUMERIC(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'issued'
);

-- 3. Bus Routes
CREATE TABLE bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 4. Bus Stops
CREATE TABLE bus_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES bus_routes(id),
  stop_name VARCHAR(100) NOT NULL,
  stop_order INT,
  arrival_time TIME,
  fee NUMERIC(10,2)
);

-- 5. Bus Subscriptions
CREATE TABLE bus_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  route_id UUID REFERENCES bus_routes(id),
  stop_id UUID REFERENCES bus_stops(id),
  academic_year VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ
);

-- 6. Internal Marks
CREATE TABLE internal_marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_schedule_id UUID REFERENCES exam_schedule(id),
  student_id UUID REFERENCES students(id),
  teacher_id UUID REFERENCES teachers(id),
  marks_obtained NUMERIC(5,2),
  is_absent BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_schedule_id, student_id)
);

-- 7. External Uploads
CREATE TABLE external_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  subject_id UUID REFERENCES subjects(id),
  semester_number INT,
  file_url TEXT,
  marks_obtained NUMERIC(5,2),
  status VARCHAR(20) DEFAULT 'pending',
  verified_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# WEEK 2: CANTEEN + FEES + TEACHER TABLES

## Day 6 - Canteen + Fees + Settings
```sql
-- 1. Menu Items
CREATE TABLE canteen_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  price NUMERIC(10,2) NOT NULL,
  available_quantity INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  available_days JSONB DEFAULT '{"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true}'
);

-- 2. Tokens
CREATE TABLE canteen_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  token_number VARCHAR(20) UNIQUE,
  total_amount NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- pending/preparing/ready/collected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Token Items
CREATE TABLE token_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES canteen_tokens(id),
  menu_item_id UUID REFERENCES canteen_menu_items(id),
  quantity INT DEFAULT 1,
  price NUMERIC(10,2)
);

-- 4. Fees Structure
CREATE TABLE fees_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  fee_type VARCHAR(50),
  amount NUMERIC(10,2),
  semester_number INT,
  academic_year VARCHAR(10)
);

-- 5. Fee Payments
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  fees_structure_id UUID REFERENCES fees_structure(id),
  amount_paid NUMERIC(10,2),
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50)
);

-- 6. App Settings
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB,
  category VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Day 7 - Honors + Teacher Tables
```sql
-- 1. Honors/Minor Programs
CREATE TABLE honors_minor_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20), -- honors/minor
  department_id UUID REFERENCES departments(id),
  description TEXT,
  eligibility_criteria TEXT,
  total_seats INT,
  filled_seats INT DEFAULT 0,
  is_accepting_applications BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active'
);

-- 2. Enrollments
CREATE TABLE honors_minor_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  program_id UUID REFERENCES honors_minor_programs(id),
  status VARCHAR(20) DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_id)
);

-- 3. Lesson Plans
CREATE TABLE lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  topic VARCHAR(200),
  objectives TEXT,
  content_outline TEXT,
  planned_date DATE,
  actual_date DATE,
  status VARCHAR(20) DEFAULT 'planned'
);

-- 4. Teacher Diary
CREATE TABLE teacher_diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  date DATE DEFAULT CURRENT_DATE,
  period_number INT,
  topic_covered TEXT,
  homework_assigned TEXT,
  remarks TEXT
);

-- 5. Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  category VARCHAR(50),
  subject VARCHAR(200),
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending',
  response TEXT,
  responded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Student Settings
CREATE TABLE student_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE REFERENCES students(id),
  notification_attendance BOOLEAN DEFAULT true,
  notification_assignments BOOLEAN DEFAULT true,
  notification_exams BOOLEAN DEFAULT true,
  notification_announcements BOOLEAN DEFAULT true
);
```

## Day 8 - Teacher Link Tables + RLS
```sql
-- 1. Teacher Subjects
CREATE TABLE teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  subject_id UUID REFERENCES subjects(id),
  academic_year VARCHAR(10),
  UNIQUE(teacher_id, subject_id, academic_year)
);

-- 2. Teacher Classes
CREATE TABLE teacher_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  course_id UUID REFERENCES courses(id),
  semester_number INT,
  division VARCHAR(5),
  role VARCHAR(50), -- subject_teacher/class_teacher/mentor
  academic_year VARCHAR(10)
);

-- ALL RLS POLICIES
-- Helper function
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = role_name
  );
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.category = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Enable RLS on all tables
DO $$ 
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Admin read all policy for each table
-- (Apply selectively based on needs)
```

## Day 9 - Triggers + Storage
```sql
-- Token number generator
CREATE OR REPLACE FUNCTION generate_token_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.token_number := 'TKN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(
    (SELECT COALESCE(MAX(SUBSTRING(token_number FROM 12)::INT), 0) + 1 
     FROM canteen_tokens WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_token_number
  BEFORE INSERT ON canteen_tokens
  FOR EACH ROW EXECUTE FUNCTION generate_token_number();

-- Auto create student settings
CREATE OR REPLACE FUNCTION create_student_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_settings (student_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_student_settings
  AFTER INSERT ON students
  FOR EACH ROW EXECUTE FUNCTION create_student_settings();
```

## Day 10 - Full RLS Review
- Test all policies
- Fix security issues
- Document policies

---

# WEEK 3-4: ROLE-SPECIFIC RLS + FINAL

## Days 11-15: Teacher & Student RLS
- Teacher can only see their classes/subjects
- Student can only see their own data
- HoD can see department data
- Coordinator can see exam data

## Days 16-20: Polish + Production
- Audit logging triggers
- Performance indexes
- Production Supabase setup

---

# ✅ DAILY CHECKLIST

## Each Day
- [ ] Create tables in migration file
- [ ] Add RLS policies
- [ ] Test with different roles
- [ ] Commit and push
- [ ] Update Hasura tracking (notify Abin)

## Storage Buckets (Day 2)
- [ ] profile-photos (public read)
- [ ] teaching-materials (authenticated read)
- [ ] submissions (authenticated read)
- [ ] external-uploads (authenticated read)

---

*Vibe Coder Ash - Ship 5+ tables daily! 🚀*
