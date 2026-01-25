/**
 * Student Registration Screen
 * 
 * A 4-step registration wizard for new students.
 * Steps:
 * 1. APAAR ID Verification
 * 2. Personal Information
 * 3. Academic Information
 * 4. Password Creation
 * 
 * Refactored to use modular components for better maintainability.
 * See: components/registration/ for individual step components
 */

import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';
import {
  FormStepAPAAR,
  FormStepPersonal,
  FormStepAcademic,
  FormStepPassword,
  RegistrationStepIndicator,
  useRegistrationForm,
} from '@/components/registration';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  // Use the extracted registration form hook for all state and logic
  const {
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
    updateFormData,
    setProgramType,
    setSelectedProgram,
    setShowDatePicker,
    nextStep,
    verifyApaarId,
    handleSubmit,
  } = useRegistrationForm();

  // Render the current step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <FormStepAPAAR
            formData={formData}
            updateFormData={updateFormData}
            apaarVerified={apaarVerified}
            verifying={verifying}
            verifyApaarId={verifyApaarId}
            nextStep={nextStep}
          />
        );

      case 2:
        return (
          <FormStepPersonal
            formData={formData}
            updateFormData={updateFormData}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            nextStep={nextStep}
          />
        );

      case 3:
        return (
          <FormStepAcademic
            formData={formData}
            updateFormData={updateFormData}
            programs={programs}
            programType={programType}
            setProgramType={setProgramType}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            nextStep={nextStep}
          />
        );

      case 4:
        return (
          <FormStepPassword
            formData={formData}
            updateFormData={updateFormData}
            selectedProgram={selectedProgram}
            loading={loading}
            handleSubmit={handleSubmit}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            style={styles.contentContainer}
          >
            {/* Step Indicator */}
            <RegistrationStepIndicator currentStep={step} />

            {/* Step Content */}
            {renderStepContent()}

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeInDown.duration(200)}
                style={[
                  styles.errorContainer,
                  { backgroundColor: withAlpha(colors.error, 0.1) },
                ]}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </Animated.View>
            )}
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
    paddingHorizontal: 20,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
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
});
