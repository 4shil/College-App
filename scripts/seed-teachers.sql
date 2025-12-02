-- ============================================
-- SEED DUMMY TEACHERS FOR ALL DEPARTMENTS & ROLES
-- Run this in Supabase SQL Editor
-- ============================================

-- First, ensure we have all departments
DO $$
BEGIN
    -- Insert departments if they don't exist
    INSERT INTO departments (code, name, short_name, is_active)
    VALUES 
        ('CSE', 'Computer Science and Engineering', 'CSE', true),
        ('ECE', 'Electronics and Communication Engineering', 'ECE', true),
        ('EEE', 'Electrical and Electronics Engineering', 'EEE', true),
        ('MECH', 'Mechanical Engineering', 'MECH', true),
        ('CIVIL', 'Civil Engineering', 'CIVIL', true),
        ('AIML', 'Artificial Intelligence and Machine Learning', 'AI/ML', true)
    ON CONFLICT (code) DO NOTHING;
END $$;

-- Create a function to generate dummy teachers
CREATE OR REPLACE FUNCTION seed_dummy_teachers()
RETURNS TEXT AS $$
DECLARE
    dept RECORD;
    role_rec RECORD;
    teacher_count INTEGER := 0;
    new_user_id UUID;
    new_teacher_id UUID;
    emp_counter INTEGER := 100;
    teacher_email TEXT;
    teacher_name TEXT;
    role_id_val UUID;
    curr_year_id UUID;
BEGIN
    -- Get current academic year
    SELECT id INTO curr_year_id FROM academic_years WHERE is_current = true LIMIT 1;
    
    -- Loop through each department
    FOR dept IN SELECT * FROM departments WHERE is_active = true LOOP
        
        -- Create HOD for each department
        emp_counter := emp_counter + 1;
        teacher_email := 'hod.' || LOWER(dept.code) || '@jpmcollege.edu';
        teacher_name := 'Dr. ' || dept.short_name || ' HOD';
        
        -- Check if user already exists
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = teacher_email) THEN
            -- Insert into auth.users
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, 
                encrypted_password, email_confirmed_at, 
                created_at, updated_at, confirmation_token,
                email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(), 'authenticated', 'authenticated',
                teacher_email,
                crypt('Teacher@123', gen_salt('bf')),
                NOW(), NOW(), NOW(), '', '', '', ''
            ) RETURNING id INTO new_user_id;
            
            -- Update profile
            UPDATE profiles SET 
                full_name = teacher_name,
                phone = '+91' || (9000000000 + emp_counter)::TEXT,
                primary_role = 'hod',
                status = 'active'
            WHERE id = new_user_id;
            
            -- Create teacher record
            INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
            VALUES (
                new_user_id,
                'EMP' || emp_counter,
                dept.id,
                'professor',
                'full_time',
                'PhD',
                15,
                '2010-06-01',
                true
            ) RETURNING id INTO new_teacher_id;
            
            -- Assign HOD role
            SELECT id INTO role_id_val FROM roles WHERE name = 'hod' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            -- Also give subject_teacher role
            SELECT id INTO role_id_val FROM roles WHERE name = 'subject_teacher' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            -- Update department HOD
            UPDATE departments SET hod_user_id = new_user_id WHERE id = dept.id;
            
            teacher_count := teacher_count + 1;
        END IF;
        
        -- Create 2 Subject Teachers per department
        FOR i IN 1..2 LOOP
            emp_counter := emp_counter + 1;
            teacher_email := 'teacher' || i || '.' || LOWER(dept.code) || '@jpmcollege.edu';
            teacher_name := 'Prof. ' || dept.short_name || ' Teacher ' || i;
            
            IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = teacher_email) THEN
                INSERT INTO auth.users (
                    instance_id, id, aud, role, email, 
                    encrypted_password, email_confirmed_at, 
                    created_at, updated_at, confirmation_token,
                    email_change, email_change_token_new, recovery_token
                ) VALUES (
                    '00000000-0000-0000-0000-000000000000',
                    gen_random_uuid(), 'authenticated', 'authenticated',
                    teacher_email,
                    crypt('Teacher@123', gen_salt('bf')),
                    NOW(), NOW(), NOW(), '', '', '', ''
                ) RETURNING id INTO new_user_id;
                
                UPDATE profiles SET 
                    full_name = teacher_name,
                    phone = '+91' || (9000000000 + emp_counter)::TEXT,
                    primary_role = 'subject_teacher',
                    status = 'active'
                WHERE id = new_user_id;
                
                INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
                VALUES (
                    new_user_id,
                    'EMP' || emp_counter,
                    dept.id,
                    'assistant_professor',
                    'full_time',
                    'M.Tech',
                    5 + i,
                    '2018-06-01',
                    true
                );
                
                SELECT id INTO role_id_val FROM roles WHERE name = 'subject_teacher' LIMIT 1;
                INSERT INTO user_roles (user_id, role_id, department_id, is_active)
                VALUES (new_user_id, role_id_val, dept.id, true)
                ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
                
                teacher_count := teacher_count + 1;
            END IF;
        END LOOP;
        
        -- Create 1 Class Teacher per department
        emp_counter := emp_counter + 1;
        teacher_email := 'class.' || LOWER(dept.code) || '@jpmcollege.edu';
        teacher_name := 'Prof. ' || dept.short_name || ' Class Teacher';
        
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = teacher_email) THEN
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, 
                encrypted_password, email_confirmed_at, 
                created_at, updated_at, confirmation_token,
                email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(), 'authenticated', 'authenticated',
                teacher_email,
                crypt('Teacher@123', gen_salt('bf')),
                NOW(), NOW(), NOW(), '', '', '', ''
            ) RETURNING id INTO new_user_id;
            
            UPDATE profiles SET 
                full_name = teacher_name,
                phone = '+91' || (9000000000 + emp_counter)::TEXT,
                primary_role = 'class_teacher',
                status = 'active'
            WHERE id = new_user_id;
            
            INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
            VALUES (
                new_user_id,
                'EMP' || emp_counter,
                dept.id,
                'assistant_professor',
                'full_time',
                'M.Tech',
                8,
                '2016-06-01',
                true
            );
            
            -- Assign class_teacher AND subject_teacher roles
            SELECT id INTO role_id_val FROM roles WHERE name = 'class_teacher' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            SELECT id INTO role_id_val FROM roles WHERE name = 'subject_teacher' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            teacher_count := teacher_count + 1;
        END IF;
        
        -- Create 1 Mentor per department
        emp_counter := emp_counter + 1;
        teacher_email := 'mentor.' || LOWER(dept.code) || '@jpmcollege.edu';
        teacher_name := 'Prof. ' || dept.short_name || ' Mentor';
        
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = teacher_email) THEN
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, 
                encrypted_password, email_confirmed_at, 
                created_at, updated_at, confirmation_token,
                email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(), 'authenticated', 'authenticated',
                teacher_email,
                crypt('Teacher@123', gen_salt('bf')),
                NOW(), NOW(), NOW(), '', '', '', ''
            ) RETURNING id INTO new_user_id;
            
            UPDATE profiles SET 
                full_name = teacher_name,
                phone = '+91' || (9000000000 + emp_counter)::TEXT,
                primary_role = 'mentor',
                status = 'active'
            WHERE id = new_user_id;
            
            INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
            VALUES (
                new_user_id,
                'EMP' || emp_counter,
                dept.id,
                'assistant_professor',
                'full_time',
                'M.Tech',
                6,
                '2017-06-01',
                true
            );
            
            -- Assign mentor AND subject_teacher roles
            SELECT id INTO role_id_val FROM roles WHERE name = 'mentor' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            SELECT id INTO role_id_val FROM roles WHERE name = 'subject_teacher' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            teacher_count := teacher_count + 1;
        END IF;
        
        -- Create 1 Coordinator per department
        emp_counter := emp_counter + 1;
        teacher_email := 'coordinator.' || LOWER(dept.code) || '@jpmcollege.edu';
        teacher_name := 'Prof. ' || dept.short_name || ' Coordinator';
        
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = teacher_email) THEN
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, 
                encrypted_password, email_confirmed_at, 
                created_at, updated_at, confirmation_token,
                email_change, email_change_token_new, recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(), 'authenticated', 'authenticated',
                teacher_email,
                crypt('Teacher@123', gen_salt('bf')),
                NOW(), NOW(), NOW(), '', '', '', ''
            ) RETURNING id INTO new_user_id;
            
            UPDATE profiles SET 
                full_name = teacher_name,
                phone = '+91' || (9000000000 + emp_counter)::TEXT,
                primary_role = 'coordinator',
                status = 'active'
            WHERE id = new_user_id;
            
            INSERT INTO teachers (user_id, employee_id, department_id, designation, teacher_type, qualification, experience_years, joining_date, is_active)
            VALUES (
                new_user_id,
                'EMP' || emp_counter,
                dept.id,
                'associate_professor',
                'full_time',
                'PhD',
                10,
                '2014-06-01',
                true
            );
            
            -- Assign coordinator AND subject_teacher roles
            SELECT id INTO role_id_val FROM roles WHERE name = 'coordinator' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            SELECT id INTO role_id_val FROM roles WHERE name = 'subject_teacher' LIMIT 1;
            INSERT INTO user_roles (user_id, role_id, department_id, is_active)
            VALUES (new_user_id, role_id_val, dept.id, true)
            ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
            
            teacher_count := teacher_count + 1;
        END IF;
        
    END LOOP;
    
    RETURN 'Successfully created ' || teacher_count || ' teachers across all departments';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function
SELECT seed_dummy_teachers();

-- Also create some Admin users
DO $$
DECLARE
    new_user_id UUID;
    role_id_val UUID;
BEGIN
    -- Super Admin (if not exists)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'superadmin@jpmcollege.edu') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, 
            encrypted_password, email_confirmed_at, 
            created_at, updated_at, confirmation_token,
            email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(), 'authenticated', 'authenticated',
            'superadmin@jpmcollege.edu',
            crypt('Admin@123', gen_salt('bf')),
            NOW(), NOW(), NOW(), '', '', '', ''
        ) RETURNING id INTO new_user_id;
        
        UPDATE profiles SET 
            full_name = 'Super Administrator',
            phone = '+919999000001',
            primary_role = 'super_admin',
            status = 'active'
        WHERE id = new_user_id;
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'super_admin' LIMIT 1;
        INSERT INTO user_roles (user_id, role_id, is_active)
        VALUES (new_user_id, role_id_val, true);
    END IF;
    
    -- Principal
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'principal@jpmcollege.edu') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, 
            encrypted_password, email_confirmed_at, 
            created_at, updated_at, confirmation_token,
            email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(), 'authenticated', 'authenticated',
            'principal@jpmcollege.edu',
            crypt('Admin@123', gen_salt('bf')),
            NOW(), NOW(), NOW(), '', '', '', ''
        ) RETURNING id INTO new_user_id;
        
        UPDATE profiles SET 
            full_name = 'Dr. Principal',
            phone = '+919999000002',
            primary_role = 'principal',
            status = 'active'
        WHERE id = new_user_id;
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'principal' LIMIT 1;
        INSERT INTO user_roles (user_id, role_id, is_active)
        VALUES (new_user_id, role_id_val, true);
    END IF;
    
    -- Exam Cell Admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'examcell@jpmcollege.edu') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, 
            encrypted_password, email_confirmed_at, 
            created_at, updated_at, confirmation_token,
            email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(), 'authenticated', 'authenticated',
            'examcell@jpmcollege.edu',
            crypt('Admin@123', gen_salt('bf')),
            NOW(), NOW(), NOW(), '', '', '', ''
        ) RETURNING id INTO new_user_id;
        
        UPDATE profiles SET 
            full_name = 'Exam Cell Admin',
            phone = '+919999000003',
            primary_role = 'exam_cell_admin',
            status = 'active'
        WHERE id = new_user_id;
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'exam_cell_admin' LIMIT 1;
        INSERT INTO user_roles (user_id, role_id, is_active)
        VALUES (new_user_id, role_id_val, true);
    END IF;
    
    -- Library Admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'library@jpmcollege.edu') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, 
            encrypted_password, email_confirmed_at, 
            created_at, updated_at, confirmation_token,
            email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(), 'authenticated', 'authenticated',
            'library@jpmcollege.edu',
            crypt('Admin@123', gen_salt('bf')),
            NOW(), NOW(), NOW(), '', '', '', ''
        ) RETURNING id INTO new_user_id;
        
        UPDATE profiles SET 
            full_name = 'Library Admin',
            phone = '+919999000004',
            primary_role = 'library_admin',
            status = 'active'
        WHERE id = new_user_id;
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'library_admin' LIMIT 1;
        INSERT INTO user_roles (user_id, role_id, is_active)
        VALUES (new_user_id, role_id_val, true);
    END IF;
    
    -- Finance Admin
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'finance@jpmcollege.edu') THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, 
            encrypted_password, email_confirmed_at, 
            created_at, updated_at, confirmation_token,
            email_change, email_change_token_new, recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(), 'authenticated', 'authenticated',
            'finance@jpmcollege.edu',
            crypt('Admin@123', gen_salt('bf')),
            NOW(), NOW(), NOW(), '', '', '', ''
        ) RETURNING id INTO new_user_id;
        
        UPDATE profiles SET 
            full_name = 'Finance Admin',
            phone = '+919999000005',
            primary_role = 'finance_admin',
            status = 'active'
        WHERE id = new_user_id;
        
        SELECT id INTO role_id_val FROM roles WHERE name = 'finance_admin' LIMIT 1;
        INSERT INTO user_roles (user_id, role_id, is_active)
        VALUES (new_user_id, role_id_val, true);
    END IF;
END $$;

-- Verify teachers were created
SELECT 
    t.employee_id,
    p.full_name,
    p.email,
    p.primary_role,
    d.code as department,
    t.designation
FROM teachers t
JOIN profiles p ON t.user_id = p.id
JOIN departments d ON t.department_id = d.id
ORDER BY d.code, p.primary_role;

-- Summary count
SELECT 
    d.code as department,
    COUNT(DISTINCT t.id) as teacher_count
FROM departments d
LEFT JOIN teachers t ON t.department_id = d.id
GROUP BY d.code
ORDER BY d.code;

-- Role distribution
SELECT 
    p.primary_role,
    COUNT(*) as count
FROM profiles p
WHERE p.primary_role IN ('hod', 'subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'super_admin', 'principal', 'exam_cell_admin', 'library_admin', 'finance_admin')
GROUP BY p.primary_role
ORDER BY count DESC;
