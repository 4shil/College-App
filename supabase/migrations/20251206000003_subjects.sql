-- ============================================
-- JPM COLLEGE APP - SUBJECTS MODULE
-- Adds core subjects table linked to courses (degree programs) and semesters
-- ============================================

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    credits INTEGER DEFAULT 0,
    contact_hours INTEGER DEFAULT 0,
    subject_type VARCHAR(20) DEFAULT 'core' CHECK (subject_type IN ('core','elective','open_elective','lab')),
    course_id UUID NOT NULL REFERENCES courses(id),
    semester_id UUID REFERENCES semesters(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_subjects_course ON subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_subjects_semester ON subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Basic policies (align with other admin-managed tables)
DROP POLICY IF EXISTS "Admins full access subjects" ON subjects;
DROP POLICY IF EXISTS "Auth read active subjects" ON subjects;

-- Admins: full access
CREATE POLICY "Admins full access subjects" ON subjects
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON r.name = p.primary_role
    WHERE p.id = auth.uid() AND r.category = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    JOIN roles r ON r.name = p.primary_role
    WHERE p.id = auth.uid() AND r.category = 'admin'
  ));

-- Authenticated users: read active subjects
CREATE POLICY "Auth read active subjects" ON subjects
  FOR SELECT
  USING (is_active = true);

-- Trigger to maintain updated_at
DROP TRIGGER IF EXISTS trg_subjects_updated_at ON subjects;
CREATE OR REPLACE FUNCTION set_subjects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION set_subjects_updated_at();
