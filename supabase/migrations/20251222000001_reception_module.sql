-- ============================================
-- JPM COLLEGE APP - RECEPTION MODULE
-- Adds: reception_admin role + permissions, reception tables and RPCs
-- Scope: execution-only front desk role (no admin creep)
-- ============================================

-- 1) Expand roles.category to allow 'staff'
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT conname INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.roles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%category%'
    AND pg_get_constraintdef(oid) ILIKE '%admin%'
    AND pg_get_constraintdef(oid) ILIKE '%teacher%'
    AND pg_get_constraintdef(oid) ILIKE '%student%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.roles DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

DO $$
BEGIN
  ALTER TABLE public.roles
    ADD CONSTRAINT roles_category_check CHECK (category IN ('admin', 'teacher', 'student', 'staff'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- 2) Create/Upsert reception_admin role (category = staff)
INSERT INTO public.roles (name, display_name, description, category, permissions, is_active)
VALUES (
  'reception_admin',
  'Reception Admin',
  'Execution-only front desk role (gate pass verification, late pass logs, view-only notices)',
  'staff',
  jsonb_build_object(
    'reception_view_approved_gate_passes', true,
    'reception_mark_gate_pass_exit', true,
    'reception_issue_late_pass', true,
    'reception_view_todays_logs', true,
    'reception_view_notices', true
  ),
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  permissions = EXCLUDED.permissions,
  is_active = true,
  updated_at = NOW();

-- 3) Update module access mapping function to include reception
CREATE OR REPLACE FUNCTION can_access_module(user_id UUID, module_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  can_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = can_access_module.user_id
      AND r.is_active = true
      AND (
        r.name = 'super_admin'
        OR (module_name = 'users' AND r.name IN ('principal', 'department_admin'))
        OR (module_name = 'academic' AND r.name = 'super_admin')
        OR (module_name = 'exams' AND r.name IN ('exam_cell_admin'))
        OR (module_name = 'assignments' AND r.name IN ('hod', 'exam_cell_admin'))
        OR (module_name = 'library' AND r.name = 'library_admin')
        OR (module_name = 'fees' AND r.name = 'finance_admin')
        OR (module_name = 'bus' AND r.name = 'bus_admin')
        OR (module_name = 'canteen' AND r.name = 'canteen_admin')
        OR (module_name = 'notices' AND r.name IN ('principal', 'department_admin', 'hod'))
        OR (module_name = 'settings' AND r.name = 'super_admin')
        OR (module_name = 'attendance' AND r.name IN ('hod'))
        OR (module_name = 'reception' AND r.name IN ('reception_admin'))
      )
  ) INTO can_access;

  RETURN can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_access_module TO authenticated;

-- 4) Tables
CREATE TABLE IF NOT EXISTS public.reception_gate_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  admission_no VARCHAR(50) NOT NULL,
  student_name VARCHAR(100),
  reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  exit_marked_at TIMESTAMPTZ,
  exit_marked_by UUID REFERENCES public.profiles(id),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT gate_pass_close_consistency CHECK (
    (exit_marked_at IS NULL AND closed_at IS NULL)
    OR (exit_marked_at IS NOT NULL AND closed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_reception_gate_passes_student ON public.reception_gate_passes(student_id);
CREATE INDEX IF NOT EXISTS idx_reception_gate_passes_admission_no ON public.reception_gate_passes(admission_no);
CREATE INDEX IF NOT EXISTS idx_reception_gate_passes_approved_at ON public.reception_gate_passes(approved_at);
CREATE INDEX IF NOT EXISTS idx_reception_gate_passes_exit_marked_at ON public.reception_gate_passes(exit_marked_at);

CREATE TABLE IF NOT EXISTS public.reception_late_pass_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  admission_no VARCHAR(50) NOT NULL,
  student_name VARCHAR(100),
  notes TEXT,
  log_date DATE NOT NULL,
  issued_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_reception_late_pass_logs_student ON public.reception_late_pass_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_reception_late_pass_logs_date ON public.reception_late_pass_logs(log_date);

-- 5) Enable RLS
ALTER TABLE public.reception_gate_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_late_pass_logs ENABLE ROW LEVEL SECURITY;

-- 6) Permissions
-- Gate passes are created/approved by admins (not reception) and closed by reception via RPC.
-- Late pass logs are append-only via RPC (not direct inserts).

-- Gate passes: allow normal table access for authenticated, controlled by RLS policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reception_gate_passes TO authenticated;

-- Late pass logs: view-only for authenticated; inserts happen via RPC
REVOKE ALL ON public.reception_late_pass_logs FROM authenticated;
GRANT SELECT ON public.reception_late_pass_logs TO authenticated;

-- 7) RLS policies
DROP POLICY IF EXISTS "Admins manage reception gate passes" ON public.reception_gate_passes;
CREATE POLICY "Admins manage reception gate passes" ON public.reception_gate_passes
  FOR ALL TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Reception can view approved gate passes" ON public.reception_gate_passes;
CREATE POLICY "Reception can view approved gate passes" ON public.reception_gate_passes
  FOR SELECT TO authenticated
  USING (
    approved_at IS NOT NULL
    AND (
      has_permission(auth.uid(), 'reception_view_approved_gate_passes')
      OR has_permission(auth.uid(), 'reception_view_todays_logs')
    )
  );

DROP POLICY IF EXISTS "Reception can view late pass logs" ON public.reception_late_pass_logs;
CREATE POLICY "Reception can view late pass logs" ON public.reception_late_pass_logs
  FOR SELECT TO authenticated
  USING (
    has_permission(auth.uid(), 'reception_view_todays_logs')
    OR has_permission(auth.uid(), 'reception_issue_late_pass')
  );

-- 8) RPC: student lookup (Admission No only)
CREATE OR REPLACE FUNCTION public.reception_get_student_by_admission_no(p_admission_no TEXT)
RETURNS TABLE(
  student_id UUID,
  admission_no TEXT,
  student_name TEXT,
  phone TEXT,
  department_name TEXT,
  department_code TEXT,
  year_name TEXT,
  year_number INTEGER
) AS $$
BEGIN
  IF NOT (
    has_permission(auth.uid(), 'reception_view_approved_gate_passes')
    OR has_permission(auth.uid(), 'reception_mark_gate_pass_exit')
    OR has_permission(auth.uid(), 'reception_issue_late_pass')
    OR has_permission(auth.uid(), 'reception_view_todays_logs')
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.registration_number,
    p.full_name,
    p.phone,
    d.name,
    d.code,
    y.name,
    y.year_number
  FROM public.students s
  JOIN public.profiles p ON p.id = s.user_id
  JOIN public.departments d ON d.id = s.department_id
  JOIN public.years y ON y.id = s.year_id
  WHERE s.registration_number = p_admission_no
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reception_get_student_by_admission_no TO authenticated;

-- 9) RPC: close gate pass (mark EXIT + close; immutable)
CREATE OR REPLACE FUNCTION public.reception_close_gate_pass(p_pass_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_old public.reception_gate_passes%ROWTYPE;
  v_new public.reception_gate_passes%ROWTYPE;
BEGIN
  IF NOT has_permission(auth.uid(), 'reception_mark_gate_pass_exit') THEN
    RETURN QUERY SELECT false, 'Not authorized.';
    RETURN;
  END IF;

  SELECT * INTO v_old
  FROM public.reception_gate_passes
  WHERE id = p_pass_id
  LIMIT 1;

  IF v_old.id IS NULL THEN
    RETURN QUERY SELECT false, 'Gate pass not found.';
    RETURN;
  END IF;

  IF v_old.approved_at IS NULL THEN
    RETURN QUERY SELECT false, 'Gate pass is not approved.';
    RETURN;
  END IF;

  IF v_old.closed_at IS NOT NULL OR v_old.exit_marked_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'Gate pass already closed.';
    RETURN;
  END IF;

  UPDATE public.reception_gate_passes
  SET exit_marked_at = NOW(),
      exit_marked_by = auth.uid(),
      closed_at = NOW(),
      closed_by = auth.uid(),
      updated_at = NOW()
  WHERE id = p_pass_id
  RETURNING * INTO v_new;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    auth.uid(),
    'UPDATE',
    'reception_gate_passes',
    p_pass_id,
    to_jsonb(v_old),
    to_jsonb(v_new)
  );

  RETURN QUERY SELECT true, 'Gate pass closed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reception_close_gate_pass TO authenticated;

-- 10) RPC: issue late pass (append-only, one per day, cutoff at end of 3rd hour)
CREATE OR REPLACE FUNCTION public.reception_issue_late_pass(p_admission_no TEXT, p_notes TEXT DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_student public.students%ROWTYPE;
  v_student_name TEXT;
  v_now_ist TIMESTAMPTZ;
  v_today DATE;
  v_cutoff TIME;
BEGIN
  IF NOT has_permission(auth.uid(), 'reception_issue_late_pass') THEN
    RETURN QUERY SELECT false, 'Not authorized.';
    RETURN;
  END IF;

  SELECT * INTO v_student
  FROM public.students
  WHERE registration_number = p_admission_no
  LIMIT 1;

  IF v_student.id IS NULL THEN
    RETURN QUERY SELECT false, 'Student not found.';
    RETURN;
  END IF;

  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = v_student.user_id;

  -- Use IST for college timings
  v_now_ist := timezone('Asia/Kolkata', NOW());
  v_today := (v_now_ist)::date;

  SELECT end_time INTO v_cutoff FROM public.period_timings WHERE period_number = 3;
  IF v_cutoff IS NOT NULL AND (v_now_ist::time > v_cutoff) THEN
    RETURN QUERY SELECT false, 'Cutoff passed (end of 3rd hour).';
    RETURN;
  END IF;

  -- Enforce one-per-day via UNIQUE, but give friendly message
  IF EXISTS (
    SELECT 1 FROM public.reception_late_pass_logs
    WHERE student_id = v_student.id AND log_date = v_today
  ) THEN
    RETURN QUERY SELECT false, 'Late pass already issued today.';
    RETURN;
  END IF;

  INSERT INTO public.reception_late_pass_logs (student_id, admission_no, student_name, notes, log_date, issued_by)
  VALUES (v_student.id, v_student.registration_number, v_student_name, NULLIF(btrim(p_notes), ''), v_today, auth.uid());

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    auth.uid(),
    'CREATE',
    'reception_late_pass_logs',
    (SELECT id FROM public.reception_late_pass_logs WHERE student_id = v_student.id AND log_date = v_today LIMIT 1),
    NULL,
    jsonb_build_object(
      'student_id', v_student.id,
      'admission_no', v_student.registration_number,
      'log_date', v_today
    )
  );

  RETURN QUERY SELECT true, 'Late pass logged.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reception_issue_late_pass TO authenticated;
