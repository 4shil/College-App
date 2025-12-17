import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, ThemeToggle } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';

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

interface StatCardConfig {
  title: string;
  value: number;
  icon: string;
  color: string;
  route: string;
}

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  iconType: 'fa5' | 'ion' | 'mci';
  color: string;
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

  // Stat cards configuration with navigation routes
  const statCards: StatCardConfig[] = [
    { 
      title: 'Students', 
      value: stats.totalStudents, 
      icon: 'user-graduate', 
      color: '#8B5CF6',
      route: '/(admin)/users?tab=students'
    },
    { 
      title: 'Teachers', 
      value: stats.totalTeachers, 
      icon: 'chalkboard-teacher', 
      color: '#16A34A',
      route: '/(admin)/users?tab=teachers'
    },
    { 
      title: 'Departments', 
      value: stats.totalDepartments, 
      icon: 'building', 
      color: '#06B6D4',
      route: '/(admin)/academic'
    },
    { 
      title: 'Courses', 
      value: stats.totalCourses, 
      icon: 'book', 
      color: '#6366F1',
      route: '/(admin)/academic'
    },
  ];

  const quickActions: QuickAction[] = [
    {
      id: 'students',
      title: 'Manage Students',
      icon: 'user-graduate',
      iconType: 'fa5',
      color: '#8B5CF6',
      route: '/(admin)/users?tab=students',
      module: 'users',
      permission: PERMISSIONS.VIEW_ALL_USERS,
    },
    {
      id: 'teachers',
      title: 'Manage Teachers',
      icon: 'chalkboard-teacher',
      iconType: 'fa5',
      color: '#16A34A',
      route: '/(admin)/users?tab=teachers',
      module: 'users',
      permission: PERMISSIONS.VIEW_ALL_USERS,
    },
    {
      id: 'pending',
      title: 'Pending Approvals',
      icon: 'user-clock',
      iconType: 'fa5',
      color: '#F59E0B',
      route: '/(admin)/users?tab=pending',
      badge: stats.pendingApprovals,
      module: 'users',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: 'clipboard-check',
      iconType: 'fa5',
      color: '#10B981',
      route: '/(admin)/attendance',
      module: 'attendance',
    },
    {
      id: 'exams',
      title: 'Exams',
      icon: 'file-alt',
      iconType: 'fa5',
      color: '#F59E0B',
      route: '/(admin)/exams',
      module: 'exams',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      icon: 'tasks',
      iconType: 'fa5',
      color: '#10B981',
      route: '/(admin)/assignments',
      module: 'assignments',
    },
    {
      id: 'fees',
      title: 'Fee Management',
      icon: 'money-bill-wave',
      iconType: 'fa5',
      color: '#16A34A',
      route: '/(admin)/fees',
      module: 'fees',
    },
    {
      id: 'library',
      title: 'Library',
      icon: 'book',
      iconType: 'fa5',
      color: '#6366F1',
      route: '/(admin)/library',
      module: 'library',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      icon: 'calendar-alt',
      iconType: 'fa5',
      color: '#EC4899',
      route: '/(admin)/timetable',
      module: 'academic',
    },
    {
      id: 'departments',
      title: 'Departments',
      icon: 'building',
      iconType: 'fa5',
      color: '#06B6D4',
      route: '/(admin)/academic',
      module: 'academic',
      permission: PERMISSIONS.MANAGE_ACADEMIC_STRUCTURE,
    },
    {
      id: 'courses',
      title: 'Courses/Degrees',
      icon: 'book-open',
      iconType: 'fa5',
      color: '#6366F1',
      route: '/(admin)/academic',
      module: 'academic',
      permission: PERMISSIONS.MANAGE_ACADEMIC_STRUCTURE,
    },
    {
      id: 'notices',
      title: 'Notices',
      icon: 'bullhorn',
      iconType: 'fa5',
      color: '#F97316',
      route: '/(admin)/notices',
      module: 'notices',
    },
    {
      id: 'role-management',
      title: 'Role Management',
      icon: 'user-shield',
      iconType: 'fa5',
      color: '#DC2626',
      route: '/(admin)/users/assign-roles',
      module: 'users',
      permission: PERMISSIONS.CREATE_DELETE_ADMINS,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'cog',
      iconType: 'fa5',
      color: '#64748B',
      route: '/(admin)/settings',
      module: 'dashboard',
    },
  ];

  const fetchStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      
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

      console.log('Final counts - Students:', finalStudentsCount, 'Teachers:', finalTeachersCount, 'Depts:', deptsResult.count, 'Courses:', coursesResult.count);

      setStats({
        totalStudents: finalStudentsCount,
        totalTeachers: finalTeachersCount,
        totalDepartments: deptsResult.count || 0,
        totalCourses: coursesResult.count || 0,
        pendingApprovals: pendingResult.count || 0,
        todayAttendance: 85, // Placeholder
      });
      
      console.log('Stats updated successfully');
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
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
          INSERT: '#16A34A',
          UPDATE: '#8B5CF6',
          DELETE: '#DC2626',
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
          color: actionColors[log.action] || '#F59E0B',
          user_name: userName,
        };
      });

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentActivities();

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
    color: string,
    delay: number,
    route?: string
  ) => (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500).springify().damping(16)}
      style={[styles.statCard, { width: cardWidth }]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => route && router.push(route as any)}
        disabled={!route}
      >
        <LinearGradient
          colors={isDark ? [`${color}20`, `${color}08`] : [`${color}12`, `${color}05`]}
          style={styles.statCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.statIconContainer, { backgroundColor: `${color}18` }]}>
            <FontAwesome5 name={icon} size={20} color={color} />
          </View>
          {loading ? (
            <ActivityIndicator size="small" color={color} style={{ marginVertical: 10 }} />
          ) : (
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
          )}
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderQuickAction = (action: QuickAction, index: number) => {
    const IconComponent =
      action.iconType === 'fa5'
        ? FontAwesome5
        : action.iconType === 'ion'
        ? Ionicons
        : MaterialCommunityIcons;

    return (
      <Animated.View
        key={action.id}
        entering={SlideInRight.delay(300 + index * 60).duration(400).springify().damping(18)}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            },
          ]}
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}12` }]}>
            <IconComponent name={action.icon as any} size={22} color={action.color} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {action.title}
          </Text>
          {action.badge && action.badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{action.badge}</Text>
            </View>
          )}
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
            <View style={[styles.roleTag, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.1)' }]}>
              <FontAwesome5 name="shield-alt" size={10} color={colors.primary} />
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {primaryRole?.replace('_', ' ').toUpperCase() || 'ADMIN'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <ThemeToggle />
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        {canAccessModule('users') && (
          <Animated.View entering={FadeInDown.delay(150).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
            <View style={styles.statsGrid}>
              {renderStatCard('Students', stats.totalStudents, 'user-graduate', '#8B5CF6', 200, '/(admin)/users?tab=students')}
              {renderStatCard('Teachers', stats.totalTeachers, 'chalkboard-teacher', '#16A34A', 260, '/(admin)/users?tab=teachers')}
              {renderStatCard('Departments', stats.totalDepartments, 'building', '#06B6D4', 320, '/(admin)/academic?tab=departments')}
              {renderStatCard('Courses', stats.totalCourses, 'book', '#6366F1', 380, '/(admin)/academic')}
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
              <LinearGradient
                colors={isDark ? ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)'] : ['rgba(245, 158, 11, 0.12)', 'rgba(245, 158, 11, 0.04)']}
                style={styles.alertGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.alertIcon}>
                  <FontAwesome5 name="exclamation-circle" size={24} color="#F59E0B" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                    Pending Approvals
                  </Text>
                  <Text style={[styles.alertSubtitle, { color: colors.textSecondary }]}>
                    {stats.pendingApprovals} student(s) waiting for approval
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </LinearGradient>
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
                  <ActivityIndicator size="small" color={colors.primary} />
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
              <View style={[styles.welcomeIcon, { backgroundColor: colors.primary + '20' }]}>
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
    borderRadius: 20,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statTitle: {
    fontSize: 13,
    marginTop: 5,
    fontWeight: '500',
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
    borderColor: 'rgba(245, 158, 11, 0.18)',
  },
  alertIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
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
    backgroundColor: '#DC2626',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 26,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
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
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
