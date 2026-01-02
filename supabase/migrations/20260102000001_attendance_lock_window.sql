-- =====================================================
-- ATTENDANCE LOCK WINDOW (Teacher marking/editing)
-- Date: 2026-01-02
--
-- Enforces a grace window for attendance marking via RLS:
-- - Teachers can only insert/update attendance + attendance_records
--   until (period end time + 120 minutes) on the same date.
-- - If attendance.is_locked = true, marking/editing is always blocked.
--
-- Notes:
-- - Uses timetable_entries.end_time when timetable_entry_id is present.
-- - Falls back to period_timings.end_time by period number.
-- - Uses Asia/Kolkata local time for comparisons.
-- =====================================================

-- ------------------------------
-- 1) Helper functions
-- ------------------------------

DROP FUNCTION IF EXISTS public.attendance_is_open(UUID);
DROP FUNCTION IF EXISTS public.attendance_is_open_params(DATE, INTEGER, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.attendance_is_open_params(
  p_date DATE,
  p_period INTEGER,
  p_timetable_entry_id UUID,
  p_is_locked BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_end_time TIME;
  v_deadline_local TIMESTAMP;
  v_now_local TIMESTAMP;
BEGIN
  IF COALESCE(p_is_locked, false) THEN
    RETURN false;
  END IF;

  -- Prefer timetable entry end_time
  IF p_timetable_entry_id IS NOT NULL THEN
    SELECT te.end_time INTO v_end_time
    FROM public.timetable_entries te
    WHERE te.id = p_timetable_entry_id;
  END IF;

  -- Fallback to period timings by period number
  IF v_end_time IS NULL THEN
    SELECT pt.end_time INTO v_end_time
    FROM public.period_timings pt
    WHERE pt.period_number = p_period;
  END IF;

  -- If we can't determine a deadline, disallow edits outside the same day
  IF v_end_time IS NULL THEN
    RETURN p_date = CURRENT_DATE;
  END IF;

  v_now_local := timezone('Asia/Kolkata', now());
  v_deadline_local := (p_date::timestamp + v_end_time) + interval '120 minutes';

  RETURN v_now_local <= v_deadline_local;
END;
$$;

CREATE OR REPLACE FUNCTION public.attendance_is_open(p_attendance_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_date DATE;
  v_period INTEGER;
  v_timetable_entry_id UUID;
  v_is_locked BOOLEAN;
BEGIN
  SELECT a.date, a.period, a.timetable_entry_id, a.is_locked
  INTO v_date, v_period, v_timetable_entry_id, v_is_locked
  FROM public.attendance a
  WHERE a.id = p_attendance_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN public.attendance_is_open_params(v_date, v_period, v_timetable_entry_id, v_is_locked);
END;
$$;

-- ------------------------------
-- 2) Update RLS policies (teacher insert/update)
-- ------------------------------

-- These policies were introduced in 20251205000002_attendance_rls_delegation.sql
DROP POLICY IF EXISTS "Teachers can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Teachers can update attendance records" ON public.attendance_records;

-- Attendance: INSERT
CREATE POLICY "Teachers can insert attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.attendance_is_open_params(date, period, timetable_entry_id, is_locked)
    AND (
      EXISTS (
        SELECT 1
        FROM public.timetable_entries te
        JOIN public.teachers t ON te.teacher_id = t.id
        WHERE te.id = timetable_entry_id
          AND t.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.teachers t
        WHERE t.user_id = auth.uid()
          AND public.teacher_has_delegation(
            t.id,
            (SELECT programme_id FROM public.timetable_entries WHERE id = timetable_entry_id),
            (SELECT year_id FROM public.timetable_entries WHERE id = timetable_entry_id),
            (SELECT course_id FROM public.timetable_entries WHERE id = timetable_entry_id)
          )
      )
    )
  );

-- Attendance: UPDATE
CREATE POLICY "Teachers can update attendance"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (
    public.attendance_is_open_params(date, period, timetable_entry_id, is_locked)
    AND (
      EXISTS (
        SELECT 1
        FROM public.timetable_entries te
        JOIN public.teachers t ON te.teacher_id = t.id
        WHERE te.id = timetable_entry_id
          AND t.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.teachers t
        WHERE t.user_id = auth.uid()
          AND public.teacher_has_delegation(
            t.id,
            programme_id,
            year_id,
            course_id
          )
      )
    )
  )
  WITH CHECK (
    public.attendance_is_open_params(date, period, timetable_entry_id, is_locked)
    AND (
      EXISTS (
        SELECT 1
        FROM public.timetable_entries te
        JOIN public.teachers t ON te.teacher_id = t.id
        WHERE te.id = timetable_entry_id
          AND t.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.teachers t
        WHERE t.user_id = auth.uid()
          AND public.teacher_has_delegation(
            t.id,
            programme_id,
            year_id,
            course_id
          )
      )
    )
  );

-- Attendance Records: INSERT
CREATE POLICY "Teachers can insert attendance records"
  ON public.attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.attendance_is_open(attendance_id)
    AND (
      EXISTS (
        SELECT 1
        FROM public.attendance a
        JOIN public.timetable_entries te ON a.timetable_entry_id = te.id
        JOIN public.teachers t ON te.teacher_id = t.id
        WHERE a.id = attendance_id
          AND t.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.attendance a
        JOIN public.teachers t ON t.user_id = auth.uid()
        WHERE a.id = attendance_id
          AND public.teacher_has_delegation(
            t.id,
            a.programme_id,
            a.year_id,
            a.course_id
          )
      )
    )
  );

-- Attendance Records: UPDATE
CREATE POLICY "Teachers can update attendance records"
  ON public.attendance_records
  FOR UPDATE
  TO authenticated
  USING (
    public.attendance_is_open(attendance_id)
    AND (
      EXISTS (
        SELECT 1
        FROM public.attendance a
        JOIN public.timetable_entries te ON a.timetable_entry_id = te.id
        JOIN public.teachers t ON te.teacher_id = t.id
        WHERE a.id = attendance_id
          AND t.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.attendance a
        JOIN public.teachers t ON t.user_id = auth.uid()
        WHERE a.id = attendance_id
          AND public.teacher_has_delegation(
            t.id,
            a.programme_id,
            a.year_id,
            a.course_id
          )
      )
    )
  )
  WITH CHECK (
    public.attendance_is_open(attendance_id)
    AND (
      EXISTS (
        SELECT 1
        FROM public.attendance a
        JOIN public.timetable_entries te ON a.timetable_entry_id = te.id
        JOIN public.teachers t ON te.teacher_id = t.id
        WHERE a.id = attendance_id
          AND t.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.attendance a
        JOIN public.teachers t ON t.user_id = auth.uid()
        WHERE a.id = attendance_id
          AND public.teacher_has_delegation(
            t.id,
            a.programme_id,
            a.year_id,
            a.course_id
          )
      )
    )
  );
