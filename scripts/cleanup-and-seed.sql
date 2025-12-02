-- ============================================
-- CLEANUP AND SEED REAL DATA FOR JPM COLLEGE
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DELETE ALL TEST DATA
-- ============================================

DELETE FROM user_roles;
DELETE FROM teachers;
DELETE FROM students;
DELETE FROM courses;
DELETE FROM sections;
DELETE FROM profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@jpmcollege.edu');
DELETE FROM auth.users WHERE email LIKE '%@jpmcollege.edu';
DELETE FROM departments;

-- ============================================
-- STEP 2: CREATE 6 DEPARTMENTS (Faculties)
-- ============================================

INSERT INTO departments (id, code, name, short_name, is_active) VALUES
    (gen_random_uuid(), 'COMMERCE', 'Faculty of Commerce', 'Commerce', true),
    (gen_random_uuid(), 'ARTS', 'Faculty of Arts & Humanities', 'Arts', true),
    (gen_random_uuid(), 'MANAGEMENT', 'Faculty of Business & Management', 'Management', true),
    (gen_random_uuid(), 'COMPUTER', 'Faculty of Computer Applications', 'Computer', true),
    (gen_random_uuid(), 'SOCIALWORK', 'Faculty of Social Work', 'Social Work', true),
    (gen_random_uuid(), 'TOURISM', 'Faculty of Tourism & Travel', 'Tourism', true);

-- ============================================
-- STEP 3: CREATE COURSES UNDER DEPARTMENTS
-- ============================================

DO $$
DECLARE
    commerce_id UUID;
    arts_id UUID;
    mgmt_id UUID;
    computer_id UUID;
    social_id UUID;
    tourism_id UUID;
    sem_id UUID;
BEGIN
    SELECT id INTO commerce_id FROM departments WHERE code = 'COMMERCE';
    SELECT id INTO arts_id FROM departments WHERE code = 'ARTS';
    SELECT id INTO mgmt_id FROM departments WHERE code = 'MANAGEMENT';
    SELECT id INTO computer_id FROM departments WHERE code = 'COMPUTER';
    SELECT id INTO social_id FROM departments WHERE code = 'SOCIALWORK';
    SELECT id INTO tourism_id FROM departments WHERE code = 'TOURISM';
    
    SELECT id INTO sem_id FROM semesters WHERE number = 1 LIMIT 1;
    IF sem_id IS NULL THEN
        INSERT INTO semesters (id, number, name, is_active) 
        VALUES (gen_random_uuid(), 1, 'Semester 1', true)
        RETURNING id INTO sem_id;
    END IF;
    
    -- COMMERCE Courses (4)
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type) VALUES
        ('BCOM-COOP', 'B.Com Co-operation', 'B.Com Coop', commerce_id, sem_id, 'core'),
        ('BCOM-FT', 'B.Com Finance and Taxation', 'B.Com F&T', commerce_id, sem_id, 'core'),
        ('BCOM-LM', 'B.Com Logistics Management', 'B.Com LM', commerce_id, sem_id, 'core'),
        ('MCOM-FT', 'M.Com Finance & Taxation', 'M.Com F&T', commerce_id, sem_id, 'core')
    ON CONFLICT (code) DO NOTHING;
    
    -- ARTS Courses (2)
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type) VALUES
        ('BA-ENG', 'BA English Cultural Studies & Film Studies', 'BA English', arts_id, sem_id, 'core'),
        ('MA-ENG', 'MA English Language and Literature', 'MA English', arts_id, sem_id, 'core')
    ON CONFLICT (code) DO NOTHING;
    
    -- MANAGEMENT Courses (2)
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type) VALUES
        ('BBA', 'BBA (Bachelor of Business Administration - AICTE Approved)', 'BBA', mgmt_id, sem_id, 'core'),
        ('MA-HRM', 'MA HRM (Human Resource Management)', 'MA HRM', mgmt_id, sem_id, 'core')
    ON CONFLICT (code) DO NOTHING;
    
    -- COMPUTER Courses (2)
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type) VALUES
        ('BCA', 'BCA (Bachelor of Computer Application - AICTE Approved)', 'BCA', computer_id, sem_id, 'core'),
        ('MSC-CS', 'M.Sc Computer Science', 'M.Sc CS', computer_id, sem_id, 'core')
    ON CONFLICT (code) DO NOTHING;
    
    -- SOCIAL WORK Courses (2)
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type) VALUES
        ('BSW', 'BSW Development Social Work & Multi Cultural Social Work', 'BSW', social_id, sem_id, 'core'),
        ('MSW', 'MSW (Master of Social Work)', 'MSW', social_id, sem_id, 'core')
    ON CONFLICT (code) DO NOTHING;
    
    -- TOURISM Courses (1)
    INSERT INTO courses (code, name, short_name, department_id, semester_id, course_type) VALUES
        ('BTTM', 'BTTM Tour Operation Management & Aviation Management', 'BTTM', tourism_id, sem_id, 'core')
    ON CONFLICT (code) DO NOTHING;
END $$;

-- ============================================
-- STEP 4: CREATE STAFF (1 of each role per dept)
-- 1 HOD, 1 Class Teacher, 1 Subject Teacher, 1 Mentor, 1 Coordinator
-- ============================================

CREATE OR REPLACE FUNCTION seed_minimal_staff()
RETURNS TEXT AS $$
DECLARE
    dept RECORD;
    staff_count INTEGER := 0;
    new_user_id UUID;
    emp_counter INTEGER := 1000;
    staff_email TEXT;
    staff_name TEXT;
    role_id_val UUID;
    dept_code_clean TEXT;
BEGIN
    FOR dept IN SELECT * FROM departments WHERE is_active = true ORDER BY code LOOP
        
        dept_code_clean := LOWER(REPLACE(dept.code, ' ', ''));
        
        -- ========== 1. HOD ==========
        emp_counter := emp_counter + 1;
        staff_email := 'hod.' || dept_code_clean || '@jpmcollege.edu';
        staff_name := 'Dr. ' || dept.short_name || ' HOD';
        
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', staff_email, crypt('Hod@123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
        RETURNING id INTO new_user_id;
        
        UPDATE profiles SET full_name = staff_name, phone = '+91' || (9800000000 + emp_counter)::TEXT, primary_role = 'hod', status = 'active' WHERE id = new_user_id;
        INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
        VALUES (new_user_id, 'HOD' || emp_counter, dept.id, 'professor', 'full_time', 'PhD', 15, '2010-06-01', true);
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'hod' LIMIT 1;
        IF role_id_val IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id, department_id, is_active) VALUES (new_user_id, role_id_val, dept.id, true) ON CONFLICT DO NOTHING;
        END IF;
        UPDATE departments SET hod_user_id = new_user_id WHERE id = dept.id;
        staff_count := staff_count + 1;
        
        -- ========== 2. CLASS TEACHER ==========
        emp_counter := emp_counter + 1;
        staff_email := 'class.' || dept_code_clean || '@jpmcollege.edu';
        staff_name := 'Prof. ' || dept.short_name || ' Class Teacher';
        
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', staff_email, crypt('Teacher@123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
        RETURNING id INTO new_user_id;
        
        UPDATE profiles SET full_name = staff_name, phone = '+91' || (9800000000 + emp_counter)::TEXT, primary_role = 'class_teacher', status = 'active' WHERE id = new_user_id;
        INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
        VALUES (new_user_id, 'CT' || emp_counter, dept.id, 'assistant_professor', 'full_time', 'M.Phil', 8, '2016-06-01', true);
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'class_teacher' LIMIT 1;
        IF role_id_val IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id, department_id, is_active) VALUES (new_user_id, role_id_val, dept.id, true) ON CONFLICT DO NOTHING;
        END IF;
        staff_count := staff_count + 1;
        
        -- ========== 3. SUBJECT TEACHER ==========
        emp_counter := emp_counter + 1;
        staff_email := 'teacher.' || dept_code_clean || '@jpmcollege.edu';
        staff_name := 'Prof. ' || dept.short_name || ' Faculty';
        
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', staff_email, crypt('Teacher@123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
        RETURNING id INTO new_user_id;
        
        UPDATE profiles SET full_name = staff_name, phone = '+91' || (9800000000 + emp_counter)::TEXT, primary_role = 'subject_teacher', status = 'active' WHERE id = new_user_id;
        INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
        VALUES (new_user_id, 'FAC' || emp_counter, dept.id, 'assistant_professor', 'full_time', 'M.A', 5, '2019-06-01', true);
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'subject_teacher' LIMIT 1;
        IF role_id_val IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id, department_id, is_active) VALUES (new_user_id, role_id_val, dept.id, true) ON CONFLICT DO NOTHING;
        END IF;
        staff_count := staff_count + 1;
        
        -- ========== 4. MENTOR ==========
        emp_counter := emp_counter + 1;
        staff_email := 'mentor.' || dept_code_clean || '@jpmcollege.edu';
        staff_name := 'Prof. ' || dept.short_name || ' Mentor';
        
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', staff_email, crypt('Teacher@123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
        RETURNING id INTO new_user_id;
        
        UPDATE profiles SET full_name = staff_name, phone = '+91' || (9800000000 + emp_counter)::TEXT, primary_role = 'mentor', status = 'active' WHERE id = new_user_id;
        INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
        VALUES (new_user_id, 'MNT' || emp_counter, dept.id, 'assistant_professor', 'full_time', 'M.Phil', 6, '2018-06-01', true);
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'mentor' LIMIT 1;
        IF role_id_val IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id, department_id, is_active) VALUES (new_user_id, role_id_val, dept.id, true) ON CONFLICT DO NOTHING;
        END IF;
        staff_count := staff_count + 1;
        
        -- ========== 5. COORDINATOR ==========
        emp_counter := emp_counter + 1;
        staff_email := 'coordinator.' || dept_code_clean || '@jpmcollege.edu';
        staff_name := 'Prof. ' || dept.short_name || ' Coordinator';
        
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
        VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', staff_email, crypt('Teacher@123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
        RETURNING id INTO new_user_id;
        
        UPDATE profiles SET full_name = staff_name, phone = '+91' || (9800000000 + emp_counter)::TEXT, primary_role = 'coordinator', status = 'active' WHERE id = new_user_id;
        INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
        VALUES (new_user_id, 'CORD' || emp_counter, dept.id, 'associate_professor', 'full_time', 'PhD', 10, '2014-06-01', true);
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'coordinator' LIMIT 1;
        IF role_id_val IS NOT NULL THEN
            INSERT INTO user_roles (user_id, role_id, department_id, is_active) VALUES (new_user_id, role_id_val, dept.id, true) ON CONFLICT DO NOTHING;
        END IF;
        staff_count := staff_count + 1;
        
    END LOOP;
    
    RETURN 'Created ' || staff_count || ' staff (5 per dept x 6 depts = 30)';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT seed_minimal_staff();

-- ============================================
-- STEP 5: CREATE ADMIN USERS
-- ============================================

DO $$
DECLARE
    new_user_id UUID;
    role_id_val UUID;
BEGIN
    -- Principal
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'principal@jpmcollege.edu', crypt('Principal@123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
    RETURNING id INTO new_user_id;
    
    UPDATE profiles SET full_name = 'Dr. JPM Principal', phone = '+919999000001', primary_role = 'principal', status = 'active' WHERE id = new_user_id;
    SELECT id INTO role_id_val FROM roles WHERE name = 'principal' LIMIT 1;
    IF role_id_val IS NOT NULL THEN INSERT INTO user_roles (user_id, role_id, is_active) VALUES (new_user_id, role_id_val, true); END IF;

    -- Super Admin
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@jpmcollege.edu', crypt('Admin@123', gen_salt('bf')), NOW(), NOW(), NOW(), '', '', '', '')
    RETURNING id INTO new_user_id;
    
    UPDATE profiles SET full_name = 'System Administrator', phone = '+919999000002', primary_role = 'super_admin', status = 'active' WHERE id = new_user_id;
    SELECT id INTO role_id_val FROM roles WHERE name = 'super_admin' LIMIT 1;
    IF role_id_val IS NOT NULL THEN INSERT INTO user_roles (user_id, role_id, is_active) VALUES (new_user_id, role_id_val, true); END IF;
END $$;

-- ============================================
-- STEP 6: VERIFICATION
-- ============================================

-- Departments with course count
SELECT d.code, d.short_name as department, COUNT(c.id) as courses
FROM departments d LEFT JOIN courses c ON c.department_id = d.id
GROUP BY d.code, d.short_name ORDER BY d.code;

-- All courses
SELECT d.short_name as department, c.code, c.name FROM courses c
JOIN departments d ON c.department_id = d.id ORDER BY d.code, c.code;

-- Staff by department and role
SELECT d.short_name as department, p.primary_role as role, p.full_name, p.email
FROM teachers t
JOIN profiles p ON t.user_id = p.id
JOIN departments d ON t.department_id = d.id
ORDER BY d.code, CASE p.primary_role WHEN 'hod' THEN 1 WHEN 'coordinator' THEN 2 WHEN 'class_teacher' THEN 3 WHEN 'subject_teacher' THEN 4 WHEN 'mentor' THEN 5 END;

-- Final counts
SELECT 
    (SELECT COUNT(*) FROM departments) as departments,
    (SELECT COUNT(*) FROM courses) as courses,
    (SELECT COUNT(*) FROM teachers) as teachers,
    (SELECT COUNT(*) FROM profiles WHERE primary_role = 'hod') as hods,
    (SELECT COUNT(*) FROM profiles WHERE primary_role = 'class_teacher') as class_teachers,
    (SELECT COUNT(*) FROM profiles WHERE primary_role = 'subject_teacher') as subject_teachers,
    (SELECT COUNT(*) FROM profiles WHERE primary_role = 'mentor') as mentors,
    (SELECT COUNT(*) FROM profiles WHERE primary_role = 'coordinator') as coordinators,
    (SELECT COUNT(*) FROM profiles WHERE primary_role IN ('super_admin', 'principal')) as admins;
