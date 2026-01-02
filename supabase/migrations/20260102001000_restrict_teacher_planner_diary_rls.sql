-- Restrict teacher mutations for lesson planners & work diaries
-- Ensures approvals cannot be bypassed by direct teacher UPDATEs.

DO $$
BEGIN
  IF to_regclass('public.lesson_planners') IS NOT NULL THEN
    ALTER TABLE public.lesson_planners ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Teachers manage own planners" ON public.lesson_planners;
    DROP POLICY IF EXISTS "Teachers read own planners" ON public.lesson_planners;
    DROP POLICY IF EXISTS "Teachers insert own planners" ON public.lesson_planners;
    DROP POLICY IF EXISTS "Teachers update own planners limited" ON public.lesson_planners;

    CREATE POLICY "Teachers read own planners" ON public.lesson_planners
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = lesson_planners.teacher_id
        )
      );

    CREATE POLICY "Teachers insert own planners" ON public.lesson_planners
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = lesson_planners.teacher_id
        )
        AND status = 'draft'
        AND approved_by IS NULL
        AND approved_at IS NULL
        AND rejection_reason IS NULL
      );

    CREATE POLICY "Teachers update own planners limited" ON public.lesson_planners
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = lesson_planners.teacher_id
        )
        AND status IN ('draft', 'rejected')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = lesson_planners.teacher_id
        )
        AND status IN ('draft', 'submitted')
        AND approved_by IS NULL
        AND approved_at IS NULL
        AND rejection_reason IS NULL
      );
  END IF;

  IF to_regclass('public.work_diaries') IS NOT NULL THEN
    ALTER TABLE public.work_diaries ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Teachers manage own diaries" ON public.work_diaries;
    DROP POLICY IF EXISTS "Teachers read own diaries" ON public.work_diaries;
    DROP POLICY IF EXISTS "Teachers insert own diaries" ON public.work_diaries;
    DROP POLICY IF EXISTS "Teachers update own diaries limited" ON public.work_diaries;

    CREATE POLICY "Teachers read own diaries" ON public.work_diaries
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = work_diaries.teacher_id
        )
      );

    CREATE POLICY "Teachers insert own diaries" ON public.work_diaries
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = work_diaries.teacher_id
        )
        AND status = 'draft'
        AND hod_approved_by IS NULL
        AND hod_approved_at IS NULL
        AND principal_approved_by IS NULL
        AND principal_approved_at IS NULL
        AND rejection_reason IS NULL
      );

    CREATE POLICY "Teachers update own diaries limited" ON public.work_diaries
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = work_diaries.teacher_id
        )
        AND status IN ('draft', 'rejected')
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.teachers t
          WHERE t.user_id = auth.uid()
            AND t.id = work_diaries.teacher_id
        )
        AND status IN ('draft', 'submitted')
        AND hod_approved_by IS NULL
        AND hod_approved_at IS NULL
        AND principal_approved_by IS NULL
        AND principal_approved_at IS NULL
        AND rejection_reason IS NULL
      );
  END IF;
END $$;
