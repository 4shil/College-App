-- Migrate programs data to courses table
-- This migration moves all degree programs from the programs table to the courses table
-- with program_type field set appropriately
-- Run this in Supabase SQL Editor with RLS disabled

-- Get the first semester ID to use for all degree programs
DO $$
DECLARE
  first_semester_id UUID;
  program_record RECORD;
  programs_exist BOOLEAN;
BEGIN
  -- Check if programs table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'programs'
  ) INTO programs_exist;

  IF NOT programs_exist THEN
    RAISE NOTICE '⚠️ Programs table does not exist. Skipping migration.';
    RETURN;
  END IF;

  -- Get first semester
  SELECT id INTO first_semester_id
  FROM semesters
  ORDER BY semester_number ASC
  LIMIT 1;

  RAISE NOTICE 'Using semester_id: %', first_semester_id;

  -- Insert all programs as courses with program_type
  FOR program_record IN
    SELECT * FROM programs WHERE NOT EXISTS (
      SELECT 1 FROM courses WHERE courses.id = programs.id
    )
  LOOP
    INSERT INTO courses (
      id,
      code,
      name,
      short_name,
      department_id,
      semester_id,
      program_type,
      duration_years,
      total_semesters,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      program_record.id,
      program_record.code,
      program_record.name,
      program_record.short_name,
      program_record.department_id,
      first_semester_id,
      program_record.program_type,
      program_record.duration_years,
      program_record.total_semesters,
      program_record.is_active,
      program_record.created_at,
      program_record.updated_at
    );
    
    RAISE NOTICE 'Migrated: %', program_record.name;
  END LOOP;
  
  -- Verify the migration
  DECLARE
    program_count INTEGER;
    course_count INTEGER;
  BEGIN
    IF programs_exist THEN
      SELECT COUNT(*) INTO program_count FROM programs;
      SELECT COUNT(*) INTO course_count FROM courses WHERE program_type IS NOT NULL;
      RAISE NOTICE '✅ Migration complete: % programs -> % courses with program_type', program_count, course_count;
    ELSE
      RAISE NOTICE '✅ Migration skipped - programs table already removed';
    END IF;
  END;
END $$;