import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnimatedBackground, Card, GlassInput, PrimaryButton, ThemeToggle, LoadingIndicator, SolidButton } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { sendOTP, verifyOTP, updateUserPassword } from '../../lib/supabase';
import { withAlpha } from '../../theme/colorUtils';

type Step = 'email' | 'otp' | 'password' | 'success';
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useThemeStore();

  // State
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(OTP_EXPIRY_MINUTES * 60);
  const [canResend, setCanResend] = useState(false);

  // OTP input refs
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== 'otp') return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, step]);

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: otpError } = await sendOTP(email.trim().toLowerCase());

      if (otpError) {
        setError(otpError.message);
      } else {
        setStep('otp');
        setCountdown(OTP_EXPIRY_MINUTES * 60);
        setCanResend(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when complete
    if (value && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerifyOTP(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the complete OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await verifyOTP(
        email.trim().toLowerCase(),
        code
      );

      if (verifyError) {
        setError(verifyError.message);
      } else if (data?.user) {
        setStep('password');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    setError(null);

    try {
      const { error: otpError } = await sendOTP(email.trim().toLowerCase());

      if (otpError) {
        setError(otpError.message);
      } else {
        setCountdown(OTP_EXPIRY_MINUTES * 60);
        setCanResend(false);
        setOtp(new Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set new password
  const handleSetPassword = async () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await updateUserPassword(password);

      if (updateError) {
        setError(updateError.message);
      } else {
        setStep('success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.1) },
                ]}
              >
                <Ionicons name="key" size={40} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email and we'll send you an OTP to reset your password.
            </Text>

            <View style={styles.inputsContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Email
              </Text>
              <GlassInput
                icon="mail-outline"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!error}
              />
            </View>

            <PrimaryButton
              title="Send OTP"
              onPress={handleSendOTP}
              loading={loading}
              disabled={loading}
            />
          </>
        );

      case 'otp':
        return (
          <>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.1) },
                ]}
              >
                <Ionicons name="mail-open" size={40} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Enter OTP
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: colors.primary, fontWeight: '600' }}>{email}</Text>
            </Text>

            <View style={styles.timerContainer}>
              <Ionicons
                name={countdown > 0 ? 'time-outline' : 'alert-circle-outline'}
                size={18}
                color={countdown > 0 ? colors.textMuted : colors.error}
              />
              <Text
                style={[
                  styles.timerText,
                  { color: countdown > 0 ? colors.textMuted : colors.error },
                ]}
              >
                {countdown > 0 ? `Code expires in ${formatCountdown()}` : 'Code has expired'}
              </Text>
            </View>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: isDark
                        ? withAlpha(colors.textInverse, 0.05)
                        : withAlpha(colors.shadowColor, 0.03),
                      borderColor: digit ? colors.primary : error ? colors.error : colors.glassBorder,
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

            <SolidButton
              onPress={() => handleVerifyOTP()}
              disabled={loading || otp.join('').length !== OTP_LENGTH}
              style={[styles.verifyButton, { backgroundColor: colors.primary }]}
            >
              {loading ? (
                <LoadingIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={[styles.verifyButtonText, { color: colors.textInverse }]}>Verify OTP</Text>
              )}
            </SolidButton>

            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: colors.textMuted }]}>
                Didn't receive the code?{' '}
              </Text>
              {loading ? (
                <LoadingIndicator size="small" color={colors.primary} />
              ) : (
                <TouchableOpacity onPress={handleResendOTP} disabled={!canResend}>
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
          </>
        );

      case 'password':
        return (
          <>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.1) },
                ]}
              >
                <Ionicons name="lock-closed" size={40} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Set New Password
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Create a strong password for your account
            </Text>

            <View style={styles.inputsContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                New Password
              </Text>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Enter new password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Minimum 8 characters
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                Confirm Password
              </Text>
              <GlassInput
                icon="lock-closed-outline"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                error={confirmPassword.length > 0 && password !== confirmPassword}
              />
            </View>

            <PrimaryButton
              title="Reset Password"
              onPress={handleSetPassword}
              loading={loading}
              disabled={loading}
            />
          </>
        );

      case 'success':
        return (
          <>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: withAlpha(colors.success, 0.1) },
                ]}
              >
                <Ionicons name="checkmark-circle" size={50} color={colors.success} />
              </View>
            </View>

            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Password Reset!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Your password has been successfully updated. You can now login with your new password.
            </Text>

            <PrimaryButton
              title="Back to Login"
              onPress={() => router.replace('/(auth)/login')}
            />
          </>
        );
    }
  };

  return (
    <AnimatedBackground>
      {/* Theme Toggle */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.themeToggleContainer, { top: insets.top + 10 }]}
      >
        <ThemeToggle />
      </Animated.View>

      {/* Back Button */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.backButtonContainer, { top: insets.top + 10 }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (step === 'email') {
              router.back();
            } else if (step === 'otp') {
              setStep('email');
              setOtp(new Array(OTP_LENGTH).fill(''));
            } else if (step === 'password') {
              setStep('otp');
            }
          }}
          style={[
            styles.backButton,
            {
              backgroundColor: isDark
                ? withAlpha(colors.textInverse, 0.1)
                : withAlpha(colors.shadowColor, 0.05),
            },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.cardContainer}
          >
            <Card style={styles.card}>
              {renderContent()}

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

              {/* Back to Login Link */}
              {step !== 'success' && (
                <TouchableOpacity
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.backToLogin}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.primary} />
                  <Text style={[styles.backToLoginText, { color: colors.primary }]}>
                    Back to login
                  </Text>
                </TouchableOpacity>
              )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  themeToggleContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 13,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
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
  verifyButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
