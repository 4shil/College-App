-- Migration: Exam marks locking (per schedule + section)
-- Date: 2026-01-02
-- Purpose:
--  - Add a per-(exam_schedule_id, section_id) lock to prevent edits after final submit.
--  - Tighten teacher exam_marks policies to be section-aware and to respect locks.

-- =========================
-- LOCK TABLE
-- =========================

CREATE TABLE IF NOT EXISTS public.exam_marks_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  locked_by UUID REFERENCES public.profiles(id),
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_schedule_id, section_id)
);

ALTER TABLE IF EXISTS public.exam_marks_locks ENABLE ROW LEVEL SECURITY;

-- =========================
-- POLICIES: exam_marks_locks
-- =========================

DROP POLICY IF EXISTS "Admins full access exam_marks_locks" ON public.exam_marks_locks;
CREATE POLICY "Admins full access exam_marks_locks" ON public.exam_marks_locks
FOR ALL TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Teachers read exam marks locks" ON public.exam_marks_locks;
CREATE POLICY "Teachers read exam marks locks"
ON public.exam_marks_locks
FOR SELECT
TO authenticated
USING (
  is_teacher()
  AND EXISTS (
    SELECT 1
    FROM public.exam_schedules es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
     AND te.section_id = public.exam_marks_locks.section_id
     AND te.is_active = true
    JOIN public.teachers t ON t.id = te.teacher_id
    WHERE es.id = public.exam_marks_locks.exam_schedule_id
      AND t.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Teachers lock exam marks" ON public.exam_marks_locks;
CREATE POLICY "Teachers lock exam marks"
ON public.exam_marks_locks
FOR INSERT
TO authenticated
WITH CHECK (
  is_teacher()
  AND (public.exam_marks_locks.locked_by IS NULL OR public.exam_marks_locks.locked_by = auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.exam_schedules es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
     AND te.section_id = public.exam_marks_locks.section_id
     AND te.is_active = true
    JOIN public.teachers t ON t.id = te.teacher_id
    WHERE es.id = public.exam_marks_locks.exam_schedule_id
      AND t.user_id = auth.uid()
  )
);

-- =========================
-- POLICIES: exam_marks (teacher, section-aware + lock-aware)
-- =========================

ALTER TABLE IF EXISTS public.exam_marks ENABLE ROW LEVEL SECURITY;

-- Replace old broad teacher policy
DROP POLICY IF EXISTS "Teachers manage own exam marks" ON public.exam_marks;

DROP POLICY IF EXISTS "Teachers read exam marks" ON public.exam_marks;
CREATE POLICY "Teachers read exam marks"
ON public.exam_marks
FOR SELECT
TO authenticated
USING (
  is_teacher()
  AND EXISTS (
    SELECT 1
    FROM public.exam_schedules es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
     AND te.is_active = true
    JOIN public.teachers t ON t.id = te.teacher_id
    JOIN public.students s ON s.id = public.exam_marks.student_id
    WHERE es.id = public.exam_marks.exam_schedule_id
      AND t.user_id = auth.uid()
      AND s.section_id = te.section_id
  )
);

DROP POLICY IF EXISTS "Teachers insert exam marks" ON public.exam_marks;
CREATE POLICY "Teachers insert exam marks"
ON public.exam_marks
FOR INSERT
TO authenticated
WITH CHECK (
  is_teacher()
  AND public.exam_marks.verified_at IS NULL
  AND public.exam_marks.verified_by IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.exam_marks_locks l
    JOIN public.students s ON s.id = public.exam_marks.student_id
    WHERE l.exam_schedule_id = public.exam_marks.exam_schedule_id
      AND l.section_id = s.section_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.exam_schedules es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
     AND te.is_active = true
    JOIN public.teachers t ON t.id = te.teacher_id
    JOIN public.students s ON s.id = public.exam_marks.student_id
    WHERE es.id = public.exam_marks.exam_schedule_id
      AND t.user_id = auth.uid()
      AND s.section_id = te.section_id
  )
);

DROP POLICY IF EXISTS "Teachers update exam marks" ON public.exam_marks;
CREATE POLICY "Teachers update exam marks"
ON public.exam_marks
FOR UPDATE
TO authenticated
USING (
  is_teacher()
  AND public.exam_marks.verified_at IS NULL
  AND public.exam_marks.verified_by IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.exam_marks_locks l
    JOIN public.students s ON s.id = public.exam_marks.student_id
    WHERE l.exam_schedule_id = public.exam_marks.exam_schedule_id
      AND l.section_id = s.section_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.exam_schedules es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
     AND te.is_active = true
    JOIN public.teachers t ON t.id = te.teacher_id
    JOIN public.students s ON s.id = public.exam_marks.student_id
    WHERE es.id = public.exam_marks.exam_schedule_id
      AND t.user_id = auth.uid()
      AND s.section_id = te.section_id
  )
)
WITH CHECK (
  is_teacher()
  AND public.exam_marks.verified_at IS NULL
  AND public.exam_marks.verified_by IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.exam_marks_locks l
    JOIN public.students s ON s.id = public.exam_marks.student_id
    WHERE l.exam_schedule_id = public.exam_marks.exam_schedule_id
      AND l.section_id = s.section_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.exam_schedules es
    JOIN public.exams e ON e.id = es.exam_id
    JOIN public.timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
     AND te.is_active = true
    JOIN public.teachers t ON t.id = te.teacher_id
    JOIN public.students s ON s.id = public.exam_marks.student_id
    WHERE es.id = public.exam_marks.exam_schedule_id
      AND t.user_id = auth.uid()
      AND s.section_id = te.section_id
  )
);
