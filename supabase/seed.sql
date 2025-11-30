-- ============================================
-- JPM COLLEGE APP - SEED DATA
-- Version: 1.0
-- Run this AFTER the migration to create test users
-- ============================================

-- ============================================
-- CREATE TEST USERS IN AUTH.USERS
-- Note: In production, users sign up through the app
-- These are for testing only
-- ============================================

-- We'll create users through Supabase Auth API, but we can
-- prepare the profile data here. The trigger will auto-create
-- profiles when users sign up.

-- ============================================
-- CREATE SECTIONS FOR CSE DEPARTMENT
-- ============================================

-- Get IDs we need
DO $$
DECLARE
    v_cse_dept_id UUID;
    v_ece_dept_id UUID;
    v_year_1_id UUID;
    v_year_2_id UUID;
    v_year_3_id UUID;
    v_year_4_id UUID;
    v_current_ay_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    SELECT id INTO v_ece_dept_id FROM departments WHERE code = 'ECE';
    
    -- Get year IDs
    SELECT id INTO v_year_1_id FROM years WHERE year_number = 1;
    SELECT id INTO v_year_2_id FROM years WHERE year_number = 2;
    SELECT id INTO v_year_3_id FROM years WHERE year_number = 3;
    SELECT id INTO v_year_4_id FROM years WHERE year_number = 4;
    
    -- Get current academic year
    SELECT id INTO v_current_ay_id FROM academic_years WHERE is_current = true;
    
    -- Create sections for CSE department
    INSERT INTO sections (name, department_id, year_id, academic_year_id, max_students) VALUES
    ('A', v_cse_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('B', v_cse_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('C', v_cse_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('A', v_cse_dept_id, v_year_2_id, v_current_ay_id, 60),
    ('B', v_cse_dept_id, v_year_2_id, v_current_ay_id, 60),
    ('A', v_cse_dept_id, v_year_3_id, v_current_ay_id, 60),
    ('B', v_cse_dept_id, v_year_3_id, v_current_ay_id, 60),
    ('A', v_cse_dept_id, v_year_4_id, v_current_ay_id, 60),
    ('B', v_cse_dept_id, v_year_4_id, v_current_ay_id, 60)
    ON CONFLICT DO NOTHING;
    
    -- Create sections for ECE department
    INSERT INTO sections (name, department_id, year_id, academic_year_id, max_students) VALUES
    ('A', v_ece_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('B', v_ece_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('A', v_ece_dept_id, v_year_2_id, v_current_ay_id, 60),
    ('A', v_ece_dept_id, v_year_3_id, v_current_ay_id, 60),
    ('A', v_ece_dept_id, v_year_4_id, v_current_ay_id, 60)
    ON CONFLICT DO NOTHING;
    
END $$;

-- ============================================
-- CREATE SAMPLE COURSES FOR CSE DEPARTMENT
-- ============================================

DO $$
DECLARE
    v_cse_dept_id UUID;
    v_sem_1_id UUID;
    v_sem_2_id UUID;
    v_sem_3_id UUID;
    v_sem_4_id UUID;
    v_sem_5_id UUID;
    v_sem_6_id UUID;
BEGIN
    -- Get department ID
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    
    -- Get semester IDs
    SELECT id INTO v_sem_1_id FROM semesters WHERE semester_number = 1;
    SELECT id INTO v_sem_2_id FROM semesters WHERE semester_number = 2;
    SELECT id INTO v_sem_3_id FROM semesters WHERE semester_number = 3;
    SELECT id INTO v_sem_4_id FROM semesters WHERE semester_number = 4;
    SELECT id INTO v_sem_5_id FROM semesters WHERE semester_number = 5;
    SELECT id INTO v_sem_6_id FROM semesters WHERE semester_number = 6;
    
    -- Semester 1 Courses
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
    ('CSE101', 'Introduction to Programming', 'Intro Prog', v_cse_dept_id, v_sem_1_id, 'core', 3, 2),
    ('CSE102', 'Digital Logic Design', 'DLD', v_cse_dept_id, v_sem_1_id, 'core', 3, 2),
    ('MAT101', 'Engineering Mathematics I', 'Math I', v_cse_dept_id, v_sem_1_id, 'core', 4, 0),
    ('PHY101', 'Engineering Physics', 'Physics', v_cse_dept_id, v_sem_1_id, 'core', 3, 2),
    ('ENG101', 'Technical English', 'English', v_cse_dept_id, v_sem_1_id, 'mandatory', 2, 0)
    ON CONFLICT (code) DO NOTHING;
    
    -- Semester 2 Courses
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
    ('CSE201', 'Object Oriented Programming', 'OOP', v_cse_dept_id, v_sem_2_id, 'core', 3, 2),
    ('CSE202', 'Data Structures', 'DS', v_cse_dept_id, v_sem_2_id, 'core', 3, 2),
    ('MAT201', 'Engineering Mathematics II', 'Math II', v_cse_dept_id, v_sem_2_id, 'core', 4, 0),
    ('CSE203', 'Computer Organization', 'CO', v_cse_dept_id, v_sem_2_id, 'core', 3, 0)
    ON CONFLICT (code) DO NOTHING;
    
    -- Semester 3 Courses
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
    ('CSE301', 'Database Management Systems', 'DBMS', v_cse_dept_id, v_sem_3_id, 'core', 3, 2),
    ('CSE302', 'Operating Systems', 'OS', v_cse_dept_id, v_sem_3_id, 'core', 3, 2),
    ('CSE303', 'Algorithms', 'Algo', v_cse_dept_id, v_sem_3_id, 'core', 3, 2),
    ('CSE304', 'Discrete Mathematics', 'DM', v_cse_dept_id, v_sem_3_id, 'core', 3, 0)
    ON CONFLICT (code) DO NOTHING;
    
    -- Semester 4 Courses
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
    ('CSE401', 'Computer Networks', 'CN', v_cse_dept_id, v_sem_4_id, 'core', 3, 2),
    ('CSE402', 'Software Engineering', 'SE', v_cse_dept_id, v_sem_4_id, 'core', 3, 0),
    ('CSE403', 'Theory of Computation', 'TOC', v_cse_dept_id, v_sem_4_id, 'core', 3, 0),
    ('CSE404', 'Web Technologies', 'Web Tech', v_cse_dept_id, v_sem_4_id, 'elective', 3, 2)
    ON CONFLICT (code) DO NOTHING;
    
    -- Semester 5 Courses
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
    ('CSE501', 'Artificial Intelligence', 'AI', v_cse_dept_id, v_sem_5_id, 'core', 3, 2),
    ('CSE502', 'Compiler Design', 'CD', v_cse_dept_id, v_sem_5_id, 'core', 3, 2),
    ('CSE503', 'Machine Learning', 'ML', v_cse_dept_id, v_sem_5_id, 'major', 3, 2),
    ('CSE504', 'Cloud Computing', 'Cloud', v_cse_dept_id, v_sem_5_id, 'elective', 3, 2)
    ON CONFLICT (code) DO NOTHING;
    
    -- Semester 6 Courses
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
    ('CSE601', 'Deep Learning', 'DL', v_cse_dept_id, v_sem_6_id, 'major', 3, 2),
    ('CSE602', 'Cryptography', 'Crypto', v_cse_dept_id, v_sem_6_id, 'minor', 3, 0),
    ('CSE603', 'Big Data Analytics', 'BDA', v_cse_dept_id, v_sem_6_id, 'elective', 3, 2),
    ('CSE604', 'Mobile App Development', 'MAD', v_cse_dept_id, v_sem_6_id, 'elective', 2, 3)
    ON CONFLICT (code) DO NOTHING;
    
END $$;

-- ============================================
-- TEST USERS SETUP INSTRUCTIONS
-- ============================================

/*
Since Supabase requires users to be created through Auth API,
you need to create test users through one of these methods:

METHOD 1: Supabase Dashboard
---------------------------
1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Create the following test users:

   ADMIN USER:
   - Email: admin@jpmcollege.edu
   - Password: Admin@123
   - Email confirmed: Yes
   - User metadata: {"full_name": "Super Admin", "role": "super_admin"}

   TEACHER USER:
   - Email: teacher@jpmcollege.edu
   - Password: Teacher@123
   - Email confirmed: Yes
   - User metadata: {"full_name": "Dr. John Smith", "role": "subject_teacher"}

   STUDENT USER:
   - Email: student@jpmcollege.edu
   - Password: Student@123
   - Email confirmed: Yes
   - User metadata: {"full_name": "Rahul Kumar", "role": "student"}


METHOD 2: Run this SQL AFTER creating users in dashboard
---------------------------------------------------------
Once users are created, run the following to complete their profiles:
*/

-- ============================================
-- FUNCTION: Setup Test User (Run after creating user in dashboard)
-- ============================================

CREATE OR REPLACE FUNCTION setup_test_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_super_admin_role_id UUID;
    v_principal_role_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;
    
    -- Get role IDs
    SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO v_principal_role_id FROM roles WHERE name = 'principal';
    
    -- Update profile
    UPDATE profiles SET
        full_name = 'Super Administrator',
        primary_role = 'super_admin',
        status = 'active'
    WHERE id = v_user_id;
    
    -- Assign roles
    INSERT INTO user_roles (user_id, role_id) VALUES
    (v_user_id, v_super_admin_role_id),
    (v_user_id, v_principal_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Admin user setup complete: %', user_email;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION setup_test_teacher(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_cse_dept_id UUID;
    v_subject_teacher_role_id UUID;
    v_mentor_role_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;
    
    -- Get IDs
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    SELECT id INTO v_subject_teacher_role_id FROM roles WHERE name = 'subject_teacher';
    SELECT id INTO v_mentor_role_id FROM roles WHERE name = 'mentor';
    
    -- Update profile
    UPDATE profiles SET
        full_name = 'Dr. John Smith',
        phone = '+91-9876543210',
        primary_role = 'subject_teacher',
        status = 'active',
        gender = 'male'
    WHERE id = v_user_id;
    
    -- Assign roles
    INSERT INTO user_roles (user_id, role_id, department_id) VALUES
    (v_user_id, v_subject_teacher_role_id, v_cse_dept_id),
    (v_user_id, v_mentor_role_id, v_cse_dept_id)
    ON CONFLICT DO NOTHING;
    
    -- Create teacher record
    INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, specialization, experience_years, joining_date)
    VALUES (
        v_user_id,
        'EMP001',
        v_cse_dept_id,
        'assistant_professor',
        'full_time',
        'Ph.D. Computer Science',
        'Machine Learning, Data Science',
        8,
        '2020-07-01'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Teacher user setup complete: %', user_email;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION setup_test_student(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    v_cse_dept_id UUID;
    v_year_2_id UUID;
    v_sem_3_id UUID;
    v_section_id UUID;
    v_current_ay_id UUID;
    v_student_role_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', user_email;
    END IF;
    
    -- Get IDs
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    SELECT id INTO v_year_2_id FROM years WHERE year_number = 2;
    SELECT id INTO v_sem_3_id FROM semesters WHERE semester_number = 3;
    SELECT id INTO v_current_ay_id FROM academic_years WHERE is_current = true;
    SELECT id INTO v_student_role_id FROM roles WHERE name = 'student';
    
    -- Get section
    SELECT id INTO v_section_id FROM sections 
    WHERE department_id = v_cse_dept_id 
    AND year_id = v_year_2_id 
    AND academic_year_id = v_current_ay_id 
    AND name = 'A'
    LIMIT 1;
    
    -- Update profile
    UPDATE profiles SET
        full_name = 'Rahul Kumar',
        phone = '+91-9123456789',
        primary_role = 'student',
        status = 'active',
        gender = 'male',
        date_of_birth = '2004-05-15',
        city = 'Hyderabad',
        state = 'Telangana'
    WHERE id = v_user_id;
    
    -- Assign role
    INSERT INTO user_roles (user_id, role_id, department_id) VALUES
    (v_user_id, v_student_role_id, v_cse_dept_id)
    ON CONFLICT DO NOTHING;
    
    -- Create student record
    INSERT INTO students (
        user_id, 
        registration_number, 
        roll_number,
        department_id, 
        year_id, 
        semester_id, 
        section_id, 
        academic_year_id,
        admission_year,
        admission_date,
        admitted_through,
        father_name,
        mother_name,
        parent_phone,
        blood_group,
        category
    )
    VALUES (
        v_user_id,
        'JPM2023CSE001',
        '23CSE001',
        v_cse_dept_id,
        v_year_2_id,
        v_sem_3_id,
        v_section_id,
        v_current_ay_id,
        2023,
        '2023-07-15',
        'EAMCET',
        'Suresh Kumar',
        'Lakshmi Devi',
        '+91-9876543211',
        'O+',
        'General'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Student user setup complete: %', user_email;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- QUICK SETUP (Run these after creating users)
-- ============================================

/*
After creating users in Supabase Dashboard, run:

SELECT setup_test_admin('admin@jpmcollege.edu');
SELECT setup_test_teacher('teacher@jpmcollege.edu');
SELECT setup_test_student('student@jpmcollege.edu');

*/

-- ============================================
-- SEED COMPLETE!
-- ============================================
