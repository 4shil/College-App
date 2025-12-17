-- Delete all users except one admin user
-- Run this in Supabase SQL Editor

-- First, let's see what we have
SELECT email, primary_role, status FROM profiles ORDER BY created_at;

-- Delete all profiles except the super admin
-- This will NOT delete from auth.users (you need to do that manually in Dashboard > Authentication)
DELETE FROM profiles 
WHERE email NOT IN ('superadmin@college.com', 'admin@jpmcollege.edu')
  AND primary_role IS NOT NULL;

-- Verify remaining users
SELECT 
  email, 
  primary_role, 
  status,
  full_name
FROM profiles 
ORDER BY created_at;

-- Note: To delete from Auth as well:
-- 1. Go to Supabase Dashboard
-- 2. Authentication > Users
-- 3. Manually delete users (or use service role key with admin API)
