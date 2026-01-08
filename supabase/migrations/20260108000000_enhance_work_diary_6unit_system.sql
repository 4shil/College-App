-- Enhanced Work Diary Schema for 6-Unit System
-- Date: 2026-01-08
-- Purpose: Support the quantifiable workload tracking system with monthly summaries and audit logs

-- ============================================
-- WORK DIARY SUMMARIES (Monthly Aggregation)
-- ============================================

CREATE TABLE IF NOT EXISTS work_diary_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_diary_id UUID NOT NULL REFERENCES work_diaries(id) ON DELETE CASCADE,
    
    -- Date range for the month
    month_start_date DATE NOT NULL,
    month_end_date DATE NOT NULL,
    
    -- Attendance Summary (manually filled by teacher)
    days_on_duty_leave INTEGER DEFAULT 0 CHECK (days_on_duty_leave >= 0),
    days_on_other_leave INTEGER DEFAULT 0 CHECK (days_on_other_leave >= 0),
    total_days_present INTEGER DEFAULT 0 CHECK (total_days_present >= 0),
    
    -- Unit I Summary (auto-calculated from daily timetable entries)
    -- These count the total number of classes taught
    unit_i_pg_count INTEGER DEFAULT 0 CHECK (unit_i_pg_count >= 0),      -- Master's classes
    unit_i_ug_count INTEGER DEFAULT 0 CHECK (unit_i_ug_count >= 0),      -- Degree classes
    
    -- Units II-VI Summary (auto-summed from daily_entries)
    -- These sum the hours entered for each unit across all days
    unit_ii_total_hours NUMERIC(8, 2) DEFAULT 0 CHECK (unit_ii_total_hours >= 0),   -- Tutorial
    unit_iii_total_hours NUMERIC(8, 2) DEFAULT 0 CHECK (unit_iii_total_hours >= 0), -- Examination
    unit_iv_total_hours NUMERIC(8, 2) DEFAULT 0 CHECK (unit_iv_total_hours >= 0),   -- Research
    unit_v_total_hours NUMERIC(8, 2) DEFAULT 0 CHECK (unit_v_total_hours >= 0),     -- Preparation
    unit_vi_total_hours NUMERIC(8, 2) DEFAULT 0 CHECK (unit_vi_total_hours >= 0),   -- Extension
    
    -- Averages per day (for reporting)
    unit_ii_avg_daily NUMERIC(4, 2),
    unit_iii_avg_daily NUMERIC(4, 2),
    unit_iv_avg_daily NUMERIC(4, 2),
    unit_v_avg_daily NUMERIC(4, 2),
    unit_vi_avg_daily NUMERIC(4, 2),
    
    -- Approval timestamps
    teacher_certified_at TIMESTAMPTZ,       -- When teacher marked as complete
    hod_reviewed_at TIMESTAMPTZ,            -- When HOD reviewed
    principal_reviewed_at TIMESTAMPTZ,      -- When Principal reviewed
    
    -- Audit
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    recalculated_at TIMESTAMPTZ,            -- If summary was updated after initial creation
    
    UNIQUE(work_diary_id)
);

CREATE INDEX IF NOT EXISTS idx_work_diary_summaries_diary ON work_diary_summaries(work_diary_id);
CREATE INDEX IF NOT EXISTS idx_work_diary_summaries_month ON work_diary_summaries(month_start_date, month_end_date);

-- ============================================
-- WORK DIARY AUDIT LOG (Approval Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS work_diary_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_diary_id UUID NOT NULL REFERENCES work_diaries(id) ON DELETE CASCADE,
    
    -- Who made the change and when
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- What changed
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'created',
        'drafted',
        'submitted',
        'hod_approved',
        'hod_rejected',
        'principal_approved',
        'principal_rejected',
        'edited',
        'resubmitted'
    )),
    
    -- Status before and after
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Reason for rejection (if applicable)
    rejection_reason TEXT,
    
    -- Additional context
    notes TEXT,
    
    -- IP address (optional, for security auditing)
    ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_work_diary_audit_diary ON work_diary_audit_log(work_diary_id);
CREATE INDEX IF NOT EXISTS idx_work_diary_audit_user ON work_diary_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_work_diary_audit_type ON work_diary_audit_log(change_type);
CREATE INDEX IF NOT EXISTS idx_work_diary_audit_timestamp ON work_diary_audit_log(changed_at);

-- ============================================
-- CLASS CODE MAPPING (Reference Table)
-- ============================================

-- This table maps the shorthand codes (D_1, M_2, etc.) to actual course/semester data
-- For reference and validation during data entry

CREATE TABLE IF NOT EXISTS class_code_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    
    -- The shorthand code
    code VARCHAR(10) NOT NULL,  -- e.g., "D_1", "M_3", "D_5"
    
    -- Mapping to actual program/semester
    program_level VARCHAR(20) NOT NULL CHECK (program_level IN ('UG', 'PG')), -- Degree or Master's
    program_type VARCHAR(50),   -- e.g., "B.Sc Computer Science", "M.Sc Physics"
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 6),
    
    -- Active flag
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(academic_year_id, code)
);

CREATE INDEX IF NOT EXISTS idx_class_code_mappings_code ON class_code_mappings(code);
CREATE INDEX IF NOT EXISTS idx_class_code_mappings_program ON class_code_mappings(program_level, semester_number);

-- ============================================
-- DAILY ENTRY HELPER TABLE (Optional)
-- ============================================

-- Optional: Normalize the JSONB daily_entries into a separate table for easier querying
-- This allows for more powerful analytics without having to parse JSONB

CREATE TABLE IF NOT EXISTS work_diary_daily_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_diary_id UUID NOT NULL REFERENCES work_diaries(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    
    -- Date information
    entry_date DATE NOT NULL,
    day_of_week VARCHAR(10),  -- Mon, Tue, Wed, etc.
    week_number INTEGER,      -- ISO week number
    
    -- Attendance status
    day_status VARCHAR(10) NOT NULL CHECK (day_status IN ('W', 'H', 'L')),
    -- W = Working Day, H = Holiday, L = Leave
    
    remarks TEXT,  -- Holiday name, leave reason, or notes
    
    -- Unit I - Lecture/Practical (Timetable classes)
    -- Each period stored as a separate field for easier querying
    spl_class_am VARCHAR(10),  -- D_1, M_2, etc.
    period_i VARCHAR(10),
    period_ii VARCHAR(10),
    period_iii VARCHAR(10),
    period_iv VARCHAR(10),
    period_v VARCHAR(10),
    spl_class_eve VARCHAR(10),
    
    -- Auto-calculated totals from periods
    total_pg_classes INTEGER DEFAULT 0,  -- Count of M_x codes
    total_ug_classes INTEGER DEFAULT 0,  -- Count of D_x codes
    
    -- Units II-VI - Non-Teaching Tasks (Hours)
    unit_ii_hours NUMERIC(4, 2) DEFAULT 0 CHECK (unit_ii_hours >= 0 AND unit_ii_hours <= 5),   -- Tutorial
    unit_iii_hours NUMERIC(4, 2) DEFAULT 0 CHECK (unit_iii_hours >= 0 AND unit_iii_hours <= 5), -- Exam
    unit_iv_hours NUMERIC(4, 2) DEFAULT 0 CHECK (unit_iv_hours >= 0 AND unit_iv_hours <= 5),   -- Research
    unit_v_hours NUMERIC(4, 2) DEFAULT 0 CHECK (unit_v_hours >= 0 AND unit_v_hours <= 5),     -- Preparation
    unit_vi_hours NUMERIC(4, 2) DEFAULT 0 CHECK (unit_vi_hours >= 0 AND unit_vi_hours <= 5),  -- Extension
    
    -- Total hours for the day (all non-teaching units combined)
    total_task_hours NUMERIC(5, 2) DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(work_diary_id, entry_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_entries_diary ON work_diary_daily_entries(work_diary_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_teacher ON work_diary_daily_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON work_diary_daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_status ON work_diary_daily_entries(day_status);

-- ============================================
-- FUNCTIONS FOR AUTOMATIC CALCULATIONS
-- ============================================

-- Function to calculate total PG and UG classes from class codes
CREATE OR REPLACE FUNCTION calculate_class_totals(
    spl_am VARCHAR,
    p1 VARCHAR,
    p2 VARCHAR,
    p3 VARCHAR,
    p4 VARCHAR,
    p5 VARCHAR,
    spl_eve VARCHAR
)
RETURNS TABLE(pg_count INTEGER, ug_count INTEGER) AS $$
DECLARE
    pg_total INTEGER := 0;
    ug_total INTEGER := 0;
BEGIN
    -- Count M_ codes for PG (Master's)
    pg_total := (CASE WHEN spl_am LIKE 'M_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p1 LIKE 'M_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p2 LIKE 'M_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p3 LIKE 'M_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p4 LIKE 'M_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p5 LIKE 'M_%' THEN 1 ELSE 0 END) +
                (CASE WHEN spl_eve LIKE 'M_%' THEN 1 ELSE 0 END);
    
    -- Count D_ codes for UG (Degree)
    ug_total := (CASE WHEN spl_am LIKE 'D_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p1 LIKE 'D_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p2 LIKE 'D_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p3 LIKE 'D_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p4 LIKE 'D_%' THEN 1 ELSE 0 END) +
                (CASE WHEN p5 LIKE 'D_%' THEN 1 ELSE 0 END) +
                (CASE WHEN spl_eve LIKE 'D_%' THEN 1 ELSE 0 END);
    
    RETURN QUERY SELECT pg_total, ug_total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate monthly summaries from daily entries
CREATE OR REPLACE FUNCTION calculate_monthly_summary(diary_id UUID)
RETURNS TABLE(
    pg_count INTEGER,
    ug_count INTEGER,
    unit_ii_hours NUMERIC,
    unit_iii_hours NUMERIC,
    unit_iv_hours NUMERIC,
    unit_v_hours NUMERIC,
    unit_vi_hours NUMERIC,
    days_present INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CAST(total_pg_classes AS INTEGER)), 0)::INTEGER,
        COALESCE(SUM(CAST(total_ug_classes AS INTEGER)), 0)::INTEGER,
        COALESCE(SUM(unit_ii_hours), 0),
        COALESCE(SUM(unit_iii_hours), 0),
        COALESCE(SUM(unit_iv_hours), 0),
        COALESCE(SUM(unit_v_hours), 0),
        COALESCE(SUM(unit_vi_hours), 0),
        COUNT(*) FILTER (WHERE day_status = 'W')::INTEGER
    FROM work_diary_daily_entries
    WHERE work_diary_id = diary_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES (Security)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE work_diary_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_diary_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_code_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_diary_daily_entries ENABLE ROW LEVEL SECURITY;

-- Work Diary Summaries: Teachers can read their own, HOD/Principal can read department/all
DROP POLICY IF EXISTS "Teachers read own diary summaries" ON work_diary_summaries;
CREATE POLICY "Teachers read own diary summaries" ON work_diary_summaries
    FOR SELECT
    TO authenticated
    USING (
        work_diary_id IN (
            SELECT id FROM work_diaries
            WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
    );

-- Audit Log: Read-only for all, auto-inserted on changes
DROP POLICY IF EXISTS "Audit log is append-only" ON work_diary_audit_log;
CREATE POLICY "Audit log is append-only" ON work_diary_audit_log
    FOR SELECT
    TO authenticated
    USING (
        work_diary_id IN (
            SELECT id FROM work_diaries WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
        OR work_diary_id IN (
            SELECT w.id FROM work_diaries w
            JOIN teachers t ON w.teacher_id = t.id
            JOIN departments d ON t.department_id = d.id
            WHERE d.hod_user_id = auth.uid()
        )
    );

-- Daily Entries: Same access as parent work_diary
DROP POLICY IF EXISTS "Daily entries follow diary access" ON work_diary_daily_entries;
CREATE POLICY "Daily entries follow diary access" ON work_diary_daily_entries
    FOR SELECT
    TO authenticated
    USING (
        work_diary_id IN (
            SELECT id FROM work_diaries
            WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Daily entries inserts/updates during draft" ON work_diary_daily_entries;
CREATE POLICY "Daily entries inserts/updates during draft" ON work_diary_daily_entries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        work_diary_id IN (
            SELECT id FROM work_diaries
            WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
            AND status = 'draft'
        )
    );

-- ============================================
-- NOTES
-- ============================================

-- Future Enhancement: Add triggers to automatically update summaries when daily entries change
-- Future Enhancement: Add data validation functions to ensure class codes are valid
-- Future Enhancement: Add notification function to alert HOD when diary is submitted for approval
