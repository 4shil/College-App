-- ============================================
-- JPM COLLEGE APP - TIMETABLE SCHEMA UPDATE
-- Adds program_id and year_id to timetable_entries
-- Removes section_id dependency (no sections in this college)
-- ============================================

-- Drop existing table if it exists (from extended schema)
DROP TABLE IF EXISTS substitutions CASCADE;
DROP TABLE IF EXISTS timetable_entries CASCADE;

-- ============================================
-- PERIOD TIMINGS TABLE (College-specific)
-- ============================================

CREATE TABLE IF NOT EXISTS period_timings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_number INTEGER NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_break BOOLEAN DEFAULT false,
    break_type VARCHAR(20), -- 'short', 'lunch'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert JPM College period timings
INSERT INTO period_timings (period_number, start_time, end_time, duration_minutes, is_break, break_type) VALUES
(1, '09:40', '10:35', 55, false, NULL),
(2, '10:50', '11:40', 50, false, NULL),
(3, '11:50', '12:45', 55, false, NULL),
(4, '13:25', '14:15', 50, false, NULL),
(5, '14:20', '15:10', 50, false, NULL)
ON CONFLICT (period_number) DO NOTHING;

-- ============================================
-- TIMETABLE ENTRIES TABLE (Updated for Year+Program)
-- ============================================

CREATE TABLE timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    year_id UUID NOT NULL REFERENCES years(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=Monday, 5=Friday
    period INTEGER NOT NULL CHECK (period BETWEEN 1 AND 5),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_id UUID REFERENCES courses(id),
    teacher_id UUID REFERENCES teachers(id),
    room VARCHAR(50),
    is_lab BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Unique constraint: one entry per program/year/academic_year/day/period
    UNIQUE(program_id, year_id, academic_year_id, day_of_week, period)
);

-- Indexes for faster queries
CREATE INDEX idx_timetable_program ON timetable_entries(program_id);
CREATE INDEX idx_timetable_year ON timetable_entries(year_id);
CREATE INDEX idx_timetable_teacher ON timetable_entries(teacher_id);
CREATE INDEX idx_timetable_course ON timetable_entries(course_id);
CREATE INDEX idx_timetable_day ON timetable_entries(day_of_week);

-- ============================================
-- SUBSTITUTIONS TABLE (Updated)
-- ============================================

CREATE TABLE substitutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_entry_id UUID NOT NULL REFERENCES timetable_entries(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    original_teacher_id UUID NOT NULL REFERENCES teachers(id),
    substitute_teacher_id UUID NOT NULL REFERENCES teachers(id),
    reason TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(timetable_entry_id, date)
);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE period_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies first
DROP POLICY IF EXISTS "All users can read period_timings" ON period_timings;
DROP POLICY IF EXISTS "Admins can manage period_timings" ON period_timings;

-- Period timings: Read by all authenticated, write by admin
CREATE POLICY "All users can read period_timings" ON period_timings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage period_timings" ON period_timings
    FOR ALL USING (is_admin());

-- Timetable entries: Read by all authenticated, write by admin/HOD
CREATE POLICY "All users can read timetable" ON timetable_entries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage timetable" ON timetable_entries
    FOR ALL USING (is_admin());

-- HOD can manage timetable for their department's programs
CREATE POLICY "HOD can manage department timetable" ON timetable_entries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM programs p
            JOIN user_roles ur ON ur.department_id = p.department_id
            JOIN roles r ON ur.role_id = r.id
            WHERE p.id = program_id
            AND ur.user_id = auth.uid()
            AND r.name = 'hod'
            AND ur.is_active = true
        )
    );

-- Substitutions: Read by all authenticated, manage by admin/HOD
CREATE POLICY "All users can read substitutions" ON substitutions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage substitutions" ON substitutions
    FOR ALL USING (is_admin());

-- ============================================
-- TRIGGER: Update timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_timetable_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timetable_updated_at
    BEFORE UPDATE ON timetable_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_timetable_updated_at();

-- ============================================
-- DONE!
-- ============================================
