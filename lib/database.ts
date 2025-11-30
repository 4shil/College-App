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

  const isTeacher = roles.some((role) =>
    ['subject_teacher', 'class_teacher', 'mentor', 'coordinator'].includes(role)
  );

  const isStudent = roles.includes('student');

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
