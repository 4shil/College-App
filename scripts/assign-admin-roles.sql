-- Assign admin roles to test users
-- Run this in Supabase SQL Editor

-- Get user IDs and role IDs
WITH user_emails AS (
  SELECT id, email FROM auth.users WHERE email IN (
    'superadmin@college.com',
    'principal@college.com', 
    'examadmin@college.com',
    'librarian@college.com',
    'financeadmin@college.com'
  )
),
role_mapping AS (
  SELECT 
    u.id as user_id,
    u.email,
    CASE 
      WHEN u.email = 'superadmin@college.com' THEN 'super_admin'
      WHEN u.email = 'principal@college.com' THEN 'principal'
      WHEN u.email = 'examadmin@college.com' THEN 'exam_cell_admin'
      WHEN u.email = 'librarian@college.com' THEN 'library_admin'
      WHEN u.email = 'financeadmin@college.com' THEN 'finance_admin'
    END as role_name
  FROM user_emails u
)
-- Insert user_roles
INSERT INTO user_roles (user_id, role_id)
SELECT 
  rm.user_id,
  r.id as role_id
FROM role_mapping rm
JOIN roles r ON r.name = rm.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify assignments
SELECT 
  p.full_name,
  p.email,
  p.primary_role,
  r.display_name as assigned_role
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
WHERE p.email IN (
  'superadmin@college.com',
  'principal@college.com',
  'examadmin@college.com',
  'librarian@college.com',
  'financeadmin@college.com'
)
ORDER BY p.email;
