-- ============================================
-- FIX MISSING TABLES - VERIFIED ISSUES
-- Generated: December 17, 2025
-- Fixes: batches, parents, bus_subscriptions tables
-- ============================================

-- 1. BATCHES TABLE
-- Used in: app/(admin)/academic/batches/index.tsx
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name VARCHAR(100) NOT NULL,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    year_id UUID REFERENCES years(id) ON DELETE SET NULL,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for batches
CREATE INDEX IF NOT EXISTS idx_batches_academic_year ON batches(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_batches_department ON batches(department_id);
CREATE INDEX IF NOT EXISTS idx_batches_year ON batches(year_id);
CREATE INDEX IF NOT EXISTS idx_batches_section ON batches(section_id);
CREATE INDEX IF NOT EXISTS idx_batches_active ON batches(is_active);

-- 2. PARENTS TABLE
-- Used in: app/(admin)/users/students/[id].tsx
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    guardian_name VARCHAR(100),
    father_phone VARCHAR(20),
    mother_phone VARCHAR(20),
    father_email VARCHAR(255),
    mother_email VARCHAR(255),
    address TEXT,
    emergency_contact VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id)
);

-- Index for parents
CREATE INDEX IF NOT EXISTS idx_parents_student ON parents(student_id);

-- 3. BUS SUBSCRIPTIONS TABLE
-- Used in: app/(admin)/bus/*.tsx (index, approvals, reports)
CREATE TABLE IF NOT EXISTS bus_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES bus_stops(id) ON DELETE SET NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

-- Indexes for bus_subscriptions
CREATE INDEX IF NOT EXISTS idx_bus_subscriptions_student ON bus_subscriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_bus_subscriptions_route ON bus_subscriptions(route_id);
CREATE INDEX IF NOT EXISTS idx_bus_subscriptions_status ON bus_subscriptions(approval_status);
CREATE INDEX IF NOT EXISTS idx_bus_subscriptions_academic_year ON bus_subscriptions(academic_year_id);

-- 4. ADD BATCH_ID TO STUDENTS TABLE
-- Needed for batch management functionality
ALTER TABLE students ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch_id);

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES FOR BATCHES
-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins full access batches" ON batches;
DROP POLICY IF EXISTS "Teachers view batches" ON batches;
DROP POLICY IF EXISTS "Students view batches" ON batches;

-- Admins have full access
CREATE POLICY "Admins full access batches" ON batches
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

-- Teachers can view batches
CREATE POLICY "Teachers view batches" ON batches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.category = 'teacher'
            AND ur.is_active = true
        )
    );

-- Students can view their own batch
CREATE POLICY "Students view batches" ON batches
    FOR SELECT
    USING (
        id IN (
            SELECT batch_id FROM students
            WHERE user_id = auth.uid()
        )
    );

-- 7. RLS POLICIES FOR PARENTS
DROP POLICY IF EXISTS "Students view own parents" ON parents;
DROP POLICY IF EXISTS "Admins full access parents" ON parents;
DROP POLICY IF EXISTS "Teachers view parents" ON parents;

-- Students can view their own parent info
CREATE POLICY "Students view own parents" ON parents
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM students
            WHERE user_id = auth.uid()
        )
    );

-- Admins have full access
CREATE POLICY "Admins full access parents" ON parents
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

-- Teachers can view parent info
CREATE POLICY "Teachers view parents" ON parents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.category = 'teacher'
            AND ur.is_active = true
        )
    );

-- 8. RLS POLICIES FOR BUS SUBSCRIPTIONS
DROP POLICY IF EXISTS "Students view own bus subscription" ON bus_subscriptions;
DROP POLICY IF EXISTS "Students insert own bus subscription" ON bus_subscriptions;
DROP POLICY IF EXISTS "Admins full access bus subscriptions" ON bus_subscriptions;

-- Students can view their own subscription
CREATE POLICY "Students view own bus subscription" ON bus_subscriptions
    FOR SELECT
    USING (
        student_id IN (
            SELECT id FROM students
            WHERE user_id = auth.uid()
        )
    );

-- Students can insert their own subscription
CREATE POLICY "Students insert own bus subscription" ON bus_subscriptions
    FOR INSERT
    WITH CHECK (
        student_id IN (
            SELECT id FROM students
            WHERE user_id = auth.uid()
        )
    );

-- Admins have full access
CREATE POLICY "Admins full access bus subscriptions" ON bus_subscriptions
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

-- 9. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_batches_updated_at();

CREATE OR REPLACE FUNCTION update_parents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_parents_updated_at
    BEFORE UPDATE ON parents
    FOR EACH ROW
    EXECUTE FUNCTION update_parents_updated_at();

CREATE OR REPLACE FUNCTION update_bus_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bus_subscriptions_updated_at
    BEFORE UPDATE ON bus_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_bus_subscriptions_updated_at();

-- ============================================
-- MIGRATION COMPLETE
-- Tables created: batches, parents, bus_subscriptions
-- Column added: students.batch_id
-- RLS policies and triggers configured
-- ============================================
