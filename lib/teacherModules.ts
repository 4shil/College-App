import type { RoleName } from '../types/database';

export type TeacherModuleId =
  | 'dashboard'
  | 'profile'
  | 'timetable'
  | 'attendance'
  | 'results'
  | 'materials'
  | 'assignments'
  | 'notices'
  | 'planner'
  | 'diary'
  | 'class_tools'
  | 'mentor'
  | 'coordinator'
  | 'department';

export type TeacherNavItem = {
  id: TeacherModuleId;
  title: string;
  icon: string;
  route: string;
  nestedRoutes?: string[];
  /** If false, module is hidden even if role would unlock it. */
  implemented: boolean;
  /**
   * If provided, user must have one of these roles *or* satisfy hierarchy implication.
   */
  requiresAnyRole?: RoleName[];
};

const TEACHER_BASE_ROLES: RoleName[] = ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod'];

function hasAny(roles: RoleName[], required: RoleName[]) {
  return required.some((r) => roles.includes(r));
}

/**
 * Hierarchy implications (unlock lower-tier modules without needing explicit role).
 *
 * Current rule: `hod` unlocks all teacher-side modules.
 */
function impliedRoles(roles: RoleName[]): Set<RoleName> {
  const set = new Set<RoleName>(roles);

  // Everyone with teacher-category access implicitly has subject-teacher capability.
  if (hasAny(roles, TEACHER_BASE_ROLES)) set.add('subject_teacher');

  // Hierarchy: HoD can access all teacher modules.
  if (roles.includes('hod')) {
    set.add('class_teacher');
    set.add('mentor');
    set.add('coordinator');
  }

  return set;
}

export function canAccessTeacherModule(item: TeacherNavItem, roles: RoleName[]): boolean {
  const effective = impliedRoles(roles);

  // Base modules: any teacher-capable role.
  if (!item.requiresAnyRole || item.requiresAnyRole.length === 0) {
    return hasAny(Array.from(effective), TEACHER_BASE_ROLES) || effective.has('subject_teacher');
  }

  return item.requiresAnyRole.some((r) => effective.has(r));
}

export function getTeacherNavItems(): TeacherNavItem[] {
  return [
    { id: 'dashboard', title: 'Home', icon: 'home-outline', route: '/(teacher)/dashboard', implemented: true },
    { id: 'profile', title: 'Profile', icon: 'person-outline', route: '/(teacher)/profile', implemented: true },
    { id: 'timetable', title: 'Timetable', icon: 'calendar-outline', route: '/(teacher)/timetable', implemented: true },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: 'clipboard-outline',
      route: '/(teacher)/attendance',
      nestedRoutes: ['attendance'],
      implemented: true,
    },
    {
      id: 'results',
      title: 'Results (Internal Marks)',
      icon: 'stats-chart-outline',
      route: '/(teacher)/results',
      nestedRoutes: ['results'],
      implemented: true,
    },
    {
      id: 'materials',
      title: 'Materials',
      icon: 'book-outline',
      route: '/(teacher)/materials',
      nestedRoutes: ['materials'],
      implemented: true,
    },
    {
      id: 'assignments',
      title: 'Assignments',
      icon: 'document-text-outline',
      route: '/(teacher)/assignments',
      nestedRoutes: ['assignments'],
      implemented: true,
    },
    {
      id: 'notices',
      title: 'Notices',
      icon: 'notifications-outline',
      route: '/(teacher)/notices',
      nestedRoutes: ['notices'],
      implemented: true,
    },
    {
      id: 'planner',
      title: 'Planner',
      icon: 'create-outline',
      route: '/(teacher)/planner',
      nestedRoutes: ['planner'],
      implemented: true,
    },
    {
      id: 'diary',
      title: 'Diary',
      icon: 'journal-outline',
      route: '/(teacher)/diary',
      nestedRoutes: ['diary'],
      implemented: true,
    },

    // Role-unlocked modules (no separate dashboard; they appear as extra modules).
    {
      id: 'class_tools',
      title: 'Class Tools',
      icon: 'people-outline',
      route: '/(teacher)/class-tools',
      nestedRoutes: ['class-tools'],
      implemented: false,
      requiresAnyRole: ['class_teacher', 'hod'],
    },
    {
      id: 'mentor',
      title: 'Mentor',
      icon: 'heart-outline',
      route: '/(teacher)/mentor',
      nestedRoutes: ['mentor'],
      implemented: false,
      requiresAnyRole: ['mentor', 'hod'],
    },
    {
      id: 'coordinator',
      title: 'Coordinator',
      icon: 'swap-horizontal-outline',
      route: '/(teacher)/coordinator',
      nestedRoutes: ['coordinator'],
      implemented: false,
      requiresAnyRole: ['coordinator', 'hod'],
    },
    {
      id: 'department',
      title: 'Department',
      icon: 'business-outline',
      route: '/(teacher)/department',
      nestedRoutes: ['department'],
      implemented: false,
      requiresAnyRole: ['hod'],
    },
  ];
}

export function getUnlockedTeacherNavItems(roles: RoleName[]): TeacherNavItem[] {
  return getTeacherNavItems().filter((item) => item.implemented && canAccessTeacherModule(item, roles));
}
