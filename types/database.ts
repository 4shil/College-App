// ============================================
// JPM COLLEGE APP - DATABASE TYPES
// Auto-generated from schema
// ============================================

// ============================================
// ENUMS
// ============================================

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'graduated' | 'dropout' | 'pending';

export type GenderType = 'male' | 'female' | 'other';

export type TeacherType = 'full_time' | 'part_time' | 'visiting' | 'guest' | 'lab_assistant';

export type TeacherDesignation = 'professor' | 'associate_professor' | 'assistant_professor' | 'lecturer' | 'lab_instructor';

export type CourseType = 'core' | 'elective' | 'open_elective' | 'lab' | 'mandatory' | 'major' | 'minor';

export type RoleCategory = 'admin' | 'teacher' | 'student';

export type ProgramType = 'undergraduate' | 'postgraduate';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'od';

export type HolidayType = 'college' | 'department';

export type BusApprovalStatus = 'pending' | 'approved' | 'rejected';

export type RoleName = 
  // Admin roles
  | 'super_admin'
  | 'principal'
  | 'department_admin'
  | 'hod'
  | 'exam_cell_admin'
  | 'library_admin'
  | 'bus_admin'
  | 'canteen_admin'
  | 'finance_admin'
  // Teacher roles
  | 'subject_teacher'
  | 'class_teacher'
  | 'mentor'
  | 'coordinator'
  // Student role
  | 'student';

// ============================================
// TABLE TYPES
// ============================================

export interface Role {
  id: string;
  name: RoleName;
  display_name: string;
  description: string | null;
  category: RoleCategory;
  permissions: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
  description: string | null;
  hod_user_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Year {
  id: string;
  year_number: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Semester {
  id: string;
  semester_number: number;
  name: string;
  year_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Section {
  id: string;
  name: string;
  department_id: string;
  year_id: string;
  academic_year_id: string;
  max_students: number;
  class_teacher_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  date_of_birth: string | null;
  gender: GenderType | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  status: UserStatus;
  primary_role: RoleName | null;
  department_id: string | null; // For HOD to identify their department
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  department_id: string | null;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
}

export interface Student {
  id: string;
  user_id: string;
  registration_number: string;
  roll_number: string | null;
  hall_ticket_number: string | null;
  apaar_id: string | null;
  program_id: string | null;
  department_id: string;
  year_id: string;
  current_year_id: string | null; // Active year for frontend
  semester_id: string;
  section_id: string | null;
  academic_year_id: string;
  batch_id: string | null; // Added: Batch reference
  admission_year: number;
  admission_date: string | null;
  admitted_through: string | null;
  father_name: string | null;
  mother_name: string | null;
  guardian_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  parent_occupation: string | null;
  blood_group: string | null;
  category: string | null;
  aadhar_number_encrypted: string | null;
  current_status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  employee_id: string;
  department_id: string;
  designation: TeacherDesignation;
  teacher_type: TeacherType;
  qualification: string | null;
  specialization: string | null;
  experience_years: number;
  joining_date: string | null;
  is_active: boolean;
  is_hod: boolean;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  batch_name: string;
  academic_year_id: string | null;
  department_id: string | null;
  year_id: string | null;
  section_id: string | null;
  start_year: number;
  end_year: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  student_id: string;
  father_name: string | null;
  mother_name: string | null;
  guardian_name: string | null;
  father_phone: string | null;
  mother_phone: string | null;
  father_email: string | null;
  mother_email: string | null;
  address: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusSubscription {
  id: string;
  student_id: string;
  route_id: string;
  stop_id: string | null;
  academic_year_id: string;
  approval_status: BusApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
  description: string | null;
  department_id: string;
  semester_id: string;
  course_type: CourseType;
  theory_hours: number;
  lab_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherCourse {
  id: string;
  teacher_id: string;
  course_id: string;
  section_id: string | null;
  academic_year_id: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
}

export interface MentorAssignment {
  id: string;
  mentor_id: string;
  student_id: string;
  academic_year_id: string;
  assigned_date: string;
  is_active: boolean;
  created_at: string;
}

// ============================================
// PROGRAM TYPE
// ============================================

export interface Program {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
  program_type: ProgramType;
  department_id: string;
  duration_years: number;
  total_semesters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// TIMETABLE TYPES
// ============================================

export interface TimetableEntry {
  id: string;
  program_id: string;
  year_id: string;
  academic_year_id: string;
  day_of_week: number; // 1-5 (Monday-Friday)
  period: number; // 1-5
  start_time: string;
  end_time: string;
  course_id: string | null;
  teacher_id: string | null;
  room: string | null;
  is_lab: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PeriodTiming {
  id: string;
  period_number: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_break: boolean;
  break_type: 'short' | 'lunch' | null;
  created_at: string;
}

export interface Substitution {
  id: string;
  timetable_entry_id: string;
  date: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ============================================
// ATTENDANCE TYPES
// ============================================

export interface Attendance {
  id: string;
  date: string;
  period: number;
  course_id: string;
  section_id: string | null; // Now nullable, using program_id + year_id instead
  program_id: string | null;
  year_id: string | null;
  academic_year_id: string;
  timetable_entry_id: string | null;
  marked_by: string;
  marked_at: string;
  is_locked: boolean;
  locked_at: string | null;
  late_minutes: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  attendance_id: string;
  student_id: string;
  status: AttendanceStatus;
  late_minutes: number;
  marked_at: string;
  edited_at: string | null;
  edit_reason: string | null;
  edited_by: string | null;
  edit_count: number;
}

export interface Holiday {
  id: string;
  date: string;
  title: string;
  description: string | null;
  holiday_type: HolidayType;
  department_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LatePass {
  id: string;
  student_id: string;
  academic_year_id: string;
  month: number;
  year: number;
  late_count: number;
  half_day_leaves_deducted: number;
  last_deduction_type: 'morning' | 'afternoon' | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// JOINED/EXTENDED TYPES
// ============================================

export interface ProfileWithRoles extends Profile {
  roles: (UserRole & { role: Role })[];
}

export interface StudentWithProfile extends Student {
  profile: Profile;
  department: Department;
  year: Year;
  semester: Semester;
  section: Section | null;
}

export interface TeacherWithProfile extends Teacher {
  profile: Profile;
  department: Department;
  courses: (TeacherCourse & { course: Course })[];
}

export interface SectionWithDetails extends Section {
  department: Department;
  year: Year;
  academic_year: AcademicYear;
  class_teacher: Profile | null;
  student_count: number;
}

// ============================================
// AUTH TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  roles: RoleName[];
  primaryRole: RoleName | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export interface LoginResponse {
  success: boolean;
  user: AuthUser | null;
  error: string | null;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateStudentRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  registration_number: string;
  department_id: string;
  year_id: string;
  semester_id: string;
  section_id?: string;
  admission_year: number;
}

export interface CreateTeacherRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  employee_id: string;
  department_id: string;
  designation: TeacherDesignation;
  teacher_type?: TeacherType;
  qualification?: string;
}

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  photo_url?: string;
  date_of_birth?: string;
  gender?: GenderType;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}
