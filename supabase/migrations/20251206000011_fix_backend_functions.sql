-- ============================================
-- Backend Functions Fix - Corrected Schema
-- ============================================

-- Drop existing functions to recreate with correct schema
DROP FUNCTION IF EXISTS get_fee_collection_stats(DATE, DATE);
DROP FUNCTION IF EXISTS get_library_stats(DATE, DATE);
DROP FUNCTION IF EXISTS get_top_performers_assignments();

-- Function to calculate fee collection statistics
CREATE OR REPLACE FUNCTION get_fee_collection_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_collected NUMERIC,
    total_pending NUMERIC,
    payment_count INTEGER,
    collection_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(fp.amount), 0) as total_collected,
        COALESCE(SUM(sf.amount_due - sf.amount_paid), 0) as total_pending,
        COUNT(fp.id)::INTEGER as payment_count,
        CASE 
            WHEN SUM(sf.amount_due) > 0 
            THEN ROUND((SUM(sf.amount_paid) / SUM(sf.amount_due)) * 100, 2)
            ELSE 0 
        END as collection_rate
    FROM student_fees sf
    LEFT JOIN fee_payments fp ON fp.student_fee_id = sf.id
        AND (start_date IS NULL OR fp.payment_date >= start_date)
        AND (end_date IS NULL OR fp.payment_date <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get library circulation stats
CREATE OR REPLACE FUNCTION get_library_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_books INTEGER,
    issued_count INTEGER,
    returned_count INTEGER,
    overdue_count INTEGER,
    total_fines NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM books WHERE is_active = true) as total_books,
        COUNT(CASE WHEN bi.status = 'issued' THEN 1 END)::INTEGER as issued_count,
        COUNT(CASE WHEN bi.status = 'returned' AND (start_date IS NULL OR bi.returned_at::DATE >= start_date) THEN 1 END)::INTEGER as returned_count,
        COUNT(CASE WHEN bi.status = 'issued' AND bi.due_date < CURRENT_DATE THEN 1 END)::INTEGER as overdue_count,
        COALESCE(SUM(CASE WHEN bi.status = 'returned' AND bi.fine_amount > 0 THEN bi.fine_amount ELSE 0 END), 0) as total_fines
    FROM book_issues bi
    WHERE (start_date IS NULL OR bi.issued_at::DATE >= start_date)
        AND (end_date IS NULL OR bi.issued_at::DATE <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top performers for assignments
CREATE OR REPLACE FUNCTION get_top_performers_assignments()
RETURNS TABLE (
    student_id UUID,
    roll_number VARCHAR,
    full_name VARCHAR,
    avg_marks NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as student_id,
        s.roll_number,
        p.full_name,
        ROUND(AVG(asub.marks_obtained), 2) as avg_marks
    FROM students s
    INNER JOIN profiles p ON s.user_id = p.id
    INNER JOIN assignment_submissions asub ON asub.student_id = s.id
    WHERE asub.marks_obtained IS NOT NULL
    GROUP BY s.id, s.roll_number, p.full_name
    HAVING COUNT(asub.id) > 0
    ORDER BY avg_marks DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_fee_collection_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_library_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_performers_assignments TO authenticated;

-- ============================================
-- Backend Functions Fixed
-- ============================================
