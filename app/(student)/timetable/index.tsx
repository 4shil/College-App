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

type TimetableRow = {
  id: string;
  day_of_week: number;
  period: number;
  start_time: string;
  end_time: string;
  room: string | null;
  is_break: boolean;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

type SubstitutionRow = {
  id: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  reason: string | null;
  timetable_entries: {
    id: string;
    period: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room: string | null;
    courses?: { code: string; name: string; short_name: string | null } | null;
  };
};

function formatISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function statusTone(status: string) {
  if (status === 'approved') return 'success' as const;
  if (status === 'pending') return 'warning' as const;
  if (status === 'rejected') return 'error' as const;
  return 'muted' as const;
}

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetableData, setTimetableData] = useState<TimetableRow[]>([]);
  const [substitutions, setSubstitutions] = useState<SubstitutionRow[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const d = new Date();
    let day = d.getDay();
    if (day === 0) day = 7;
    return day;
  });
  const [view, setView] = useState<'day' | 'week' | 'subs'>('day');
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

      if (!student.section_id) {
        setTimetableData([]);
        setSubstitutions([]);
        setError('Section not assigned for this student.');
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
        .eq('academic_year_id', student.academic_year_id)
        .eq('is_active', true)
        .order('day_of_week')
        .order('period');

      if (fetchError) throw fetchError;

      setTimetableData((data || []) as any);

      // Load substitutions for the current week.
      const now = new Date();
      const jsDay = now.getDay();
      const mondayOffset = ((jsDay + 6) % 7); // 0 on Monday
      const start = new Date(now);
      start.setDate(now.getDate() - mondayOffset);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const { data: subs, error: subsError } = await supabase
        .from('substitutions')
        .select(
          `
            id,
            date,
            status,
            reason,
            timetable_entries!inner(
              id,
              period,
              day_of_week,
              start_time,
              end_time,
              room,
              courses:courses!timetable_entries_course_id_fkey(code, name, short_name)
            )
          `
        )
        .gte('date', formatISODate(start))
        .lte('date', formatISODate(end))
        .eq('status', 'approved')
        .eq('timetable_entries.section_id', student.section_id)
        .eq('timetable_entries.academic_year_id', student.academic_year_id)
        .order('date', { ascending: false });

      if (subsError) {
        console.log('Substitutions error:', subsError.message);
        setSubstitutions([]);
      } else {
        setSubstitutions((subs || []) as any);
      }
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
    () => timetableData.filter((entry) => entry.day_of_week === selectedDay),
    [selectedDay, timetableData]
  );

  const groupedWeek = useMemo(() => {
    const map = new Map<number, TimetableRow[]>();
    for (const row of timetableData) {
      const list = map.get(row.day_of_week) || [];
      list.push(row);
      map.set(row.day_of_week, list);
    }
    // Ensure stable ordering.
    for (const [k, v] of map) {
      map.set(k, [...v].sort((a, b) => a.period - b.period));
    }
    return map;
  }, [timetableData]);

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, justifyContent: 'center', alignItems: 'center' }]}>
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

        {/* View Tabs */}
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.viewTabsRow}>
            {([
              { id: 'day', label: 'Day' },
              { id: 'week', label: 'Week' },
              { id: 'subs', label: 'Substitutions' },
            ] as const).map((t) => {
              const active = view === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setView(t.id)}
                  style={[
                    styles.viewTab,
                    {
                      backgroundColor: active
                        ? withAlpha(colors.primary, isDark ? 0.18 : 0.12)
                        : withAlpha(colors.cardBackground, isDark ? 0.18 : 0.08),
                      borderColor: active ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.viewTabText, { color: active ? colors.primary : colors.textSecondary }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {view === 'day' && (
          <>
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
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>
                  Classes
                </Text>
                <Card>
                  {todayClasses.map((entry, index) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.classItem,
                        { borderBottomColor: colors.cardBorder },
                        index < todayClasses.length - 1 && { borderBottomWidth: 1 },
                      ]}
                    >
                      <View style={[styles.periodBadge, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.periodText, { color: colors.background }]}>P{entry.period}</Text>
                      </View>
                      <View style={styles.classInfo}>
                        <Text style={[styles.courseName, { color: colors.textPrimary }]}>
                          {entry.is_break
                            ? 'Break'
                            : entry.courses?.short_name || entry.courses?.name || 'Class'}
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
              <Card style={{ marginTop: 8, alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.noClassText, { color: colors.textSecondary, marginTop: 12 }]}>
                  No classes scheduled for this day
                </Text>
              </Card>
            )}
          </>
        )}

        {view === 'week' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>Weekly Timetable</Text>
            {days.map((day) => {
              const rows = groupedWeek.get(day.id) || [];
              if (rows.length === 0) return null;
              return (
                <Card key={day.id} style={{ marginTop: 12 }}>
                  <Text style={[styles.weekDayTitle, { color: colors.textPrimary }]}>{day.label}</Text>
                  <View style={{ marginTop: 8 }}>
                    {rows.map((entry, index) => (
                      <View
                        key={entry.id}
                        style={[
                          styles.classItem,
                          { borderBottomColor: colors.cardBorder },
                          index < rows.length - 1 && { borderBottomWidth: 1 },
                        ]}
                      >
                        <View style={[styles.periodBadge, { backgroundColor: colors.primary }]}>
                          <Text style={[styles.periodText, { color: colors.background }]}>P{entry.period}</Text>
                        </View>
                        <View style={styles.classInfo}>
                          <Text style={[styles.courseName, { color: colors.textPrimary }]}>
                            {entry.is_break
                              ? 'Break'
                              : entry.courses?.short_name || entry.courses?.name || 'Class'}
                          </Text>
                          <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
                            {entry.start_time}–{entry.end_time} • {entry.room || 'Room TBA'}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            })}
            {timetableData.length === 0 && (
              <Card style={{ marginTop: 8, alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.noClassText, { color: colors.textSecondary, marginTop: 12 }]}>
                  No timetable data
                </Text>
              </Card>
            )}
          </>
        )}

        {view === 'subs' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>Substitutions</Text>
            <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
              Shows approved substitutions for this week
            </Text>

            {substitutions.length === 0 ? (
              <Card style={{ marginTop: 8, alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="swap-horizontal-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.noClassText, { color: colors.textSecondary, marginTop: 12 }]}>
                  No substitutions found
                </Text>
              </Card>
            ) : (
              <Card style={{ marginTop: 12 }}>
                {substitutions.map((s, index) => {
                  const tone = statusTone(s.status);
                  const accent =
                    tone === 'success'
                      ? colors.success
                      : tone === 'warning'
                        ? colors.warning
                        : tone === 'error'
                          ? colors.error
                          : colors.textMuted;

                  const entry = s.timetable_entries;
                  const courseLabel =
                    entry?.courses?.short_name || entry?.courses?.code || entry?.courses?.name || 'Class';
                  const time = `${String(entry?.start_time || '').slice(0, 5)}–${String(entry?.end_time || '').slice(0, 5)}`;

                  return (
                    <View
                      key={s.id}
                      style={[
                        styles.subRow,
                        { borderBottomColor: colors.cardBorder },
                        index < substitutions.length - 1 && { borderBottomWidth: 1 },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.subTitle, { color: colors.textPrimary }]}>
                            {s.date} • P{entry?.period} • {courseLabel}
                          </Text>
                          <View
                            style={[
                              styles.chip,
                              {
                                backgroundColor: withAlpha(accent, isDark ? 0.22 : 0.12),
                                borderColor: withAlpha(accent, 0.35),
                              },
                            ]}
                          >
                            <Text style={[styles.chipText, { color: accent }]}>{String(s.status)}</Text>
                          </View>
                        </View>
                        <Text style={[styles.subMeta, { color: colors.textSecondary }]}>
                          {time} • {entry?.room || 'Room TBA'}
                        </Text>
                        {!!s.reason && (
                          <Text style={[styles.subMeta, { color: colors.textMuted, marginTop: 6 }]} numberOfLines={3}>
                            Reason: {s.reason}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}
          </>
        )}

        {error && (
          <Card style={{ marginTop: 16, backgroundColor: withAlpha(colors.error, 0.12) }}>
            <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
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
  viewTabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewTab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewTabText: {
    fontSize: 13,
    fontWeight: '800',
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
  sectionSub: {
    fontSize: 12,
    marginTop: -6,
  },
  weekDayTitle: {
    fontSize: 14,
    fontWeight: '800',
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
  subRow: {
    paddingVertical: 12,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  subMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
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
