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

-- Now insert verified admin users directly (including passwords)
-- This sets encrypted_password using Postgres crypt(); change passwords after first login.

-- Super Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000001',
  'authenticated',
  'authenticated',
  'superadmin@college.com',
  crypt('Super@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Robert Johnson","phone":"+1234567890"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Principal
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000002',
  'authenticated',
  'authenticated',
  'principal@college.com',
  crypt('Principal@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Dr. Sarah Williams","phone":"+1234567891"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Exam Cell Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000003',
  'authenticated',
  'authenticated',
  'examadmin@college.com',
  crypt('Exam@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Michael Brown","phone":"+1234567892"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Library Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000004',
  'authenticated',
  'authenticated',
  'librarian@college.com',
  crypt('Library@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Emily Davis","phone":"+1234567893"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Finance Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000005',
  'authenticated',
  'authenticated',
  'financeadmin@college.com',
  crypt('Finance@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"David Martinez","phone":"+1234567894"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- HOD
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000006',
  'authenticated',
  'authenticated',
  'hod@college.com',
  crypt('Hod@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Prof. James Wilson","phone":"+1234567895"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Department Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000007',
  'authenticated',
  'authenticated',
  'deptadmin@college.com',
  crypt('Dept@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Lisa Anderson","phone":"+1234567896"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Bus Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000008',
  'authenticated',
  'authenticated',
  'busadmin@college.com',
  crypt('Bus@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Christopher Lee","phone":"+1234567897"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Canteen Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000009',
  'authenticated',
  'authenticated',
  'canteenadmin@college.com',
  crypt('Canteen@2024', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Jessica Taylor","phone":"+1234567898"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- Create profiles for all admin users
INSERT INTO public.profiles (id, email, full_name, primary_role, phone, status, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'superadmin@college.com', 'Robert Johnson', 'super_admin', '+1234567890', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'principal@college.com', 'Dr. Sarah Williams', 'principal', '+1234567891', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'examadmin@college.com', 'Michael Brown', 'exam_cell_admin', '+1234567892', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'librarian@college.com', 'Emily Davis', 'library_admin', '+1234567893', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000005', 'financeadmin@college.com', 'David Martinez', 'finance_admin', '+1234567894', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000006', 'hod@college.com', 'Prof. James Wilson', 'hod', '+1234567895', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000007', 'deptadmin@college.com', 'Lisa Anderson', 'department_admin', '+1234567896', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000008', 'busadmin@college.com', 'Christopher Lee', 'bus_admin', '+1234567897', 'active', now(), now()),
  ('00000000-0000-0000-0000-000000000009', 'canteenadmin@college.com', 'Jessica Taylor', 'canteen_admin', '+1234567898', 'active', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Assign roles to admin users (using role_id from roles table)
INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000001', id FROM roles WHERE name = 'super_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000002', id FROM roles WHERE name = 'principal'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000003', id FROM roles WHERE name = 'exam_cell_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000004', id FROM roles WHERE name = 'library_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000005', id FROM roles WHERE name = 'finance_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000006', id FROM roles WHERE name = 'hod'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000007', id FROM roles WHERE name = 'department_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000008', id FROM roles WHERE name = 'bus_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role_id, department_id) 
SELECT '00000000-0000-0000-0000-000000000009', id FROM roles WHERE name = 'canteen_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;
