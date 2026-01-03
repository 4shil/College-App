-- Substitution workflow policies for coordinator/teachers + HoD

-- Allow teachers (including coordinators) to create substitution requests for their own timetable entries.
DROP POLICY IF EXISTS "Teachers can request substitutions for own timetable" ON substitutions;

CREATE POLICY "Teachers can request substitutions for own timetable" ON substitutions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND approved_by IS NULL
    AND approved_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM teachers t
      WHERE t.user_id = auth.uid()
        AND t.id = substitutions.original_teacher_id
    )
    AND EXISTS (
      SELECT 1
      FROM timetable_entries te
      WHERE te.id = substitutions.timetable_entry_id
        AND te.teacher_id = substitutions.original_teacher_id
    )
  );

-- Allow HoD to update substitutions for their department (approve/reject).
-- Department resolution:
--   Preferred (newer schema): substitutions -> timetable_entries.section_id -> sections.department_id
--   Fallback (older schema after programs removal): substitutions -> timetable_entries.program_id -> courses.department_id
DROP POLICY IF EXISTS "HOD can manage department substitutions" ON substitutions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'section_id'
  ) THEN
    EXECUTE $POLICY$
      CREATE POLICY "HOD can manage department substitutions" ON substitutions
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM timetable_entries te
            JOIN sections s ON s.id = te.section_id
            JOIN user_roles ur ON ur.department_id = s.department_id
            JOIN roles r ON ur.role_id = r.id
            WHERE te.id = substitutions.timetable_entry_id
              AND ur.user_id = auth.uid()
              AND r.name = 'hod'
              AND ur.is_active = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM timetable_entries te
            JOIN sections s ON s.id = te.section_id
            JOIN user_roles ur ON ur.department_id = s.department_id
            JOIN roles r ON ur.role_id = r.id
            WHERE te.id = substitutions.timetable_entry_id
              AND ur.user_id = auth.uid()
              AND r.name = 'hod'
              AND ur.is_active = true
          )
        );
    $POLICY$;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'timetable_entries'
      AND column_name = 'program_id'
  ) THEN
    -- programs table was removed; program_id should refer to courses for department resolution
    EXECUTE $POLICY$
      CREATE POLICY "HOD can manage department substitutions" ON substitutions
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM timetable_entries te
            JOIN courses c ON c.id = te.program_id
            JOIN user_roles ur ON ur.department_id = c.department_id
            JOIN roles r ON ur.role_id = r.id
            WHERE te.id = substitutions.timetable_entry_id
              AND ur.user_id = auth.uid()
              AND r.name = 'hod'
              AND ur.is_active = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1
            FROM timetable_entries te
            JOIN courses c ON c.id = te.program_id
            JOIN user_roles ur ON ur.department_id = c.department_id
            JOIN roles r ON ur.role_id = r.id
            WHERE te.id = substitutions.timetable_entry_id
              AND ur.user_id = auth.uid()
              AND r.name = 'hod'
              AND ur.is_active = true
          )
        );
    $POLICY$;
  END IF;
END $$;
