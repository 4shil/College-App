// ============================================
// JPM COLLEGE APP - GRAPHQL QUERIES
// All read operations
// ============================================

import { gql } from 'graphql-request';

// ============================================
// DASHBOARD STATS
// ============================================

export const GET_ADMIN_DASHBOARD_STATS = gql`
  query GetAdminDashboardStats {
    students_aggregate(where: { current_status: { _eq: "active" } }) {
      aggregate {
        count
      }
    }
    teachers_aggregate(where: { is_active: { _eq: true } }) {
      aggregate {
        count
      }
    }
    departments_aggregate(where: { is_active: { _eq: true } }) {
      aggregate {
        count
      }
    }
    courses_aggregate(where: { is_active: { _eq: true } }) {
      aggregate {
        count
      }
    }
    pending_students: students_aggregate(where: { current_status: { _eq: "inactive" } }) {
      aggregate {
        count
      }
    }
  }
`;

// ============================================
// USER MANAGEMENT
// ============================================

export const GET_ALL_USERS = gql`
  query GetAllUsers($limit: Int, $offset: Int) {
    profiles(limit: $limit, offset: $offset, order_by: { created_at: desc }) {
      id
      email
      full_name
      phone
      photo_url
      status
      primary_role
      created_at
      user_roles {
        role {
          name
          display_name
          category
        }
        department {
          name
          code
        }
      }
    }
    profiles_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($id: uuid!) {
    profiles_by_pk(id: $id) {
      id
      email
      full_name
      phone
      photo_url
      date_of_birth
      gender
      address_line1
      address_line2
      city
      district
      state
      pincode
      status
      primary_role
      last_login_at
      created_at
      user_roles {
        id
        is_active
        role {
          id
          name
          display_name
          category
        }
        department {
          id
          name
          code
        }
      }
    }
  }
`;

// ============================================
// TEACHERS
// ============================================

export const GET_ALL_TEACHERS = gql`
  query GetAllTeachers($limit: Int, $offset: Int, $departmentId: uuid) {
    teachers(
      limit: $limit
      offset: $offset
      where: { 
        is_active: { _eq: true }
        department_id: { _eq: $departmentId }
      }
      order_by: { created_at: desc }
    ) {
      id
      employee_id
      designation
      teacher_type
      qualification
      specialization
      experience_years
      joining_date
      profile {
        id
        full_name
        email
        phone
        photo_url
        status
      }
      department {
        id
        name
        code
      }
      teacher_courses {
        course {
          id
          code
          name
        }
        section {
          id
          name
        }
      }
    }
    teachers_aggregate(where: { is_active: { _eq: true } }) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TEACHER_BY_ID = gql`
  query GetTeacherById($id: uuid!) {
    teachers_by_pk(id: $id) {
      id
      user_id
      employee_id
      designation
      teacher_type
      qualification
      specialization
      experience_years
      joining_date
      is_active
      profile {
        id
        full_name
        email
        phone
        photo_url
        date_of_birth
        gender
        status
      }
      department {
        id
        name
        code
      }
      teacher_courses {
        id
        is_primary
        course {
          id
          code
          name
          course_type
        }
        section {
          id
          name
        }
      }
    }
  }
`;

// ============================================
// STUDENTS
// ============================================

export const GET_ALL_STUDENTS = gql`
  query GetAllStudents(
    $limit: Int
    $offset: Int
    $departmentId: uuid
    $yearId: uuid
    $sectionId: uuid
    $status: user_status
  ) {
    students(
      limit: $limit
      offset: $offset
      where: {
        department_id: { _eq: $departmentId }
        year_id: { _eq: $yearId }
        section_id: { _eq: $sectionId }
        current_status: { _eq: $status }
      }
      order_by: { registration_number: asc }
    ) {
      id
      registration_number
      roll_number
      admission_year
      current_status
      profile {
        id
        full_name
        email
        phone
        photo_url
      }
      department {
        id
        name
        code
      }
      year {
        id
        name
        year_number
      }
      semester {
        id
        name
        semester_number
      }
      section {
        id
        name
      }
    }
    students_aggregate(
      where: {
        department_id: { _eq: $departmentId }
        year_id: { _eq: $yearId }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_PENDING_STUDENTS = gql`
  query GetPendingStudents($limit: Int, $offset: Int) {
    students(
      limit: $limit
      offset: $offset
      where: { current_status: { _eq: "inactive" } }
      order_by: { created_at: desc }
    ) {
      id
      registration_number
      admission_year
      created_at
      profile {
        id
        full_name
        email
        phone
      }
      department {
        id
        name
        code
      }
      year {
        id
        name
      }
    }
    students_aggregate(where: { current_status: { _eq: "inactive" } }) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_STUDENT_BY_ID = gql`
  query GetStudentById($id: uuid!) {
    students_by_pk(id: $id) {
      id
      user_id
      registration_number
      roll_number
      hall_ticket_number
      admission_year
      admission_date
      admitted_through
      father_name
      mother_name
      guardian_name
      parent_phone
      parent_email
      blood_group
      category
      current_status
      profile {
        id
        full_name
        email
        phone
        photo_url
        date_of_birth
        gender
        address_line1
        address_line2
        city
        district
        state
        pincode
      }
      department {
        id
        name
        code
      }
      year {
        id
        name
        year_number
      }
      semester {
        id
        name
        semester_number
      }
      section {
        id
        name
      }
    }
  }
`;

// ============================================
// DEPARTMENTS
// ============================================

export const GET_ALL_DEPARTMENTS = gql`
  query GetAllDepartments {
    departments(where: { is_active: { _eq: true } }, order_by: { name: asc }) {
      id
      code
      name
      short_name
      description
      is_active
      hod_user_id
      hod: profileByHodUserId {
        id
        full_name
        email
      }
      students_aggregate(where: { current_status: { _eq: "active" } }) {
        aggregate {
          count
        }
      }
      teachers_aggregate(where: { is_active: { _eq: true } }) {
        aggregate {
          count
        }
      }
      programs(where: { is_active: { _eq: true } }) {
        id
        code
        name
        short_name
        program_type
        duration_years
      }
    }
  }
`;

export const GET_DEPARTMENT_BY_ID = gql`
  query GetDepartmentById($id: uuid!) {
    departments_by_pk(id: $id) {
      id
      code
      name
      short_name
      description
      is_active
      hod_user_id
      hod: profileByHodUserId {
        id
        full_name
        email
        phone
      }
      sections(where: { is_active: { _eq: true } }) {
        id
        name
        max_students
        year {
          id
          name
        }
        class_teacher: profileByClassTeacherId {
          id
          full_name
        }
      }
      courses(where: { is_active: { _eq: true } }) {
        id
        code
        name
        course_type
        semester {
          id
          name
        }
      }
      programs(where: { is_active: { _eq: true } }) {
        id
        code
        name
        short_name
        program_type
        duration_years
        total_semesters
      }
    }
  }
`;

// ============================================
// PROGRAMS
// ============================================

export const GET_ALL_PROGRAMS = gql`
  query GetAllPrograms($departmentId: uuid) {
    programs(
      where: { 
        is_active: { _eq: true }
        department_id: { _eq: $departmentId }
      }
      order_by: { name: asc }
    ) {
      id
      code
      name
      short_name
      program_type
      duration_years
      total_semesters
      department {
        id
        code
        name
      }
    }
  }
`;

export const GET_PROGRAM_BY_ID = gql`
  query GetProgramById($id: uuid!) {
    programs_by_pk(id: $id) {
      id
      code
      name
      short_name
      program_type
      duration_years
      total_semesters
      is_active
      department {
        id
        code
        name
      }
      students_aggregate(where: { current_status: { _eq: "active" } }) {
        aggregate {
          count
        }
      }
    }
  }
`;

// ============================================
// COURSES
// ============================================

export const GET_ALL_COURSES = gql`
  query GetAllCourses($departmentId: uuid, $semesterId: uuid) {
    courses(
      where: {
        is_active: { _eq: true }
        department_id: { _eq: $departmentId }
        semester_id: { _eq: $semesterId }
      }
      order_by: { code: asc }
    ) {
      id
      code
      name
      short_name
      course_type
      theory_hours
      lab_hours
      department {
        id
        name
        code
      }
      semester {
        id
        name
        semester_number
        year {
          id
          name
        }
      }
      teacher_courses(where: { is_active: { _eq: true } }) {
        teacher {
          id
          profile {
            full_name
          }
        }
        section {
          id
          name
        }
      }
    }
  }
`;

// ============================================
// ACADEMIC STRUCTURE
// ============================================

export const GET_ACADEMIC_STRUCTURE = gql`
  query GetAcademicStructure {
    academic_years(order_by: { start_date: desc }) {
      id
      name
      start_date
      end_date
      is_current
    }
    years(where: { is_active: { _eq: true } }, order_by: { year_number: asc }) {
      id
      year_number
      name
      semesters(where: { is_active: { _eq: true } }, order_by: { semester_number: asc }) {
        id
        semester_number
        name
      }
    }
  }
`;

export const GET_SECTIONS = gql`
  query GetSections($departmentId: uuid!, $yearId: uuid!, $academicYearId: uuid!) {
    sections(
      where: {
        department_id: { _eq: $departmentId }
        year_id: { _eq: $yearId }
        academic_year_id: { _eq: $academicYearId }
        is_active: { _eq: true }
      }
      order_by: { name: asc }
    ) {
      id
      name
      max_students
      class_teacher: profileByClassTeacherId {
        id
        full_name
      }
      students_aggregate(where: { current_status: { _eq: "active" } }) {
        aggregate {
          count
        }
      }
    }
  }
`;

// ============================================
// ROLES
// ============================================

export const GET_ALL_ROLES = gql`
  query GetAllRoles {
    roles(where: { is_active: { _eq: true } }, order_by: { category: asc, name: asc }) {
      id
      name
      display_name
      description
      category
      permissions
    }
  }
`;

// ============================================
// ATTENDANCE
// ============================================

export const GET_ATTENDANCE_SUMMARY = gql`
  query GetAttendanceSummary(
    $courseId: uuid!
    $sectionId: uuid
    $startDate: date!
    $endDate: date!
  ) {
    attendance(
      where: {
        course_id: { _eq: $courseId }
        section_id: { _eq: $sectionId }
        date: { _gte: $startDate, _lte: $endDate }
      }
      order_by: { date: desc }
    ) {
      id
      date
      period
      is_locked
      marked_at
      attendance_records_aggregate {
        aggregate {
          count
        }
      }
      present_count: attendance_records_aggregate(where: { status: { _eq: "present" } }) {
        aggregate {
          count
        }
      }
      absent_count: attendance_records_aggregate(where: { status: { _eq: "absent" } }) {
        aggregate {
          count
        }
      }
      late_count: attendance_records_aggregate(where: { status: { _eq: "late" } }) {
        aggregate {
          count
        }
      }
    }
  }
`;

export const GET_STUDENT_ATTENDANCE = gql`
  query GetStudentAttendance(
    $studentId: uuid!
    $startDate: date!
    $endDate: date!
  ) {
    attendance_records(
      where: {
        student_id: { _eq: $studentId }
        attendance: { date: { _gte: $startDate, _lte: $endDate } }
      }
      order_by: { attendance: { date: desc } }
    ) {
      id
      status
      marked_at
      late_minutes
      attendance {
        id
        date
        period
        course {
          id
          code
          name
        }
      }
    }
    total: attendance_records_aggregate(
      where: {
        student_id: { _eq: $studentId }
        attendance: { date: { _gte: $startDate, _lte: $endDate } }
      }
    ) {
      aggregate {
        count
      }
    }
    present: attendance_records_aggregate(
      where: {
        student_id: { _eq: $studentId }
        status: { _eq: "present" }
        attendance: { date: { _gte: $startDate, _lte: $endDate } }
      }
    ) {
      aggregate {
        count
      }
    }
    absent: attendance_records_aggregate(
      where: {
        student_id: { _eq: $studentId }
        status: { _eq: "absent" }
        attendance: { date: { _gte: $startDate, _lte: $endDate } }
      }
    ) {
      aggregate {
        count
      }
    }
    late: attendance_records_aggregate(
      where: {
        student_id: { _eq: $studentId }
        status: { _eq: "late" }
        attendance: { date: { _gte: $startDate, _lte: $endDate } }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Get attendance for marking (teacher view)
export const GET_ATTENDANCE_FOR_MARKING = gql`
  query GetAttendanceForMarking(
    $courseId: uuid!
    $sectionId: uuid!
    $date: date!
    $period: Int!
  ) {
    attendance(
      where: {
        course_id: { _eq: $courseId }
        section_id: { _eq: $sectionId }
        date: { _eq: $date }
        period: { _eq: $period }
      }
    ) {
      id
      is_locked
      marked_at
      marked_by
      attendance_records {
        id
        student_id
        status
        late_minutes
        student {
          id
          registration_number
          roll_number
          profile {
            full_name
            photo_url
          }
        }
      }
    }
    students(
      where: {
        section_id: { _eq: $sectionId }
        current_status: { _eq: "active" }
      }
      order_by: { roll_number: asc }
    ) {
      id
      registration_number
      roll_number
      profile {
        full_name
        photo_url
      }
    }
  }
`;

// Get holidays
export const GET_HOLIDAYS = gql`
  query GetHolidays($startDate: date!, $endDate: date!, $departmentId: uuid) {
    holidays(
      where: {
        date: { _gte: $startDate, _lte: $endDate }
        _or: [
          { holiday_type: { _eq: "college" } }
          { department_id: { _eq: $departmentId } }
        ]
      }
      order_by: { date: asc }
    ) {
      id
      date
      title
      description
      holiday_type
      department {
        id
        name
        code
      }
    }
  }
`;

// Get late passes for a student
export const GET_STUDENT_LATE_PASSES = gql`
  query GetStudentLatePasses($studentId: uuid!, $academicYearId: uuid!) {
    late_passes(
      where: {
        student_id: { _eq: $studentId }
        academic_year_id: { _eq: $academicYearId }
      }
      order_by: [{ year: desc }, { month: desc }]
    ) {
      id
      month
      year
      late_count
      half_day_leaves_deducted
      last_deduction_type
    }
  }
`;

// ============================================
// TIMETABLE
// ============================================

// Get timetable for a specific program and year (updated structure)
export const GET_TIMETABLE = gql`
  query GetTimetable($programId: uuid!, $yearId: uuid!, $academicYearId: uuid!) {
    timetable_entries(
      where: {
        program_id: { _eq: $programId }
        year_id: { _eq: $yearId }
        academic_year_id: { _eq: $academicYearId }
        is_active: { _eq: true }
      }
      order_by: [{ day_of_week: asc }, { period: asc }]
    ) {
      id
      day_of_week
      period
      start_time
      end_time
      room
      is_lab
      course {
        id
        code
        name
        short_name
      }
      teacher {
        id
        profile {
          full_name
        }
      }
    }
  }
`;

// Legacy query for section-based timetable (for backwards compatibility)
export const GET_SECTION_TIMETABLE = gql`
  query GetSectionTimetable($sectionId: uuid!, $academicYearId: uuid!) {
    timetable_entries(
      where: {
        section_id: { _eq: $sectionId }
        academic_year_id: { _eq: $academicYearId }
        is_active: { _eq: true }
      }
      order_by: [{ day_of_week: asc }, { period: asc }]
    ) {
      id
      day_of_week
      period
      start_time
      end_time
      course {
        id
        code
        name
        short_name
      }
      teacher {
        id
        profile {
          full_name
        }
      }
      room
    }
  }
`;

export const GET_TEACHER_TIMETABLE = gql`
  query GetTeacherTimetable($teacherId: uuid!, $academicYearId: uuid!) {
    timetable_entries(
      where: {
        teacher_id: { _eq: $teacherId }
        academic_year_id: { _eq: $academicYearId }
        is_active: { _eq: true }
      }
      order_by: [{ day_of_week: asc }, { period: asc }]
    ) {
      id
      day_of_week
      period
      start_time
      end_time
      room
      is_lab
      course {
        id
        code
        name
      }
      program {
        id
        code
        short_name
      }
      year {
        id
        name
        year_number
      }
    }
  }
`;

// Get period timings
export const GET_PERIOD_TIMINGS = gql`
  query GetPeriodTimings {
    period_timings(order_by: { period_number: asc }) {
      id
      period_number
      start_time
      end_time
      duration_minutes
      is_break
      break_type
    }
  }
`;

// ============================================
// NOTICES
// ============================================

export const GET_NOTICES = gql`
  query GetNotices($limit: Int, $offset: Int, $scope: String) {
    notices(
      limit: $limit
      offset: $offset
      where: {
        is_active: { _eq: true }
        scope: { _eq: $scope }
        _or: [
          { publish_at: { _lte: "now()" } }
          { publish_at: { _is_null: true } }
        ]
      }
      order_by: { created_at: desc }
    ) {
      id
      title
      content
      scope
      priority
      attachment_url
      publish_at
      expires_at
      created_at
      author {
        id
        full_name
      }
      department {
        id
        name
        code
      }
    }
  }
`;

// ============================================
// AUDIT LOGS
// ============================================

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs($limit: Int, $offset: Int, $action: String, $tableName: String) {
    audit_logs(
      limit: $limit
      offset: $offset
      where: {
        action: { _eq: $action }
        table_name: { _eq: $tableName }
      }
      order_by: { created_at: desc }
    ) {
      id
      action
      table_name
      record_id
      old_values
      new_values
      ip_address
      created_at
      user {
        id
        full_name
        email
      }
    }
  }
`;
