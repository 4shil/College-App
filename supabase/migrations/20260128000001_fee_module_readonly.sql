-- Remove all fee write/update/delete permissions and convert to read-only
-- Date: 2026-01-28
-- Purpose: Fee module admins can only read data; external web app handles modifications

-- 1) Drop all existing fee-related RLS policies
DROP POLICY IF EXISTS "Admins full access fees" ON public.fee_structures;
DROP POLICY IF EXISTS "Admins can manage fee structures" ON public.fee_structures;
DROP POLICY IF EXISTS "Finance admins manage fee structures" ON public.fee_structures;

DROP POLICY IF EXISTS "Students view own fees" ON public.student_fees;
DROP POLICY IF EXISTS "Admins manage student fees" ON public.student_fees;
DROP POLICY IF EXISTS "Finance admins manage student fees" ON public.student_fees;

DROP POLICY IF EXISTS "Students view own fee payments" ON public.fee_payments;
DROP POLICY IF EXISTS "Admins manage fee payments" ON public.fee_payments;
DROP POLICY IF EXISTS "Finance admins manage fee payments" ON public.fee_payments;

-- 2) Create READ-ONLY policies for fee structures
CREATE POLICY "Anyone authenticated can view fee structures"
  ON public.fee_structures
  FOR SELECT
  TO authenticated
  USING (true);

-- 3) Create READ-ONLY policies for student_fees
CREATE POLICY "Students can view their own fees"
  ON public.student_fees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = public.student_fees.student_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Finance admins can view all student fees"
  ON public.student_fees
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'finance_admin', 'principal')
      AND ur.is_active = true
    )
  );

-- 4) Create READ-ONLY policies for fee_payments
CREATE POLICY "Students can view their own fee payments"
  ON public.fee_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_fees sf
      JOIN public.students s ON s.id = sf.student_id
      WHERE sf.id = public.fee_payments.student_fee_id
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Finance admins can view all fee payments"
  ON public.fee_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'finance_admin', 'principal')
      AND ur.is_active = true
    )
  );

-- 5) Update finance_admin role permissions to read-only
UPDATE public.roles
SET permissions = jsonb_build_object(
  'view_fees', true,
  'view_fee_structures', true,
  'view_fee_payments', true,
  'view_fee_reports', true,
  'view_financial_reports', true
)
WHERE name = 'finance_admin';

-- 6) Remove INSERT/UPDATE/DELETE grants (keep only SELECT)
REVOKE INSERT, UPDATE, DELETE ON public.fee_structures FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.student_fees FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.fee_payments FROM authenticated;

GRANT SELECT ON public.fee_structures TO authenticated;
GRANT SELECT ON public.student_fees TO authenticated;
GRANT SELECT ON public.fee_payments TO authenticated;

-- 7) Create read-only view functions for fee module
CREATE OR REPLACE FUNCTION get_student_fee_summary(p_student_id UUID DEFAULT NULL)
RETURNS TABLE (
  total_due NUMERIC,
  total_paid NUMERIC,
  balance NUMERIC,
  payment_status TEXT
) AS $$
BEGIN
  -- If student_id not provided, use current user's student record
  IF p_student_id IS NULL THEN
    SELECT s.id INTO p_student_id
    FROM public.students s
    WHERE s.user_id = auth.uid()
    LIMIT 1;
  END IF;

  -- Verify access (student can view own, admins can view any)
  IF NOT (
    EXISTS (SELECT 1 FROM public.students WHERE id = p_student_id AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('super_admin', 'finance_admin', 'principal')
      AND ur.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(sf.amount_due), 0) AS total_due,
    COALESCE(SUM(sf.amount_paid), 0) AS total_paid,
    COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) AS balance,
    CASE
      WHEN COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) = 0 THEN 'paid'
      WHEN COALESCE(SUM(sf.amount_paid), 0) > 0 THEN 'partial'
      ELSE 'pending'
    END AS payment_status
  FROM public.student_fees sf
  WHERE sf.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_student_fee_summary TO authenticated;

COMMENT ON FUNCTION get_student_fee_summary IS 'Read-only fee summary for students and admins';

-- 8) Create fee defaulters view (read-only)
CREATE OR REPLACE FUNCTION get_fee_defaulters(
  p_days_overdue INTEGER DEFAULT 30
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  registration_number TEXT,
  department_name TEXT,
  year_name TEXT,
  total_due NUMERIC,
  total_paid NUMERIC,
  balance NUMERIC,
  oldest_due_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  -- Verify finance admin access
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('super_admin', 'finance_admin', 'principal')
    AND ur.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    p.full_name,
    s.registration_number,
    d.name AS department_name,
    y.name AS year_name,
    COALESCE(SUM(sf.amount_due), 0) AS total_due,
    COALESCE(SUM(sf.amount_paid), 0) AS total_paid,
    COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) AS balance,
    MIN(sf.due_date) AS oldest_due_date,
    EXTRACT(DAY FROM CURRENT_DATE - MIN(sf.due_date))::INTEGER AS days_overdue
  FROM public.students s
  JOIN public.profiles p ON p.id = s.user_id
  LEFT JOIN public.departments d ON d.id = s.department_id
  LEFT JOIN public.years y ON y.id = s.year_id
  JOIN public.student_fees sf ON sf.student_id = s.id
  WHERE sf.payment_status != 'paid'
    AND sf.due_date < CURRENT_DATE
    AND (sf.amount_due - sf.amount_paid) > 0
  GROUP BY s.id, p.full_name, s.registration_number, d.name, y.name
  HAVING EXTRACT(DAY FROM CURRENT_DATE - MIN(sf.due_date))::INTEGER >= p_days_overdue
  ORDER BY days_overdue DESC, balance DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_fee_defaulters TO authenticated;

COMMENT ON FUNCTION get_fee_defaulters IS 'Read-only view of fee defaulters for finance admins';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fee module converted to READ-ONLY';
  RAISE NOTICE '✅ Finance admins can now only view fee data';
  RAISE NOTICE '✅ External web app should handle all fee modifications';
END $$;
