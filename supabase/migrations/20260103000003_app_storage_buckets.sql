-- Migration: App storage buckets + baseline policies
-- Date: 2026-01-03
-- Purpose:
--  - Create the common Storage buckets referenced in project docs.
--  - Provide baseline RLS policies for uploads and reads.
-- Notes:
--  - `teacher_uploads` bucket + policies already exist (see 20260102000003_teacher_uploads_storage.sql).
--  - Public buckets are intended for content that can be accessed via public URLs.
--  - Private buckets are intended for sensitive student uploads; use signed URLs / explicit policies later.

DO $$
BEGIN
  -- Ensure Storage tables exist (Supabase provides these in `storage` schema).
  -- If Storage is not enabled in the project, this migration will error; that is expected.
  PERFORM 1 FROM pg_namespace WHERE nspname = 'storage';
END $$;

-- Buckets
-- Public buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('profile-photos', 'profile-photos', true),
  ('teaching-materials', 'teaching-materials', true),
  ('documents', 'documents', true),
  ('notices', 'notices', true),
  ('library', 'library', true)
ON CONFLICT (id) DO NOTHING;

-- Private buckets (sensitive; prefer signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('submissions', 'submissions', false),
  ('external-uploads', 'external-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Policies (storage.objects)
-- Note: On Supabase hosted projects, the migration role may not be the owner of storage.objects.
-- RLS is already enabled on Storage tables by Supabase; we only manage policies here.

-- =========================
-- Public buckets policies
-- =========================

DROP POLICY IF EXISTS "Authenticated read public app buckets" ON storage.objects;
DROP POLICY IF EXISTS "Public read public app buckets" ON storage.objects;
CREATE POLICY "Public read public app buckets"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id IN ('avatars', 'profile-photos', 'teaching-materials', 'documents', 'notices', 'library')
);

DROP POLICY IF EXISTS "Authenticated upload public app buckets" ON storage.objects;
CREATE POLICY "Authenticated upload public app buckets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('avatars', 'profile-photos', 'teaching-materials', 'documents', 'notices', 'library')
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Owner update public app buckets" ON storage.objects;
CREATE POLICY "Owner update public app buckets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('avatars', 'profile-photos', 'teaching-materials', 'documents', 'notices', 'library')
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id IN ('avatars', 'profile-photos', 'teaching-materials', 'documents', 'notices', 'library')
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Owner delete public app buckets" ON storage.objects;
CREATE POLICY "Owner delete public app buckets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('avatars', 'profile-photos', 'teaching-materials', 'documents', 'notices', 'library')
  AND owner = auth.uid()
);

-- =========================
-- Private buckets policies
-- =========================

DROP POLICY IF EXISTS "Owner read private student buckets" ON storage.objects;
CREATE POLICY "Owner read private student buckets"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('submissions', 'external-uploads')
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Authenticated upload private student buckets" ON storage.objects;
CREATE POLICY "Authenticated upload private student buckets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('submissions', 'external-uploads')
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Owner update private student buckets" ON storage.objects;
CREATE POLICY "Owner update private student buckets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('submissions', 'external-uploads')
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id IN ('submissions', 'external-uploads')
  AND owner = auth.uid()
);

DROP POLICY IF EXISTS "Owner delete private student buckets" ON storage.objects;
CREATE POLICY "Owner delete private student buckets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('submissions', 'external-uploads')
  AND owner = auth.uid()
);
