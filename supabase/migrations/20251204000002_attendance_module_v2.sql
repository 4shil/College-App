-- =====================================================
-- ATTENDANCE MODULE V2 - Fixed Schema
-- JPM College App
-- Created: December 4, 2025
-- 
-- This migration extends the attendance system with:
-- - Holidays (college/department)
-- - Late tracking (4 late = 1 half-day leave)
-- - Enhanced logging for Super Admin
-- - Proxy detection
-- =====================================================

-- =====================================================
-- 0. ADD MISSING COLUMNS TO TEACHERS TABLE
-- =====================================================

-- Add is_hod column to teachers for HOD identification
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_hod BOOLEAN DEFAULT FALSE;

-- Create index for faster HOD lookups
CREATE INDEX IF NOT EXISTS idx_teachers_is_hod ON teachers(is_hod) WHERE is_hod = TRUE;

-- =====================================================
-- 1. HOLIDAYS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    holiday_type VARCHAR(50) NOT NULL CHECK (holiday_type IN ('college', 'department')),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- College-wide holidays have NULL department_id
    -- Department holidays have department_id set
    CONSTRAINT valid_holiday_scope CHECK (
        (holiday_type = 'college' AND department_id IS NULL) OR
        (holiday_type = 'department' AND department_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_department ON holidays(department_id);

-- =====================================================
-- 2. ENHANCED ATTENDANCE COLUMNS
-- Add new columns to existing attendance table from extended_schema
-- =====================================================

-- Add late tracking columns to attendance (main table)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Add timetable_entry_id to link attendance to timetable
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE SET NULL;

-- Add program_id and year_id for easier querying
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS year_id UUID REFERENCES years(id);

-- Add edit tracking columns to attendance_records
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_timetable ON attendance(timetable_entry_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_attendance_program ON attendance(program_id);
CREATE INDEX IF NOT EXISTS idx_attendance_year ON attendance(year_id);

-- =====================================================
-- 3. LATE PASSES TABLE (4 late = 1 half-day leave)
-- =====================================================
CREATE TABLE IF NOT EXISTS late_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    
    -- Count of late entries this month
    late_count INTEGER DEFAULT 0,
    
    -- Calculated half-day leaves (late_count / 4)
    half_day_leaves_deducted INTEGER DEFAULT 0,
    
    -- Which half of day was deducted (for display)
    -- 'morning' = before lunch (period 1-3), 'afternoon' = after lunch (period 4-5)
    last_deduction_type VARCHAR(20) CHECK (last_deduction_type IN ('morning', 'afternoon')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_late_pass UNIQUE (student_id, academic_year_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_late_passes_student ON late_passes(student_id);
CREATE INDEX IF NOT EXISTS idx_late_passes_month ON late_passes(month, year);

-- =====================================================
-- 4. ATTENDANCE LOGS TABLE (For Super Admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'marked', 'edited', 'bulk_marked', 'locked', 
        'holiday_created', 'holiday_deleted',
        'proxy_detected', 'late_converted'
    )),
    
    -- Who performed the action
    performed_by UUID NOT NULL REFERENCES profiles(id),
    performer_role VARCHAR(50),
    
    -- Target details
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('attendance', 'holiday', 'student', 'class')),
    target_id UUID,
    
    -- Context
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE SET NULL,
    
    -- Details stored as JSON
    details JSONB,
    ip_address VARCHAR(45),
    
    -- Metadata
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_performer ON attendance_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_action ON attendance_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student ON attendance_logs(student_id);

-- =====================================================
-- 5. ATTENDANCE SUMMARY VIEW (For quick reports)
-- Uses attendance_records for student-specific data
-- =====================================================
DROP VIEW IF EXISTS attendance_summary;
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    s.id AS student_id,
    s.registration_number AS roll_number,
    p.full_name AS student_name,
    a.course_id,
    c.code AS course_code,
    c.name AS course_name,
    s.program_id,
    s.year_id,
    a.academic_year_id,
    COUNT(DISTINCT ar.id) AS total_classes,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) AS late_count,
    ROUND(
        CASE WHEN COUNT(DISTINCT ar.id) > 0 THEN
            (COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(DISTINCT ar.id)) * 100
        ELSE 0 END, 
        2
    ) AS attendance_percentage
FROM students s
JOIN profiles p ON s.user_id = p.id
LEFT JOIN attendance_records ar ON ar.student_id = s.id
LEFT JOIN attendance a ON ar.attendance_id = a.id
LEFT JOIN courses c ON a.course_id = c.id
WHERE s.current_status = 'active'
GROUP BY s.id, s.registration_number, p.full_name, a.course_id, c.code, c.name, s.program_id, s.year_id, a.academic_year_id;

-- =====================================================
-- 6. FUNCTIONS
-- =====================================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trg_update_late_passes ON attendance_records;
DROP TRIGGER IF EXISTS trg_log_attendance ON attendance_records;

-- Drop existing functions to allow re-creating with different signatures
DROP FUNCTION IF EXISTS lock_old_attendance();
DROP FUNCTION IF EXISTS check_proxy_attendance(UUID, DATE, INTEGER, UUID);
DROP FUNCTION IF EXISTS update_late_passes();
DROP FUNCTION IF EXISTS log_attendance_action();

-- Function to auto-lock attendance after 24 hours
CREATE OR REPLACE FUNCTION lock_old_attendance()
RETURNS INTEGER AS $$
DECLARE
    locked_count INTEGER;
BEGIN
    UPDATE attendance
    SET is_locked = TRUE, locked_at = NOW()
    WHERE is_locked = FALSE
    AND marked_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS locked_count = ROW_COUNT;
    RETURN locked_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check for proxy (student marked in 2 classes at same time)
CREATE OR REPLACE FUNCTION check_proxy_attendance(
    p_student_id UUID,
    p_date DATE,
    p_period INTEGER,
    p_attendance_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_count
    FROM attendance_records ar
    JOIN attendance a ON ar.attendance_id = a.id
    WHERE ar.student_id = p_student_id
    AND a.date = p_date
    AND a.period = p_period
    AND a.id != COALESCE(p_attendance_id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    RETURN existing_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update late passes and calculate half-day leaves
CREATE OR REPLACE FUNCTION update_late_passes()
RETURNS TRIGGER AS $$
DECLARE
    v_month INTEGER;
    v_year INTEGER;
    v_date DATE;
    v_academic_year_id UUID;
    v_current_late_count INTEGER;
    v_new_half_days INTEGER;
    v_deduction_type VARCHAR(20);
    v_period INTEGER;
BEGIN
    -- Only process if status is 'late'
    IF NEW.status = 'late' THEN
        -- Get date and period from the parent attendance record
        SELECT a.date, a.period INTO v_date, v_period
        FROM attendance a 
        WHERE a.id = NEW.attendance_id;
        
        IF v_date IS NULL THEN
            RETURN NEW;
        END IF;
        
        v_month := EXTRACT(MONTH FROM v_date);
        v_year := EXTRACT(YEAR FROM v_date);
        
        -- Get current academic year
        SELECT id INTO v_academic_year_id FROM academic_years WHERE is_current = TRUE LIMIT 1;
        
        IF v_academic_year_id IS NULL THEN
            RETURN NEW;
        END IF;
        
        -- Insert or update late pass record
        INSERT INTO late_passes (student_id, academic_year_id, month, year, late_count)
        VALUES (NEW.student_id, v_academic_year_id, v_month, v_year, 1)
        ON CONFLICT (student_id, academic_year_id, month, year)
        DO UPDATE SET 
            late_count = late_passes.late_count + 1,
            updated_at = NOW();
        
        -- Get updated late count
        SELECT late_count INTO v_current_late_count
        FROM late_passes
        WHERE student_id = NEW.student_id
        AND academic_year_id = v_academic_year_id
        AND month = v_month
        AND year = v_year;
        
        -- Calculate half-day leaves (every 4 lates = 1 half-day)
        v_new_half_days := v_current_late_count / 4;
        
        -- Determine which half of day (based on period)
        IF v_new_half_days > 0 THEN
            IF COALESCE(v_period, 1) <= 3 THEN
                v_deduction_type := 'morning';
            ELSE
                v_deduction_type := 'afternoon';
            END IF;
            
            UPDATE late_passes
            SET half_day_leaves_deducted = v_new_half_days,
                last_deduction_type = v_deduction_type
            WHERE student_id = NEW.student_id
            AND academic_year_id = v_academic_year_id
            AND month = v_month
            AND year = v_year;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for late pass updates on attendance_records table
DROP TRIGGER IF EXISTS trg_update_late_passes ON attendance_records;
CREATE TRIGGER trg_update_late_passes
    AFTER INSERT ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_late_passes();

-- Function to log attendance actions
CREATE OR REPLACE FUNCTION log_attendance_action()
RETURNS TRIGGER AS $$
DECLARE
    v_attendance_id UUID;
    v_timetable_entry_id UUID;
    v_performer_id UUID;
BEGIN
    -- Get the parent attendance record info
    SELECT a.id, a.timetable_entry_id, COALESCE(a.marked_by, auth.uid())
    INTO v_attendance_id, v_timetable_entry_id, v_performer_id
    FROM attendance a 
    WHERE a.id = NEW.attendance_id;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO attendance_logs (
            action_type, performed_by, performer_role, target_type, target_id,
            attendance_record_id, attendance_id, student_id, timetable_entry_id, details
        )
        SELECT
            'marked',
            v_performer_id,
            (SELECT primary_role FROM profiles WHERE id = v_performer_id),
            'attendance',
            NEW.id,
            NEW.id,
            v_attendance_id,
            NEW.student_id,
            v_timetable_entry_id,
            jsonb_build_object('status', NEW.status, 'late_minutes', COALESCE(NEW.late_minutes, 0));
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO attendance_logs (
            action_type, performed_by, performer_role, target_type, target_id,
            attendance_record_id, attendance_id, student_id, timetable_entry_id, details
        )
        SELECT
            'edited',
            COALESCE(NEW.edited_by, v_performer_id),
            (SELECT primary_role FROM profiles WHERE id = COALESCE(NEW.edited_by, v_performer_id)),
            'attendance',
            NEW.id,
            NEW.id,
            v_attendance_id,
            NEW.student_id,
            v_timetable_entry_id,
            jsonb_build_object(
                'old_status', OLD.status, 
                'new_status', NEW.status, 
                'edit_count', COALESCE(NEW.edit_count, 0)
            );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Don't fail the main operation if logging fails
    RAISE WARNING 'Attendance logging failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance logging on attendance_records
DROP TRIGGER IF EXISTS trg_log_attendance ON attendance_records;
CREATE TRIGGER trg_log_attendance
    AFTER INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION log_attendance_action();

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Holidays policies
DROP POLICY IF EXISTS "Anyone can view holidays" ON holidays;
CREATE POLICY "Anyone can view holidays" ON holidays FOR SELECT USING (true);

DROP POLICY IF EXISTS "HOD can create department holidays" ON holidays;
CREATE POLICY "HOD can create department holidays" ON holidays FOR INSERT 
    WITH CHECK (
        -- Super admin can create any holiday
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin')
        OR
        -- HOD can only create department holidays for their department
        (
            holiday_type = 'department' 
            AND EXISTS (
                SELECT 1 FROM teachers t 
                WHERE t.user_id = auth.uid() 
                AND t.is_hod = TRUE 
                AND t.department_id = holidays.department_id
            )
        )
    );

DROP POLICY IF EXISTS "HOD can update department holidays" ON holidays;
CREATE POLICY "HOD can update department holidays" ON holidays FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin')
        OR
        (
            holiday_type = 'department' 
            AND EXISTS (
                SELECT 1 FROM teachers t 
                WHERE t.user_id = auth.uid() 
                AND t.is_hod = TRUE 
                AND t.department_id = holidays.department_id
            )
        )
    );

DROP POLICY IF EXISTS "Super admin can delete holidays" ON holidays;
CREATE POLICY "Super admin can delete holidays" ON holidays FOR DELETE 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin'));

-- Late passes policies
DROP POLICY IF EXISTS "Staff can view late passes" ON late_passes;
CREATE POLICY "Staff can view late passes" ON late_passes FOR SELECT 
    USING (
        -- Teachers can view
        EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid())
        -- Admins can view
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role IN ('super_admin', 'principal', 'hod'))
        -- Students can view their own
        OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

-- Attendance logs policies (Super Admin only for full access)
DROP POLICY IF EXISTS "Super admin can view logs" ON attendance_logs;
CREATE POLICY "Super admin can view logs" ON attendance_logs FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin'));

-- Allow inserting logs by authenticated users (for the trigger)
DROP POLICY IF EXISTS "Authenticated can insert logs" ON attendance_logs;
CREATE POLICY "Authenticated can insert logs" ON attendance_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 8. ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_attendance_date_period ON attendance(date, period);
CREATE INDEX IF NOT EXISTS idx_holidays_date_type ON holidays(date, holiday_type);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);

-- =====================================================
-- 9. UPDATE TIMESTAMPS TRIGGER FOR HOLIDAYS
-- =====================================================
CREATE OR REPLACE FUNCTION update_holidays_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_holidays_updated_at ON holidays;
CREATE TRIGGER trg_holidays_updated_at
    BEFORE UPDATE ON holidays
    FOR EACH ROW
    EXECUTE FUNCTION update_holidays_timestamp();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
