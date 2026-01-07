-- Allow anon (registration) to read only degree-programme rows from courses
-- Date: 2026-01-07

-- NOTE: Registration happens before login, so the app uses the anon role.
-- Without an anon policy, RLS will silently return 0 rows from `courses`.

DROP POLICY IF EXISTS "Public can read programmes (registration)" ON public.courses;

CREATE POLICY "Public can read programmes (registration)" ON public.courses
FOR SELECT
TO anon
USING (
  is_active = true
  AND (
    COALESCE(is_degree_program, false) = true
    OR program_type IS NOT NULL
    OR program_level IS NOT NULL
  )
);
