-- Migration: Canonical timetable (section-based) + 5 periods
-- Date: 2025-12-26
-- Target: MGU Kottayam (5 periods/day)
-- Goal:
--  - Make `sections` the canonical class identity
--  - Ensure timetable/attendance can be keyed by `section_id`
--  - Enforce day_of_week 1..5 and period 1..5
-- Notes:
--  - This migration is defensive: it only adds missing columns and adjusts check constraints.

-- ============================================
-- 1) TIMETABLE ENTRIES
-- ============================================

DO $$
DECLARE
  c_name TEXT;
BEGIN
  -- Ensure section_id exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'section_id'
  ) THEN
    ALTER TABLE public.timetable_entries ADD COLUMN section_id UUID;
  END IF;

  -- Ensure FK (if possible)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'timetable_entries' AND column_name = 'section_id'
  ) THEN
    -- Add FK only if not already present
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'timetable_entries'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'section_id'
    ) THEN
      ALTER TABLE public.timetable_entries
        ADD CONSTRAINT timetable_entries_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.sections(id)
        ON DELETE SET NULL;
    END IF;
  END IF;

  -- Drop existing CHECK constraints that mention day_of_week/period
  FOR c_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.timetable_entries'::regclass
      AND contype = 'c'
      AND (
        pg_get_constraintdef(oid) ILIKE '%day_of_week%'
        OR pg_get_constraintdef(oid) ILIKE '%period%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.timetable_entries DROP CONSTRAINT IF EXISTS %I', c_name);
  END LOOP;

  -- Add canonical constraints (MGU: Monday-Friday, 5 periods)
  ALTER TABLE public.timetable_entries
    ADD CONSTRAINT timetable_entries_day_of_week_1_5 CHECK (day_of_week BETWEEN 1 AND 5);

  ALTER TABLE public.timetable_entries
    ADD CONSTRAINT timetable_entries_period_1_5 CHECK (period BETWEEN 1 AND 5);

  -- Helpful indexes (IF NOT EXISTS)
  CREATE INDEX IF NOT EXISTS idx_timetable_entries_teacher ON public.timetable_entries(teacher_id);
  CREATE INDEX IF NOT EXISTS idx_timetable_entries_section ON public.timetable_entries(section_id);
  CREATE INDEX IF NOT EXISTS idx_timetable_entries_academic_year ON public.timetable_entries(academic_year_id);
  CREATE INDEX IF NOT EXISTS idx_timetable_entries_day_period ON public.timetable_entries(day_of_week, period);
END $$;

-- ============================================
-- 2) ATTENDANCE
-- ============================================

DO $$
DECLARE
  c_name TEXT;
BEGIN
  -- Ensure section_id exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance'
      AND column_name = 'section_id'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN section_id UUID;
  END IF;

  -- Ensure FK (if possible)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'section_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'attendance'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'section_id'
    ) THEN
      ALTER TABLE public.attendance
        ADD CONSTRAINT attendance_section_id_fkey
        FOREIGN KEY (section_id) REFERENCES public.sections(id)
        ON DELETE SET NULL;
    END IF;
  END IF;

  -- Drop existing CHECK constraints that mention period
  FOR c_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.attendance'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%period%'
  LOOP
    EXECUTE format('ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS %I', c_name);
  END LOOP;

  -- Add canonical 1..5 period constraint
  ALTER TABLE public.attendance
    ADD CONSTRAINT attendance_period_1_5 CHECK (period BETWEEN 1 AND 5);

  CREATE INDEX IF NOT EXISTS idx_attendance_section ON public.attendance(section_id);
END $$;
