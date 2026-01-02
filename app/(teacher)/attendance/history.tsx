import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type AttendanceHistoryRow = {
  id: string;
  date: string;
  period: number;
  timetable_entry_id: string | null;
  course_id: string;
  year_id: string | null;
  programme_id: string | null;
  department_id: string | null;
  courses?: { code: string; name: string; short_name: string | null; department_id?: string | null } | null;
};

function formatShortDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TeacherAttendanceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<AttendanceHistoryRow[]>([]);

  const subtitle = useMemo(() => {
    const count = rows.length;
    if (count === 0) return 'No attendance records';
    if (count === 1) return '1 record';
    return `${count} records`;
  }, [rows.length]);

  const fetchRows = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('attendance')
      .select(
        `
          id,
          date,
          period,
          timetable_entry_id,
          course_id,
          year_id,
          programme_id,
          department_id,
          courses:course_id(code, name, short_name, department_id)
        `
      )
      .eq('marked_by', user.id)
      .order('date', { ascending: false })
      .order('period', { ascending: false })
      .limit(60);

    if (error) {
      console.log('Teacher attendance history error:', error.message);
      setRows([]);
      return;
    }

    setRows((data || []) as any);
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRows();
      setLoading(false);
    };
    init();
  }, [fetchRows]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    setRefreshing(false);
  };

  const openMark = (r: AttendanceHistoryRow) => {
    if (!r.timetable_entry_id) return;

    const deptId = r.department_id || (r.courses?.department_id as any) || '';

    router.push({
      pathname: '/(teacher)/attendance/mark',
      params: {
        entryId: r.timetable_entry_id,
        courseName: r.courses?.name || '',
        courseId: r.course_id,
        yearId: r.year_id || '',
        programmeId: r.programme_id || '',
        departmentId: deptId,
        period: String(r.period),
        date: r.date,
      },
    });
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
              <Text style={[styles.header, { color: colors.textPrimary }]}>History</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>{subtitle}</Text>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading history...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {rows.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No history</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Marked attendance will appear here.</Text>
              </Card>
            ) : (
              rows.map((r, index) => {
                const courseLabel = r.courses?.short_name || r.courses?.code || r.courses?.name || 'Course';
                const canOpen = Boolean(r.timetable_entry_id) && Boolean(r.year_id);

                return (
                  <Animated.View key={r.id} entering={FadeInDown.delay(index * 25).duration(260)} style={{ marginBottom: 12 }}>
                    <TouchableOpacity
                      activeOpacity={canOpen ? 0.85 : 1}
                      onPress={canOpen ? () => openMark(r) : undefined}
                      disabled={!canOpen}
                    >
                      <Card>
                        <View style={styles.rowTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                              {courseLabel}
                            </Text>
                            <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                              {formatShortDate(r.date)} • Period {r.period}
                            </Text>
                            {!canOpen ? (
                              <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={2}>
                                View-only: missing timetable/year linkage
                              </Text>
                            ) : null}
                          </View>

                          <Ionicons
                            name={canOpen ? 'chevron-forward' : 'lock-closed-outline'}
                            size={18}
                            color={colors.textMuted}
                          />
                        </View>
                      </Card>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
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
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
  },
  rowMeta: {
    marginTop: 6,
    fontSize: 12,
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
