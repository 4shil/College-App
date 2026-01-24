import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClientOptions, SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Supabase credentials - MUST be set via environment variables
// In development: Create .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
// In production: Set via EAS build secrets
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// SECURITY: Service role key should NEVER be accessible in client code
// This check prevents accidental exposure
const LEAKED_SERVICE_ROLE_KEY = 
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (LEAKED_SERVICE_ROLE_KEY && __DEV__) {
  console.error(`
⚠️  SECURITY WARNING: SUPABASE_SERVICE_ROLE_KEY detected in client code!
This key grants full database access and should NEVER be bundled in the app.
Remove it from .env and use it only in:
- Supabase Edge Functions (server-side)
- Local scripts (not bundled in app)
  `.trim());
}

// Validate configuration at startup
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMessage = `
Missing Supabase configuration!
Set the following environment variables:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

For development, create a .env file in the project root.
For production, configure via EAS build secrets.
  `.trim();
  
  if (__DEV__) {
    console.error(errorMessage);
  }
  throw new Error('Missing Supabase configuration. See console for details.');
}

// Storage adapter that works on all platforms
// Properly typed to match Supabase's SupportedStorage interface
const webStorage: SupportedStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (typeof window !== 'undefined') {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

// AsyncStorage already implements SupportedStorage interface
const storage: SupportedStorage = Platform.OS === 'web' ? webStorage : AsyncStorage;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
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
      emailRedirectTo: undefined, // Use default redirect from Supabase dashboard
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
