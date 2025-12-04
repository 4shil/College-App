-- =====================================================
-- ATTENDANCE MODULE - FIXES & UPDATES
-- JPM College App
-- Created: December 4, 2025
-- 
-- This migration:
-- 1. Updates the attendance table to work with program/year instead of sections
-- 2. Adds missing columns that the frontend expects
-- 3. Fixes triggers and functions
-- =====================================================

-- =====================================================
-- 0. DROP OLD MIGRATION IF APPLIED (to allow re-run)
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trg_update_late_passes ON attendance_records;
DROP TRIGGER IF EXISTS trg_log_attendance ON attendance_records;

-- Drop functions if they exist with wrong signatures
DROP FUNCTION IF EXISTS update_late_passes() CASCADE;
DROP FUNCTION IF EXISTS log_attendance_action() CASCADE;
DROP FUNCTION IF EXISTS lock_old_attendance() CASCADE;
DROP FUNCTION IF EXISTS check_proxy_attendance(UUID, DATE, INTEGER, UUID) CASCADE;

-- =====================================================
-- 1. ADD is_hod COLUMN TO TEACHERS TABLE
-- =====================================================

ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_hod BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_teachers_is_hod ON teachers(is_hod) WHERE is_hod = TRUE;

-- =====================================================
-- 2. UPDATE STUDENTS TABLE - FIX YEAR COLUMN NAME
-- The students table uses year_id, but we also need current_year_id for active year
-- =====================================================

-- Add current_year_id if it doesn't exist (matches what frontend expects)
ALTER TABLE students ADD COLUMN IF NOT EXISTS current_year_id UUID REFERENCES years(id);

-- Copy year_id to current_year_id for existing students
UPDATE students SET current_year_id = year_id WHERE current_year_id IS NULL AND year_id IS NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_students_current_year ON students(current_year_id);

-- =====================================================
-- 3. HOLIDAYS TABLE
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
    
    CONSTRAINT valid_holiday_scope CHECK (
        (holiday_type = 'college' AND department_id IS NULL) OR
        (holiday_type = 'department' AND department_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_department ON holidays(department_id);

-- =====================================================
-- 4. UPDATE ATTENDANCE TABLE
-- The extended_schema creates attendance with section_id
-- We need to add program_id/year_id support and direct student tracking
-- =====================================================

-- Add new columns to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS year_id UUID REFERENCES years(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE SET NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Make section_id nullable (since we now use program_id + year_id)
ALTER TABLE attendance ALTER COLUMN section_id DROP NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attendance_program ON attendance(program_id);
CREATE INDEX IF NOT EXISTS idx_attendance_year ON attendance(year_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timetable ON attendance(timetable_entry_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date_period ON attendance(date, period);

-- =====================================================
-- 5. UPDATE ATTENDANCE_RECORDS TABLE
-- =====================================================

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);

-- =====================================================
-- 6. LATE PASSES TABLE (4 late = 1 half-day leave)
-- =====================================================
CREATE TABLE IF NOT EXISTS late_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    late_count INTEGER DEFAULT 0,
    half_day_leaves_deducted INTEGER DEFAULT 0,
    last_deduction_type VARCHAR(20) CHECK (last_deduction_type IN ('morning', 'afternoon')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_late_pass UNIQUE (student_id, academic_year_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_late_passes_student ON late_passes(student_id);
CREATE INDEX IF NOT EXISTS idx_late_passes_month ON late_passes(month, year);

-- =====================================================
-- 7. ATTENDANCE LOGS TABLE (For Super Admin)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'marked', 'edited', 'bulk_marked', 'locked', 
        'holiday_created', 'holiday_deleted',
        'proxy_detected', 'late_converted'
    )),
    performed_by UUID NOT NULL REFERENCES profiles(id),
    performer_role VARCHAR(50),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('attendance', 'holiday', 'student', 'class')),
    target_id UUID,
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE SET NULL,
    attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    timetable_entry_id UUID REFERENCES timetable_entries(id) ON DELETE SET NULL,
    details JSONB,
    ip_address VARCHAR(45),
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_performer ON attendance_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_action ON attendance_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student ON attendance_logs(student_id);

-- =====================================================
-- 8. ATTENDANCE SUMMARY VIEW
-- =====================================================
DROP VIEW IF EXISTS attendance_summary;
CREATE VIEW attendance_summary AS
SELECT 
    s.id AS student_id,
    s.registration_number AS roll_number,
    p.full_name AS student_name,
    a.course_id,
    c.code AS course_code,
    c.name AS course_name,
    COALESCE(s.program_id, a.program_id) AS program_id,
    COALESCE(s.current_year_id, s.year_id, a.year_id) AS year_id,
    a.academic_year_id,
    COUNT(DISTINCT ar.id) AS total_classes,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) AS present_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) AS absent_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) AS late_count,
    ROUND(
        CASE 
            WHEN COUNT(DISTINCT ar.id) > 0 THEN
                (COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::DECIMAL / COUNT(DISTINCT ar.id)) * 100
            ELSE 0
        END, 
        2
    ) AS attendance_percentage
FROM attendance a
JOIN attendance_records ar ON ar.attendance_id = a.id
JOIN students s ON ar.student_id = s.id
JOIN profiles p ON s.user_id = p.id
JOIN courses c ON a.course_id = c.id
GROUP BY s.id, s.registration_number, p.full_name, a.course_id, c.code, c.name, 
         s.program_id, a.program_id, s.current_year_id, s.year_id, a.year_id, a.academic_year_id;

-- =====================================================
-- 9. FUNCTIONS
-- =====================================================

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

-- Function to check for proxy (student in 2 classes at same time)
CREATE OR REPLACE FUNCTION check_proxy_attendance(
    p_student_id UUID,
    p_date DATE,
    p_period INTEGER,
    p_exclude_attendance_id UUID DEFAULT NULL
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
    AND (p_exclude_attendance_id IS NULL OR a.id != p_exclude_attendance_id);
    
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
    v_old_half_days INTEGER;
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
        
        -- Get current late count before update
        SELECT late_count, half_day_leaves_deducted INTO v_current_late_count, v_old_half_days
        FROM late_passes
        WHERE student_id = NEW.student_id
        AND academic_year_id = v_academic_year_id
        AND month = v_month
        AND year = v_year;
        
        IF v_current_late_count IS NULL THEN
            v_current_late_count := 0;
            v_old_half_days := 0;
        END IF;
        
        -- Increment late count
        v_current_late_count := v_current_late_count + 1;
        
        -- Calculate new half-day leaves (every 4 lates = 1 half-day)
        v_new_half_days := v_current_late_count / 4;
        
        -- Determine which half (based on period)
        IF v_period <= 3 THEN
            v_deduction_type := 'morning';
        ELSE
            v_deduction_type := 'afternoon';
        END IF;
        
        -- Insert or update late pass record
        INSERT INTO late_passes (student_id, academic_year_id, month, year, late_count, half_day_leaves_deducted, last_deduction_type)
        VALUES (NEW.student_id, v_academic_year_id, v_month, v_year, v_current_late_count, v_new_half_days, 
                CASE WHEN v_new_half_days > v_old_half_days THEN v_deduction_type ELSE NULL END)
        ON CONFLICT (student_id, academic_year_id, month, year)
        DO UPDATE SET 
            late_count = v_current_late_count,
            half_day_leaves_deducted = v_new_half_days,
            last_deduction_type = CASE WHEN v_new_half_days > late_passes.half_day_leaves_deducted THEN v_deduction_type ELSE late_passes.last_deduction_type END,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for late pass updates
DROP TRIGGER IF EXISTS trg_update_late_passes ON attendance_records;
CREATE TRIGGER trg_update_late_passes
    AFTER INSERT ON attendance_records
    FOR EACH ROW
    WHEN (NEW.status = 'late')
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
    SELECT a.id, a.timetable_entry_id, a.marked_by INTO v_attendance_id, v_timetable_entry_id, v_performer_id
    FROM attendance a 
    WHERE a.id = NEW.attendance_id;

    -- Get performer (prefer edited_by, fallback to marked_by)
    IF NEW.edited_by IS NOT NULL THEN
        v_performer_id := NEW.edited_by;
    END IF;

    IF v_performer_id IS NULL THEN
        RETURN NEW;
    END IF;

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
            jsonb_build_object('status', NEW.status, 'date', a.date, 'period', a.period)
        FROM attendance a WHERE a.id = NEW.attendance_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO attendance_logs (
            action_type, performed_by, performer_role, target_type, target_id,
            attendance_record_id, attendance_id, student_id, timetable_entry_id, details
        )
        SELECT
            'edited',
            v_performer_id,
            (SELECT primary_role FROM profiles WHERE id = v_performer_id),
            'attendance',
            NEW.id,
            NEW.id,
            v_attendance_id,
            NEW.student_id,
            v_timetable_entry_id,
            jsonb_build_object(
                'old_status', OLD.status, 
                'new_status', NEW.status, 
                'date', a.date, 
                'period', a.period,
                'edit_count', COALESCE(NEW.edit_count, 0)
            )
        FROM attendance a WHERE a.id = NEW.attendance_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance logging
DROP TRIGGER IF EXISTS trg_log_attendance ON attendance_records;
CREATE TRIGGER trg_log_attendance
    AFTER INSERT OR UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION log_attendance_action();

-- =====================================================
-- 10. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view holidays" ON holidays;
DROP POLICY IF EXISTS "HOD can create department holidays" ON holidays;
DROP POLICY IF EXISTS "HOD can update department holidays" ON holidays;
DROP POLICY IF EXISTS "Super admin can delete holidays" ON holidays;
DROP POLICY IF EXISTS "Staff can view late passes" ON late_passes;
DROP POLICY IF EXISTS "Students can view own late passes" ON late_passes;
DROP POLICY IF EXISTS "Super admin can view logs" ON attendance_logs;

-- Holidays policies
CREATE POLICY "Anyone can view holidays" ON holidays FOR SELECT USING (true);

CREATE POLICY "HOD can create department holidays" ON holidays FOR INSERT 
    WITH CHECK (
        auth.uid() IN (SELECT user_id FROM teachers WHERE is_hod = TRUE)
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin')
    );

CREATE POLICY "HOD can update department holidays" ON holidays FOR UPDATE 
    USING (
        auth.uid() IN (SELECT user_id FROM teachers WHERE is_hod = TRUE)
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin')
    );

CREATE POLICY "Super admin can delete holidays" ON holidays FOR DELETE 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin'));

-- Late passes policies
CREATE POLICY "Staff can view late passes" ON late_passes FOR SELECT 
    USING (
        auth.uid() IN (SELECT user_id FROM teachers)
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role IN ('super_admin', 'principal'))
        OR student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

-- Attendance logs policies
CREATE POLICY "Super admin can view logs" ON attendance_logs FOR SELECT 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND primary_role = 'super_admin'));

CREATE POLICY "System can insert logs" ON attendance_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 11. ADD department_id TO PROFILES IF MISSING
-- This is needed for HOD to identify their department
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department_id);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
