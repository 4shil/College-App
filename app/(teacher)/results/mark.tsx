import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type ScheduleInfo = {
  id: string;
  course_id: string;
  exam_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_marks: number | null;
  exams?: { name: string; exam_type: string; academic_year_id: string } | null;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

type SectionInfo = {
  id: string;
  name: string;
  year_id: string;
  department_id: string;
  academic_year_id: string;
};

type StudentRow = {
  id: string;
  roll_number: string | null;
  registration_number: string;
  user_id: string;
  profiles: { full_name: string } | null;
};

type ExistingMarkRow = {
  id: string;
  exam_schedule_id: string;
  student_id: string;
  marks_obtained: number | null;
  is_absent: boolean;
  remarks: string | null;
};

type DraftMark = {
  marksText: string;
  is_absent: boolean;
};

function clampTextToNumber(text: string) {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const num = Number.parseFloat(cleaned);
  return { cleaned, num: Number.isFinite(num) ? num : null };
}

export default function TeacherEnterMarksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ scheduleId: string; sectionId: string }>();

  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const scheduleId = params.scheduleId;
  const sectionId = params.sectionId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [section, setSection] = useState<SectionInfo | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const [marks, setMarks] = useState<Map<string, DraftMark>>(new Map());

  const maxMarks = useMemo(() => schedule?.max_marks ?? 100, [schedule?.max_marks]);

  const fetchScheduleAndSection = useCallback(async () => {
    if (!scheduleId || !sectionId) return;

    const { data: scheduleData, error: scheduleError } = await supabase
      .from('exam_schedules')
      .select(
        `
          id,
          course_id,
          exam_id,
          date,
          start_time,
          end_time,
          max_marks,
          exams(name, exam_type, academic_year_id),
          courses(code, name, short_name)
        `
      )
      .eq('id', scheduleId)
      .single();

    if (scheduleError) {
      console.log('Teacher marks schedule error:', scheduleError.message);
      Alert.alert('Error', 'Failed to load schedule');
      router.back();
      return;
    }

    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('id, name, year_id, department_id, academic_year_id')
      .eq('id', sectionId)
      .single();

    if (sectionError) {
      console.log('Teacher marks section error:', sectionError.message);
      Alert.alert('Error', 'Failed to load class');
      router.back();
      return;
    }

    setSchedule(scheduleData as any);
    setSection(sectionData as any);
  }, [router, scheduleId, sectionId]);

  const fetchStudentsAndExistingMarks = useCallback(async () => {
    if (!scheduleId || !sectionId) return;

    // Students in section
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select(
        `
          id,
          roll_number,
          registration_number,
          user_id,
          profiles:user_id(full_name)
        `
      )
      .eq('section_id', sectionId)
      .eq('current_status', 'active')
      .order('roll_number');

    if (studentsError) {
      console.log('Teacher marks students error:', studentsError.message);
      setStudents([]);
      return;
    }

    const list = (studentsData || []) as any as StudentRow[];
    setStudents(list);

    // Existing marks for schedule
    const { data: existing, error: marksError } = await supabase
      .from('exam_marks')
      .select('id, exam_schedule_id, student_id, marks_obtained, is_absent, remarks')
      .eq('exam_schedule_id', scheduleId);

    if (marksError) {
      console.log('Teacher marks existing marks error:', marksError.message);
      setMarks(new Map());
      return;
    }

    const map = new Map<string, DraftMark>();
    (existing || []).forEach((m: ExistingMarkRow) => {
      map.set(m.student_id, {
        marksText: m.marks_obtained === null || typeof m.marks_obtained === 'undefined' ? '' : String(m.marks_obtained),
        is_absent: Boolean(m.is_absent),
      });
    });

    // Ensure every student has a row in map (so UI feels consistent)
    list.forEach((s) => {
      if (!map.has(s.id)) {
        map.set(s.id, { marksText: '', is_absent: false });
      }
    });

    setMarks(map);
  }, [scheduleId, sectionId]);

  useEffect(() => {
    const load = async () => {
      if (!scheduleId || !sectionId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await fetchScheduleAndSection();
      await fetchStudentsAndExistingMarks();
      setLoading(false);
    };

    load();
  }, [fetchScheduleAndSection, fetchStudentsAndExistingMarks, scheduleId, sectionId]);

  const setMarkField = (studentId: string, next: Partial<DraftMark>) => {
    setMarks((prev) => {
      const copy = new Map(prev);
      const current = copy.get(studentId) || { marksText: '', is_absent: false };
      copy.set(studentId, { ...current, ...next });
      return copy;
    });
  };

  const saveMarks = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    if (!scheduleId) return;

    const payload = Array.from(marks.entries()).map(([studentId, m]) => {
      const { cleaned, num } = clampTextToNumber(m.marksText);

      if (!m.is_absent && cleaned.length > 0 && num === null) {
        throw new Error('Invalid marks value');
      }

      if (!m.is_absent && num !== null && num > maxMarks) {
        throw new Error(`Marks cannot exceed ${maxMarks}`);
      }

      return {
        exam_schedule_id: scheduleId,
        student_id: studentId,
        marks_obtained: m.is_absent ? null : num,
        is_absent: m.is_absent,
        entered_by: user.id,
        // verified_by / verified_at left for admins
      };
    });

    try {
      setSaving(true);
      const { error } = await supabase.from('exam_marks').upsert(payload, {
        onConflict: 'exam_schedule_id,student_id',
      });

      if (error) throw error;

      Alert.alert('Saved', 'Marks saved successfully');
      await fetchStudentsAndExistingMarks();
    } catch (e: any) {
      console.log('Teacher marks save error:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const title = useMemo(() => {
    const courseName = schedule?.courses?.short_name || schedule?.courses?.name || 'Subject';
    return courseName;
  }, [schedule?.courses?.name, schedule?.courses?.short_name]);

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
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {schedule?.exams?.name ? `${schedule.exams.name} • ` : ''}
            {section?.name ? `Class ${section.name} • ` : ''}
            Max {maxMarks}
          </Text>
        </Animated.View>

        <Card style={styles.card}>
          {(students || []).map((s) => {
            const m = marks.get(s.id) || { marksText: '', is_absent: false };
            const label = s.profiles?.full_name || s.registration_number;

            return (
              <View key={s.id} style={[styles.studentRow, { borderBottomColor: withAlpha(colors.cardBorder, 0.7) }]}>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {label}
                  </Text>
                  <Text style={[styles.studentMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {s.roll_number || s.registration_number}
                  </Text>
                </View>

                <View style={styles.controls}>
                  <TouchableOpacity
                    onPress={() => {
                      const nextAbsent = !m.is_absent;
                      setMarkField(s.id, { is_absent: nextAbsent, marksText: nextAbsent ? '' : m.marksText });
                    }}
                    style={[
                      styles.absentBtn,
                      {
                        backgroundColor: m.is_absent ? withAlpha(colors.error, 0.14) : withAlpha(colors.cardBackground, 0.3),
                        borderColor: m.is_absent ? withAlpha(colors.error, 0.35) : withAlpha(colors.cardBorder, 0.6),
                      },
                    ]}
                    activeOpacity={0.9}
                  >
                    <Ionicons
                      name={m.is_absent ? 'close-circle' : 'close-circle-outline'}
                      size={18}
                      color={m.is_absent ? colors.error : colors.textSecondary}
                    />
                    <Text style={[styles.absentText, { color: m.is_absent ? colors.error : colors.textSecondary }]}>Abs</Text>
                  </TouchableOpacity>

                  <View style={styles.marksInputWrap}>
                    <GlassInput
                      value={m.marksText}
                      onChangeText={(t) => setMarkField(s.id, { marksText: t })}
                      placeholder={m.is_absent ? '—' : '0'}
                      keyboardType="numeric"
                      editable={!m.is_absent}
                      containerStyle={{ marginBottom: 0 }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </Card>

        <View style={styles.footer}>
          <PrimaryButton title={saving ? 'Saving…' : 'Save Marks'} onPress={saveMarks} disabled={saving} />
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { marginTop: 6, fontSize: 13 },
  card: { padding: 0 },
  studentRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700' },
  studentMeta: { marginTop: 2, fontSize: 12 },
  controls: { width: 190, flexDirection: 'row', alignItems: 'center', gap: 10 },
  absentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  absentText: { fontSize: 12, fontWeight: '700' },
  marksInputWrap: { flex: 1, minWidth: 90 },
  footer: { marginTop: 14 },
  backBtn: { alignSelf: 'center', paddingVertical: 10 },
  backText: { fontSize: 13, fontWeight: '700' },
});
