import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, ThemeToggle } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

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

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  iconType: 'fa5' | 'ion' | 'mci';
  color: string;
  route: string;
  badge?: number;
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile, primaryRole, user, logout } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalDepartments: 0,
    totalCourses: 0,
    pendingApprovals: 0,
    todayAttendance: 0,
  });

  const quickActions: QuickAction[] = [
    {
      id: 'pending',
      title: 'Pending Approvals',
      icon: 'user-clock',
      iconType: 'fa5',
      color: '#f59e0b',
      route: '/(admin)/users/pending',
      badge: stats.pendingApprovals,
    },
    {
      id: 'teachers',
      title: 'Manage Teachers',
      icon: 'chalkboard-teacher',
      iconType: 'fa5',
      color: '#10b981',
      route: '/(admin)/users/teachers',
    },
    {
      id: 'departments',
      title: 'Departments',
      icon: 'building',
      iconType: 'fa5',
      color: '#6366f1',
      route: '/(admin)/academic/departments',
    },
    {
      id: 'exams',
      title: 'Exam Cell',
      icon: 'file-document-edit',
      iconType: 'mci',
      color: '#ef4444',
      route: '/(admin)/exams',
    },
    {
      id: 'timetable',
      title: 'Timetable',
      icon: 'calendar-alt',
      iconType: 'fa5',
      color: '#8b5cf6',
      route: '/(admin)/timetable',
    },
    {
      id: 'library',
      title: 'Library',
      icon: 'library',
      iconType: 'ion',
      color: '#06b6d4',
      route: '/(admin)/library',
    },
    {
      id: 'bus',
      title: 'Bus Routes',
      icon: 'bus-alt',
      iconType: 'fa5',
      color: '#f97316',
      route: '/(admin)/bus',
    },
    {
      id: 'fees',
      title: 'Fee Management',
      icon: 'cash',
      iconType: 'ion',
      color: '#22c55e',
      route: '/(admin)/fees',
    },
  ];

  const fetchStats = async () => {
    try {
      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('current_status', 'active');

      // Fetch teachers count
      const { count: teachersCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch departments count
      const { count: deptsCount } = await supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch courses count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch pending approvals
      const { count: pendingCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('current_status', 'inactive');

      setStats({
        totalStudents: studentsCount || 0,
        totalTeachers: teachersCount || 0,
        totalDepartments: deptsCount || 0,
        totalCourses: coursesCount || 0,
        pendingApprovals: pendingCount || 0,
        todayAttendance: 85, // Placeholder
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await signOut();
    logout();
    router.replace('/(auth)/login');
  };

  const renderStatCard = (
    title: string,
    value: number,
    icon: string,
    color: string,
    delay: number
  ) => (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[styles.statCard, { width: cardWidth }]}
    >
      <LinearGradient
        colors={isDark ? [`${color}20`, `${color}10`] : [`${color}15`, `${color}05`]}
        style={styles.statCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
          <FontAwesome5 name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      </LinearGradient>
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
        entering={FadeInRight.delay(300 + index * 50).duration(300)}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            },
          ]}
          onPress={() => router.push(action.route as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}15` }]}>
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
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {profile?.full_name || 'Admin'}
            </Text>
            <View style={styles.roleTag}>
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
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Students', stats.totalStudents, 'user-graduate', '#6366f1', 200)}
            {renderStatCard('Teachers', stats.totalTeachers, 'chalkboard-teacher', '#10b981', 250)}
            {renderStatCard('Departments', stats.totalDepartments, 'building', '#f59e0b', 300)}
            {renderStatCard('Courses', stats.totalCourses, 'book', '#ef4444', 350)}
          </View>
        </Animated.View>

        {/* Pending Approvals Alert */}
        {stats.pendingApprovals > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() => router.push('/(admin)/users/pending' as any)}
            >
              <LinearGradient
                colors={['#f59e0b20', '#f59e0b10']}
                style={styles.alertGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.alertIcon}>
                  <FontAwesome5 name="exclamation-circle" size={24} color="#f59e0b" />
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
        <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => renderQuickAction(action, index))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          <GlassCard style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#10b981' }]} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: colors.textPrimary }]}>
                  New student registration
                </Text>
                <Text style={[styles.activityTime, { color: colors.textMuted }]}>2 min ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#6366f1' }]} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: colors.textPrimary }]}>
                  Exam timetable published
                </Text>
                <Text style={[styles.activityTime, { color: colors.textMuted }]}>1 hour ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#f59e0b' }]} />
              <View style={styles.activityContent}>
                <Text style={[styles.activityText, { color: colors.textPrimary }]}>
                  Fee reminder sent to 45 students
                </Text>
                <Text style={[styles.activityTime, { color: colors.textMuted }]}>3 hours ago</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
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
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutBtn: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statTitle: {
    fontSize: 13,
    marginTop: 4,
  },
  alertCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: cardWidth,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
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
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
});
