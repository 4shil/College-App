-- Mentor module RLS
-- Enables mentors to view their assignments and manage mentoring sessions

-- mentor_assignments: enable RLS + policies
ALTER TABLE IF EXISTS mentor_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage mentor assignments" ON mentor_assignments;
DROP POLICY IF EXISTS "Mentors can view own assignments" ON mentor_assignments;

CREATE POLICY "Admins can manage mentor assignments" ON mentor_assignments
  FOR ALL
  USING (is_admin());

CREATE POLICY "Mentors can view own assignments" ON mentor_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM teachers t
      WHERE t.user_id = auth.uid()
        AND t.id = mentor_assignments.mentor_id
    )
  );

-- mentoring_sessions: policies (table exists and already has RLS enabled in extended schema)
DROP POLICY IF EXISTS "Admins can manage mentoring sessions" ON mentoring_sessions;
DROP POLICY IF EXISTS "Mentors can manage own mentoring sessions" ON mentoring_sessions;

CREATE POLICY "Admins can manage mentoring sessions" ON mentoring_sessions
  FOR ALL
  USING (is_admin());

CREATE POLICY "Mentors can manage own mentoring sessions" ON mentoring_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM mentor_assignments ma
      JOIN teachers t ON t.id = ma.mentor_id
      WHERE ma.id = mentoring_sessions.mentor_assignment_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM mentor_assignments ma
      JOIN teachers t ON t.id = ma.mentor_id
      WHERE ma.id = mentoring_sessions.mentor_assignment_id
        AND t.user_id = auth.uid()
    )
  );
