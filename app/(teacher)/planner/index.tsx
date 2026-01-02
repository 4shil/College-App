import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type PlannerStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type PlannerRow = {
  id: string;
  teacher_id: string;
  course_id: string;
  week_start_date: string;
  week_end_date: string;
  status: PlannerStatus;
  submitted_at: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

function formatDateRange(start: string, end: string) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return `${start} → ${end}`;
    return `${s.toLocaleDateString()} → ${e.toLocaleDateString()}`;
  } catch {
    return `${start} → ${end}`;
  }
}

export default function TeacherPlannerIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [rows, setRows] = useState<PlannerRow[]>([]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchRows = useCallback(async () => {
    if (!teacherId) return;

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
          submitted_at,
          approved_at,
          rejection_reason,
          created_at,
          courses(code, name, short_name)
        `
      )
      .eq('teacher_id', teacherId)
      .order('week_start_date', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Teacher planners error:', error.message);
      setRows([]);
      return;
    }

    setRows((data || []) as PlannerRow[]);
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
    fetchRows();
  }, [teacherId, fetchRows]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  const subtitle = useMemo(() => {
    const count = rows.length;
    if (count === 0) return 'No planners yet';
    if (count === 1) return '1 planner';
    return `${count} planners`;
  }, [rows.length]);

  const openCreate = () => {
    router.push('/(teacher)/planner/create');
  };

  const statusChip = (status: PlannerStatus) => {
    const map: Record<PlannerStatus, { bg: string; fg: string; label: string }> = {
      draft: { bg: withAlpha(colors.warning, isDark ? 0.18 : 0.1), fg: colors.warning, label: 'Draft' },
      submitted: { bg: withAlpha(colors.info, isDark ? 0.18 : 0.1), fg: colors.info, label: 'Submitted' },
      approved: { bg: withAlpha(colors.success, isDark ? 0.22 : 0.12), fg: colors.success, label: 'Approved' },
      rejected: { bg: withAlpha(colors.error, isDark ? 0.18 : 0.1), fg: colors.error, label: 'Rejected' },
    };
    return map[status];
  };

  const submitPlanner = async (row: PlannerRow) => {
    if (!teacherId) return;

    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('lesson_planners')
      .update({ status: 'submitted', submitted_at: nowIso, rejection_reason: null })
      .eq('id', row.id)
      .eq('teacher_id', teacherId)
      .eq('status', 'draft');

    if (error) {
      Alert.alert('Error', 'Failed to submit planner');
      return;
    }

    setRows((prev) => prev.map((p) => (p.id === row.id ? { ...p, status: 'submitted', submitted_at: nowIso, rejection_reason: null } : p)));
  };

  const resubmitPlanner = async (row: PlannerRow) => {
    if (!teacherId) return;

    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('lesson_planners')
      .update({ status: 'submitted', submitted_at: nowIso, rejection_reason: null })
      .eq('id', row.id)
      .eq('teacher_id', teacherId)
      .eq('status', 'rejected');

    if (error) {
      Alert.alert('Error', 'Failed to resubmit planner');
      return;
    }

    setRows((prev) => prev.map((p) => (p.id === row.id ? { ...p, status: 'submitted', submitted_at: nowIso, rejection_reason: null } : p)));
  };

  const renderRow = (p: PlannerRow, index: number) => {
    const chip = statusChip(p.status);

    return (
      <Animated.View key={p.id} entering={FadeInDown.delay(index * 30).duration(280)} style={{ marginBottom: 12 }}>
        <Card>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {p.courses?.short_name || p.courses?.code || p.courses?.name || 'Course'}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
                Week: {formatDateRange(p.week_start_date, p.week_end_date)}
              </Text>
              {p.status === 'submitted' && p.submitted_at ? (
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                  Submitted: {new Date(p.submitted_at).toLocaleString()}
                </Text>
              ) : null}
              {p.status === 'approved' && p.approved_at ? (
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                  Approved: {new Date(p.approved_at).toLocaleString()}
                </Text>
              ) : null}
              {p.status === 'rejected' && p.rejection_reason ? (
                <View style={[styles.reasonBox, { backgroundColor: withAlpha(colors.error, isDark ? 0.16 : 0.1) }]}>
                  <Text style={[styles.reasonTitle, { color: colors.error }]}>Rejection reason</Text>
                  <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{p.rejection_reason}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.rightCol}>
              <View style={[styles.chip, { backgroundColor: chip.bg }]}>
                <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
              </View>

              {p.status === 'draft' ? (
                <TouchableOpacity
                  onPress={() => submitPlanner(p)}
                  style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              ) : null}

              {p.status === 'rejected' ? (
                <TouchableOpacity
                  onPress={() => router.push(`/(teacher)/planner/edit/${p.id}`)}
                  style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]}>Lesson Planner</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>{subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={openCreate}
              activeOpacity={0.85}
              style={[styles.fab, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.14) }]}
            >
              <Ionicons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading planners...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {rows.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No planners</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Create a weekly lesson planner draft.</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton title="Create Planner" onPress={openCreate} />
                </View>
              </Card>
            ) : (
              rows.map(renderRow)
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonBox: {
    marginTop: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  reasonText: {
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
