-- ============================================
-- ADD PENDING STATUS TO USER_STATUS ENUM
-- Run this in Supabase SQL Editor
-- ============================================

-- Add 'pending' value to the user_status enum
ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'pending';

-- Verify it was added
SELECT enum_range(NULL::user_status);
