-- Attendance alerts for full-day absences without permission
CREATE TABLE IF NOT EXISTS public.attendance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('full_day_absent_no_permission', 'no_attendance_marked')),
  total_periods_scheduled INTEGER NOT NULL DEFAULT 0,
  periods_absent INTEGER NOT NULL DEFAULT 0,
  has_approved_leave BOOLEAN NOT NULL DEFAULT false,
  notification_sent_to_student BOOLEAN NOT NULL DEFAULT false,
  notification_sent_to_teacher BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, absence_date)
);

-- Add indexes
CREATE INDEX idx_attendance_alerts_student ON public.attendance_alerts(student_id);
CREATE INDEX idx_attendance_alerts_section ON public.attendance_alerts(section_id);
CREATE INDEX idx_attendance_alerts_date ON public.attendance_alerts(absence_date);
CREATE INDEX idx_attendance_alerts_unresolved ON public.attendance_alerts(resolved_at) WHERE resolved_at IS NULL;

-- Add trigger for updated_at
CREATE TRIGGER trg_attendance_alerts_updated_at
  BEFORE UPDATE ON public.attendance_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE public.attendance_alerts ENABLE ROW LEVEL SECURITY;

-- Students can view their own alerts
CREATE POLICY attendance_alerts_select_student ON public.attendance_alerts
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE user_id = auth.uid()
    )
  );

-- Class teachers can view alerts for their sections
CREATE POLICY attendance_alerts_select_teacher ON public.attendance_alerts
  FOR SELECT
  USING (
    section_id IN (
      SELECT id FROM public.sections WHERE class_teacher_id = auth.uid()
    )
  );

-- Admin can view all alerts
CREATE POLICY attendance_alerts_select_admin ON public.attendance_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND primary_role = 'super_admin'
    )
  );

-- Admin and class teachers can update/resolve alerts
CREATE POLICY attendance_alerts_update_staff ON public.attendance_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (primary_role = 'super_admin' OR primary_role = 'teacher')
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND primary_role = 'super_admin'
      )
      OR section_id IN (
        SELECT id FROM public.sections WHERE class_teacher_id = auth.uid()
      )
    )
  );

-- System/admin can insert alerts
CREATE POLICY attendance_alerts_insert_admin ON public.attendance_alerts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND primary_role = 'super_admin'
    )
  );

COMMENT ON TABLE public.attendance_alerts IS 'Tracks full-day absences without permission to notify students and teachers';
