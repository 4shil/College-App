-- ============================================
-- JPM COLLEGE APP - ESSENTIAL SEED DATA
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- ============================================
-- 1. SEED ROLES
-- ============================================
INSERT INTO roles (name, display_name, description, category) VALUES
('super_admin', 'Super Admin', 'Full system access', 'admin'),
('principal', 'Principal', 'Principal of the college', 'admin'),
('department_admin', 'Department Admin', 'Department level admin', 'admin'),
('hod', 'Head of Department', 'Head of a department', 'admin'),
('exam_cell_admin', 'Exam Cell Admin', 'Manages exams and results', 'admin'),
('library_admin', 'Library Admin', 'Manages library', 'admin'),
('bus_admin', 'Bus Admin', 'Manages transportation', 'admin'),
('canteen_admin', 'Canteen Admin', 'Manages canteen', 'admin'),
('finance_admin', 'Finance Admin', 'Manages fees and finances', 'admin'),
('subject_teacher', 'Subject Teacher', 'Teaches subjects', 'teacher'),
('class_teacher', 'Class Teacher', 'In-charge of a class/section', 'teacher'),
('mentor', 'Mentor', 'Mentors students', 'teacher'),
('coordinator', 'Coordinator', 'Coordinates activities', 'teacher'),
('student', 'Student', 'Regular student', 'student')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. SEED ALLOWED STUDENTS (APAAR IDs for testing)
-- ============================================
INSERT INTO allowed_students (apaar_id, expected_name, notes) VALUES
('APAAR001', 'Test Student 1', 'Test account for development'),
('APAAR002', 'Test Student 2', 'Test account for development'),
('APAAR003', 'Test Student 3', 'Test account for development'),
('APAAR004', 'Test Student 4', 'Test account for development'),
('APAAR005', 'Test Student 5', 'Test account for development'),
('JPM2024001', 'Rahul Kumar', 'Sample student'),
('JPM2024002', 'Priya Sharma', 'Sample student'),
('JPM2024003', 'Arun Patel', 'Sample student')
ON CONFLICT (apaar_id) DO NOTHING;

-- ============================================
-- 3. SEED SAMPLE COURSES/SUBJECTS
-- ============================================
DO $$
DECLARE
    v_cs_dept_id UUID;
    v_com_dept_id UUID;
    v_eng_dept_id UUID;
    v_sem_1_id UUID;
    v_sem_2_id UUID;
    v_sem_3_id UUID;
    v_sem_4_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO v_cs_dept_id FROM departments WHERE code = 'CS';
    SELECT id INTO v_com_dept_id FROM departments WHERE code = 'COM';
    SELECT id INTO v_eng_dept_id FROM departments WHERE code = 'ENG';
    
    -- Get semester IDs
    SELECT id INTO v_sem_1_id FROM semesters WHERE semester_number = 1;
    SELECT id INTO v_sem_2_id FROM semesters WHERE semester_number = 2;
    SELECT id INTO v_sem_3_id FROM semesters WHERE semester_number = 3;
    SELECT id INTO v_sem_4_id FROM semesters WHERE semester_number = 4;
    
    -- CS Department Subjects
    IF v_cs_dept_id IS NOT NULL AND v_sem_1_id IS NOT NULL THEN
        INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
        ('CS101', 'Introduction to Programming', 'Intro Prog', v_cs_dept_id, v_sem_1_id, 'core', 3, 2),
        ('CS102', 'Digital Logic', 'DL', v_cs_dept_id, v_sem_1_id, 'core', 3, 1),
        ('CS103', 'Computer Fundamentals', 'CF', v_cs_dept_id, v_sem_1_id, 'core', 3, 0),
        ('CS201', 'Data Structures', 'DS', v_cs_dept_id, v_sem_2_id, 'core', 3, 2),
        ('CS202', 'Object Oriented Programming', 'OOP', v_cs_dept_id, v_sem_2_id, 'core', 3, 2),
        ('CS301', 'Database Management Systems', 'DBMS', v_cs_dept_id, v_sem_3_id, 'core', 3, 2),
        ('CS302', 'Operating Systems', 'OS', v_cs_dept_id, v_sem_3_id, 'core', 3, 1),
        ('CS303', 'Computer Networks', 'CN', v_cs_dept_id, v_sem_3_id, 'core', 3, 1),
        ('CS401', 'Web Technologies', 'Web Tech', v_cs_dept_id, v_sem_4_id, 'elective', 3, 2),
        ('CS402', 'Software Engineering', 'SE', v_cs_dept_id, v_sem_4_id, 'core', 3, 0)
        ON CONFLICT (code) DO NOTHING;
    END IF;
    
    -- Commerce Department Subjects
    IF v_com_dept_id IS NOT NULL AND v_sem_1_id IS NOT NULL THEN
        INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
        ('COM101', 'Financial Accounting', 'FA', v_com_dept_id, v_sem_1_id, 'core', 4, 0),
        ('COM102', 'Business Economics', 'BE', v_com_dept_id, v_sem_1_id, 'core', 3, 0),
        ('COM103', 'Business Communication', 'BC', v_com_dept_id, v_sem_1_id, 'core', 3, 0),
        ('COM201', 'Corporate Accounting', 'CA', v_com_dept_id, v_sem_2_id, 'core', 4, 0),
        ('COM202', 'Cost Accounting', 'Cost Acc', v_com_dept_id, v_sem_2_id, 'core', 4, 0),
        ('COM301', 'Taxation', 'Tax', v_com_dept_id, v_sem_3_id, 'core', 4, 0),
        ('COM302', 'Auditing', 'Audit', v_com_dept_id, v_sem_3_id, 'core', 3, 0)
        ON CONFLICT (code) DO NOTHING;
    END IF;
    
    -- English Department Subjects
    IF v_eng_dept_id IS NOT NULL AND v_sem_1_id IS NOT NULL THEN
        INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
        ('ENG101', 'English Literature', 'Eng Lit', v_eng_dept_id, v_sem_1_id, 'core', 4, 0),
        ('ENG102', 'Communication Skills', 'Comm Skills', v_eng_dept_id, v_sem_1_id, 'core', 3, 0),
        ('ENG201', 'Poetry and Drama', 'Poetry', v_eng_dept_id, v_sem_2_id, 'core', 4, 0),
        ('ENG202', 'Prose and Fiction', 'Prose', v_eng_dept_id, v_sem_2_id, 'core', 4, 0)
        ON CONFLICT (code) DO NOTHING;
    END IF;

    RAISE NOTICE 'Subjects seeded successfully!';
END $$;

-- ============================================
-- 4. VERIFY SEED DATA
-- ============================================
SELECT 'Roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Allowed Students', COUNT(*) FROM allowed_students
UNION ALL
SELECT 'Courses (Subjects)', COUNT(*) FROM courses
UNION ALL
SELECT 'Programs', COUNT(*) FROM programs
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments;

-- ============================================
-- 5. RLS POLICIES FOR HOD & SUPER ADMIN
-- Allows HOD to manage subjects and teachers in their department
-- Super Admin has full access
-- ============================================

-- Helper function: Check if user is HOD of a specific department
CREATE OR REPLACE FUNCTION is_hod_of_department(dept_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'hod'
        AND ur.department_id = dept_id
        AND ur.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get HOD's department ID
CREATE OR REPLACE FUNCTION get_hod_department_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT ur.department_id FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name = 'hod'
        AND ur.is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies on courses if they exist
DROP POLICY IF EXISTS "Admins have full access to courses" ON courses;
DROP POLICY IF EXISTS "HOD can manage department courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can read courses" ON courses;

-- COURSES (Subjects) Policies
-- Super Admin: Full access
CREATE POLICY "Super admin full access to courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'super_admin'
            AND ur.is_active = true
        )
    );

-- HOD: Can manage courses in their department only
CREATE POLICY "HOD can manage department courses" ON courses
    FOR ALL USING (
        is_hod_of_department(department_id)
    );

-- All authenticated users can read courses
CREATE POLICY "All users can read courses" ON courses
    FOR SELECT TO authenticated USING (true);

-- Drop existing policies on teachers if they exist
DROP POLICY IF EXISTS "Admins have full access to teachers" ON teachers;
DROP POLICY IF EXISTS "HOD can manage department teachers" ON teachers;

-- TEACHERS Policies
-- Super Admin: Full access
CREATE POLICY "Super admin full access to teachers" ON teachers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name = 'super_admin'
            AND ur.is_active = true
        )
    );

-- HOD: Can manage teachers in their department only
CREATE POLICY "HOD can manage department teachers" ON teachers
    FOR ALL USING (
        is_hod_of_department(department_id)
    );

-- Drop existing policies on user_roles if they exist
DROP POLICY IF EXISTS "Admins have full access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "HOD can assign teacher roles in department" ON user_roles;

-- USER_ROLES Policies (for assigning teacher roles)
-- Super Admin: Full access
CREATE POLICY "Super admin full access to user_roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur2
            JOIN roles r ON ur2.role_id = r.id
            WHERE ur2.user_id = auth.uid()
            AND r.name = 'super_admin'
            AND ur2.is_active = true
        )
    );

-- HOD: Can assign teacher roles in their department only
CREATE POLICY "HOD can assign teacher roles in department" ON user_roles
    FOR ALL USING (
        -- HOD can only manage roles in their department
        is_hod_of_department(department_id)
        -- And only for teacher category roles
        AND EXISTS (
            SELECT 1 FROM roles r
            WHERE r.id = role_id
            AND r.category = 'teacher'
        )
    );

-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- 6. TEACHER_COURSES Policies (who teaches what)
-- ============================================
DROP POLICY IF EXISTS "HOD can manage teacher course assignments" ON teacher_courses;

-- Super Admin: Full access (already exists via is_admin())
-- HOD: Can assign teachers to courses in their department
CREATE POLICY "HOD can manage teacher course assignments" ON teacher_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses c
            WHERE c.id = course_id
            AND is_hod_of_department(c.department_id)
        )
    );

-- ============================================
-- DONE! Your database is now seeded.
-- ============================================
