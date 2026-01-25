-- ============================================
-- Migration: Add college configuration tables
-- Created: January 25, 2026
-- Description: Add period_timings and college_settings tables
-- ============================================

-- Period timings table for customizable class schedules
CREATE TABLE IF NOT EXISTS period_timings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    period_number INTEGER NOT NULL CHECK (period_number >= 1 AND period_number <= 12),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break BOOLEAN DEFAULT false,
    label VARCHAR(50), -- e.g., "Lunch Break", "Period 1"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, period_number)
);

-- Insert default period timings (null department_id = college-wide default)
INSERT INTO period_timings (department_id, period_number, start_time, end_time, is_break, label) VALUES
(NULL, 1, '09:40', '10:35', false, 'Period 1'),
(NULL, 2, '10:35', '10:50', true, 'Short Break'),
(NULL, 3, '10:50', '11:40', false, 'Period 2'),
(NULL, 4, '11:40', '11:50', true, 'Short Break'),
(NULL, 5, '11:50', '12:45', false, 'Period 3'),
(NULL, 6, '12:45', '13:25', true, 'Lunch Break'),
(NULL, 7, '13:25', '14:15', false, 'Period 4'),
(NULL, 8, '14:15', '14:20', true, 'Short Break'),
(NULL, 9, '14:20', '15:10', false, 'Period 5'),
(NULL, 10, '15:10', '16:00', false, 'Period 6')
ON CONFLICT (department_id, period_number) DO NOTHING;

-- College settings table for general configuration
CREATE TABLE IF NOT EXISTS college_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Can be read by any authenticated user
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO college_settings (key, value, description, is_public) VALUES
('college_name', '"JPM College"', 'Name of the college', true),
('working_days', '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]', 'Working days of the week', true),
('attendance_threshold', '75', 'Minimum attendance percentage required', true),
('late_pass_limit', '3', 'Maximum late passes allowed per month', true),
('academic_year_start_month', '7', 'Month when academic year starts (7 = July)', true),
('academic_year_end_month', '5', 'Month when academic year ends (5 = May)', true)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE period_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for period_timings
CREATE POLICY "Anyone can read active period timings" ON period_timings
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage period timings" ON period_timings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.category = 'admin'
            AND ur.is_active = true
        )
    );

-- RLS policies for college_settings
CREATE POLICY "Anyone can read public settings" ON college_settings
    FOR SELECT
    USING (is_public = true);

CREATE POLICY "Admins can read all settings" ON college_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.category = 'admin'
            AND ur.is_active = true
        )
    );

CREATE POLICY "Admins can manage settings" ON college_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.name IN ('super_admin', 'principal')
            AND ur.is_active = true
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_period_timings_department ON period_timings(department_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_college_settings_key ON college_settings(key);

-- Function to get period timings for a department (falls back to default)
CREATE OR REPLACE FUNCTION get_period_timings(p_department_id UUID DEFAULT NULL)
RETURNS TABLE (
    period_number INTEGER,
    start_time TIME,
    end_time TIME,
    is_break BOOLEAN,
    label VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.period_number,
        pt.start_time,
        pt.end_time,
        pt.is_break,
        pt.label
    FROM period_timings pt
    WHERE pt.is_active = true
    AND (
        pt.department_id = p_department_id
        OR (pt.department_id IS NULL AND NOT EXISTS (
            SELECT 1 FROM period_timings pt2 
            WHERE pt2.department_id = p_department_id 
            AND pt2.period_number = pt.period_number
            AND pt2.is_active = true
        ))
    )
    ORDER BY pt.period_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
