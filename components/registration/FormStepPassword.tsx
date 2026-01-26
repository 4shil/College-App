/**
 * FormStepPassword - Step 4: Password Creation
 */

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';
import { GlassInput } from '@/components/ui/GlassInput';
import { SolidButton } from '@/components/ui/SolidButton';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { FormData, DegreeProgram } from './types';
import { registrationStyles as styles } from './styles';

interface FormStepPasswordProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  selectedProgram: DegreeProgram | null;
  loading: boolean;
  handleSubmit: () => Promise<void>;
}

export function FormStepPassword({
  formData,
  updateFormData,
  selectedProgram,
  loading,
  handleSubmit,
}: FormStepPasswordProps) {
  const { colors, isDark } = useThemeStore();

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
          accessibilityLabel="Password input"
          accessibilityHint="Minimum 8 characters required"
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
          accessibilityLabel="Confirm password input"
        />
      </View>

      {/* Registration Summary */}
      <View
        style={[
          styles.summaryBox,
          {
            backgroundColor: isDark
              ? withAlpha(colors.textInverse, 0.05)
              : withAlpha(colors.shadowColor, 0.02),
          },
        ]}
        accessibilityRole="summary"
        accessibilityLabel="Registration summary"
      >
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
          Registration Summary
        </Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Name:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {formData.full_name}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Email:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {formData.email}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Course:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {selectedProgram?.short_name || 'Not selected'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
            Year/Sem:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            Year {formData.year} / Sem {formData.semester}
          </Text>
        </View>
      </View>

      {/* Email Confirmation Notice */}
      <View
        style={[
          styles.infoBox,
          { backgroundColor: withAlpha(colors.success, isDark ? 0.1 : 0.05) },
        ]}
      >
        <Ionicons name="mail" size={20} color={colors.success} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          A confirmation link will be sent to {formData.email}. Please verify your
          email before logging in.
        </Text>
      </View>

      {/* Privacy Policy Consent */}
      <TouchableOpacity
        style={[
          styles.consentRow,
          {
            backgroundColor: isDark
              ? withAlpha(colors.textInverse, 0.03)
              : withAlpha(colors.shadowColor, 0.02),
            borderColor: formData.acceptPrivacyPolicy ? colors.success : colors.glassBorder,
          },
        ]}
        onPress={() => updateFormData('acceptPrivacyPolicy', !formData.acceptPrivacyPolicy)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: formData.acceptPrivacyPolicy }}
        accessibilityLabel="Accept Privacy Policy"
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: formData.acceptPrivacyPolicy
                ? colors.success
                : 'transparent',
              borderColor: formData.acceptPrivacyPolicy
                ? colors.success
                : colors.textMuted,
            },
          ]}
        >
          {formData.acceptPrivacyPolicy && (
            <Ionicons name="checkmark" size={14} color={colors.textInverse} />
          )}
        </View>
        <View style={styles.consentTextContainer}>
          <Text style={[styles.consentText, { color: colors.textSecondary }]}>
            I have read and agree to the{' '}
            <Text
              style={[styles.consentLink, { color: colors.primary }]}
              onPress={() => router.push('/(auth)/privacy-policy')}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </TouchableOpacity>

      {/* Terms of Service Consent */}
      <TouchableOpacity
        style={[
          styles.consentRow,
          {
            backgroundColor: isDark
              ? withAlpha(colors.textInverse, 0.03)
              : withAlpha(colors.shadowColor, 0.02),
            borderColor: formData.acceptTermsOfService ? colors.success : colors.glassBorder,
          },
        ]}
        onPress={() => updateFormData('acceptTermsOfService', !formData.acceptTermsOfService)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: formData.acceptTermsOfService }}
        accessibilityLabel="Accept Terms of Service"
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: formData.acceptTermsOfService
                ? colors.success
                : 'transparent',
              borderColor: formData.acceptTermsOfService
                ? colors.success
                : colors.textMuted,
            },
          ]}
        >
          {formData.acceptTermsOfService && (
            <Ionicons name="checkmark" size={14} color={colors.textInverse} />
          )}
        </View>
        <View style={styles.consentTextContainer}>
          <Text style={[styles.consentText, { color: colors.textSecondary }]}>
            I agree to the{' '}
            <Text
              style={[styles.consentLink, { color: colors.primary }]}
              onPress={() => router.push('/(auth)/terms-of-service')}
            >
              Terms of Service
            </Text>
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.stepButtonContainer}>
        <SolidButton
          onPress={handleSubmit}
          disabled={loading}
          style={[
            styles.stepButton,
            {
              backgroundColor: isDark
                ? withAlpha(colors.primary, 0.15)
                : colors.primary,
              borderColor: colors.primary,
            },
            loading && { opacity: 0.5 },
          ]}
        >
          {loading ? (
            <LoadingIndicator
              color={isDark ? colors.primary : colors.textInverse}
              size="small"
            />
          ) : (
            <>
              <Text
                style={[
                  styles.stepButtonText,
                  { color: isDark ? colors.primary : colors.textInverse },
                ]}
              >
                Complete Registration
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={isDark ? colors.primary : colors.textInverse}
              />
            </>
          )}
        </SolidButton>
      </View>
    </Animated.View>
  );
}
