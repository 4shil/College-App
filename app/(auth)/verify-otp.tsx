import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedBackground,
  Card,
  ThemeToggle,
} from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { supabase, verifyOTP as verifySupabaseOTP, updateUserPassword, sendOTP } from '../../lib/supabase';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export default function VerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    password: string;
    apaar_id: string;
  }>();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useThemeStore();

  // State
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);

  // Refs for OTP inputs
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Format countdown
  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (value && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        verifyOTP(fullOtp);
      }
    }
  };

  // Handle backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP
  const verifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the complete OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify OTP with Supabase Auth
      const { data: authData, error: verifyError } = await verifySupabaseOTP(
        params.email,
        code
      );

      if (verifyError) throw verifyError;

      if (!authData.user) {
        setError('Verification failed. Please try again.');
        setLoading(false);
        return;
      }

      // Set user password
      const { error: passwordError } = await updateUserPassword(params.password);
      if (passwordError) {
        console.error('Password update error:', passwordError);
        // Continue anyway - user can reset password later
      }

      // Get stored registration data from our database
      const { data: otpData } = await supabase
        .from('otp_verifications')
        .select('registration_data')
        .eq('email', params.email)
        .eq('purpose', 'registration')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpData?.registration_data) {
        // Complete student registration
        const { error: regError } = await supabase.rpc('complete_student_registration', {
          p_user_id: authData.user.id,
          p_apaar_id: params.apaar_id,
          p_registration_data: otpData.registration_data,
        });

        if (regError) throw regError;
      }

      // Mark our OTP record as verified
      await supabase
        .from('otp_verifications')
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq('email', params.email)
        .eq('purpose', 'registration');

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend) return;

    setResending(true);
    setError(null);

    try {
      // Resend OTP using Supabase Auth
      const { error: resendError } = await sendOTP(params.email);

      if (resendError) throw resendError;

      // Reset countdown
      setCountdown(OTP_EXPIRY_MINUTES * 60);
      setCanResend(false);
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Resend error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <AnimatedBackground>
        <View style={[styles.successContainer, { paddingTop: insets.top }]}>
          <Animated.View
            entering={FadeInUp.delay(100).duration(500)}
            style={styles.successContent}
          >
            <View style={[styles.successIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
            <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
              Registration Successful!
            </Text>
            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
              Your account has been created successfully.{'\n'}
              Redirecting to login...
            </Text>
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          </Animated.View>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
            { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.cardContainer}
          >
            <Card style={styles.card}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : 'rgba(99, 102, 241, 0.1)' },
                ]}
              >
                <Ionicons name="mail-open" size={40} color={colors.primary} />
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Verify Your Email
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                We've sent a 6-digit code to
              </Text>
              <Text style={[styles.email, { color: colors.primary }]}>
                {params.email}
              </Text>

              {/* Timer */}
              <View style={styles.timerContainer}>
                <Ionicons
                  name={countdown > 0 ? 'time-outline' : 'alert-circle-outline'}
                  size={18}
                  color={countdown > 0 ? colors.textMuted : '#f87171'}
                />
                <Text
                  style={[
                    styles.timerText,
                    { color: countdown > 0 ? colors.textMuted : '#f87171' },
                  ]}
                >
                  {countdown > 0
                    ? `Code expires in ${formatCountdown()}`
                    : 'Code has expired'}
                </Text>
              </View>

              {/* OTP Inputs */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.03)',
                        borderColor: digit
                          ? colors.primary
                          : error
                          ? '#f87171'
                          : colors.glassBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              {/* Error */}
              {error && (
                <Animated.View
                  entering={FadeInDown.duration(200)}
                  style={styles.errorContainer}
                >
                  <Ionicons name="alert-circle" size={18} color="#f87171" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  { backgroundColor: colors.primary },
                  loading && { opacity: 0.7 },
                ]}
                onPress={() => verifyOTP()}
                disabled={loading || otp.join('').length !== OTP_LENGTH}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.verifyButtonText}>Verify & Create Account</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resend */}
              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.textMuted }]}>
                  Didn't receive the code?{' '}
                </Text>
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <TouchableOpacity
                    onPress={resendOTP}
                    disabled={!canResend}
                  >
                    <Text
                      style={[
                        styles.resendLink,
                        { color: canResend ? colors.primary : colors.textMuted },
                      ]}
                    >
                      Resend
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Info */}
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' },
                ]}
              >
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Please check your spam folder if you don't see the email in your inbox.
                </Text>
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
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
    justifyContent: 'center',
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
  cardContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  timerText: {
    fontSize: 13,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    flex: 1,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successContent: {
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
