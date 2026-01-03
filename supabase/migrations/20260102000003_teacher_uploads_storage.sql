-- Migration: Teacher uploads storage bucket + policies
-- Date: 2026-01-02
-- Purpose:
--  - Create a public storage bucket for teacher-uploaded materials/assignment attachments.
--  - Allow authenticated users to read; allow authenticated users to upload; allow owners to delete.

-- Bucket (public so existing UI can open URLs directly)
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher_uploads', 'teacher_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Policies (storage.objects is in the storage schema)

DROP POLICY IF EXISTS "Authenticated read teacher_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read teacher_uploads" ON storage.objects;
CREATE POLICY "Public read teacher_uploads"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'teacher_uploads');

DROP POLICY IF EXISTS "Authenticated upload teacher_uploads" ON storage.objects;
CREATE POLICY "Authenticated upload teacher_uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'teacher_uploads');

DROP POLICY IF EXISTS "Owner delete teacher_uploads" ON storage.objects;
CREATE POLICY "Owner delete teacher_uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'teacher_uploads' AND owner = auth.uid());
