// ============================================
// JPM COLLEGE APP - GRAPHQL MUTATIONS
// All write operations
// ============================================

import { gql } from 'graphql-request';

// ============================================
// USER MANAGEMENT
// ============================================

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($id: uuid!, $data: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      full_name
      phone
      photo_url
      status
      updated_at
    }
  }
`;

export const UPDATE_USER_STATUS = gql`
  mutation UpdateUserStatus($id: uuid!, $status: user_status!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
      updated_at
    }
  }
`;

export const ASSIGN_ROLE = gql`
  mutation AssignRole($data: user_roles_insert_input!) {
    insert_user_roles_one(
      object: $data
      on_conflict: {
        constraint: user_roles_user_id_role_id_department_id_key
        update_columns: [is_active]
      }
    ) {
      id
      user_id
      role_id
      department_id
      is_active
    }
  }
`;

export const REMOVE_ROLE = gql`
  mutation RemoveRole($id: uuid!) {
    update_user_roles_by_pk(pk_columns: { id: $id }, _set: { is_active: false }) {
      id
      is_active
    }
  }
`;

// ============================================
// TEACHER MANAGEMENT
// ============================================

export const CREATE_TEACHER = gql`
  mutation CreateTeacher($profileData: profiles_insert_input!, $teacherData: teachers_insert_input!) {
    insert_profiles_one(object: $profileData) {
      id
    }
    insert_teachers_one(object: $teacherData) {
      id
      employee_id
      user_id
    }
  }
`;

export const UPDATE_TEACHER = gql`
  mutation UpdateTeacher($id: uuid!, $data: teachers_set_input!) {
    update_teachers_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      designation
      teacher_type
      qualification
      specialization
      experience_years
      updated_at
    }
  }
`;

export const ASSIGN_COURSE_TO_TEACHER = gql`
  mutation AssignCourseToTeacher($data: teacher_courses_insert_input!) {
    insert_teacher_courses_one(
      object: $data
      on_conflict: {
        constraint: teacher_courses_teacher_id_course_id_section_id_academic_yea
        update_columns: [is_active, is_primary]
      }
    ) {
      id
      teacher_id
      course_id
      section_id
      is_active
    }
  }
`;

export const REMOVE_COURSE_FROM_TEACHER = gql`
  mutation RemoveCourseFromTeacher($id: uuid!) {
    update_teacher_courses_by_pk(pk_columns: { id: $id }, _set: { is_active: false }) {
      id
      is_active
    }
  }
`;

// ============================================
// STUDENT MANAGEMENT
// ============================================

export const APPROVE_STUDENT = gql`
  mutation ApproveStudent($id: uuid!, $rollNumber: String, $sectionId: uuid) {
    update_students_by_pk(
      pk_columns: { id: $id }
      _set: { 
        current_status: "active"
        roll_number: $rollNumber
        section_id: $sectionId
      }
    ) {
      id
      registration_number
      roll_number
      current_status
    }
    update_profiles(
      where: { id: { _eq: $id } }
      _set: { status: "active" }
    ) {
      affected_rows
    }
  }
`;

export const REJECT_STUDENT = gql`
  mutation RejectStudent($id: uuid!) {
    update_students_by_pk(
      pk_columns: { id: $id }
      _set: { current_status: "inactive" }
    ) {
      id
      current_status
    }
  }
`;

export const UPDATE_STUDENT = gql`
  mutation UpdateStudent($id: uuid!, $data: students_set_input!) {
    update_students_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      roll_number
      section_id
      current_status
      updated_at
    }
  }
`;

export const BLOCK_STUDENT = gql`
  mutation BlockStudent($id: uuid!) {
    update_students_by_pk(pk_columns: { id: $id }, _set: { current_status: "suspended" }) {
      id
      current_status
    }
    update_profiles(where: { id: { _eq: $id } }, _set: { status: "suspended" }) {
      affected_rows
    }
  }
`;

export const UNBLOCK_STUDENT = gql`
  mutation UnblockStudent($id: uuid!) {
    update_students_by_pk(pk_columns: { id: $id }, _set: { current_status: "active" }) {
      id
      current_status
    }
    update_profiles(where: { id: { _eq: $id } }, _set: { status: "active" }) {
      affected_rows
    }
  }
`;

// ============================================
// DEPARTMENT MANAGEMENT
// ============================================

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($data: departments_insert_input!) {
    insert_departments_one(object: $data) {
      id
      code
      name
      short_name
    }
  }
`;

export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($id: uuid!, $data: departments_set_input!) {
    update_departments_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      code
      name
      short_name
      description
      hod_user_id
      updated_at
    }
  }
`;

export const ASSIGN_HOD = gql`
  mutation AssignHoD($departmentId: uuid!, $hodUserId: uuid!) {
    update_departments_by_pk(
      pk_columns: { id: $departmentId }
      _set: { hod_user_id: $hodUserId }
    ) {
      id
      hod_user_id
    }
  }
`;

// ============================================
// COURSE MANAGEMENT
// ============================================

export const CREATE_COURSE = gql`
  mutation CreateCourse($data: courses_insert_input!) {
    insert_courses_one(object: $data) {
      id
      code
      name
      course_type
    }
  }
`;

export const UPDATE_COURSE = gql`
  mutation UpdateCourse($id: uuid!, $data: courses_set_input!) {
    update_courses_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      code
      name
      short_name
      description
      course_type
      theory_hours
      lab_hours
      updated_at
    }
  }
`;

export const DELETE_COURSE = gql`
  mutation DeleteCourse($id: uuid!) {
    update_courses_by_pk(pk_columns: { id: $id }, _set: { is_active: false }) {
      id
      is_active
    }
  }
`;

// ============================================
// SECTION MANAGEMENT
// ============================================

export const CREATE_SECTION = gql`
  mutation CreateSection($data: sections_insert_input!) {
    insert_sections_one(object: $data) {
      id
      name
      max_students
    }
  }
`;

export const UPDATE_SECTION = gql`
  mutation UpdateSection($id: uuid!, $data: sections_set_input!) {
    update_sections_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      name
      max_students
      class_teacher_id
      updated_at
    }
  }
`;

export const ASSIGN_CLASS_TEACHER = gql`
  mutation AssignClassTeacher($sectionId: uuid!, $teacherId: uuid!) {
    update_sections_by_pk(
      pk_columns: { id: $sectionId }
      _set: { class_teacher_id: $teacherId }
    ) {
      id
      class_teacher_id
    }
  }
`;

// ============================================
// ATTENDANCE
// ============================================

export const CREATE_ATTENDANCE = gql`
  mutation CreateAttendance($data: attendance_insert_input!) {
    insert_attendance_one(object: $data) {
      id
      date
      period
      course_id
      section_id
      marked_by
    }
  }
`;

export const MARK_ATTENDANCE = gql`
  mutation MarkAttendance($data: [attendance_records_insert_input!]!) {
    insert_attendance_records(
      objects: $data
      on_conflict: {
        constraint: attendance_records_attendance_id_student_id_key
        update_columns: [status, marked_at]
      }
    ) {
      affected_rows
      returning {
        id
        student_id
        status
      }
    }
  }
`;

export const UPDATE_ATTENDANCE_RECORD = gql`
  mutation UpdateAttendanceRecord($id: uuid!, $status: String!, $reason: String) {
    update_attendance_records_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, edit_reason: $reason, edited_at: "now()" }
    ) {
      id
      status
      edited_at
    }
  }
`;

// ============================================
// TIMETABLE
// ============================================

export const CREATE_TIMETABLE_ENTRY = gql`
  mutation CreateTimetableEntry($data: timetable_entries_insert_input!) {
    insert_timetable_entries_one(object: $data) {
      id
      day_of_week
      period
      course_id
      teacher_id
      section_id
    }
  }
`;

export const UPDATE_TIMETABLE_ENTRY = gql`
  mutation UpdateTimetableEntry($id: uuid!, $data: timetable_entries_set_input!) {
    update_timetable_entries_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      course_id
      teacher_id
      room
      updated_at
    }
  }
`;

export const DELETE_TIMETABLE_ENTRY = gql`
  mutation DeleteTimetableEntry($id: uuid!) {
    update_timetable_entries_by_pk(pk_columns: { id: $id }, _set: { is_active: false }) {
      id
      is_active
    }
  }
`;

export const CREATE_SUBSTITUTION = gql`
  mutation CreateSubstitution($data: substitutions_insert_input!) {
    insert_substitutions_one(object: $data) {
      id
      original_teacher_id
      substitute_teacher_id
      date
      period
    }
  }
`;

// ============================================
// NOTICES
// ============================================

export const CREATE_NOTICE = gql`
  mutation CreateNotice($data: notices_insert_input!) {
    insert_notices_one(object: $data) {
      id
      title
      scope
      priority
      created_at
    }
  }
`;

export const UPDATE_NOTICE = gql`
  mutation UpdateNotice($id: uuid!, $data: notices_set_input!) {
    update_notices_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      title
      content
      updated_at
    }
  }
`;

export const DELETE_NOTICE = gql`
  mutation DeleteNotice($id: uuid!) {
    update_notices_by_pk(pk_columns: { id: $id }, _set: { is_active: false }) {
      id
      is_active
    }
  }
`;

// ============================================
// EXAMS
// ============================================

export const CREATE_EXAM = gql`
  mutation CreateExam($data: exams_insert_input!) {
    insert_exams_one(object: $data) {
      id
      name
      exam_type
      start_date
      end_date
    }
  }
`;

export const CREATE_EXAM_SCHEDULE = gql`
  mutation CreateExamSchedule($data: [exam_schedules_insert_input!]!) {
    insert_exam_schedules(objects: $data) {
      affected_rows
      returning {
        id
        exam_id
        course_id
        date
        start_time
        end_time
      }
    }
  }
`;

export const PUBLISH_EXAM_TIMETABLE = gql`
  mutation PublishExamTimetable($examId: uuid!) {
    update_exams_by_pk(
      pk_columns: { id: $examId }
      _set: { is_published: true, published_at: "now()" }
    ) {
      id
      is_published
      published_at
    }
  }
`;

// ============================================
// MENTOR ASSIGNMENTS
// ============================================

export const ASSIGN_MENTOR = gql`
  mutation AssignMentor($data: mentor_assignments_insert_input!) {
    insert_mentor_assignments_one(
      object: $data
      on_conflict: {
        constraint: mentor_assignments_mentor_id_student_id_academic_year_id_key
        update_columns: [is_active]
      }
    ) {
      id
      mentor_id
      student_id
      is_active
    }
  }
`;

export const REMOVE_MENTOR = gql`
  mutation RemoveMentor($id: uuid!) {
    update_mentor_assignments_by_pk(pk_columns: { id: $id }, _set: { is_active: false }) {
      id
      is_active
    }
  }
`;

// ============================================
// AUDIT LOG
// ============================================

export const CREATE_AUDIT_LOG = gql`
  mutation CreateAuditLog($data: audit_logs_insert_input!) {
    insert_audit_logs_one(object: $data) {
      id
      action
      table_name
      record_id
      created_at
    }
  }
`;
