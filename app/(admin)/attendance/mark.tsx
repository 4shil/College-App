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
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
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

interface Course {
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
  marked_by_name?: string;
}

interface Teacher {
  id: string;
  user_id: string;
  profiles: { full_name: string };
}

interface Delegation {
  id: string;
  teacher_id: string;
  granted_by: string;
  valid_from: string;
  valid_until: string;
  course_id?: string;
  year_id?: string;
  is_active: boolean;
  reason?: string;
  teachers?: { profiles: { full_name: string } };
}

// Admin can only VIEW attendance - marking is done by teachers ONLY
// Admin can delegate attendance marking permission to specific teachers
export default function ViewAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();

  // Selection states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'view' | 'delegate'>('view');
  
  // Delegation modal states
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [delegationDays, setDelegationDays] = useState('7');
  const [delegationReason, setDelegationReason] = useState('');
  const [savingDelegation, setSavingDelegation] = useState(false);

  // Stats
  const [presentCount, setPresentCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);

  const fetchInitialData = useCallback(async () => {
    try {
      const [coursesRes, yearsRes, teachersRes, delegationsRes] = await Promise.all([
        // Fetch courses that have program_type (these are degree programs like BCA, BBA)
        supabase.from('courses').select('id, name, code, short_name').not('program_type', 'is', null).eq('is_active', true).order('code'),
        supabase.from('years').select('id, year_number, name').order('year_number'),
        supabase.from('teachers').select('id, user_id, profiles:user_id(full_name)').eq('is_active', true),
        supabase.from('attendance_delegations')
          .select(`
            id, teacher_id, granted_by, valid_from, valid_until, 
            course_id, year_id, is_active, reason,
            teachers(profiles:user_id(full_name))
          `)
          .eq('is_active', true)
          .gte('valid_until', new Date().toISOString()),
      ]);

      setCourses(coursesRes.data || []);
      setYears(((yearsRes.data || []) as Array<{ year_number: number; id: string; name: string }>).filter(y => y.year_number <= 3));
      setTeachers((teachersRes.data || []) as Teacher[]);
      setDelegations((delegationsRes.data || []) as Delegation[]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTimetableEntries = useCallback(async () => {
    if (!selectedCourse || !selectedYear || !selectedDate) return;

    try {
      let dayOfWeek = selectedDate.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      if (dayOfWeek === 6) {
        Alert.alert('Weekend', 'No classes on Saturday');
        return;
      }

      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear) return;

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
          id, day_of_week, period, course_id, teacher_id,
          courses(code, name, short_name),
          teachers(id, profiles:user_id(full_name))
        `)
        .eq('course_id', selectedCourse)
        .eq('year_id', selectedYear)
        .eq('academic_year_id', academicYear.id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('period');

      setTimetableEntries(entries || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  }, [selectedCourse, selectedYear, selectedDate]);

  const fetchStudents = useCallback(async () => {
    if (!selectedEntry) return;

    setLoadingStudents(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get course's department first
      const { data: courseData } = await supabase
        .from('courses')
        .select('department_id')
        .eq('id', selectedCourse)
        .single();

      if (!courseData) {
        setStudents([]);
        return;
      }

      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id, roll_number, registration_number, user_id,
          profiles:user_id(full_name)
        `)
        .eq('department_id', courseData.department_id)
        .eq('year_id', selectedYear)
        .eq('current_status', 'active')
        .order('roll_number');

      if (!studentsData) {
        setStudents([]);
        return;
      }

      // Get existing attendance
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select(`
          id, marked_by,
          profiles:marked_by(full_name)
        `)
        .eq('timetable_entry_id', selectedEntry.id)
        .eq('date', dateStr)
        .eq('period', selectedEntry.period)
        .maybeSingle();

      let existingRecords: any[] = [];
      if (existingAttendance) {
        const { data: records } = await supabase
          .from('attendance_records')
          .select('id, student_id, status, late_minutes')
          .eq('attendance_id', existingAttendance.id);
        existingRecords = records || [];
      }

      const mergedStudents: Student[] = (studentsData as Array<any>).map(student => {
        const record = existingRecords.find(r => r.student_id === student.id);
        return {
          ...student,
          roll_number: student.roll_number || student.registration_number,
          status: record?.status || null,
          late_minutes: record?.late_minutes || 0,
          marked_by_name: (existingAttendance as any)?.profiles?.full_name,
        };
      });

      setStudents(mergedStudents);
      updateCounts(mergedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, [selectedEntry, selectedDate, selectedCourse, selectedYear]);

  const updateCounts = (studentList: Student[]) => {
    setPresentCount(studentList.filter(s => s.status === 'present').length);
    setAbsentCount(studentList.filter(s => s.status === 'absent').length);
    setLateCount(studentList.filter(s => s.status === 'late').length);
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (selectedCourse && selectedYear && selectedDate) {
      fetchTimetableEntries();
    }
  }, [selectedCourse, selectedYear, selectedDate, fetchTimetableEntries]);

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

  // ===== DELEGATION FUNCTIONS =====
  const handleGrantDelegation = async () => {
    if (!selectedTeacher || !profile) {
      Alert.alert('Error', 'Please select a teacher');
      return;
    }

    setSavingDelegation(true);
    try {
      const validFrom = new Date();
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + parseInt(delegationDays));

      const { error } = await supabase.from('attendance_delegations').insert({
        teacher_id: selectedTeacher,
        granted_by: profile.id,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
        course_id: selectedCourse || null,
        year_id: selectedYear || null,
        reason: delegationReason || 'Delegated by admin',
        is_active: true,
      });

      if (error) {
        // Table might not exist yet
        if (error.message.includes('does not exist')) {
          Alert.alert('Setup Required', 'Delegation table not found. Please run the migration first.');
        } else {
          Alert.alert('Error', error.message);
        }
        return;
      }

      Alert.alert('Success', 'Delegation granted successfully!');
      setShowDelegationModal(false);
      setSelectedTeacher('');
      setDelegationDays('7');
      setDelegationReason('');
      fetchInitialData();
    } catch (error) {
      console.error('Error granting delegation:', error);
      Alert.alert('Error', 'Failed to grant delegation');
    } finally {
      setSavingDelegation(false);
    }
  };

  const handleRevokeDelegation = async (delegationId: string) => {
    Alert.alert(
      'Revoke Delegation',
      'Are you sure you want to revoke this delegation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('attendance_delegations')
                .update({ is_active: false })
                .eq('id', delegationId);
              
              Alert.alert('Success', 'Delegation revoked');
              fetchInitialData();
            } catch (error) {
              Alert.alert('Error', 'Failed to revoke delegation');
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

  const renderStudentCard = (student: Student, index: number) => (
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
                : colors.glassBorder,
          borderWidth: 1,
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
      </View>

      {/* Read-only status badge */}
      <View style={[
        styles.statusBadge,
        {
          backgroundColor: student.status === 'present' ? '#10b981'
            : student.status === 'absent' ? '#ef4444'
            : student.status === 'late' ? '#f59e0b'
            : colors.glassBackground,
        },
      ]}>
        <Text style={[
          styles.statusText,
          { color: student.status ? '#fff' : colors.textMuted },
        ]}>
          {student.status === 'present' ? 'P'
            : student.status === 'absent' ? 'A'
            : student.status === 'late' ? 'L'
            : '—'}
        </Text>
      </View>
    </Animated.View>
  );

  const renderDelegationCard = (delegation: Delegation, index: number) => {
    const teacherName = (delegation.teachers as any)?.profiles?.full_name || 'Unknown Teacher';
    const validUntil = new Date(delegation.valid_until).toLocaleDateString();
    
    return (
      <Animated.View
        key={delegation.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={[
          styles.delegationCard,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
        ]}
      >
        <View style={styles.delegationInfo}>
          <View style={[styles.teacherAvatar, { backgroundColor: colors.primary + '20' }]}>
            <FontAwesome5 name="user-tie" size={16} color={colors.primary} />
          </View>
          <View style={styles.delegationDetails}>
            <Text style={[styles.delegationName, { color: colors.textPrimary }]}>
              {teacherName}
            </Text>
            <Text style={[styles.delegationMeta, { color: colors.textSecondary }]}>
              Valid until {validUntil}
            </Text>
            {delegation.reason && (
              <Text style={[styles.delegationReason, { color: colors.textMuted }]}>
                {delegation.reason}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.revokeBtn, { backgroundColor: '#ef444415' }]}
          onPress={() => handleRevokeDelegation(delegation.id)}
        >
          <FontAwesome5 name="times" size={14} color="#ef4444" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDelegationModal = () => (
    <Modal visible={showDelegationModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Card style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Grant Delegation
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            Allow a teacher to mark attendance
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Select Teacher
          </Text>
          <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Picker
              selectedValue={selectedTeacher}
              onValueChange={setSelectedTeacher}
              style={{ color: colors.textPrimary }}
            >
              <Picker.Item label="Choose a teacher..." value="" />
              {teachers.map(t => (
                <Picker.Item 
                  key={t.id} 
                  label={(t.profiles as any)?.full_name || 'Unknown'} 
                  value={t.id} 
                />
              ))}
            </Picker>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>
            Duration (days)
          </Text>
          <View style={[styles.daysInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <TouchableOpacity
              style={styles.daysBtn}
              onPress={() => setDelegationDays(prev => Math.max(1, parseInt(prev) - 1).toString())}
            >
              <FontAwesome5 name="minus" size={12} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.daysValue, { color: colors.textPrimary }]}
              value={delegationDays}
              onChangeText={setDelegationDays}
              keyboardType="numeric"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.daysBtn}
              onPress={() => setDelegationDays(prev => (parseInt(prev) + 1).toString())}
            >
              <FontAwesome5 name="plus" size={12} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 16 }]}>
            Reason (optional)
          </Text>
          <TextInput
            style={[
              styles.reasonInput,
              { 
                color: colors.textPrimary,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              },
            ]}
            value={delegationReason}
            onChangeText={setDelegationReason}
            placeholder="e.g., Cover for leave period"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.glassBackground }]}
              onPress={() => setShowDelegationModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={handleGrantDelegation}
              disabled={savingDelegation}
            >
              {savingDelegation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Grant</Text>
              )}
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>View Attendance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              <FontAwesome5 name="eye" size={10} /> View only • Teachers mark attendance
            </Text>
          </View>
        </Animated.View>

        {/* Tab Switcher */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'view' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('view')}
          >
            <FontAwesome5 
              name="eye" 
              size={14} 
              color={activeTab === 'view' ? '#fff' : colors.textMuted} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'view' ? '#fff' : colors.textMuted },
            ]}>
              View Records
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'delegate' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('delegate')}
          >
            <FontAwesome5 
              name="user-shield" 
              size={14} 
              color={activeTab === 'delegate' ? '#fff' : colors.textMuted} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'delegate' ? '#fff' : colors.textMuted },
            ]}>
              Delegations
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : activeTab === 'view' ? (
            // ===== VIEW TAB =====
            <>
              {/* Info Banner */}
              <Animated.View 
                entering={FadeIn.delay(100).duration(300)}
                style={[styles.infoBanner, { backgroundColor: '#3b82f615' }]}
              >
                <FontAwesome5 name="info-circle" size={14} color="#3b82f6" />
                <Text style={[styles.infoText, { color: '#3b82f6' }]}>
                  Attendance is marked by teachers only. You can view records and grant delegation permissions.
                </Text>
              </Animated.View>

              {/* Date Picker */}
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
              </TouchableOpacity>

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

              {/* Filters */}
              <View style={styles.filtersRow}>
                <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Picker
                    selectedValue={selectedCourse}
                    onValueChange={setSelectedCourse}
                    style={{ color: colors.textPrimary }}
                  >
                    <Picker.Item label="Select Course" value="" />
                    {courses.map(c => (
                      <Picker.Item key={c.id} label={`${c.code} - ${c.short_name || c.name}`} value={c.id} />
                    ))}
                  </Picker>
                </View>

                <View style={[styles.pickerWrapper, styles.yearPicker, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={setSelectedYear}
                    style={{ color: colors.textPrimary }}
                  >
                    <Picker.Item label="Year" value="" />
                    {years.map(y => (
                      <Picker.Item key={y.id} label={y.name} value={y.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Period Cards */}
              {timetableEntries.length > 0 && (
                <>
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
                              backgroundColor: isSelected ? colors.primary
                                : hasEntry ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                                : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                              opacity: hasEntry ? 1 : 0.4,
                            },
                          ]}
                          onPress={() => hasEntry && handleSelectPeriod(timing.period)}
                          disabled={!hasEntry}
                        >
                          <Text style={[styles.periodNum, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                            P{timing.period}
                          </Text>
                          <Text style={[styles.periodTime, { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>
                            {timing.start}
                          </Text>
                          {hasEntry && (
                            <Text style={[styles.periodCourse, { color: isSelected ? 'rgba(255,255,255,0.9)' : colors.textSecondary }]} numberOfLines={1}>
                              {entry?.courses?.short_name || entry?.courses?.code}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              {/* Students List */}
              {selectedEntry && (
                <>
                  {/* Entry Info */}
                  <Card style={[styles.entryCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                    <View style={styles.entryHeader}>
                      <View>
                        <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>
                          {selectedEntry.courses?.name}
                        </Text>
                        <Text style={[styles.entryTeacher, { color: colors.textSecondary }]}>
                          <FontAwesome5 name="chalkboard-teacher" size={10} /> {(selectedEntry.teachers as any)?.profiles?.full_name || 'Unknown'}
                        </Text>
                      </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                      <View style={[styles.statBadge, { backgroundColor: '#10b98115' }]}>
                        <Text style={[styles.statNum, { color: '#10b981' }]}>{presentCount}</Text>
                        <Text style={[styles.statLabel, { color: '#10b981' }]}>Present</Text>
                      </View>
                      <View style={[styles.statBadge, { backgroundColor: '#f59e0b15' }]}>
                        <Text style={[styles.statNum, { color: '#f59e0b' }]}>{lateCount}</Text>
                        <Text style={[styles.statLabel, { color: '#f59e0b' }]}>Late</Text>
                      </View>
                      <View style={[styles.statBadge, { backgroundColor: '#ef444415' }]}>
                        <Text style={[styles.statNum, { color: '#ef4444' }]}>{absentCount}</Text>
                        <Text style={[styles.statLabel, { color: '#ef4444' }]}>Absent</Text>
                      </View>
                      <View style={[styles.statBadge, { backgroundColor: colors.glassBackground }]}>
                        <Text style={[styles.statNum, { color: colors.textMuted }]}>{students.length - presentCount - lateCount - absentCount}</Text>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
                      </View>
                    </View>

                    {students[0]?.marked_by_name && (
                      <Text style={[styles.markedBy, { color: colors.textMuted }]}>
                        <FontAwesome5 name="user-check" size={10} /> Marked by: {students[0].marked_by_name}
                      </Text>
                    )}
                  </Card>

                  {/* Search */}
                  <View style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.textPrimary }]}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search students..."
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>

                  {/* Student Cards */}
                  {loadingStudents ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                  ) : filteredStudents.length === 0 ? (
                    <View style={styles.emptyState}>
                      <FontAwesome5 name="users-slash" size={32} color={colors.textMuted} />
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                        No students found
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.studentsList}>
                      {filteredStudents.map(renderStudentCard)}
                    </View>
                  )}
                </>
              )}
            </>
          ) : (
            // ===== DELEGATE TAB =====
            <>
              {/* Info Banner */}
              <Animated.View 
                entering={FadeIn.delay(100).duration(300)}
                style={[styles.infoBanner, { backgroundColor: '#8b5cf615' }]}
              >
                <FontAwesome5 name="user-shield" size={14} color="#8b5cf6" />
                <Text style={[styles.infoText, { color: '#8b5cf6' }]}>
                  Grant temporary attendance marking permissions to teachers for specific periods.
                </Text>
              </Animated.View>

              {/* Add Delegation Button */}
              <TouchableOpacity
                style={[styles.addDelegationBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowDelegationModal(true)}
              >
                <FontAwesome5 name="plus" size={14} color="#fff" />
                <Text style={styles.addDelegationText}>Grant New Delegation</Text>
              </TouchableOpacity>

              {/* Active Delegations */}
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>
                Active Delegations
              </Text>

              {delegations.length === 0 ? (
                <View style={styles.emptyState}>
                  <FontAwesome5 name="user-shield" size={32} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No active delegations
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                    Grant delegation to allow teachers to mark attendance
                  </Text>
                </View>
              ) : (
                <View style={styles.delegationsList}>
                  {delegations.map(renderDelegationCard)}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {renderDelegationModal()}
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
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  
  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  
  // Date Picker
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  dateText: { fontSize: 15, fontWeight: '500', flex: 1 },
  
  // Filters
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pickerWrapper: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  yearPicker: { flex: 1 },
  
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  
  // Periods
  periodsScroll: { marginBottom: 20 },
  periodCard: {
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginRight: 10,
    alignItems: 'center',
  },
  periodNum: { fontSize: 16, fontWeight: '700' },
  periodTime: { fontSize: 11, marginTop: 2 },
  periodCourse: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  
  // Entry Card
  entryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entryTitle: { fontSize: 16, fontWeight: '600' },
  entryTeacher: { fontSize: 12, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  statNum: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 2 },
  markedBy: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14 },
  
  // Students List
  studentsList: { marginTop: 8 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
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
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: 14, fontWeight: '700' },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Delegation
  addDelegationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
  },
  addDelegationText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  
  delegationsList: { marginTop: 8 },
  delegationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  delegationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  teacherAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delegationDetails: { flex: 1 },
  delegationName: { fontSize: 14, fontWeight: '600' },
  delegationMeta: { fontSize: 11, marginTop: 2 },
  delegationReason: { fontSize: 10, marginTop: 2, fontStyle: 'italic' },
  revokeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  pickerContainer: { borderRadius: 12, overflow: 'hidden' },
  daysInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  daysBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysValue: { flex: 1, fontSize: 20, fontWeight: '700' },
  reasonInput: {
    padding: 14,
    borderRadius: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
