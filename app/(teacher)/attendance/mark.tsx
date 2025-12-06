import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { AnimatedBackground, Card, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';

// Period timings
const PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35', label: 'Period 1 (9:40 - 10:35)' },
  { period: 2, start: '10:50', end: '11:40', label: 'Period 2 (10:50 - 11:40)' },
  { period: 3, start: '11:50', end: '12:45', label: 'Period 3 (11:50 - 12:45)' },
  { period: 4, start: '13:25', end: '14:15', label: 'Period 4 (13:25 - 14:15)' },
  { period: 5, start: '14:20', end: '15:10', label: 'Period 5 (14:20 - 15:10)' },
];

interface Student {
  id: string;
  roll_number: string;
  registration_number?: string;
  user_id: string;
  profiles: { full_name: string };
  status: 'present' | 'absent' | 'late' | null;
  late_minutes?: number;
  attendance_id?: string;
  attendance_record_id?: string;
  edit_count?: number;
  is_locked?: boolean;
}

interface TimetableEntry {
  id: string;
  period: number;
  course_id: string;
  courses: { code: string; name: string; short_name: string };
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function TeacherMarkAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    entryId: string;
    courseName: string;
    courseId: string;
    yearId: string;
    period: string;
  }>();
  const { colors, isDark } = useThemeStore();
  const { profile, user } = useAuthStore();

  // Data from params
  const entryId = params.entryId;
  const courseName = params.courseName || '';
  const courseId = params.courseId || '';
  const yearId = params.yearId || '';
  const periodNum = parseInt(params.period || '0');

  // States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLateModal, setShowLateModal] = useState(false);
  const [selectedStudentForLate, setSelectedStudentForLate] = useState<Student | null>(null);
  const [lateMinutes, setLateMinutes] = useState('5');
  const [entry, setEntry] = useState<TimetableEntry | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  // Stats
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const timing = PERIOD_TIMINGS.find(t => t.period === periodNum);

  // Check if attendance is locked (older than 24 hours - for historical edits)
  const isDateLocked = useCallback(() => {
    // For today's attendance, no lock
    return false;
  }, []);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchData = useCallback(async () => {
    if (!entryId || !courseId || !yearId) return;

    try {
      // Get teacher ID first
      const tId = await fetchTeacherId();
      setTeacherId(tId);

      // Get timetable entry details
      const { data: entryData } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          period,
          course_id,
          teacher_id,
          courses(code, name, short_name)
        `)
        .eq('id', entryId)
        .single();

      if (!entryData) {
        Alert.alert('Error', 'Timetable entry not found');
        router.back();
        return;
      }

      // Verify this teacher is assigned to this class
      if (tId && entryData.teacher_id !== tId) {
        Alert.alert('Unauthorized', 'You are not assigned to this class');
        router.back();
        return;
      }

      setEntry(entryData as TimetableEntry);

      // Get course's department first
      const { data: courseData } = await supabase
        .from('courses')
        .select('department_id')
        .eq('id', courseId)
        .single();

      // Get students in this department and year
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          roll_number,
          registration_number,
          user_id,
          profiles:user_id(full_name)
        `)
        .eq('department_id', courseData?.department_id)
        .eq('year_id', yearId)
        .eq('current_status', 'active')
        .order('roll_number');

      if (!studentsData) {
        setStudents([]);
        return;
      }

      // Get existing attendance for today
      const { data: existingAttendanceHeader } = await supabase
        .from('attendance')
        .select('id, is_locked')
        .eq('timetable_entry_id', entryId)
        .eq('date', dateStr)
        .eq('period', periodNum)
        .maybeSingle();

      let existingRecords: any[] = [];
      if (existingAttendanceHeader) {
        const { data: records } = await supabase
          .from('attendance_records')
          .select('id, student_id, status, late_minutes, edit_count')
          .eq('attendance_id', existingAttendanceHeader.id);
        existingRecords = records || [];
      }

      // Merge attendance data with students
      const mergedStudents: Student[] = (studentsData as Array<any>).map(student => {
        const record = existingRecords.find(r => r.student_id === student.id);
        return {
          ...student,
          roll_number: student.roll_number || student.registration_number,
          status: record?.status || null,
          late_minutes: record?.late_minutes || 0,
          attendance_id: existingAttendanceHeader?.id,
          attendance_record_id: record?.id,
          edit_count: record?.edit_count || 0,
          is_locked: existingAttendanceHeader?.is_locked || false,
        };
      });

      setStudents(mergedStudents);
      updateCounts(mergedStudents);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  }, [entryId, courseId, yearId, dateStr, periodNum, fetchTeacherId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateCounts = (studentList: Student[]) => {
    setPresentCount(studentList.filter(s => s.status === 'present').length);
    setAbsentCount(studentList.filter(s => s.status === 'absent').length);
    setLateCount(studentList.filter(s => s.status === 'late').length);
  };

  const handleMarkStatus = async (student: Student, status: AttendanceStatus) => {
    if (student.is_locked) {
      Alert.alert('Locked', 'This attendance record is locked and cannot be modified.');
      return;
    }

    if (status === 'late') {
      setSelectedStudentForLate(student);
      setShowLateModal(true);
      return;
    }

    await saveAttendance(student, status);
  };

  const handleConfirmLate = async () => {
    if (!selectedStudentForLate) return;
    await saveAttendance(selectedStudentForLate, 'late', parseInt(lateMinutes) || 5);
    setShowLateModal(false);
    setSelectedStudentForLate(null);
    setLateMinutes('5');
  };

  const saveAttendance = async (student: Student, status: AttendanceStatus, lateMins?: number) => {
    if (!entry || !profile || !teacherId) return;

    try {
      // Check for proxy (student marked in another class at same time)
      const { data: proxyCheck } = await supabase
        .from('attendance_records')
        .select(`
          id,
          attendance:attendance_id(
            id,
            period,
            date,
            timetable_entry_id,
            timetable_entries(courses(name))
          )
        `)
        .eq('student_id', student.id)
        .limit(20);

      // Filter for same date/period but different entry
      const proxyRecord = (proxyCheck as Array<any> | undefined)?.find(r => {
        const att = r.attendance as any;
        return att?.date === dateStr && 
               att?.period === entry.period && 
               att?.timetable_entry_id !== entry.id;
      });

      if (proxyRecord) {
        const att = proxyRecord.attendance as any;
        Alert.alert(
          '⚠️ Proxy Detected!',
          `${student.profiles.full_name} is already marked in another class for Period ${entry.period}.\n\nExisting: ${att?.timetable_entries?.courses?.name}`,
          [{ text: 'OK' }]
        );

        // Log proxy detection
        await supabase.from('attendance_logs').insert({
          action_type: 'proxy_detected',
          performed_by: profile.id,
          performer_role: 'teacher',
          target_type: 'student',
          target_id: student.id,
          student_id: student.id,
          timetable_entry_id: entry.id,
          details: {
            date: dateStr,
            period: entry.period,
            attempted_status: status,
            existing_attendance_id: att?.id,
          },
        });
        return;
      }

      // First, ensure we have an attendance header record
      let attendanceId = student.attendance_id;
      
      if (!attendanceId) {
        // Create attendance header record
        const { data: academicYear } = await supabase
          .from('academic_years')
          .select('id')
          .eq('is_current', true)
          .single();

        const { data: newAttendance, error: attendanceError } = await supabase
          .from('attendance')
          .insert({
            date: dateStr,
            period: entry.period,
            course_id: entry.course_id,
            year_id: yearId,
            timetable_entry_id: entry.id,
            academic_year_id: academicYear?.id,
            marked_by: profile.id,
          })
          .select('id')
          .single();

        if (attendanceError) {
          // Maybe it already exists (race condition), try to fetch it
          const { data: existingAtt } = await supabase
            .from('attendance')
            .select('id')
            .eq('date', dateStr)
            .eq('period', entry.period)
            .eq('timetable_entry_id', entry.id)
            .single();
          
          attendanceId = existingAtt?.id;
        } else {
          attendanceId = newAttendance?.id;
        }
      }

      if (!attendanceId) {
        Alert.alert('Error', 'Failed to create attendance record');
        return;
      }

      // Now create or update the student's attendance record
      if (student.attendance_record_id) {
        // Update existing record
        await supabase
          .from('attendance_records')
          .update({
            status,
            late_minutes: lateMins || 0,
            edited_by: profile.id,
            edited_at: new Date().toISOString(),
            edit_count: (student.edit_count || 0) + 1,
          })
          .eq('id', student.attendance_record_id);
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('attendance_records')
          .insert({
            attendance_id: attendanceId,
            student_id: student.id,
            status,
            late_minutes: lateMins || 0,
            marked_at: new Date().toISOString(),
          });
        
        if (insertError) {
          console.error('Insert error:', insertError);
          Alert.alert('Error', insertError.message);
          return;
        }
      }

      // Update local state
      const updatedStudents = students.map(s =>
        s.id === student.id
          ? { 
              ...s, 
              status, 
              late_minutes: lateMins || 0, 
              attendance_id: attendanceId,
              attendance_record_id: student.attendance_record_id || 'new',
              edit_count: (student.edit_count || 0) + (student.attendance_record_id ? 1 : 0),
            }
          : s
      );
      setStudents(updatedStudents);
      updateCounts(updatedStudents);
    } catch (error) {
      console.error('Error saving attendance:', error);
      Alert.alert('Error', 'Failed to save attendance');
    }
  };

  const handleBulkMark = async (status: AttendanceStatus) => {
    Alert.alert(
      `Mark All ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      `This will mark all unmarked students as ${status}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSaving(true);
            try {
              const unmarkedStudents = students.filter(s => !s.status && !s.is_locked);
              
              for (const student of unmarkedStudents) {
                await saveAttendance(student, status);
              }

              // Log bulk action
              if (profile) {
                await supabase.from('attendance_logs').insert({
                  action_type: 'bulk_marked',
                  performed_by: profile.id,
                  performer_role: 'teacher',
                  target_type: 'class',
                  timetable_entry_id: entry?.id,
                  details: {
                    date: dateStr,
                    period: entry?.period,
                    status,
                    count: unmarkedStudents.length,
                  },
                });
              }

              Alert.alert('Success', `Marked ${unmarkedStudents.length} students as ${status}`);
            } catch (error) {
              console.error('Error bulk marking:', error);
              Alert.alert('Error', 'Failed to bulk mark attendance');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const filteredStudents = students.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.roll_number?.toLowerCase().includes(query) ||
      student.profiles?.full_name?.toLowerCase().includes(query)
    );
  });

  const renderStudentCard = (student: Student, index: number) => {
    const isLocked = student.is_locked;

    return (
      <Animated.View
        key={student.id}
        entering={FadeInRight.delay(50 + index * 15).duration(200)}
        style={[
          styles.studentCard,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            borderColor: student.status === 'present'
              ? '#10b98130'
              : student.status === 'absent'
                ? '#ef444430'
                : student.status === 'late'
                  ? '#f59e0b30'
                  : 'transparent',
            opacity: isLocked ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.studentInfo}>
          <View style={[styles.rollBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.rollNumber, { color: colors.primary }]}>
              {student.roll_number || '—'}
            </Text>
          </View>
          <View style={styles.studentDetails}>
            <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
              {student.profiles?.full_name || 'Unknown'}
            </Text>
            {student.status === 'late' && (student.late_minutes || 0) > 0 && (
              <Text style={[styles.lateInfo, { color: '#f59e0b' }]}>
                Late by {student.late_minutes} min
              </Text>
            )}
          </View>
          {isLocked && (
            <FontAwesome5 name="lock" size={12} color={colors.textMuted} />
          )}
        </View>

        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[
              styles.statusBtn,
              { backgroundColor: student.status === 'present' ? '#10b981' : '#10b98115' },
            ]}
            onPress={() => handleMarkStatus(student, 'present')}
            disabled={isLocked}
          >
            <Text style={[styles.statusBtnText, { color: student.status === 'present' ? '#fff' : '#10b981' }]}>
              P
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusBtn,
              { backgroundColor: student.status === 'late' ? '#f59e0b' : '#f59e0b15' },
            ]}
            onPress={() => handleMarkStatus(student, 'late')}
            disabled={isLocked}
          >
            <Text style={[styles.statusBtnText, { color: student.status === 'late' ? '#fff' : '#f59e0b' }]}>
              L
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusBtn,
              { backgroundColor: student.status === 'absent' ? '#ef4444' : '#ef444415' },
            ]}
            onPress={() => handleMarkStatus(student, 'absent')}
            disabled={isLocked}
          >
            <Text style={[styles.statusBtnText, { color: student.status === 'absent' ? '#fff' : '#ef4444' }]}>
              A
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderLateModal = () => (
    <Modal visible={showLateModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Card style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Late Entry
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            {selectedStudentForLate?.profiles?.full_name}
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Late by (minutes)
          </Text>
          <View style={[styles.minutesInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <TouchableOpacity
              style={[styles.minusBtn, { backgroundColor: '#ef444415' }]}
              onPress={() => setLateMinutes(prev => Math.max(1, parseInt(prev) - 5).toString())}
            >
              <FontAwesome5 name="minus" size={12} color="#ef4444" />
            </TouchableOpacity>
            <TextInput
              style={[styles.minutesValue, { color: colors.textPrimary }]}
              value={lateMinutes}
              onChangeText={setLateMinutes}
              keyboardType="numeric"
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.plusBtn, { backgroundColor: '#10b98115' }]}
              onPress={() => setLateMinutes(prev => (parseInt(prev) + 5).toString())}
            >
              <FontAwesome5 name="plus" size={12} color="#10b981" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.lateWarning, { color: '#f59e0b' }]}>
            <FontAwesome5 name="info-circle" size={12} /> 4 late entries = 1 half-day leave
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.glassBackground }]}
              onPress={() => {
                setShowLateModal(false);
                setSelectedStudentForLate(null);
              }}
            >
              <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#f59e0b' }]}
              onPress={handleConfirmLate}
            >
              <Text style={[styles.modalBtnText, { color: '#fff' }]}>Mark Late</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
              {courseName || 'Mark Attendance'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {timing?.label || `Period ${periodNum}`} • {today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Stats Card */}
              <Animated.View entering={FadeIn.delay(150).duration(400)}>
                <Card style={[styles.statsCard, { borderColor: colors.primary + '30' }]}>
                  <View style={styles.statsRow}>
                    <View style={[styles.statItem, { backgroundColor: '#10b98115' }]}>
                      <Text style={[styles.statValue, { color: '#10b981' }]}>{presentCount}</Text>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>Present</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#f59e0b15' }]}>
                      <Text style={[styles.statValue, { color: '#f59e0b' }]}>{lateCount}</Text>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>Late</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: '#ef444415' }]}>
                      <Text style={[styles.statValue, { color: '#ef4444' }]}>{absentCount}</Text>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>Absent</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Text style={[styles.statValue, { color: colors.textSecondary }]}>
                        {students.length - presentCount - lateCount - absentCount}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>

              {/* Search & Bulk Actions */}
              {students.length > 0 && (
                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                  {/* Search */}
                  <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.textPrimary }]}
                      placeholder="Search by roll number or name..."
                      placeholderTextColor={colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Bulk Actions */}
                  <View style={styles.bulkActions}>
                    <Text style={[styles.bulkLabel, { color: colors.textSecondary }]}>
                      Bulk Mark:
                    </Text>
                    <TouchableOpacity
                      style={[styles.bulkBtn, { backgroundColor: '#10b98115' }]}
                      onPress={() => handleBulkMark('present')}
                      disabled={saving}
                    >
                      <Text style={[styles.bulkBtnText, { color: '#10b981' }]}>All Present</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bulkBtn, { backgroundColor: '#ef444415' }]}
                      onPress={() => handleBulkMark('absent')}
                      disabled={saving}
                    >
                      <Text style={[styles.bulkBtnText, { color: '#ef4444' }]}>All Absent</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* Students List */}
              <View style={styles.studentsList}>
                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <FontAwesome5 name="user-graduate" size={40} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      {searchQuery ? 'No students found' : 'No students in this class'}
                    </Text>
                  </View>
                ) : (
                  filteredStudents.map((student, index) => renderStudentCard(student, index))
                )}
              </View>
            </>
          )}
        </ScrollView>

        {renderLateModal()}
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
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  // Stats Card
  statsCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  // Search & Bulk
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14 },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  bulkLabel: { fontSize: 13, fontWeight: '500' },
  bulkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkBtnText: { fontSize: 12, fontWeight: '600' },
  // Students List
  studentsList: { marginTop: 8 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  studentInfo: {
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
  rollNumber: { fontSize: 12, fontWeight: '700' },
  studentDetails: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '500' },
  lateInfo: { fontSize: 10, marginTop: 2, fontWeight: '500' },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnText: { fontSize: 14, fontWeight: '700' },
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  minutesInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  minusBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutesValue: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  lateWarning: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
