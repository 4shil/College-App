-- Migration: Attendance claim fields (programme_id + department_id)
-- Date: 2025-12-26
-- Purpose:
--  - Keep attendance tied to the taught subject via attendance.course_id (existing)
--  - Additionally store the degree programme (programme_id) and department (department_id)
--    to support consistent filtering/auditing/reporting.
--
-- Notes:
--  - This migration is defensive and non-breaking: it only adds nullable columns + indexes.
--  - programme_id references public.courses(id) because degree programmes are stored in courses.

DO $$
BEGIN
  -- attendance.programme_id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance'
      AND column_name = 'programme_id'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN programme_id UUID;
  END IF;

  -- attendance.department_id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendance'
      AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.attendance ADD COLUMN department_id UUID;
  END IF;

  -- FK: attendance.programme_id -> courses.id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'attendance'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'programme_id'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_programme_id_fkey
      FOREIGN KEY (programme_id) REFERENCES public.courses(id)
      ON DELETE SET NULL;
  END IF;

  -- FK: attendance.department_id -> departments.id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'attendance'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'department_id'
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES public.departments(id)
      ON DELETE SET NULL;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_attendance_programme_id ON public.attendance(programme_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_department_id ON public.attendance(department_id);
END $$;

-- Backfill (best-effort) for legacy rows
-- If attendance.course_id was historically used to store the degree programme id,
-- copy it into attendance.programme_id when it looks like a degree programme.
UPDATE public.attendance a
SET programme_id = a.course_id
FROM public.courses c
WHERE a.programme_id IS NULL
  AND a.course_id = c.id
  AND c.program_type IS NOT NULL;

-- Fill department_id from programme when missing.
UPDATE public.attendance a
SET department_id = c.department_id
FROM public.courses c
WHERE a.department_id IS NULL
  AND a.programme_id = c.id;

DO $$
BEGIN
  -- timetable_entries.programme_id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'programme_id'
  ) THEN
    ALTER TABLE public.timetable_entries ADD COLUMN programme_id UUID;
  END IF;

  -- FK: timetable_entries.programme_id -> courses.id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'timetable_entries'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'programme_id'
  ) THEN
    ALTER TABLE public.timetable_entries
      ADD CONSTRAINT timetable_entries_programme_id_fkey
      FOREIGN KEY (programme_id) REFERENCES public.courses(id)
      ON DELETE SET NULL;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_timetable_entries_programme_id ON public.timetable_entries(programme_id);
END $$;

-- Backfill (best-effort) for legacy rows
-- If timetable_entries.course_id was historically used to store the degree programme id,
-- copy it into timetable_entries.programme_id when it looks like a degree programme.
UPDATE public.timetable_entries t
SET programme_id = t.course_id
FROM public.courses c
WHERE t.programme_id IS NULL
  AND t.course_id = c.id
  AND c.program_type IS NOT NULL;
