/**
 * Type-safe route constants for the college app
 * Use these instead of string literals to get compile-time route validation
 */

// ============================================================================
// AUTH ROUTES
// ============================================================================
export const AUTH_ROUTES = {
  LOGIN: '/(auth)/login',
  REGISTER: '/(auth)/register',
  FORGOT_PASSWORD: '/(auth)/forgot-password',
  VERIFY_OTP: '/(auth)/verify-otp',
} as const;

// ============================================================================
// STUDENT ROUTES
// ============================================================================
export const STUDENT_ROUTES = {
  // Main screens
  DASHBOARD: '/(student)/dashboard',
  PROFILE: '/(student)/profile',
  MODULES: '/(student)/modules',
  SETTINGS: '/(student)/settings',
  SUPPORT: '/(student)/support',
  HALL_TICKET: '/(student)/hall-ticket',
  MATERIALS: '/(student)/materials',
  RESULTS: '/(student)/results',

  // Attendance
  ATTENDANCE: '/(student)/attendance',
  ATTENDANCE_LEAVE: '/(student)/attendance/leave',
  ATTENDANCE_ALERTS: '/(student)/attendance/alerts',

  // Timetable
  TIMETABLE: '/(student)/timetable',

  // Notices
  NOTICES: '/(student)/notices',

  // Assignments
  ASSIGNMENTS: '/(student)/assignments',

  // Marks
  MARKS: '/(student)/marks',

  // Events
  EVENTS: '/(student)/events',

  // Exams
  EXAMS: '/(student)/exams',

  // Fees
  FEES: '/(student)/fees',

  // Library
  LIBRARY: '/(student)/library',

  // Canteen
  CANTEEN: '/(student)/canteen',

  // Bus
  BUS: '/(student)/bus',

  // Honors
  HONORS: '/(student)/honors',

  // Feedback
  FEEDBACK: '/(student)/feedback',

  // Settings sub-routes
  SETTINGS_APPEARANCE: '/(student)/settings/appearance',
  SETTINGS_NOTIFICATIONS: '/(student)/settings/notifications',
  SETTINGS_PRIVACY: '/(student)/settings/privacy',
  SETTINGS_ABOUT: '/(student)/settings/about',
} as const;

// Dynamic student routes
export const studentNoticeDetail = (id: string) => `/(student)/notices/${id}` as const;
export const studentEventDetail = (id: string) => `/(student)/events/${id}` as const;
export const studentAssignmentDetail = (id: string) => `/(student)/assignments/${id}` as const;

// ============================================================================
// TEACHER ROUTES
// ============================================================================
export const TEACHER_ROUTES = {
  // Main screens
  DASHBOARD: '/(teacher)/dashboard',
  PROFILE: '/(teacher)/profile',
  MODULES: '/(teacher)/modules',
  SETTINGS: '/(teacher)/settings',
  CHANGE_PASSWORD: '/(teacher)/change-password',

  // Attendance
  ATTENDANCE: '/(teacher)/attendance',
  ATTENDANCE_MARK: '/(teacher)/attendance/mark',

  // Timetable
  TIMETABLE: '/(teacher)/timetable',

  // Notices
  NOTICES: '/(teacher)/notices',
  NOTICES_CREATE: '/(teacher)/notices/create',

  // Assignments
  ASSIGNMENTS: '/(teacher)/assignments',
  ASSIGNMENTS_CREATE: '/(teacher)/assignments/create',

  // Results
  RESULTS: '/(teacher)/results',

  // Materials
  MATERIALS: '/(teacher)/materials',

  // Planner
  PLANNER: '/(teacher)/planner',
  PLANNER_CREATE: '/(teacher)/planner/create',

  // Diary
  DIARY: '/(teacher)/diary',
  DIARY_CREATE: '/(teacher)/diary/create',

  // Session
  SESSION: '/(teacher)/session',

  // Department
  DEPARTMENT: '/(teacher)/department',

  // Coordinator
  COORDINATOR: '/(teacher)/coordinator',

  // Principal
  PRINCIPAL: '/(teacher)/principal',

  // Mentor
  MENTOR: '/(teacher)/mentor',

  // Class Tools
  CLASS_TOOLS: '/(teacher)/class-tools',

  // Settings sub-routes
  SETTINGS_APPEARANCE: '/(teacher)/settings/appearance',
  SETTINGS_NOTIFICATIONS: '/(teacher)/settings/notifications',
} as const;

// Dynamic teacher routes
export const teacherDiaryEdit = (id: string) => `/(teacher)/diary/edit/${id}` as const;
export const teacherPlannerEdit = (id: string) => `/(teacher)/planner/edit/${id}` as const;

// ============================================================================
// ADMIN ROUTES
// ============================================================================
export const ADMIN_ROUTES = {
  // Main screens
  DASHBOARD: '/(admin)/dashboard',
  ROLE_DASHBOARD: '/(admin)/role-dashboard',
  COLLEGE_INFO: '/(admin)/college-info',
  CHANGE_PASSWORD: '/(admin)/change-password',

  // Users
  USERS: '/(admin)/users',
  USERS_PENDING: '/(admin)/users/pending',
  USERS_ASSIGN_ROLES: '/(admin)/users/assign-roles',
  USERS_STUDENTS: '/(admin)/users/students',
  USERS_STUDENTS_CREATE: '/(admin)/users/students/create',
  USERS_TEACHERS: '/(admin)/users/teachers',
  USERS_TEACHERS_CREATE: '/(admin)/users/teachers/create',

  // Academic
  ACADEMIC: '/(admin)/academic',

  // Events
  EVENTS: '/(admin)/events',
  EVENTS_CREATE: '/(admin)/events-create',

  // Notices
  NOTICES: '/(admin)/notices',

  // Timetable
  TIMETABLE: '/(admin)/timetable',
  TIMETABLE_CREATE: '/(admin)/timetable/create',
  TIMETABLE_SUBSTITUTIONS: '/(admin)/timetable/substitutions',
  TIMETABLE_REPORTS: '/(admin)/timetable/reports',

  // Attendance
  ATTENDANCE: '/(admin)/attendance',
  ATTENDANCE_ALERTS: '/(admin)/attendance-alerts',

  // Exams
  EXAMS: '/(admin)/exams',
  EXAMS_MANAGE: '/(admin)/exams/manage',
  EXAMS_MARKS: '/(admin)/exams/marks',
  EXAMS_EXTERNAL: '/(admin)/exams/external',
  EXAMS_REPORTS: '/(admin)/exams/reports',

  // Assignments
  ASSIGNMENTS: '/(admin)/assignments',

  // Fees
  FEES: '/(admin)/fees',
  FEES_STUDENTS: '/(admin)/fees/students',
  FEES_STRUCTURES: '/(admin)/fees/structures',

  // Library
  LIBRARY: '/(admin)/library',
  LIBRARY_REPORTS: '/(admin)/library/reports',

  // Canteen
  CANTEEN: '/(admin)/canteen',
  CANTEEN_TOKENS: '/(admin)/canteen/tokens',
  CANTEEN_READY: '/(admin)/canteen/ready',
  CANTEEN_REFUNDS: '/(admin)/canteen/refunds',
  CANTEEN_REPORTS: '/(admin)/canteen/reports',

  // Bus
  BUS: '/(admin)/bus',

  // Planner & Diary
  PLANNER_DIARY: '/(admin)/planner-diary',
  PLANNER_DIARY_APPROVALS: '/(admin)/planner-diary/approvals',

  // Settings
  SETTINGS: '/(admin)/settings',
  SETTINGS_ACADEMIC_YEAR: '/(admin)/settings/academic-year',

  // Analytics
  ANALYTICS: '/(admin)/analytics',

  // Audit
  AUDIT: '/(admin)/audit',

  // Reception
  RECEPTION: '/(admin)/reception',
} as const;

// Dynamic admin routes
export const adminEventEdit = (id: string) => `/(admin)/events-edit?id=${id}` as const;
export const adminStudentDetail = (id: string) => `/(admin)/users/students/${id}` as const;
export const adminTeacherDetail = (id: string) => `/(admin)/users/teachers/${id}` as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AuthRoute = (typeof AUTH_ROUTES)[keyof typeof AUTH_ROUTES];
export type StudentRoute = (typeof STUDENT_ROUTES)[keyof typeof STUDENT_ROUTES];
export type TeacherRoute = (typeof TEACHER_ROUTES)[keyof typeof TEACHER_ROUTES];
export type AdminRoute = (typeof ADMIN_ROUTES)[keyof typeof ADMIN_ROUTES];

export type AppRoute = AuthRoute | StudentRoute | TeacherRoute | AdminRoute;

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Type-safe navigation helper for expo-router
 * Use with: router.push(route(STUDENT_ROUTES.DASHBOARD))
 */
export function route<T extends string>(path: T): T {
  return path;
}

/**
 * Creates a dynamic route with type safety
 * Use with: router.push(dynamicRoute('/(student)/notices', id))
 */
export function dynamicRoute<T extends string>(basePath: T, id: string): `${T}/${string}` {
  return `${basePath}/${id}`;
}
