-- Migration: Fix timetable indexes (safe)
-- Date: 2025-12-26
-- Purpose: Some older migrations create indexes on columns that may not exist (e.g., program_id).
-- This migration removes the legacy index and adds safe, commonly used indexes.

DO $$
BEGIN
  -- Drop legacy index if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_timetable_program'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.idx_timetable_program';
  END IF;

  -- Add safe indexes used by teacher/student timetable queries
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'teacher_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_timetable_entries_teacher ON public.timetable_entries(teacher_id)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'section_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_timetable_entries_section ON public.timetable_entries(section_id)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'academic_year_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_timetable_entries_academic_year ON public.timetable_entries(academic_year_id)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'day_of_week'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'period'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_timetable_entries_day_period ON public.timetable_entries(day_of_week, period)';
  END IF;
END $$;
