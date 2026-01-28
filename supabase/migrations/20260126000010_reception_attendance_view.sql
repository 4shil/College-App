-- Receptionist attendance view enablement
-- Date: 2026-01-26
-- Scope: adds permission, RLS policies, RPC, and module access for reception attendance

-- 1) Add new permission to reception_admin role (JSON permissions)
UPDATE public.roles
SET permissions = COALESCE(permissions, '{}'::jsonb) || jsonb_build_object('reception_view_all_attendance', true)
WHERE name = 'reception_admin';

-- Also insert into role_permissions_matrix when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'role_permissions_matrix'
  ) THEN
    INSERT INTO public.role_permissions_matrix (role_id, permission_key, enabled)
    SELECT r.id, 'reception_view_all_attendance', true FROM public.roles r
    WHERE r.name = 'reception_admin'
    ON CONFLICT (role_id, permission_key) DO UPDATE SET enabled = EXCLUDED.enabled;
  END IF;
END $$;

-- 2) RLS policies for read-only attendance access
DROP POLICY IF EXISTS "Reception can view attendance" ON public.attendance;
CREATE POLICY "Reception can view attendance" ON public.attendance
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'reception_view_all_attendance'));

DROP POLICY IF EXISTS "Reception can view attendance records" ON public.attendance_records;
CREATE POLICY "Reception can view attendance records" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (has_permission(auth.uid(), 'reception_view_all_attendance'));

-- 3) RPC for receptionist attendance overview
CREATE OR REPLACE FUNCTION public.get_attendance_for_reception(
  p_date DATE DEFAULT CURRENT_DATE,
  p_department_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  attendance_id UUID,
  attendance_record_id UUID,
  student_id UUID,
  student_name TEXT,
  roll_number TEXT,
  registration_number TEXT,
  department_name TEXT,
  section_name TEXT,
  year_name TEXT,
  period INTEGER,
  status TEXT,
  marked_at TIMESTAMPTZ,
  marked_by_name TEXT
) AS $$
BEGIN
  IF NOT has_permission(auth.uid(), 'reception_view_all_attendance') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    a.id AS attendance_id,
    ar.id AS attendance_record_id,
    s.id AS student_id,
    p.full_name AS student_name,
    COALESCE(s.roll_number, s.registration_number) AS roll_number,
    s.registration_number AS registration_number,
    d.name AS department_name,
    sec.name AS section_name,
    y.name AS year_name,
    a.period,
    ar.status,
    COALESCE(ar.marked_at, a.marked_at) AS marked_at,
    mb.full_name AS marked_by_name
  FROM public.attendance_records ar
  JOIN public.attendance a ON ar.attendance_id = a.id
  JOIN public.students s ON ar.student_id = s.id
  JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN public.departments d ON s.department_id = d.id
  LEFT JOIN public.sections sec ON a.section_id = sec.id
  LEFT JOIN public.years y ON s.year_id = y.id
  LEFT JOIN public.profiles mb ON mb.id = a.marked_by
  WHERE a.date = p_date
    AND (p_department_id IS NULL OR s.department_id = p_department_id OR sec.department_id = p_department_id)
    AND (p_status IS NULL OR ar.status = p_status)
    AND (
      p_search IS NULL OR p_search = '' OR
      p.full_name ILIKE '%' || p_search || '%' OR
      s.registration_number ILIKE '%' || p_search || '%' OR
      COALESCE(s.roll_number, '') ILIKE '%' || p_search || '%'
    )
  ORDER BY
    CASE ar.status WHEN 'absent' THEN 1 WHEN 'late' THEN 2 ELSE 3 END,
    d.name NULLS LAST,
    y.year_number NULLS LAST,
    COALESCE(s.roll_number, s.registration_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_attendance_for_reception TO authenticated;

COMMENT ON FUNCTION public.get_attendance_for_reception IS 'Receptionist read-only view of attendance with absent-first ordering and filters';

-- 4) Ensure module access function includes reception module
CREATE OR REPLACE FUNCTION can_access_module(user_id UUID, module_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  can_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = can_access_module.user_id
      AND ur.is_active = true
      AND r.is_active = true
      AND (
        r.name = 'super_admin'
        OR (module_name = 'users' AND r.name IN ('principal', 'department_admin'))
        OR (module_name = 'academic' AND r.name = 'super_admin')
        OR (module_name = 'exams' AND r.name IN ('exam_cell_admin'))
        OR (module_name = 'assignments' AND r.name IN ('hod', 'exam_cell_admin'))
        OR (module_name = 'library' AND r.name = 'library_admin')
        OR (module_name = 'fees' AND r.name = 'finance_admin')
        OR (module_name = 'bus' AND r.name = 'bus_admin')
        OR (module_name = 'canteen' AND r.name = 'canteen_admin')
        OR (module_name = 'notices' AND r.name IN ('principal', 'department_admin', 'hod'))
        OR (module_name = 'settings' AND r.name = 'super_admin')
        OR (module_name = 'attendance' AND r.name IN ('hod'))
        OR (module_name = 'reception' AND r.name IN ('reception_admin'))
      )
  ) INTO can_access;

  RETURN can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
