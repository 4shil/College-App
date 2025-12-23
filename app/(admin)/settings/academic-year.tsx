import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AnimatedBackground, GlassCard, PrimaryButton, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export default function AcademicYearScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [years, setYears] = useState<AcademicYear[]>([]);
  
  // Form state
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.log('Table might not exist yet');
        setYears([]);
        return;
      }
      setYears(data || []);
    } catch (error: any) {
      console.error('Error fetching years:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async () => {
    if (!yearName.trim()) {
      Alert.alert('Error', 'Please enter year name (e.g., 2024-2025)');
      return;
    }

    if (endDate <= startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('academic_years').insert({
        year_name: yearName.trim(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_current: years.length === 0, // First year is current by default
      });

      if (error) throw error;

      Alert.alert('Success', 'Academic year created successfully');
      setYearName('');
      setStartDate(new Date());
      setEndDate(new Date());
      await fetchAcademicYears();
    } catch (error: any) {
      console.error('Error creating year:', error.message);
      Alert.alert('Error', 'Failed to create academic year');
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrent = async (yearId: string) => {
    Alert.alert(
      'Set Current Year',
      'This will update the active academic year. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // First, set all years to not current
              await supabase
                .from('academic_years')
                .update({ is_current: false })
                .neq('id', '00000000-0000-0000-0000-000000000000');

              // Then set selected year as current
              const { error } = await supabase
                .from('academic_years')
                .update({ is_current: true })
                .eq('id', yearId);

              if (error) throw error;

              Alert.alert('Success', 'Current academic year updated');
              await fetchAcademicYears();
            } catch (error: any) {
              console.error('Error setting current year:', error.message);
              Alert.alert('Error', 'Failed to update current year');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (yearId: string) => {
    Alert.alert(
      'Delete Academic Year',
      'This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('academic_years')
                .delete()
                .eq('id', yearId);

              if (error) throw error;

              Alert.alert('Success', 'Academic year deleted');
              await fetchAcademicYears();
            } catch (error: any) {
              console.error('Error deleting year:', error.message);
              Alert.alert('Error', 'Failed to delete academic year');
            }
          },
        },
      ]
    );
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Academic Year</Text>
        </View>

        {/* Create New Year Form */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassCard style={styles.formCard}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Create New Academic Year</Text>
            
            <Text style={[styles.label, { color: colors.textSecondary }]}>Year Name</Text>
            <TextInput
              style={[styles.input, { 
                color: colors.textPrimary,
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              }]}
              placeholder="e.g., 2024-2025"
              placeholderTextColor={colors.textMuted}
              value={yearName}
              onChangeText={setYearName}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Start Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              }]}
              onPress={() => setShowStartPicker(true)}
            >
              <FontAwesome5 name="calendar" size={16} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}

            <Text style={[styles.label, { color: colors.textSecondary }]}>End Date</Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              }]}
              onPress={() => setShowEndPicker(true)}
            >
              <FontAwesome5 name="calendar" size={16} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}

            <PrimaryButton
              title={saving ? "Creating..." : "Create Academic Year"}
              onPress={handleCreateYear}
              disabled={saving}
              style={{ marginTop: 16 }}
            />
          </GlassCard>
        </Animated.View>

        {/* Existing Years List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Existing Academic Years</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingIndicator size="large" color={colors.primary} />
          </View>
        ) : years.length > 0 ? (
          years.map((year, index) => (
            <Animated.View key={year.id} entering={FadeInDown.delay(200 + index * 50).springify()}>
              <GlassCard style={styles.yearCard}>
                <View style={styles.yearHeader}>
                  <View style={styles.yearInfo}>
                    <Text style={[styles.yearName, { color: colors.textPrimary }]}>
                      {year.year_name}
                    </Text>
                    {year.is_current && (
                      <View style={[styles.currentBadge, { 
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.primary,
                        borderWidth: colors.borderWidth,
                      }]}>
                        <Text style={[styles.currentText, { color: colors.primary }]}>Current</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(year.id)}>
                    <FontAwesome5 name="trash" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.yearDates}>
                  <View style={styles.dateRow}>
                    <FontAwesome5 name="calendar-alt" size={14} color={colors.textSecondary} />
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                      {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {!year.is_current && (
                  <PrimaryButton
                    title="Set as Current"
                    onPress={() => handleSetCurrent(year.id)}
                    style={{ marginTop: 12 }}
                  />
                )}
              </GlassCard>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="calendar-times" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No academic years created yet
            </Text>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  formCard: {
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dateButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  yearCard: {
    padding: 16,
    marginBottom: 12,
  },
  yearHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  yearInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  yearDates: {
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
