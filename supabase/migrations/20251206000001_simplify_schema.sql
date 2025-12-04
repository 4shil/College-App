-- ============================================
-- SIMPLIFY SCHEMA MIGRATION
-- - Remove sections (only 1 class per year)
-- - Remove programs table (courses = programs)
-- - Simplify relationships
-- ============================================

-- ============================================
-- 1. Make section_id nullable and optional in students
-- ============================================

-- Drop the old constraint if exists and make section_id nullable
ALTER TABLE students 
  ALTER COLUMN section_id DROP NOT NULL;

-- ============================================
-- 2. Remove section_id from teacher_courses
-- ============================================

-- Drop unique constraint first
ALTER TABLE teacher_courses 
  DROP CONSTRAINT IF EXISTS teacher_courses_teacher_id_course_id_section_id_academic_yea_key;

-- Add new unique constraint without section
ALTER TABLE teacher_courses 
  ADD CONSTRAINT teacher_courses_unique_assignment 
  UNIQUE(teacher_id, course_id, academic_year_id);

-- Make section_id nullable
ALTER TABLE teacher_courses 
  ALTER COLUMN section_id DROP NOT NULL;

-- ============================================
-- 3. Drop sections from timetable entries if exists
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timetable_entries' AND column_name = 'section_id'
  ) THEN
    ALTER TABLE timetable_entries ALTER COLUMN section_id DROP NOT NULL;
  END IF;
END $$;

-- ============================================
-- 4. Update attendance records section references
-- ============================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance_records' AND column_name = 'section_id'
  ) THEN
    ALTER TABLE attendance_records ALTER COLUMN section_id DROP NOT NULL;
  END IF;
END $$;

-- ============================================
-- 5. Create a simple view for class hierarchy
-- ============================================

-- View: Get class structure (Department -> Year -> Students)
CREATE OR REPLACE VIEW class_structure AS
SELECT 
  d.id as department_id,
  d.name as department_name,
  d.code as department_code,
  y.id as year_id,
  y.year_number,
  y.name as year_name,
  COUNT(s.id) as student_count
FROM departments d
CROSS JOIN years y
LEFT JOIN students s ON s.department_id = d.id AND s.year_id = y.id AND s.current_status = 'active'
WHERE d.is_active = true AND y.is_active = true
GROUP BY d.id, d.name, d.code, y.id, y.year_number, y.name
ORDER BY d.name, y.year_number;

-- ============================================
-- 6. Helper function to get students for a class
-- ============================================

CREATE OR REPLACE FUNCTION get_class_students(
  p_department_id UUID,
  p_year_id UUID
)
RETURNS TABLE (
  student_id UUID,
  user_id UUID,
  full_name TEXT,
  roll_number TEXT,
  registration_number TEXT,
  email TEXT,
  photo_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.user_id,
    p.full_name,
    s.roll_number,
    s.registration_number,
    p.email,
    p.photo_url
  FROM students s
  JOIN profiles p ON p.id = s.user_id
  WHERE s.department_id = p_department_id
    AND s.year_id = p_year_id
    AND s.current_status = 'active'
  ORDER BY s.roll_number, p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Update RLS policies for simplified structure
-- ============================================

-- Drop old section-related policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read sections" ON sections;

-- ============================================
-- 8. Add comment explaining the simplified structure
-- ============================================

COMMENT ON TABLE departments IS 'Departments in the college (e.g., BCA, BBA, CSE)';
COMMENT ON TABLE years IS 'Academic years (1st Year, 2nd Year, etc.)';
COMMENT ON TABLE courses IS 'Subjects/Courses taught in each department per semester';
COMMENT ON TABLE students IS 'Students enrolled - identified by department + year (no sections)';

-- ============================================
-- DONE: Schema simplified
-- Structure is now: Department -> Year -> Students
-- No sections needed (1 class per department-year combination)
-- ============================================
