-- Extend courses table to support both degree programs and subject courses
-- Courses can be either degree programs (BCA, MCA) or individual subjects (Data Structures, etc.)

-- Create program level enum
CREATE TYPE program_level AS ENUM ('undergraduate', 'postgraduate', 'diploma', 'certificate', 'phd');

-- Add new columns to courses table for degree program support
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_level program_level;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_years INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_semesters INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_degree_program BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_seats INTEGER;

-- Make semester_id nullable for degree programs (they span multiple semesters)
ALTER TABLE courses ALTER COLUMN semester_id DROP NOT NULL;

-- Update students table to reference course (which can be a degree program)
-- Note: course_id in students table will now refer to their degree program
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_is_degree ON courses(is_degree_program);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);

-- Insert degree programs as courses
INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'BCA', 
    'Bachelor of Computer Applications', 
    'BCA',
    d.id,
    true,
    'undergraduate',
    3,
    6,
    true
FROM departments d WHERE d.code = 'CS' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'MCA', 
    'Master of Computer Applications', 
    'MCA',
    d.id,
    true,
    'postgraduate',
    2,
    4,
    true
FROM departments d WHERE d.code = 'CS' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'BBA', 
    'Bachelor of Business Administration', 
    'BBA',
    d.id,
    true,
    'undergraduate',
    3,
    6,
    true
FROM departments d WHERE d.code = 'MBA' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'MBA', 
    'Master of Business Administration', 
    'MBA',
    d.id,
    true,
    'postgraduate',
    2,
    4,
    true
FROM departments d WHERE d.code = 'MBA' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'BCOM', 
    'Bachelor of Commerce', 
    'B.Com',
    d.id,
    true,
    'undergraduate',
    3,
    6,
    true
FROM departments d WHERE d.code = 'COM' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'BSC-CS', 
    'Bachelor of Science in Computer Science', 
    'B.Sc CS',
    d.id,
    true,
    'undergraduate',
    3,
    6,
    true
FROM departments d WHERE d.code = 'CS' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'BTECH-CS', 
    'Bachelor of Technology in Computer Science', 
    'B.Tech CS',
    d.id,
    true,
    'undergraduate',
    4,
    8,
    true
FROM departments d WHERE d.code = 'CS' LIMIT 1
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (code, name, short_name, department_id, is_degree_program, program_level, duration_years, total_semesters, is_active) 
SELECT 
    'MTECH-CS', 
    'Master of Technology in Computer Science', 
    'M.Tech CS',
    d.id,
    true,
    'postgraduate',
    2,
    4,
    true
FROM departments d WHERE d.code = 'CS' LIMIT 1
ON CONFLICT (code) DO NOTHING;
