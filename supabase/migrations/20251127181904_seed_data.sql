-- ============================================
-- SEED DATA MIGRATION
-- Creates sections, courses, and test user setup functions
-- ============================================

-- Create sections for CSE and ECE departments
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
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    SELECT id INTO v_ece_dept_id FROM departments WHERE code = 'ECE';
    SELECT id INTO v_year_1_id FROM years WHERE year_number = 1;
    SELECT id INTO v_year_2_id FROM years WHERE year_number = 2;
    SELECT id INTO v_year_3_id FROM years WHERE year_number = 3;
    SELECT id INTO v_year_4_id FROM years WHERE year_number = 4;
    SELECT id INTO v_current_ay_id FROM academic_years WHERE is_current = true;
    
    INSERT INTO sections (name, department_id, year_id, academic_year_id, max_students) VALUES
    ('A', v_cse_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('B', v_cse_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('A', v_cse_dept_id, v_year_2_id, v_current_ay_id, 60),
    ('B', v_cse_dept_id, v_year_2_id, v_current_ay_id, 60),
    ('A', v_cse_dept_id, v_year_3_id, v_current_ay_id, 60),
    ('A', v_cse_dept_id, v_year_4_id, v_current_ay_id, 60),
    ('A', v_ece_dept_id, v_year_1_id, v_current_ay_id, 60),
    ('A', v_ece_dept_id, v_year_2_id, v_current_ay_id, 60)
    ON CONFLICT DO NOTHING;
END $$;

-- Create sample courses
DO $$
DECLARE
    v_cse_dept_id UUID;
    v_sem_1_id UUID;
    v_sem_2_id UUID;
    v_sem_3_id UUID;
BEGIN
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    SELECT id INTO v_sem_1_id FROM semesters WHERE semester_number = 1;
    SELECT id INTO v_sem_2_id FROM semesters WHERE semester_number = 2;
    SELECT id INTO v_sem_3_id FROM semesters WHERE semester_number = 3;
    
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type, theory_hours, lab_hours) VALUES
    ('CSE101', 'Introduction to Programming', 'Intro Prog', v_cse_dept_id, v_sem_1_id, 'core', 3, 2),
    ('CSE102', 'Digital Logic Design', 'DLD', v_cse_dept_id, v_sem_1_id, 'core', 3, 2),
    ('MAT101', 'Engineering Mathematics I', 'Math I', v_cse_dept_id, v_sem_1_id, 'core', 4, 0),
    ('CSE201', 'Object Oriented Programming', 'OOP', v_cse_dept_id, v_sem_2_id, 'core', 3, 2),
    ('CSE202', 'Data Structures', 'DS', v_cse_dept_id, v_sem_2_id, 'core', 3, 2),
    ('CSE301', 'Database Management Systems', 'DBMS', v_cse_dept_id, v_sem_3_id, 'core', 3, 2),
    ('CSE302', 'Operating Systems', 'OS', v_cse_dept_id, v_sem_3_id, 'core', 3, 2)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Function to setup admin user
CREATE OR REPLACE FUNCTION setup_test_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_super_admin_role_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
    IF v_user_id IS NULL THEN RETURN 'User not found: ' || user_email; END IF;
    
    SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'super_admin';
    
    UPDATE profiles SET full_name = 'Super Administrator', primary_role = 'super_admin', status = 'active' WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role_id) VALUES (v_user_id, v_super_admin_role_id) ON CONFLICT DO NOTHING;
    
    RETURN 'Admin setup complete: ' || user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup teacher user
CREATE OR REPLACE FUNCTION setup_test_teacher(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_cse_dept_id UUID;
    v_subject_teacher_role_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
    IF v_user_id IS NULL THEN RETURN 'User not found: ' || user_email; END IF;
    
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    SELECT id INTO v_subject_teacher_role_id FROM roles WHERE name = 'subject_teacher';
    
    UPDATE profiles SET full_name = 'Dr. John Smith', primary_role = 'subject_teacher', status = 'active', gender = 'male' WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role_id, department_id) VALUES (v_user_id, v_subject_teacher_role_id, v_cse_dept_id) ON CONFLICT DO NOTHING;
    
    INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date)
    VALUES (v_user_id, 'EMP001', v_cse_dept_id, 'assistant_professor', 'full_time', 'Ph.D. Computer Science', 8, '2020-07-01')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN 'Teacher setup complete: ' || user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to setup student user
CREATE OR REPLACE FUNCTION setup_test_student(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_cse_dept_id UUID;
    v_year_2_id UUID;
    v_sem_3_id UUID;
    v_section_id UUID;
    v_current_ay_id UUID;
    v_student_role_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = user_email;
    IF v_user_id IS NULL THEN RETURN 'User not found: ' || user_email; END IF;
    
    SELECT id INTO v_cse_dept_id FROM departments WHERE code = 'CSE';
    SELECT id INTO v_year_2_id FROM years WHERE year_number = 2;
    SELECT id INTO v_sem_3_id FROM semesters WHERE semester_number = 3;
    SELECT id INTO v_current_ay_id FROM academic_years WHERE is_current = true;
    SELECT id INTO v_student_role_id FROM roles WHERE name = 'student';
    SELECT id INTO v_section_id FROM sections WHERE department_id = v_cse_dept_id AND year_id = v_year_2_id AND name = 'A' LIMIT 1;
    
    UPDATE profiles SET full_name = 'Rahul Kumar', primary_role = 'student', status = 'active', gender = 'male', date_of_birth = '2004-05-15' WHERE id = v_user_id;
    INSERT INTO user_roles (user_id, role_id, department_id) VALUES (v_user_id, v_student_role_id, v_cse_dept_id) ON CONFLICT DO NOTHING;
    
    INSERT INTO students (user_id, registration_number, roll_number, department_id, year_id, semester_id, section_id, academic_year_id, admission_year, admission_date, father_name, blood_group, category)
    VALUES (v_user_id, 'JPM2023CSE001', '23CSE001', v_cse_dept_id, v_year_2_id, v_sem_3_id, v_section_id, v_current_ay_id, 2023, '2023-07-15', 'Suresh Kumar', 'O+', 'General')
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN 'Student setup complete: ' || user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;