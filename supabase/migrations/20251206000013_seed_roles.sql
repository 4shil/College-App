-- Seed roles if they don't exist
-- This ensures all 9 admin roles + teacher roles + student role exist

INSERT INTO roles (name, display_name, description, category, permissions) VALUES
-- Admin roles (9 TRUE ADMIN ROLES)
(
  'super_admin', 
  'Super Admin', 
  'Full system access - GOD MODE', 
  'admin',
  jsonb_build_object(
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
),
(
  'principal', 
  'Principal', 
  'Academic top authority - Approver, not operational', 
  'admin',
  jsonb_build_object(
    'view_all_users', true,
    'block_unblock_users', true,
    'approve_diary_final', true,
    'monitor_planners', true,
    'post_global_notices', true,
    'send_notifications', true,
    'view_attendance_reports', true
  )
),
(
  'department_admin', 
  'Department Admin', 
  'Department-level user & info management', 
  'admin',
  jsonb_build_object(
    'view_dept_users', true,
    'block_dept_users', true,
    'post_dept_notices', true
  )
),
(
  'hod', 
  'Head of Department', 
  'Department head - Teacher role with admin powers', 
  'admin',
  jsonb_build_object(
    'view_dept_users', true,
    'approve_planner_level_1', true,
    'approve_diary_level_1', true,
    'post_dept_notices', true,
    'manage_attendance', true
  )
),
(
  'exam_cell_admin', 
  'Exam Cell Admin', 
  'Exam scheduling + marks verification', 
  'admin',
  jsonb_build_object(
    'schedule_exams', true,
    'verify_marks', true,
    'publish_results', true,
    'manage_exam_schedules', true
  )
),
(
  'library_admin', 
  'Library Admin', 
  'Full library management', 
  'admin',
  jsonb_build_object(
    'manage_library', true,
    'manage_books', true,
    'issue_return_books', true
  )
),
(
  'bus_admin', 
  'Bus Admin', 
  'Transportation management', 
  'admin',
  jsonb_build_object(
    'manage_bus', true,
    'manage_bus_routes', true,
    'track_bus_locations', true
  )
),
(
  'canteen_admin', 
  'Canteen Admin', 
  'Canteen token system management', 
  'admin',
  jsonb_build_object(
    'manage_canteen', true,
    'manage_canteen_menu', true,
    'manage_canteen_tokens', true
  )
),
(
  'finance_admin', 
  'Finance Admin', 
  'Fee and payment management', 
  'admin',
  jsonb_build_object(
    'manage_fees', true,
    'manage_fee_structures', true,
    'process_payments', true,
    'view_financial_reports', true
  )
),
-- Teacher roles (NOT admins)
('subject_teacher', 'Subject Teacher', 'Base role - Teaches subjects', 'teacher', '{}'),
('class_teacher', 'Class Teacher', 'In-charge of a class/section', 'teacher', '{}'),
('mentor', 'Mentor', 'Mentors specific students', 'teacher', '{}'),
('coordinator', 'Coordinator', 'Manages substitute assignments', 'teacher', '{}'),
-- Student role
('student', 'Student', 'Regular enrolled student', 'student', '{}')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All roles seeded successfully';
  RAISE NOTICE '   - 9 Admin roles with granular permissions';
  RAISE NOTICE '   - 4 Teacher roles';
  RAISE NOTICE '   - 1 Student role';
END $$;
