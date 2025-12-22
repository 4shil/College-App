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
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface DegreeProgram {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
}

interface Year {
  id: string;
  year_number: number;
  name: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface AttendanceSummary {
  student_id: string;
  student_name: string;
  roll_number: string;
  total_classes: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  attendance_percentage: number;
  late_passes_used: number;
  half_day_leaves: number;
}

interface SubjectSummary {
  course_id: string;
  course_name: string;
  course_code: string;
  total_classes: number;
  avg_attendance: number;
  students_below_threshold: number;
}

type ReportType = 'student' | 'subject' | 'class';

const MINIMUM_ATTENDANCE = 65;

export default function AttendanceReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  // Selection states
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [reportType, setReportType] = useState<ReportType>('student');

  // Data states
  const [degreePrograms, setDegreePrograms] = useState<DegreeProgram[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentData, setStudentData] = useState<AttendanceSummary[]>([]);
  const [subjectData, setSubjectData] = useState<SubjectSummary[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [classAverage, setClassAverage] = useState(0);
  const [belowThresholdCount, setBelowThresholdCount] = useState(0);

  const fetchInitialData = useCallback(async () => {
    try {
      const [degreesRes, yearsRes] = await Promise.all([
        // Fetch courses that have program_type (these are degree programs like BCA, BBA)
        supabase.from('courses').select('id, name, code, short_name').not('program_type', 'is', null).eq('is_active', true).order('code'),
        supabase.from('years').select('id, year_number, name').order('year_number'),
      ]);

      setDegreePrograms(degreesRes.data || []);
      setYears(((yearsRes.data || []) as Array<{ year_number: number; id: string; name: string }>).filter(y => y.year_number <= 3));
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    if (!selectedDegree || !selectedYear) {
      setCourses([]);
      return;
    }

    try {
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear) return;

      const { data: entries } = await supabase
        .from('timetable_entries')
        .select('course_id, courses(id, name, code)')
        .eq('course_id', selectedDegree)
        .eq('year_id', selectedYear)
        .eq('academic_year_id', academicYear.id)
        .eq('is_active', true);

      // Get unique courses
      const uniqueCourses: Course[] = [];
      const seenIds = new Set();
      (entries as Array<any> | undefined)?.forEach(e => {
        if (!seenIds.has(e.course_id) && e.courses) {
          seenIds.add(e.course_id);
          uniqueCourses.push(e.courses as unknown as Course);
        }
      });

      setCourses(uniqueCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  }, [selectedDegree, selectedYear]);

  const fetchStudentReport = useCallback(async () => {
    if (!selectedDegree || !selectedYear) return;

    setLoadingReport(true);
    try {
      // Get course's department first
      const { data: courseData } = await supabase
        .from('courses')
        .select('department_id')
        .eq('id', selectedDegree)
        .single();

      // Get students in this department and year
      const { data: students } = await supabase
        .from('students')
        .select(`
          id,
          roll_number,
          registration_number,
          profiles:user_id(full_name)
        `)
        .eq('department_id', courseData?.department_id)
        .eq('year_id', selectedYear)
        .eq('current_status', 'active')
        .order('roll_number');

      if (!students) {
        setStudentData([]);
        return;
      }

      // Get attendance records for all students (uses attendance_records table)
      const studentIds = (students as Array<any>).map(s => s.id);
      
      // Get all attendance_records for these students
      let attendanceQuery = supabase
        .from('attendance_records')
        .select(`
          id,
          student_id,
          status,
          late_minutes,
          attendance:attendance_id(
            id,
            course_id,
            timetable_entry_id
          )
        `)
        .in('student_id', studentIds);

      const { data: allRecords } = await attendanceQuery;

      // If course filter, filter records by course
      let filteredRecords = allRecords || [];
      if (selectedCourse && allRecords) {
        filteredRecords = (allRecords as Array<any>).filter(r => {
          const att = r.attendance as any;
          return att?.course_id === selectedCourse;
        });
      }

      // Get late passes for all students
      const { data: allLatePasses } = await supabase
        .from('late_passes')
        .select('student_id, late_count, half_day_leaves_deducted')
        .in('student_id', studentIds);

      // Build summaries
      const summaries: AttendanceSummary[] = (students as Array<any>).map(student => {
        const studentRecords = (filteredRecords as Array<any>).filter(r => r.student_id === student.id);
        const latePasses = (allLatePasses as Array<any> | undefined)?.find(lp => lp.student_id === student.id);

        const total = studentRecords.length;
        const present = (studentRecords as Array<any>).filter(r => r.status === 'present').length;
        const late = (studentRecords as Array<any>).filter(r => r.status === 'late').length;
        const absent = (studentRecords as Array<any>).filter(r => r.status === 'absent').length;

        const percentage = total > 0 ? ((present + late) / total) * 100 : 0;

        return {
          student_id: student.id,
          student_name: (student.profiles as any)?.full_name || 'Unknown',
          roll_number: student.roll_number || student.registration_number || '',
          total_classes: total,
          present_count: present,
          late_count: late,
          absent_count: absent,
          attendance_percentage: Math.round(percentage * 10) / 10,
          late_passes_used: latePasses?.late_count || 0,
          half_day_leaves: latePasses?.half_day_leaves_deducted || 0,
        };
      });

      setStudentData(summaries);

      // Calculate class stats
      const totalStudents = summaries.length;
      if (totalStudents > 0) {
        const avgAttendance = summaries.reduce((sum, s) => sum + s.attendance_percentage, 0) / totalStudents;
        setClassAverage(Math.round(avgAttendance * 10) / 10);
        setBelowThresholdCount(summaries.filter(s => s.attendance_percentage < MINIMUM_ATTENDANCE).length);
      }
    } catch (error) {
      console.error('Error fetching student report:', error);
    } finally {
      setLoadingReport(false);
    }
  }, [selectedDegree, selectedYear, selectedCourse]);

  const fetchSubjectReport = useCallback(async () => {
    if (!selectedDegree || !selectedYear) return;

    setLoadingReport(true);
    try {
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear) return;

      // Get all timetable entries with their courses
      const { data: entries } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          course_id,
          courses(id, name, code)
        `)
        .eq('course_id', selectedDegree)
        .eq('year_id', selectedYear)
        .eq('academic_year_id', academicYear.id)
        .eq('is_active', true);

      if (!entries) {
        setSubjectData([]);
        return;
      }

      // Group by course
      const courseMap = new Map<string, { course: Course; entryIds: string[] }>();
      (entries as Array<any>).forEach(entry => {
        if (entry.courses) {
          const course = entry.courses as unknown as Course;
          if (!courseMap.has(entry.course_id)) {
            courseMap.set(entry.course_id, { course, entryIds: [] });
          }
          courseMap.get(entry.course_id)!.entryIds.push(entry.id);
        }
      });

      const summaries: SubjectSummary[] = [];

      for (const [courseId, { course, entryIds }] of courseMap) {
        // Get attendance headers for this course
        const { data: attendanceHeaders } = await supabase
          .from('attendance')
          .select('id')
          .in('timetable_entry_id', entryIds);

        if (!attendanceHeaders || attendanceHeaders.length === 0) {
          summaries.push({
            course_id: courseId,
            course_name: course.name,
            course_code: course.code,
            total_classes: 0,
            avg_attendance: 0,
            students_below_threshold: 0,
          });
          continue;
        }

        const attendanceIds = (attendanceHeaders as Array<{ id: string }>).map(a => a.id);

        // Get attendance records
        const { data: records } = await supabase
          .from('attendance_records')
          .select('student_id, status')
          .in('attendance_id', attendanceIds);

        const total = records?.length || 0;
        const presentAndLate = (records as Array<any> | undefined)?.filter(r => r.status !== 'absent').length || 0;
        const avgAttendance = total > 0 ? (presentAndLate / total) * 100 : 0;

        // Count students below threshold
        const studentAttendance = new Map<string, { total: number; attended: number }>();
        (records as Array<any> | undefined)?.forEach(r => {
          if (!studentAttendance.has(r.student_id)) {
            studentAttendance.set(r.student_id, { total: 0, attended: 0 });
          }
          const sa = studentAttendance.get(r.student_id)!;
          sa.total++;
          if (r.status !== 'absent') sa.attended++;
        });

        let belowThreshold = 0;
        studentAttendance.forEach(({ total, attended }) => {
          if ((attended / total) * 100 < MINIMUM_ATTENDANCE) belowThreshold++;
        });

        summaries.push({
          course_id: courseId,
          course_name: course.name,
          course_code: course.code,
          total_classes: Math.floor(total / Math.max(studentAttendance.size, 1)),
          avg_attendance: Math.round(avgAttendance * 10) / 10,
          students_below_threshold: belowThreshold,
        });
      }

      setSubjectData(summaries.sort((a, b) => a.avg_attendance - b.avg_attendance));
    } catch (error) {
      console.error('Error fetching subject report:', error);
    } finally {
      setLoadingReport(false);
    }
  }, [selectedDegree, selectedYear]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchCourses();
  }, [selectedDegree, selectedYear, fetchCourses]);

  useEffect(() => {
    if (selectedDegree && selectedYear) {
      if (reportType === 'student') {
        fetchStudentReport();
      } else if (reportType === 'subject') {
        fetchSubjectReport();
      }
    }
  }, [selectedDegree, selectedYear, selectedCourse, reportType, fetchStudentReport, fetchSubjectReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (reportType === 'student') {
      await fetchStudentReport();
    } else {
      await fetchSubjectReport();
    }
    setRefreshing(false);
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return colors.success;
    if (percentage >= 65) return colors.warning;
    return colors.error;
  };

  const renderStudentRow = (summary: AttendanceSummary, index: number) => {
    const isBelowThreshold = summary.attendance_percentage < MINIMUM_ATTENDANCE;

    return (
      <Animated.View
        key={summary.student_id}
        entering={FadeInRight.delay(100 + index * 30).duration(300)}
        style={[
          styles.studentRow,
          {
            backgroundColor: colors.cardBackground,
            borderColor: isBelowThreshold ? withAlpha(colors.error, 0.188) : colors.cardBorder,
            borderWidth: colors.borderWidth,
          },
        ]}
      >
        <View style={styles.studentRowLeft}>
          <View style={[styles.rollBadge, { backgroundColor: withAlpha(colors.primary, 0.082) }]}>
            <Text style={[styles.rollText, { color: colors.primary }]}>{summary.roll_number}</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
              {summary.student_name}
            </Text>
            <View style={styles.statsInline}>
              <Text style={[styles.statInline, { color: colors.success }]}>P: {summary.present_count}</Text>
              <Text style={[styles.statInline, { color: colors.warning }]}>L: {summary.late_count}</Text>
              <Text style={[styles.statInline, { color: colors.error }]}>A: {summary.absent_count}</Text>
            </View>
          </View>
        </View>

        <View style={styles.studentRowRight}>
          <View
            style={[
              styles.percentageBadge,
              { backgroundColor: withAlpha(getAttendanceColor(summary.attendance_percentage), 0.082) },
            ]}
          >
            <Text style={[styles.percentageText, { color: getAttendanceColor(summary.attendance_percentage) }]}>
              {summary.attendance_percentage}%
            </Text>
          </View>
          {isBelowThreshold && (
            <FontAwesome5 name="exclamation-triangle" size={14} color={colors.error} style={{ marginLeft: 8 }} />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderSubjectRow = (summary: SubjectSummary, index: number) => {
    const isBelowTarget = summary.avg_attendance < 75;

    return (
      <Animated.View
        key={summary.course_id}
        entering={FadeInRight.delay(100 + index * 30).duration(300)}
        style={[
          styles.subjectRow,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          },
        ]}
      >
        <View style={styles.subjectInfo}>
          <Text style={[styles.subjectCode, { color: colors.primary }]}>{summary.course_code}</Text>
          <Text style={[styles.subjectName, { color: colors.textPrimary }]} numberOfLines={1}>
            {summary.course_name}
          </Text>
          <Text style={[styles.classCount, { color: colors.textMuted }]}>
            {summary.total_classes} classes
          </Text>
        </View>

        <View style={styles.subjectStats}>
          <View
            style={[
              styles.percentageBadge,
              { backgroundColor: withAlpha(getAttendanceColor(summary.avg_attendance), 0.082) },
            ]}
          >
            <Text style={[styles.percentageText, { color: getAttendanceColor(summary.avg_attendance) }]}>
              {summary.avg_attendance}%
            </Text>
          </View>
          {summary.students_below_threshold > 0 && (
            <View style={[styles.warningBadge, { backgroundColor: withAlpha(colors.error, 0.125) }]}>
              <FontAwesome5 name="user-times" size={10} color={colors.error} />
              <Text style={[styles.warningText, { color: colors.error }]}>
                {summary.students_below_threshold}
              </Text>
            </View>
          )}
        </View>
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance Reports</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Minimum required: {MINIMUM_ATTENDANCE}%
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Report Type Tabs */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabsRow}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    reportType === 'student' && styles.tabActive,
                    { backgroundColor: reportType === 'student' ? colors.primary : colors.glassBackground },
                  ]}
                  onPress={() => setReportType('student')}
                >
                  <FontAwesome5
                    name="user-graduate"
                    size={14}
                    color={reportType === 'student' ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: reportType === 'student' ? colors.textInverse : colors.textSecondary },
                    ]}
                  >
                    Student-wise
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    reportType === 'subject' && styles.tabActive,
                    { backgroundColor: reportType === 'subject' ? colors.primary : colors.glassBackground },
                  ]}
                  onPress={() => setReportType('subject')}
                >
                  <FontAwesome5
                    name="book"
                    size={14}
                    color={reportType === 'subject' ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      { color: reportType === 'subject' ? colors.textInverse : colors.textSecondary },
                    ]}
                  >
                    Subject-wise
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Filters */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.filtersRow}>
                <View
                  style={[
                    styles.pickerWrapper,
                    {
                      backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.05 : 0.03),
                      borderColor: withAlpha(colors.primary, 0.2),
                    },
                  ]}
                >
                  <Picker
                    selectedValue={selectedDegree}
                    onValueChange={val => {
                      setSelectedDegree(val);
                      setSelectedCourse('');
                    }}
                    style={{ color: colors.textPrimary }}
                    dropdownIconColor={colors.textMuted}
                  >
                    <Picker.Item label="Select Course" value="" />
                    {degreePrograms.map(p => (
                      <Picker.Item key={p.id} label={`${p.code} - ${p.short_name || p.name}`} value={p.id} />
                    ))}
                  </Picker>
                </View>

                <View
                  style={[
                    styles.pickerWrapper,
                    styles.yearPicker,
                    {
                      backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.05 : 0.03),
                      borderColor: withAlpha(colors.primary, 0.2),
                    },
                  ]}
                >
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={val => {
                      setSelectedYear(val);
                      setSelectedCourse('');
                    }}
                    style={{ color: colors.textPrimary }}
                    dropdownIconColor={colors.textMuted}
                  >
                    <Picker.Item label="Year" value="" />
                    {years.map(y => (
                      <Picker.Item key={y.id} label={y.name} value={y.id} />
                    ))}
                  </Picker>
                </View>
              </Animated.View>

              {/* Subject Filter (for student report) */}
              {reportType === 'student' && courses.length > 0 && (
                <Animated.View entering={FadeInDown.delay(250).duration(400)}>
                  <View
                    style={[
                      styles.pickerWrapper,
                      {
                        backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.05 : 0.03),
                        borderColor: withAlpha(colors.primary, 0.2),
                      },
                    ]}
                  >
                    <Picker
                      selectedValue={selectedCourse}
                      onValueChange={setSelectedCourse}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textMuted}
                    >
                      <Picker.Item label="All Subjects" value="" />
                      {courses.map(c => (
                        <Picker.Item key={c.id} label={`${c.code} - ${c.name}`} value={c.id} />
                      ))}
                    </Picker>
                  </View>
                </Animated.View>
              )}

              {/* Class Summary Card */}
              {selectedDegree && selectedYear && reportType === 'student' && studentData.length > 0 && (
                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                  <Card style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                      <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Class Summary</Text>
                    </View>
                    <View style={styles.summaryStats}>
                      <View style={styles.summaryStat}>
                        <Text style={[styles.summaryValue, { color: colors.primary }]}>{studentData.length}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Students</Text>
                      </View>
                      <View style={styles.summaryStat}>
                        <Text style={[styles.summaryValue, { color: getAttendanceColor(classAverage) }]}>
                          {classAverage}%
                        </Text>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Avg Attendance</Text>
                      </View>
                      <View style={styles.summaryStat}>
                        <Text style={[styles.summaryValue, { color: colors.error }]}>{belowThresholdCount}</Text>
                        <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Below 65%</Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              )}

              {/* Alert for students below threshold */}
              {belowThresholdCount > 0 && reportType === 'student' && (
                <Animated.View entering={FadeInDown.delay(350).duration(400)}>
                  <View style={[styles.alertBanner, { backgroundColor: withAlpha(colors.error, 0.125) }]}>
                    <FontAwesome5 name="exclamation-circle" size={16} color={colors.error} />
                    <Text style={[styles.alertText, { color: colors.error }]}>
                      {belowThresholdCount} student{belowThresholdCount > 1 ? 's' : ''} below minimum {MINIMUM_ATTENDANCE}% attendance
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Report Data */}
              {loadingReport ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
              ) : reportType === 'student' ? (
                <View style={styles.reportList}>
                  {studentData.length === 0 ? (
                    <View style={styles.emptyState}>
                      <FontAwesome5 name="chart-bar" size={48} color={colors.textMuted} />
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        Select program and year to view report
                      </Text>
                    </View>
                  ) : (
                    studentData
                      .sort((a, b) => a.attendance_percentage - b.attendance_percentage)
                      .map((summary, index) => renderStudentRow(summary, index))
                  )}
                </View>
              ) : (
                <View style={styles.reportList}>
                  {subjectData.length === 0 ? (
                    <View style={styles.emptyState}>
                      <FontAwesome5 name="book-open" size={48} color={colors.textMuted} />
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        Select program and year to view report
                      </Text>
                    </View>
                  ) : (
                    subjectData.map((summary, index) => renderSubjectRow(summary, index))
                  )}
                </View>
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tabActive: {},
  tabText: { fontSize: 13, fontWeight: '600' },
  // Filters
  filtersRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  pickerWrapper: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  yearPicker: { flex: 0.35, minWidth: 100 },
  // Summary Card
  summaryCard: {
    padding: 16,
    marginBottom: 16,
  },
  summaryHeader: {
    marginBottom: 12,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600' },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: { fontSize: 24, fontWeight: '700' },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  alertText: { flex: 1, fontSize: 13, fontWeight: '500' },
  // Report List
  reportList: {
    marginTop: 8,
  },
  // Student Row
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  studentRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rollBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  rollText: { fontSize: 12, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '500' },
  statsInline: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statInline: { fontSize: 11, fontWeight: '600' },
  studentRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  percentageText: { fontSize: 14, fontWeight: '700' },
  // Subject Row
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  subjectInfo: { flex: 1 },
  subjectCode: { fontSize: 11, fontWeight: '700' },
  subjectName: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  classCount: { fontSize: 11, marginTop: 4 },
  subjectStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  warningText: { fontSize: 11, fontWeight: '600' },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});
