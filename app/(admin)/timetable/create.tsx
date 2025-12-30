import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, PrimaryButton, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

const { width } = Dimensions.get('window');

// Period timings for JPM College
const PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35', startTime: '09:40', endTime: '10:35' },
  { period: 2, start: '10:50', end: '11:40', startTime: '10:50', endTime: '11:40' },
  { period: 3, start: '11:50', end: '12:45', startTime: '11:50', endTime: '12:45' },
  { period: 4, start: '13:25', end: '14:15', startTime: '13:25', endTime: '14:15' },
  { period: 5, start: '14:20', end: '15:10', startTime: '14:20', endTime: '15:10' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

interface Course {
  id: string;
  code: string;
  name: string;
  short_name: string;
  theory_hours: number;
  lab_hours: number;
}

interface Teacher {
  id: string;
  employee_id: string;
  profiles: { full_name: string };
}

interface TimetableSlot {
  day: number;
  period: number;
  courseId: string | null;
  teacherId: string | null;
  room: string | null;
  isLab: boolean;
  isLabContinuation?: boolean; // For 2-hour labs (second period)
}

interface DegreeProgram {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  department_id: string;
}

interface Year {
  id: string;
  year_number: number;
  name: string;
}

export default function CreateTimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string; yearId: string }>();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [degreeProgram, setDegreeProgram] = useState<DegreeProgram | null>(null);
  const [year, setYear] = useState<Year | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string>('');

  // Timetable grid state - 5 days x 5 periods
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  
  // Modal state
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; period: number } | null>(null);
  const [modalCourse, setModalCourse] = useState<string>('');
  const [modalTeacher, setModalTeacher] = useState<string>('');
  const [modalRoom, setModalRoom] = useState<string>('');
  const [modalIsLab, setModalIsLab] = useState(false);
  const [modalIs2Hour, setModalIs2Hour] = useState(false);

  // Initialize empty timetable
  const initializeSlots = () => {
    const newSlots: TimetableSlot[] = [];
    for (let day = 1; day <= 5; day++) {
      for (let period = 1; period <= 5; period++) {
        newSlots.push({
          day,
          period,
          courseId: null,
          teacherId: null,
          room: null,
          isLab: false,
        });
      }
    }
    return newSlots;
  };

  const fetchData = useCallback(async () => {
    try {
      // Get degree course, year, academic year, and subjects for this course's department
      const [courseRes, yearRes, academicYearRes] = await Promise.all([
        supabase.from('courses').select('id, name, code, short_name, department_id').eq('id', params.courseId).single(),
        supabase.from('years').select('id, year_number, name').eq('id', params.yearId).single(),
        supabase.from('academic_years').select('id').eq('is_current', true).single(),
      ]);

      if (courseRes.error || !courseRes.data) {
        Alert.alert('Error', 'Course not found');
        router.back();
        return;
      }

      setDegreeProgram(courseRes.data);
      setYear(yearRes.data);
      setAcademicYearId(academicYearRes.data?.id || '');

      // Get subjects (courses) for this degree's department
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, code, name, short_name, theory_hours, lab_hours')
        .eq('department_id', courseRes.data.department_id)
        .eq('is_active', true)
        .order('code');

      setCourses(coursesData || []);

      // Get all teachers (can assign any teacher)
      const { data: teachersData } = await supabase
        .from('teachers')
        .select('id, employee_id, profiles(full_name)')
        .eq('is_active', true)
        .order('employee_id');

      setTeachers(teachersData || []);

      // Check for existing timetable entries
      if (academicYearRes.data?.id) {
        const { data: existingEntries } = await supabase
          .from('timetable_entries')
          .select('*')
          .eq('programme_id', params.courseId)
          .eq('year_id', params.yearId)
          .eq('academic_year_id', academicYearRes.data.id)
          .eq('is_active', true);

        if (existingEntries && existingEntries.length > 0) {
          // Populate slots from existing entries
          const loadedSlots = initializeSlots();
          (existingEntries as Array<any>).forEach(entry => {
            const slotIndex = loadedSlots.findIndex(
              s => s.day === entry.day_of_week && s.period === entry.period
            );
            if (slotIndex !== -1) {
              loadedSlots[slotIndex] = {
                day: entry.day_of_week,
                period: entry.period,
                courseId: entry.course_id,
                teacherId: entry.teacher_id,
                room: entry.room,
                isLab: entry.is_lab || false,
              };
            }
          });
          setSlots(loadedSlots);
        } else {
          setSlots(initializeSlots());
        }
      } else {
        setSlots(initializeSlots());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [params.courseId, params.yearId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSlot = (day: number, period: number): TimetableSlot | undefined => {
    return slots.find(s => s.day === day && s.period === period);
  };

  const openSlotModal = (day: number, period: number) => {
    const slot = getSlot(day, period);
    setSelectedSlot({ day, period });
    setModalCourse(slot?.courseId || '');
    setModalTeacher(slot?.teacherId || '');
    setModalRoom(slot?.room || '');
    setModalIsLab(slot?.isLab || false);
    setModalIs2Hour(false);
    setShowSlotModal(true);
  };

  const checkTeacherClash = (teacherId: string, day: number, period: number): boolean => {
    // Check if this teacher is already assigned to another class at the same time
    // This would require checking all timetables - for now just check current one
    const existing = slots.find(
      s => s.day === day && s.period === period && s.teacherId === teacherId
    );
    return existing !== undefined && existing.teacherId !== null;
  };

  const checkLabClash = (day: number, period: number): boolean => {
    // Check if Computer Lab is already booked at this time
    const existing = slots.find(
      s => s.day === day && s.period === period && s.room === 'Computer Lab' && s.isLab
    );
    return existing !== undefined;
  };

  const handleSaveSlot = () => {
    if (!selectedSlot) return;

    const { day, period } = selectedSlot;

    // Validation
    if (modalCourse && !modalTeacher) {
      Alert.alert('Validation', 'Please assign a teacher for this subject');
      return;
    }

    // Check for 2-hour lab
    if (modalIsLab && modalIs2Hour && period >= 5) {
      Alert.alert('Validation', 'Cannot create 2-hour lab in the last period');
      return;
    }

    // Update slots
    const newSlots = [...slots];
    
    // Find and update the slot
    const slotIndex = newSlots.findIndex(s => s.day === day && s.period === period);
    if (slotIndex !== -1) {
      newSlots[slotIndex] = {
        day,
        period,
        courseId: modalCourse || null,
        teacherId: modalTeacher || null,
        room: modalRoom || null,
        isLab: modalIsLab,
      };
    }

    // If 2-hour lab, also set the next period
    if (modalIsLab && modalIs2Hour && period < 5) {
      const nextSlotIndex = newSlots.findIndex(s => s.day === day && s.period === period + 1);
      if (nextSlotIndex !== -1) {
        newSlots[nextSlotIndex] = {
          day,
          period: period + 1,
          courseId: modalCourse || null,
          teacherId: modalTeacher || null,
          room: modalRoom || null,
          isLab: true,
          isLabContinuation: true,
        };
      }
    }

    setSlots(newSlots);
    setShowSlotModal(false);
    setSelectedSlot(null);
  };

  const handleClearSlot = () => {
    if (!selectedSlot) return;

    const { day, period } = selectedSlot;
    const newSlots = [...slots];
    const slotIndex = newSlots.findIndex(s => s.day === day && s.period === period);
    
    if (slotIndex !== -1) {
      newSlots[slotIndex] = {
        day,
        period,
        courseId: null,
        teacherId: null,
        room: null,
        isLab: false,
      };
    }

    setSlots(newSlots);
    setShowSlotModal(false);
    setSelectedSlot(null);
  };

  const handleSaveTimetable = async () => {
    if (!academicYearId || !degreeProgram || !year) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    setSaving(true);
    try {
      // Delete existing entries for this course/year/academic year
      await supabase
        .from('timetable_entries')
        .delete()
        .eq('programme_id', degreeProgram.id)
        .eq('year_id', year.id)
        .eq('academic_year_id', academicYearId);

      // Prepare new entries (only non-empty slots)
      const entries = slots
        .filter(s => s.courseId)
        .map(s => ({
          course_id: s.courseId, // Subject course being taught
          programme_id: degreeProgram.id, // Degree programme
          year_id: year.id,
          academic_year_id: academicYearId,
          day_of_week: s.day,
          period: s.period,
          start_time: PERIOD_TIMINGS[s.period - 1].startTime,
          end_time: PERIOD_TIMINGS[s.period - 1].endTime,
          teacher_id: s.teacherId,
          room: s.room,
          is_lab: s.isLab,
          is_active: true,
        }));

      if (entries.length > 0) {
        const { error } = await supabase.from('timetable_entries').insert(entries);
        if (error) throw error;
      }

      Alert.alert('Success', 'Timetable saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving timetable:', error);
      Alert.alert('Error', 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const getCourseById = (id: string): Course | undefined => courses.find(c => c.id === id);
  const getTeacherById = (id: string): Teacher | undefined => teachers.find(t => t.id === id);

  const renderSlotModal = () => (
    <Modal visible={showSlotModal} transparent animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: withAlpha(colors.shadowColor, 0.6) }]}>
        <Card style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {selectedSlot ? `${DAYS[selectedSlot.day - 1]} - Period ${selectedSlot.period}` : 'Edit Slot'}
            </Text>
            <TouchableOpacity onPress={() => setShowSlotModal(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.timeHint, { color: colors.textMuted }]}>
            {selectedSlot && PERIOD_TIMINGS[selectedSlot.period - 1]
              ? `${PERIOD_TIMINGS[selectedSlot.period - 1].start} - ${PERIOD_TIMINGS[selectedSlot.period - 1].end}`
              : ''}
          </Text>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Subject Picker */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Subject</Text>
            <View
              style={[
                styles.pickerBox,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Picker
                selectedValue={modalCourse}
                onValueChange={(value) => {
                  setModalCourse(value);
                  // Auto-detect if it's a lab subject
                  const course = getCourseById(value);
                  if (course && course.lab_hours > 0) {
                    setModalIsLab(true);
                    setModalRoom('Computer Lab');
                  } else {
                    setModalIsLab(false);
                    setModalRoom('');
                  }
                }}
                style={{ color: colors.textPrimary }}
                dropdownIconColor={colors.textMuted}
              >
                <Picker.Item label="-- No Subject --" value="" />
                {courses.map(course => (
                  <Picker.Item
                    key={course.id}
                    label={`${course.code} - ${course.short_name || course.name}`}
                    value={course.id}
                  />
                ))}
              </Picker>
            </View>

            {/* Teacher Picker */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Teacher</Text>
            <View
              style={[
                styles.pickerBox,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Picker
                selectedValue={modalTeacher}
                onValueChange={setModalTeacher}
                style={{ color: colors.textPrimary }}
                dropdownIconColor={colors.textMuted}
              >
                <Picker.Item label="-- Select Teacher --" value="" />
                {teachers.map(teacher => (
                  <Picker.Item
                    key={teacher.id}
                    label={`${teacher.profiles?.full_name || 'Unknown'} (${teacher.employee_id})`}
                    value={teacher.id}
                  />
                ))}
              </Picker>
            </View>

            {/* Is Lab Toggle */}
            <TouchableOpacity
              style={[styles.toggleRow, { borderTopColor: colors.cardBorder }]}
              onPress={() => {
                setModalIsLab(!modalIsLab);
                if (!modalIsLab) {
                  setModalRoom('Computer Lab');
                } else {
                  setModalRoom('');
                }
              }}
            >
              <View>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Lab Session</Text>
                <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                  Uses Computer Lab room
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  {
                    backgroundColor: modalIsLab ? colors.primary : colors.inputBackground,
                    borderColor: modalIsLab ? colors.primary : colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    { backgroundColor: colors.textInverse, transform: [{ translateX: modalIsLab ? 20 : 2 }] },
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* 2-Hour Lab Toggle (only if lab and not last period) */}
            {modalIsLab && selectedSlot && selectedSlot.period < 5 && (
              <TouchableOpacity
                style={[styles.toggleRow, { borderTopColor: colors.cardBorder }]}
                onPress={() => setModalIs2Hour(!modalIs2Hour)}
              >
                <View>
                  <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>2-Hour Lab</Text>
                  <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                    Continues to Period {selectedSlot.period + 1}
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: modalIs2Hour ? colors.primary : colors.inputBackground,
                      borderColor: modalIs2Hour ? colors.primary : colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleKnob,
                      { backgroundColor: colors.textInverse, transform: [{ translateX: modalIs2Hour ? 20 : 2 }] },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            )}

            {/* Room Display */}
            {modalIsLab && (
              <View style={styles.roomInfo}>
                <FontAwesome5 name="door-open" size={14} color={colors.textMuted} />
                <Text style={[styles.roomText, { color: colors.textSecondary }]}>
                  Room: Computer Lab
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.clearBtn, { borderColor: colors.error }]}
              onPress={handleClearSlot}
            >
              <Text style={[styles.clearBtnText, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveSlot}
            >
              <Text style={[styles.saveBtnText, { color: colors.textInverse }]}>Save Slot</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
  );

  const renderGridView = () => (
    <View style={styles.gridContainer}>
      {/* Header Row - Days */}
      <View style={styles.gridRow}>
        <View style={[styles.gridHeaderCell, styles.timeCell, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.gridHeaderText, { color: colors.primary }]}>Time</Text>
        </View>
        {DAYS.map((day, index) => (
          <View
            key={day}
            style={[styles.gridHeaderCell, { backgroundColor: colors.inputBackground }]}
          >
            <Text style={[styles.gridHeaderText, { color: colors.primary }]}>{DAY_SHORT[index]}</Text>
          </View>
        ))}
      </View>

      {/* Period Rows */}
      {PERIOD_TIMINGS.map((timing) => (
        <View key={timing.period} style={styles.gridRow}>
          {/* Time Cell */}
          <View
            style={[
              styles.gridCell,
              styles.timeCell,
              { backgroundColor: colors.inputBackground },
            ]}
          >
            <Text style={[styles.periodNumber, { color: colors.primary }]}>P{timing.period}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{timing.start}</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>{timing.end}</Text>
          </View>

          {/* Day Cells - Editable */}
          {DAYS.map((_, dayIndex) => {
            const slot = getSlot(dayIndex + 1, timing.period);
            const isEmpty = !slot?.courseId;
            const course = slot?.courseId ? getCourseById(slot.courseId) : null;
            const teacher = slot?.teacherId ? getTeacherById(slot.teacherId) : null;
            const isLab = slot?.isLab;

            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.gridCell,
                  styles.editableCell,
                  {
                    backgroundColor: colors.inputBackground,
                    borderWidth: colors.borderWidth,
                    borderColor: isEmpty ? colors.inputBorder : isLab ? colors.primary : colors.success,
                  },
                ]}
                onPress={() => openSlotModal(dayIndex + 1, timing.period)}
                activeOpacity={0.7}
              >
                {!isEmpty ? (
                  <>
                    <Text
                      style={[styles.subjectCode, { color: isLab ? colors.primary : colors.success }]}
                      numberOfLines={1}
                    >
                      {course?.short_name || course?.code}
                    </Text>
                    <Text style={[styles.teacherName, { color: colors.textMuted }]} numberOfLines={1}>
                      {teacher?.profiles?.full_name?.split(' ')[0] || '-'}
                    </Text>
                    {isLab && (
                      <View style={styles.labBadge}>
                        <FontAwesome5 name="flask" size={8} color={colors.primary} />
                      </View>
                    )}
                  </>
                ) : (
                  <Ionicons name="add" size={20} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
          <LoadingIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading...</Text>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {year?.name} {degreeProgram?.code}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Edit Timetable
            </Text>
          </View>
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.instructionBar}>
          <Ionicons name="information-circle" size={16} color={colors.primary} />
          <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
            Tap on any slot to assign subject & teacher
          </Text>
        </Animated.View>

        {/* Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Animated.View entering={FadeIn.delay(200).duration(400)}>
              {renderGridView()}
            </Animated.View>
          </ScrollView>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Theory</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Lab</Text>
            </View>
          </View>

          {/* Summary */}
          <Card style={styles.summaryCard}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Slots:</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>25</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Filled:</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {slots.filter(s => s.courseId).length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Labs:</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {slots.filter(s => s.isLab).length}
              </Text>
            </View>
          </Card>
        </ScrollView>

        {/* Save Button */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
        >
          <PrimaryButton
            title={saving ? 'Saving...' : 'Save Timetable'}
            onPress={handleSaveTimetable}
            disabled={saving}
          />
        </Animated.View>

        {renderSlotModal()}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  loadingText: { marginTop: 12, fontSize: 14 },
  instructionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  instructionText: { fontSize: 13 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  // Grid Styles
  gridContainer: {
    minWidth: width - 40,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridHeaderCell: {
    width: 66,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  gridHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridCell: {
    width: 66,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    padding: 6,
    position: 'relative',
  },
  editableCell: {
    borderWidth: 0,
    borderStyle: 'dashed',
  },
  timeCell: {
    width: 54,
    height: 76,
  },
  periodNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 9,
    marginTop: 2,
  },
  subjectCode: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  teacherName: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  labBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 20,
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  // Summary Card
  summaryCard: {
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeHint: {
    fontSize: 13,
    textAlign: 'center',
    paddingBottom: 12,
  },
  modalBody: {
    padding: 20,
    paddingTop: 8,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerBox: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleHint: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  roomText: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
