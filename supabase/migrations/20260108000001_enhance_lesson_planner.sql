-- Enhanced Lesson Planner Schema
-- Date: 2026-01-08
-- Purpose: Complete lesson planner system with syllabus tracking and approval workflow

-- ============================================
-- SYLLABUS UNITS (For Progress Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS syllabus_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    
    -- Unit identification
    unit_number INTEGER NOT NULL CHECK (unit_number > 0),
    unit_name VARCHAR(200) NOT NULL,
    unit_description TEXT,
    
    -- Topics within this unit
    topics JSONB DEFAULT '[]',  -- Array of {name: string, estimated_hours: number}
    
    -- Metadata
    estimated_hours INTEGER DEFAULT 0 CHECK (estimated_hours >= 0),
    is_mandatory BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(course_id, unit_number, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_syllabus_units_course ON syllabus_units(course_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_units_year ON syllabus_units(academic_year_id);

-- ============================================
-- ENHANCE LESSON PLANNERS TABLE
-- ============================================

-- Add new columns to existing lesson_planners table
DO $$
BEGIN
    -- Add semester_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_planners' AND column_name = 'semester_id'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
    END IF;
    
    -- Add week_number if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_planners' AND column_name = 'week_number'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN week_number INTEGER;
    END IF;
    
    -- Add metrics columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_planners' AND column_name = 'total_periods_planned'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN total_periods_planned INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_planners' AND column_name = 'total_periods_completed'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN total_periods_completed INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lesson_planners' AND column_name = 'syllabus_coverage_percentage'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN syllabus_coverage_percentage NUMERIC(5, 2) DEFAULT 0 
            CHECK (syllabus_coverage_percentage >= 0 AND syllabus_coverage_percentage <= 100);
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_lesson_planners_week_number ON lesson_planners(week_number);
CREATE INDEX IF NOT EXISTS idx_lesson_planners_semester ON lesson_planners(semester_id);

-- ============================================
-- LESSON PLANNER AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_planner_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planner_id UUID NOT NULL REFERENCES lesson_planners(id) ON DELETE CASCADE,
    
    -- Who made the change
    changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- What changed
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'created',
        'drafted',
        'edited',
        'submitted',
        'approved',
        'rejected',
        'resubmitted',
        'topics_added',
        'topics_edited',
        'topics_deleted',
        'topics_completed',
        'topics_uncompleted'
    )),
    
    -- Status tracking
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    -- Details
    changes_summary TEXT,
    rejection_reason TEXT,  -- For rejected changes
    
    -- Additional context
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_planner_audit_planner ON lesson_planner_audit_log(planner_id);
CREATE INDEX IF NOT EXISTS idx_planner_audit_user ON lesson_planner_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_planner_audit_type ON lesson_planner_audit_log(change_type);
CREATE INDEX IF NOT EXISTS idx_planner_audit_timestamp ON lesson_planner_audit_log(changed_at);

-- ============================================
-- PLANNER COMMENTS (For HOD-Teacher Communication)
-- ============================================

CREATE TABLE IF NOT EXISTS lesson_planner_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planner_id UUID NOT NULL REFERENCES lesson_planners(id) ON DELETE CASCADE,
    
    -- Comment details
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN (
        'general',
        'suggestion',
        'concern',
        'approval_note',
        'rejection_note'
    )),
    
    -- Who and when
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Optional: Reply to another comment
    parent_comment_id UUID REFERENCES lesson_planner_comments(id) ON DELETE CASCADE,
    
    -- Metadata
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_planner_comments_planner ON lesson_planner_comments(planner_id);
CREATE INDEX IF NOT EXISTS idx_planner_comments_user ON lesson_planner_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_planner_comments_parent ON lesson_planner_comments(parent_comment_id);

-- ============================================
-- FUNCTIONS FOR AUTOMATIC CALCULATIONS
-- ============================================

-- Function to calculate total planned periods from JSONB
CREATE OR REPLACE FUNCTION calculate_planned_periods(planned_topics_json JSONB)
RETURNS INTEGER AS $$
DECLARE
    period_count INTEGER := 0;
BEGIN
    IF planned_topics_json IS NULL OR jsonb_array_length(planned_topics_json) = 0 THEN
        RETURN 0;
    END IF;
    
    -- Count elements in the JSONB array
    period_count := jsonb_array_length(planned_topics_json);
    
    RETURN period_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate total completed periods from JSONB
CREATE OR REPLACE FUNCTION calculate_completed_periods(completed_topics_json JSONB)
RETURNS INTEGER AS $$
DECLARE
    period_count INTEGER := 0;
BEGIN
    IF completed_topics_json IS NULL OR jsonb_array_length(completed_topics_json) = 0 THEN
        RETURN 0;
    END IF;
    
    period_count := jsonb_array_length(completed_topics_json);
    
    RETURN period_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate syllabus coverage percentage
CREATE OR REPLACE FUNCTION calculate_syllabus_coverage(
    completed_count INTEGER,
    planned_count INTEGER
)
RETURNS NUMERIC(5, 2) AS $$
BEGIN
    IF planned_count = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((completed_count::NUMERIC / planned_count::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update metrics when planned_topics or completed_topics change
CREATE OR REPLACE FUNCTION update_planner_metrics()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_periods_planned := calculate_planned_periods(NEW.planned_topics);
    NEW.total_periods_completed := calculate_completed_periods(NEW.completed_topics);
    NEW.syllabus_coverage_percentage := calculate_syllabus_coverage(
        NEW.total_periods_completed,
        NEW.total_periods_planned
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_planner_metrics ON lesson_planners;
CREATE TRIGGER trigger_update_planner_metrics
    BEFORE INSERT OR UPDATE OF planned_topics, completed_topics
    ON lesson_planners
    FOR EACH ROW
    EXECUTE FUNCTION update_planner_metrics();

-- ============================================
-- RPC FUNCTIONS FOR APPROVAL WORKFLOW
-- ============================================

-- Approve lesson planner (HOD only)
CREATE OR REPLACE FUNCTION approve_lesson_planner(
    planner_id UUID,
    approver_user_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    planner_status VARCHAR(20);
    teacher_dept_id UUID;
    approver_dept_id UUID;
BEGIN
    -- Get planner status and teacher's department
    SELECT lp.status, t.department_id INTO planner_status, teacher_dept_id
    FROM lesson_planners lp
    JOIN teachers t ON lp.teacher_id = t.id
    WHERE lp.id = planner_id;
    
    IF planner_status IS NULL THEN
        RETURN QUERY SELECT false, 'Planner not found.';
        RETURN;
    END IF;
    
    IF planner_status != 'submitted' THEN
        RETURN QUERY SELECT false, 'Planner must be in submitted status to approve.';
        RETURN;
    END IF;
    
    -- Check if approver is HOD of the teacher's department
    SELECT d.id INTO approver_dept_id
    FROM departments d
    WHERE d.hod_user_id = approver_user_id
    AND d.id = teacher_dept_id;
    
    IF approver_dept_id IS NULL THEN
        RETURN QUERY SELECT false, 'You are not authorized to approve this planner.';
        RETURN;
    END IF;
    
    -- Update planner
    UPDATE lesson_planners
    SET status = 'approved',
        approved_by = (SELECT id FROM profiles WHERE user_id = approver_user_id),
        approved_at = NOW(),
        rejection_reason = NULL
    WHERE id = planner_id;
    
    -- Log to audit
    INSERT INTO lesson_planner_audit_log (planner_id, changed_by, change_type, old_status, new_status)
    VALUES (
        planner_id,
        (SELECT id FROM profiles WHERE user_id = approver_user_id),
        'approved',
        'submitted',
        'approved'
    );
    
    RETURN QUERY SELECT true, 'Planner approved successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject lesson planner (HOD only)
CREATE OR REPLACE FUNCTION reject_lesson_planner(
    planner_id UUID,
    rejector_user_id UUID,
    reason TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    planner_status VARCHAR(20);
    teacher_dept_id UUID;
    rejector_dept_id UUID;
BEGIN
    -- Get planner status and teacher's department
    SELECT lp.status, t.department_id INTO planner_status, teacher_dept_id
    FROM lesson_planners lp
    JOIN teachers t ON lp.teacher_id = t.id
    WHERE lp.id = planner_id;
    
    IF planner_status IS NULL THEN
        RETURN QUERY SELECT false, 'Planner not found.';
        RETURN;
    END IF;
    
    IF planner_status != 'submitted' THEN
        RETURN QUERY SELECT false, 'Planner must be in submitted status to reject.';
        RETURN;
    END IF;
    
    -- Check if rejector is HOD of the teacher's department
    SELECT d.id INTO rejector_dept_id
    FROM departments d
    WHERE d.hod_user_id = rejector_user_id
    AND d.id = teacher_dept_id;
    
    IF rejector_dept_id IS NULL THEN
        RETURN QUERY SELECT false, 'You are not authorized to reject this planner.';
        RETURN;
    END IF;
    
    -- Update planner
    UPDATE lesson_planners
    SET status = 'rejected',
        rejection_reason = reason,
        approved_by = NULL,
        approved_at = NULL
    WHERE id = planner_id;
    
    -- Log to audit
    INSERT INTO lesson_planner_audit_log (planner_id, changed_by, change_type, old_status, new_status, rejection_reason)
    VALUES (
        planner_id,
        (SELECT id FROM profiles WHERE user_id = rejector_user_id),
        'rejected',
        'submitted',
        'rejected',
        reason
    );
    
    RETURN QUERY SELECT true, 'Planner rejected with reason.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENHANCED RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE syllabus_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_planner_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_planner_comments ENABLE ROW LEVEL SECURITY;

-- Syllabus Units: Readable by all authenticated users
DROP POLICY IF EXISTS "Syllabus units are readable by authenticated users" ON syllabus_units;
CREATE POLICY "Syllabus units are readable by authenticated users" ON syllabus_units
    FOR SELECT
    TO authenticated
    USING (true);

-- Audit Log: Readable by planner owner and HOD
DROP POLICY IF EXISTS "Planner audit log readable by relevant users" ON lesson_planner_audit_log;
CREATE POLICY "Planner audit log readable by relevant users" ON lesson_planner_audit_log
    FOR SELECT
    TO authenticated
    USING (
        planner_id IN (
            SELECT id FROM lesson_planners WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
        OR
        planner_id IN (
            SELECT lp.id FROM lesson_planners lp
            JOIN teachers t ON lp.teacher_id = t.id
            JOIN departments d ON t.department_id = d.id
            WHERE d.hod_user_id = auth.uid()
        )
    );

-- Comments: Readable by planner owner and HOD
DROP POLICY IF EXISTS "Planner comments readable by relevant users" ON lesson_planner_comments;
CREATE POLICY "Planner comments readable by relevant users" ON lesson_planner_comments
    FOR SELECT
    TO authenticated
    USING (
        planner_id IN (
            SELECT id FROM lesson_planners WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
        OR
        planner_id IN (
            SELECT lp.id FROM lesson_planners lp
            JOIN teachers t ON lp.teacher_id = t.id
            JOIN departments d ON t.department_id = d.id
            WHERE d.hod_user_id = auth.uid()
        )
    );

-- Comments: Insertable by planner owner and HOD
DROP POLICY IF EXISTS "Users can comment on accessible planners" ON lesson_planner_comments;
CREATE POLICY "Users can comment on accessible planners" ON lesson_planner_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        planner_id IN (
            SELECT id FROM lesson_planners WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
        OR
        planner_id IN (
            SELECT lp.id FROM lesson_planners lp
            JOIN teachers t ON lp.teacher_id = t.id
            JOIN departments d ON t.department_id = d.id
            WHERE d.hod_user_id = auth.uid()
        )
    );

-- ============================================
-- SAMPLE DATA (Optional for Testing)
-- ============================================

-- Insert sample syllabus units for testing
-- Uncomment if you want to add test data

/*
INSERT INTO syllabus_units (course_id, unit_number, unit_name, topics, estimated_hours, is_mandatory)
SELECT 
    c.id,
    1,
    'Introduction to Programming',
    '[{"name": "Variables and Data Types", "estimated_hours": 3}, {"name": "Control Structures", "estimated_hours": 4}]'::jsonb,
    7,
    true
FROM courses c
WHERE c.code = 'CS101'
LIMIT 1;
*/

-- ============================================
-- NOTES
-- ============================================

-- Future Enhancement: Add notification triggers when planner is submitted/approved/rejected
-- Future Enhancement: Add deadline tracking for weekly planner submissions
-- Future Enhancement: Add syllabus completion reports aggregated by course/teacher
