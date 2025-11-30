import { useEffect, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase, signInWithEmail, signOut as supabaseSignOut } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const router = useRouter();
  const segments = useSegments();
  const {
    user,
    session,
    isLoading,
    isAuthenticated,
    userRole,
    setSession,
    setLoading,
    setUserRole,
    logout: storeLogout,
  } = useAuthStore();

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Get user role from metadata or profile
        const role = session.user.user_metadata?.role as 'admin' | 'teacher' | 'student' | null;
        setUserRole(role);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          const role = session.user.user_metadata?.role as 'admin' | 'teacher' | 'student' | null;
          setUserRole(role);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      if (userRole === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (userRole === 'teacher') {
        router.replace('/(teacher)/dashboard');
      } else if (userRole === 'student') {
        router.replace('/(student)/dashboard');
      } else {
        // Default to student if no role
        router.replace('/(student)/dashboard');
      }
    }
  }, [isAuthenticated, segments, isLoading, userRole]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (data.session) {
        const role = data.user?.user_metadata?.role as 'admin' | 'teacher' | 'student' | null;
        setUserRole(role);
      }

      setLoading(false);
      return { success: true, error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabaseSignOut();
    if (!error) {
      storeLogout();
      router.replace('/(auth)/login');
    }
    setLoading(false);
    return { error };
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    userRole,
    signIn,
    signOut,
  };
};

export default useAuth;
