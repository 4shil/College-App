import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { useAuthStore } from '../../../../store/authStore';
import { supabase } from '../../../../lib/supabase';
import { withAlpha } from '../../../../theme/colorUtils';

type DiaryStatus = 'draft' | 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected';

type DayStatus = 'W' | 'H' | 'L';

type PeriodSlots = 'spl_am' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'spl_eve';

type DailyEntry = {
  date: string;
  day_status: DayStatus;
  remarks: string;
  periods: Record<PeriodSlots, string | null>;
  tasks: {
    unit_ii_hours: number;
    unit_iii_hours: number;
    unit_iv_hours: number;
    unit_v_hours: number;
    unit_vi_hours: number;
  };
};

type DiaryDetail = {
  id: string;
  teacher_id: string;
  academic_year_id: string;
  month: number;
  year: number;
  status: DiaryStatus;
  daily_entries: DailyEntry[] | null;
  submitted_at: string | null;
  hod_approved_at: string | null;
  principal_approved_at: string | null;
  rejection_reason: string | null;
};

const DEFAULT_PERIODS: Record<PeriodSlots, string | null> = {
  spl_am: null,
  p1: null,
  p2: null,
  p3: null,
  p4: null,
  p5: null,
  spl_eve: null,
};

const EMPTY_TASKS = {
  unit_ii_hours: 0,
  unit_iii_hours: 0,
  unit_iv_hours: 0,
  unit_v_hours: 0,
  unit_vi_hours: 0,
};

function clampHours(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.min(5, Math.max(0, v));
}

function countClasses(periods: Record<PeriodSlots, string | null>) {
  const values = Object.values(periods).filter(Boolean) as string[];
  const pg = values.filter((v) => v.startsWith('M_')).length;
  const ug = values.filter((v) => v.startsWith('D_')).length;
  return { pg, ug };
}

function monthLabel(month: number, year: number) {
  const date = new Date(year, Math.max(0, month - 1), 1);
  return date.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function toDateOnlyISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TeacherEditDiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const diaryId = useMemo(() => {
    const raw = params?.id;
    if (!raw) return null;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DiaryDetail | null>(null);

  const [entries, setEntries] = useState<DailyEntry[]>([]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchDetail = useCallback(async (tId: string, id: string) => {
    const { data, error } = await supabase
      .from('work_diaries')
      .select(
        'id,teacher_id,academic_year_id,month,year,status,daily_entries,submitted_at,hod_approved_at,principal_approved_at,rejection_reason'
      )
      .eq('id', id)
      .eq('teacher_id', tId)
      .single();

    if (error) {
      console.log('Diary detail error:', error.message);
      return null;
    }

    return (data as DiaryDetail) || null;
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      const tId = await fetchTeacherId();
      setTeacherId(tId);

      if (!tId || !diaryId) {
        setDetail(null);
        setLoading(false);
        return;
      }

      const d = await fetchDetail(tId, diaryId);
      setDetail(d);

      const normalized = (d?.daily_entries || []).map((row: any) => ({
        date: row?.date || toDateOnlyISO(new Date()),
        day_status: (row?.day_status as DayStatus) || 'W',
        remarks: row?.remarks || '',
        periods: {
          ...DEFAULT_PERIODS,
          ...(Array.isArray(row?.periods) ? {} : row?.periods || {}),
        },
        tasks: {
          ...EMPTY_TASKS,
          ...(row?.tasks || {}),
        },
      }));

      setEntries(normalized.length > 0
        ? normalized
        : [{ date: toDateOnlyISO(new Date()), day_status: 'W', remarks: '', periods: { ...DEFAULT_PERIODS }, tasks: { ...EMPTY_TASKS } }]);

      setLoading(false);
    };

    init();
  }, [diaryId, fetchDetail, fetchTeacherId]);

  const canSave = useMemo(() => {
    if (!detail || !teacherId || !diaryId) return false;
    if (saving || submitting) return false;
    if (entries.length === 0) return false;
    return detail.status === 'draft' || detail.status === 'rejected';
  }, [detail, diaryId, teacherId, saving, submitting, entries.length]);

  const updateEntry = (idx: number, updater: (prev: DailyEntry) => DailyEntry) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? updater(e) : e)));
  };

  const addEntry = () => {
    const last = entries[entries.length - 1];
    const nextDate = new Date(last.date);
    nextDate.setDate(nextDate.getDate() + 1);
    setEntries((prev) => [
      ...prev,
      {
        date: toDateOnlyISO(nextDate),
        day_status: 'W',
        remarks: '',
        periods: { ...DEFAULT_PERIODS },
        tasks: { ...EMPTY_TASKS },
      },
    ]);
  };

  const removeEntry = (idx: number) => {
    setEntries((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const saveChanges = async () => {
    if (!teacherId || !diaryId || !detail) return;

    const daily_entries = entries;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('work_diaries')
        .update({ daily_entries })
        .eq('id', diaryId)
        .eq('teacher_id', teacherId)
        .in('status', ['draft', 'rejected']);

      if (error) {
        Alert.alert('Error', 'Failed to save changes');
        return;
      }

      setDetail((prev) => (prev ? { ...prev, daily_entries } : prev));
      Alert.alert('Saved', 'Changes saved');
    } finally {
      setSaving(false);
    }
  };

  const resubmit = async () => {
    if (!teacherId || !diaryId || !detail) return;
    if (detail.status !== 'rejected') return;

    const nowIso = new Date().toISOString();
    const daily_entries = entries;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('work_diaries')
        .update({
          daily_entries,
          status: 'submitted',
          submitted_at: nowIso,
          hod_approved_by: null,
          hod_approved_at: null,
          principal_approved_by: null,
          principal_approved_at: null,
          rejection_reason: null,
        })
        .eq('id', diaryId)
        .eq('teacher_id', teacherId)
        .eq('status', 'rejected');

      if (error) {
        Alert.alert('Error', 'Failed to resubmit diary');
        return;
      }

      Alert.alert('Submitted', 'Diary resubmitted for approval');
      router.replace('/(teacher)/diary');
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle = detail ? monthLabel(detail.month, detail.year) : '—';

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
                Edit Diary
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
                {subtitle}
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
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Diary not found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>You may not have access to this diary.</Text>
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

            {entries.map((entry, idx) => {
              const totals = countClasses(entry.periods);
              return (
                <Animated.View key={idx} entering={FadeInDown.delay(40 * idx).duration(280)} style={{ marginBottom: 12 }}>
                  <Card>
                    <View style={styles.entryHeader}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Day {idx + 1}</Text>
                      <View style={styles.totalsRow}>
                        <Text style={[styles.helper, { color: colors.textSecondary }]}>PG: {totals.pg} • UG: {totals.ug}</Text>
                        {entries.length > 1 && (detail.status === 'draft' || detail.status === 'rejected') ? (
                          <TouchableOpacity onPress={() => removeEntry(idx)} activeOpacity={0.85}>
                            <Text style={[styles.helper, { color: colors.error }]}>Remove</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.rowGap}>
                      <GlassInput
                        icon="calendar-outline"
                        placeholder="Date (YYYY-MM-DD)"
                        value={entry.date}
                        onChangeText={(v) => updateEntry(idx, (e) => ({ ...e, date: v.trim() }))}
                        editable={detail.status === 'draft' || detail.status === 'rejected'}
                      />

                      <View style={styles.statusRow}>
                        {(['W', 'H', 'L'] as DayStatus[]).map((s) => (
                          <TouchableOpacity
                            key={s}
                            activeOpacity={0.85}
                            onPress={() => updateEntry(idx, (e) => ({ ...e, day_status: s }))}
                            disabled={detail.status !== 'draft' && detail.status !== 'rejected'}
                            style={[
                              styles.statusChip,
                              {
                                backgroundColor:
                                  entry.day_status === s
                                    ? withAlpha(colors.primary, isDark ? 0.2 : 0.12)
                                    : withAlpha(colors.shadowColor, 0.05),
                                borderColor: entry.day_status === s ? colors.primary : colors.cardBorder,
                                opacity: detail.status === 'draft' || detail.status === 'rejected' ? 1 : 0.5,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: entry.day_status === s ? colors.primary : colors.textMuted },
                              ]}
                            >
                              {s}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>Unit I - Class codes</Text>
                      {(['spl_am', 'p1', 'p2', 'p3', 'p4', 'p5', 'spl_eve'] as PeriodSlots[]).map((slot) => (
                        <GlassInput
                          key={slot}
                          icon="book-outline"
                          placeholder={`${slot.toUpperCase()} (e.g., D_1, M_2)`}
                          value={entry.periods[slot] || ''}
                          editable={detail.status === 'draft' || detail.status === 'rejected'}
                          onChangeText={(v) => updateEntry(idx, (e) => ({
                            ...e,
                            periods: { ...e.periods, [slot]: v.trim() || null },
                          }))}
                        />
                      ))}

                      <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>Units II–VI (hours 0-5)</Text>
                      {[
                        { key: 'unit_ii_hours', label: 'Unit II (Tutorial)' },
                        { key: 'unit_iii_hours', label: 'Unit III (Examination)' },
                        { key: 'unit_iv_hours', label: 'Unit IV (Research)' },
                        { key: 'unit_v_hours', label: 'Unit V (Preparation)' },
                        { key: 'unit_vi_hours', label: 'Unit VI (Extension)' },
                      ].map(({ key, label }) => (
                        <GlassInput
                          key={key}
                          icon="time-outline"
                          placeholder={`${label} hours (0-5)`}
                          value={String(entry.tasks[key as keyof typeof entry.tasks] ?? 0)}
                          editable={detail.status === 'draft' || detail.status === 'rejected'}
                          keyboardType="numeric"
                          onChangeText={(v) => updateEntry(idx, (e) => ({
                            ...e,
                            tasks: {
                              ...e.tasks,
                              [key]: clampHours(Number(v)),
                            },
                          }))}
                        />
                      ))}

                      <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>Remarks</Text>
                      <GlassInput
                        icon="chatbubble-ellipses-outline"
                        placeholder="Holiday/Leave reason or notes"
                        value={entry.remarks}
                        editable={detail.status === 'draft' || detail.status === 'rejected'}
                        onChangeText={(v) => updateEntry(idx, (e) => ({ ...e, remarks: v }))}
                      />
                    </View>
                  </Card>
                </Animated.View>
              );
            })}

            {(detail.status === 'draft' || detail.status === 'rejected') ? (
              <TouchableOpacity
                onPress={addEntry}
                activeOpacity={0.85}
                style={[styles.addBtn, { borderColor: withAlpha(colors.primary, 0.4) }]}
              >
                <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Add another day</Text>
              </TouchableOpacity>
            ) : null}

            <Animated.View entering={FadeInDown.duration(280)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Today summary</Text>
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="create-outline"
                  placeholder="What was covered today? (required)"
                  value={todaySummary}
                  onChangeText={setTodaySummary}
                />
                <Text style={[styles.helper, { color: colors.textMuted }]}>This updates the diary JSON.</Text>
              </Card>
            </Animated.View>

            <View style={{ marginTop: 6 }}>
              <PrimaryButton title={saving ? 'Saving...' : 'Save Changes'} onPress={saveChanges} disabled={!canSave} />
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
  helper: {
    marginTop: 8,
    fontSize: 13,
  },
  reasonText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowGap: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 13,
  },
  addBtn: {
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  addBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
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
