import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type CourseOption = {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
};

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateOnlyISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateOnlyISO(value: string): Date | null {
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [yy, mm, dd] = v.split('-').map(Number);
  const dt = new Date(yy, mm - 1, dd);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export default function TeacherCreatePlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState<string>('');

  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date();
    // Default to today (can be adjusted)
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [weekStartText, setWeekStartText] = useState(() => toDateOnlyISO(weekStart));

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const [summaryTopic, setSummaryTopic] = useState('');

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchCourseOptions = useCallback(async (tId: string) => {
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (!academicYear?.id) return [];

    const { data, error } = await supabase
      .from('timetable_entries')
      .select('course_id, courses:courses!timetable_entries_course_id_fkey(id, code, name, short_name)')
      .eq('teacher_id', tId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true);

    if (error) {
      console.log('Teacher planner course options error:', error.message);
      return [];
    }

    const map = new Map<string, CourseOption>();
    (data || []).forEach((row: any) => {
      if (!row?.course_id || !row?.courses) return;
      if (!map.has(row.course_id)) {
        map.set(row.course_id, {
          id: row.courses.id,
          code: row.courses.code,
          name: row.courses.name,
          short_name: row.courses.short_name,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);

      if (tId) {
        const opts = await fetchCourseOptions(tId);
        setCourseOptions(opts);
        if (opts.length > 0) setCourseId(opts[0].id);
      }

      setLoading(false);
    };
    init();
  }, [fetchCourseOptions, fetchTeacherId]);

  useEffect(() => {
    setWeekStartText(toDateOnlyISO(weekStart));
  }, [weekStart]);

  const selectedCourseLabel = useMemo(() => {
    const c = courseOptions.find((o) => o.id === courseId);
    if (!c) return 'Select course';
    return `${c.short_name || c.code} • ${c.name}`;
  }, [courseId, courseOptions]);

  const canSave = useMemo(() => {
    return !!teacherId && !!courseId && summaryTopic.trim().length > 0 && !saving;
  }, [teacherId, courseId, summaryTopic, saving]);

  const pillStyle = (active: boolean) => ({
    backgroundColor: active
      ? withAlpha(colors.primary, isDark ? 0.28 : 0.14)
      : isDark
        ? withAlpha(colors.textInverse, 0.07)
        : withAlpha(colors.shadowColor, 0.05),
    borderColor: active ? withAlpha(colors.primary, 0.6) : withAlpha(colors.cardBorder, 0.55),
  });

  const save = async () => {
    if (!teacherId) {
      Alert.alert('Error', 'Teacher profile not found');
      return;
    }
    if (!courseId) {
      Alert.alert('Error', 'Select a course');
      return;
    }

    const start = Platform.OS === 'web' ? parseDateOnlyISO(weekStartText) : weekStart;
    if (!start) {
      Alert.alert('Error', 'Week start must be YYYY-MM-DD');
      return;
    }

    const end = addDays(start, 6);

    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (!academicYear?.id) {
      Alert.alert('Error', 'No current academic year found');
      return;
    }

    const plannedTopics = [
      {
        day: 1,
        topic: summaryTopic.trim(),
        objectives: null,
      },
    ];

    try {
      setSaving(true);

      const payload: any = {
        teacher_id: teacherId,
        course_id: courseId,
        section_id: null,
        academic_year_id: academicYear.id,
        week_start_date: toDateOnlyISO(start),
        week_end_date: toDateOnlyISO(end),
        planned_topics: plannedTopics,
        completed_topics: null,
        status: 'draft',
      };

      const { error } = await supabase.from('lesson_planners').insert(payload);
      if (error) {
        console.log('Create planner error:', error.message);
        Alert.alert('Error', 'Failed to create planner');
        return;
      }

      Alert.alert('Created', 'Planner draft created');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              style={[styles.backBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]}>Create Planner</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Draft → submit for approval</Text>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 18 }}>
            <Animated.View entering={FadeInDown.duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Course</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={2}>
                  {selectedCourseLabel}
                </Text>

                <View style={{ height: 10 }} />

                {courseOptions.length === 0 ? (
                  <Text style={[styles.helper, { color: colors.textMuted }]}>No assigned courses found (ask admin to assign timetable).</Text>
                ) : (
                  <View style={styles.courseList}>
                    {courseOptions.map((c) => {
                      const active = c.id === courseId;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => setCourseId(c.id)}
                          activeOpacity={0.85}
                          style={[styles.coursePill, pillStyle(active)]}
                        >
                          <Text style={[styles.coursePillText, { color: active ? colors.primary : colors.textMuted }]}>
                            {c.short_name || c.code}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(50).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Week</Text>
                <View style={{ height: 10 }} />

                {Platform.OS === 'web' ? (
                  <GlassInput
                    icon="calendar-outline"
                    placeholder="Week start (YYYY-MM-DD)"
                    value={weekStartText}
                    onChangeText={setWeekStartText}
                    autoCapitalize="none"
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowPicker(true)}
                      activeOpacity={0.85}
                      style={[styles.dateBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                    >
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                      <Text style={[styles.dateBtnText, { color: colors.primary }]}>
                        Start: {weekStart.toLocaleDateString()} • End: {weekEnd.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>

                    {showPicker ? (
                      <DateTimePicker
                        value={weekStart}
                        mode="date"
                        onChange={(e, selected) => {
                          setShowPicker(false);
                          if (selected) setWeekStart(selected);
                        }}
                      />
                    ) : null}
                  </>
                )}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Planned topics</Text>
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="create-outline"
                  placeholder="Weekly topic summary (required)"
                  value={summaryTopic}
                  onChangeText={setSummaryTopic}
                />
                <Text style={[styles.helper, { color: colors.textMuted }]}>
                  You can expand to day-wise topics later.
                </Text>
              </Card>
            </Animated.View>

            <View style={{ marginTop: 6 }}>
              <PrimaryButton title={saving ? 'Saving...' : 'Create Draft'} onPress={save} disabled={!canSave} />
            </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    marginTop: 8,
    fontSize: 13,
  },
  courseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coursePill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  coursePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
