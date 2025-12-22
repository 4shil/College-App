-- Ensure permission checks only consider active role assignments.

CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = has_permission.user_id
      AND ur.is_active = true
      AND r.is_active = true
      AND (
        r.permissions->permission_name = 'true'::jsonb
        OR r.name = 'super_admin'
      )
  ) INTO has_perm;

  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
      )
  ) INTO can_access;

  RETURN can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  all_permissions JSONB;
BEGIN
  SELECT jsonb_agg(DISTINCT permission_key)
  INTO all_permissions
  FROM (
    SELECT jsonb_object_keys(r.permissions) as permission_key
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = get_user_permissions.user_id
      AND ur.is_active = true
      AND r.is_active = true
      AND r.permissions IS NOT NULL
  ) permissions;

  RETURN COALESCE(all_permissions, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
