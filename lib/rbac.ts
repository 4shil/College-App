/**
 * Role-Based Access Control (RBAC) System
 * Implements granular permissions for 9 admin roles
 */

// Admin role definitions based on PROJECT_PLAN.md
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  PRINCIPAL: 'principal',
  DEPARTMENT_ADMIN: 'department_admin',
  HOD: 'hod',
  EXAM_CELL_ADMIN: 'exam_cell_admin',
  LIBRARY_ADMIN: 'library_admin',
  BUS_ADMIN: 'bus_admin',
  CANTEEN_ADMIN: 'canteen_admin',
  FINANCE_ADMIN: 'finance_admin',
} as const;

// Teacher roles (not admins)
export const TEACHER_ROLES = {
  SUBJECT_TEACHER: 'subject_teacher',
  CLASS_TEACHER: 'class_teacher',
  MENTOR: 'mentor',
  COORDINATOR: 'coordinator',
} as const;

// Student role
export const STUDENT_ROLE = 'student';

// Permission definitions
export const PERMISSIONS = {
  // System Administration
  FULL_SYSTEM_ACCESS: 'full_system_access',
  CREATE_DELETE_ADMINS: 'create_delete_admins',
  MANAGE_GLOBAL_SETTINGS: 'manage_global_settings',
  
  // User Management
  VIEW_ALL_USERS: 'view_all_users',
  VIEW_DEPT_USERS: 'view_dept_users',
  BLOCK_UNBLOCK_USERS: 'block_unblock_users',
  BLOCK_DEPT_USERS: 'block_dept_users',
  
  // Academic Management
  MANAGE_ACADEMIC_STRUCTURE: 'manage_academic_structure',
  MANAGE_TIMETABLE: 'manage_timetable',
  MANAGE_COURSES: 'manage_courses',
  
  // Exams & Results
  SCHEDULE_EXAMS: 'schedule_exams',
  VERIFY_MARKS: 'verify_marks',
  PUBLISH_RESULTS: 'publish_results',
  MANAGE_EXAM_SCHEDULES: 'manage_exam_schedules',
  
  // Approvals
  APPROVE_PLANNER_LEVEL_1: 'approve_planner_level_1',
  APPROVE_PLANNER_FINAL: 'approve_planner_final',
  APPROVE_DIARY_LEVEL_1: 'approve_diary_level_1',
  APPROVE_DIARY_FINAL: 'approve_diary_final',
  MONITOR_PLANNERS: 'monitor_planners',
  
  // Library
  MANAGE_LIBRARY: 'manage_library',
  MANAGE_BOOKS: 'manage_books',
  ISSUE_RETURN_BOOKS: 'issue_return_books',
  
  // Transportation
  MANAGE_BUS: 'manage_bus',
  MANAGE_BUS_ROUTES: 'manage_bus_routes',
  TRACK_BUS_LOCATIONS: 'track_bus_locations',
  
  // Canteen
  MANAGE_CANTEEN: 'manage_canteen',
  MANAGE_CANTEEN_MENU: 'manage_canteen_menu',
  MANAGE_CANTEEN_TOKENS: 'manage_canteen_tokens',
  
  // Finance
  MANAGE_FEES: 'manage_fees',
  MANAGE_FEE_STRUCTURES: 'manage_fee_structures',
  PROCESS_PAYMENTS: 'process_payments',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  
  // Notices & Communication
  POST_GLOBAL_NOTICES: 'post_global_notices',
  POST_DEPT_NOTICES: 'post_dept_notices',
  SEND_NOTIFICATIONS: 'send_notifications',
  
  // Assignments
  MANAGE_ASSIGNMENTS: 'manage_assignments',
  GRADE_ASSIGNMENTS: 'grade_assignments',
  
  // Attendance
  MANAGE_ATTENDANCE: 'manage_attendance',
  VIEW_ATTENDANCE_REPORTS: 'view_attendance_reports',
} as const;

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Super Admin - GOD MODE
  [ADMIN_ROLES.SUPER_ADMIN]: [
    PERMISSIONS.FULL_SYSTEM_ACCESS,
    PERMISSIONS.CREATE_DELETE_ADMINS,
    PERMISSIONS.MANAGE_GLOBAL_SETTINGS,
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.BLOCK_UNBLOCK_USERS,
    PERMISSIONS.MANAGE_ACADEMIC_STRUCTURE,
    PERMISSIONS.MANAGE_TIMETABLE,
    PERMISSIONS.MANAGE_COURSES,
    PERMISSIONS.SCHEDULE_EXAMS,
    PERMISSIONS.VERIFY_MARKS,
    PERMISSIONS.PUBLISH_RESULTS,
    PERMISSIONS.MANAGE_EXAM_SCHEDULES,
    PERMISSIONS.APPROVE_PLANNER_FINAL,
    PERMISSIONS.APPROVE_DIARY_FINAL,
    PERMISSIONS.MANAGE_LIBRARY,
    PERMISSIONS.MANAGE_BUS,
    PERMISSIONS.MANAGE_CANTEEN,
    PERMISSIONS.MANAGE_FEES,
    PERMISSIONS.POST_GLOBAL_NOTICES,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.MANAGE_ASSIGNMENTS,
    PERMISSIONS.GRADE_ASSIGNMENTS,
    PERMISSIONS.MANAGE_ATTENDANCE,
  ],
  
  // Principal - Academic Authority
  [ADMIN_ROLES.PRINCIPAL]: [
    PERMISSIONS.VIEW_ALL_USERS,
    PERMISSIONS.BLOCK_UNBLOCK_USERS,
    PERMISSIONS.APPROVE_DIARY_FINAL,
    PERMISSIONS.MONITOR_PLANNERS,
    PERMISSIONS.POST_GLOBAL_NOTICES,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
  ],
  
  // Department Admin - Department Management
  [ADMIN_ROLES.DEPARTMENT_ADMIN]: [
    PERMISSIONS.VIEW_DEPT_USERS,
    PERMISSIONS.BLOCK_DEPT_USERS,
    PERMISSIONS.POST_DEPT_NOTICES,
  ],
  
  // HOD - Department Head
  [ADMIN_ROLES.HOD]: [
    PERMISSIONS.VIEW_DEPT_USERS,
    PERMISSIONS.APPROVE_PLANNER_LEVEL_1,
    PERMISSIONS.APPROVE_DIARY_LEVEL_1,
    PERMISSIONS.POST_DEPT_NOTICES,
    PERMISSIONS.MANAGE_ATTENDANCE,
  ],
  
  // Exam Cell Admin - Exam Management
  [ADMIN_ROLES.EXAM_CELL_ADMIN]: [
    PERMISSIONS.SCHEDULE_EXAMS,
    PERMISSIONS.VERIFY_MARKS,
    PERMISSIONS.PUBLISH_RESULTS,
    PERMISSIONS.MANAGE_EXAM_SCHEDULES,
  ],
  
  // Library Admin - Library Management
  [ADMIN_ROLES.LIBRARY_ADMIN]: [
    PERMISSIONS.MANAGE_LIBRARY,
    PERMISSIONS.MANAGE_BOOKS,
    PERMISSIONS.ISSUE_RETURN_BOOKS,
  ],
  
  // Bus Admin - Transportation Management
  [ADMIN_ROLES.BUS_ADMIN]: [
    PERMISSIONS.MANAGE_BUS,
    PERMISSIONS.MANAGE_BUS_ROUTES,
    PERMISSIONS.TRACK_BUS_LOCATIONS,
  ],
  
  // Canteen Admin - Canteen Management
  [ADMIN_ROLES.CANTEEN_ADMIN]: [
    PERMISSIONS.MANAGE_CANTEEN,
    PERMISSIONS.MANAGE_CANTEEN_MENU,
    PERMISSIONS.MANAGE_CANTEEN_TOKENS,
  ],
  
  // Finance Admin - Fee Management
  [ADMIN_ROLES.FINANCE_ADMIN]: [
    PERMISSIONS.MANAGE_FEES,
    PERMISSIONS.MANAGE_FEE_STRUCTURES,
    PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.VIEW_FINANCIAL_REPORTS,
  ],
};

// Module-Role mapping (which roles can access which admin modules)
export const MODULE_ACCESS: Record<string, string[]> = {
  dashboard: Object.values(ADMIN_ROLES), // All admins
  users: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.PRINCIPAL, ADMIN_ROLES.DEPARTMENT_ADMIN],
  academic: [ADMIN_ROLES.SUPER_ADMIN],
  exams: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.EXAM_CELL_ADMIN],
  assignments: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.HOD, ADMIN_ROLES.EXAM_CELL_ADMIN],
  library: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.LIBRARY_ADMIN],
  fees: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.FINANCE_ADMIN],
  bus: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.BUS_ADMIN],
  canteen: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.CANTEEN_ADMIN],
  notices: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.PRINCIPAL, ADMIN_ROLES.DEPARTMENT_ADMIN, ADMIN_ROLES.HOD],
  settings: [ADMIN_ROLES.SUPER_ADMIN],
  attendance: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.HOD],
  analytics: [ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.PRINCIPAL, ADMIN_ROLES.HOD],
  audit: [ADMIN_ROLES.SUPER_ADMIN],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRoles: string[], permission: string): boolean {
  // Super admin has all permissions
  if (userRoles.includes(ADMIN_ROLES.SUPER_ADMIN)) {
    return true;
  }
  
  // Check if any of user's roles grants the permission
  return userRoles.some(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
  });
}

/**
 * Check if user can access a module
 */
export function canAccessModule(userRoles: string[], moduleName: string): boolean {
  // Super admin can access everything
  if (userRoles.includes(ADMIN_ROLES.SUPER_ADMIN)) {
    return true;
  }
  
  // Check if any of user's roles can access the module
  const allowedRoles = MODULE_ACCESS[moduleName] || [];
  return userRoles.some(role => allowedRoles.includes(role));
}

/**
 * Check if user is any type of admin
 */
export function isAdmin(userRoles: string[]): boolean {
  const adminRoleValues = Object.values(ADMIN_ROLES);
  return userRoles.some(role => adminRoleValues.includes(role as any));
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(userRoles: string[]): boolean {
  return userRoles.includes(ADMIN_ROLES.SUPER_ADMIN);
}

/**
 * Get highest admin role (for display purposes)
 */
export function getHighestRole(userRoles: string[]): string {
  // Priority order
  const rolePriority = [
    ADMIN_ROLES.SUPER_ADMIN,
    ADMIN_ROLES.PRINCIPAL,
    ADMIN_ROLES.EXAM_CELL_ADMIN,
    ADMIN_ROLES.HOD,
    ADMIN_ROLES.DEPARTMENT_ADMIN,
    ADMIN_ROLES.FINANCE_ADMIN,
    ADMIN_ROLES.LIBRARY_ADMIN,
    ADMIN_ROLES.BUS_ADMIN,
    ADMIN_ROLES.CANTEEN_ADMIN,
  ];
  
  for (const role of rolePriority) {
    if (userRoles.includes(role)) {
      return role;
    }
  }
  
  return userRoles[0] || 'unknown';
}

/**
 * Get user's permissions based on their roles
 */
export function getUserPermissions(userRoles: string[]): string[] {
  const permissions = new Set<string>();
  
  userRoles.forEach(role => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach(permission => permissions.add(permission));
  });
  
  return Array.from(permissions);
}

/**
 * Get accessible modules for user
 */
export function getAccessibleModules(userRoles: string[]): string[] {
  return Object.keys(MODULE_ACCESS).filter(module => 
    canAccessModule(userRoles, module)
  );
}

/**
 * Check if user can manage users (view/block/unblock)
 */
export function canManageUsers(userRoles: string[], scope: 'all' | 'department'): boolean {
  if (scope === 'all') {
    return hasPermission(userRoles, PERMISSIONS.VIEW_ALL_USERS);
  }
  return hasPermission(userRoles, PERMISSIONS.VIEW_DEPT_USERS);
}

/**
 * Check if user can approve planners/diaries
 */
export function canApprove(userRoles: string[], type: 'planner' | 'diary', level: 'hod' | 'principal'): boolean {
  if (type === 'planner') {
    return level === 'hod' 
      ? hasPermission(userRoles, PERMISSIONS.APPROVE_PLANNER_LEVEL_1)
      : hasPermission(userRoles, PERMISSIONS.APPROVE_PLANNER_FINAL);
  } else {
    return level === 'hod'
      ? hasPermission(userRoles, PERMISSIONS.APPROVE_DIARY_LEVEL_1)
      : hasPermission(userRoles, PERMISSIONS.APPROVE_DIARY_FINAL);
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(roleName: string): string {
  const displayNames: Record<string, string> = {
    [ADMIN_ROLES.SUPER_ADMIN]: 'Super Admin',
    [ADMIN_ROLES.PRINCIPAL]: 'Principal',
    [ADMIN_ROLES.DEPARTMENT_ADMIN]: 'Department Admin',
    [ADMIN_ROLES.HOD]: 'Head of Department',
    [ADMIN_ROLES.EXAM_CELL_ADMIN]: 'Exam Cell Admin',
    [ADMIN_ROLES.LIBRARY_ADMIN]: 'Library Admin',
    [ADMIN_ROLES.BUS_ADMIN]: 'Bus Admin',
    [ADMIN_ROLES.CANTEEN_ADMIN]: 'Canteen Admin',
    [ADMIN_ROLES.FINANCE_ADMIN]: 'Finance Admin',
  };
  
  return displayNames[roleName] || roleName;
}
