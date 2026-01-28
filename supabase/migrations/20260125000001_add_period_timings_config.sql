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

-- Insert default period timings (5 periods with breaks - correct schedule)
INSERT INTO period_timings (period_number, start_time, end_time, is_break, duration_minutes) VALUES
(1, '09:40', '10:35', false, 55),      -- Period 1: 55 min
(2, '10:35', '10:50', true, 15),       -- Break: 15 min
(3, '10:50', '11:40', false, 50),      -- Period 2: 50 min
(4, '11:40', '11:50', true, 10),       -- Break: 10 min
(5, '11:50', '12:45', false, 55),      -- Period 3: 55 min
(6, '12:45', '13:25', true, 40),       -- Lunch Break: 40 min
(7, '13:25', '14:15', false, 50),      -- Period 4: 50 min
(8, '14:15', '14:20', true, 5),        -- Break: 5 min
(9, '14:20', '15:10', false, 50)       -- Period 5: 50 min
ON CONFLICT (period_number) DO NOTHING;

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
CREATE POLICY "Anyone can read period timings" ON period_timings
    FOR SELECT
    USING (true);

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
CREATE INDEX IF NOT EXISTS idx_period_timings_period ON period_timings(period_number);
CREATE INDEX IF NOT EXISTS idx_college_settings_key ON college_settings(key);

-- Function to get period timings (simple read access)
CREATE OR REPLACE FUNCTION get_period_timings()
RETURNS TABLE (
    period_number INTEGER,
    start_time TIME,
    end_time TIME,
    is_break BOOLEAN,
    duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.period_number,
        pt.start_time,
        pt.end_time,
        pt.is_break,
        pt.duration_minutes
    FROM period_timings pt
    ORDER BY pt.period_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
