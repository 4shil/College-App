-- Student leave applications + class teacher approval
-- Date: 2026-01-12
-- Purpose: Allow students to request leave and class teachers to approve/reject.

CREATE TABLE IF NOT EXISTS public.student_leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,

  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT student_leave_applications_date_check CHECK (to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS idx_student_leave_applications_student ON public.student_leave_applications (student_id, created_at);
CREATE INDEX IF NOT EXISTS idx_student_leave_applications_section ON public.student_leave_applications (section_id, created_at);

-- Keep updated_at fresh (uses shared helper from initial schema)
DROP TRIGGER IF EXISTS trg_student_leave_applications_updated_at ON public.student_leave_applications;
CREATE TRIGGER trg_student_leave_applications_updated_at
  BEFORE UPDATE ON public.student_leave_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.student_leave_applications ENABLE ROW LEVEL SECURITY;

-- Students: read own
DROP POLICY IF EXISTS "Students read own leave applications" ON public.student_leave_applications;
CREATE POLICY "Students read own leave applications"
ON public.student_leave_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_leave_applications.student_id
      AND s.user_id = auth.uid()
  )
);

-- Students: create own (must match their own student_id + section_id)
DROP POLICY IF EXISTS "Students create own leave applications" ON public.student_leave_applications;
CREATE POLICY "Students create own leave applications"
ON public.student_leave_applications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_leave_applications.student_id
      AND s.user_id = auth.uid()
      AND s.section_id = student_leave_applications.section_id
  )
);

-- Students: cancel own pending
DROP POLICY IF EXISTS "Students cancel own pending leave applications" ON public.student_leave_applications;
CREATE POLICY "Students cancel own pending leave applications"
ON public.student_leave_applications
FOR UPDATE
TO authenticated
USING (
  student_leave_applications.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_leave_applications.student_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  student_leave_applications.status = 'cancelled'
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.id = student_leave_applications.student_id
      AND s.user_id = auth.uid()
  )
);

-- Class teachers: read leave applications for sections they own
DROP POLICY IF EXISTS "Class teacher reads leave applications for own sections" ON public.student_leave_applications;
CREATE POLICY "Class teacher reads leave applications for own sections"
ON public.student_leave_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sections sec
    WHERE sec.id = student_leave_applications.section_id
      AND sec.class_teacher_id = auth.uid()
  )
);

-- Class teachers: approve/reject pending (must stamp reviewed_by)
DROP POLICY IF EXISTS "Class teacher reviews pending leave applications" ON public.student_leave_applications;
CREATE POLICY "Class teacher reviews pending leave applications"
ON public.student_leave_applications
FOR UPDATE
TO authenticated
USING (
  student_leave_applications.status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.sections sec
    WHERE sec.id = student_leave_applications.section_id
      AND sec.class_teacher_id = auth.uid()
  )
)
WITH CHECK (
  student_leave_applications.status IN ('approved', 'rejected')
  AND student_leave_applications.reviewed_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.sections sec
    WHERE sec.id = student_leave_applications.section_id
      AND sec.class_teacher_id = auth.uid()
  )
);
