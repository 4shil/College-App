-- DELETE ALL USERS FROM DATABASE
-- Run this in Supabase SQL Editor
-- WARNING: This will delete EVERYTHING - all users from auth.users and profiles

-- Step 1: Delete all profiles (this will cascade delete related data)
DELETE FROM public.profiles;

-- Step 2: Delete all auth users
DELETE FROM auth.users;

-- Step 3: Verify deletion
SELECT COUNT(*) as remaining_profiles FROM public.profiles;
SELECT COUNT(*) as remaining_auth_users FROM auth.users;

-- You should see:
-- remaining_profiles: 0
-- remaining_auth_users: 0
