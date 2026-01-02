-- Allow teachers to create/manage class-scoped notices only for sections they teach.

-- Notices table + RLS are created/enabled earlier in schema.

DROP POLICY IF EXISTS "Teachers create class notices" ON public.notices;
DROP POLICY IF EXISTS "Teachers update own class notices" ON public.notices;
DROP POLICY IF EXISTS "Teachers delete own class notices" ON public.notices;

CREATE POLICY "Teachers create class notices"
ON public.notices
FOR INSERT
TO authenticated
WITH CHECK (
  scope = 'class'
  AND author_id = auth.uid()
  AND section_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.teachers t
    JOIN public.academic_years ay ON ay.is_current = true
    JOIN public.timetable_entries te
      ON te.teacher_id = t.id
     AND te.section_id = public.notices.section_id
     AND te.academic_year_id = ay.id
     AND te.is_active = true
    WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers update own class notices"
ON public.notices
FOR UPDATE
TO authenticated
USING (
  scope = 'class'
  AND author_id = auth.uid()
)
WITH CHECK (
  scope = 'class'
  AND author_id = auth.uid()
  AND section_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.teachers t
    JOIN public.academic_years ay ON ay.is_current = true
    JOIN public.timetable_entries te
      ON te.teacher_id = t.id
     AND te.section_id = public.notices.section_id
     AND te.academic_year_id = ay.id
     AND te.is_active = true
    WHERE t.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers delete own class notices"
ON public.notices
FOR DELETE
TO authenticated
USING (
  scope = 'class'
  AND author_id = auth.uid()
);
