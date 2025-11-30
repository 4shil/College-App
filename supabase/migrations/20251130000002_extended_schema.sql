-- ============================================
-- JPM COLLEGE APP - EXTENDED SCHEMA
-- Adds: Attendance, Timetable, Exams, Assignments, 
-- Materials, Library, Bus, Canteen, Fees, Notices,
-- Events, Work Diary, Lesson Planner, Audit Logs
-- ============================================

-- ============================================
-- ATTENDANCE TABLES
-- ============================================

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    period INTEGER NOT NULL CHECK (period BETWEEN 1 AND 10),
    course_id UUID NOT NULL REFERENCES courses(id),
    section_id UUID NOT NULL REFERENCES sections(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    marked_by UUID NOT NULL REFERENCES profiles(id),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(date, period, course_id, section_id)
);

CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'od')),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    edit_reason TEXT,
    edited_by UUID REFERENCES profiles(id),
    UNIQUE(attendance_id, student_id)
);

CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);

-- ============================================
-- TIMETABLE TABLES
-- ============================================

CREATE TABLE timetable_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday
    period INTEGER NOT NULL CHECK (period BETWEEN 1 AND 10),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    course_id UUID REFERENCES courses(id),
    teacher_id UUID REFERENCES teachers(id),
    room VARCHAR(50),
    is_break BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(section_id, academic_year_id, day_of_week, period)
);

CREATE TABLE substitutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_entry_id UUID NOT NULL REFERENCES timetable_entries(id),
    date DATE NOT NULL,
    original_teacher_id UUID NOT NULL REFERENCES teachers(id),
    substitute_teacher_id UUID NOT NULL REFERENCES teachers(id),
    reason TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(timetable_entry_id, date)
);

CREATE INDEX idx_timetable_section ON timetable_entries(section_id);
CREATE INDEX idx_timetable_teacher ON timetable_entries(teacher_id);

-- ============================================
-- EXAM TABLES
-- ============================================

CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    exam_type VARCHAR(30) NOT NULL CHECK (exam_type IN ('internal', 'model', 'university', 'practical', 'viva')),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    max_marks INTEGER DEFAULT 100,
    passing_marks INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, course_id)
);

CREATE TABLE exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_schedule_id UUID NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2),
    is_absent BOOLEAN DEFAULT false,
    remarks TEXT,
    entered_by UUID REFERENCES profiles(id),
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_schedule_id, student_id)
);

CREATE TABLE external_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    result_pdf_url TEXT NOT NULL,
    sgpa DECIMAL(3,2),
    cgpa DECIMAL(3,2),
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester_id, academic_year_id)
);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id),
    section_id UUID REFERENCES sections(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    due_date TIMESTAMPTZ NOT NULL,
    max_marks INTEGER DEFAULT 10,
    attachment_urls TEXT[], -- Array of file URLs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submission_urls TEXT[] NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    marks_obtained DECIMAL(5,2),
    feedback TEXT,
    graded_by UUID REFERENCES profiles(id),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);

-- ============================================
-- TEACHING MATERIALS TABLE
-- ============================================

CREATE TABLE teaching_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    course_id UUID NOT NULL REFERENCES courses(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    file_url TEXT NOT NULL,
    file_type VARCHAR(20), -- pdf, ppt, doc, video, link
    file_size INTEGER,
    unit_number INTEGER,
    topic VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_course ON teaching_materials(course_id);

-- ============================================
-- LESSON PLANNER & WORK DIARY
-- ============================================

CREATE TABLE lesson_planners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    section_id UUID REFERENCES sections(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    planned_topics JSONB NOT NULL, -- [{day: 1, topic: "...", objectives: "..."}]
    completed_topics JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, course_id, section_id, week_start_date)
);

CREATE TABLE work_diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    daily_entries JSONB NOT NULL, -- [{date: "2024-01-01", periods: [{period: 1, course_id: "...", topic: "..."}]}]
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'hod_approved', 'principal_approved', 'rejected')),
    submitted_at TIMESTAMPTZ,
    hod_approved_by UUID REFERENCES profiles(id),
    hod_approved_at TIMESTAMPTZ,
    principal_approved_by UUID REFERENCES profiles(id),
    principal_approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, month, year)
);

-- ============================================
-- NOTICES TABLE
-- ============================================

CREATE TABLE notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    scope VARCHAR(30) NOT NULL CHECK (scope IN ('college', 'department', 'class', 'exam', 'event', 'library', 'bus', 'canteen', 'fee')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    department_id UUID REFERENCES departments(id),
    section_id UUID REFERENCES sections(id),
    author_id UUID NOT NULL REFERENCES profiles(id),
    attachment_url TEXT,
    publish_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notice_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(notice_id, user_id)
);

CREATE INDEX idx_notices_scope ON notices(scope);
CREATE INDEX idx_notices_department ON notices(department_id);

-- ============================================
-- LIBRARY TABLES
-- ============================================

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    isbn VARCHAR(20),
    title VARCHAR(300) NOT NULL,
    author VARCHAR(200),
    publisher VARCHAR(200),
    edition VARCHAR(50),
    year_published INTEGER,
    category VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    shelf_location VARCHAR(50),
    cover_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE book_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    issued_by UUID NOT NULL REFERENCES profiles(id),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE NOT NULL,
    returned_at TIMESTAMPTZ,
    returned_to UUID REFERENCES profiles(id),
    renewal_count INTEGER DEFAULT 0,
    fine_amount DECIMAL(10,2) DEFAULT 0,
    fine_paid BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost'))
);

CREATE TABLE book_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    reserved_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired', 'cancelled')),
    queue_position INTEGER,
    UNIQUE(book_id, user_id, status)
);

CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_book_issues_user ON book_issues(user_id);

-- ============================================
-- BUS TABLES
-- ============================================

CREATE TABLE bus_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number VARCHAR(20) NOT NULL UNIQUE,
    route_name VARCHAR(100) NOT NULL,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    vehicle_number VARCHAR(20),
    capacity INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bus_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES bus_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(100) NOT NULL,
    stop_order INTEGER NOT NULL,
    pickup_time TIME,
    drop_time TIME,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    UNIQUE(route_id, stop_order)
);

CREATE TABLE student_bus_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES bus_routes(id),
    stop_id UUID NOT NULL REFERENCES bus_stops(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

CREATE TABLE bus_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID REFERENCES bus_routes(id), -- NULL = all routes
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    announcement_type VARCHAR(20) CHECK (announcement_type IN ('delay', 'holiday', 'route_change', 'general')),
    valid_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CANTEEN TABLES
-- ============================================

CREATE TABLE canteen_menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- breakfast, lunch, snacks, beverages
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_veg BOOLEAN DEFAULT true,
    preparation_time INTEGER, -- in minutes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE canteen_daily_menu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    menu_item_id UUID NOT NULL REFERENCES canteen_menu_items(id),
    quantity_available INTEGER,
    is_sold_out BOOLEAN DEFAULT false,
    UNIQUE(date, menu_item_id)
);

CREATE TABLE canteen_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    date DATE NOT NULL,
    items JSONB NOT NULL, -- [{item_id, quantity, price}]
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'collected', 'cancelled')),
    pickup_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(token_number, date)
);

-- ============================================
-- FEE TABLES
-- ============================================

CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    department_id UUID REFERENCES departments(id), -- NULL = all departments
    year_id UUID REFERENCES years(id), -- NULL = all years
    fee_type VARCHAR(50) NOT NULL, -- tuition, exam, lab, library, bus, hostel
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
    amount_due DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, fee_structure_id)
);

CREATE TABLE fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_fee_id UUID NOT NULL REFERENCES student_fees(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(30), -- cash, upi, card, bank_transfer, cheque
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(50),
    receipt_url TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50), -- cultural, technical, sports, seminar, workshop
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    venue VARCHAR(200),
    department_id UUID REFERENCES departments(id), -- NULL = college-wide
    poster_url TEXT,
    registration_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    certificate_url TEXT NOT NULL,
    certificate_type VARCHAR(50), -- participation, winner, organizer
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, student_id)
);

-- ============================================
-- FEEDBACK & COMPLAINTS
-- ============================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN ('teacher', 'course', 'facility', 'general')),
    target_id UUID, -- teacher_id or course_id
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- academic, facility, transport, hostel, other
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'normal',
    assigned_to UUID REFERENCES profiles(id),
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================
-- MENTORING NOTES (for Mentor feature)
-- ============================================

CREATE TABLE mentoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_assignment_id UUID NOT NULL REFERENCES mentor_assignments(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_type VARCHAR(30), -- regular, counselling, academic, personal
    notes TEXT,
    action_items TEXT,
    follow_up_date DATE,
    is_confidential BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HONORS/MAJOR-MINOR SYSTEM
-- ============================================

CREATE TABLE minor_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id),
    available_seats INTEGER DEFAULT 30,
    eligibility_criteria TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_minor_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    minor_subject_id UUID NOT NULL REFERENCES minor_subjects(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

-- ============================================
-- ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_planners ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_bus_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_daily_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE minor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_minor_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- BASIC RLS POLICIES (Admin full access + User own data)
-- ============================================

-- Admin policies for all new tables
CREATE POLICY "Admins full access attendance" ON attendance FOR ALL USING (is_admin());
CREATE POLICY "Admins full access attendance_records" ON attendance_records FOR ALL USING (is_admin());
CREATE POLICY "Admins full access timetable" ON timetable_entries FOR ALL USING (is_admin());
CREATE POLICY "Admins full access exams" ON exams FOR ALL USING (is_admin());
CREATE POLICY "Admins full access assignments" ON assignments FOR ALL USING (is_admin());
CREATE POLICY "Admins full access notices" ON notices FOR ALL USING (is_admin());
CREATE POLICY "Admins full access books" ON books FOR ALL USING (is_admin());
CREATE POLICY "Admins full access bus_routes" ON bus_routes FOR ALL USING (is_admin());
CREATE POLICY "Admins full access canteen" ON canteen_menu_items FOR ALL USING (is_admin());
CREATE POLICY "Admins full access fees" ON fee_structures FOR ALL USING (is_admin());
CREATE POLICY "Admins full access events" ON events FOR ALL USING (is_admin());
CREATE POLICY "Admins full access audit_logs" ON audit_logs FOR ALL USING (is_admin());

-- Read policies for authenticated users
CREATE POLICY "Auth users read timetable" ON timetable_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users read exams" ON exams FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Auth users read notices" ON notices FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Auth users read books" ON books FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Auth users read bus_routes" ON bus_routes FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Auth users read canteen" ON canteen_menu_items FOR SELECT TO authenticated USING (is_available = true);
CREATE POLICY "Auth users read events" ON events FOR SELECT TO authenticated USING (is_active = true);

-- Teacher policies
CREATE POLICY "Teachers manage own attendance" ON attendance FOR ALL USING (marked_by = auth.uid() OR is_teacher());
CREATE POLICY "Teachers manage own assignments" ON assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid() AND id = assignments.teacher_id)
);
CREATE POLICY "Teachers manage own materials" ON teaching_materials FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid() AND id = teaching_materials.teacher_id)
);
CREATE POLICY "Teachers manage own planners" ON lesson_planners FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid() AND id = lesson_planners.teacher_id)
);
CREATE POLICY "Teachers manage own diaries" ON work_diaries FOR ALL USING (
    EXISTS (SELECT 1 FROM teachers WHERE user_id = auth.uid() AND id = work_diaries.teacher_id)
);

-- Student policies
CREATE POLICY "Students view own attendance" ON attendance_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = attendance_records.student_id)
);
CREATE POLICY "Students manage own submissions" ON assignment_submissions FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = assignment_submissions.student_id)
);
CREATE POLICY "Students view own fees" ON student_fees FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE user_id = auth.uid() AND id = student_fees.student_id)
);
CREATE POLICY "Students manage own complaints" ON complaints FOR ALL USING (user_id = auth.uid());

-- ============================================
-- TRIGGER: Create Audit Log
-- ============================================

CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
        VALUES (auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
        VALUES (auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
        VALUES (auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_attendance AFTER INSERT OR UPDATE OR DELETE ON attendance FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_attendance_records AFTER UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_exam_marks AFTER INSERT OR UPDATE ON exam_marks FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_lesson_planners AFTER UPDATE ON lesson_planners FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_work_diaries AFTER UPDATE ON work_diaries FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_substitutions AFTER INSERT OR UPDATE ON substitutions FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_fee_payments AFTER INSERT ON fee_payments FOR EACH ROW EXECUTE FUNCTION create_audit_log();
CREATE TRIGGER audit_book_issues AFTER INSERT OR UPDATE ON book_issues FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ============================================
-- SCHEMA EXTENSION COMPLETE!
-- ============================================
