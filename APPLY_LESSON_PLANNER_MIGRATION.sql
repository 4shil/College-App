-- ==============================================
-- LESSON PLANNER - COMPLETE ENHANCEMENT SCRIPT
-- Date: 2026-01-08
-- Run this in Supabase Dashboard > SQL Editor
-- ==============================================

-- This script will:
-- 1. Add new columns to lesson_planners table
-- 2. Create supporting tables (syllabus_units, audit log, comments)
-- 3. Create RPC functions for approval workflow
-- 4. Set up triggers for auto-calculations
-- 5. Configure RLS policies

-- ==============================================
-- PART 1: ENHANCE LESSON_PLANNERS TABLE
-- ==============================================

DO $$
BEGIN
    -- Add semester_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'lesson_planners' 
        AND column_name = 'semester_id'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added semester_id column';
    END IF;
    
    -- Add week_number if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'lesson_planners' 
        AND column_name = 'week_number'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN week_number INTEGER;
        RAISE NOTICE 'Added week_number column';
    END IF;
    
    -- Add metrics columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'lesson_planners' 
        AND column_name = 'total_periods_planned'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN total_periods_planned INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_periods_planned column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'lesson_planners' 
        AND column_name = 'total_periods_completed'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN total_periods_completed INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_periods_completed column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'lesson_planners' 
        AND column_name = 'syllabus_coverage_percentage'
    ) THEN
        ALTER TABLE lesson_planners ADD COLUMN syllabus_coverage_percentage NUMERIC(5, 2) DEFAULT 0 
            CHECK (syllabus_coverage_percentage >= 0 AND syllabus_coverage_percentage <= 100);
        RAISE NOTICE 'Added syllabus_coverage_percentage column';
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_lesson_planners_week_number ON lesson_planners(week_number);
CREATE INDEX IF NOT EXISTS idx_lesson_planners_semester ON lesson_planners(semester_id);

-- ==============================================
-- PART 2: CREATE SUPPORTING TABLES
-- ==============================================

-- Syllabus Units
CREATE TABLE IF NOT EXISTS syllabus_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    unit_number INTEGER NOT NULL CHECK (unit_number > 0),
    unit_name VARCHAR(200) NOT NULL,
    unit_description TEXT,
    topics JSONB DEFAULT '[]',
    estimated_hours INTEGER DEFAULT 0 CHECK (estimated_hours >= 0),
    is_mandatory BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, unit_number, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_syllabus_units_course ON syllabus_units(course_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_units_year ON syllabus_units(academic_year_id);

-- Lesson Planner Audit Log
CREATE TABLE IF NOT EXISTS lesson_planner_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planner_id UUID NOT NULL REFERENCES lesson_planners(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'created', 'drafted', 'edited', 'submitted', 'approved', 'rejected',
        'resubmitted', 'topics_added', 'topics_edited', 'topics_deleted',
        'topics_completed', 'topics_uncompleted'
    )),
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    changes_summary TEXT,
    rejection_reason TEXT,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_planner_audit_planner ON lesson_planner_audit_log(planner_id);
CREATE INDEX IF NOT EXISTS idx_planner_audit_user ON lesson_planner_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_planner_audit_type ON lesson_planner_audit_log(change_type);
CREATE INDEX IF NOT EXISTS idx_planner_audit_timestamp ON lesson_planner_audit_log(changed_at);

-- Lesson Planner Comments
CREATE TABLE IF NOT EXISTS lesson_planner_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planner_id UUID NOT NULL REFERENCES lesson_planners(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general' CHECK (comment_type IN (
        'general', 'suggestion', 'concern', 'approval_note', 'rejection_note'
    )),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    parent_comment_id UUID REFERENCES lesson_planner_comments(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_planner_comments_planner ON lesson_planner_comments(planner_id);
CREATE INDEX IF NOT EXISTS idx_planner_comments_user ON lesson_planner_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_planner_comments_parent ON lesson_planner_comments(parent_comment_id);

-- ==============================================
-- PART 3: CALCULATION FUNCTIONS
-- ==============================================

-- Calculate planned periods from JSONB
CREATE OR REPLACE FUNCTION calculate_planned_periods(planned_topics_json JSONB)
RETURNS INTEGER AS $$
BEGIN
    IF planned_topics_json IS NULL OR jsonb_array_length(planned_topics_json) = 0 THEN
        RETURN 0;
    END IF;
    RETURN jsonb_array_length(planned_topics_json);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate completed periods from JSONB
CREATE OR REPLACE FUNCTION calculate_completed_periods(completed_topics_json JSONB)
RETURNS INTEGER AS $$
BEGIN
    IF completed_topics_json IS NULL OR jsonb_array_length(completed_topics_json) = 0 THEN
        RETURN 0;
    END IF;
    RETURN jsonb_array_length(completed_topics_json);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate syllabus coverage percentage
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

-- ==============================================
-- PART 4: AUTO-UPDATE TRIGGER
-- ==============================================

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

-- ==============================================
-- PART 5: APPROVAL RPC (keep existing signature)
-- ==============================================

-- The app already uses public.approve_lesson_planner(UUID, TEXT, TEXT).
-- We keep that exact signature and add audit logging.
CREATE OR REPLACE FUNCTION public.approve_lesson_planner(
    p_planner_id UUID,
    p_decision TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
BEGIN
    IF NOT (
        has_permission(auth.uid(), 'approve_planner_level_1')
        OR has_permission(auth.uid(), 'approve_planner_final')
    ) THEN
        RETURN QUERY SELECT false, 'Not authorized.';
        RETURN;
    END IF;

    SELECT status INTO v_status
    FROM public.lesson_planners
    WHERE id = p_planner_id
    LIMIT 1;

    IF v_status IS NULL THEN
        RETURN QUERY SELECT false, 'Lesson planner not found.';
        RETURN;
    END IF;

    IF v_status <> 'submitted' THEN
        RETURN QUERY SELECT false, 'Planner is not in submitted status.';
        RETURN;
    END IF;

    IF p_decision = 'approve' THEN
        UPDATE public.lesson_planners
        SET status = 'approved',
                approved_by = auth.uid(),
                approved_at = NOW(),
                rejection_reason = NULL,
                updated_at = NOW()
        WHERE id = p_planner_id;

        INSERT INTO public.lesson_planner_audit_log (planner_id, changed_by, change_type, old_status, new_status)
        VALUES (p_planner_id, auth.uid(), 'approved', 'submitted', 'approved');

        RETURN QUERY SELECT true, 'Planner approved.';
        RETURN;
    ELSIF p_decision = 'reject' THEN
        UPDATE public.lesson_planners
        SET status = 'rejected',
                approved_by = NULL,
                approved_at = NULL,
                rejection_reason = NULLIF(btrim(p_reason), ''),
                updated_at = NOW()
        WHERE id = p_planner_id;

        INSERT INTO public.lesson_planner_audit_log (planner_id, changed_by, change_type, old_status, new_status, rejection_reason)
        VALUES (p_planner_id, auth.uid(), 'rejected', 'submitted', 'rejected', NULLIF(btrim(p_reason), ''));

        RETURN QUERY SELECT true, 'Planner rejected.';
        RETURN;
    END IF;

    RETURN QUERY SELECT false, 'Invalid decision. Use approve|reject.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_lesson_planner(UUID, TEXT, TEXT) TO authenticated;

-- ==============================================
-- PART 6: RLS POLICIES
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE syllabus_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_planner_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_planner_comments ENABLE ROW LEVEL SECURITY;

-- Syllabus units readable by authenticated users
DROP POLICY IF EXISTS "Syllabus units are readable" ON syllabus_units;
CREATE POLICY "Syllabus units are readable" ON syllabus_units
    FOR SELECT TO authenticated USING (true);

-- Audit log readable by planner owner and HOD
DROP POLICY IF EXISTS "Audit log readable by relevant users" ON lesson_planner_audit_log;
CREATE POLICY "Audit log readable by relevant users" ON lesson_planner_audit_log
    FOR SELECT TO authenticated
    USING (
        planner_id IN (
            SELECT id FROM lesson_planners 
            WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
        OR planner_id IN (
            SELECT lp.id FROM lesson_planners lp
            JOIN teachers t ON lp.teacher_id = t.id
            JOIN departments d ON t.department_id = d.id
            WHERE d.hod_user_id = auth.uid()
        )
    );

-- Comments readable by planner owner and HOD
DROP POLICY IF EXISTS "Comments readable by relevant users" ON lesson_planner_comments;
CREATE POLICY "Comments readable by relevant users" ON lesson_planner_comments
    FOR SELECT TO authenticated
    USING (
        planner_id IN (
            SELECT id FROM lesson_planners 
            WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
        OR planner_id IN (
            SELECT lp.id FROM lesson_planners lp
            JOIN teachers t ON lp.teacher_id = t.id
            JOIN departments d ON t.department_id = d.id
            WHERE d.hod_user_id = auth.uid()
        )
    );

-- Comments insertable by planner owner and HOD
DROP POLICY IF EXISTS "Users can comment on planners" ON lesson_planner_comments;
CREATE POLICY "Users can comment on planners" ON lesson_planner_comments
    FOR INSERT TO authenticated
    WITH CHECK (
        planner_id IN (
            SELECT id FROM lesson_planners 
            WHERE teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
        )
        OR planner_id IN (
            SELECT lp.id FROM lesson_planners lp
            JOIN teachers t ON lp.teacher_id = t.id
            JOIN departments d ON t.department_id = d.id
            WHERE d.hod_user_id = auth.uid()
        )
    );

-- Audit log insertable by self (enables inserts when called in SECURITY DEFINER RPC)
DROP POLICY IF EXISTS "Audit log insertable by self" ON lesson_planner_audit_log;
CREATE POLICY "Audit log insertable by self" ON lesson_planner_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (changed_by = auth.uid());

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Check if all tables exist
SELECT 'Tables Check' as test,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_planners') 
           THEN '✅ lesson_planners exists'
           ELSE '❌ lesson_planners missing'
       END as status;

SELECT 'Tables Check' as test,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'syllabus_units') 
           THEN '✅ syllabus_units exists'
           ELSE '❌ syllabus_units missing'
       END as status;

SELECT 'Tables Check' as test,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_planner_audit_log') 
           THEN '✅ lesson_planner_audit_log exists'
           ELSE '❌ lesson_planner_audit_log missing'
       END as status;

SELECT 'Tables Check' as test,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_planner_comments') 
           THEN '✅ lesson_planner_comments exists'
           ELSE '❌ lesson_planner_comments missing'
       END as status;

-- Check if new columns exist
SELECT 'Columns Check' as test,
       CASE 
           WHEN EXISTS (
               SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'lesson_planners' 
               AND column_name = 'total_periods_planned'
           ) 
           THEN '✅ total_periods_planned exists'
           ELSE '❌ total_periods_planned missing'
       END as status;

-- Check if functions exist
SELECT 'Functions Check' as test,
       CASE 
           WHEN EXISTS (
               SELECT 1 FROM pg_proc 
               WHERE proname = 'approve_lesson_planner'
           ) 
           THEN '✅ approve_lesson_planner() exists'
           ELSE '❌ approve_lesson_planner() missing'
       END as status;

SELECT 'Functions Check' as test,
       CASE 
           WHEN EXISTS (
               SELECT 1 FROM pg_proc 
               WHERE proname = 'reject_lesson_planner'
           ) 
           THEN '✅ reject_lesson_planner() exists'
           ELSE '❌ reject_lesson_planner() missing'
       END as status;

-- Show summary
SELECT '=======================' as divider, 'Migration Complete!' as message, '=======================' as divider2;
