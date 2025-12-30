-- Migration: Fix student registration to use courses (programmes)
-- Date: 2025-12-30
-- Purpose:
--   - The legacy registration flow used programs/program_id, but programs table is removed.
--   - Recreate complete_student_registration() to treat p_registration_data->>'program_id' as a Programme ID in courses.
--   - Ensure allowed_students.expected_program_id references courses for validation.

DO $$
BEGIN
  -- Ensure students.course_id exists (programme id)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.students
      ADD COLUMN course_id UUID REFERENCES public.courses(id);
    CREATE INDEX IF NOT EXISTS idx_students_course ON public.students(course_id);
  END IF;

  -- Ensure allowed_students.expected_program_id exists (legacy column name) and points at courses
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'allowed_students'
      AND column_name = 'expected_program_id'
  ) THEN
    -- Drop legacy FK if it exists (may have referenced programs)
    IF EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'allowed_students'
        AND constraint_name = 'allowed_students_expected_program_id_fkey'
    ) THEN
      ALTER TABLE public.allowed_students
        DROP CONSTRAINT allowed_students_expected_program_id_fkey;
    END IF;

    -- Add FK to courses if missing
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'allowed_students'
        AND constraint_name = 'allowed_students_expected_program_id_fkey'
    ) THEN
      ALTER TABLE public.allowed_students
        ADD CONSTRAINT allowed_students_expected_program_id_fkey
        FOREIGN KEY (expected_program_id)
        REFERENCES public.courses(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.complete_student_registration(
  p_user_id UUID,
  p_apaar_id VARCHAR,
  p_registration_data JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_programme_id UUID;
  v_department_id UUID;
  v_year_id UUID;
  v_semester_id UUID;
  v_student_role_id UUID;
  v_academic_year_id UUID;
BEGIN
  -- Treat p_registration_data->>'program_id' as a Programme (degree program) id in courses
  v_programme_id := NULLIF(p_registration_data->>'program_id', '')::UUID;

  IF v_programme_id IS NULL THEN
    RETURN QUERY SELECT false, 'No programme selected.';
    RETURN;
  END IF;

  -- Validate programme exists in courses and has program_type
  SELECT c.id, c.department_id
    INTO v_programme_id, v_department_id
  FROM public.courses c
  WHERE c.id = v_programme_id
    AND c.program_type IS NOT NULL
    AND c.is_active = true;

  IF v_programme_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid programme selected.';
    RETURN;
  END IF;

  -- Get year and semester
  SELECT y.id INTO v_year_id
  FROM public.years y
  WHERE y.year_number = (p_registration_data->>'year')::INTEGER;

  SELECT s.id INTO v_semester_id
  FROM public.semesters s
  WHERE s.semester_number = (p_registration_data->>'semester')::INTEGER;

  SELECT r.id INTO v_student_role_id
  FROM public.roles r
  WHERE r.name = 'student';

  SELECT ay.id INTO v_academic_year_id
  FROM public.academic_years ay
  WHERE ay.is_current = true;

  IF v_year_id IS NULL OR v_semester_id IS NULL OR v_student_role_id IS NULL OR v_academic_year_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid academic year/semester configuration.';
    RETURN;
  END IF;

  -- Update profile
  UPDATE public.profiles SET
    full_name = p_registration_data->>'full_name',
    phone = p_registration_data->>'phone',
    date_of_birth = (p_registration_data->>'date_of_birth')::DATE,
    gender = (p_registration_data->>'gender')::gender_type,
    primary_role = 'student',
    status = 'active'
  WHERE id = p_user_id;

  -- Create student record
  INSERT INTO public.students (
    user_id,
    apaar_id,
    registration_number,
    roll_number,
    course_id,
    department_id,
    year_id,
    semester_id,
    academic_year_id,
    admission_year,
    admission_date,
    father_name,
    current_status
  ) VALUES (
    p_user_id,
    p_apaar_id,
    p_registration_data->>'admission_no',
    p_registration_data->>'roll_number',
    v_programme_id,
    v_department_id,
    v_year_id,
    v_semester_id,
    v_academic_year_id,
    EXTRACT(YEAR FROM NOW())::INTEGER,
    NOW()::DATE,
    p_registration_data->>'father_name',
    'active'
  );

  -- Assign student role
  INSERT INTO public.user_roles (user_id, role_id, department_id)
  VALUES (p_user_id, v_student_role_id, v_department_id)
  ON CONFLICT DO NOTHING;

  -- Mark APAAR ID as used
  UPDATE public.allowed_students SET
    is_used = true,
    used_by_user_id = p_user_id,
    used_at = NOW()
  WHERE apaar_id = p_apaar_id;

  RETURN QUERY SELECT true, 'Registration completed successfully!';
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_student_registration(UUID, VARCHAR, JSONB) TO authenticated;
