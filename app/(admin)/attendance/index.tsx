import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface AttendanceStats {
  todayMarked: number;
  todayPending: number;
  weekAverage: number;
  lowAttendanceCount: number;
  todayLateCount: number;
  upcomingHolidays: number;
}

interface RecentActivity {
  id: string;
  type: 'marked' | 'edited' | 'holiday';
  description: string;
  time: string;
  performer: string;
}

export default function AttendanceIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    todayMarked: 0,
    todayPending: 0,
    weekAverage: 0,
    lowAttendanceCount: 0,
    todayLateCount: 0,
    upcomingHolidays: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch today's attendance sessions count
      const { count: todayMarked } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      // Fetch today's late count from attendance_records
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('date', today);

      let todayLate = 0;
      if (todayAttendance && todayAttendance.length > 0) {
        const attendanceIds = (todayAttendance as Array<{ id: string }>).map(a => a.id);
        const { count } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .in('attendance_id', attendanceIds)
          .eq('status', 'late');
        todayLate = count || 0;
      }

      // Fetch upcoming holidays
      const { count: upcomingHolidays } = await supabase
        .from('holidays')
        .select('*', { count: 'exact', head: true })
        .gte('date', today);

      // Fetch low attendance students (below 65%)
      // This would need the view, simplified for now
      const lowAttendanceCount = 0;

      // Calculate pending (total expected - marked)
      const { count: totalTimetableEntries } = await supabase
        .from('timetable_entries')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch recent activity logs
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select(`
          id,
          action_type,
          details,
          created_at,
          performed_by,
          profiles:performed_by(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = ((logs || []) as Array<any>).map(log => ({
        id: log.id,
        type: log.action_type as any,
        description: getActionDescription(log.action_type, log.details),
        time: formatTime(log.created_at),
        performer: (log.profiles as any)?.full_name || 'Unknown',
      }));

      setStats({
        todayMarked: todayMarked || 0,
        todayPending: Math.max(0, (totalTimetableEntries || 0) - (todayMarked || 0)),
        weekAverage: 0, // Would calculate from actual data
        lowAttendanceCount,
        todayLateCount: todayLate,
        upcomingHolidays: upcomingHolidays || 0,
      });

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getActionDescription = (action: string, details: any): string => {
    switch (action) {
      case 'marked':
        return `Marked ${details?.status} for Period ${details?.period}`;
      case 'edited':
        return `Changed ${details?.old_status} → ${details?.new_status}`;
      case 'bulk_marked':
        return `Bulk marked ${details?.count} students`;
      case 'holiday_created':
        return `Created holiday: ${details?.title}`;
      default:
        return action.replace('_', ' ');
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const quickActions = [
    {
      id: 'mark',
      title: 'Mark Attendance',
      subtitle: 'Period-wise marking',
      icon: 'clipboard-check',
      color: colors.success,
      route: '/(admin)/attendance/mark',
    },
    {
      id: 'reports',
      title: 'Reports',
      subtitle: 'View attendance reports',
      icon: 'chart-pie',
      color: colors.info,
      route: '/(admin)/attendance/reports',
    },
    {
      id: 'holidays',
      title: 'Holidays',
      subtitle: 'Manage holidays',
      icon: 'calendar-day',
      color: colors.warning,
      route: '/(admin)/attendance/holidays',
      badge: stats.upcomingHolidays,
    },
    {
      id: 'logs',
      title: 'Activity Logs',
      subtitle: 'View all actions',
      icon: 'history',
      color: colors.primary,
      route: '/(admin)/attendance/logs',
    },
  ];

  const statCards = [
    {
      title: 'Marked Today',
      value: stats.todayMarked,
      icon: 'check-circle',
      color: colors.success,
    },
    {
      title: 'Late Today',
      value: stats.todayLateCount,
      icon: 'clock',
      color: colors.warning,
    },
    {
      title: 'Low Attendance',
      value: stats.lowAttendanceCount,
      icon: 'exclamation-triangle',
      color: colors.error,
      subtitle: 'Below 65%',
    },
    {
      title: 'Holidays',
      value: stats.upcomingHolidays,
      icon: 'calendar-check',
      color: colors.info,
      subtitle: 'Upcoming',
    },
  ];

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage student attendance
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
            </View>
          ) : (
            <>
              {/* Stats Grid */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsGrid}>
                {statCards.map((stat, index) => (
                  <View
                    key={stat.title}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.cardBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                  >
                    <View style={[styles.statIcon, { backgroundColor: withAlpha(stat.color, 0.082) }]}>
                      <FontAwesome5 name={stat.icon} size={18} color={stat.color} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                      {stat.value}
                    </Text>
                    <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
                      {stat.title}
                    </Text>
                    {stat.subtitle && (
                      <Text style={[styles.statSubtitle, { color: stat.color }]}>
                        {stat.subtitle}
                      </Text>
                    )}
                  </View>
                ))}
              </Animated.View>

              {/* Quick Actions */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  {quickActions.map((action, index) => (
                    <Animated.View
                      key={action.id}
                      entering={FadeInRight.delay(250 + index * 50).duration(300)}
                    >
                      <TouchableOpacity
                        style={[
                          styles.actionCard,
                          {
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.cardBorder,
                            borderWidth: colors.borderWidth,
                          },
                        ]}
                        onPress={() => router.push(action.route as any)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.actionIcon, { backgroundColor: withAlpha(action.color, 0.082) }]}>
                          <FontAwesome5 name={action.icon} size={22} color={action.color} />
                        </View>
                        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                          {action.title}
                        </Text>
                        <Text style={[styles.actionSubtitle, { color: colors.textMuted }]}>
                          {action.subtitle}
                        </Text>
                        {action.badge !== undefined && action.badge > 0 && (
                          <View style={[styles.actionBadge, { backgroundColor: action.color }]}>
                            <Text style={[styles.actionBadgeText, { color: colors.textInverse }]}>
                              {action.badge}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Alert Banner */}
              {stats.lowAttendanceCount > 0 && (
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                  <Card
                    style={[
                      styles.alertCard,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.cardBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                  >
                    <View style={styles.alertContent}>
                      <FontAwesome5 name="exclamation-circle" size={20} color={colors.error} />
                      <View style={styles.alertText}>
                        <Text style={[styles.alertTitle, { color: colors.error }]}>
                          Low Attendance Alert
                        </Text>
                        <Text style={[styles.alertSubtitle, { color: colors.textSecondary }]}>
                          {stats.lowAttendanceCount} students below 65% threshold
                        </Text>
                      </View>
                    </View>
                    <SolidButton
                      style={[styles.alertBtn, { backgroundColor: colors.error }]}
                      onPress={() => router.push('/(admin)/attendance/reports?filter=low' as any)}
                    >
                      <Text style={[styles.alertBtnText, { color: colors.textInverse }]}>View</Text>
                    </SolidButton>
                  </Card>
                </Animated.View>
              )}

              {/* Recent Activity */}
              <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Recent Activity
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(admin)/attendance/logs' as any)}>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                  </TouchableOpacity>
                </View>

                {recentActivities.length === 0 ? (
                  <View style={styles.emptyActivity}>
                    <FontAwesome5 name="history" size={32} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      No recent activity
                    </Text>
                  </View>
                ) : (
                  recentActivities.map((activity, index) => (
                    <Animated.View
                      key={activity.id}
                      entering={FadeInRight.delay(400 + index * 30).duration(300)}
                    >
                      <View
                        style={[
                          styles.activityItem,
                          {
                            backgroundColor: colors.cardBackground,
                            borderColor: colors.cardBorder,
                            borderWidth: colors.borderWidth,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.activityIcon,
                            {
                              backgroundColor: withAlpha(
                                activity.type === 'marked'
                                  ? colors.success
                                  : activity.type === 'edited'
                                  ? colors.warning
                                  : colors.info,
                                0.082
                              ),
                            },
                          ]}
                        >
                          <FontAwesome5
                            name={
                              activity.type === 'marked'
                                ? 'check'
                                : activity.type === 'edited'
                                ? 'edit'
                                : 'calendar'
                            }
                            size={12}
                            color={
                              activity.type === 'marked'
                                ? colors.success
                                : activity.type === 'edited'
                                ? colors.warning
                                : colors.info
                            }
                          />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={[styles.activityDesc, { color: colors.textPrimary }]}>
                            {activity.description}
                          </Text>
                          <Text style={[styles.activityMeta, { color: colors.textMuted }]}>
                            {activity.performer} • {activity.time}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  ))
                )}
              </Animated.View>

              {/* Today's Summary */}
              <Animated.View entering={FadeInDown.delay(450).duration(400)}>
                <Card style={styles.summaryCard}>
                  <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                    Today's Summary
                  </Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: colors.success }]}>
                        {stats.todayMarked}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                        Marked
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.summaryDivider,
                        { backgroundColor: withAlpha(colors.textMuted, 0.125) },
                      ]}
                    />
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: colors.warning }]}>
                        {stats.todayLateCount}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                        Late
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.summaryDivider,
                        { backgroundColor: withAlpha(colors.textMuted, 0.125) },
                      ]}
                    />
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: colors.textSecondary }]}>
                        {stats.todayPending}
                      </Text>
                      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                        Pending
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            </>
          )}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  loadingText: { marginTop: 12, fontSize: 14 },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 28, fontWeight: '700' },
  statTitle: { fontSize: 12, marginTop: 4 },
  statSubtitle: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  // Section
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: 155,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: { fontSize: 14, fontWeight: '600' },
  actionSubtitle: { fontSize: 11, marginTop: 2 },
  actionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  actionBadgeText: { fontSize: 10, fontWeight: '700' },
  // Alert Card
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  alertContent: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  alertText: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '600' },
  alertSubtitle: { fontSize: 12, marginTop: 2 },
  alertBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertBtnText: { fontSize: 12, fontWeight: '600' },
  // Activity
  emptyActivity: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { marginTop: 10, fontSize: 13 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: { flex: 1 },
  activityDesc: { fontSize: 13, fontWeight: '500' },
  activityMeta: { fontSize: 11, marginTop: 2 },
  // Summary Card
  summaryCard: { padding: 20 },
  summaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 26, fontWeight: '700' },
  summaryLabel: { fontSize: 11, marginTop: 4 },
  summaryDivider: { width: 1, height: 40 },
});
