import { useEffect, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase, signInWithEmail, signOut as supabaseSignOut } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { RoleName } from '../types/database';
import { ADMIN_ROLE_NAMES, TEACHER_ROLE_NAMES } from '../lib/rbac';
import { logger } from '../lib/logger';

function isInvalidRefreshTokenError(error: unknown): boolean {
  const message =
    typeof error === 'string'
      ? error
      : (error as any)?.message ?? (error as any)?.error_description ?? '';

  if (typeof message !== 'string') return false;

  return (
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found') ||
    message.includes('refresh_token')
  );
}

export const useAuth = () => {
  const router = useRouter();
  const segments = useSegments();
  const {
    user,
    session,
    isLoading,
    isAuthenticated,
    userRole,
    primaryRole,
    profile,
    roles,
    setSession,
    setProfile,
    setRoles,
    setLoading,
    setUserRole,
    logout: storeLogout,
  } = useAuthStore();

  const forceLocalSignOut = useCallback(async () => {
    try {
      // Prefer a local-only sign-out (clears persisted session) so we don't depend on network.
      await (supabase.auth as any).signOut?.({ scope: 'local' });
    } catch {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }

    storeLogout();
    router.replace('/(auth)/login');
  }, [router, storeLogout]);

  // Fetch user profile and roles from the database
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        logger.error('Error fetching profile:', profileError);
        return null;
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          is_active,
          role:roles(name, category)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) {
        logger.error('Error fetching roles:', rolesError);
      }

      // Extract role names
      const roleNames: RoleName[] = rolesData
        ?.filter((ur: any) => ur.role && ur.is_active)
        .map((ur: any) => (ur.role as any).name as RoleName) || [];

      // If no roles from user_roles, use primary_role from profile
      if (roleNames.length === 0 && profileData?.primary_role) {
        roleNames.push(profileData.primary_role as RoleName);
      }

      // Set profile and roles in store
      setProfile(profileData);
      setRoles(roleNames);

      // Determine user role for routing
      const primaryRole = profileData?.primary_role as RoleName | null;
      let userRoleCategory: 'admin' | 'teacher' | 'student' | null = null;

      if (primaryRole) {
        if (ADMIN_ROLE_NAMES.includes(primaryRole)) {
          userRoleCategory = 'admin';
        } else if (TEACHER_ROLE_NAMES.includes(primaryRole)) {
          userRoleCategory = 'teacher';
        } else if (primaryRole === 'student') {
          userRoleCategory = 'student';
        }
      } else if (roleNames.length > 0) {
        // Fallback to first role's category
        if (roleNames.some(r => ADMIN_ROLE_NAMES.includes(r))) {
          userRoleCategory = 'admin';
        } else if (roleNames.some(r => TEACHER_ROLE_NAMES.includes(r))) {
          userRoleCategory = 'teacher';
        } else if (roleNames.includes('student')) {
          userRoleCategory = 'student';
        }
      }

      setUserRole(userRoleCategory);
      return { profile: profileData, roles: roleNames, userRoleCategory };
    } catch (error) {
      logger.error('Error in fetchUserData:', error);
      return null;
    }
  }, [setProfile, setRoles, setUserRole]);

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error getting session:', error);
          if (isInvalidRefreshTokenError(error)) {
            await forceLocalSignOut();
          }
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          setSession(session);
          
          if (session?.user) {
            await fetchUserData(session.user.id);
          }
          
          setLoading(false);
        }
      } catch (error) {
        logger.error('Error initializing auth:', error);
        if (isInvalidRefreshTokenError(error)) {
          await forceLocalSignOut();
        }
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const authEvent = event as unknown as string;

        if (authEvent === 'TOKEN_REFRESH_FAILED') {
          // This commonly occurs when a stale/corrupt refresh token exists in persisted storage.
          // Clear it and send user to login instead of looping and timing out.
          logger.warn('Supabase auth token refresh failed; signing out locally.');
          await forceLocalSignOut();
          if (mounted) setLoading(false);
          return;
        }

        setSession(session);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserRole(null);
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData, forceLocalSignOut, setSession, setLoading, setUserRole, setProfile, setRoles]);

  // Handle protected routes
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inTeacherGroup = segments[0] === '(teacher)';
    const inStudentGroup = segments[0] === '(student)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to appropriate dashboard based on role
      // Teacher-capable roles (including HOD) should default into Teacher module.
      const shouldDefaultToTeacher = roles.some((r) => TEACHER_ROLE_NAMES.includes(r)) || roles.includes('hod');
      if (shouldDefaultToTeacher) {
        router.replace('/(teacher)/dashboard');
        return;
      }
      if (userRole === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (userRole === 'teacher') {
        router.replace('/(teacher)/dashboard');
      } else if (userRole === 'student') {
        router.replace('/(student)/dashboard');
      } else {
        // Default to student if no role determined
        router.replace('/(student)/dashboard');
      }
    } else if (isAuthenticated) {
      // Check if user is trying to access wrong dashboard
      if (inAdminGroup && userRole !== 'admin') {
        // Non-admin trying to access admin area
        if (userRole === 'teacher') {
          router.replace('/(teacher)/dashboard');
        } else {
          router.replace('/(student)/dashboard');
        }
      } else if (inTeacherGroup && userRole !== 'admin' && userRole !== 'teacher') {
        // Student trying to access teacher area
        router.replace('/(student)/dashboard');
      }
    }
  }, [isAuthenticated, segments, isLoading, userRole, roles, router]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      
      try {
        const { data, error } = await signInWithEmail(email, password);
        
        if (error) {
          setLoading(false);
          return { success: false, error: error.message };
        }

        if (data.session && data.user) {
          // Fetch user data after successful login
          const userData = await fetchUserData(data.user.id);
          
          if (!userData) {
            setLoading(false);
            return { success: false, error: 'Failed to load user profile' };
          }
        }

        setLoading(false);
        return { success: true, error: null };
      } catch (error: any) {
        setLoading(false);
        return { success: false, error: error.message || 'An error occurred' };
      }
    },
    [fetchUserData, setLoading]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabaseSignOut();
      if (!error) {
        storeLogout();
        router.replace('/(auth)/login');
      }
      setLoading(false);
      return { error };
    } catch (error: any) {
      setLoading(false);
      return { error };
    }
  }, [storeLogout, router, setLoading]);

  return {
    user,
    session,
    profile,
    primaryRole,
    isLoading,
    isAuthenticated,
    userRole,
    signIn,
    signOut,
    refreshUserData: () => user?.id ? fetchUserData(user.id) : Promise.resolve(null),
  };
};

export default useAuth;
