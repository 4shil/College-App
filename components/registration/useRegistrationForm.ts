/**
 * useRegistrationForm Hook
 * Manages all registration form state and logic
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { sanitizePlainText, sanitizeEmail, sanitizePhone, sanitizeAlphanumeric } from '@/lib/sanitization';
import {
  FormData,
  DegreeProgram,
  ProgramType,
  initialFormData,
  RegistrationFormState,
  RegistrationFormActions,
} from './types';

// Helper to infer program type from duration
const inferProgramType = (programs: DegreeProgram[]): ProgramType => {
  // If we have any PG programs in the list, default to UG to show both options
  const hasPG = programs.some(p => p.program_type === 'pg');
  const hasUG = programs.some(p => p.program_type === 'ug');
  
  if (hasUG && hasPG) return 'ug';
  if (hasPG) return 'pg';
  return 'ug';
};

export function useRegistrationForm(): RegistrationFormState & RegistrationFormActions {
  // State
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [apaarVerified, setApaarVerified] = useState(false);
  const [programs, setPrograms] = useState<DegreeProgram[]>([]);
  const [programType, setProgramType] = useState<ProgramType>('ug');
  const [selectedProgram, setSelectedProgram] = useState<DegreeProgram | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update form data helper
  const updateFormData = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  }, []);

  // Fetch programs
  const fetchPrograms = useCallback(async () => {
    try {
      // Try RPC first (more reliable with RLS)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_programs');
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        const activePrograms = (rpcData as DegreeProgram[]).filter(p => p.is_active !== false);
        setPrograms(activePrograms);
        setProgramType(inferProgramType(activePrograms));
        return;
      }

      // Fallback to direct query
      const { data, error: queryError } = await supabase
        .from('degree_programs')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (queryError) {
        console.error('Error fetching programs:', queryError);
        return;
      }

      if (data && data.length > 0) {
        setPrograms(data as DegreeProgram[]);
        setProgramType(inferProgramType(data as DegreeProgram[]));
      }
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  }, []);

  // Load programs on mount
  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  // APAAR ID verification
  const verifyApaarId = useCallback(async () => {
    if (!formData.apaar_id || formData.apaar_id.length < 8) {
      setError('Please enter a valid APAAR ID');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      // Simulated verification - in production, this would call an actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, any 12-digit ID is "valid"
      if (formData.apaar_id.length >= 8) {
        setApaarVerified(true);
        setError('');
      } else {
        setError('Invalid APAAR ID format');
      }
    } catch (err) {
      setError('Failed to verify APAAR ID. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [formData.apaar_id]);

  // Step validation
  const validateStep = useCallback((): boolean => {
    switch (step) {
      case 1:
        if (!apaarVerified) {
          setError('Please verify your APAAR ID first');
          return false;
        }
        return true;

      case 2:
        if (!formData.full_name.trim()) {
          setError('Please enter your full name');
          return false;
        }
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
          setError('Please enter a valid 10-digit phone number');
          return false;
        }
        return true;

      case 3:
        if (!formData.program_id) {
          setError('Please select a program');
          return false;
        }
        if (!formData.roll_number.trim()) {
          setError('Please enter your roll number');
          return false;
        }
        if (!formData.admission_no.trim()) {
          setError('Please enter your admission number');
          return false;
        }
        return true;

      case 4:
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (formData.password !== formData.confirm_password) {
          setError('Passwords do not match');
          return false;
        }
        if (!formData.acceptPrivacyPolicy) {
          setError('Please accept the Privacy Policy to continue');
          return false;
        }
        if (!formData.acceptTermsOfService) {
          setError('Please accept the Terms of Service to continue');
          return false;
        }
        return true;

      default:
        return true;
    }
  }, [step, apaarVerified, formData]);

  // Navigation
  const nextStep = useCallback(() => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 4));
      setError('');
    }
  }, [validateStep]);

  const prevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
    setError('');
  }, []);

  // Form submission
  const handleSubmit = useCallback(async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      // Sanitize all form inputs before submission
      const sanitizedData = {
        full_name: sanitizePlainText(formData.full_name),
        email: sanitizeEmail(formData.email),
        phone: sanitizePhone(formData.phone),
        apaar_id: sanitizeAlphanumeric(formData.apaar_id),
        roll_number: sanitizeAlphanumeric(formData.roll_number),
        admission_no: sanitizeAlphanumeric(formData.admission_no),
      };

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitizedData.email,
        password: formData.password,
        options: {
          data: {
            full_name: sanitizedData.full_name,
            phone: sanitizedData.phone,
            role: 'student',
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please login instead.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (!authData.user) {
        setError('Registration failed. Please try again.');
        return;
      }

      // Insert student profile
      const { error: profileError } = await supabase.from('students').insert({
        user_id: authData.user.id,
        apaar_id: sanitizedData.apaar_id,
        full_name: sanitizedData.full_name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        dob: formData.dob.toISOString().split('T')[0],
        gender: formData.gender,
        program_id: formData.program_id,
        year: formData.year,
        semester: formData.semester,
        roll_number: sanitizedData.roll_number,
        admission_no: sanitizedData.admission_no,
        is_verified: false,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Auth user is created but profile failed - could cleanup or notify
        setError('Registration partially complete. Please contact support.');
        return;
      }

      // Success - show confirmation
      const showAlert = () => {
        if (Platform.OS === 'web') {
          window.alert(
            'Registration successful! Please check your email to verify your account before logging in.'
          );
          router.replace('/(auth)/login');
        } else {
          Alert.alert(
            'Registration Successful',
            'Please check your email to verify your account before logging in.',
            [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
          );
        }
      };

      showAlert();
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, validateStep]);

  return {
    // State
    formData,
    step,
    loading,
    verifying,
    error,
    apaarVerified,
    programs,
    programType,
    selectedProgram,
    showDatePicker,
    // Actions
    updateFormData,
    setStep,
    setLoading,
    setVerifying,
    setError,
    setApaarVerified,
    setPrograms,
    setProgramType,
    setSelectedProgram,
    setShowDatePicker,
    nextStep,
    prevStep,
    verifyApaarId,
    validateStep,
    handleSubmit,
    fetchPrograms,
  };
}
