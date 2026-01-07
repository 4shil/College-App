-- Make "programme" detection include program_level (some DB setups use program_level instead of program_type)
-- Date: 2026-01-07

-- Update views
DROP VIEW IF EXISTS public.programmes;
CREATE VIEW public.programmes AS
SELECT *
FROM public.courses
WHERE is_active = true
  AND (
    COALESCE(is_degree_program, false) = true
    OR program_type IS NOT NULL
    OR program_level IS NOT NULL
  );

DROP VIEW IF EXISTS public.subject_courses;
CREATE VIEW public.subject_courses AS
SELECT *
FROM public.courses
WHERE is_active = true
  AND (
    COALESCE(is_degree_program, false) = false
    AND program_type IS NULL
    AND program_level IS NULL
  );

GRANT SELECT ON public.programmes TO authenticated;
GRANT SELECT ON public.subject_courses TO authenticated;

-- Update RPC helper
DROP FUNCTION IF EXISTS public.get_programmes(UUID);
CREATE OR REPLACE FUNCTION public.get_programmes(dept_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  short_name VARCHAR,
  department_id UUID,
  department_name VARCHAR,
  program_type VARCHAR,
  program_level VARCHAR,
  duration_years INTEGER,
  total_semesters INTEGER,
  is_degree_program BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.code,
    c.name,
    c.short_name,
    c.department_id,
    d.name AS department_name,
    c.program_type,
    c.program_level,
    c.duration_years,
    c.total_semesters,
    c.is_degree_program
  FROM public.courses c
  JOIN public.departments d ON d.id = c.department_id
  WHERE c.is_active = true
    AND (
      COALESCE(c.is_degree_program, false) = true
      OR c.program_type IS NOT NULL
      OR c.program_level IS NOT NULL
    )
    AND (dept_id IS NULL OR c.department_id = dept_id)
  ORDER BY c.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_programmes(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_programmes(UUID) IS 'Returns degree programmes (alias of courses where is_degree_program=true or program_type/program_level is not null).';
