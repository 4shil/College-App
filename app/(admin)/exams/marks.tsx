import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface Exam {
  id: string;
  name: string;
  exam_type: string;
}

interface ExamSchedule {
  id: string;
  exam_id: string;
  course_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  max_marks: number;
  exam?: { academic_year_id: string };
  course?: { name: string; code: string };
}

interface Student {
  id: string;
  roll_number: string | null;
  registration_number: string;
  profiles?: { full_name: string };
}

interface ExamMark {
  id?: string;
  exam_schedule_id: string;
  student_id: string;
  marks_obtained: number;
  is_absent: boolean;
  status: 'draft' | 'verified' | 'published';
}

export default function ExamMarksScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Map<string, ExamMark>>(new Map());

  const [showBulkModal, setShowBulkModal] = useState(false);

  const fetchExams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, name, exam_type')
        .eq('is_published', true)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setExams(data || []);
      if (data && data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      Alert.alert('Error', 'Failed to fetch exams');
    }
  }, [selectedExamId]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedExamId) return;

    try {
      const { data, error } = await supabase
        .from('exam_schedules')
        .select(`
          id,
          exam_id,
          course_id,
          date,
          start_time,
          end_time,
          max_marks,
          exam:exam_id(academic_year_id),
          course:courses(name, code)
        `)
        .eq('exam_id', selectedExamId)
        .order('date');

      if (error) throw error;
      setSchedules(data || []);
      if (data && data.length > 0 && !selectedScheduleId) {
        setSelectedScheduleId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      Alert.alert('Error', 'Failed to fetch exam schedules');
    }
  }, [selectedExamId, selectedScheduleId]);

  const fetchStudentsAndMarks = useCallback(async () => {
    if (!selectedScheduleId) return;

    try {
      const schedule = schedules.find(s => s.id === selectedScheduleId);
      if (!schedule) return;

      // Derive cohort from timetable (programme + year) for this subject.
      const academicYearId = schedule.exam?.academic_year_id;
      if (!academicYearId) {
        setStudents([]);
        return;
      }

      const { data: classKeys, error: classKeyError } = await supabase
        .from('timetable_entries')
        .select('programme_id, year_id')
        .eq('academic_year_id', academicYearId)
        .eq('course_id', schedule.course_id)
        .eq('is_active', true);

      if (classKeyError) throw classKeyError;

      const keyMap = new Map<string, { programme_id: string | null; year_id: string }>();
      (classKeys as Array<any> | undefined)?.forEach((k) => {
        if (!k?.year_id) return;
        keyMap.set(`${k.programme_id || 'null'}:${k.year_id}`, { programme_id: k.programme_id ?? null, year_id: k.year_id });
      });

      const keys = Array.from(keyMap.values());
      if (keys.length === 0) {
        setStudents([]);
      } else {
        if (keys.length > 1) {
          Alert.alert(
            'Multiple Classes Found',
            'This subject appears in more than one programme/year. Showing combined students.'
          );
        }

        const lists = await Promise.all(
          keys.map(async (k) => {
            let q = supabase
              .from('students')
              .select('id, roll_number, registration_number, profiles:user_id(full_name)')
              .eq('year_id', k.year_id)
              .eq('current_status', 'active');

            if (k.programme_id) {
              q = q.eq('course_id', k.programme_id);
            }

            const { data: rows, error: studentsError } = await q.order('roll_number');
            if (studentsError) throw studentsError;
            return (rows as Student[]) || [];
          })
        );

        const merged = lists.flat();
        const byId = new Map<string, Student>();
        merged.forEach((s) => {
          if (s?.id) byId.set(s.id, s);
        });
        setStudents(Array.from(byId.values()));
      }

      // Fetch existing marks
      const { data: existingMarks, error: marksError } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('exam_schedule_id', selectedScheduleId);

      if (marksError) throw marksError;

      const marksMap = new Map<string, ExamMark>();
      existingMarks?.forEach((mark: any) => {
        marksMap.set(mark.student_id, mark);
      });
      setMarks(marksMap);
    } catch (error) {
      console.error('Error fetching students/marks:', error);
      Alert.alert('Error', 'Failed to fetch students and marks');
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
      fetchStudentsAndMarks();
    }
  }, [selectedScheduleId, fetchStudentsAndMarks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchExams(), fetchSchedules(), fetchStudentsAndMarks()]);
    setRefreshing(false);
  };

  const updateMark = (studentId: string, field: 'marks_obtained' | 'is_absent', value: any) => {
    const currentMark = marks.get(studentId) || {
      exam_schedule_id: selectedScheduleId,
      student_id: studentId,
      marks_obtained: 0,
      is_absent: false,
      status: 'draft' as const,
    };

    setMarks(new Map(marks.set(studentId, { ...currentMark, [field]: value })));
  };

  const handleSaveMarks = async (publishNow: boolean = false) => {
    try {
      setSaving(true);
      const userId = publishNow ? (await supabase.auth.getUser()).data.user?.id : null;
      const marksArray = Array.from(marks.values()).map((mark: ExamMark) => ({
        ...mark,
        status: publishNow ? 'published' as const : 'draft' as const,
        verified_by: userId,
        verified_at: publishNow ? new Date().toISOString() : null,
      }));

      const { error } = await supabase.from('exam_marks').upsert(marksArray, {
        onConflict: 'exam_schedule_id,student_id',
      });

      if (error) throw error;

      Alert.alert('Success', `Marks ${publishNow ? 'published' : 'saved as draft'} successfully`);
      await fetchStudentsAndMarks();
    } catch (error: any) {
      console.error('Error saving marks:', error);
      Alert.alert('Error', error.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAbsent = () => {
    Alert.alert('Mark All Absent', 'Mark all students as absent for this exam?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Absent',
        onPress: () => {
          students.forEach(student => {
            updateMark(student.id, 'is_absent', true);
            updateMark(student.id, 'marks_obtained', 0);
          });
          Alert.alert('Success', 'All students marked as absent');
        },
      },
    ]);
  };

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  const allMarksEntered = students.every(student => marks.has(student.id));
  const draftCount = Array.from(marks.values()).filter(m => m.status === 'draft').length;
  const publishedCount = Array.from(marks.values()).filter(m => m.status === 'published').length;

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <LoadingIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Enter Exam Marks</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {publishedCount} published, {draftCount} draft
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

        {/* Schedule Selection */}
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
                    label={`${schedule.course?.code} - ${schedule.course?.name} (Max: ${schedule.max_marks})`}
                    value={schedule.id}
                  />
                ))}
              </Picker>
            </View>
          </Card>
        )}

        {/* Course Info */}
        {selectedSchedule && (
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesome5 name="book" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {selectedSchedule.course?.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {new Date(selectedSchedule.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome5 name="trophy" size={16} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                Max Marks: {selectedSchedule.max_marks}
              </Text>
            </View>
          </Card>
        )}

        {/* Bulk Actions */}
        {selectedScheduleId && students.length > 0 && (
          <View style={styles.bulkActions}>
            <SolidButton
              onPress={handleBulkAbsent}
              style={[styles.bulkButton, { backgroundColor: colors.warning }]}
            >
              <FontAwesome5 name="user-times" size={16} color={colors.textInverse} />
              <Text style={[styles.bulkButtonText, { color: colors.textInverse }]}>Mark All Absent</Text>
            </SolidButton>
          </View>
        )}

        {/* Students List */}
        {students.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Students ({students.length})
            </Text>
            {students.map((student, index) => {
              const mark = marks.get(student.id);
              const isAbsent = mark?.is_absent || false;

              return (
                <Animated.View key={student.id} entering={FadeInDown.delay(index * 30).springify()}>
                  <Card style={styles.studentCard}>
                    <View style={styles.studentHeader}>
                      <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                          {student.profiles?.full_name}
                        </Text>
                        <Text style={[styles.studentAdmNo, { color: colors.textSecondary }]}>
                          {student.roll_number || student.registration_number}
                        </Text>
                      </View>
                      {mark?.status === 'published' && (
                        <View style={[styles.badge, { backgroundColor: colors.success }]}>
                          <Text style={[styles.badgeText, { color: colors.textInverse }]}>Published</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.marksInput}>
                      <View style={styles.marksField}>
                        <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Marks</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.inputBackground,
                              color: colors.textPrimary,
                              borderColor: colors.cardBorder,
                            },
                          ]}
                          value={mark?.marks_obtained?.toString() || ''}
                          onChangeText={(text) => {
                            const value = parseFloat(text) || 0;
                            if (value <= (selectedSchedule?.max_marks || 100)) {
                              updateMark(student.id, 'marks_obtained', value);
                            }
                          }}
                          keyboardType="numeric"
                          editable={!isAbsent && mark?.status !== 'published'}
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>

                      <TouchableOpacity
                        onPress={() => updateMark(student.id, 'is_absent', !isAbsent)}
                        style={[
                          styles.absentButton,
                          {
                            backgroundColor: isAbsent ? colors.error : colors.inputBackground,
                            borderColor: colors.cardBorder,
                          },
                        ]}
                        disabled={mark?.status === 'published'}
                      >
                        <FontAwesome5 name="user-times" size={16} color={isAbsent ? colors.textInverse : colors.textSecondary} />
                        <Text
                          style={[
                            styles.absentText,
                            { color: isAbsent ? colors.textInverse : colors.textSecondary },
                          ]}
                        >
                          {isAbsent ? 'Absent' : 'Mark Absent'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* Save Buttons */}
        {students.length > 0 && (
          <View style={styles.saveButtons}>
            <PrimaryButton
              title="Save as Draft"
              onPress={() => handleSaveMarks(false)}
              loading={saving}
              style={{ flex: 1, marginRight: 8, backgroundColor: colors.textSecondary }}
            />
            <PrimaryButton
              title="Publish Marks"
              onPress={() => handleSaveMarks(true)}
              loading={saving}
              style={{ flex: 1, marginLeft: 8 }}
              disabled={!allMarksEntered}
            />
          </View>
        )}

        {students.length === 0 && selectedScheduleId && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="users" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No students enrolled
            </Text>
          </Card>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  card: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  picker: { height: 50 },
  infoCard: { padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  infoText: { fontSize: 16 },
  bulkActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  bulkButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
  bulkButtonText: { fontSize: 14, fontWeight: '600' },
  studentCard: { padding: 16, marginBottom: 12 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentAdmNo: { fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  marksInput: { flexDirection: 'row', gap: 12 },
  marksField: { flex: 1 },
  inputLabel: { fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  absentButton: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginTop: 24 },
  absentText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  saveButtons: { flexDirection: 'row', marginTop: 16 },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
});
