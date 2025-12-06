-- ============================================
-- Backend Functions for Admin Modules
-- ============================================

-- Function to increment book copies
CREATE OR REPLACE FUNCTION increment_available_copies(book_id UUID, amount INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    UPDATE books 
    SET available_copies = available_copies + amount
    WHERE id = book_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement book copies
CREATE OR REPLACE FUNCTION decrement_available_copies(book_id UUID, amount INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
    UPDATE books 
    SET available_copies = GREATEST(0, available_copies - amount)
    WHERE id = book_id;
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
        u.full_name,
        ROUND(AVG(asub.marks_obtained), 2) as avg_marks
    FROM students s
    INNER JOIN users u ON s.user_id = u.id
    INNER JOIN assignment_submissions asub ON asub.student_id = s.id
    WHERE asub.marks_obtained IS NOT NULL
    GROUP BY s.id, s.roll_number, u.full_name
    HAVING COUNT(asub.id) > 0
    ORDER BY avg_marks DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update assignment submission status
CREATE OR REPLACE FUNCTION update_submission_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Add status column if not exists
    IF NEW.marks_obtained IS NOT NULL THEN
        NEW.status := 'graded';
    ELSIF NEW.submitted_at IS NOT NULL THEN
        NEW.status := 'submitted';
    ELSE
        NEW.status := 'pending';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add status column to assignment_submissions if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignment_submissions' AND column_name = 'status'
    ) THEN
        ALTER TABLE assignment_submissions 
        ADD COLUMN status VARCHAR(20) DEFAULT 'submitted';
    END IF;
END $$;

-- Create trigger for submission status
DROP TRIGGER IF EXISTS set_submission_status ON assignment_submissions;
CREATE TRIGGER set_submission_status
    BEFORE INSERT OR UPDATE ON assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_status();

-- Add status column to assignments if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'status'
    ) THEN
        ALTER TABLE assignments 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Add created_by column to assignments if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE assignments 
        ADD COLUMN created_by UUID REFERENCES profiles(id);
    END IF;
END $$;

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
        COALESCE(SUM(sf.total_amount - sf.paid_amount), 0) as total_pending,
        COUNT(fp.id)::INTEGER as payment_count,
        CASE 
            WHEN SUM(sf.total_amount) > 0 
            THEN ROUND((SUM(sf.paid_amount) / SUM(sf.total_amount)) * 100, 2)
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
        COUNT(CASE WHEN bi.status = 'returned' AND (start_date IS NULL OR bi.return_date >= start_date) THEN 1 END)::INTEGER as returned_count,
        COUNT(CASE WHEN bi.status = 'issued' AND bi.due_date < CURRENT_DATE THEN 1 END)::INTEGER as overdue_count,
        COALESCE(SUM(CASE WHEN bi.status = 'returned' AND bi.fine_amount > 0 THEN bi.fine_amount ELSE 0 END), 0) as total_fines
    FROM book_issues bi
    WHERE (start_date IS NULL OR bi.issue_date >= start_date)
        AND (end_date IS NULL OR bi.issue_date <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular books
CREATE OR REPLACE FUNCTION get_popular_books(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    book_id UUID,
    title VARCHAR,
    author VARCHAR,
    issue_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as book_id,
        b.title,
        b.author,
        COUNT(bi.id)::INTEGER as issue_count
    FROM books b
    INNER JOIN book_issues bi ON bi.book_id = b.id
    WHERE b.is_active = true
    GROUP BY b.id, b.title, b.author
    ORDER BY issue_count DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_available_copies TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_available_copies TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_performers_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION get_fee_collection_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_library_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_books TO authenticated;

-- ============================================
-- Backend Functions Complete
-- ============================================
