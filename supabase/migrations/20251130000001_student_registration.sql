-- ============================================
-- JPM COLLEGE - STUDENT REGISTRATION SYSTEM
-- Version: 1.0
-- Features: APAAR ID verification, OTP, Course/Department structure
-- ============================================

-- ============================================
-- 1. PROGRAM TYPE ENUM
-- ============================================

DO $$ BEGIN
    CREATE TYPE program_type AS ENUM ('undergraduate', 'postgraduate');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. UPDATE DEPARTMENTS FOR JPM COLLEGE
-- ============================================

-- First, delete teachers that reference the old departments
DELETE FROM teachers WHERE department_id IN (
    SELECT id FROM departments WHERE code IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'MBA', 'MCA')
);

-- Delete students that reference the old departments
DELETE FROM students WHERE department_id IN (
    SELECT id FROM departments WHERE code IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'MBA', 'MCA')
);

-- Delete teacher_courses that reference old departments via courses
DELETE FROM teacher_courses WHERE course_id IN (
    SELECT id FROM courses WHERE department_id IN (
        SELECT id FROM departments WHERE code IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'MBA', 'MCA')
    )
);

-- Delete courses that reference the old departments
DELETE FROM courses WHERE department_id IN (
    SELECT id FROM departments WHERE code IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'MBA', 'MCA')
);

-- Delete sections that reference the old departments
DELETE FROM sections WHERE department_id IN (
    SELECT id FROM departments WHERE code IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'MBA', 'MCA')
);

-- Delete user_roles referencing old departments
DELETE FROM user_roles WHERE department_id IN (
    SELECT id FROM departments WHERE code IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'MBA', 'MCA')
);

-- Now clear old sample departments
DELETE FROM departments WHERE code IN ('CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'MBA', 'MCA');

-- Insert JPM College departments
INSERT INTO departments (code, name, short_name) VALUES
('COM', 'Commerce', 'Commerce'),
('ENG', 'English', 'English'),
('MGT', 'Management', 'Management'),
('CS', 'Computer Science', 'Comp Sci'),
('SW', 'Social Work', 'Social Work'),
('TM', 'Tourism', 'Tourism')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name;

-- ============================================
-- 3. PROGRAMS/COURSES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    program_type program_type NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    duration_years INTEGER NOT NULL, -- 3 for UG, 2 for PG
    total_semesters INTEGER NOT NULL, -- 6 for UG, 4 for PG
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert JPM College Programs
INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BCOM_COOP', 'B.Com (Co-operation)', 'B.Com Coop', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BCOM_FT', 'B.Com (Finance & Taxation)', 'B.Com F&T', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BCOM_LM', 'B.Com (Logistics Management)', 'B.Com LM', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BA_ENG', 'BA English (Cultural Studies & Film Studies)', 'BA English', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'ENG'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BBA', 'BBA', 'BBA', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'MGT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BCA', 'BCA', 'BCA', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'CS'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BSW', 'BSW (Development Social Work & Multi Cultural Social Work)', 'BSW', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'SW'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'BTTM', 'BTTM (Tour Operation & Aviation Management)', 'BTTM', 'undergraduate', d.id, 3, 6
FROM departments d WHERE d.code = 'TM'
ON CONFLICT (code) DO NOTHING;

-- Postgraduate Programs
INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'MCOM_FT', 'M.Com (Finance & Taxation)', 'M.Com F&T', 'postgraduate', d.id, 2, 4
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'MSC_CS', 'M.Sc (Computer Science)', 'M.Sc CS', 'postgraduate', d.id, 2, 4
FROM departments d WHERE d.code = 'CS'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'MA_ENG', 'MA (English Language & Literature)', 'MA English', 'postgraduate', d.id, 2, 4
FROM departments d WHERE d.code = 'ENG'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'MA_HRM', 'MA (Human Resource Management)', 'MA HRM', 'postgraduate', d.id, 2, 4
FROM departments d WHERE d.code = 'MGT'
ON CONFLICT (code) DO NOTHING;

INSERT INTO programs (code, name, short_name, program_type, department_id, duration_years, total_semesters)
SELECT 'MSW', 'MSW (Social Work)', 'MSW', 'postgraduate', d.id, 2, 4
FROM departments d WHERE d.code = 'SW'
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 4. ALLOWED STUDENTS TABLE (APAAR ID Pre-registration)
-- ============================================

CREATE TABLE IF NOT EXISTS allowed_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apaar_id VARCHAR(50) NOT NULL UNIQUE,
    -- Optional fields for verification (admin can fill or leave empty)
    expected_name VARCHAR(100),
    expected_admission_no VARCHAR(50),
    expected_program_id UUID REFERENCES programs(id),
    -- Status
    is_used BOOLEAN DEFAULT false,
    used_by_user_id UUID REFERENCES auth.users(id),
    used_at TIMESTAMPTZ,
    -- Metadata
    added_by UUID REFERENCES auth.users(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allowed_students_apaar ON allowed_students(apaar_id);
CREATE INDEX IF NOT EXISTS idx_allowed_students_used ON allowed_students(is_used);

-- ============================================
-- 5. OTP VERIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL DEFAULT 'registration', -- 'registration', 'password_reset', 'email_change'
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    -- Registration data (stored temporarily until OTP verified)
    registration_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- ============================================
-- 6. ADD APAAR ID TO STUDENTS TABLE
-- ============================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS apaar_id VARCHAR(50) UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

CREATE INDEX IF NOT EXISTS idx_students_apaar ON students(apaar_id);
CREATE INDEX IF NOT EXISTS idx_students_program ON students(program_id);

-- ============================================
-- 7. ADMISSION NUMBER CONFIG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(50) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admission number format (changeable by admin)
INSERT INTO admission_config (config_key, config_value, description) VALUES
('admission_no_format', 'JPM{YEAR}{PROGRAM}{SERIAL}', 'Format: JPM2024BCA001'),
('admission_no_serial_length', '3', 'Number of digits for serial number'),
('admission_no_year_format', 'YYYY', 'Year format in admission number')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================
-- 8. FUNCTIONS FOR STUDENT REGISTRATION
-- ============================================

-- Function to verify APAAR ID
CREATE OR REPLACE FUNCTION verify_apaar_id(p_apaar_id VARCHAR)
RETURNS TABLE(
    is_valid BOOLEAN,
    is_already_used BOOLEAN,
    expected_name VARCHAR,
    expected_program_id UUID,
    message TEXT
) AS $$
DECLARE
    v_record allowed_students%ROWTYPE;
BEGIN
    -- Check if APAAR ID exists
    SELECT * INTO v_record FROM allowed_students WHERE apaar_id = p_apaar_id AND is_active = true;
    
    IF v_record.id IS NULL THEN
        RETURN QUERY SELECT false, false, NULL::VARCHAR, NULL::UUID, 'APAAR ID not found. Please contact college authorities.';
        RETURN;
    END IF;
    
    -- Check if already used
    IF v_record.is_used THEN
        RETURN QUERY SELECT false, true, v_record.expected_name, v_record.expected_program_id, 'APAAR ID already registered. Please login or contact authorities.';
        RETURN;
    END IF;
    
    -- Valid and available
    RETURN QUERY SELECT true, false, v_record.expected_name, v_record.expected_program_id, 'APAAR ID verified successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate OTP (stores registration data only - OTP sent by Supabase Auth)
CREATE OR REPLACE FUNCTION generate_otp(p_email VARCHAR, p_purpose VARCHAR, p_registration_data JSONB DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_expires_at := NOW() + INTERVAL '10 minutes';
    
    -- Delete any existing unverified records for this email/purpose
    DELETE FROM otp_verifications 
    WHERE email = p_email AND purpose = p_purpose AND is_verified = false;
    
    -- Insert new record to store registration data
    -- OTP is sent by Supabase Auth, we just store the registration data
    INSERT INTO otp_verifications (email, otp_code, purpose, expires_at, registration_data)
    VALUES (p_email, '000000', p_purpose, v_expires_at, p_registration_data);
    
    RETURN QUERY SELECT true, 'Registration data stored successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify OTP (kept for backwards compatibility, but Supabase Auth handles verification)
CREATE OR REPLACE FUNCTION verify_otp(p_email VARCHAR, p_otp VARCHAR, p_purpose VARCHAR)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    registration_data JSONB
) AS $$
DECLARE
    v_record otp_verifications%ROWTYPE;
BEGIN
    -- Get registration data record
    SELECT * INTO v_record 
    FROM otp_verifications 
    WHERE email = p_email AND purpose = p_purpose
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_record.id IS NULL THEN
        RETURN QUERY SELECT false, 'No registration data found.', NULL::JSONB;
        RETURN;
    END IF;
    
    -- Return the registration data (Supabase Auth handles actual OTP verification)
    RETURN QUERY SELECT true, 'Data retrieved successfully.', v_record.registration_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete student registration after OTP verification
CREATE OR REPLACE FUNCTION complete_student_registration(
    p_user_id UUID,
    p_apaar_id VARCHAR,
    p_registration_data JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    v_program_id UUID;
    v_department_id UUID;
    v_year_id UUID;
    v_semester_id UUID;
    v_student_role_id UUID;
    v_academic_year_id UUID;
BEGIN
    -- Get program info
    SELECT id, department_id INTO v_program_id, v_department_id
    FROM programs WHERE id = (p_registration_data->>'program_id')::UUID;
    
    IF v_program_id IS NULL THEN
        RETURN QUERY SELECT false, 'Invalid program selected.';
        RETURN;
    END IF;
    
    -- Get year and semester
    SELECT id INTO v_year_id FROM years WHERE year_number = (p_registration_data->>'year')::INTEGER;
    SELECT id INTO v_semester_id FROM semesters WHERE semester_number = (p_registration_data->>'semester')::INTEGER;
    SELECT id INTO v_student_role_id FROM roles WHERE name = 'student';
    SELECT id INTO v_academic_year_id FROM academic_years WHERE is_current = true;
    
    -- Update profile
    UPDATE profiles SET
        full_name = p_registration_data->>'full_name',
        phone = p_registration_data->>'phone',
        date_of_birth = (p_registration_data->>'date_of_birth')::DATE,
        gender = (p_registration_data->>'gender')::gender_type,
        primary_role = 'student',
        status = 'active'
    WHERE id = p_user_id;
    
    -- Create student record
    INSERT INTO students (
        user_id,
        apaar_id,
        registration_number,
        roll_number,
        program_id,
        department_id,
        year_id,
        semester_id,
        academic_year_id,
        admission_year,
        admission_date,
        father_name,
        current_status
    ) VALUES (
        p_user_id,
        p_apaar_id,
        p_registration_data->>'admission_no',
        p_registration_data->>'roll_number',
        v_program_id,
        v_department_id,
        v_year_id,
        v_semester_id,
        v_academic_year_id,
        EXTRACT(YEAR FROM NOW())::INTEGER,
        NOW(),
        p_registration_data->>'father_name',
        'active'
    );
    
    -- Assign student role
    INSERT INTO user_roles (user_id, role_id, department_id)
    VALUES (p_user_id, v_student_role_id, v_department_id)
    ON CONFLICT DO NOTHING;
    
    -- Mark APAAR ID as used
    UPDATE allowed_students SET
        is_used = true,
        used_by_user_id = p_user_id,
        used_at = NOW()
    WHERE apaar_id = p_apaar_id;
    
    RETURN QUERY SELECT true, 'Registration completed successfully!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. RLS POLICIES FOR NEW TABLES
-- ============================================

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to allow re-running
DROP POLICY IF EXISTS "Anyone can read programs" ON programs;
DROP POLICY IF EXISTS "Admins manage allowed_students" ON allowed_students;
DROP POLICY IF EXISTS "Service role manages OTP" ON otp_verifications;
DROP POLICY IF EXISTS "Admins manage admission_config" ON admission_config;
DROP POLICY IF EXISTS "Public can read programs" ON programs;
DROP POLICY IF EXISTS "Public can read departments" ON departments;

-- Programs: Anyone can read
CREATE POLICY "Anyone can read programs" ON programs
    FOR SELECT USING (true);

-- Allowed students: Only admins can manage
CREATE POLICY "Admins manage allowed_students" ON allowed_students
    FOR ALL USING (is_admin());

-- OTP: Service role only (handled by functions)
CREATE POLICY "Service role manages OTP" ON otp_verifications
    FOR ALL USING (false); -- All access through functions

-- Admission config: Only admins
CREATE POLICY "Admins manage admission_config" ON admission_config
    FOR ALL USING (is_admin());

-- Allow reading programs without auth (for registration form)
CREATE POLICY "Public can read programs" ON programs
    FOR SELECT TO anon USING (is_active = true);

-- Allow reading departments without auth (for registration form)
CREATE POLICY "Public can read departments" ON departments
    FOR SELECT TO anon USING (is_active = true);

-- ============================================
-- 10. SAMPLE ALLOWED STUDENTS (for testing)
-- ============================================

-- Insert some test APAAR IDs
INSERT INTO allowed_students (apaar_id, expected_name, notes) VALUES
('APAAR001', 'Test Student 1', 'Test account'),
('APAAR002', 'Test Student 2', 'Test account'),
('APAAR003', 'Test Student 3', 'Test account')
ON CONFLICT (apaar_id) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
