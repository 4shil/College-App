import { supabase } from './supabase';
import type {
  Profile,
  Student,
  Teacher,
  UserRole,
  Role,
  Department,
  Year,
  Semester,
  Section,
  AcademicYear,
  RoleName,
  AuthUser,
  Program,
  Holiday,
  Attendance,
  AttendanceRecord,
  LatePass,
} from '../types/database';

// ============================================
// PROFILE FUNCTIONS
// ============================================

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<{ success: boolean; error: string | null }> => {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
};

// ============================================
// USER ROLES FUNCTIONS
// ============================================

export const getUserRoles = async (userId: string): Promise<RoleName[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles (name)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return data?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
};

export const getUserRolesWithDetails = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      *,
      roles (*),
      departments (*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return data || [];
};

export const assignRole = async (
  userId: string,
  roleName: RoleName,
  departmentId?: string,
  assignedBy?: string
): Promise<{ success: boolean; error: string | null }> => {
  // Get role ID from name
  const { data: role } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (!role) {
    return { success: false, error: 'Role not found' };
  }

  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role_id: role.id,
    department_id: departmentId,
    assigned_by: assignedBy,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
};

// ============================================
// AUTH USER HELPER
// ============================================

export const getAuthUser = async (userId: string): Promise<AuthUser | null> => {
  const profile = await getProfile(userId);
  if (!profile) return null;

  const roles = await getUserRoles(userId);

  const isAdmin = roles.some((role) =>
    [
      'super_admin',
      'principal',
      'department_admin',
      'hod',
      'exam_cell_admin',
      'library_admin',
      'bus_admin',
      'canteen_admin',
      'finance_admin',
    ].includes(role)
  );

  // Teacher-capable roles (HOD is admin-category but should still use teacher flows)
  let isTeacher = roles.some((role) =>
    ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod'].includes(role)
  );

  let isStudent = roles.includes('student');

  // Fallbacks when roles/primary_role are not yet configured correctly.
  // This keeps UX sane (e.g., teacher accounts landing in teacher dashboard).
  if (!isTeacher) {
    const { data: teacherRow, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!teacherError && teacherRow?.id) {
      isTeacher = true;
    }
  }

  if (!isStudent) {
    const { data: studentRow, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!studentError && studentRow?.id) {
      isStudent = true;
    }
  }

  return {
    id: userId,
    email: profile.email,
    profile,
    roles,
    primaryRole: profile.primary_role,
    isAdmin,
    isTeacher,
    isStudent,
  };
};

// ============================================
// STUDENT FUNCTIONS
// ============================================

export const getStudentByUserId = async (userId: string): Promise<Student | null> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }
  return data;
};

export const getStudentWithDetails = async (userId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      profile:profiles(*),
      department:departments(*),
      year:years(*),
      semester:semesters(*),
      section:sections(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching student details:', error);
    return null;
  }
  return data;
};

// ============================================
// TEACHER FUNCTIONS
// ============================================

export const getTeacherByUserId = async (userId: string): Promise<Teacher | null> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching teacher:', error);
    return null;
  }
  return data;
};

export const getTeacherWithDetails = async (userId: string) => {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      profile:profiles(*),
      department:departments(*),
      courses:teacher_courses(
        *,
        course:courses(*),
        section:sections(*)
      )
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching teacher details:', error);
    return null;
  }
  return data;
};

// ============================================
// DEPARTMENT FUNCTIONS
// ============================================

export const getAllDepartments = async (): Promise<Department[]> => {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
  return data || [];
};

// ============================================
// ACADEMIC STRUCTURE FUNCTIONS
// ============================================

export const getAllYears = async (): Promise<Year[]> => {
  const { data, error } = await supabase
    .from('years')
    .select('*')
    .eq('is_active', true)
    .order('year_number');

  if (error) {
    console.error('Error fetching years:', error);
    return [];
  }
  return data || [];
};

export const getSemestersByYear = async (yearId: string): Promise<Semester[]> => {
  const { data, error } = await supabase
    .from('semesters')
    .select('*')
    .eq('year_id', yearId)
    .eq('is_active', true)
    .order('semester_number');

  if (error) {
    console.error('Error fetching semesters:', error);
    return [];
  }
  return data || [];
};

export const getSectionsByDepartmentAndYear = async (
  departmentId: string,
  yearId: string
): Promise<Section[]> => {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('department_id', departmentId)
    .eq('year_id', yearId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
  return data || [];
};

export const getCurrentAcademicYear = async (): Promise<AcademicYear | null> => {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single();

  if (error) {
    console.error('Error fetching current academic year:', error);
    return null;
  }
  return data;
};

// ============================================
// ROLES FUNCTIONS
// ============================================

export const getAllRoles = async (): Promise<Role[]> => {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
  return data || [];
};

export const getRolesByCategory = async (category: 'admin' | 'teacher' | 'student'): Promise<Role[]> => {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
  return data || [];
};

// ============================================
// PROGRAM FUNCTIONS (Using courses table with program_type)
// ============================================

export const getAllPrograms = async (): Promise<Program[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .not('program_type', 'is', null)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
  return data || [];
};

export const getProgramsByDepartment = async (departmentId: string): Promise<Program[]> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('department_id', departmentId)
    .not('program_type', 'is', null)
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }
  return data || [];
};

export const getProgramById = async (programId: string): Promise<Program | null> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', programId)
    .single();

  if (error) {
    console.error('Error fetching program:', error);
    return null;
  }
  return data;
};

// ============================================
// HOLIDAY FUNCTIONS
// ============================================

export const getHolidays = async (
  startDate: string,
  endDate: string,
  departmentId?: string
): Promise<Holiday[]> => {
  let query = supabase
    .from('holidays')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  if (departmentId) {
    query = query.or(`holiday_type.eq.college,department_id.eq.${departmentId}`);
  } else {
    query = query.eq('holiday_type', 'college');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }
  return data || [];
};

export const createHoliday = async (holiday: Partial<Holiday>): Promise<{ success: boolean; error: string | null; data?: Holiday }> => {
  const { data, error } = await supabase
    .from('holidays')
    .insert(holiday)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null, data };
};

export const deleteHoliday = async (holidayId: string): Promise<{ success: boolean; error: string | null }> => {
  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', holidayId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, error: null };
};

// ============================================
// ATTENDANCE FUNCTIONS
// ============================================

export const getStudentLatePasses = async (
  studentId: string,
  academicYearId: string
): Promise<LatePass[]> => {
  const { data, error } = await supabase
    .from('late_passes')
    .select('*')
    .eq('student_id', studentId)
    .eq('academic_year_id', academicYearId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) {
    console.error('Error fetching late passes:', error);
    return [];
  }
  return data || [];
};

export const getAttendanceSummary = async (
  studentId: string,
  startDate: string,
  endDate: string
): Promise<{
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}> => {
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      id,
      status,
      attendance!inner(date)
    `)
    .eq('student_id', studentId)
    .gte('attendance.date', startDate)
    .lte('attendance.date', endDate);

  if (error) {
    console.error('Error fetching attendance summary:', error);
    return { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
  }

  const records = data || [];
  const total = records.length;
  const present = records.filter((r: any) => r.status === 'present').length;
  const absent = records.filter((r: any) => r.status === 'absent').length;
  const late = records.filter((r: any) => r.status === 'late').length;
  // Absences reduce attendance percentage - proper leave application required
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return { total, present, absent, late, percentage };
};
