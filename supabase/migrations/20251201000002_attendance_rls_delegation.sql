-- Migration: Update attendance RLS to support delegation
-- Teachers can mark attendance for their own classes OR if they have delegation

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Teachers can manage own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can mark attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Teachers can mark attendance records" ON public.attendance_records;

-- Updated attendance policies
-- Teachers can INSERT attendance for their own timetable entries OR with delegation
CREATE POLICY "Teachers can insert attendance"
    ON public.attendance
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Check if teacher owns this timetable entry
        EXISTS (
            SELECT 1 FROM public.timetable_entries te
            JOIN public.teachers t ON te.teacher_id = t.id
            WHERE te.id = timetable_entry_id
            AND t.user_id = auth.uid()
        )
        OR
        -- Check if teacher has delegation
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
            AND public.teacher_has_delegation(
                t.id,
                (SELECT program_id FROM public.timetable_entries WHERE id = timetable_entry_id),
                (SELECT year_id FROM public.timetable_entries WHERE id = timetable_entry_id),
                (SELECT course_id FROM public.timetable_entries WHERE id = timetable_entry_id)
            )
        )
    );

-- Teachers can UPDATE attendance for their own entries OR with delegation
CREATE POLICY "Teachers can update attendance"
    ON public.attendance
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.timetable_entries te
            JOIN public.teachers t ON te.teacher_id = t.id
            WHERE te.id = timetable_entry_id
            AND t.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
            AND public.teacher_has_delegation(
                t.id,
                program_id,
                year_id,
                course_id
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.timetable_entries te
            JOIN public.teachers t ON te.teacher_id = t.id
            WHERE te.id = timetable_entry_id
            AND t.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.teachers t
            WHERE t.user_id = auth.uid()
            AND public.teacher_has_delegation(
                t.id,
                program_id,
                year_id,
                course_id
            )
        )
    );

-- Teachers can SELECT attendance for all (view)
CREATE POLICY "Teachers can view attendance"
    ON public.attendance
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND primary_role IN ('admin', 'teacher')
        )
    );

-- Updated attendance_records policies
-- Teachers can INSERT records for attendance they can access
CREATE POLICY "Teachers can insert attendance records"
    ON public.attendance_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.timetable_entries te ON a.timetable_entry_id = te.id
            JOIN public.teachers t ON te.teacher_id = t.id
            WHERE a.id = attendance_id
            AND t.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.teachers t ON t.user_id = auth.uid()
            WHERE a.id = attendance_id
            AND public.teacher_has_delegation(
                t.id,
                a.program_id,
                a.year_id,
                a.course_id
            )
        )
    );

-- Teachers can UPDATE records they can access
CREATE POLICY "Teachers can update attendance records"
    ON public.attendance_records
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.timetable_entries te ON a.timetable_entry_id = te.id
            JOIN public.teachers t ON te.teacher_id = t.id
            WHERE a.id = attendance_id
            AND t.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.teachers t ON t.user_id = auth.uid()
            WHERE a.id = attendance_id
            AND public.teacher_has_delegation(
                t.id,
                a.program_id,
                a.year_id,
                a.course_id
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.timetable_entries te ON a.timetable_entry_id = te.id
            JOIN public.teachers t ON te.teacher_id = t.id
            WHERE a.id = attendance_id
            AND t.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.attendance a
            JOIN public.teachers t ON t.user_id = auth.uid()
            WHERE a.id = attendance_id
            AND public.teacher_has_delegation(
                t.id,
                a.program_id,
                a.year_id,
                a.course_id
            )
        )
    );

-- Teachers can SELECT records for attendance they can view
CREATE POLICY "Teachers can view attendance records"
    ON public.attendance_records
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND primary_role IN ('admin', 'teacher')
        )
    );

-- Admin policies (admin can view but NOT insert/update)
-- Drop any admin insert/update policies on attendance
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can manage attendance records" ON public.attendance_records;

-- Admins can only SELECT attendance (view only)
CREATE POLICY "Admins can view all attendance"
    ON public.attendance
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND primary_role = 'admin'
        )
    );

CREATE POLICY "Admins can view all attendance records"
    ON public.attendance_records
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND primary_role = 'admin'
        )
    );

-- Log the policy changes
DO $$
BEGIN
    RAISE NOTICE 'Attendance RLS policies updated:';
    RAISE NOTICE '- Admins: VIEW ONLY (no marking)';
    RAISE NOTICE '- Teachers: Can mark own classes + delegated classes';
    RAISE NOTICE '- Delegation: Active delegations grant marking permission';
END $$;
