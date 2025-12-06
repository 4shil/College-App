-- Update role permissions based on PROJECT_PLAN.md specifications
-- This migration adds granular permissions to each admin role

-- Update Super Admin role with all permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'full_system_access', true,
  'create_delete_admins', true,
  'manage_global_settings', true,
  'view_all_users', true,
  'block_unblock_users', true,
  'manage_academic_structure', true,
  'manage_timetable', true,
  'manage_courses', true,
  'schedule_exams', true,
  'verify_marks', true,
  'publish_results', true,
  'approve_planner_final', true,
  'approve_diary_final', true,
  'manage_library', true,
  'manage_bus', true,
  'manage_canteen', true,
  'manage_fees', true,
  'post_global_notices', true,
  'send_notifications', true
)
WHERE name = 'super_admin';

-- Update Principal role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'view_all_users', true,
  'block_unblock_users', true,
  'approve_diary_final', true,
  'monitor_planners', true,
  'post_global_notices', true,
  'send_notifications', true,
  'view_attendance_reports', true
)
WHERE name = 'principal';

-- Update Department Admin role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'view_dept_users', true,
  'block_dept_users', true,
  'post_dept_notices', true
)
WHERE name = 'department_admin';

-- Update HOD role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'view_dept_users', true,
  'approve_planner_level_1', true,
  'approve_diary_level_1', true,
  'post_dept_notices', true,
  'manage_attendance', true
)
WHERE name = 'hod';

-- Update Exam Cell Admin role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'schedule_exams', true,
  'verify_marks', true,
  'publish_results', true,
  'manage_exam_schedules', true
)
WHERE name = 'exam_cell_admin';

-- Update Library Admin role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'manage_library', true,
  'manage_books', true,
  'issue_return_books', true
)
WHERE name = 'library_admin';

-- Update Bus Admin role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'manage_bus', true,
  'manage_bus_routes', true,
  'track_bus_locations', true
)
WHERE name = 'bus_admin';

-- Update Canteen Admin role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'manage_canteen', true,
  'manage_canteen_menu', true,
  'manage_canteen_tokens', true
)
WHERE name = 'canteen_admin';

-- Update Finance Admin role permissions
UPDATE roles 
SET permissions = jsonb_build_object(
  'manage_fees', true,
  'manage_fee_structures', true,
  'process_payments', true,
  'view_financial_reports', true
)
WHERE name = 'finance_admin';

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  -- Check if user has the permission through any of their roles
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = has_permission.user_id 
      AND r.is_active = true
      AND (
        r.permissions->permission_name = 'true'::jsonb
        OR r.name = 'super_admin' -- Super admin has all permissions
      )
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user can access module
CREATE OR REPLACE FUNCTION can_access_module(user_id UUID, module_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  can_access BOOLEAN;
BEGIN
  -- Module-role mapping
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = can_access_module.user_id 
      AND r.is_active = true
      AND (
        r.name = 'super_admin' -- Super admin can access everything
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

-- Create function to get user's all permissions
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
      AND r.is_active = true
      AND r.permissions IS NOT NULL
  ) permissions;
  
  RETURN COALESCE(all_permissions, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = is_user_admin.user_id 
      AND r.is_active = true
      AND r.category = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_module TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_admin TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION has_permission IS 'Check if user has a specific permission based on their roles';
COMMENT ON FUNCTION can_access_module IS 'Check if user can access a specific module based on their roles';
COMMENT ON FUNCTION get_user_permissions IS 'Get all permissions for a user across all their roles';
COMMENT ON FUNCTION is_user_admin IS 'Check if user has any admin role';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Role permissions updated successfully';
  RAISE NOTICE '✅ RBAC functions created: has_permission, can_access_module, get_user_permissions, is_user_admin';
END $$;
