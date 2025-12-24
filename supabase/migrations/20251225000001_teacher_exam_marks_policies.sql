-- Teacher access for internal marks entry
-- Allows teachers to read exam schedules for their assigned subjects, and upsert marks

-- Ensure RLS is enabled (should already be enabled, but safe)
ALTER TABLE IF EXISTS exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exam_marks ENABLE ROW LEVEL SECURITY;

-- Clean re-runs
DROP POLICY IF EXISTS "Teachers read exam schedules" ON exam_schedules;
DROP POLICY IF EXISTS "Teachers manage own exam marks" ON exam_marks;

-- Teachers can read schedules ONLY for courses they teach in the same academic year
CREATE POLICY "Teachers read exam schedules"
ON exam_schedules
FOR SELECT
TO authenticated
USING (
  is_teacher()
  AND EXISTS (
    SELECT 1
    FROM exams e
    JOIN timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = exam_schedules.course_id
    JOIN teachers t
      ON t.id = te.teacher_id
    WHERE e.id = exam_schedules.exam_id
      AND t.user_id = auth.uid()
      AND te.is_active = true
  )
);

-- Teachers can insert/update/select marks for schedules they are responsible for
CREATE POLICY "Teachers manage own exam marks"
ON exam_marks
FOR ALL
TO authenticated
USING (
  is_teacher()
  AND EXISTS (
    SELECT 1
    FROM exam_schedules es
    JOIN exams e ON e.id = es.exam_id
    JOIN timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
    JOIN teachers t
      ON t.id = te.teacher_id
    WHERE es.id = exam_marks.exam_schedule_id
      AND t.user_id = auth.uid()
      AND te.is_active = true
  )
)
WITH CHECK (
  is_teacher()
  AND EXISTS (
    SELECT 1
    FROM exam_schedules es
    JOIN exams e ON e.id = es.exam_id
    JOIN timetable_entries te
      ON te.academic_year_id = e.academic_year_id
     AND te.course_id = es.course_id
    JOIN teachers t
      ON t.id = te.teacher_id
    WHERE es.id = exam_marks.exam_schedule_id
      AND t.user_id = auth.uid()
      AND te.is_active = true
  )
);
