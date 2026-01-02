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

type DailyEntry = {
  date?: string;
  periods?: any[];
  summary?: string;
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

  const [todaySummary, setTodaySummary] = useState('');

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

      const firstSummary = (d?.daily_entries || [])?.[0]?.summary;
      setTodaySummary((firstSummary || '').trim());

      setLoading(false);
    };

    init();
  }, [diaryId, fetchDetail, fetchTeacherId]);

  const canSave = useMemo(() => {
    if (!detail || !teacherId || !diaryId) return false;
    if (saving || submitting) return false;
    if (todaySummary.trim().length === 0) return false;
    return detail.status === 'draft' || detail.status === 'rejected';
  }, [detail, diaryId, teacherId, saving, submitting, todaySummary]);

  const buildDailyEntries = () => {
    const existing = Array.isArray(detail?.daily_entries) ? [...detail!.daily_entries!] : [];

    if (existing.length === 0) {
      existing.push({ date: toDateOnlyISO(new Date()), periods: [], summary: todaySummary.trim() });
      return existing;
    }

    existing[0] = {
      ...existing[0],
      date: existing[0]?.date || toDateOnlyISO(new Date()),
      periods: Array.isArray(existing[0]?.periods) ? existing[0]!.periods : [],
      summary: todaySummary.trim(),
    };

    return existing;
  };

  const saveChanges = async () => {
    if (!teacherId || !diaryId || !detail) return;

    if (todaySummary.trim().length === 0) {
      Alert.alert('Error', 'Today summary is required');
      return;
    }

    const daily_entries = buildDailyEntries();

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

    if (todaySummary.trim().length === 0) {
      Alert.alert('Error', 'Today summary is required');
      return;
    }

    const nowIso = new Date().toISOString();
    const daily_entries = buildDailyEntries();

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
