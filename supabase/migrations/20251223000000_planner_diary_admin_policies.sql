-- Add missing admin policies for lesson_planners and work_diaries
-- The extended schema migration added teacher-only policies, which blocks admin monitoring screens.

DO $$
BEGIN
  IF to_regclass('public.lesson_planners') IS NOT NULL THEN
    ALTER TABLE lesson_planners ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins full access planners" ON lesson_planners;
    CREATE POLICY "Admins full access planners" ON lesson_planners
      FOR ALL
      USING (is_admin());
  END IF;

  IF to_regclass('public.work_diaries') IS NOT NULL THEN
    ALTER TABLE work_diaries ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins full access diaries" ON work_diaries;
    CREATE POLICY "Admins full access diaries" ON work_diaries
      FOR ALL
      USING (is_admin());
  END IF;
END $$;
