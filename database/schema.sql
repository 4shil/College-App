-- ============================================
-- JPM COLLEGE APP - DATABASE SCHEMA
-- Version: 1.0
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ENUMS (Custom Types)
-- ============================================

-- User status
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'graduated', 'dropout');

-- Gender
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');

-- Teacher type
CREATE TYPE teacher_type AS ENUM ('full_time', 'part_time', 'visiting', 'guest', 'lab_assistant');

-- Teacher designation
CREATE TYPE teacher_designation AS ENUM ('professor', 'associate_professor', 'assistant_professor', 'lecturer', 'lab_instructor');

-- Course type
CREATE TYPE course_type AS ENUM ('core', 'elective', 'open_elective', 'lab', 'mandatory', 'major', 'minor');

-- ============================================
-- 2. ROLES TABLE
-- ============================================

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('admin', 'teacher', 'student')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, category) VALUES
-- Admin roles
('super_admin', 'Super Admin', 'Full system access', 'admin'),
('principal', 'Principal', 'Principal of the college', 'admin'),
('department_admin', 'Department Admin', 'Department level admin', 'admin'),
('hod', 'Head of Department', 'Head of a department', 'admin'),
('exam_cell_admin', 'Exam Cell Admin', 'Manages exams and results', 'admin'),
('library_admin', 'Library Admin', 'Manages library', 'admin'),
('bus_admin', 'Bus Admin', 'Manages transportation', 'admin'),
('canteen_admin', 'Canteen Admin', 'Manages canteen', 'admin'),
('finance_admin', 'Finance Admin', 'Manages fees and finances', 'admin'),
-- Teacher roles
('subject_teacher', 'Subject Teacher', 'Teaches subjects', 'teacher'),
('class_teacher', 'Class Teacher', 'In-charge of a class/section', 'teacher'),
('mentor', 'Mentor', 'Mentors students', 'teacher'),
('coordinator', 'Coordinator', 'Coordinates activities', 'teacher'),
-- Student role
('student', 'Student', 'Regular student', 'student');

-- ============================================
-- 3. DEPARTMENTS TABLE
-- ============================================

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20),
    description TEXT,
    hod_user_id UUID, -- Will be FK to profiles
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample departments
INSERT INTO departments (code, name, short_name) VALUES
('CSE', 'Computer Science and Engineering', 'CSE'),
('ECE', 'Electronics and Communication Engineering', 'ECE'),
('EEE', 'Electrical and Electronics Engineering', 'EEE'),
('MECH', 'Mechanical Engineering', 'MECH'),
('CIVIL', 'Civil Engineering', 'CIVIL'),
('AIML', 'Artificial Intelligence and Machine Learning', 'AI/ML'),
('MBA', 'Master of Business Administration', 'MBA'),
('MCA', 'Master of Computer Applications', 'MCA');

-- ============================================
-- 4. ACADEMIC YEARS TABLE
-- ============================================

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL, -- e.g., "2024-2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert current academic year
INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES
('2024-2025', '2024-06-01', '2025-05-31', true),
('2025-2026', '2025-06-01', '2026-05-31', false);

-- ============================================
-- 5. YEARS TABLE (1st, 2nd, 3rd, 4th year)
-- ============================================

CREATE TABLE years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_number INTEGER NOT NULL CHECK (year_number BETWEEN 1 AND 6),
    name VARCHAR(20) NOT NULL, -- "1st Year", "2nd Year"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO years (year_number, name) VALUES
(1, '1st Year'),
(2, '2nd Year'),
(3, '3rd Year'),
(4, '4th Year');

-- ============================================
-- 6. SEMESTERS TABLE
-- ============================================

CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 8),
    name VARCHAR(20) NOT NULL, -- "Semester 1", "Semester 2"
    year_id UUID NOT NULL REFERENCES years(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert semesters (2 per year)
INSERT INTO semesters (semester_number, name, year_id)
SELECT 
    s.num,
    'Semester ' || s.num,
    y.id
FROM years y
CROSS JOIN (VALUES (1), (2), (3), (4), (5), (6), (7), (8)) AS s(num)
WHERE (y.year_number = 1 AND s.num IN (1, 2))
   OR (y.year_number = 2 AND s.num IN (3, 4))
   OR (y.year_number = 3 AND s.num IN (5, 6))
   OR (y.year_number = 4 AND s.num IN (7, 8));

-- ============================================
-- 7. SECTIONS TABLE
-- ============================================

CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(10) NOT NULL, -- "A", "B", "C"
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    year_id UUID NOT NULL REFERENCES years(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    max_students INTEGER DEFAULT 60,
    class_teacher_id UUID, -- Will be FK to profiles
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, department_id, year_id, academic_year_id)
);

-- ============================================
-- 8. PROFILES TABLE (Extended User Info)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Info
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    photo_url TEXT,
    date_of_birth DATE,
    gender gender_type,
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Status
    status user_status DEFAULT 'active',
    
    -- Primary role (for quick access)
    primary_role VARCHAR(50) REFERENCES roles(name),
    
    -- Timestamps
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. USER_ROLES TABLE (Many-to-Many)
-- ============================================

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL, -- Role may be department-specific
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id, department_id)
);

-- ============================================
-- 10. STUDENTS TABLE
-- ============================================

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Academic Identifiers
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    roll_number VARCHAR(50),
    hall_ticket_number VARCHAR(50),
    
    -- Current Academic Position
    department_id UUID NOT NULL REFERENCES departments(id),
    year_id UUID NOT NULL REFERENCES years(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    section_id UUID REFERENCES sections(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    
    -- Admission Details
    admission_year INTEGER NOT NULL,
    admission_date DATE,
    admitted_through VARCHAR(50), -- "EAMCET", "Management", "Sports Quota"
    
    -- Parent/Guardian Info
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    guardian_name VARCHAR(100),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    parent_occupation VARCHAR(100),
    
    -- Additional Info
    blood_group VARCHAR(5),
    category VARCHAR(50), -- "General", "OBC", "SC", "ST"
    aadhar_number_encrypted TEXT, -- Store encrypted
    
    -- Status
    current_status user_status DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. TEACHERS TABLE
-- ============================================

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Employee Info
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id),
    
    -- Professional Details
    designation teacher_designation NOT NULL,
    teacher_type teacher_type DEFAULT 'full_time',
    qualification VARCHAR(100), -- "PhD", "M.Tech", "M.Sc"
    specialization VARCHAR(200),
    experience_years INTEGER DEFAULT 0,
    
    -- Joining Details
    joining_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. COURSES/SUBJECTS TABLE
-- ============================================

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Course Info
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    
    -- Academic Position
    department_id UUID NOT NULL REFERENCES departments(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    
    -- Course Type
    course_type course_type DEFAULT 'core',
    
    -- Hours
    theory_hours INTEGER DEFAULT 0,
    lab_hours INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. TEACHER_COURSES TABLE (Who teaches what)
-- ============================================

CREATE TABLE teacher_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    is_primary BOOLEAN DEFAULT true, -- Primary teacher for this course
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, course_id, section_id, academic_year_id)
);

-- ============================================
-- 14. MENTOR_ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE mentor_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    assigned_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(mentor_id, student_id, academic_year_id)
);

-- ============================================
-- 15. Add Foreign Keys to departments
-- ============================================

ALTER TABLE departments 
ADD CONSTRAINT fk_departments_hod 
FOREIGN KEY (hod_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================
-- 16. Add Foreign Keys to sections
-- ============================================

ALTER TABLE sections 
ADD CONSTRAINT fk_sections_class_teacher 
FOREIGN KEY (class_teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================
-- 17. INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_primary_role ON profiles(primary_role);
CREATE INDEX idx_profiles_status ON profiles(status);

-- User Roles
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- Students
CREATE INDEX idx_students_registration ON students(registration_number);
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_section ON students(section_id);
CREATE INDEX idx_students_year ON students(year_id);

-- Teachers
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);
CREATE INDEX idx_teachers_department ON teachers(department_id);

-- Courses
CREATE INDEX idx_courses_department ON courses(department_id);
CREATE INDEX idx_courses_semester ON courses(semester_id);

-- Composite indexes for frequently queried patterns
-- Timetable entries are often filtered by teacher + academic year + day
CREATE INDEX idx_timetable_teacher_year_day ON timetable_entries(teacher_id, academic_year_id, day_of_week);
-- Lesson planner weeks by teacher + date range
CREATE INDEX idx_lesson_planner_teacher_date ON lesson_planner_weeks(teacher_id, week_start_date);
-- Attendance sessions by teacher + academic year + date
CREATE INDEX idx_attendance_teacher_year_date ON attendance_sessions(teacher_id, academic_year_id, session_date);
-- Assignments by teacher + due date for pending queries
CREATE INDEX idx_assignments_teacher_due ON assignments(teacher_id, due_date);

-- ============================================
-- 18. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 19. RLS POLICIES
-- ============================================

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Roles: Anyone authenticated can read roles
CREATE POLICY "Authenticated users can read roles" ON roles
    FOR SELECT TO authenticated USING (true);

-- Departments: Anyone authenticated can read departments
CREATE POLICY "Authenticated users can read departments" ON departments
    FOR SELECT TO authenticated USING (true);

-- User Roles: Users can see their own roles
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- Students: Students can view their own record
CREATE POLICY "Students can view own record" ON students
    FOR SELECT USING (user_id = auth.uid());

-- Teachers: Teachers can view their own record
CREATE POLICY "Teachers can view own record" ON teachers
    FOR SELECT USING (user_id = auth.uid());

-- Courses: Anyone authenticated can read courses
CREATE POLICY "Authenticated users can read courses" ON courses
    FOR SELECT TO authenticated USING (true);

-- Sections: Anyone authenticated can read sections
CREATE POLICY "Authenticated users can read sections" ON sections
    FOR SELECT TO authenticated USING (true);

-- ============================================
-- 20. ADMIN POLICIES (Full access for admins)
-- ============================================

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.category = 'admin'
        AND ur.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin can do everything on profiles
CREATE POLICY "Admins have full access to profiles" ON profiles
    FOR ALL USING (is_admin());

-- Admin can do everything on user_roles
CREATE POLICY "Admins have full access to user_roles" ON user_roles
    FOR ALL USING (is_admin());

-- Admin can do everything on students
CREATE POLICY "Admins have full access to students" ON students
    FOR ALL USING (is_admin());

-- Admin can do everything on teachers
CREATE POLICY "Admins have full access to teachers" ON teachers
    FOR ALL USING (is_admin());

-- Admin can do everything on departments
CREATE POLICY "Admins have full access to departments" ON departments
    FOR ALL USING (is_admin());

-- Admin can do everything on courses
CREATE POLICY "Admins have full access to courses" ON courses
    FOR ALL USING (is_admin());

-- Admin can do everything on sections
CREATE POLICY "Admins have full access to sections" ON sections
    FOR ALL USING (is_admin());

-- ============================================
-- 21. TEACHER POLICIES
-- ============================================

-- Create function to check if user is teacher
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

-- Teachers can view all students (for attendance, marks, etc.)
CREATE POLICY "Teachers can view all students" ON students
    FOR SELECT USING (is_teacher());

-- Teachers can view all teachers
CREATE POLICY "Teachers can view all teachers" ON teachers
    FOR SELECT USING (is_teacher());

-- ============================================
-- 22. TRIGGER: Auto-create profile on signup
-- ============================================

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

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 23. TRIGGER: Update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 24. HELPER FUNCTIONS
-- ============================================

-- Get user's roles
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name VARCHAR, role_category VARCHAR, department_code VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.category, d.code
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    LEFT JOIN departments d ON ur.department_id = d.id
    WHERE ur.user_id = user_uuid AND ur.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current academic year
CREATE OR REPLACE FUNCTION get_current_academic_year()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM academic_years WHERE is_current = true LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SCHEMA COMPLETE!
-- ============================================
