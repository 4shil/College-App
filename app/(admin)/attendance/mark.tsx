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
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

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

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Year {
  id: string;
  year_number: number;
  name: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period: number;
  course_id: string;
  teacher_id: string;
  courses: { code: string; name: string; short_name: string };
  teachers: { id: string; profiles: { full_name: string } };
}

interface Student {
  id: string;
  roll_number: string;
  registration_number?: string;
  user_id: string;
  profiles: { full_name: string };
  status: 'present' | 'absent' | 'late' | null;
  late_minutes?: number;
  attendance_id?: string;         // The attendance header record id
  attendance_record_id?: string;  // The per-student attendance_records id
  edit_count?: number;
  is_locked?: boolean;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

export default function MarkAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();

  // Selection states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);

  // Data states
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLateModal, setShowLateModal] = useState(false);
  const [selectedStudentForLate, setSelectedStudentForLate] = useState<Student | null>(null);
  const [lateMinutes, setLateMinutes] = useState('5');

  // Stats
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);

  // Check if attendance is locked (older than 24 hours)
  const isDateLocked = useCallback(() => {
    const now = new Date();
    const selected = new Date(selectedDate);
    const diffHours = (now.getTime() - selected.getTime()) / (1000 * 60 * 60);
    return diffHours > 24;
  }, [selectedDate]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [programsRes, yearsRes] = await Promise.all([
        supabase.from('programs').select('id, name, code').eq('is_active', true).order('code'),
        supabase.from('years').select('id, year_number, name').order('year_number'),
      ]);

      setPrograms(programsRes.data || []);
      // Filter to years 1-3 (4th year optional)
      setYears(((yearsRes.data || []) as Array<{ year_number: number; id: string; name: string }>).filter(y => y.year_number <= 3));
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTimetableEntries = useCallback(async () => {
    if (!selectedProgram || !selectedYear || !selectedDate) return;

    try {
      // Get day of week (1 = Monday, 5 = Friday)
      let dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7; // Sunday becomes 7
      if (dayOfWeek === 6) {
        Alert.alert('Weekend', 'No classes on Saturday');
        return;
      }

      // Get academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear) return;

      // Check for holidays
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data: holiday } = await supabase
        .from('holidays')
        .select('title, holiday_type')
        .eq('date', dateStr)
        .single();

      if (holiday) {
        Alert.alert('Holiday', `${holiday.title} - ${holiday.holiday_type === 'college' ? 'College Holiday' : 'Department Holiday'}`);
        return;
      }

      const { data: entries } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          day_of_week,
          period,
          course_id,
          teacher_id,
          courses(code, name, short_name),
          teachers(id, profiles(full_name))
        `)
        .eq('program_id', selectedProgram)
        .eq('year_id', selectedYear)
        .eq('academic_year_id', academicYear.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('period');

      setTimetableEntries(entries || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  }, [selectedProgram, selectedYear, selectedDate]);

  const fetchStudents = useCallback(async () => {
    if (!selectedEntry) return;

    setLoadingStudents(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get students in this program and year
      // Use year_id OR current_year_id (handles both column names)
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          roll_number,
          registration_number,
          user_id,
          profiles:user_id(full_name)
        `)
        .eq('program_id', selectedProgram)
        .or(`year_id.eq.${selectedYear},current_year_id.eq.${selectedYear}`)
        .eq('is_active', true)
        .order('roll_number');

      if (!studentsData) {
        setStudents([]);
        return;
      }

      // Get existing attendance record for this date/period/course
      // The schema uses attendance (header) + attendance_records (per student)
      const { data: existingAttendanceHeader } = await supabase
        .from('attendance')
        .select('id, is_locked')
        .eq('timetable_entry_id', selectedEntry.id)
        .eq('date', dateStr)
        .eq('period', selectedEntry.period)
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
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedEntry, selectedDate, selectedProgram, selectedYear]);

  const updateCounts = (studentList: Student[]) => {
    setPresentCount(studentList.filter(s => s.status === 'present').length);
    setAbsentCount(studentList.filter(s => s.status === 'absent').length);
    setLateCount(studentList.filter(s => s.status === 'late').length);
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedProgram && selectedYear && selectedDate) {
      fetchTimetableEntries();
    }
  }, [selectedProgram, selectedYear, selectedDate, fetchTimetableEntries]);

  useEffect(() => {
    if (selectedEntry) {
      fetchStudents();
    }
  }, [selectedEntry, fetchStudents]);

  const handleSelectPeriod = (periodNum: number) => {
    setSelectedPeriod(periodNum);
    const entry = timetableEntries.find(e => e.period === periodNum);
    setSelectedEntry(entry || null);
  };

  const handleMarkStatus = async (student: Student, status: AttendanceStatus) => {
    if (student.is_locked || isDateLocked()) {
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
    if (!selectedEntry || !profile) return;

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Check for proxy (student marked in another class at same time)
      // Query attendance_records joined with attendance
      const { data: proxyCheck } = await supabase
        .from('attendance_records')
        .select(`
          id,
          attendance:attendance_id(
            id,
            period,
            timetable_entry_id,
            timetable_entries(courses(name))
          )
        `)
        .eq('student_id', student.id)
        .not('attendance.id', 'is', null)
        .limit(10);

      // Filter for same date/period but different entry
      const proxyRecord = (proxyCheck as Array<any> | undefined)?.find(r => {
        const att = r.attendance as any;
        return att?.period === selectedEntry.period && 
               att?.timetable_entry_id !== selectedEntry.id;
      });

      if (proxyRecord) {
        const att = proxyRecord.attendance as any;
        Alert.alert(
          '⚠️ Proxy Detected!',
          `${student.profiles.full_name} is already marked in another class for Period ${selectedEntry.period}.\n\nExisting: ${att?.timetable_entries?.courses?.name}`,
          [{ text: 'OK' }]
        );

        // Log proxy detection
        await supabase.from('attendance_logs').insert({
          action_type: 'proxy_detected',
          performed_by: profile.id,
          performer_role: profile.primary_role,
          target_type: 'student',
          target_id: student.id,
          student_id: student.id,
          timetable_entry_id: selectedEntry.id,
          details: {
            date: dateStr,
            period: selectedEntry.period,
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
            period: selectedEntry.period,
            course_id: selectedEntry.course_id,
            program_id: selectedProgram,
            year_id: selectedYear,
            timetable_entry_id: selectedEntry.id,
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
            .eq('period', selectedEntry.period)
            .eq('course_id', selectedEntry.course_id)
            .eq('timetable_entry_id', selectedEntry.id)
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
      const recordData = {
        attendance_id: attendanceId,
        student_id: student.id,
        status,
        late_minutes: lateMins || 0,
        marked_at: new Date().toISOString(),
        edited_by: student.attendance_record_id ? profile.id : null,
        edited_at: student.attendance_record_id ? new Date().toISOString() : null,
        edit_count: student.attendance_record_id ? (student.edit_count || 0) + 1 : 0,
      };

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
          .insert(recordData);
        
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
    if (isDateLocked()) {
      Alert.alert('Locked', 'Attendance for this date is locked.');
      return;
    }

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
                  performer_role: profile.primary_role,
                  target_type: 'class',
                  timetable_entry_id: selectedEntry?.id,
                  details: {
                    date: selectedDate.toISOString().split('T')[0],
                    period: selectedEntry?.period,
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
    const isLocked = student.is_locked || isDateLocked();

    return (
      <Animated.View
        key={student.id}
        entering={FadeInRight.delay(100 + index * 20).duration(200)}
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
              student.status === 'present' && styles.statusBtnActive,
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
              student.status === 'late' && styles.statusBtnActive,
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
              student.status === 'absent' && styles.statusBtnActive,
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Mark Attendance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Period-wise attendance
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
              {/* Date Picker */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <TouchableOpacity
                  style={[styles.datePickerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
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
                  {isDateLocked() && (
                    <View style={[styles.lockedBadge, { backgroundColor: '#ef444420' }]}>
                      <FontAwesome5 name="lock" size={10} color="#ef4444" />
                      <Text style={[styles.lockedText, { color: '#ef4444' }]}>Locked</Text>
                    </View>
                  )}
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

              {/* Program & Year Selectors */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.filtersRow}>
                <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Picker
                    selectedValue={selectedProgram}
                    onValueChange={setSelectedProgram}
                    style={{ color: colors.textPrimary }}
                    dropdownIconColor={colors.textMuted}
                  >
                    <Picker.Item label="Select Program" value="" />
                    {programs.map(p => (
                      <Picker.Item key={p.id} label={`${p.code} - ${p.name}`} value={p.id} />
                    ))}
                  </Picker>
                </View>

                <View style={[styles.pickerWrapper, styles.yearPicker, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={setSelectedYear}
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

              {/* Period Selector */}
              {timetableEntries.length > 0 && (
                <Animated.View entering={FadeInDown.delay(250).duration(400)}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Select Period
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodsScroll}>
                    {PERIOD_TIMINGS.map(timing => {
                      const entry = timetableEntries.find(e => e.period === timing.period);
                      const isSelected = selectedPeriod === timing.period;
                      const hasEntry = !!entry;

                      return (
                        <TouchableOpacity
                          key={timing.period}
                          style={[
                            styles.periodCard,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : hasEntry
                                  ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                                  : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                              borderColor: isSelected ? colors.primary : 'transparent',
                              opacity: hasEntry ? 1 : 0.4,
                            },
                          ]}
                          onPress={() => hasEntry && handleSelectPeriod(timing.period)}
                          disabled={!hasEntry}
                        >
                          <Text
                            style={[
                              styles.periodNum,
                              { color: isSelected ? '#fff' : colors.textPrimary },
                            ]}
                          >
                            P{timing.period}
                          </Text>
                          <Text
                            style={[
                              styles.periodTime,
                              { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted },
                            ]}
                          >
                            {timing.start}
                          </Text>
                          {hasEntry && (
                            <Text
                              style={[
                                styles.periodSubject,
                                { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary },
                              ]}
                              numberOfLines={1}
                            >
                              {entry.courses?.short_name || entry.courses?.code}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Selected Class Info */}
              {selectedEntry && (
                <Animated.View entering={FadeIn.delay(300).duration(400)}>
                  <Card style={[styles.classInfoCard, { borderColor: colors.primary + '30' }]}>
                    <View style={styles.classInfoHeader}>
                      <View>
                        <Text style={[styles.classInfoTitle, { color: colors.textPrimary }]}>
                          {selectedEntry.courses?.name}
                        </Text>
                        <Text style={[styles.classInfoTeacher, { color: colors.textSecondary }]}>
                          {selectedEntry.teachers?.profiles?.full_name}
                        </Text>
                      </View>
                      <View style={[styles.periodBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Text style={[styles.periodBadgeText, { color: colors.primary }]}>
                          Period {selectedEntry.period}
                        </Text>
                      </View>
                    </View>

                    {/* Stats Row */}
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
              )}

              {/* Bulk Actions & Search */}
              {selectedEntry && students.length > 0 && (
                <Animated.View entering={FadeInDown.delay(350).duration(400)}>
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
                  {!isDateLocked() && (
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
                  )}
                </Animated.View>
              )}

              {/* Students List */}
              {selectedEntry && (
                <View style={styles.studentsList}>
                  {loadingStudents ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                  ) : filteredStudents.length === 0 ? (
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
              )}

              {/* Empty State - No Selection */}
              {!selectedEntry && selectedProgram && selectedYear && timetableEntries.length === 0 && (
                <View style={styles.emptyState}>
                  <FontAwesome5 name="calendar-times" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No classes scheduled for this day
                  </Text>
                </View>
              )}

              {!selectedProgram && (
                <View style={styles.emptyState}>
                  <FontAwesome5 name="hand-pointer" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    Select program, year and period to mark attendance
                  </Text>
                </View>
              )}
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
    marginBottom: 16,
    gap: 12,
  },
  dateText: { flex: 1, fontSize: 15, fontWeight: '500' },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  lockedText: { fontSize: 10, fontWeight: '600' },
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
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  yearPicker: { flex: 0.35, minWidth: 100 },
  // Period Selector
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  periodsScroll: { marginBottom: 16 },
  periodCard: {
    width: 80,
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  periodNum: { fontSize: 16, fontWeight: '700' },
  periodTime: { fontSize: 10, marginTop: 2 },
  periodSubject: { fontSize: 10, marginTop: 4, fontWeight: '500' },
  // Class Info Card
  classInfoCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  classInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  classInfoTitle: { fontSize: 16, fontWeight: '700' },
  classInfoTeacher: { fontSize: 13, marginTop: 2 },
  periodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  periodBadgeText: { fontSize: 12, fontWeight: '600' },
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
  statusBtnActive: {},
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
