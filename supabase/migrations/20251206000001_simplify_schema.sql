-- ============================================
-- SCHEMA SIMPLIFICATION MIGRATION
-- 1. Merge programs and courses -> courses become the primary table
-- 2. Remove sections concept (1 class per year)
-- 3. Update student table references
-- ============================================

-- ============================================
-- STEP 1: Add program fields to courses table (courses = programs now)
-- ============================================

-- Add program-related columns to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) DEFAULT 'undergraduate';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_years INTEGER DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_semesters INTEGER DEFAULT 6;

-- Create a view to get courses as programs (for backward compatibility during transition)
CREATE OR REPLACE VIEW programs_view AS
SELECT DISTINCT ON (department_id, code)
    id,
    code,
    name,
    short_name,
    program_type,
    department_id,
    duration_years,
    total_semesters,
    is_active,
    created_at,
    updated_at
FROM courses
WHERE program_type IS NOT NULL;

-- ============================================
-- STEP 2: Update students table - remove section_id requirement
-- ============================================

-- Make section_id nullable (we're removing sections concept)
ALTER TABLE students ALTER COLUMN section_id DROP NOT NULL;

-- Add program_id column if it doesn't exist (for backward compatibility during migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'program_id'
    ) THEN
        ALTER TABLE students ADD COLUMN program_id UUID REFERENCES courses(id);
    END IF;
END $$;

-- ============================================
-- STEP 3: Update teacher_courses - remove section_id requirement
-- ============================================

-- Make section_id nullable in teacher_courses
ALTER TABLE teacher_courses ALTER COLUMN section_id DROP NOT NULL;

-- ============================================
-- STEP 4: Create helper function to get course/program info
-- ============================================

CREATE OR REPLACE FUNCTION get_course_programs(dept_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    code VARCHAR,
    name VARCHAR,
    short_name VARCHAR,
    program_type VARCHAR,
    department_id UUID,
    department_name VARCHAR,
    duration_years INTEGER,
    total_semesters INTEGER,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.name,
        c.short_name,
        c.program_type,
        c.department_id,
        d.name as department_name,
        c.duration_years,
        c.total_semesters,
        c.is_active
    FROM courses c
    JOIN departments d ON c.department_id = d.id
    WHERE (dept_id IS NULL OR c.department_id = dept_id)
    AND c.program_type IS NOT NULL
    ORDER BY d.name, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Insert JPM College programs as courses
-- ============================================

-- Commerce Department Programs
INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BCOM_COOP', 'B.Com (Co-operation)', 'B.Com Coop', d.id, 'undergraduate', 3, 6, 
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BCOM_FT', 'B.Com (Finance & Taxation)', 'B.Com F&T', d.id, 'undergraduate', 3, 6,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BCOM_LM', 'B.Com (Logistics Management)', 'B.Com LM', d.id, 'undergraduate', 3, 6,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

-- English Department
INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BA_ENG', 'BA English (Cultural Studies & Film Studies)', 'BA English', d.id, 'undergraduate', 3, 6,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'ENG'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

-- Management Department
INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BBA', 'BBA', 'BBA', d.id, 'undergraduate', 3, 6,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'MGT'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

-- Computer Science Department
INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BCA', 'BCA', 'BCA', d.id, 'undergraduate', 3, 6,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'CS'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

-- Social Work Department
INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BSW', 'BSW (Development Social Work)', 'BSW', d.id, 'undergraduate', 3, 6,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'SW'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

-- Tourism Department
INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'BTTM', 'BTTM (Tour Operation & Aviation)', 'BTTM', d.id, 'undergraduate', 3, 6,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'TM'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'undergraduate',
    duration_years = 3,
    total_semesters = 6;

-- Postgraduate Programs
INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'MCOM_FT', 'M.Com (Finance & Taxation)', 'M.Com F&T', d.id, 'postgraduate', 2, 4,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'COM'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'postgraduate',
    duration_years = 2,
    total_semesters = 4;

INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'MSC_CS', 'M.Sc (Computer Science)', 'M.Sc CS', d.id, 'postgraduate', 2, 4,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'CS'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'postgraduate',
    duration_years = 2,
    total_semesters = 4;

INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'MA_ENG', 'MA (English Language & Literature)', 'MA English', d.id, 'postgraduate', 2, 4,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'ENG'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'postgraduate',
    duration_years = 2,
    total_semesters = 4;

INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'MA_HRM', 'MA (Human Resource Management)', 'MA HRM', d.id, 'postgraduate', 2, 4,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'MGT'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'postgraduate',
    duration_years = 2,
    total_semesters = 4;

INSERT INTO courses (code, name, short_name, department_id, program_type, duration_years, total_semesters, semester_id, course_type)
SELECT 'MSW', 'MSW (Social Work)', 'MSW', d.id, 'postgraduate', 2, 4,
       (SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1), 'core'
FROM departments d WHERE d.code = 'SW'
ON CONFLICT (code) DO UPDATE SET 
    program_type = 'postgraduate',
    duration_years = 2,
    total_semesters = 4;

-- ============================================
-- STEP 6: Update attendance_delegations to use course_id instead of program_id
-- ============================================

-- Add course_id if it doesn't exist
ALTER TABLE attendance_delegations ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- ============================================
-- STEP 7: Grant necessary permissions
-- ============================================

GRANT EXECUTE ON FUNCTION get_course_programs TO authenticated;
GRANT SELECT ON programs_view TO authenticated;
