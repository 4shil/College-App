import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';
import { toDateOnlyISO } from '../../../lib/dateUtils';

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

function countClasses(periods: Record<PeriodSlots, string | null>) {
  const values = Object.values(periods).filter(Boolean) as string[];
  const pg = values.filter((v) => v.startsWith('M_')).length;
  const ug = values.filter((v) => v.startsWith('D_')).length;
  return { pg, ug };
}

function clampHours(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.min(5, Math.max(0, v));
}

export default function TeacherCreateDiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Use a function for initial state to get current date at mount time
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1));
  const [year, setYear] = useState(() => String(new Date().getFullYear()));

  const [entries, setEntries] = useState<DailyEntry[]>([{
    date: toDateOnlyISO(new Date()),
    day_status: 'W',
    remarks: '',
    periods: { ...DEFAULT_PERIODS },
    tasks: { ...EMPTY_TASKS },
  }]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      setLoading(false);
    };
    init();
  }, [fetchTeacherId]);

  const canSave = useMemo(() => {
    return !!teacherId && entries.length > 0 && !saving;
  }, [teacherId, entries.length, saving]);

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

  const save = async () => {
    if (!teacherId) {
      Alert.alert('Error', 'Teacher profile not found');
      return;
    }

    const m = Number(month.trim());
    const y = Number(year.trim());

    if (Number.isNaN(m) || m < 1 || m > 12) {
      Alert.alert('Error', 'Month must be 1-12');
      return;
    }
    if (Number.isNaN(y) || y < 2000 || y > 2100) {
      Alert.alert('Error', 'Year must be valid');
      return;
    }

    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (!academicYear?.id) {
      Alert.alert('Error', 'No current academic year found');
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        teacher_id: teacherId,
        academic_year_id: academicYear.id,
        month: m,
        year: y,
        daily_entries: entries,
        status: 'draft',
      };

      const { error } = await supabase.from('work_diaries').insert(payload);
      if (error) {
        console.log('Create diary error:', error.message);
        if (error.message?.toLowerCase().includes('duplicate') || (error as any)?.code === '23505') {
          Alert.alert('Already exists', 'A diary for this month/year already exists.');
        } else {
          Alert.alert('Error', 'Failed to create diary');
        }
        return;
      }

      Alert.alert('Created', 'Diary draft created');
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
              <Text style={[styles.header, { color: colors.textPrimary }]}>Create Diary</Text>
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
                <Text style={[styles.label, { color: colors.textMuted }]}>Month</Text>
                <View style={{ height: 10 }} />

                <View style={styles.monthRow}>
                  <View style={{ flex: 1 }}>
                    <GlassInput
                      icon="calendar-outline"
                      placeholder="Month (1-12)"
                      value={month}
                      onChangeText={setMonth}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <GlassInput
                      icon="calendar-outline"
                      placeholder="Year (e.g. 2025)"
                      value={year}
                      onChangeText={setYear}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </Card>
            </Animated.View>

            {entries.map((entry, idx) => {
              const totals = countClasses(entry.periods);
              return (
                <Animated.View key={idx} entering={FadeInDown.delay(50 + idx * 40).duration(300)} style={{ marginBottom: 12 }}>
                  <Card>
                    <View style={styles.entryHeader}>
                      <Text style={[styles.label, { color: colors.textMuted }]}>Day {idx + 1}</Text>
                      <View style={styles.totalsRow}>
                        <Text style={[styles.helper, { color: colors.textSecondary }]}>PG: {totals.pg} • UG: {totals.ug}</Text>
                        {entries.length > 1 ? (
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
                      />

                      <View style={styles.statusRow}>
                        {(['W', 'H', 'L'] as DayStatus[]).map((s) => (
                          <TouchableOpacity
                            key={s}
                            activeOpacity={0.85}
                            onPress={() => updateEntry(idx, (e) => ({ ...e, day_status: s }))}
                            style={[
                              styles.statusChip,
                              {
                                backgroundColor:
                                  entry.day_status === s
                                    ? withAlpha(colors.primary, isDark ? 0.2 : 0.12)
                                    : withAlpha(colors.shadowColor, 0.05),
                                borderColor: entry.day_status === s ? colors.primary : colors.cardBorder,
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

                      <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>Unit I (Classes)</Text>
                      {(['spl_am', 'p1', 'p2', 'p3', 'p4', 'p5', 'spl_eve'] as PeriodSlots[]).map((slot) => (
                        <GlassInput
                          key={slot}
                          icon="book-outline"
                          placeholder={slot.toUpperCase() + ' (e.g., D_1, M_2)'}
                          value={entry.periods[slot] || ''}
                          autoCapitalize="characters"
                          onChangeText={(v) =>
                            updateEntry(idx, (e) => ({
                              ...e,
                              periods: { ...e.periods, [slot]: v.trim() || null },
                            }))
                          }
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
                        onChangeText={(v) => updateEntry(idx, (e) => ({ ...e, remarks: v }))}
                      />
                    </View>
                  </Card>
                </Animated.View>
              );
            })}

            <TouchableOpacity
              onPress={addEntry}
              activeOpacity={0.85}
              style={[styles.addBtn, { borderColor: withAlpha(colors.primary, 0.4) }]}
            >
              <Text style={[styles.addBtnText, { color: colors.primary }]}>+ Add another day</Text>
            </TouchableOpacity>

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
  helper: {
    marginTop: 8,
    fontSize: 13,
  },
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
