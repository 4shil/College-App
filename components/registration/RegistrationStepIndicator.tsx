/**
 * Registration Step Indicator Component
 * Shows progress through the 4-step registration wizard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';
import { TOTAL_STEPS } from './types';

interface RegistrationStepIndicatorProps {
  currentStep: number;
}

export function RegistrationStepIndicator({ currentStep }: RegistrationStepIndicatorProps) {
  const { colors, isDark } = useThemeStore();

  return (
    <View style={styles.stepIndicator}>
      <View style={styles.stepRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <React.Fragment key={stepNum}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isCompleted
                      ? colors.success
                      : isCurrent
                      ? colors.primary
                      : isDark
                      ? withAlpha(colors.textInverse, 0.1)
                      : withAlpha(colors.shadowColor, 0.05),
                    borderColor: isCompleted
                      ? colors.success
                      : isCurrent
                      ? colors.primary
                      : colors.glassBorder,
                  },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      {
                        color: isCurrent ? colors.textInverse : colors.textMuted,
                      },
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              {stepNum < TOTAL_STEPS && (
                <View
                  style={[
                    styles.stepLine,
                    {
                      backgroundColor: isCompleted
                        ? colors.success
                        : isDark
                        ? withAlpha(colors.textInverse, 0.1)
                        : withAlpha(colors.shadowColor, 0.1),
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
