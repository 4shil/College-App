import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';

type AcademicYearRow = {
  id: string;
  name: string;
  is_current: boolean;
};

type ExamRow = {
  id: string;
  name: string;
  exam_type: string;
  academic_year_id: string;
  start_date: string;
};

type TeacherTimetableRow = {
  course_id: string | null;
  section_id: string;
  sections?: {
    id: string;
    name: string;
    year_id: string;
    department_id: string;
  } | null;
  courses?: {
    id: string;
    code: string;
    name: string;
    short_name: string | null;
  } | null;
};

type ExamScheduleRow = {
  id: string;
  exam_id: string;
  course_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_marks: number | null;
  courses?: {
    id: string;
    code: string;
    name: string;
    short_name: string | null;
  } | null;
};

function labelCourse(c?: { code: string; name: string; short_name: string | null } | null) {
  if (!c) return 'Unknown course';
  const code = c.code ? `${c.code} — ` : '';
  return `${code}${c.short_name || c.name}`;
}

export default function TeacherResultsIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYearRow[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');

  const [exams, setExams] = useState<ExamRow[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  const [teacherTimetable, setTeacherTimetable] = useState<TeacherTimetableRow[]>([]);
  const [schedules, setSchedules] = useState<ExamScheduleRow[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchAcademicYears = useCallback(async () => {
    const { data, error } = await supabase
      .from('academic_years')
      .select('id, name, is_current')
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (error) {
      console.log('Teacher results academic years error:', error.message);
      setAcademicYears([]);
      return;
    }

    const list = (data || []) as AcademicYearRow[];
    setAcademicYears(list);

    if (!selectedAcademicYearId) {
      const current = list.find((y) => y.is_current);
      setSelectedAcademicYearId(current?.id || list[0]?.id || '');
    }
  }, [selectedAcademicYearId]);

  const fetchTeacherTimetable = useCallback(async () => {
    if (!teacherId || !selectedAcademicYearId) return;

    const { data, error } = await supabase
      .from('timetable_entries')
      .select(
        `
          course_id,
          section_id,
          sections(id, name, year_id, department_id),
          courses:courses!timetable_entries_course_id_fkey(id, code, name, short_name)
        `
      )
      .eq('academic_year_id', selectedAcademicYearId)
      .eq('teacher_id', teacherId)
      .eq('is_active', true);

    if (error) {
      console.log('Teacher results timetable error:', error.message);
      setTeacherTimetable([]);
      return;
    }

    setTeacherTimetable((data || []) as TeacherTimetableRow[]);
  }, [teacherId, selectedAcademicYearId]);

  const fetchExams = useCallback(async () => {
    if (!selectedAcademicYearId) return;

    const { data, error } = await supabase
      .from('exams')
      .select('id, name, exam_type, academic_year_id, start_date')
      .eq('academic_year_id', selectedAcademicYearId)
      .eq('is_published', true)
      .in('exam_type', ['internal', 'model'])
      .order('start_date', { ascending: false });

    if (error) {
      console.log('Teacher results exams error:', error.message);
      setExams([]);
      return;
    }

    const list = (data || []) as ExamRow[];
    setExams(list);

    if (!selectedExamId) {
      setSelectedExamId(list[0]?.id || '');
    } else if (list.length > 0 && !list.some((e) => e.id === selectedExamId)) {
      setSelectedExamId(list[0].id);
    }
  }, [selectedAcademicYearId, selectedExamId]);

  const teacherCourseIds = useMemo(() => {
    const ids = new Set<string>();
    teacherTimetable.forEach((t) => {
      if (t.course_id) ids.add(t.course_id);
    });
    return Array.from(ids);
  }, [teacherTimetable]);

  const fetchSchedules = useCallback(async () => {
    if (!selectedExamId) return;

    const { data, error } = await supabase
      .from('exam_schedules')
      .select(
        `
          id,
          exam_id,
          course_id,
          date,
          start_time,
          end_time,
          max_marks,
          courses(id, code, name, short_name)
        `
      )
      .eq('exam_id', selectedExamId)
      .order('date', { ascending: true });

    if (error) {
      console.log('Teacher results schedules error:', error.message);
      setSchedules([]);
      return;
    }

    const list = ((data || []) as ExamScheduleRow[]).filter((s) => teacherCourseIds.includes(s.course_id));
    setSchedules(list);

    if (!selectedScheduleId) {
      setSelectedScheduleId(list[0]?.id || '');
    } else if (list.length > 0 && !list.some((s) => s.id === selectedScheduleId)) {
      setSelectedScheduleId(list[0].id);
    }
  }, [selectedExamId, selectedScheduleId, teacherCourseIds]);

  const availableSectionsForSelectedCourse = useMemo(() => {
    const schedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!schedule) return [];

    const byCourse = teacherTimetable
      .filter((t) => t.course_id === schedule.course_id)
      .map((t) => ({
        section_id: t.section_id,
        section: t.sections,
      }))
      .filter((x) => Boolean(x.section_id) && Boolean(x.section));

    const unique = new Map<string, NonNullable<TeacherTimetableRow['sections']>>();
    byCourse.forEach((x) => {
      if (x.section && !unique.has(x.section_id)) unique.set(x.section_id, x.section);
    });

    return Array.from(unique.entries()).map(([id, section]) => ({ id, section }));
  }, [schedules, selectedScheduleId, teacherTimetable]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      await fetchAcademicYears();
      setLoading(false);
    };
    init();
  }, [fetchTeacherId, fetchAcademicYears]);

  useEffect(() => {
    if (!teacherId || !selectedAcademicYearId) return;
    fetchTeacherTimetable();
    fetchExams();
  }, [teacherId, selectedAcademicYearId, fetchTeacherTimetable, fetchExams]);

  useEffect(() => {
    if (!selectedExamId) return;
    fetchSchedules();
  }, [selectedExamId, fetchSchedules]);

  useEffect(() => {
    // Auto-pick section if only one
    if (availableSectionsForSelectedCourse.length === 1) {
      setSelectedSectionId(availableSectionsForSelectedCourse[0].id);
    } else if (
      availableSectionsForSelectedCourse.length > 0 &&
      selectedSectionId &&
      !availableSectionsForSelectedCourse.some((s) => s.id === selectedSectionId)
    ) {
      setSelectedSectionId('');
    }
  }, [availableSectionsForSelectedCourse, selectedSectionId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAcademicYears();
    await fetchTeacherTimetable();
    await fetchExams();
    await fetchSchedules();
    setRefreshing(false);
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedSchedule = schedules.find((s) => s.id === selectedScheduleId);

  const canEnter = Boolean(selectedScheduleId && selectedSectionId);

  const enterMarks = () => {
    if (!selectedScheduleId) {
      Alert.alert('Select Subject', 'Please select a subject schedule to enter marks.');
      return;
    }
    if (!selectedSectionId) {
      Alert.alert('Select Class', 'Please select a class/section.');
      return;
    }

    router.push({
      pathname: '/(teacher)/results/mark',
      params: {
        scheduleId: selectedScheduleId,
        sectionId: selectedSectionId,
      },
    });
  };

  const subtitle = useMemo(() => {
    const examCount = exams.length;
    const scheduleCount = schedules.length;
    if (!selectedAcademicYearId) return 'Select academic year';
    if (examCount === 0) return 'No published internal/model exams';
    if (scheduleCount === 0) return 'No schedules for your subjects';
    return 'Select exam and subject to enter marks';
  }, [exams.length, schedules.length, selectedAcademicYearId]);

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.loadingWrap, { paddingTop: insets.top + 60 }]}>
          <LoadingIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Results</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <Card style={styles.card}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Academic year</Text>
            <View style={[styles.pickerWrap, { borderColor: colors.cardBorder }]}> 
              <Picker
                selectedValue={selectedAcademicYearId}
                onValueChange={(v) => {
                  setSelectedAcademicYearId(v);
                  setSelectedExamId('');
                  setSelectedScheduleId('');
                  setSelectedSectionId('');
                }}
                dropdownIconColor={colors.textSecondary}
                style={{ color: colors.textPrimary }}
              >
                {academicYears.map((y) => (
                  <Picker.Item key={y.id} label={y.name} value={y.id} />
                ))}
              </Picker>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(450)}>
          <Card style={styles.card}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Exam</Text>
            <View style={[styles.pickerWrap, { borderColor: colors.cardBorder }]}> 
              <Picker
                selectedValue={selectedExamId}
                onValueChange={(v) => {
                  setSelectedExamId(v);
                  setSelectedScheduleId('');
                  setSelectedSectionId('');
                }}
                dropdownIconColor={colors.textSecondary}
                style={{ color: colors.textPrimary }}
                enabled={exams.length > 0}
              >
                {exams.length === 0 ? (
                  <Picker.Item label="No exams" value="" />
                ) : (
                  exams.map((e) => (
                    <Picker.Item
                      key={e.id}
                      label={`${e.name} (${e.exam_type})`}
                      value={e.id}
                    />
                  ))
                )}
              </Picker>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(450)}>
          <Card style={styles.card}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Subject</Text>
            <View style={[styles.pickerWrap, { borderColor: colors.cardBorder }]}> 
              <Picker
                selectedValue={selectedScheduleId}
                onValueChange={(v) => {
                  setSelectedScheduleId(v);
                  setSelectedSectionId('');
                }}
                dropdownIconColor={colors.textSecondary}
                style={{ color: colors.textPrimary }}
                enabled={schedules.length > 0}
              >
                {schedules.length === 0 ? (
                  <Picker.Item label="No schedules" value="" />
                ) : (
                  schedules.map((s) => (
                    <Picker.Item
                      key={s.id}
                      label={`${labelCourse(s.courses)} — ${s.date}`}
                      value={s.id}
                    />
                  ))
                )}
              </Picker>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(450)}>
          <Card style={styles.card}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Class</Text>
            <View style={[styles.pickerWrap, { borderColor: colors.cardBorder }]}> 
              <Picker
                selectedValue={selectedSectionId}
                onValueChange={(v) => setSelectedSectionId(v)}
                dropdownIconColor={colors.textSecondary}
                style={{ color: colors.textPrimary }}
                enabled={availableSectionsForSelectedCourse.length > 0}
              >
                {availableSectionsForSelectedCourse.length === 0 ? (
                  <Picker.Item label="No class found" value="" />
                ) : (
                  [
                    ...(availableSectionsForSelectedCourse.length > 1 ? [{ id: '', label: 'Select class' }] : []),
                    ...availableSectionsForSelectedCourse.map((s) => ({
                      id: s.id,
                      label: `${s.section.name}`,
                    })),
                  ].map((opt) => (
                    <Picker.Item key={opt.id || 'none'} label={opt.label} value={opt.id} />
                  ))
                )}
              </Picker>
            </View>
            {selectedSchedule && selectedExam && (
              <Text style={[styles.helper, { color: colors.textSecondary }]}>
                Max marks: {selectedSchedule.max_marks ?? 100}
              </Text>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).duration(450)} style={styles.footer}>
          <PrimaryButton title="Enter Marks" onPress={enterMarks} disabled={!canEnter} />
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 14 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: { marginTop: 6, fontSize: 14 },
  card: { padding: 16, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, marginBottom: 8, textTransform: 'uppercase' },
  pickerWrap: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  helper: { marginTop: 10, fontSize: 13 },
  footer: { marginTop: 10 },
});
