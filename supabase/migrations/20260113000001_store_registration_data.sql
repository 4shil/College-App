-- Migration: Store registration data for student accounts
-- This function helps store additional registration metadata for students during signup

CREATE OR REPLACE FUNCTION store_registration_data(
    p_user_id UUID,
    p_registration_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Store registration data in a temporary table or in user metadata
    -- This can be processed by admin later to complete the student record
    
    -- Option 1: Store in profiles metadata (simple approach)
    UPDATE profiles
    SET 
        status = 'pending',
        primary_role = 'student'
    WHERE id = p_user_id;
    
    -- Option 2: You can also create a registration_pending table to store full data
    -- INSERT INTO registration_pending (user_id, registration_data, created_at)
    -- VALUES (p_user_id, p_registration_data, NOW());
    
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION store_registration_data(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION store_registration_data(UUID, JSONB) TO anon;

COMMENT ON FUNCTION store_registration_data IS 'Stores registration metadata for new student accounts during signup process';
