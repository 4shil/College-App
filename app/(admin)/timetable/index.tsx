import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');

// Period timings for JPM College
const PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35', duration: 55 },
  { period: 2, start: '10:50', end: '11:40', duration: 50 },
  { period: 3, start: '11:50', end: '12:45', duration: 55 },
  { period: 4, start: '13:25', end: '14:15', duration: 50 },
  { period: 5, start: '14:20', end: '15:10', duration: 50 },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface DegreeProgram {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  department_id: string;
  departments: { name: string; code: string };
}

interface Year {
  id: string;
  year_number: number;
  name: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period: number;
  course_id: string | null;
  programme_id?: string | null;
  year_id?: string | null;
  teacher_id: string | null;
  room: string | null;
  is_lab: boolean;
  courses?: { code: string; short_name: string; name: string };
  teachers?: { profiles: { full_name: string } };
}

interface TimetableSummary {
  course_id: string;
  year_id: string;
  course: DegreeProgram;
  year: Year;
  entry_count: number;
  last_updated: string;
}

interface Substitution {
  id: string;
  date: string;
  period: number;
  original_teacher_id: string;
  substitute_teacher_id: string;
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [todaySubstitutions, setTodaySubstitutions] = useState<Substitution[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const fetchInitialData = useCallback(async () => {
    try {
      const [coursesRes, yearsRes] = await Promise.all([
        supabase.from('courses').select('id, name, code, short_name, department_id, departments(name, code)').not('program_type', 'is', null).eq('is_active', true).order('code'),
        supabase.from('years').select('id, year_number, name').order('year_number'),
      ]);

      setDegreePrograms(coursesRes.data || []);
      // Filter out 4th year (optional) - show only 1-3 by default
      const filteredYears = ((yearsRes.data || []) as Array<{ year_number: number; id: string; name: string }>).filter(y => y.year_number <= 3);
      setYears(filteredYears);

      // Auto-select first course and year
      if (coursesRes.data && coursesRes.data.length > 0) {
        setSelectedCourse(coursesRes.data[0].id);
      }
      if (filteredYears.length > 0) {
        setSelectedYear(filteredYears[0].id);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  }, []);

  const fetchTimetable = useCallback(async () => {
    if (!selectedCourse || !selectedYear) return;

    try {
      // Get current academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear) return;

      // Fetch timetable entries for a degree programme + year
      const { data, error } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          day_of_week,
          period,
          course_id,
          programme_id,
          year_id,
          teacher_id,
          room,
          is_lab,
          courses:courses!timetable_entries_course_id_fkey(code, short_name, name),
          teachers(id, profiles(full_name))
        `)
        .eq('programme_id', selectedCourse)
        .eq('year_id', selectedYear)
        .eq('academic_year_id', academicYear.id)
        .eq('is_active', true)
        .order('day_of_week')
        .order('period');

      if (error) {
        console.log('Timetable query error:', error.message);
        setTimetableEntries([]);
        return;
      }

      setTimetableEntries(data || []);

      // Fetch today's substitutions for this timetable
      const today = new Date().toISOString().split('T')[0];
      const entryIds = (data as Array<{ id: string }> | undefined)?.map(e => e.id) || [];
      
      if (entryIds.length > 0) {
        const { data: subs } = await supabase
          .from('substitutions')
          .select('id, date, period, original_teacher_id, substitute_teacher_id')
          .eq('date', today)
          .in('timetable_entry_id', entryIds);
        
        setTodaySubstitutions(subs || []);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setTimetableEntries([]);
    }
  }, [selectedCourse, selectedYear]);

  useEffect(() => {
    setLoading(true);
    fetchInitialData().finally(() => setLoading(false));
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedCourse && selectedYear) {
      fetchTimetable();
    }
  }, [selectedCourse, selectedYear, fetchTimetable]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimetable();
    setRefreshing(false);
  };

  const getEntryForSlot = (day: number, period: number): TimetableEntry | undefined => {
    return timetableEntries.find(e => e.day_of_week === day && e.period === period);
  };

  const hasSubstitutionToday = (day: number, period: number): boolean => {
    // Only show substitution indicator if today matches the day
    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (todayDayOfWeek !== day) return false;
    
    return todaySubstitutions.some(s => s.period === period);
  };

  const handleEditTimetable = () => {
    if (selectedCourse && selectedYear) {
      router.push({
        pathname: '/(admin)/timetable/create',
        params: { courseId: selectedCourse, yearId: selectedYear },
      } as any);
    }
  };

  const renderGridView = () => (
    <View style={styles.gridContainer}>
      {/* Header Row - Days */}
      <View style={styles.gridRow}>
        <View style={[styles.gridHeaderCell, styles.timeCell, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.gridHeaderText, { color: colors.primary }]}>Time</Text>
        </View>
        {DAYS.map((day, index) => (
          <View 
            key={day} 
            style={[
              styles.gridHeaderCell, 
              { backgroundColor: colors.inputBackground }
            ]}
          >
            <Text style={[styles.gridHeaderText, { color: colors.primary }]}>{DAY_SHORT[index]}</Text>
          </View>
        ))}
      </View>

      {/* Period Rows */}
      {PERIOD_TIMINGS.map((timing) => (
        <View key={timing.period} style={styles.gridRow}>
          {/* Time Cell */}
          <View
            style={[
              styles.gridCell,
              styles.timeCell,
              { backgroundColor: colors.inputBackground },
            ]}
          >
            <Text style={[styles.periodNumber, { color: colors.primary }]}>P{timing.period}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{timing.start}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{timing.end}</Text>
          </View>

          {/* Day Cells */}
          {DAYS.map((_, dayIndex) => {
            const entry = getEntryForSlot(dayIndex + 1, timing.period);
            const isEmpty = !entry || !entry.course_id;
            const isLab = entry?.is_lab;
            const hasSub = hasSubstitutionToday(dayIndex + 1, timing.period);

            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.gridCell,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: isEmpty
                      ? colors.inputBorder
                      : hasSub
                        ? colors.warning
                        : isLab
                          ? colors.primary
                          : colors.success,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={handleEditTimetable}
                activeOpacity={0.7}
              >
                {!isEmpty ? (
                  <>
                    <Text 
                      style={[
                        styles.subjectCode, 
                        { color: hasSub ? colors.warning : isLab ? colors.primary : colors.success }
                      ]} 
                      numberOfLines={1}
                    >
                      {entry?.courses?.short_name || entry?.courses?.code}
                    </Text>
                    <Text 
                      style={[styles.teacherName, { color: colors.textMuted }]} 
                      numberOfLines={1}
                    >
                      {entry?.teachers?.profiles?.full_name?.split(' ')[0] || '-'}
                    </Text>
                    {entry?.room && (
                      <Text style={[styles.roomText, { color: colors.textMuted }]}>
                        {entry.room}
                      </Text>
                    )}
                    {hasSub && (
                      <View
                        style={[
                          styles.labBadge,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.warning,
                            borderWidth: colors.borderWidth,
                            borderRadius: 8,
                            padding: 3,
                          },
                        ]}
                      >
                        <FontAwesome5 name="exchange-alt" size={8} color={colors.warning} />
                      </View>
                    )}
                    {isLab && !hasSub && (
                      <View style={styles.labBadge}>
                        <FontAwesome5 name="flask" size={8} color={colors.primary} />
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>-</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="calendar-alt" size={64} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Timetable</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        {selectedCourse && selectedYear
          ? 'Timetable has not been created for this class yet'
          : 'Select a course and year to view timetable'}
      </Text>
      {selectedCourse && selectedYear && (
        <SolidButton
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={handleEditTimetable}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
          <Text style={[styles.createBtnText, { color: colors.textInverse }]}>Create Timetable</Text>
        </SolidButton>
      )}
    </View>
  );

  const selectedCourseData = degreePrograms.find(p => p.id === selectedCourse);
  const selectedYearData = years.find(y => y.id === selectedYear);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Timetable</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage class schedules
            </Text>
          </View>
          {selectedCourse && selectedYear && timetableEntries.length > 0 && (
            <SolidButton
              style={[styles.editBtn, { backgroundColor: colors.primary }]}
              onPress={handleEditTimetable}
            >
              <FontAwesome5 name="edit" size={14} color={colors.textInverse} />
            </SolidButton>
          )}
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filtersContainer}>
          {/* Course Picker */}
          <View
            style={[
              styles.pickerWrapper,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <FontAwesome5 name="graduation-cap" size={14} color={colors.textMuted} style={styles.pickerIcon} />
            <Picker
              selectedValue={selectedCourse}
              onValueChange={setSelectedCourse}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textMuted}
            >
              <Picker.Item label="Select Course" value="" />
              {degreePrograms.map(course => (
                <Picker.Item 
                  key={course.id} 
                  label={`${course.code} - ${course.short_name || course.name}`} 
                  value={course.id} 
                />
              ))}
            </Picker>
          </View>

          {/* Year Picker */}
          <View
            style={[
              styles.pickerWrapper,
              styles.yearPicker,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              },
            ]}
          >
            <Picker
              selectedValue={selectedYear}
              onValueChange={setSelectedYear}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textMuted}
            >
              <Picker.Item label="Year" value="" />
              {years.map(year => (
                <Picker.Item key={year.id} label={year.name} value={year.id} />
              ))}
            </Picker>
          </View>
        </Animated.View>

        {/* Selected Info */}
        {selectedCourseData && selectedYearData && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.selectedInfo}>
            <View
              style={[
                styles.infoBadge,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <FontAwesome5 name="book" size={12} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.primary }]}>
                {selectedYearData.name} {selectedCourseData.code}
              </Text>
            </View>
            <Text style={[styles.deptText, { color: colors.textMuted }]}>
              {selectedCourseData.departments?.name}
            </Text>
          </Animated.View>
        )}

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          horizontal={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading timetable...</Text>
            </View>
          ) : timetableEntries.length > 0 ? (
            <Animated.View entering={FadeInRight.delay(250).duration(400)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {renderGridView()}
              </ScrollView>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Theory</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Lab</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>Substitution</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.warning,
                    },
                  ]}
                  onPress={() => router.push('/(admin)/timetable/substitutions' as any)}
                >
                  <FontAwesome5 name="exchange-alt" size={16} color={colors.warning} />
                  <Text style={[styles.quickActionText, { color: colors.warning }]}>Substitutions</Text>
                  {todaySubstitutions.length > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                      <Text style={[styles.badgeText, { color: colors.textInverse }]}>{todaySubstitutions.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickActionBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => router.push('/(admin)/timetable/reports' as any)}
                >
                  <FontAwesome5 name="chart-bar" size={16} color={colors.primary} />
                  <Text style={[styles.quickActionText, { color: colors.primary }]}>Reports</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16 
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  pickerWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  yearPicker: {
    flex: 0.35,
    minWidth: 100,
  },
  pickerIcon: {
    marginLeft: 14,
  },
  picker: {
    flex: 1,
    height: 52,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deptText: {
    fontSize: 12,
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Grid Styles
  gridContainer: {
    minWidth: width - 40,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridHeaderCell: {
    width: 66,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  gridHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridCell: {
    width: 66,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    padding: 6,
    position: 'relative',
  },
  timeCell: {
    width: 54,
    height: 76,
  },
  periodNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 9,
    marginTop: 2,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  teacherName: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  roomText: {
    fontSize: 8,
    marginTop: 1,
  },
  labBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  emptyText: {
    fontSize: 14,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 10,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subBadge: { backgroundColor: 'transparent' },
});
