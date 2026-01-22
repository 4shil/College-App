import { createStore } from './createStore';
import { Session, User } from '@supabase/supabase-js';
import type { Profile, RoleName, AuthUser } from '../types/database';
import { ADMIN_ROLE_NAMES, TEACHER_ROLE_NAMES } from '../lib/rbac';

interface AuthState {
  // Supabase user
  user: User | null;
  session: Session | null;
  
  // App user data
  profile: Profile | null;
  roles: RoleName[];
  primaryRole: RoleName | null;
  userRole: 'admin' | 'teacher' | 'student' | null; // Legacy support
  
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
  setUserRole: (role: 'admin' | 'teacher' | 'student' | null) => void;
  logout: () => void;
}

export const useAuthStore = createStore<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  roles: [],
  primaryRole: null,
  userRole: null,
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
      isAdmin: roles.some((role) => ADMIN_ROLE_NAMES.includes(role)),
      isTeacher: roles.some((role) => TEACHER_ROLE_NAMES.includes(role)),
      isStudent: roles.includes('student'),
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setUserRole: (userRole) => set({ userRole }),

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
      userRole: null,
      isAuthenticated: false,
      isAdmin: false,
      isTeacher: false,
      isStudent: false,
    }),
}));
