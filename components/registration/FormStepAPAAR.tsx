/**
 * FormStepAPAAR - Step 1: APAAR ID Verification
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';
import { GlassInput } from '@/components/ui/GlassInput';
import { SolidButton } from '@/components/ui/SolidButton';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { FormData } from './types';
import { registrationStyles as styles } from './styles';

interface FormStepAPAARProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  apaarVerified: boolean;
  verifying: boolean;
  verifyApaarId: () => Promise<void>;
  nextStep: () => void;
}

export function FormStepAPAAR({
  formData,
  updateFormData,
  apaarVerified,
  verifying,
  verifyApaarId,
  nextStep,
}: FormStepAPAARProps) {
  const { colors, isDark } = useThemeStore();

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
        Enter your 12-digit APAAR ID to verify your identity
      </Text>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          APAAR ID *
        </Text>
        <GlassInput
          icon="finger-print-outline"
          placeholder="Enter your 12-digit APAAR ID"
          value={formData.apaar_id}
          onChangeText={(v) => updateFormData('apaar_id', v)}
          keyboardType="numeric"
          maxLength={12}
          editable={!apaarVerified}
          accessibilityLabel="APAAR ID input"
          accessibilityHint="Enter your 12-digit APAAR identification number"
        />
      </View>

      {apaarVerified ? (
        <View
          style={[
            styles.verifiedBadge,
            { backgroundColor: withAlpha(colors.success, isDark ? 0.15 : 0.1) },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[styles.verifiedText, { color: colors.success }]}>
            APAAR ID Verified Successfully
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.verifyButton,
            {
              backgroundColor: isDark
                ? withAlpha(colors.primary, 0.15)
                : colors.primary,
              borderColor: colors.primary,
            },
          ]}
          onPress={verifyApaarId}
          disabled={verifying || !formData.apaar_id}
          accessibilityRole="button"
          accessibilityLabel="Verify APAAR ID"
          accessibilityState={{ disabled: verifying || !formData.apaar_id }}
        >
          {verifying ? (
            <LoadingIndicator
              color={isDark ? colors.primary : colors.textInverse}
              size="small"
            />
          ) : (
            <>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={isDark ? colors.primary : colors.textInverse}
              />
              <Text
                style={[
                  styles.verifyButtonText,
                  { color: isDark ? colors.primary : colors.textInverse },
                ]}
              >
                Verify APAAR ID
              </Text>
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
          APAAR (Automated Permanent Academic Account Registry) is your unique educational ID.
          If you don't have one, contact your institution.
        </Text>
      </View>

      {apaarVerified && (
        <View style={styles.stepButtonContainer}>
          <SolidButton
            onPress={nextStep}
            style={[
              styles.stepButton,
              {
                backgroundColor: isDark
                  ? withAlpha(colors.primary, 0.15)
                  : colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.stepButtonText,
                { color: isDark ? colors.primary : colors.textInverse },
              ]}
            >
              Continue
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={isDark ? colors.primary : colors.textInverse}
            />
          </SolidButton>
        </View>
      )}
    </Animated.View>
  );
}
