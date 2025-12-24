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

type DiaryStatus = 'draft' | 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected';

type DiaryRow = {
  id: string;
  teacher_id: string;
  academic_year_id: string;
  month: number;
  year: number;
  status: DiaryStatus;
  submitted_at: string | null;
  created_at: string;
};

function monthLabel(month: number, year: number) {
  try {
    const d = new Date(year, Math.max(0, month - 1), 1);
    return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  } catch {
    return `${month}/${year}`;
  }
}

export default function TeacherDiaryIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [rows, setRows] = useState<DiaryRow[]>([]);

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
      .from('work_diaries')
      .select('id,teacher_id,academic_year_id,month,year,status,submitted_at,created_at')
      .eq('teacher_id', teacherId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(36);

    if (error) {
      console.log('Teacher diaries error:', error.message);
      setRows([]);
      return;
    }

    setRows((data || []) as DiaryRow[]);
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
    if (count === 0) return 'No diaries yet';
    if (count === 1) return '1 diary';
    return `${count} diaries`;
  }, [rows.length]);

  const openCreate = () => {
    router.push('/(teacher)/diary/create');
  };

  const statusChip = (status: DiaryStatus) => {
    const map: Record<DiaryStatus, { bg: string; fg: string; label: string }> = {
      draft: { bg: withAlpha(colors.warning, isDark ? 0.18 : 0.1), fg: colors.warning, label: 'Draft' },
      submitted: { bg: withAlpha(colors.info, isDark ? 0.18 : 0.1), fg: colors.info, label: 'Submitted' },
      hod_approved: { bg: withAlpha(colors.success, isDark ? 0.22 : 0.12), fg: colors.success, label: 'HOD Approved' },
      principal_approved: { bg: withAlpha(colors.success, isDark ? 0.22 : 0.12), fg: colors.success, label: 'Principal Approved' },
      rejected: { bg: withAlpha(colors.error, isDark ? 0.18 : 0.1), fg: colors.error, label: 'Rejected' },
    };
    return map[status];
  };

  const submitDiary = async (row: DiaryRow) => {
    if (!teacherId) return;

    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('work_diaries')
      .update({ status: 'submitted', submitted_at: nowIso })
      .eq('id', row.id)
      .eq('teacher_id', teacherId)
      .eq('status', 'draft');

    if (error) {
      Alert.alert('Error', 'Failed to submit diary');
      return;
    }

    setRows((prev) => prev.map((d) => (d.id === row.id ? { ...d, status: 'submitted', submitted_at: nowIso } : d)));
  };

  const renderRow = (d: DiaryRow, index: number) => {
    const chip = statusChip(d.status);

    return (
      <Animated.View key={d.id} entering={FadeInDown.delay(index * 30).duration(280)} style={{ marginBottom: 12 }}>
        <Card>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {monthLabel(d.month, d.year)}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
                Status: {chip.label}
              </Text>
              {d.submitted_at ? (
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                  Submitted: {new Date(d.submitted_at).toLocaleString()}
                </Text>
              ) : null}
            </View>

            <View style={styles.rightCol}>
              <View style={[styles.chip, { backgroundColor: chip.bg }]}>
                <Text style={[styles.chipText, { color: chip.fg }]}>{chip.label}</Text>
              </View>

              {d.status === 'draft' ? (
                <TouchableOpacity
                  onPress={() => submitDiary(d)}
                  style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="send-outline" size={18} color={colors.primary} />
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
              <Text style={[styles.header, { color: colors.textPrimary }]}>Work Diary</Text>
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
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading diaries...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {rows.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No diaries</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Create a monthly work diary draft.</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton title="Create Diary" onPress={openCreate} />
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
