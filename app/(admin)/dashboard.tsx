import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, SlideInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassCard, IconBadge, StatCard, LoadingIndicator } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';
import { withAlpha } from '../../theme/colorUtils';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  totalCourses: number;
  pendingApprovals: number;
  todayAttendance: number;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  color: string;
  user_name?: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  iconType: 'fa5' | 'ion' | 'mci';
  route: string;
  badge?: number;
  module?: string;
  permission?: string;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile, primaryRole, user, logout } = useAuthStore();
  const { hasPermission, canAccessModule, accessibleModules, loading: rbacLoading } = useRBAC();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    totalCourses: 0,
    pendingApprovals: 0,
    todayAttendance: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'reception',
      title: 'Reception',
      icon: 'id-card',
      iconType: 'fa5',
      route: '/(admin)/reception',
      module: 'reception',
    },
    {
      id: 'students',
      title: 'Manage Students',
      icon: 'user-graduate',
      iconType: 'fa5',
      route: '/(admin)/users?tab=students',
      module: 'users',
      permission: PERMISSIONS.VIEW_ALL_USERS,
    },
    {
      id: 'teachers',
      title: 'Manage Teachers',
      icon: 'chalkboard-teacher',
      iconType: 'fa5',
      route: '/(admin)/users?tab=teachers',
      module: 'users',
      permission: PERMISSIONS.VIEW_ALL_USERS,
    },
    {
      id: 'pending',
      title: 'Pending Approvals',
      icon: 'user-clock',
      iconType: 'fa5',
      route: '/(admin)/users?tab=pending',
      badge: stats.pendingApprovals,
      module: 'users',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: 'clipboard-check',
      iconType: 'fa5',
      route: '/(admin)/attendance',
      module: 'attendance',
    },
    {
      id: 'exams',
      title: 'Exams',
      icon: 'file-alt',
      iconType: 'fa5',
      route: '/(admin)/exams',
      module: 'exams',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      icon: 'tasks',
      iconType: 'fa5',
      route: '/(admin)/assignments',
      module: 'assignments',
    },
    {
      id: 'fees',
      title: 'Fee Management',
      icon: 'money-bill-wave',
      iconType: 'fa5',
      route: '/(admin)/fees',
      module: 'fees',
    },
    {
      id: 'library',
      title: 'Library',
      icon: 'book',
      iconType: 'fa5',
      route: '/(admin)/library',
      module: 'library',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      icon: 'calendar-alt',
      iconType: 'fa5',
      route: '/(admin)/timetable',
      module: 'academic',
    },
    {
      id: 'departments',
      title: 'Departments',
      icon: 'building',
      iconType: 'fa5',
      route: '/(admin)/academic',
      module: 'academic',
      permission: PERMISSIONS.MANAGE_ACADEMIC_STRUCTURE,
    },
    {
      id: 'courses',
      title: 'Courses/Degrees',
      icon: 'book-open',
      iconType: 'fa5',
      route: '/(admin)/academic',
      module: 'academic',
      permission: PERMISSIONS.MANAGE_ACADEMIC_STRUCTURE,
    },
    {
      id: 'notices',
      title: 'Notices',
      icon: 'bullhorn',
      iconType: 'fa5',
      route: '/(admin)/notices',
      module: 'notices',
    },
    {
      id: 'role-management',
      title: 'Role Management',
      icon: 'user-shield',
      iconType: 'fa5',
      route: '/(admin)/users/assign-roles',
      module: 'users',
      permission: PERMISSIONS.CREATE_DELETE_ADMINS,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'cog',
      iconType: 'fa5',
      route: '/(admin)/settings',
      module: 'dashboard',
    },
  ];

  const fetchStats = async () => {
    try {
      setStatsError(null);
      
      // Run ALL queries in parallel for faster loading
      const [
        studentsResult,
        teachersResult,
        deptsResult,
        coursesResult,
        pendingResult,
        studentProfilesResult,
        teacherProfilesResult
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('departments').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true).not('program_type', 'is', null),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('primary_role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('primary_role', ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod'])
      ]);

      // Use whichever count is higher (from specific table or profiles)
      const finalStudentsCount = Math.max(studentsResult.count || 0, studentProfilesResult.count || 0);
      const finalTeachersCount = Math.max(teachersResult.count || 0, teacherProfilesResult.count || 0);

      setStats({
        totalStudents: finalStudentsCount,
        totalTeachers: finalTeachersCount,
        totalDepartments: deptsResult.count || 0,
        totalCourses: coursesResult.count || 0,
        pendingApprovals: pendingResult.count || 0,
        todayAttendance: 85, // Placeholder
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStatsError('Unable to load overview stats. Pull to refresh or retry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setActivitiesError(null);
      setActivitiesLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          table_name,
          created_at,
          user_id,
          profiles:user_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const activities: RecentActivity[] = (data || []).map((log: any) => {
        const actionColors: { [key: string]: string } = {
          INSERT: colors.success,
          UPDATE: colors.info,
          DELETE: colors.error,
        };

        const actionLabels: { [key: string]: string } = {
          INSERT: 'created',
          UPDATE: 'updated',
          DELETE: 'deleted',
        };

        const tableName = log.table_name?.replace('_', ' ') || 'record';
        const userName = (log.profiles as any)?.full_name || 'Someone';

        return {
          id: log.id,
          action: log.action,
          description: `${userName} ${actionLabels[log.action] || log.action} ${tableName}`,
          timestamp: log.created_at,
          color: actionColors[log.action] || colors.warning,
          user_name: userName,
        };
      });

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setActivitiesError('Unable to load recent activity.');
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchRecentActivities()]).finally(() => setLastUpdatedAt(new Date()));

    // Set up real-time subscription for audit logs
    const channel = supabase
      .channel('dashboard-activities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs',
        },
        () => {
          fetchRecentActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchRecentActivities()]);
    setLastUpdatedAt(new Date());
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await signOut();
    logout();
    router.replace('/(auth)/login');
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Filter quick actions based on user's module access and permissions
  const visibleActions = rbacLoading ? quickActions : quickActions.filter(action => {
    // If action has a module requirement, check module access
    if (action.module) {
      const hasModuleAccess = canAccessModule(action.module);
      if (!hasModuleAccess) return false;
    }
    
    // If action has a specific permission requirement, check it
    if (action.permission) {
      return hasPermission(action.permission);
    }
    
    // If no specific requirements, show it (like settings, dashboard)
    return true;
  });

  const renderStatCard = (
    title: string,
    value: number,
    icon: string,
    delay: number,
    route?: string
  ) => (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify().damping(16)}
      style={[styles.statCard, { width: cardWidth }]}
    >
      <StatCard
        title={title}
        value={value}
        loading={loading}
        onPress={route ? () => router.push(route as any) : undefined}
        tone="primary"
        icon={{ family: 'fa5', name: icon }}
      />
    </Animated.View>
  );

  const renderQuickAction = (action: QuickAction, index: number) => {
    return (
      <Animated.View
        key={action.id}
        entering={SlideInRight.delay(300 + index * 60).duration(400).springify().damping(18)}
      >
        <TouchableOpacity
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.7}
        >
          <GlassCard intensity={20} noPadding style={styles.actionButton}>
            <View style={styles.actionButtonInner}>
              <IconBadge
                family={action.iconType}
                name={action.icon}
                tone="primary"
                style={styles.actionIconContainer}
              />
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {action.title}
              </Text>
              {action.badge && action.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={[styles.badgeText, { color: colors.textInverse }]}>{action.badge}</Text>
                </View>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {profile?.full_name || 'Admin'}
            </Text>
            <View style={[styles.roleTag, { backgroundColor: withAlpha(colors.primary, isDark ? 0.15 : 0.1) }]}>
              <FontAwesome5 name="shield-alt" size={10} color={colors.primary} />
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {primaryRole?.replace('_', ' ').toUpperCase() || 'ADMIN'}
              </Text>
            </View>
            {lastUpdatedAt && (
              <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
                Updated {getTimeAgo(lastUpdatedAt.toISOString())}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        {canAccessModule('users') && (
          <Animated.View entering={FadeInDown.delay(150).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
            {!!statsError && (
              <Card
                style={[
                  styles.inlineErrorCard,
                  {
                    backgroundColor: withAlpha(colors.warning, isDark ? 0.12 : 0.08),
                    borderColor: withAlpha(colors.warning, isDark ? 0.2 : 0.16),
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="warning-outline" size={18} color={colors.warning} />
                  <Text style={[styles.inlineErrorText, { color: colors.textPrimary }]}>{statsError}</Text>
                </View>
                <TouchableOpacity style={styles.inlineErrorAction} onPress={onRefresh} activeOpacity={0.75}>
                  <Text style={[styles.inlineErrorActionText, { color: colors.primary }]}>Retry</Text>
                </TouchableOpacity>
              </Card>
            )}
            <View style={styles.statsGrid}>
              {renderStatCard('Students', stats.totalStudents, 'user-graduate', 200, '/(admin)/users?tab=students')}
              {renderStatCard('Teachers', stats.totalTeachers, 'chalkboard-teacher', 260, '/(admin)/users?tab=teachers')}
              {renderStatCard('Departments', stats.totalDepartments, 'building', 320, '/(admin)/academic?tab=departments')}
              {renderStatCard('Courses', stats.totalCourses, 'book', 380, '/(admin)/academic')}
            </View>
          </Animated.View>
        )}

        {/* Pending Approvals Alert */}
        {canAccessModule('users') && stats.pendingApprovals > 0 && (
          <Animated.View entering={FadeInDown.delay(440).duration(500).springify()}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => router.push('/(admin)/users/pending' as any)}
            >
              <View
                style={[
                  styles.alertGradient,
                  {
                    backgroundColor: withAlpha(colors.warning, isDark ? 0.12 : 0.08),
                    borderColor: withAlpha(colors.warning, isDark ? 0.18 : 0.14),
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <IconBadge family="fa5" name="exclamation-circle" tone="warning" size={22} style={styles.alertIcon} />
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>Pending Approvals</Text>
                  <Text style={[styles.alertSubtitle, { color: colors.textSecondary }]}>
                    {stats.pendingApprovals} student(s) waiting for approval
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Quick Actions */}
        {visibleActions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {visibleActions.map((action, index) => renderQuickAction(action, index))}
            </View>
          </Animated.View>
        )}

        {/* Recent Activity */}
        {canAccessModule('users') && (
          <Animated.View entering={FadeInDown.delay(560).duration(500).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <Card style={styles.activityCard}>
              {activitiesLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <LoadingIndicator size="small" color={colors.primary} />
                </View>
              ) : activitiesError ? (
                <View style={{ padding: 16 }}>
                  <View style={styles.inlineErrorRow}>
                    <Ionicons name="warning-outline" size={18} color={colors.warning} />
                    <Text style={[styles.inlineErrorText, { color: colors.textPrimary }]}>{activitiesError}</Text>
                  </View>
                  <TouchableOpacity style={styles.inlineErrorAction} onPress={fetchRecentActivities} activeOpacity={0.75}>
                    <Text style={[styles.inlineErrorActionText, { color: colors.primary }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : recentActivities.length === 0 ? (
                <View style={styles.activityItem}>
                  <Text style={[styles.activityText, { color: colors.textSecondary }]}>
                    No recent activity
                  </Text>
                </View>
              ) : (
                recentActivities.map((activity, index) => {
                  const timeAgo = getTimeAgo(activity.timestamp);
                  return (
                    <View
                      key={activity.id}
                      style={[
                        styles.activityItem,
                        { borderBottomColor: colors.cardBorder, borderBottomWidth: colors.borderWidth },
                        index === recentActivities.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={[styles.activityDot, { backgroundColor: activity.color }]} />
                      <View style={styles.activityContent}>
                        <Text style={[styles.activityText, { color: colors.textPrimary }]}>
                          {activity.description}
                        </Text>
                        <Text style={[styles.activityTime, { color: colors.textMuted }]}>
                          {timeAgo}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
          </Card>
        </Animated.View>
        )}

        {/* Module-specific Welcome Message for non-users access */}
        {!canAccessModule('users') && visibleActions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.section}>
            <Card style={styles.welcomeCard}>
              <View style={[styles.welcomeIcon, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
                <FontAwesome5 name="hand-sparkles" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
                Welcome, {profile?.full_name}!
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                Access your modules through Quick Actions below
              </Text>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdated: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 3,
    letterSpacing: -0.3,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoutBtn: {
    padding: 10,
  },
  section: {
    marginBottom: 28,
  },
  inlineErrorCard: {
    marginTop: 12,
    marginBottom: 8,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  inlineErrorAction: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  inlineErrorActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 18,
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    borderRadius: 16,
  },
  alertCard: {
    marginBottom: 28,
    borderRadius: 20,
    overflow: 'hidden',
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  alertIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  actionButton: {
    width: cardWidth,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 26,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityCard: {
    padding: 0,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  activityDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 13,
    marginTop: 2,
  },
  welcomeCard: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
