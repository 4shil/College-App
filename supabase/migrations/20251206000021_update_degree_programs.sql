-- Update degree programs with correct courses matching admin module
-- This updates the is_degree_program flag and adds program details to existing courses

-- Commerce Department Programs
UPDATE courses SET 
    is_degree_program = true,
    program_level = 'undergraduate',
    duration_years = 3,
    total_semesters = 6
WHERE code IN ('BCOM_COOP', 'BCOM_FT', 'BCOM_LM');

-- English Department
UPDATE courses SET 
    is_degree_program = true,
    program_level = 'undergraduate',
    duration_years = 3,
    total_semesters = 6
WHERE code = 'BA_ENG';

-- Management Department
UPDATE courses SET 
    is_degree_program = true,
    program_level = 'undergraduate',
    duration_years = 3,
    total_semesters = 6
WHERE code = 'BBA';

-- Computer Science Department
UPDATE courses SET 
    is_degree_program = true,
    program_level = 'undergraduate',
    duration_years = 3,
    total_semesters = 6
WHERE code = 'BCA';

-- Social Work Department
UPDATE courses SET 
    is_degree_program = true,
    program_level = 'undergraduate',
    duration_years = 3,
    total_semesters = 6
WHERE code = 'BSW';

-- Tourism Department
UPDATE courses SET 
    is_degree_program = true,
    program_level = 'undergraduate',
    duration_years = 3,
    total_semesters = 6
WHERE code = 'BTTM';

-- Postgraduate Programs
UPDATE courses SET 
    is_degree_program = true,
    program_level = 'postgraduate',
    duration_years = 2,
    total_semesters = 4
WHERE code IN ('MCOM_FT', 'MSC_CS', 'MA_ENG', 'MA_HRM', 'MSW');
