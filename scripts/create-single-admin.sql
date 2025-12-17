-- CREATE SINGLE ADMIN USER
-- Run this in Supabase SQL Editor after deleting all users

-- Step 1: Create admin user in auth.users
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
  'c60b6bba-4e7f-4e28-a826-db739aa93e4f',
  'authenticated',
  'authenticated',
  'admin@jpmcollege.edu',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Super Administrator"}',
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
  updated_at = now();

-- Step 2: Create profile for admin
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  primary_role,
  status,
  created_at,
  updated_at
) VALUES (
  'c60b6bba-4e7f-4e28-a826-db739aa93e4f',
  'admin@jpmcollege.edu',
  'Super Administrator',
  'super_admin',
  'active',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  primary_role = EXCLUDED.primary_role,
  status = EXCLUDED.status,
  updated_at = now();

-- Step 3: Assign super_admin role
INSERT INTO public.user_roles (user_id, role_id, department_id)
SELECT 
  'c60b6bba-4e7f-4e28-a826-db739aa93e4f',
  id,
  NULL
FROM public.roles
WHERE name = 'super_admin'
ON CONFLICT (user_id, role_id, department_id) DO NOTHING;

-- Step 4: Verify creation
SELECT 
  p.email,
  p.full_name,
  p.primary_role,
  p.status,
  r.display_name as role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.roles r ON r.id = ur.role_id
WHERE p.email = 'admin@jpmcollege.edu';

-- Login Credentials:
-- Email: admin@jpmcollege.edu
-- Password: Admin@123
