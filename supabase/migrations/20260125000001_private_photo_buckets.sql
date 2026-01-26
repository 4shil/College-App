-- ============================================================================
-- JPM COLLEGE APP - PRIVACY: MAKE PHOTO BUCKETS PRIVATE
-- Migration: 20260125000001_private_photo_buckets.sql
-- Date: January 25, 2026
-- Purpose: Update storage buckets to require authentication for profile photos
-- ============================================================================

-- 1) Update avatars bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- 2) Update hall_ticket_photos bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'hall_ticket_photos';

-- 3) Drop existing public policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Hall ticket photos are publicly accessible" ON storage.objects;

-- 4) Create authenticated read policies for avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 5) Create authenticated read policies for hall_ticket_photos  
CREATE POLICY "Authenticated users can view hall ticket photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hall_ticket_photos' 
  AND auth.role() = 'authenticated'
);

-- 6) Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7) Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 8) Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 9) Admins can manage hall ticket photos
CREATE POLICY "Admins can manage hall ticket photos"
ON storage.objects FOR ALL
USING (
  bucket_id = 'hall_ticket_photos'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'principal', 'exam_cell_admin')
    AND ur.is_active = true
  )
);

-- 10) Students can view their own hall ticket photo
CREATE POLICY "Students can view own hall ticket photo"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hall_ticket_photos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- VERIFICATION: Run these to confirm changes
-- ============================================================================
-- SELECT id, public FROM storage.buckets WHERE id IN ('avatars', 'hall_ticket_photos');
-- SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
