import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { withAlpha } from '../../../theme/colorUtils';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { useRouter } from 'expo-router';

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendanceData = async () => {
    if (!user) return;

    try {
      setError(null);
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      // Fetch attendance summary
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          attendance!inner(*)
        `)
        .eq('student_id', student.id)
        .order('attendance.date', { ascending: false })
        .limit(100);

      if (attendanceError) throw attendanceError;

      // Calculate summary by subject
      const subjectMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};
      (attendanceRecords || []).forEach((record: any) => {
        const courseId = record.attendance?.course_id || 'unknown';
        if (!subjectMap[courseId]) {
          subjectMap[courseId] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        subjectMap[courseId].total++;
        if (record.status === 'present') subjectMap[courseId].present++;
        else if (record.status === 'absent') subjectMap[courseId].absent++;
        else if (record.status === 'late') subjectMap[courseId].late++;
      });

      const totalRecords = attendanceRecords?.length || 0;
      const totalPresent = (attendanceRecords || []).filter((r: any) => r.status === 'present' || r.status === 'late').length;
      const overallPercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      setAttendanceData({
        overallPercentage,
        totalRecords,
        totalPresent,
        subjectMap,
        recentRecords: attendanceRecords || [],
      });
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceData();
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <LoadingIndicator />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Attendance</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Overall Summary */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Card>
            <View style={styles.summaryContent}>
              <View style={[styles.percentageCircle, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                <Text style={[styles.percentageValue, { color: colors.primary }]}>
                  {attendanceData?.overallPercentage || 0}%
                </Text>
              </View>
              <View style={styles.summaryStats}>
                <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Overall Attendance</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>
                      {attendanceData?.totalPresent || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                  </View>
                  <View style={[styles.statBoxDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: colors.textMuted }]}>
                      {(attendanceData?.totalRecords || 0) - (attendanceData?.totalPresent || 0)}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Recent Records */}
        {attendanceData?.recentRecords && attendanceData.recentRecords.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              Recent Records
            </Text>
            <Card>
              {attendanceData.recentRecords.slice(0, 10).map((record: any, index: number) => (
                <View key={record.id} style={[styles.recordItem, { borderBottomColor: colors.border }, index < 9 && { borderBottomWidth: 1 }]}>
                  <View style={styles.recordLeft}>
                    <Text style={[styles.recordDate, { color: colors.textSecondary }]}>
                      {new Date(record.attendance?.date || '').toLocaleDateString()}
                    </Text>
                    <Text style={[styles.recordPeriod, { color: colors.textPrimary }]}>
                      Period {record.attendance?.period}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: withAlpha(
                          record.status === 'present' ? colors.success || '#22c55e' : colors.danger || '#ef4444',
                          0.1
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: record.status === 'present' ? colors.success || '#22c55e' : colors.danger || '#ef4444',
                        },
                      ]}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {error && (
          <Card style={{ marginTop: 16, backgroundColor: withAlpha(colors.danger || '#ef4444', 0.1) }}>
            <Text style={{ color: colors.danger || '#ef4444', fontSize: 14 }}>{error}</Text>
          </Card>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  percentageValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  summaryStats: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statBoxDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  recordLeft: {
    flex: 1,
  },
  recordDate: {
    fontSize: 13,
    marginBottom: 2,
  },
  recordPeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
