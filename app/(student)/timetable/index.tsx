import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { withAlpha } from '../../../theme/colorUtils';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { useRouter } from 'expo-router';

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const d = new Date();
    let day = d.getDay();
    if (day === 0) day = 7;
    return day;
  });
  const [error, setError] = useState<string | null>(null);

  const fetchTimetableData = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear?.id) {
        setTimetableData([]);
        setError('No current academic year found.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('timetable_entries')
        .select(
          `
            id,
            day_of_week,
            period,
            start_time,
            end_time,
            room,
            is_break,
            courses:courses!timetable_entries_course_id_fkey(code, name, short_name)
          `
        )
        .eq('section_id', student.section_id)
        .eq('academic_year_id', academicYear.id)
        .eq('is_active', true)
        .order('day_of_week')
        .order('period');

      if (fetchError) throw fetchError;

      setTimetableData(data || []);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timetable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTimetableData();
  }, [fetchTimetableData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTimetableData();
  };

  const days = useMemo(
    () => [
      { id: 1, label: 'Mon' },
      { id: 2, label: 'Tue' },
      { id: 3, label: 'Wed' },
      { id: 4, label: 'Thu' },
      { id: 5, label: 'Fri' },
      { id: 6, label: 'Sat' },
      { id: 7, label: 'Sun' },
    ],
    []
  );

  const todayClasses = useMemo(
    () => timetableData.filter((entry: any) => entry.day_of_week === selectedDay),
    [selectedDay, timetableData]
  );

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <LoadingIndicator />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Timetable</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Day Selector */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.id}
                onPress={() => setSelectedDay(day.id)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: selectedDay === day.id ? colors.primary : withAlpha(colors.primary, 0.1),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    {
                      color: selectedDay === day.id ? colors.background : colors.primary,
                      fontWeight: selectedDay === day.id ? '700' : '600',
                    },
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Classes List */}
        {todayClasses.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              Classes Today
            </Text>
            <Card>
              {todayClasses.map((entry: any, index) => (
                <View key={entry.id} style={[styles.classItem, { borderBottomColor: colors.border }, index < todayClasses.length - 1 && { borderBottomWidth: 1 }]}>
                  <View style={[styles.periodBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.periodText, { color: colors.background }]}>P{entry.period}</Text>
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={[styles.courseName, { color: colors.textPrimary }]}>
                      {entry.is_break ? 'Break' : (entry.courses?.short_name || entry.courses?.name || 'Class')}
                    </Text>
                    <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
                      {entry.start_time}–{entry.end_time} • {entry.room || 'Room TBA'}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : (
          <Card style={{ marginTop: 20, alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.noClassText, { color: colors.textSecondary, marginTop: 12 }]}>
              No classes scheduled for this day
            </Text>
          </Card>
        )}

        {error && (
          <Card style={{ marginTop: 16, backgroundColor: withAlpha(colors.danger || '#ef4444', 0.1) }}>
            <Text style={{ color: colors.danger || '#ef4444', fontSize: 14 }}>{error}</Text>
          </Card>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  daySelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  dayButtonText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  periodBadge: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
  },
  classInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 12,
    marginBottom: 2,
  },
  teacher: {
    fontSize: 11,
  },
  noClassText: {
    fontSize: 14,
  },
});
