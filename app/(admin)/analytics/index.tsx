import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const { width } = Dimensions.get('window');

interface Analytics {
  totalStudents: number | null;
  totalTeachers: number | null;
  totalCourses: number | null;
  totalDepartments: number | null;
  activeStudents: number | null;
  pendingApprovals: number | null;
  todayAttendance: number | null;
  avgAttendance: number | null;
  upcomingExams: number | null;
  pendingAssignments: number | null;
  libraryBooks: number | null;
  activeNotices: number | null;
}

interface DepartmentData {
  department_id: string;
  department_name: string;
  student_count: number;
}

interface AttendanceData {
  month: string;
  rate: number;
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  
  const [loading, setLoading] = useState(true);
  const [isRealtime, setIsRealtime] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [analytics, setAnalytics] = useState<Analytics>({
    totalStudents: null,
    totalTeachers: null,
    totalCourses: null,
    totalDepartments: null,
    activeStudents: null,
    pendingApprovals: null,
    todayAttendance: null,
    avgAttendance: null,
    upcomingExams: null,
    pendingAssignments: null,
    libraryBooks: null,
    activeNotices: null,
  });

  const [departmentDistribution, setDepartmentDistribution] = useState<DepartmentData[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceData[]>([]);

  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
    
    if (isRealtime) {
      setupRealtimeSubscriptions();
      // Refresh every 30 seconds
      refreshIntervalRef.current = setInterval(() => {
        fetchAnalytics();
      }, 30000);
    }

    return () => {
      cleanupSubscriptions();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [selectedPeriod, isRealtime]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to changes in key tables for comprehensive realtime analytics
    const tables = [
      'profiles',
      'courses',
      'departments',
      'notices',
      'attendance',
      'attendance_records',
      'exams',
      'assignments',
      'books',
    ];
    
    tables.forEach(table => {
      const channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            console.log(`Change detected in ${table}:`, payload.eventType);
            fetchAnalytics();
            setLastUpdate(new Date());
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✓ Subscribed to ${table} changes`);
          }
        });
      
      channelsRef.current.push(channel);
    });
  };

  const cleanupSubscriptions = () => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Get today's date range for attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowISO = tomorrow.toISOString();

      // Calculate date range based on selected period
      const periodStart = new Date();
      if (selectedPeriod === 'week') {
        periodStart.setDate(periodStart.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        periodStart.setMonth(periodStart.getMonth() - 1);
      } else {
        periodStart.setFullYear(periodStart.getFullYear() - 1);
      }

      // Fetch all analytics in parallel - simple counts
      const [
        allProfilesRes,
        coursesRes,
        departmentsRes,
        pendingRes,
        noticesRes,
        attendanceRes,
        avgAttendanceRes,
        examsRes,
        assignmentsRes,
        booksRes,
      ] = await Promise.all([
        // Get all profiles to count students and teachers
        supabase.from('profiles').select('id, primary_role, status, department_id'),
        supabase.from('courses').select('id', { count: 'exact' }).eq('is_active', true),
        // Only count active departments (inactive/legacy rows should not affect analytics).
        supabase.from('departments').select('id, name', { count: 'exact' }).eq('is_active', true),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('notices').select('id', { count: 'exact' }).eq('is_active', true),
        // Today's attendance records
        supabase.from('attendance_records').select('id, status', { count: 'exact' }).gte('marked_at', todayISO).lt('marked_at', tomorrowISO),
        // Average attendance calculation for selected period
        supabase.from('attendance_records').select('status, marked_at').gte('marked_at', periodStart.toISOString()),
        // Upcoming exams (future exams)
        supabase.from('exams').select('id', { count: 'exact' }).gte('start_date', new Date().toISOString()),
        // Active assignments
        supabase.from('assignments').select('id', { count: 'exact' }).eq('status', 'active'),
        // Total library books
        supabase.from('books').select('id', { count: 'exact' }),
      ]);

      // Handle errors
      if (allProfilesRes.error) {
        console.error('Profiles query error:', allProfilesRes.error);
      }

      const allProfiles = allProfilesRes.data || [];
      
      // Count students and teachers from profiles
      const students = allProfiles.filter((p: any) => p.primary_role === 'student');
      const teachers = allProfiles.filter((p: any) => 
        ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod'].includes(p.primary_role)
      );
      // Profiles.status is a UserStatus enum (see `types/database.ts`).
      // Treat `active` as the “approved/active student” state for analytics.
      const activeStudents = students.filter((s: any) => s.status === 'active').length;
      
      const totalStudents = students.length;
      const totalTeachers = teachers.length;

      // Calculate today's attendance percentage
      const todayAttendanceData = attendanceRes.data || [];
      const todayPresent = todayAttendanceData.filter((a: { status: string }) => a.status === 'present').length;
      const todayTotal = todayAttendanceData.length;
      const todayAttendancePercent = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : null;

      // Calculate average attendance for selected period
      const allAttendanceData = avgAttendanceRes.data || [];
      const totalPresent = allAttendanceData.filter((a: { status: string }) => a.status === 'present').length;
      const totalAttendance = allAttendanceData.length;
      const avgAttendancePercent = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : null;

      // Get department distribution from profiles
      const deptMap = new Map<string, number>();
      students.forEach((student: any) => {
        if (student.status === 'active' && student.department_id) {
          const deptId = student.department_id;
          deptMap.set(deptId, (deptMap.get(deptId) || 0) + 1);
        }
      });

      // Match department IDs with names
      const departmentsData = departmentsRes.data || [];
      const deptDistribution: DepartmentData[] = [];
      
      deptMap.forEach((count, deptId) => {
        const dept = departmentsData.find((d: any) => d.id === deptId);
        if (dept) {
          deptDistribution.push({
            department_id: deptId,
            department_name: dept.name,
            student_count: count,
          });
        }
      });

      deptDistribution.sort((a, b) => b.student_count - a.student_count);
      const topDepartments = deptDistribution.slice(0, 5);

      // Process attendance trends by month
      const monthMap = new Map<string, { present: number; total: number }>();
      allAttendanceData.forEach((record: any) => {
        const date = new Date(record.marked_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { present: 0, total: 0 });
        }
        
        const stats = monthMap.get(monthKey)!;
        stats.total++;
        if (record.status === 'present') {
          stats.present++;
        }
      });

      const attendanceTrendsData: AttendanceData[] = Array.from(monthMap.entries())
        .map(([month, stats]) => ({
          month,
          rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
        }))
        .slice(-4); // Last 4 months

      setAnalytics({
        totalStudents: totalStudents > 0 ? totalStudents : null,
        totalTeachers: totalTeachers > 0 ? totalTeachers : null,
        totalCourses: coursesRes.count ?? null,
        totalDepartments: departmentsRes.count ?? null,
        activeStudents: activeStudents > 0 ? activeStudents : null,
        pendingApprovals: pendingRes.count ?? null,
        todayAttendance: todayAttendancePercent,
        avgAttendance: avgAttendancePercent,
        upcomingExams: examsRes.count ?? null,
        pendingAssignments: assignmentsRes.count ?? null,
        libraryBooks: booksRes.count ?? null,
        activeNotices: noticesRes.count ?? null,
      });

      setDepartmentDistribution(topDepartments);
      setAttendanceTrends(attendanceTrendsData);
    } catch (error: any) {
      console.error('Error fetching analytics:', error.message);
      // Set null values on error to indicate no data
      setAnalytics({
        totalStudents: null,
        totalTeachers: null,
        totalCourses: null,
        totalDepartments: null,
        activeStudents: null,
        pendingApprovals: null,
        todayAttendance: null,
        avgAttendance: null,
        upcomingExams: null,
        pendingAssignments: null,
        libraryBooks: null,
        activeNotices: null,
      });
      setDepartmentDistribution([]);
      setAttendanceTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    subtitle, 
    trend,
    delay = 0 
  }: { 
    title: string; 
    value: number | string | null; 
    icon: string; 
    color: string; 
    subtitle?: string;
    trend?: string;
    delay?: number;
  }) => (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statCardWrapper}>
      <Card style={styles.statCard}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <FontAwesome5 name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>
            {value !== null ? value : '—'}
          </Text>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
          {subtitle && value !== null && (
            <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
          {value === null && (
            <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>No data</Text>
          )}
          {trend && value !== null && (
            <View style={styles.trendContainer}>
              <FontAwesome5 
                name={trend.startsWith('+') ? 'arrow-up' : 'arrow-down'} 
                size={10} 
                color={trend.startsWith('+') ? '#10B981' : '#EF4444'} 
              />
              <Text style={[styles.trendText, { 
                color: trend.startsWith('+') ? '#10B981' : '#EF4444' 
              }]}>
                {trend}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Animated.View>
  );

  const ChartCard = ({ 
    title, 
    icon, 
    color, 
    data,
    delay = 0 
  }: { 
    title: string; 
    icon: string; 
    color: string; 
    data: { label: string; value: number; percentage: number }[];
    delay?: number;
  }) => (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.chartCardWrapper}>
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View style={[styles.chartIcon, { backgroundColor: `${color}20` }]}>
            <FontAwesome5 name={icon} size={18} color={color} />
          </View>
          <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        <View style={styles.chartContent}>
          {data.map((item, index) => (
            <View key={index} style={styles.chartRow}>
              <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <View style={styles.chartBarContainer}>
                <View 
                  style={[
                    styles.chartBar, 
                    { 
                      width: `${item.percentage}%`,
                      backgroundColor: color 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.chartValue, { color: colors.textPrimary }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </Animated.View>
  );

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading analytics...
            </Text>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <FontAwesome5 name="arrow-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Analytics Dashboard</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={() => setIsRealtime(!isRealtime)} 
              style={[styles.realtimeToggle, { backgroundColor: isRealtime ? `${colors.primary}20` : `${colors.textMuted}20` }]}
            >
              <View style={[styles.realtimeDot, { backgroundColor: isRealtime ? '#10B981' : colors.textMuted }]} />
              <Text style={[styles.realtimeText, { color: isRealtime ? colors.primary : colors.textMuted }]}>
                {isRealtime ? 'Live' : 'Static'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={fetchAnalytics} style={styles.refreshButton}>
              <FontAwesome5 name="sync-alt" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Update Indicator */}
        {isRealtime && (
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <Text style={[styles.lastUpdate, { color: colors.textMuted }]}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </Text>
          </Animated.View>
        )}

        {/* Period Selector */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.periodSelector}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: selectedPeriod === period
                      ? colors.primary
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderColor: selectedPeriod === period ? colors.primary : `${colors.primary}30`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: selectedPeriod === period ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Overview Stats */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Students" 
            value={analytics.totalStudents} 
            icon="users" 
            color="#3B82F6"
            subtitle={analytics.activeStudents !== null ? `${analytics.activeStudents} active` : undefined}
            delay={200}
          />
          <StatCard 
            title="Total Teachers" 
            value={analytics.totalTeachers} 
            icon="chalkboard-teacher" 
            color="#8B5CF6"
            delay={250}
          />
          <StatCard 
            title="Departments" 
            value={analytics.totalDepartments} 
            icon="building" 
            color="#10B981"
            delay={300}
          />
          <StatCard 
            title="Courses" 
            value={analytics.totalCourses} 
            icon="book" 
            color="#F59E0B"
            delay={350}
          />
        </View>

        {/* Activity Stats */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Activity</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Pending Approvals" 
            value={analytics.pendingApprovals} 
            icon="clock" 
            color="#EF4444"
            subtitle={analytics.pendingApprovals !== null && analytics.pendingApprovals > 0 ? "Requires action" : undefined}
            delay={400}
          />
          <StatCard 
            title="Today's Attendance" 
            value={analytics.todayAttendance !== null ? `${analytics.todayAttendance}%` : null} 
            icon="user-check" 
            color="#14B8A6"
            subtitle={analytics.todayAttendance !== null ? "Current rate" : undefined}
            delay={450}
          />
          <StatCard 
            title="Upcoming Exams" 
            value={analytics.upcomingExams} 
            icon="clipboard-list" 
            color="#F59E0B"
            subtitle={analytics.upcomingExams !== null && analytics.upcomingExams > 0 ? "Scheduled" : undefined}
            delay={500}
          />
          <StatCard 
            title="Active Assignments" 
            value={analytics.pendingAssignments} 
            icon="tasks" 
            color="#8B5CF6"
            subtitle={analytics.pendingAssignments !== null && analytics.pendingAssignments > 0 ? "In progress" : undefined}
            delay={550}
          />
        </View>

        {/* System Stats */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>System</Text>
        <View style={styles.statsGrid}>
          <StatCard 
            title="Active Notices" 
            value={analytics.activeNotices} 
            icon="bell" 
            color="#06B6D4"
            subtitle={analytics.activeNotices !== null && analytics.activeNotices > 0 ? "Published" : undefined}
            delay={600}
          />
          <StatCard 
            title="Avg Attendance" 
            value={analytics.avgAttendance !== null ? `${analytics.avgAttendance}%` : null} 
            icon="clipboard-check" 
            color="#10B981"
            subtitle={analytics.avgAttendance !== null ? `${selectedPeriod} average` : undefined}
            delay={650}
          />
          <StatCard 
            title="Library Books" 
            value={analytics.libraryBooks} 
            icon="book-reader" 
            color="#6366F1"
            subtitle={analytics.libraryBooks !== null ? "Total collection" : undefined}
            delay={700}
          />
          <StatCard 
            title="Data Status" 
            value={isRealtime ? "Live" : "Static"} 
            icon="wifi" 
            color="#10B981"
            subtitle="Realtime updates"
            delay={750}
          />
        </View>

        {/* Department Distribution - Real Data */}
        {departmentDistribution.length > 0 ? (
          <ChartCard
            title="Students by Department"
            icon="chart-bar"
            color="#3B82F6"
            delay={600}
            data={departmentDistribution.map((dept) => {
              const maxCount = Math.max(...departmentDistribution.map(d => d.student_count));
              return {
                label: dept.department_name,
                value: dept.student_count,
                percentage: maxCount > 0 ? (dept.student_count / maxCount) * 100 : 0,
              };
            })}
          />
        ) : (
          <Animated.View entering={FadeInDown.delay(600).springify()}>
            <Card style={styles.emptyCard}>
              <FontAwesome5 name="chart-bar" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No department data available
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Attendance Trends - Real Data */}
        {attendanceTrends.length > 0 ? (
          <ChartCard
            title={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Attendance Trends`}
            icon="chart-line"
            color="#10B981"
            delay={650}
            data={attendanceTrends.map((trend) => {
              const maxRate = Math.max(...attendanceTrends.map(t => t.rate));
              return {
                label: trend.month,
                value: trend.rate,
                percentage: maxRate > 0 ? (trend.rate / maxRate) * 100 : 0,
              };
            })}
          />
        ) : (
          <Animated.View entering={FadeInDown.delay(650).springify()}>
            <Card style={styles.emptyCard}>
              <FontAwesome5 name="chart-line" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No attendance trend data for selected period
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
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  realtimeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  realtimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  lastUpdate: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCardWrapper: {
    width: (width - 52) / 2,
  },
  statCard: {
    padding: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statContent: {
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCardWrapper: {
    marginBottom: 16,
  },
  chartCard: {
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContent: {
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chartLabel: {
    fontSize: 13,
    width: 120,
  },
  chartBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
