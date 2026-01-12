import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, StatCard } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getAttendanceSummary, getStudentByUserId } from '../../lib/database';
import { withAlpha } from '../../theme/colorUtils';

type RecentAttendanceRow = {
  id: string;
  status: string;
  late_minutes: number | null;
  marked_at: string | null;
  attendance: {
    date: string;
    period: number;
    courses?: { code: string; name: string; short_name: string | null } | null;
  };
};

function formatISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatShortDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function statusTone(status: string) {
  if (status === 'present') return 'success' as const;
  if (status === 'late') return 'warning' as const;
  if (status === 'absent') return 'danger' as const;
  return 'muted' as const;
}

export default function StudentAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  const [summary, setSummary] = useState({ 
    total: 0, 
    present: 0, 
    absent: 0, 
    late: 0, 
    percentage: 0,
    approvedAbsences: 0,
    unapprovedAbsences: 0 
  });
  const [recent, setRecent] = useState<RecentAttendanceRow[]>([]);
  const [absentDatesWithoutLeave, setAbsentDatesWithoutLeave] = useState<string[]>([]);

  const range = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startISO: formatISODate(start), endISO: formatISODate(now) };
  }, []);

  const fetchStudentId = useCallback(async () => {
    if (!user?.id) return null;
    const student = await getStudentByUserId(user.id);
    return student?.id || null;
  }, [user?.id]);

  const fetchSummary = useCallback(async (sId: string) => {
    const data = await getAttendanceSummary(sId, range.startISO, range.endISO);
    
    // Fetch approved leaves to categorize absences
    const { data: leaveData } = await supabase
      .from('student_leave_applications')
      .select('from_date, to_date')
      .eq('student_id', sId)
      .eq('status', 'approved')
      .gte('to_date', range.startISO)
      .lte('from_date', range.endISO);

    const approvedLeaveDates = new Set<string>();
    (leaveData || []).forEach((leave: any) => {
      const start = new Date(leave.from_date);
      const end = new Date(leave.to_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        approvedLeaveDates.add(formatISODate(d));
      }
    });

    // Fetch all attendance records to check which absence dates have no leave
    const { data: records } = await supabase
      .from('attendance_records')
      .select('status, attendance!inner(date)')
      .eq('student_id', sId)
      .eq('status', 'absent')
      .gte('attendance.date', range.startISO)
      .lte('attendance.date', range.endISO);

    const absentDates = new Set<string>();
    (records || []).forEach((r: any) => {
      absentDates.add(r.attendance.date);
    });

    const unapprovedDates: string[] = [];
    absentDates.forEach(date => {
      if (!approvedLeaveDates.has(date)) {
        unapprovedDates.push(date);
      }
    });

    const approvedAbsences = data.absent - unapprovedDates.length;
    const unapprovedAbsences = unapprovedDates.length;

    setAbsentDatesWithoutLeave(unapprovedDates.sort().reverse());
    setSummary({ 
      ...data, 
      approvedAbsences: Math.max(0, approvedAbsences),
      unapprovedAbsences 
    });
  }, [range.endISO, range.startISO]);

  const fetchRecent = useCallback(async (sId: string) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select(
        `
          id,
          status,
          late_minutes,
          marked_at,
          attendance!inner(
            date,
            period,
            courses:course_id(code, name, short_name)
          )
        `
      )
      .eq('student_id', sId)
      .order('marked_at', { ascending: false })
      .limit(20);

    if (error) {
      console.log('Student attendance recent error:', error.message);
      setRecent([]);
      return;
    }

    setRecent((data || []) as any);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;

    const sId = studentId || (await fetchStudentId());
    setStudentId(sId);

    if (!sId) {
      setSummary({ total: 0, present: 0, absent: 0, late: 0, percentage: 0, approvedAbsences: 0, unapprovedAbsences: 0 });
      setRecent([]);
      setAbsentDatesWithoutLeave([]);
      return;
    }

    await Promise.all([fetchSummary(sId), fetchRecent(sId)]);
  }, [fetchRecent, fetchStudentId, fetchSummary, studentId, user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    init();
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const subtitle = useMemo(() => {
    return `This month • ${range.startISO} to ${range.endISO}`;
  }, [range.endISO, range.startISO]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>My Attendance</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading attendance...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {!studentId ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
              </Card>
            ) : (
              <>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push('/(student)/attendance/leave' as any)}
                  style={{ marginBottom: 12 }}
                >
                  <Card>
                    <View style={styles.leaveRow}>
                      <View style={[styles.leaveIcon, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}>
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.leaveTitle, { color: colors.textPrimary }]}>Leave application</Text>
                        <Text style={[styles.leaveSub, { color: colors.textSecondary }]}>Request permission from class teacher</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                  </Card>
                </TouchableOpacity>

                <View style={styles.statsGrid}>
                  <View style={{ flex: 1 }}>
                    <StatCard
                      title="Attendance %"
                      value={`${summary.percentage}%`}
                      icon={{ family: 'ion', name: 'pie-chart-outline' }}
                      tone={summary.percentage >= 75 ? 'success' : 'warning'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <StatCard
                      title="Total"
                      value={summary.total}
                      icon={{ family: 'ion', name: 'calendar-outline' }}
                      tone="primary"
                    />
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={{ flex: 1 }}>
                    <StatCard
                      title="Present"
                      value={summary.present}
                      icon={{ family: 'ion', name: 'checkmark-circle-outline' }}
                      tone="success"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <StatCard
                      title="Approved Leave"
                      value={summary.approvedAbsences}
                      icon={{ family: 'ion', name: 'checkmark-done-outline' }}
                      tone="success"
                    />
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={{ flex: 1 }}>
                    <StatCard
                      title="No Permission"
                      value={summary.unapprovedAbsences}
                      icon={{ family: 'ion', name: 'alert-circle-outline' }}
                      tone="error"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <StatCard
                      title="Late"
                      value={summary.late}
                      icon={{ family: 'ion', name: 'time-outline' }}
                      tone="warning"
                    />
                  </View>
                </View>

                {absentDatesWithoutLeave.length > 0 && (
                  <Animated.View entering={FadeInDown.duration(350)} style={{ marginTop: 12, marginBottom: 12 }}>
                    <Card style={{ 
                      borderWidth: 2, 
                      borderColor: colors.error,
                      backgroundColor: withAlpha(colors.error, isDark ? 0.08 : 0.05) 
                    }}>
                      <View style={styles.warningRow}>
                        <Ionicons name="warning" size={22} color={colors.error} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.warningTitle, { color: colors.error }]}>NO PERMISSION</Text>
                          <Text style={[styles.warningSub, { color: colors.textSecondary }]}>
                            You have {absentDatesWithoutLeave.length} absent day(s) without approved leave
                          </Text>
                          <View style={{ height: 8 }} />
                          <Text style={[styles.warningDates, { color: colors.textMuted }]}>
                            {absentDatesWithoutLeave.slice(0, 5).map(d => formatShortDate(d)).join(', ')}
                            {absentDatesWithoutLeave.length > 5 && ` +${absentDatesWithoutLeave.length - 5} more`}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </Animated.View>
                )}

                <View style={{ marginTop: 14, marginBottom: 10 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent</Text>
                  <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Last 20 marked periods</Text>
                </View>

                {recent.length === 0 ? (
                  <Card>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No records</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>Attendance will appear once marked.</Text>
                  </Card>
                ) : (
                  recent.map((r, index) => {
                    const tone = statusTone(r.status);
                    const chipBg =
                      tone === 'success'
                        ? withAlpha(colors.success, isDark ? 0.22 : 0.12)
                        : tone === 'warning'
                          ? withAlpha(colors.warning, isDark ? 0.22 : 0.12)
                          : tone === 'danger'
                            ? withAlpha(colors.error, isDark ? 0.22 : 0.12)
                            : isDark
                              ? withAlpha(colors.textInverse, 0.08)
                              : withAlpha(colors.shadowColor, 0.06);

                    const chipText =
                      tone === 'success'
                        ? colors.success
                        : tone === 'warning'
                          ? colors.warning
                          : tone === 'danger'
                            ? colors.error
                            : colors.textMuted;

                    const courseLabel =
                      r.attendance?.courses?.short_name || r.attendance?.courses?.code || r.attendance?.courses?.name || 'Course';
                    
                    // Check if this absence date has approved leave
                    const isAbsentWithoutLeave = r.status === 'absent' && absentDatesWithoutLeave.includes(r.attendance.date);

                    return (
                      <Animated.View key={r.id} entering={FadeInDown.delay(index * 25).duration(260)} style={{ marginBottom: 12 }}>
                        <Card style={isAbsentWithoutLeave ? {
                          borderLeftWidth: 4,
                          borderLeftColor: colors.error,
                        } : undefined}>
                          <View style={styles.rowTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                {courseLabel}
                              </Text>
                              <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                                {formatShortDate(r.attendance.date)} • Period {r.attendance.period}
                                {r.status === 'late' && (r.late_minutes ?? 0) > 0 ? ` • ${r.late_minutes} min` : ''}
                              </Text>
                              {isAbsentWithoutLeave && (
                                <View style={styles.noPermissionBadge}>
                                  <Ionicons name="alert-circle" size={12} color={colors.error} style={{ marginRight: 4 }} />
                                  <Text style={[styles.noPermissionText, { color: colors.error }]}>NO PERMISSION</Text>
                                </View>
                              )}
                            </View>
                            <View style={[styles.chip, { backgroundColor: chipBg }]}>
                              <Text style={[styles.chipText, { color: chipText }]}>{String(r.status).toUpperCase()}</Text>
                            </View>
                          </View>
                        </Card>
                      </Animated.View>
                    );
                  })
                )}
              </>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaveIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  leaveSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    marginTop: 3,
    fontSize: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  warningSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  warningDates: {
    fontSize: 11,
    fontWeight: '700',
  },
  noPermissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  noPermissionText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
