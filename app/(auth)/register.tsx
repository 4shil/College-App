import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Dimensions, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown, FadeInUp, FadeInLeft, FadeOutLeft, FadeInRight, FadeOutRight, } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedBackground, GlassInput, PrimaryButton, ThemeToggle, LoadingIndicator } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { supabase, sendOTP } from '../../lib/supabase';
import { withAlpha } from '../../theme/colorUtils';

// Import DateTimePicker - works on iOS/Android, not on web
import DateTimePicker from '@react-native-community/datetimepicker';

const { width } = Dimensions.get('window');

type ProgramType = 'undergraduate' | 'postgraduate';

interface DegreeProgram {
  id: string;
  code: string;
  name: string;
  short_name: string;
  program_type: ProgramType;
  department_id: string;
  duration_years: number;
  total_semesters: number;
  department?: { name: string; code: string };
}

interface FormData {
  // Step 1: APAAR Verification
  apaar_id: string;
  // Step 2: Personal Info
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: Date;
  father_name: string;
  gender: 'male' | 'female' | 'other';
  // Step 3: Academic Info
  program_type: ProgramType;
  program_id: string;
  year: number;
  semester: number;
  roll_number: string;
  admission_no: string;
  // Step 4: Password
  password: string;
  confirm_password: string;
}

const initialFormData: FormData = {
  apaar_id: '',
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: new Date(2004, 0, 1),
  father_name: '',
  gender: 'male',
  program_type: 'undergraduate',
  program_id: '',
  year: 1,
  semester: 1,
  roll_number: '',
  admission_no: '',
  password: '',
  confirm_password: '',
};

const TOTAL_STEPS = 4;

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useThemeStore();

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyingApaar, setVerifyingApaar] = useState(false);
  const [apaarVerified, setApaarVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, department:departments(name, code)')
        .not('program_type', 'is', null)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDegreePrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  // Filter programs by type
  const filteredPrograms = degreePrograms.filter(
    (p) => p.program_type === formData.program_type
  );

  // Get year options based on program
  const selectedProgram = degreePrograms.find((p) => p.id === formData.program_id);
  const maxYears = selectedProgram?.duration_years || (formData.program_type === 'undergraduate' ? 3 : 2);
  const maxSemesters = selectedProgram?.total_semesters || (formData.program_type === 'undergraduate' ? 6 : 4);

  // Step 1: Verify APAAR ID
  const verifyApaarId = async () => {
    if (!formData.apaar_id.trim()) {
      setError('Please enter your APAAR ID');
      return;
    }

    setVerifyingApaar(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_apaar_id', {
        p_apaar_id: formData.apaar_id.trim().toUpperCase(),
      });

      if (rpcError) throw rpcError;

      const result = data?.[0];
      if (!result?.is_valid) {
        setError(result?.message || 'APAAR ID verification failed');
        setApaarVerified(false);
      } else {
        setApaarVerified(true);
        // Auto-fill name if provided
        if (result.expected_name) {
          updateFormData('full_name', result.expected_name);
        }
        setCurrentStep(2);
      }
    } catch (err: any) {
      console.error('APAAR verification error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setVerifyingApaar(false);
    }
  };

  // Validate current step
  const validateStep = (): boolean => {
    switch (currentStep) {
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
        if (!formData.email.trim() || !formData.email.includes('@')) {
          setError('Please enter a valid email');
          return false;
        }
        if (!formData.phone.trim() || formData.phone.length < 10) {
          setError('Please enter a valid phone number');
          return false;
        }
        if (!formData.father_name.trim()) {
          setError("Please enter your father's name");
          return false;
        }
        return true;

      case 3:
        if (!formData.program_id) {
          setError('Please select a programme');
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
        return true;

      default:
        return true;
    }
  };

  // Navigation
  const nextStep = () => {
    if (validateStep()) {
      setError(null);
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setError(null);
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Submit registration
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      // Generate OTP and send to email
      const registrationData = {
        apaar_id: formData.apaar_id.toUpperCase(),
        full_name: formData.full_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth.toISOString().split('T')[0],
        father_name: formData.father_name,
        gender: formData.gender,
        program_id: formData.program_id,
        year: formData.year,
        semester: formData.semester,
        roll_number: formData.roll_number,
        admission_no: formData.admission_no,
      };

      // Store registration data in database for later use
      await supabase.rpc('generate_otp', {
        p_email: formData.email.trim().toLowerCase(),
        p_purpose: 'registration',
        p_registration_data: registrationData,
      });

      // Send OTP using Supabase Auth
      const { error: otpError } = await sendOTP(formData.email.trim().toLowerCase());

      if (otpError) throw otpError;

      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          apaar_id: formData.apaar_id.toUpperCase(),
        },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepRow}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor:
                  step < currentStep
                    ? colors.primary
                    : step === currentStep
                    ? withAlpha(colors.primary, isDark ? 0.2 : 0.1)
                    : 'transparent',
                borderColor:
                  step <= currentStep ? colors.primary : colors.glassBorder,
              },
            ]}
          >
            {step < currentStep ? (
              <Ionicons name="checkmark" size={14} color={colors.textInverse} />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  {
                    color:
                      step === currentStep ? colors.primary : colors.textMuted,
                  },
                ]}
              >
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor:
                    step < currentStep ? colors.primary : colors.glassBorder,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Animated.View
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            key="step1"
          >
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              APAAR ID Verification
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Enter your APAAR ID to verify your eligibility
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                APAAR ID *
              </Text>
              <GlassInput
                icon="card-outline"
                placeholder="Enter your APAAR ID"
                value={formData.apaar_id}
                onChangeText={(v) => {
                  updateFormData('apaar_id', v.toUpperCase());
                  setApaarVerified(false);
                }}
                autoCapitalize="characters"
                error={!!error}
              />
            </View>

            {apaarVerified && (
              <Animated.View
                entering={FadeInDown.duration(300)}
                style={[styles.verifiedBadge, { backgroundColor: withAlpha(colors.success, 0.1) }]}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>APAAR ID Verified!</Text>
              </Animated.View>
            )}

            {!apaarVerified && (
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={verifyApaarId}
                disabled={verifyingApaar}
              >
                {verifyingApaar ? (
                  <LoadingIndicator color={colors.textInverse} size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color={colors.textInverse} />
                    <Text style={[styles.verifyButtonText, { color: colors.textInverse }]}>Verify APAAR ID</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View
              style={[
                styles.infoBox,
                { backgroundColor: withAlpha(colors.info, isDark ? 0.1 : 0.05) },
              ]}
            >
              <Ionicons name="information-circle" size={20} color={colors.info} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                APAAR ID is provided by the college administration. If you don't have one, please contact the college office.
              </Text>
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            key="step2"
          >
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              Personal Information
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Enter your personal details
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Full Name *
              </Text>
              <GlassInput
                icon="person-outline"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChangeText={(v) => updateFormData('full_name', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Email *
              </Text>
              <GlassInput
                icon="mail-outline"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(v) => updateFormData('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Phone Number *
              </Text>
              <GlassInput
                icon="call-outline"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChangeText={(v) => updateFormData('phone', v)}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Date of Birth *
              </Text>
              {Platform.OS === 'web' ? (
                // Web: Use native HTML date input
                <View
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: isDark
                        ? withAlpha(colors.textInverse, 0.05)
                        : withAlpha(colors.shadowColor, 0.03),
                      borderColor: colors.glassBorder,
                    },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                  <input
                    type="date"
                    value={formData.date_of_birth.toISOString().split('T')[0]}
                    max="2010-12-31"
                    min="1990-01-01"
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        updateFormData('date_of_birth', date);
                      }
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      color: colors.textPrimary,
                      fontSize: 15,
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  />
                </View>
              ) : (
                // Native: Use DateTimePicker
                <>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      {
                        backgroundColor: isDark
                          ? withAlpha(colors.textInverse, 0.05)
                          : withAlpha(colors.shadowColor, 0.03),
                        borderColor: colors.glassBorder,
                      },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                    <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                      {formData.date_of_birth.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={formData.date_of_birth}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date(2010, 11, 31)}
                      minimumDate={new Date(1990, 0, 1)}
                      onChange={(event: any, date?: Date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) updateFormData('date_of_birth', date);
                      }}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Father's Name *
              </Text>
              <GlassInput
                icon="people-outline"
                placeholder="Enter your father's name"
                value={formData.father_name}
                onChangeText={(v) => updateFormData('father_name', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Gender *
              </Text>
              <View style={styles.genderButtons}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderButton,
                      {
                        backgroundColor:
                          formData.gender === g
                            ? withAlpha(colors.primary, isDark ? 0.2 : 0.1)
                            : 'transparent',
                        borderColor:
                          formData.gender === g ? colors.primary : colors.glassBorder,
                      },
                    ]}
                    onPress={() => updateFormData('gender', g)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        {
                          color:
                            formData.gender === g
                              ? colors.primary
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            key="step3"
          >
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              Academic Information
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Select your course and academic details
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Program Type *
              </Text>
              <View style={styles.programTypeButtons}>
                {(['undergraduate', 'postgraduate'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.programTypeButton,
                      {
                        backgroundColor:
                          formData.program_type === type
                            ? withAlpha(colors.primary, isDark ? 0.2 : 0.1)
                            : 'transparent',
                        borderColor:
                          formData.program_type === type
                            ? colors.primary
                            : colors.glassBorder,
                      },
                    ]}
                    onPress={() => {
                      updateFormData('program_type', type);
                      updateFormData('program_id', '');
                      updateFormData('year', 1);
                      updateFormData('semester', 1);
                    }}
                  >
                    <FontAwesome5
                      name={type === 'undergraduate' ? 'graduation-cap' : 'user-graduate'}
                      size={16}
                      color={
                        formData.program_type === type
                          ? colors.primary
                          : colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.programTypeText,
                        {
                          color:
                            formData.program_type === type
                              ? colors.primary
                              : colors.textMuted,
                        },
                      ]}
                    >
                      {type === 'undergraduate' ? 'UG' : 'PG'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Programme *
              </Text>
              <View style={styles.programScrollContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.programScrollContent}
                >
                  {filteredPrograms.map((prog) => (
                    <TouchableOpacity
                      key={prog.id}
                      style={[
                        styles.programChip,
                        {
                          backgroundColor:
                            formData.program_id === prog.id
                              ? colors.primary
                              : isDark
                              ? withAlpha(colors.textInverse, 0.05)
                              : withAlpha(colors.shadowColor, 0.03),
                          borderColor:
                            formData.program_id === prog.id
                              ? colors.primary
                              : colors.glassBorder,
                        },
                      ]}
                      onPress={() => updateFormData('program_id', prog.id)}
                    >
                      <Text
                        style={[
                          styles.programChipText,
                          {
                            color:
                              formData.program_id === prog.id
                                ? colors.textInverse
                                : colors.textPrimary,
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {prog.short_name || prog.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {filteredPrograms.length === 0 && (
                <Text style={[styles.noProgramsText, { color: colors.textMuted }]}>
                  No programs found. Please check database.
                </Text>
              )}
              {formData.program_id && selectedProgram && (
                <Text style={[styles.selectedProgram, { color: colors.textSecondary }]}>
                  {selectedProgram.name} • {selectedProgram.department?.name}
                </Text>
              )}
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Year *
                </Text>
                <View style={styles.numberSelector}>
                  {Array.from({ length: maxYears }, (_, i) => i + 1).map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.numberButton,
                        {
                          backgroundColor:
                            formData.year === y
                              ? colors.primary
                              : 'transparent',
                          borderColor:
                            formData.year === y ? colors.primary : colors.glassBorder,
                        },
                      ]}
                      onPress={() => {
                        updateFormData('year', y);
                        // Auto-adjust semester
                        const newSem = (y - 1) * 2 + 1;
                        if (newSem <= maxSemesters) {
                          updateFormData('semester', newSem);
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: formData.year === y ? colors.textInverse : colors.textMuted,
                          fontWeight: '600',
                        }}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Semester *
                </Text>
                <View style={styles.numberSelector}>
                  {[(formData.year - 1) * 2 + 1, (formData.year - 1) * 2 + 2]
                    .filter((s) => s <= maxSemesters)
                    .map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.numberButton,
                          {
                            backgroundColor:
                              formData.semester === s
                                ? colors.primary
                                : 'transparent',
                            borderColor:
                              formData.semester === s
                                ? colors.primary
                                : colors.glassBorder,
                          },
                        ]}
                        onPress={() => updateFormData('semester', s)}
                      >
                        <Text
                          style={{
                            color:
                              formData.semester === s
                                ? colors.textInverse
                                : colors.textMuted,
                            fontWeight: '600',
                          }}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Roll Number *
              </Text>
              <GlassInput
                icon="document-text-outline"
                placeholder="Enter your roll number"
                value={formData.roll_number}
                onChangeText={(v) => updateFormData('roll_number', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Admission Number *
              </Text>
              <GlassInput
                icon="id-card-outline"
                placeholder="Enter your admission number"
                value={formData.admission_no}
                onChangeText={(v) => updateFormData('admission_no', v)}
              />
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View
            entering={FadeInRight.duration(300)}
            exiting={FadeOutLeft.duration(200)}
            key="step4"
          >
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              Create Password
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Set a secure password for your account
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Password *
              </Text>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(v) => updateFormData('password', v)}
                isPassword
              />
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Minimum 8 characters
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Confirm Password *
              </Text>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Confirm your password"
                value={formData.confirm_password}
                onChangeText={(v) => updateFormData('confirm_password', v)}
                isPassword
                error={
                  formData.confirm_password.length > 0 &&
                  formData.password !== formData.confirm_password
                }
              />
            </View>

            <View
              style={[
                styles.summaryBox,
                {
                  backgroundColor: isDark
                    ? withAlpha(colors.textInverse, 0.05)
                    : withAlpha(colors.shadowColor, 0.02),
                },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                Registration Summary
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Name:</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formData.full_name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Email:</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formData.email}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Course:</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  {selectedProgram?.short_name || 'Not selected'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Year/Sem:</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                  Year {formData.year} / Sem {formData.semester}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.infoBox,
                { backgroundColor: withAlpha(colors.success, isDark ? 0.1 : 0.05) },
              ]}
            >
              <Ionicons name="mail" size={20} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                An OTP will be sent to {formData.email} for verification.
              </Text>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatedBackground>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={prevStep} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ThemeToggle />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.contentContainer}
          >
            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Step Content */}
            {renderStepContent()}

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={[styles.errorContainer, { backgroundColor: withAlpha(colors.error, 0.1) }]}
              >
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(400)}
          style={[
            styles.bottomNav,
            {
              paddingBottom: insets.bottom + 20,
              backgroundColor: withAlpha(colors.background, 0.9),
            },
          ]}
        >
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton, { borderColor: colors.glassBorder }]}
              onPress={prevStep}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={[styles.navButtonText, { color: colors.textPrimary }]}>
                Back
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: colors.primary },
              currentStep === 1 && !apaarVerified && { opacity: 0.5 },
            ]}
            onPress={nextStep}
            disabled={(currentStep === 1 && !apaarVerified) || loading}
          >
            {loading ? (
              <LoadingIndicator color={colors.textInverse} size="small" />
            ) : (
              <>
                <Text style={[styles.nextButtonText, { color: colors.textInverse }]}>
                  {currentStep === TOTAL_STEPS ? 'Register' : 'Continue'}
                </Text>
                <Ionicons
                  name={currentStep === TOTAL_STEPS ? 'checkmark' : 'arrow-forward'}
                  size={20}
                  color={colors.textInverse}
                />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  backButton: {
    padding: 8,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifiedText: {
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifyButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderText: {
    fontWeight: '500',
    fontSize: 14,
  },
  programTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  programTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  programTypeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  programScrollContainer: {
    marginHorizontal: -4,
  },
  programScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 10,
    flexDirection: 'row',
  },
  programChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 100,
    maxWidth: 150,
  },
  programChipText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  noProgramsText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    marginLeft: 4,
  },
  selectedProgram: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  numberSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  prevButton: {
    borderWidth: 1,
  },
  nextButton: {
    flex: 1,
  },
  navButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  nextButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
