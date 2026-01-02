-- Planner/Diary Approvals (HOD + Principal)
-- Adds RPC functions for approvals and tightens RLS so approvals are backend-enforced.

-- 1) Replace overly-broad admin ALL policies with SELECT-only policies
DO $$
BEGIN
  IF to_regclass('public.lesson_planners') IS NOT NULL THEN
    ALTER TABLE public.lesson_planners ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins full access planners" ON public.lesson_planners;
    DROP POLICY IF EXISTS "Admins read planners" ON public.lesson_planners;

    CREATE POLICY "Admins read planners" ON public.lesson_planners
      FOR SELECT
      USING (is_admin());
  END IF;

  IF to_regclass('public.work_diaries') IS NOT NULL THEN
    ALTER TABLE public.work_diaries ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins full access diaries" ON public.work_diaries;
    DROP POLICY IF EXISTS "Admins read diaries" ON public.work_diaries;

    CREATE POLICY "Admins read diaries" ON public.work_diaries
      FOR SELECT
      USING (is_admin());
  END IF;
END $$;

-- 2) RPC: approve/reject lesson planner
CREATE OR REPLACE FUNCTION public.approve_lesson_planner(
  p_planner_id UUID,
  p_decision TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF NOT (
    has_permission(auth.uid(), 'approve_planner_level_1')
    OR has_permission(auth.uid(), 'approve_planner_final')
  ) THEN
    RETURN QUERY SELECT false, 'Not authorized.';
    RETURN;
  END IF;

  SELECT status INTO v_status
  FROM public.lesson_planners
  WHERE id = p_planner_id
  LIMIT 1;

  IF v_status IS NULL THEN
    RETURN QUERY SELECT false, 'Lesson planner not found.';
    RETURN;
  END IF;

  IF v_status <> 'submitted' THEN
    RETURN QUERY SELECT false, 'Planner is not in submitted status.';
    RETURN;
  END IF;

  IF p_decision = 'approve' THEN
    UPDATE public.lesson_planners
    SET status = 'approved',
        approved_by = auth.uid(),
        approved_at = NOW(),
        rejection_reason = NULL,
        updated_at = NOW()
    WHERE id = p_planner_id;

    RETURN QUERY SELECT true, 'Planner approved.';
    RETURN;
  ELSIF p_decision = 'reject' THEN
    UPDATE public.lesson_planners
    SET status = 'rejected',
        approved_by = NULL,
        approved_at = NULL,
        rejection_reason = NULLIF(btrim(p_reason), ''),
        updated_at = NOW()
    WHERE id = p_planner_id;

    RETURN QUERY SELECT true, 'Planner rejected.';
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'Invalid decision. Use approve|reject.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_lesson_planner(UUID, TEXT, TEXT) TO authenticated;

-- 3) RPC: approve/reject work diary (HOD level-1, Principal final)
CREATE OR REPLACE FUNCTION public.approve_work_diary(
  p_diary_id UUID,
  p_decision TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_can_hod BOOLEAN;
  v_can_principal BOOLEAN;
BEGIN
  v_can_hod := has_permission(auth.uid(), 'approve_diary_level_1');
  v_can_principal := has_permission(auth.uid(), 'approve_diary_final');

  IF NOT (v_can_hod OR v_can_principal) THEN
    RETURN QUERY SELECT false, 'Not authorized.';
    RETURN;
  END IF;

  SELECT status INTO v_status
  FROM public.work_diaries
  WHERE id = p_diary_id
  LIMIT 1;

  IF v_status IS NULL THEN
    RETURN QUERY SELECT false, 'Work diary not found.';
    RETURN;
  END IF;

  IF p_decision = 'approve' THEN
    -- Principal approval
    IF v_can_principal THEN
      IF v_status <> 'hod_approved' THEN
        RETURN QUERY SELECT false, 'Diary must be HOD-approved before principal approval.';
        RETURN;
      END IF;

      UPDATE public.work_diaries
      SET status = 'principal_approved',
          principal_approved_by = auth.uid(),
          principal_approved_at = NOW(),
          rejection_reason = NULL,
          updated_at = NOW()
      WHERE id = p_diary_id;

      RETURN QUERY SELECT true, 'Diary principal-approved.';
      RETURN;
    END IF;

    -- HOD approval
    IF v_can_hod THEN
      IF v_status <> 'submitted' THEN
        RETURN QUERY SELECT false, 'Diary is not in submitted status.';
        RETURN;
      END IF;

      UPDATE public.work_diaries
      SET status = 'hod_approved',
          hod_approved_by = auth.uid(),
          hod_approved_at = NOW(),
          rejection_reason = NULL,
          updated_at = NOW()
      WHERE id = p_diary_id;

      RETURN QUERY SELECT true, 'Diary HOD-approved.';
      RETURN;
    END IF;
  ELSIF p_decision = 'reject' THEN
    -- Reject at the appropriate stage
    IF v_can_principal AND v_status = 'hod_approved' THEN
      UPDATE public.work_diaries
      SET status = 'rejected',
          principal_approved_by = NULL,
          principal_approved_at = NULL,
          rejection_reason = NULLIF(btrim(p_reason), ''),
          updated_at = NOW()
      WHERE id = p_diary_id;

      RETURN QUERY SELECT true, 'Diary rejected (principal stage).';
      RETURN;
    END IF;

    IF v_can_hod AND v_status = 'submitted' THEN
      UPDATE public.work_diaries
      SET status = 'rejected',
          hod_approved_by = NULL,
          hod_approved_at = NULL,
          principal_approved_by = NULL,
          principal_approved_at = NULL,
          rejection_reason = NULLIF(btrim(p_reason), ''),
          updated_at = NOW()
      WHERE id = p_diary_id;

      RETURN QUERY SELECT true, 'Diary rejected (HOD stage).';
      RETURN;
    END IF;

    RETURN QUERY SELECT false, 'Diary cannot be rejected in its current status for your role.';
    RETURN;
  END IF;

  RETURN QUERY SELECT false, 'Invalid decision. Use approve|reject.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_work_diary(UUID, TEXT, TEXT) TO authenticated;
