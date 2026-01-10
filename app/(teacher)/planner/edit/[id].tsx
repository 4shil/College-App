import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { useAuthStore } from '../../../../store/authStore';
import { supabase } from '../../../../lib/supabase';
import { withAlpha } from '../../../../theme/colorUtils';

type PlannerStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type PlannedTopic = {
  day?: number;
  topic?: string;
  objectives?: string | null;
  methods?: string | null;
  assessment?: string | null;
  resources?: string | null;
  notes?: string | null;
  date?: string | null;
  weekly_outcome?: string | null;
};

type PlannerDetail = {
  id: string;
  teacher_id: string;
  course_id: string;
  week_start_date: string;
  week_end_date: string;
  status: PlannerStatus;
  planned_topics: PlannedTopic[] | null;
  submitted_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

type DayPlan = {
  dayNumber: number;
  dateLabel: string;
  topic: string;
  objectives: string;
  methods: string;
  assessment: string;
  resources: string;
  notes: string;
  weeklyOutcome: string;
};

function formatDateRange(start: string, end: string) {
  return `${start} → ${end}`;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function reindexPlans(plans: DayPlan[], start: Date): DayPlan[] {
  return plans.map((p, idx) => ({
    ...p,
    dayNumber: idx + 1,
    dateLabel: addDays(start, idx).toLocaleDateString(),
  }));
}

function hydrateDayPlans(detail?: PlannerDetail): DayPlan[] {
  const start = detail?.week_start_date ? new Date(detail.week_start_date) : new Date();
  const base = (detail?.planned_topics || []) as PlannedTopic[];

  const maxLen = Math.max(base.length || 0, 5);
  return Array.from({ length: maxLen }).map((_, idx) => {
    const src = base[idx];
    const date = addDays(start, idx);

    return {
      dayNumber: idx + 1,
      dateLabel: src?.date || date.toLocaleDateString(),
      topic: (src?.topic || '').toString(),
      objectives: src?.objectives || '',
      methods: src?.methods || '',
      assessment: src?.assessment || '',
      resources: src?.resources || '',
      notes: src?.notes || '',
      weeklyOutcome: src?.weekly_outcome || '',
    };
  });
}

export default function TeacherEditPlannerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const plannerId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlannerDetail | null>(null);

  const [summaryTopic, setSummaryTopic] = useState('');
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);

  const baseStartDate = useMemo(() => (detail?.week_start_date ? new Date(detail.week_start_date) : new Date()), [detail?.week_start_date]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchDetail = useCallback(
    async (tId: string, id: string) => {
      const { data, error } = await supabase
        .from('lesson_planners')
        .select(
          `
          id,
          teacher_id,
          course_id,
          week_start_date,
          week_end_date,
          status,
          planned_topics,
          submitted_at,
          approved_at,
          rejection_reason,
          courses(code, name, short_name)
        `
        )
        .eq('id', id)
        .eq('teacher_id', tId)
        .single();

      if (error) {
        console.log('Planner detail error:', error.message);
        return null;
      }

      return (data as PlannerDetail) || null;
    },
    []
  );

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const tId = await fetchTeacherId();
      setTeacherId(tId);

      if (!tId || !plannerId) {
        setDetail(null);
        setLoading(false);
        return;
      }

      const d = await fetchDetail(tId, plannerId);
      setDetail(d);

      const firstTopic = (d?.planned_topics || [])?.[0]?.topic;
      setSummaryTopic((firstTopic || '').trim());
      setDayPlans(reindexPlans(hydrateDayPlans(d ?? undefined), d?.week_start_date ? new Date(d.week_start_date) : new Date()));

      setLoading(false);
    };

    init();
  }, [fetchDetail, fetchTeacherId, plannerId]);

  const canSave = useMemo(() => {
    if (!detail || !teacherId || !plannerId) return false;
    if (saving || submitting) return false;
    if (summaryTopic.trim().length === 0) return false;
    const hasDayTopic = dayPlans.some((d) => d.topic.trim().length > 0);
    if (!hasDayTopic) return false;
    return detail.status === 'draft' || detail.status === 'rejected';
  }, [detail, teacherId, plannerId, saving, submitting, summaryTopic, dayPlans]);

  const updateDayPlan = (idx: number, key: keyof DayPlan, value: string) => {
    setDayPlans((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value } as DayPlan;
      return next;
    });
  };

  const addDay = () => {
    setDayPlans((prev) => {
      if (prev.length >= 7) return prev;
      const next: DayPlan[] = [
        ...prev,
        {
          dayNumber: prev.length + 1,
          dateLabel: addDays(baseStartDate, prev.length).toLocaleDateString(),
          topic: '',
          objectives: '',
          methods: '',
          assessment: '',
          resources: '',
          notes: '',
          weeklyOutcome: prev[0]?.weeklyOutcome || '',
        },
      ];
      return reindexPlans(next, baseStartDate);
    });
  };

  const removeDay = (idx: number) => {
    setDayPlans((prev) => reindexPlans(prev.filter((_, i) => i !== idx), baseStartDate));
  };

  const saveChanges = async () => {
    if (!teacherId || !plannerId || !detail) return;
    if (summaryTopic.trim().length === 0) {
      Alert.alert('Error', 'Planned topic summary is required');
      return;
    }

    const planned_topics: PlannedTopic[] = dayPlans.map((d) => ({
      day: d.dayNumber,
      date: d.dateLabel,
      topic: d.topic.trim() || summaryTopic.trim(),
      objectives: d.objectives.trim() || null,
      methods: d.methods.trim() || null,
      assessment: d.assessment.trim() || null,
      resources: d.resources.trim() || null,
      notes: d.notes.trim() || null,
      weekly_outcome: d.weeklyOutcome.trim() || null,
    }));

    try {
      setSaving(true);
      const { error } = await supabase
        .from('lesson_planners')
        .update({ planned_topics })
        .eq('id', plannerId)
        .eq('teacher_id', teacherId)
        .in('status', ['draft', 'rejected']);

      if (error) {
        Alert.alert('Error', 'Failed to save changes');
        return;
      }

      setDetail((prev) => (prev ? { ...prev, planned_topics } : prev));
      Alert.alert('Saved', 'Changes saved');
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async () => {
    if (!teacherId || !plannerId || !detail) return;
    if (detail.status !== 'rejected') return;

    if (summaryTopic.trim().length === 0) {
      Alert.alert('Error', 'Planned topic summary is required');
      return;
    }

    const nowIso = new Date().toISOString();
    const planned_topics: PlannedTopic[] = dayPlans.map((d) => ({
      day: d.dayNumber,
      date: d.dateLabel,
      topic: d.topic.trim() || summaryTopic.trim(),
      objectives: d.objectives.trim() || null,
      methods: d.methods.trim() || null,
      assessment: d.assessment.trim() || null,
      resources: d.resources.trim() || null,
      notes: d.notes.trim() || null,
      weekly_outcome: d.weeklyOutcome.trim() || null,
    }));

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('lesson_planners')
        .update({ planned_topics, status: 'submitted', submitted_at: nowIso, rejection_reason: null })
        .eq('id', plannerId)
        .eq('teacher_id', teacherId)
        .eq('status', 'rejected');

      if (error) {
        Alert.alert('Error', 'Failed to resubmit planner');
        return;
      }

      Alert.alert('Submitted', 'Planner resubmitted for approval');
      router.replace('/(teacher)/planner');
    } finally {
      setSubmitting(false);
    }
  };

  const title = detail?.courses?.short_name || detail?.courses?.code || detail?.courses?.name || 'Lesson Planner';
  const weekLabel = detail ? formatDateRange(detail.week_start_date, detail.week_end_date) : '—';

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
              <Text style={[styles.header, { color: colors.textPrimary }]} numberOfLines={1}>
                Edit Planner
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
                {title} • Week: {weekLabel}
              </Text>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : !detail ? (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Planner not found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>You may not have access to this planner.</Text>
          </Card>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 18 }}>
            {detail.status === 'rejected' && detail.rejection_reason ? (
              <Animated.View entering={FadeInDown.duration(280)} style={{ marginBottom: 12 }}>
                <Card>
                  <Text style={[styles.label, { color: colors.error }]}>Rejection reason</Text>
                  <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{detail.rejection_reason}</Text>
                </Card>
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.duration(280)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Weekly focus</Text>
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="create-outline"
                  placeholder="Weekly topic summary (required)"
                  value={summaryTopic}
                  onChangeText={setSummaryTopic}
                />
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="flag-outline"
                  placeholder="Expected outcome / goal (optional)"
                  value={dayPlans[0]?.weeklyOutcome || ''}
                  onChangeText={(v) => updateDayPlan(0, 'weeklyOutcome', v)}
                />
                <Text style={[styles.helper, { color: colors.textMuted }]}>Align with pedagogy, assessment, and resources per day.</Text>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(60).duration(280)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Day-wise plan</Text>
                <View style={{ height: 12 }} />

                {dayPlans.map((d, idx) => (
                  <View key={d.dayNumber} style={[styles.dayCard, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}> 
                    <View style={styles.dayHeader}>
                      <Text style={[styles.dayTitle, { color: colors.textPrimary }]}>Day {d.dayNumber}</Text>
                      <Text style={[styles.dayDate, { color: colors.textSecondary }]}>{d.dateLabel}</Text>
                      {dayPlans.length > 5 ? (
                        <TouchableOpacity onPress={() => removeDay(idx)} style={[styles.removeBtn, { borderColor: colors.cardBorder }]}> 
                          <Ionicons name="close" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <GlassInput
                      icon="book-outline"
                      placeholder="Topic / chapter"
                      value={d.topic}
                      onChangeText={(v) => updateDayPlan(idx, 'topic', v)}
                    />

                    <TextInput
                      placeholder="Objectives (learning outcomes)"
                      placeholderTextColor={colors.placeholder}
                      value={d.objectives}
                      onChangeText={(v) => updateDayPlan(idx, 'objectives', v)}
                      multiline
                      style={[styles.textArea, {
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                        borderRadius: colors.borderRadius,
                      }]}
                    />

                    <GlassInput
                      icon="rocket-outline"
                      placeholder="Methods / pedagogy"
                      value={d.methods}
                      onChangeText={(v) => updateDayPlan(idx, 'methods', v)}
                    />

                    <GlassInput
                      icon="bar-chart-outline"
                      placeholder="Assessment plan"
                      value={d.assessment}
                      onChangeText={(v) => updateDayPlan(idx, 'assessment', v)}
                    />

                    <GlassInput
                      icon="folder-open-outline"
                      placeholder="Resources"
                      value={d.resources}
                      onChangeText={(v) => updateDayPlan(idx, 'resources', v)}
                    />

                    <TextInput
                      placeholder="Notes / differentiation"
                      placeholderTextColor={colors.placeholder}
                      value={d.notes}
                      onChangeText={(v) => updateDayPlan(idx, 'notes', v)}
                      multiline
                      style={[styles.textArea, {
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                        borderRadius: colors.borderRadius,
                      }]}
                    />
                  </View>
                ))}

                {dayPlans.length < 7 ? (
                  <PrimaryButton
                    title="Add day"
                    variant="outline"
                    glowing={false}
                    size="small"
                    onPress={addDay}
                    style={{ marginTop: 12, alignSelf: 'flex-start' }}
                  />
                ) : null}
              </Card>
            </Animated.View>

            <View style={{ marginTop: 6 }}>
              <PrimaryButton
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={saveChanges}
                disabled={!canSave}
              />
            </View>

            {detail.status === 'rejected' ? (
              <View style={{ marginTop: 10 }}>
                <PrimaryButton
                  title={submitting ? 'Submitting...' : 'Resubmit for Approval'}
                  onPress={resubmit}
                  disabled={!canSave}
                />
              </View>
            ) : null}
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
  textArea: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dayCard: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  helper: {
    marginTop: 8,
    fontSize: 13,
  },
  reasonText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});
