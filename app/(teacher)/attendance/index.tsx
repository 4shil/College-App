import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface TodayClass {
  id: string;
  period: number;
  periodTime: string;
  courseName: string;
  courseCode: string;
  yearName: string;
  courseId: string;
  yearId: string;
  programmeId: string | null;
  departmentId: string | null;
  studentCount: number;
  markedCount: number;
  isCompleted: boolean;
}

interface AttendanceStats {
  todayClasses: number;
  completedClasses: number;
  totalStudentsMarked: number;
  avgAttendancePercent: number;
}

// Period timings
const PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35' },
  { period: 2, start: '10:50', end: '11:40' },
  { period: 3, start: '11:50', end: '12:45' },
  { period: 4, start: '13:25', end: '14:15' },
  { period: 5, start: '14:20', end: '15:10' },
];

export default function TeacherAttendanceIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayClasses, setTodayClasses] = useState<TodayClass[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    todayClasses: 0,
    completedClasses: 0,
    totalStudentsMarked: 0,
    avgAttendancePercent: 0,
  });
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    
    // Get teacher record from teachers table linked to this profile
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    return teacher?.id || null;
  }, [user?.id]);

  const fetchTodayClasses = useCallback(async () => {
    if (!teacherId) return;

    try {
      // Get day of week (1 = Monday, 5 = Friday)
      const today = new Date();
      let dayOfWeek = today.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7; // Sunday
      
      // Weekend check
      if (dayOfWeek > 5) {
        setTodayClasses([]);
        return;
      }

      const dateStr = today.toISOString().split('T')[0];

      // Check for holiday
      const { data: holiday } = await supabase
        .from('holidays')
        .select('title')
        .eq('date', dateStr)
        .maybeSingle();

      if (holiday) {
        setTodayClasses([]);
        return;
      }

      // Get current academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear) return;

      // Fetch teacher's timetable entries for today
      const { data: entries } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          period,
          course_id,
          year_id,
          programme_id,
          courses(code, name, short_name, department_id),
          years(name)
        `)
        .eq('teacher_id', teacherId)
        .eq('day_of_week', dayOfWeek)
        .eq('academic_year_id', academicYear.id)
        .eq('is_active', true)
        .order('period');

      if (!entries || entries.length === 0) {
        setTodayClasses([]);
        return;
      }

      // For each entry, get attendance status
      const classesWithStatus: TodayClass[] = await Promise.all(
        (entries as any[]).map(async (entry) => {
          const programmeId = (entry.programme_id as string | null) ?? null;
          const departmentId = (entry.courses?.department_id as string | null) ?? null;

          // Count students by programme/year when possible; else fallback to department/year.
          const baseStudents = supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('year_id', entry.year_id)
            .eq('current_status', 'active');

          const { count: studentCount } = programmeId
            ? await baseStudents.eq('course_id', programmeId)
            : await baseStudents.eq('department_id', departmentId);

          // Check if attendance is marked for this entry today
          const { data: attendance } = await supabase
            .from('attendance')
            .select('id')
            .eq('timetable_entry_id', entry.id)
            .eq('date', dateStr)
            .maybeSingle();

          let markedCount = 0;
          if (attendance) {
            const { count } = await supabase
              .from('attendance_records')
              .select('id', { count: 'exact', head: true })
              .eq('attendance_id', attendance.id);
            markedCount = count || 0;
          }

          const timing = PERIOD_TIMINGS.find(t => t.period === entry.period);

          return {
            id: entry.id,
            period: entry.period,
            periodTime: timing ? `${timing.start} - ${timing.end}` : '',
            courseName: entry.courses?.name || '',
            courseCode: entry.courses?.code || '',
            yearName: entry.years?.name || '',
            courseId: entry.course_id,
            yearId: entry.year_id,
            programmeId,
            departmentId,
            studentCount: studentCount || 0,
            markedCount,
            isCompleted: markedCount > 0 && markedCount === (studentCount || 0),
          };
        })
      );

      setTodayClasses(classesWithStatus);

      // Calculate stats
      const completed = classesWithStatus.filter(c => c.isCompleted).length;
      const totalMarked = classesWithStatus.reduce((sum, c) => sum + c.markedCount, 0);
      const totalStudents = classesWithStatus.reduce((sum, c) => sum + c.studentCount, 0);

      setStats({
        todayClasses: classesWithStatus.length,
        completedClasses: completed,
        totalStudentsMarked: totalMarked,
        avgAttendancePercent: totalStudents > 0 ? Math.round((totalMarked / totalStudents) * 100) : 0,
      });
    } catch (error) {
      console.error('Error fetching today classes:', error);
    }
  }, [teacherId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
    };
    init();
  }, [fetchTeacherId]);

  useEffect(() => {
    if (teacherId) {
      fetchTodayClasses().finally(() => setLoading(false));
    } else if (teacherId === null && !loading) {
      setLoading(false);
    }
  }, [teacherId, fetchTodayClasses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTodayClasses();
    setRefreshing(false);
  };

  const handleMarkAttendance = (classItem: TodayClass) => {
    router.push({
      pathname: '/(teacher)/attendance/mark',
      params: {
        entryId: classItem.id,
        courseName: classItem.courseName,
        courseId: classItem.courseId,
        yearId: classItem.yearId,
        programmeId: classItem.programmeId || '',
        departmentId: classItem.departmentId || '',
        period: classItem.period.toString(),
      },
    });
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const timing of PERIOD_TIMINGS) {
      const [startH, startM] = timing.start.split(':').map(Number);
      const [endH, endM] = timing.end.split(':').map(Number);
      const start = startH * 60 + startM;
      const end = endH * 60 + endM;

      if (currentTime >= start && currentTime <= end) {
        return timing.period;
      }
    }
    return 0;
  };

  const currentPeriod = getCurrentPeriod();

  const renderClassCard = (classItem: TodayClass, index: number) => {
    const isCurrent = classItem.period === currentPeriod;
    const progress = classItem.studentCount > 0 
      ? (classItem.markedCount / classItem.studentCount) * 100 
      : 0;

    return (
      <Animated.View
        key={classItem.id}
        entering={FadeInRight.delay(100 + index * 80).duration(400)}
      >
        <TouchableOpacity
          style={[
            styles.classCard,
            {
              backgroundColor: isDark
                ? withAlpha(colors.textInverse, 0.03)
                : withAlpha(colors.shadowColor, 0.02),
              borderColor: isCurrent
                ? colors.primary
                : classItem.isCompleted
                  ? colors.success
                  : withAlpha(colors.textPrimary, 0),
              borderWidth: isCurrent || classItem.isCompleted ? 1.5 : 1,
            },
          ]}
          onPress={() => handleMarkAttendance(classItem)}
          activeOpacity={0.7}
        >
          {/* Period Badge */}
          <View style={[
            styles.periodBadge,
            {
              backgroundColor: isCurrent
                ? colors.primary
                : isDark
                  ? withAlpha(colors.textInverse, 0.08)
                  : withAlpha(colors.shadowColor, 0.05),
            }
          ]}>
            <Text style={[styles.periodNum, { color: isCurrent ? colors.textInverse : colors.textPrimary }]}>
              P{classItem.period}
            </Text>
            <Text style={[styles.periodTime, { color: isCurrent ? withAlpha(colors.textInverse, 0.8) : colors.textMuted }]}>
              {classItem.periodTime}
            </Text>
          </View>

          {/* Class Info */}
          <View style={styles.classInfo}>
            <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>
              {classItem.courseName}
            </Text>
            <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
              {classItem.courseCode} • {classItem.yearName}
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: isDark
                      ? withAlpha(colors.textInverse, 0.1)
                      : withAlpha(colors.shadowColor, 0.08),
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: classItem.isCompleted ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textMuted }]}>
                {classItem.markedCount}/{classItem.studentCount}
              </Text>
            </View>
          </View>

          {/* Status Icon */}
          <View style={styles.statusIcon}>
            {classItem.isCompleted ? (
              <View style={[styles.completedBadge, { backgroundColor: withAlpha(colors.success, 0.12) }]}>
                <FontAwesome5 name="check" size={14} color={colors.success} />
              </View>
            ) : isCurrent ? (
              <View style={[styles.currentBadge, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                <FontAwesome5 name="arrow-right" size={14} color={colors.primary} />
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.historyBtn,
              {
                backgroundColor: isDark
                  ? withAlpha(colors.textInverse, 0.05)
                  : withAlpha(colors.shadowColor, 0.03),
              },
            ]}
            onPress={() => router.push('/(teacher)/attendance/history')}
          >
            <FontAwesome5 name="history" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <LoadingIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
          ) : !teacherId ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="user-times" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Teacher profile not found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Contact admin to set up your teacher profile
              </Text>
            </View>
          ) : (
            <>
              {/* Stats Cards */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="calendar-check" size={20} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.todayClasses}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today's Classes</Text>
                </Card>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="check-double" size={20} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.completedClasses}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completed</Text>
                </Card>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="user-check" size={20} color={colors.info} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalStudentsMarked}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Marked</Text>
                </Card>
              </Animated.View>

              {/* Today's Classes */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Today's Classes
                </Text>
              </Animated.View>

              {todayClasses.length === 0 ? (
                <View style={styles.emptyState}>
                  <FontAwesome5 name="calendar-times" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No classes scheduled today
                  </Text>
                </View>
              ) : (
                todayClasses.map((classItem, index) => renderClassCard(classItem, index))
              )}
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
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 8 },
  statLabel: { fontSize: 10, marginTop: 2 },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Class Card
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  periodBadge: {
    width: 54,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 14,
  },
  periodNum: { fontSize: 15, fontWeight: '700' },
  periodTime: { fontSize: 9, marginTop: 2 },
  classInfo: { flex: 1 },
  courseName: { fontSize: 15, fontWeight: '600' },
  courseCode: { fontSize: 11, marginTop: 2 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 11, fontWeight: '500' },
  statusIcon: { marginLeft: 10 },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
