import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

const { width } = Dimensions.get('window');

interface Exam {
  id: string;
  name: string;
  exam_type: string;
}

interface ExamSchedule {
  id: string;
  exam_id: string;
  course_id: string;
  max_marks: number;
  course?: { name: string; course_code: string };
}

interface StudentMark {
  student_id: string;
  marks_obtained: number;
  is_absent: boolean;
  student?: {
    admission_number: string;
    users: { full_name: string };
  };
}

interface ReportData {
  totalStudents: number;
  present: number;
  absent: number;
  passed: number;
  failed: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  toppers: Array<{ name: string; marks: number }>;
}

export default function ExamReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const fetchExams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, name, exam_type')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setExams(data || []);
      if (data && data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  }, [selectedExamId]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedExamId) return;

    try {
      const { data, error } = await supabase
        .from('exam_schedules')
        .select(`
          *,
          course:courses(name, course_code)
        `)
        .eq('exam_id', selectedExamId)
        .order('exam_date');

      if (error) throw error;
      setSchedules(data || []);
      if (data && data.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }, [selectedExamId, selectedScheduleId]);

  const fetchReportData = useCallback(async () => {
    if (!selectedScheduleId) return;

    try {
      const schedule = schedules.find(s => s.id === selectedScheduleId);
      if (!schedule) return;

      const { data: marks, error } = await supabase
        .from('exam_marks')
        .select(`
          *,
          student:students(
            admission_number,
            users(full_name)
          )
        `)
        .eq('exam_schedule_id', selectedScheduleId)
        .eq('status', 'published');

      if (error) throw error;

      const totalStudents = marks?.length || 0;
      const present = marks?.filter((m: any) => !m.is_absent).length || 0;
      const absent = totalStudents - present;

      const presentMarks = marks?.filter((m: any) => !m.is_absent) || [];
      const passMarks = schedule.max_marks * 0.4; // 40% pass
      const passed = presentMarks.filter((m: any) => m.marks_obtained >= passMarks).length;
      const failed = present - passed;

      const totalMarks = presentMarks.reduce((sum: number, m: any) => sum + m.marks_obtained, 0);
      const averageMarks = present > 0 ? totalMarks / present : 0;
      const highestMarks = presentMarks.length > 0 ? Math.max(...presentMarks.map((m: any) => m.marks_obtained)) : 0;
      const lowestMarks = presentMarks.length > 0 ? Math.min(...presentMarks.map((m: any) => m.marks_obtained)) : 0;

      const toppers = presentMarks
        .sort((a: any, b: any) => b.marks_obtained - a.marks_obtained)
        .slice(0, 5)
        .map((m: any) => ({
          name: m.student?.users?.full_name || 'Unknown',
          marks: m.marks_obtained,
        }));

      setReportData({
        totalStudents,
        present,
        absent,
        passed,
        failed,
        averageMarks,
        highestMarks,
        lowestMarks,
        toppers,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  }, [selectedScheduleId, schedules]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchExams();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchSchedules();
    }
  }, [selectedExamId, fetchSchedules]);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchReportData();
    }
  }, [selectedScheduleId, fetchReportData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchExams(), fetchSchedules(), fetchReportData()]);
    setRefreshing(false);
  };

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  const passPercentage = reportData && reportData.present > 0 
    ? ((reportData.passed / reportData.present) * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <Restricted permissions={[PERMISSIONS.SCHEDULE_EXAMS, PERMISSIONS.VERIFY_MARKS]} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Exam Reports</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Detailed analytics and insights
          </Text>
        </View>

        {/* Exam Selection */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Exam</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker
              selectedValue={selectedExamId}
              onValueChange={setSelectedExamId}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textPrimary}
            >
              {exams.map(exam => (
                <Picker.Item key={exam.id} label={exam.name} value={exam.id} />
              ))}
            </Picker>
          </View>
        </Card>

        {/* Course Selection */}
        {selectedExamId && schedules.length > 0 && (
          <Card style={styles.card}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Course</Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
              <Picker
                selectedValue={selectedScheduleId}
                onValueChange={setSelectedScheduleId}
                style={[styles.picker, { color: colors.textPrimary }]}
                dropdownIconColor={colors.textPrimary}
              >
                {schedules.map(schedule => (
                  <Picker.Item
                    key={schedule.id}
                    label={`${schedule.course?.course_code} - ${schedule.course?.name}`}
                    value={schedule.id}
                  />
                ))}
              </Picker>
            </View>
          </Card>
        )}

        {reportData && (
          <>
            {/* Overview Stats */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
              Overview
            </Text>
            <View style={styles.statsGrid}>
              <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="users" size={24} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{reportData.totalStudents}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Students</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="check-circle" size={24} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{reportData.present}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="times-circle" size={24} color={colors.error} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{reportData.absent}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absent</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="percentage" size={24} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{passPercentage}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pass Rate</Text>
                </Card>
              </Animated.View>
            </View>

            {/* Pass/Fail Stats */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
              Results Breakdown
            </Text>
            <View style={styles.statsRow}>
              <Animated.View entering={FadeInDown.delay(200).springify()} style={{ flex: 1 }}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="trophy" size={24} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{reportData.passed}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Passed</Text>
                </Card>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(250).springify()} style={{ flex: 1 }}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="times" size={24} color={colors.error} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{reportData.failed}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Failed</Text>
                </Card>
              </Animated.View>
            </View>

            {/* Marks Analysis */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
              Marks Analysis
            </Text>
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Card style={styles.analysisCard}>
                <View style={styles.analysisRow}>
                  <View style={styles.analysisItem}>
                    <FontAwesome5 name="chart-bar" size={20} color={colors.primary} />
                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>Average</Text>
                    <Text style={[styles.analysisValue, { color: colors.textPrimary }]}>
                      {reportData.averageMarks.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.analysisItem}>
                    <FontAwesome5 name="arrow-up" size={20} color={colors.success} />
                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>Highest</Text>
                    <Text style={[styles.analysisValue, { color: colors.textPrimary }]}>
                      {reportData.highestMarks}
                    </Text>
                  </View>
                  <View style={styles.analysisItem}>
                    <FontAwesome5 name="arrow-down" size={20} color={colors.error} />
                    <Text style={[styles.analysisLabel, { color: colors.textSecondary }]}>Lowest</Text>
                    <Text style={[styles.analysisValue, { color: colors.textPrimary }]}>
                      {reportData.lowestMarks}
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* Top Performers */}
            {reportData.toppers.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
                  Top Performers
                </Text>
                {reportData.toppers.map((topper, index) => (
                  <Animated.View key={index} entering={FadeInDown.delay(350 + index * 50).springify()}>
                    <Card style={styles.topperCard}>
                      <View
                        style={[
                          styles.rank,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.cardBorder,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Text style={[styles.rankText, { color: colors.textPrimary }]}>{index + 1}</Text>
                      </View>
                      <View style={styles.topperInfo}>
                        <Text style={[styles.topperName, { color: colors.textPrimary }]}>{topper.name}</Text>
                        <Text style={[styles.topperMarks, { color: colors.textSecondary }]}>
                          {topper.marks} / {selectedSchedule?.max_marks}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.topperBadge,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.inputBorder,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <FontAwesome5 name="trophy" size={16} color={colors.success} />
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </>
            )}
          </>
        )}

        {!reportData && selectedScheduleId && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="chart-line" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No published marks yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Marks need to be entered and published to generate reports
            </Text>
          </Card>
        )}
      </ScrollView>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  card: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: 8 },
  picker: { height: 50 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCardWrapper: { width: (width - 52) / 2 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { padding: 16, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 14 },
  analysisCard: { padding: 20 },
  analysisRow: { flexDirection: 'row', justifyContent: 'space-around' },
  analysisItem: { alignItems: 'center' },
  analysisLabel: { fontSize: 12, marginTop: 8, marginBottom: 4 },
  analysisValue: { fontSize: 24, fontWeight: 'bold' },
  topperCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12 },
  rank: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rankText: { fontSize: 18, fontWeight: 'bold' },
  topperInfo: { flex: 1 },
  topperName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  topperMarks: { fontSize: 14 },
  topperBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
});
