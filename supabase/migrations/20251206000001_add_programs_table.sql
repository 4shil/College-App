-- Add Programs/Degree Courses Table
-- This separates degree programs (BCA, MCA, etc.) from individual subject courses

-- Create program type enum
CREATE TYPE program_type AS ENUM ('undergraduate', 'postgraduate', 'diploma', 'certificate', 'phd');

-- Create programs table
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Program Info
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(50),
    description TEXT,
    
    -- Academic Structure
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    program_type program_type NOT NULL,
    duration_years INTEGER NOT NULL DEFAULT 3,
    total_semesters INTEGER NOT NULL DEFAULT 6,
    
    -- Eligibility & Info
    eligibility TEXT,
    total_seats INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add program_id to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- Create index for better performance
CREATE INDEX idx_programs_department ON programs(department_id);
CREATE INDEX idx_programs_active ON programs(is_active);
CREATE INDEX idx_students_program ON students(program_id);

-- Insert sample programs
INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'BCA', 
    'Bachelor of Computer Applications', 
    'BCA',
    d.id,
    'undergraduate',
    3,
    6
FROM departments d WHERE d.code = 'CS' LIMIT 1;

INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'MCA', 
    'Master of Computer Applications', 
    'MCA',
    d.id,
    'postgraduate',
    2,
    4
FROM departments d WHERE d.code = 'CS' LIMIT 1;

INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'BBA', 
    'Bachelor of Business Administration', 
    'BBA',
    d.id,
    'undergraduate',
    3,
    6
FROM departments d WHERE d.code = 'MBA' LIMIT 1;

INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'MBA', 
    'Master of Business Administration', 
    'MBA',
    d.id,
    'postgraduate',
    2,
    4
FROM departments d WHERE d.code = 'MBA' LIMIT 1;

INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'BCOM', 
    'Bachelor of Commerce', 
    'B.Com',
    d.id,
    'undergraduate',
    3,
    6
FROM departments d WHERE d.code = 'COM' LIMIT 1;

INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'BSC-CS', 
    'Bachelor of Science in Computer Science', 
    'B.Sc CS',
    d.id,
    'undergraduate',
    3,
    6
FROM departments d WHERE d.code = 'CS' LIMIT 1;

INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'BTECH-CS', 
    'Bachelor of Technology in Computer Science', 
    'B.Tech CS',
    d.id,
    'undergraduate',
    4,
    8
FROM departments d WHERE d.code = 'CS' LIMIT 1;

INSERT INTO programs (code, name, short_name, department_id, program_type, duration_years, total_semesters) 
SELECT 
    'MTECH-CS', 
    'Master of Technology in Computer Science', 
    'M.Tech CS',
    d.id,
    'postgraduate',
    2,
    4
FROM departments d WHERE d.code = 'CS' LIMIT 1;

-- Add RLS policies
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Programs are viewable by everyone" 
    ON programs FOR SELECT 
    USING (true);

CREATE POLICY "Programs are manageable by admins" 
    ON programs FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role = r.name
            WHERE ur.user_id = auth.uid()
            AND r.category = 'admin'
        )
    );
