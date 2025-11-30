import { createStore } from './createStore';
import { Session, User } from '@supabase/supabase-js';
import type { Profile, RoleName, AuthUser } from '../types/database';

interface AuthState {
  // Supabase user
  user: User | null;
  session: Session | null;
  
  // App user data
  profile: Profile | null;
  roles: RoleName[];
  primaryRole: RoleName | null;
  
  // Flags
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setRoles: (roles: RoleName[]) => void;
  setLoading: (loading: boolean) => void;
  setAuthUser: (authUser: AuthUser | null) => void;
  logout: () => void;
}

const ADMIN_ROLES: RoleName[] = [
  'super_admin',
  'principal',
  'department_admin',
  'hod',
  'exam_cell_admin',
  'library_admin',
  'bus_admin',
  'canteen_admin',
  'finance_admin',
];

const TEACHER_ROLES: RoleName[] = [
  'subject_teacher',
  'class_teacher',
  'mentor',
  'coordinator',
];

export const useAuthStore = createStore<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  primaryRole: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isTeacher: false,
  isStudent: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
    }),

  setProfile: (profile) =>
    set({
      profile,
      primaryRole: profile?.primary_role ?? null,
    }),

  setRoles: (roles) =>
    set({
      roles,
      isAdmin: roles.some((role) => ADMIN_ROLES.includes(role)),
      isTeacher: roles.some((role) => TEACHER_ROLES.includes(role)),
      isStudent: roles.includes('student'),
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setAuthUser: (authUser) => {
    if (!authUser) {
      set({
        user: null,
        profile: null,
        roles: [],
        primaryRole: null,
        isAuthenticated: false,
        isAdmin: false,
        isTeacher: false,
        isStudent: false,
      });
      return;
    }
    
    set({
      profile: authUser.profile,
      roles: authUser.roles,
      primaryRole: authUser.primaryRole,
      isAuthenticated: true,
      isAdmin: authUser.isAdmin,
      isTeacher: authUser.isTeacher,
      isStudent: authUser.isStudent,
    });
  },

  logout: () =>
    set({
      user: null,
      session: null,
      profile: null,
      roles: [],
      primaryRole: null,
      isAuthenticated: false,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
    }),
}));
