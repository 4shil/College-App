-- Migration: Student module RLS policies (attendance/materials/assignments/results)
-- Date: 2026-01-01
-- Purpose:
--  - Enable students to read their attendance headers (needed for joins)
--  - Enable students to read assignments/materials relevant to their class
--  - Enable students to read their verified internal marks + published schedules
--  - Enable students to manage their own external marks uploads (pending only)
-- Notes:
--  - Policies are additive and safe to re-run.

-- Ensure RLS enabled (safe)
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teaching_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.external_marks ENABLE ROW LEVEL SECURITY;

-- =========================
-- ATTENDANCE (headers)
-- =========================

DROP POLICY IF EXISTS "Students can view own attendance headers" ON public.attendance;
CREATE POLICY "Students can view own attendance headers"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.attendance_records ar
      ON ar.student_id = s.id
     AND ar.attendance_id = public.attendance.id
    WHERE s.user_id = auth.uid()
  )
);

-- =========================
-- MATERIALS (student read)
-- =========================

DROP POLICY IF EXISTS "Students can view class materials" ON public.teaching_materials;
CREATE POLICY "Students can view class materials"
ON public.teaching_materials
FOR SELECT
TO authenticated
USING (
  public.teaching_materials.is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.academic_years ay ON ay.is_current = true
    JOIN public.timetable_entries te
      ON te.section_id = s.section_id
     AND te.academic_year_id = ay.id
     AND te.is_active = true
    WHERE s.user_id = auth.uid()
      AND te.course_id = public.teaching_materials.course_id
  )
);

-- =========================
-- ASSIGNMENTS (student read)
-- =========================

DROP POLICY IF EXISTS "Students can view class assignments" ON public.assignments;
CREATE POLICY "Students can view class assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  public.assignments.is_active = true
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.academic_years ay ON ay.is_current = true
    JOIN public.timetable_entries te
      ON te.section_id = s.section_id
     AND te.academic_year_id = ay.id
     AND te.is_active = true
    WHERE s.user_id = auth.uid()
      AND te.course_id = public.assignments.course_id
  )
);

-- =========================
-- EXAMS / SCHEDULES (student read)
-- =========================

DROP POLICY IF EXISTS "Auth users read exam schedules (published exams)" ON public.exam_schedules;
CREATE POLICY "Auth users read exam schedules (published exams)"
ON public.exam_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.exams e
    WHERE e.id = public.exam_schedules.exam_id
      AND e.is_published = true
  )
);

-- =========================
-- EXAM MARKS (student read verified only)
-- =========================

DROP POLICY IF EXISTS "Students can view own verified exam marks" ON public.exam_marks;
CREATE POLICY "Students can view own verified exam marks"
ON public.exam_marks
FOR SELECT
TO authenticated
USING (
  public.exam_marks.verified_at IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.exam_marks.student_id
  )
  AND EXISTS (
    SELECT 1
    FROM public.exam_schedules es
    JOIN public.exams e ON e.id = es.exam_id
    WHERE es.id = public.exam_marks.exam_schedule_id
      AND e.is_published = true
  )
);

-- =========================
-- EXTERNAL MARKS (student upload/manage own, pending only)
-- =========================

DROP POLICY IF EXISTS "Students manage own external marks (pending only)" ON public.external_marks;
CREATE POLICY "Students manage own external marks (pending only)"
ON public.external_marks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.external_marks.student_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.external_marks.student_id
  )
  AND COALESCE(public.external_marks.upload_status, 'pending') = 'pending'
  AND public.external_marks.verified_by IS NULL
  AND public.external_marks.verified_at IS NULL
);

-- Admin full access (common pattern) for verification workflows
-- (Safe if existing admin policies already exist; adds coverage where missing)

DROP POLICY IF EXISTS "Admins full access exam_schedules" ON public.exam_schedules;
CREATE POLICY "Admins full access exam_schedules" ON public.exam_schedules
FOR ALL TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins full access exam_marks" ON public.exam_marks;
CREATE POLICY "Admins full access exam_marks" ON public.exam_marks
FOR ALL TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins full access external_marks" ON public.external_marks;
CREATE POLICY "Admins full access external_marks" ON public.external_marks
FOR ALL TO authenticated
USING (is_admin());
