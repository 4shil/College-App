-- Migration: Remove Programs Table and Use Only Courses
-- Date: 2025-12-06
-- Purpose: Eliminate the deprecated "programs" table and use "courses" table exclusively
-- All degree programs (BCA, BBA, MBA, etc.) are stored in the courses table with program_type field

-- Step 1: Drop all foreign key constraints referencing programs table
DO $$
BEGIN
    -- Drop FK from students.program_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%students%program%' 
        AND table_name = 'students'
    ) THEN
        ALTER TABLE students DROP CONSTRAINT IF EXISTS students_program_id_fkey CASCADE;
    END IF;

    -- Drop FK from attendance.program_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%attendance%program%' 
        AND table_name = 'attendance'
    ) THEN
        ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_program_id_fkey CASCADE;
    END IF;

    -- Drop FK from timetable_entries.program_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%timetable%program%' 
        AND table_name = 'timetable_entries'
    ) THEN
        ALTER TABLE timetable_entries DROP CONSTRAINT IF EXISTS timetable_entries_program_id_fkey CASCADE;
    END IF;

    -- Drop FK from attendance_delegations.program_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%attendance_delegations%program%' 
        AND table_name = 'attendance_delegations'
    ) THEN
        ALTER TABLE attendance_delegations DROP CONSTRAINT IF EXISTS attendance_delegations_program_id_fkey CASCADE;
    END IF;
END $$;

-- Step 2: Update all program_id columns to reference courses table instead
-- (courses table with program_type IS the degree programs table)

-- Update students.program_id to reference courses
ALTER TABLE students DROP COLUMN IF EXISTS program_id CASCADE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);

-- Update attendance.program_id to reference courses  
ALTER TABLE attendance DROP COLUMN IF EXISTS program_id CASCADE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
CREATE INDEX IF NOT EXISTS idx_attendance_course ON attendance(course_id);

-- Update timetable_entries.program_id to reference courses
ALTER TABLE timetable_entries DROP COLUMN IF EXISTS program_id CASCADE;
ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
CREATE INDEX IF NOT EXISTS idx_timetable_course ON timetable_entries(course_id);

-- Update attendance_delegations.program_id to reference courses
ALTER TABLE attendance_delegations DROP COLUMN IF EXISTS program_id CASCADE;
ALTER TABLE attendance_delegations ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- Step 3: Drop the programs table and related objects
DROP VIEW IF EXISTS programs_view CASCADE;
DROP FUNCTION IF EXISTS get_course_programs CASCADE;
DROP TABLE IF EXISTS programs CASCADE;

-- Step 4: Update comments
COMMENT ON COLUMN courses.program_type IS 'Type of degree program: undergraduate or postgraduate. Courses with program_type are degree programs (BCA, BBA, MBA, etc.)';
COMMENT ON TABLE courses IS 'Courses table serves dual purpose: 1) Degree programs (when program_type is set) like BCA, BBA, MBA. 2) Individual subjects within those programs.';

-- Step 5: Create helper function to get degree programs (courses with program_type)
CREATE OR REPLACE FUNCTION get_degree_programs(dept_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    code VARCHAR,
    name VARCHAR,
    short_name VARCHAR,
    department_id UUID,
    department_name VARCHAR,
    program_type VARCHAR,
    duration_years INTEGER,
    total_semesters INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.name,
        c.short_name,
        c.department_id,
        d.name as department_name,
        c.program_type,
        c.duration_years,
        c.total_semesters
    FROM courses c
    JOIN departments d ON c.department_id = d.id
    WHERE c.is_active = true
    AND c.program_type IS NOT NULL
    AND (dept_id IS NULL OR c.department_id = dept_id)
    ORDER BY c.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_degree_programs TO authenticated;

-- Step 6: Verify no more references to programs table exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs') THEN
        RAISE EXCEPTION 'Programs table still exists! Migration failed.';
    END IF;
    
    RAISE NOTICE 'SUCCESS: Programs table removed. All degree programs now in courses table with program_type field.';
END $$;
