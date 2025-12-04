-- Migration: Add attendance delegation system
-- Allows admins to grant temporary attendance marking permissions to teachers

-- Create attendance_delegations table
CREATE TABLE IF NOT EXISTS public.attendance_delegations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES public.profiles(id),
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    program_id UUID REFERENCES public.programs(id),
    year_id UUID REFERENCES public.years(id),
    course_id UUID REFERENCES public.courses(id),
    reason TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: valid_until must be after valid_from
    CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_delegations_teacher ON public.attendance_delegations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_delegations_active ON public.attendance_delegations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_delegations_valid ON public.attendance_delegations(valid_until) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.attendance_delegations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can manage all delegations
CREATE POLICY "Admins can manage delegations"
    ON public.attendance_delegations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND primary_role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND primary_role = 'admin'
        )
    );

-- Teachers can view their own delegations
CREATE POLICY "Teachers can view own delegations"
    ON public.attendance_delegations
    FOR SELECT
    TO authenticated
    USING (
        teacher_id IN (
            SELECT id FROM public.teachers WHERE user_id = auth.uid()
        )
    );

-- Update trigger
CREATE OR REPLACE FUNCTION update_delegation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_delegation_timestamp ON public.attendance_delegations;
CREATE TRIGGER trigger_update_delegation_timestamp
    BEFORE UPDATE ON public.attendance_delegations
    FOR EACH ROW
    EXECUTE FUNCTION update_delegation_timestamp();

-- Function to check if a teacher has delegation for a specific context
CREATE OR REPLACE FUNCTION public.teacher_has_delegation(
    p_teacher_id UUID,
    p_program_id UUID DEFAULT NULL,
    p_year_id UUID DEFAULT NULL,
    p_course_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.attendance_delegations
        WHERE teacher_id = p_teacher_id
        AND is_active = true
        AND NOW() BETWEEN valid_from AND valid_until
        AND (program_id IS NULL OR program_id = p_program_id)
        AND (year_id IS NULL OR year_id = p_year_id)
        AND (course_id IS NULL OR course_id = p_course_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.teacher_has_delegation TO authenticated;

-- Add comment
COMMENT ON TABLE public.attendance_delegations IS 'Temporary attendance marking permissions granted by admins to teachers';
COMMENT ON FUNCTION public.teacher_has_delegation IS 'Check if a teacher has an active delegation for a specific program/year/course';

-- Create auto-expire function (deactivates expired delegations)
CREATE OR REPLACE FUNCTION public.expire_delegations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE public.attendance_delegations
    SET is_active = false
    WHERE is_active = true
    AND valid_until < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.expire_delegations TO authenticated;
