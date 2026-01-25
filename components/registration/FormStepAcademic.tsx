/**
 * FormStepAcademic - Step 3: Academic Information
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';
import { withAlpha } from '@/theme/colorUtils';
import { GlassInput } from '@/components/ui/GlassInput';
import { SolidButton } from '@/components/ui/SolidButton';
import { FormData, DegreeProgram, ProgramType } from './types';
import { registrationStyles as styles } from './styles';

interface FormStepAcademicProps {
  formData: FormData;
  updateFormData: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  programs: DegreeProgram[];
  programType: ProgramType;
  setProgramType: (type: ProgramType) => void;
  selectedProgram: DegreeProgram | null;
  setSelectedProgram: (program: DegreeProgram | null) => void;
  nextStep: () => void;
}

export function FormStepAcademic({
  formData,
  updateFormData,
  programs,
  programType,
  setProgramType,
  selectedProgram,
  setSelectedProgram,
  nextStep,
}: FormStepAcademicProps) {
  const { colors, isDark } = useThemeStore();

  // Filter programs by type
  const filteredPrograms = programs.filter((p) => p.program_type === programType);

  // Get max year based on program duration
  const maxYear = selectedProgram?.duration_years || 4;

  // Calculate max semester based on year and program
  const maxSemester = Math.min(formData.year * 2, (selectedProgram?.duration_years || 4) * 2);

  const handleProgramSelect = (program: DegreeProgram) => {
    setSelectedProgram(program);
    updateFormData('program_id', program.id);
    
    // Reset year/semester if they exceed new program limits
    if (formData.year > program.duration_years) {
      updateFormData('year', 1);
      updateFormData('semester', 1);
    }
  };

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
        Select your program and academic details
      </Text>

      {/* Program Type Selection */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Program Type *
        </Text>
        <View style={styles.programTypeButtons}>
          {(['ug', 'pg'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.programTypeButton,
                {
                  backgroundColor:
                    programType === type
                      ? isDark
                        ? withAlpha(colors.primary, 0.15)
                        : withAlpha(colors.primary, 0.1)
                      : isDark
                      ? withAlpha(colors.textInverse, 0.05)
                      : withAlpha(colors.shadowColor, 0.02),
                  borderColor:
                    programType === type ? colors.primary : colors.glassBorder,
                },
              ]}
              onPress={() => {
                setProgramType(type);
                // Clear selection when switching types
                setSelectedProgram(null);
                updateFormData('program_id', '');
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: programType === type }}
              accessibilityLabel={type === 'ug' ? 'Undergraduate' : 'Postgraduate'}
            >
              <Ionicons
                name={type === 'ug' ? 'school-outline' : 'library-outline'}
                size={18}
                color={programType === type ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.programTypeText,
                  {
                    color:
                      programType === type ? colors.primary : colors.textSecondary,
                  },
                ]}
              >
                {type === 'ug' ? 'Undergraduate' : 'Postgraduate'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Program Selection */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Select Program *
        </Text>
        {filteredPrograms.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.programScrollContainer}
            contentContainerStyle={styles.programScrollContent}
          >
            {filteredPrograms.map((program) => (
              <TouchableOpacity
                key={program.id}
                style={[
                  styles.programChip,
                  {
                    backgroundColor:
                      formData.program_id === program.id
                        ? colors.primary
                        : isDark
                        ? withAlpha(colors.textInverse, 0.05)
                        : withAlpha(colors.shadowColor, 0.02),
                    borderColor:
                      formData.program_id === program.id
                        ? colors.primary
                        : colors.glassBorder,
                  },
                ]}
                onPress={() => handleProgramSelect(program)}
                accessibilityRole="radio"
                accessibilityState={{ selected: formData.program_id === program.id }}
                accessibilityLabel={`${program.name} (${program.short_name})`}
              >
                <Text
                  style={[
                    styles.programChipText,
                    {
                      color:
                        formData.program_id === program.id
                          ? colors.textInverse
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {program.short_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.noProgramsText, { color: colors.textMuted }]}>
            No {programType === 'ug' ? 'undergraduate' : 'postgraduate'} programs available
          </Text>
        )}
        {selectedProgram && (
          <Text style={[styles.selectedProgram, { color: colors.textMuted }]}>
            Selected: {selectedProgram.name} ({selectedProgram.duration_years} years)
          </Text>
        )}
      </View>

      {/* Year and Semester Selection */}
      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Year *
          </Text>
          <View style={styles.numberSelector}>
            {Array.from({ length: maxYear }, (_, i) => i + 1).map((y) => (
              <TouchableOpacity
                key={y}
                style={[
                  styles.numberButton,
                  {
                    backgroundColor:
                      formData.year === y
                        ? colors.primary
                        : isDark
                        ? withAlpha(colors.textInverse, 0.05)
                        : withAlpha(colors.shadowColor, 0.02),
                    borderColor:
                      formData.year === y ? colors.primary : colors.glassBorder,
                  },
                ]}
                onPress={() => {
                  updateFormData('year', y);
                  // Reset semester if it exceeds new max
                  if (formData.semester > y * 2) {
                    updateFormData('semester', 1);
                  }
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: formData.year === y }}
                accessibilityLabel={`Year ${y}`}
              >
                <Text
                  style={{
                    color:
                      formData.year === y
                        ? colors.textInverse
                        : colors.textMuted,
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
            {Array.from({ length: Math.min(2, maxSemester) }, (_, i) => {
              const s = (formData.year - 1) * 2 + i + 1;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.numberButton,
                    {
                      backgroundColor:
                        formData.semester === s
                          ? colors.primary
                          : isDark
                          ? withAlpha(colors.textInverse, 0.05)
                          : withAlpha(colors.shadowColor, 0.02),
                      borderColor:
                        formData.semester === s
                          ? colors.primary
                          : colors.glassBorder,
                    },
                  ]}
                  onPress={() => updateFormData('semester', s)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: formData.semester === s }}
                  accessibilityLabel={`Semester ${s}`}
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
              );
            })}
          </View>
        </View>
      </View>

      {/* Roll Number */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Roll Number *
        </Text>
        <GlassInput
          icon="document-text-outline"
          placeholder="Enter your roll number"
          value={formData.roll_number}
          onChangeText={(v) => updateFormData('roll_number', v)}
          accessibilityLabel="Roll number input"
        />
      </View>

      {/* Admission Number */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Admission Number *
        </Text>
        <GlassInput
          icon="id-card-outline"
          placeholder="Enter your admission number"
          value={formData.admission_no}
          onChangeText={(v) => updateFormData('admission_no', v)}
          accessibilityLabel="Admission number input"
        />
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
