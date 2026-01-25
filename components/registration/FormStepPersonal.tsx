/**
 * FormStepPersonal - Step 2: Personal Information
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';
import { GlassInput } from '@/components/ui/GlassInput';
import { SolidButton } from '@/components/ui/SolidButton';
import { FormData } from './types';
import { registrationStyles as styles } from './styles';

interface FormStepPersonalProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  showDatePicker: boolean;
  setShowDatePicker: (show: boolean) => void;
  nextStep: () => void;
}

export function FormStepPersonal({
  formData,
  updateFormData,
  showDatePicker,
  setShowDatePicker,
  nextStep,
}: FormStepPersonalProps) {
  const { colors, isDark } = useThemeStore();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'web') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      updateFormData('dob', selectedDate);
    }
  };

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
        Tell us about yourself
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
          accessibilityLabel="Full name input"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Email Address *
        </Text>
        <GlassInput
          icon="mail-outline"
          placeholder="Enter your email"
          value={formData.email}
          onChangeText={(v) => updateFormData('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email address input"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Phone Number *
        </Text>
        <GlassInput
          icon="call-outline"
          placeholder="10-digit phone number"
          value={formData.phone}
          onChangeText={(v) => updateFormData('phone', v)}
          keyboardType="phone-pad"
          maxLength={10}
          accessibilityLabel="Phone number input"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Date of Birth *
        </Text>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={formData.dob.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value);
              if (!isNaN(newDate.getTime())) {
                updateFormData('dob', newDate);
              }
            }}
            style={{
              padding: 14,
              borderRadius: 12,
              border: `1px solid ${colors.glassBorder}`,
              backgroundColor: isDark
                ? withAlpha(colors.textInverse, 0.05)
                : withAlpha(colors.shadowColor, 0.02),
              color: colors.textPrimary,
              fontSize: 15,
              width: '100%',
            }}
            aria-label="Date of birth"
          />
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: isDark
                    ? withAlpha(colors.textInverse, 0.05)
                    : withAlpha(colors.shadowColor, 0.02),
                  borderColor: colors.glassBorder,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel={`Date of birth: ${formatDate(formData.dob)}. Tap to change.`}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {formatDate(formData.dob)}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={formData.dob}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1980, 0, 1)}
              />
            )}
          </>
        )}
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
                      ? isDark
                        ? withAlpha(colors.primary, 0.15)
                        : withAlpha(colors.primary, 0.1)
                      : isDark
                      ? withAlpha(colors.textInverse, 0.05)
                      : withAlpha(colors.shadowColor, 0.02),
                  borderColor:
                    formData.gender === g ? colors.primary : colors.glassBorder,
                },
              ]}
              onPress={() => updateFormData('gender', g)}
              accessibilityRole="radio"
              accessibilityState={{ selected: formData.gender === g }}
              accessibilityLabel={`Gender: ${g}`}
            >
              <Text
                style={[
                  styles.genderText,
                  {
                    color:
                      formData.gender === g
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    </Animated.View>
  );
}
