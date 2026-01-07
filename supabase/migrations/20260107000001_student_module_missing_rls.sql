-- Migration: Student module missing RLS coverage
-- Date: 2026-01-07
-- Purpose:
--  - Add student/auth read/write policies for tables queried by the student module.
--  - These tables already have RLS enabled, but without policies they return empty/deny writes.

-- Ensure RLS enabled (idempotent)
ALTER TABLE IF EXISTS public.canteen_daily_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.canteen_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.minor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_minor_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.feedback ENABLE ROW LEVEL SECURITY;

-- =========================
-- CANTEEN
-- =========================

DROP POLICY IF EXISTS "Auth users read canteen daily menu" ON public.canteen_daily_menu;
CREATE POLICY "Auth users read canteen daily menu"
ON public.canteen_daily_menu
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users read own canteen tokens" ON public.canteen_tokens;
CREATE POLICY "Users read own canteen tokens"
ON public.canteen_tokens
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =========================
-- BUS
-- =========================

DROP POLICY IF EXISTS "Auth users read bus stops" ON public.bus_stops;
CREATE POLICY "Auth users read bus stops"
ON public.bus_stops
FOR SELECT
TO authenticated
USING (true);

-- =========================
-- FEES
-- =========================

DROP POLICY IF EXISTS "Students view own fee payments" ON public.fee_payments;
CREATE POLICY "Students view own fee payments"
ON public.fee_payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.student_fees sf
    JOIN public.students s ON s.id = sf.student_id
    WHERE sf.id = public.fee_payments.student_fee_id
      AND s.user_id = auth.uid()
  )
);

-- =========================
-- NOTICES
-- =========================

DROP POLICY IF EXISTS "Users manage own notice reads" ON public.notice_reads;
CREATE POLICY "Users manage own notice reads"
ON public.notice_reads
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =========================
-- LIBRARY
-- =========================

DROP POLICY IF EXISTS "Users read own book issues" ON public.book_issues;
CREATE POLICY "Users read own book issues"
ON public.book_issues
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =========================
-- EVENTS
-- =========================

DROP POLICY IF EXISTS "Students view own event certificates" ON public.event_certificates;
CREATE POLICY "Students view own event certificates"
ON public.event_certificates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.event_certificates.student_id
  )
);

-- =========================
-- HONORS / MINOR
-- =========================

DROP POLICY IF EXISTS "Auth users read minor subjects" ON public.minor_subjects;
CREATE POLICY "Auth users read minor subjects"
ON public.minor_subjects
FOR SELECT
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Students view own minor registrations" ON public.student_minor_registrations;
CREATE POLICY "Students view own minor registrations"
ON public.student_minor_registrations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.student_minor_registrations.student_id
  )
);

DROP POLICY IF EXISTS "Students create own minor registrations (pending only)" ON public.student_minor_registrations;
CREATE POLICY "Students create own minor registrations (pending only)"
ON public.student_minor_registrations
FOR INSERT
TO authenticated
WITH CHECK (
  status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.student_minor_registrations.student_id
  )
);

DROP POLICY IF EXISTS "Students update own minor registrations (pending only)" ON public.student_minor_registrations;
CREATE POLICY "Students update own minor registrations (pending only)"
ON public.student_minor_registrations
FOR UPDATE
TO authenticated
USING (
  status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.student_minor_registrations.student_id
  )
)
WITH CHECK (
  status = 'pending'
  AND approved_by IS NULL
  AND approved_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.user_id = auth.uid()
      AND s.id = public.student_minor_registrations.student_id
  )
);

-- =========================
-- FEEDBACK
-- =========================

DROP POLICY IF EXISTS "Users read own feedback" ON public.feedback;
CREATE POLICY "Users read own feedback"
ON public.feedback
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users create own feedback" ON public.feedback;
CREATE POLICY "Users create own feedback"
ON public.feedback
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
