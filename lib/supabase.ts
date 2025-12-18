import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClientOptions } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Supabase credentials
const SUPABASE_URL = 'https://celwfcflcofejjpkpgcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlbHdmY2ZsY29mZWpqcGtwZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNjEzNTQsImV4cCI6MjA3OTgzNzM1NH0.hDdQIjIy5fkmdXV2GjWlATujnXgVcXZD932_k1KvLwA';

// Storage adapter that works on all platforms
const storage = Platform.OS === 'web' 
  ? {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return Promise.resolve(window.localStorage.getItem(key));
        }
        return Promise.resolve(null);
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return Promise.resolve();
      },
    }
  : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// Auth helper functions
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: { full_name?: string; role?: string }
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// ============================================
// SUPABASE OTP AUTHENTICATION
// ============================================

/**
 * Send OTP to email for verification
 * Uses Supabase's built-in email OTP system
 */
export const sendOTP = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true, // Create user if doesn't exist
    },
  });
  return { data, error };
};

/**
 * Verify OTP code entered by user
 * This also signs in the user if successful
 */
export const verifyOTP = async (email: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  return { data, error };
};

/**
 * Update user password after OTP verification
 * Call this after successful OTP verification to set password
 */
export const updateUserPassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  return { data, error };
};

/**
 * Change password with verification of the current password.
 * This re-authenticates using the current password, then updates to the new password.
 */
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return { data: null as any, error: userError };
  if (!user?.email) {
    return { data: null as any, error: { message: 'No authenticated user email found.' } as any };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reauthError) return { data: null as any, error: reauthError };

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
};

/**
 * Update user metadata (name, role, etc.)
 */
export const updateUserMetadata = async (metadata: Record<string, any>) => {
  const { data, error } = await supabase.auth.updateUser({
    data: metadata,
  });
  return { data, error };
};
