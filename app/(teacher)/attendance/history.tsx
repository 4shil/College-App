import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface AttendanceRecord {
  id: string;
  date: string;
  period: number;
  courseName: string;
  courseCode: string;
  programName: string;
  yearName: string;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalStudents: number;
}

export default function TeacherAttendanceHistory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchHistory = useCallback(async () => {
    if (!teacherId) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get attendance records for teacher on selected date
      // Note: attendance.timetable_entry_id references timetable_entries.id
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          id,
          date,
          period,
          timetable_entry_id,
          timetable_entry:timetable_entry_id(
            id,
            course:course_id(
              code,
              name,
              program_type
            ),
            year:year_id(
              name
            ),
            teacher_id
          )
        `)
        .eq('date', dateStr)
        .order('period');

      if (!attendanceData || attendanceData.length === 0) {
        setRecords([]);
        return;
      }

      // Filter by teacher's timetable entries (attendance already has the timetable_entry with teacher_id)
      const filteredAttendance = (attendanceData as any[]).filter(a => 
        a.timetable_entry && a.timetable_entry.teacher_id === teacherId
      );

      // Get counts for each attendance record
      const recordsWithCounts: AttendanceRecord[] = await Promise.all(
        filteredAttendance.map(async (att) => {
          const { data: recordsData } = await supabase
            .from('attendance_records')
            .select('status')
            .eq('attendance_id', att.id);

          const records: Array<{ status: string }> = recordsData || [];
          const presentCount = records.filter((r) => r.status === 'present').length;
          const lateCount = records.filter((r) => r.status === 'late').length;
          const absentCount = records.filter((r) => r.status === 'absent').length;

          // Get degree program name from course (courses with program_type are degree programs)
          const courseData = att.timetable_entry?.course;
          const programName = courseData?.program_type 
            ? courseData.name // If course has program_type, it IS the degree program (BCA, BBA, etc.)
            : '';

          return {
            id: att.id,
            date: att.date,
            period: att.period,
            courseName: courseData?.name || '',
            courseCode: courseData?.code || '',
            programName: programName,
            yearName: att.timetable_entry?.year?.name || '',
            presentCount,
            lateCount,
            absentCount,
            totalStudents: presentCount + lateCount + absentCount,
          };
        })
      );

      setRecords(recordsWithCounts);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, [teacherId, selectedDate]);

  useEffect(() => {
    const init = async () => {
      const tId = await fetchTeacherId();
      setTeacherId(tId);
    };
    init();
  }, [fetchTeacherId]);

  useEffect(() => {
    if (teacherId) {
      setLoading(true);
      fetchHistory().finally(() => setLoading(false));
    }
  }, [teacherId, fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const renderRecordCard = (record: AttendanceRecord, index: number) => {
    const attendancePercent = record.totalStudents > 0
      ? Math.round(((record.presentCount + record.lateCount) / record.totalStudents) * 100)
      : 0;

    return (
      <Animated.View
        key={record.id}
        entering={FadeInRight.delay(100 + index * 60).duration(400)}
      >
        <Card
          style={[
            styles.recordCard,
            {
              borderColor: isDark
                ? withAlpha(colors.textInverse, 0.05)
                : withAlpha(colors.shadowColor, 0.05),
            },
          ]}
        >
          <View style={styles.recordHeader}>
            <View style={[styles.periodBadge, { backgroundColor: withAlpha(colors.primary, 0.08) }]}>
              <Text style={[styles.periodText, { color: colors.primary }]}>P{record.period}</Text>
            </View>
            <View style={styles.recordInfo}>
              <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>
                {record.courseName}
              </Text>
              <Text style={[styles.courseDetails, { color: colors.textMuted }]}>
                {record.courseCode} • {record.programName} • {record.yearName}
              </Text>
            </View>
            <View style={[
              styles.percentBadge,
              {
                backgroundColor:
                  attendancePercent >= 75
                    ? withAlpha(colors.success, 0.08)
                    : withAlpha(colors.error, 0.08),
              }
            ]}>
              <Text style={[
                styles.percentText,
                { color: attendancePercent >= 75 ? colors.success : colors.error }
              ]}>
                {attendancePercent}%
              </Text>
            </View>
          </View>

          <View style={styles.countsRow}>
            <View style={styles.countItem}>
              <View style={[styles.countDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                Present: {record.presentCount}
              </Text>
            </View>
            <View style={styles.countItem}>
              <View style={[styles.countDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                Late: {record.lateCount}
              </Text>
            </View>
            <View style={styles.countItem}>
              <View style={[styles.countDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                Absent: {record.absentCount}
              </Text>
            </View>
          </View>
        </Card>
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance History</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              View past attendance records
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Date Picker */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <TouchableOpacity
              style={[
                styles.datePickerBtn,
                {
                  backgroundColor: isDark
                    ? withAlpha(colors.textInverse, 0.05)
                    : withAlpha(colors.shadowColor, 0.03),
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome5 name="calendar-alt" size={18} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {selectedDate.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
              maximumDate={new Date()}
            />
          )}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
          ) : records.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="clipboard-list" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No attendance records for this date
              </Text>
            </View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {records.length} {records.length === 1 ? 'Record' : 'Records'}
                </Text>
              </Animated.View>
              {records.map((record, index) => renderRecordCard(record, index))}
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
  // Date Picker
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    gap: 12,
  },
  dateText: { flex: 1, fontSize: 15, fontWeight: '500' },
  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Record Card
  recordCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  periodText: { fontSize: 14, fontWeight: '700' },
  recordInfo: { flex: 1 },
  courseName: { fontSize: 15, fontWeight: '600' },
  courseDetails: { fontSize: 11, marginTop: 2 },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  percentText: { fontSize: 13, fontWeight: '700' },
  countsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  countText: { fontSize: 12 },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 16,
  },
});
