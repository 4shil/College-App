import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

const PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35' },
  { period: 2, start: '10:50', end: '11:40' },
  { period: 3, start: '11:50', end: '12:45' },
  { period: 4, start: '13:25', end: '14:15' },
  { period: 5, start: '14:20', end: '15:10' },
];

const DAYS = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
];

type TimetableEntry = {
  id: string;
  day_of_week: number;
  period: number;
  course_id: string | null;
  year_id: string | null;
  room: string | null;
  is_lab?: boolean | null;
  courses?: { code: string; name: string; short_name: string | null } | null;
  years?: { name: string } | null;
};

export default function TeacherTimetableScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);

  const todayDayOfWeek = useMemo(() => {
    const d = new Date();
    let day = d.getDay();
    if (day === 0) day = 7;
    return day;
  }, []);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchTimetable = useCallback(async () => {
    if (!teacherId) return;

    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (!academicYear?.id) {
      setEntries([]);
      return;
    }

    const { data, error } = await supabase
      .from('timetable_entries')
      .select(
        `
          id,
          day_of_week,
          period,
          course_id,
          year_id,
          room,
          is_lab,
          courses:courses!timetable_entries_course_id_fkey(code, name, short_name),
          years(name)
        `
      )
      .eq('teacher_id', teacherId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true)
      .order('day_of_week')
      .order('period');

    if (error) {
      console.log('Teacher timetable error:', error.message);
      setEntries([]);
      return;
    }

    setEntries((data || []) as TimetableEntry[]);
  }, [teacherId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      setLoading(false);
    };
    init();
  }, [fetchTeacherId]);

  useEffect(() => {
    if (!teacherId) return;
    fetchTimetable();
  }, [teacherId, fetchTimetable]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTimetable();
    setRefreshing(false);
  };

  const renderEntryCard = (entry: TimetableEntry, index: number) => {
    const timing = PERIOD_TIMINGS.find((t) => t.period === entry.period);
    const isToday = entry.day_of_week === todayDayOfWeek;

    return (
      <Animated.View
        key={entry.id}
        entering={FadeInDown.delay(index * 50).duration(400)}
        style={{ marginBottom: 12 }}
      >
        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                P{entry.period} {timing ? `• ${timing.start}-${timing.end}` : ''}
              </Text>
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                {entry.courses?.name || 'Class'}
                {entry.years?.name ? ` • ${entry.years.name}` : ''}
              </Text>
              {entry.room ? (
                <Text style={[styles.meta, { color: colors.textMuted }]}>Room: {entry.room}</Text>
              ) : null}
            </View>

            <View
              style={[
                styles.pill,
                {
                  backgroundColor: isToday
                    ? withAlpha(colors.primary, isDark ? 0.25 : 0.12)
                    : isDark
                      ? withAlpha(colors.textInverse, 0.08)
                      : withAlpha(colors.shadowColor, 0.06),
                },
              ]}
            >
              <Text style={[styles.pillText, { color: isToday ? colors.primary : colors.textMuted }]}>
                {DAYS.find((d) => d.id === entry.day_of_week)?.label || `Day ${entry.day_of_week}`}
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}> 
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Timetable</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Your assigned periods</Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>
              Loading timetable...
            </Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {entries.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No timetable entries</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to assign timetable.</Text>
              </Card>
            ) : (
              entries.map(renderEntryCard)
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subTitle: {
    marginTop: 4,
    fontSize: 13,
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
});
