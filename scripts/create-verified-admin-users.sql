-- Delete old unverified admin users and create verified ones
-- Run this in Supabase SQL Editor

-- First, delete old test users (if they exist)
DELETE FROM auth.users 
WHERE email IN (
  'superadmin@college.com',
  'principal@college.com',
  'examadmin@college.com',
  'librarian@college.com',
  'financeadmin@college.com',
  'hod@college.com',
  'deptadmin@college.com',
  'busadmin@college.com',
  'canteenadmin@college.com'
);

-- Now insert verified admin users directly
-- Note: These use a special script hash for the password (make sure to change password on first login)

-- Super Admin
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superadmin@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Robert Johnson","phone":"+1234567890"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Principal
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'principal@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Sarah Williams","phone":"+1234567891"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Exam Cell Admin
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'examadmin@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Michael Brown","phone":"+1234567892"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Library Admin
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  'librarian@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Emily Davis","phone":"+1234567893"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Finance Admin
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  'financeadmin@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"David Martinez","phone":"+1234567894"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- HOD
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000006',
  'hod@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Prof. James Wilson","phone":"+1234567895"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Department Admin
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000007',
  'deptadmin@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Lisa Anderson","phone":"+1234567896"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Bus Admin
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000008',
  'busadmin@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Christopher Lee","phone":"+1234567897"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Canteen Admin
INSERT INTO auth.users (
  id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000009',
  'canteenadmin@college.com',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Jessica Taylor","phone":"+1234567898"}',
  'authenticated',
  'authenticated',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Create profiles for all admin users
INSERT INTO public.profiles (id, email, full_name, primary_role, phone) VALUES
  ('00000000-0000-0000-0000-000000000001', 'superadmin@college.com', 'Robert Johnson', 'super_admin', '+1234567890'),
  ('00000000-0000-0000-0000-000000000002', 'principal@college.com', 'Dr. Sarah Williams', 'principal', '+1234567891'),
  ('00000000-0000-0000-0000-000000000003', 'examadmin@college.com', 'Michael Brown', 'exam_cell_admin', '+1234567892'),
  ('00000000-0000-0000-0000-000000000004', 'librarian@college.com', 'Emily Davis', 'library_admin', '+1234567893'),
  ('00000000-0000-0000-0000-000000000005', 'financeadmin@college.com', 'David Martinez', 'finance_admin', '+1234567894'),
  ('00000000-0000-0000-0000-000000000006', 'hod@college.com', 'Prof. James Wilson', 'hod', '+1234567895'),
  ('00000000-0000-0000-0000-000000000007', 'deptadmin@college.com', 'Lisa Anderson', 'department_admin', '+1234567896'),
  ('00000000-0000-0000-0000-000000000008', 'busadmin@college.com', 'Christopher Lee', 'bus_admin', '+1234567897'),
  ('00000000-0000-0000-0000-000000000009', 'canteenadmin@college.com', 'Jessica Taylor', 'canteen_admin', '+1234567898')
ON CONFLICT (id) DO NOTHING;

-- Assign roles to admin users
INSERT INTO public.user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'super_admin'),
  ('00000000-0000-0000-0000-000000000002', 'principal'),
  ('00000000-0000-0000-0000-000000000003', 'exam_cell_admin'),
  ('00000000-0000-0000-0000-000000000004', 'library_admin'),
  ('00000000-0000-0000-0000-000000000005', 'finance_admin'),
  ('00000000-0000-0000-0000-000000000006', 'hod'),
  ('00000000-0000-0000-0000-000000000007', 'department_admin'),
  ('00000000-0000-0000-0000-000000000008', 'bus_admin'),
  ('00000000-0000-0000-0000-000000000009', 'canteen_admin')
ON CONFLICT DO NOTHING;
