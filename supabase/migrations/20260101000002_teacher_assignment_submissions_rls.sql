-- Migration: Teacher access to assignment submissions (grading)
-- Date: 2026-01-01
-- Purpose:
--  - Teachers can read submissions for assignments they own
--  - Teachers can grade submissions (marks/feedback) for assignments they own

ALTER TABLE IF EXISTS public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS "Teachers can view submissions for own assignments" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Teachers can grade submissions for own assignments" ON public.assignment_submissions;

-- Teachers can SELECT submissions where the assignment belongs to them
CREATE POLICY "Teachers can view submissions for own assignments"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE a.id = public.assignment_submissions.assignment_id
      AND t.user_id = auth.uid()
  )
);

-- Teachers can UPDATE submissions where the assignment belongs to them
CREATE POLICY "Teachers can grade submissions for own assignments"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE a.id = public.assignment_submissions.assignment_id
      AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE a.id = public.assignment_submissions.assignment_id
      AND t.user_id = auth.uid()
  )
);
