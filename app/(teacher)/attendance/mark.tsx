import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type AttendanceStatus = 'present' | 'absent' | 'late';

type StudentRow = {
  id: string;
  roll_number: string;
  registration_number?: string;
  user_id: string;
  profiles: { full_name: string };
  status: AttendanceStatus;
};

type TimetableEntry = {
  id: string;
  period: number;
  course_id: string | null;
  teacher_id: string | null;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

export default function TeacherMarkAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    entryId: string;
    courseName: string;
    courseId: string;
    yearId: string;
    sectionId?: string;
    programmeId?: string;
    departmentId?: string;
    period: string;
    date?: string;
  }>();

  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const entryId = params.entryId;
  const courseId = params.courseId;
  const yearId = params.yearId;
  const sectionId = (params.sectionId || '').trim() || null;
  const programmeId = (params.programmeId || '').trim() || null;
  const departmentId = (params.departmentId || '').trim() || null;
  const periodNum = parseInt(params.period || '0', 10);

  const dateStr = useMemo(() => {
    const raw = (params.date || '').trim();
    if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    return new Date().toISOString().split('T')[0];
  }, [params.date]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState<TimetableEntry | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);

  const initialSnapshotRef = useRef<string>('');
  const [dirty, setDirty] = useState(false);

  const snapshotStudents = useCallback((list: StudentRow[]) => {
    return list
      .map((s) => `${s.id}:${s.status}`)
      .sort()
      .join('|');
  }, []);

  const confirmDiscardAndGoBack = useCallback(() => {
    if (!dirty || saving) {
      router.back();
      return;
    }

    Alert.alert('Discard changes?', 'You have unsaved attendance changes.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [dirty, router, saving]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const ensureAttendanceHeader = useCallback(
    async (academicYearId: string) => {
      if (!entryId || !courseId || !yearId || !user?.id) return null;

      // Look for existing
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('timetable_entry_id', entryId)
        .eq('date', dateStr)
        .eq('period', periodNum)
        .maybeSingle();

      if (existing?.id) return existing.id;

      // Create
      const insertPayload: any = {
        date: dateStr,
        period: periodNum,
        course_id: courseId,
        programme_id: programmeId,
        department_id: departmentId,
        section_id: sectionId,
        academic_year_id: academicYearId,
        marked_by: user.id,
        timetable_entry_id: entryId,
        year_id: yearId || null,
      };

      const { data: created, error } = await supabase
        .from('attendance')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) {
        console.log('Attendance header insert error:', error.message);
        return null;
      }

      return created?.id || null;
    },
    [courseId, dateStr, departmentId, entryId, periodNum, programmeId, user?.id, yearId]
  );

  const fetchData = useCallback(async () => {
    if (!entryId || !courseId || !yearId || !user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const tId = await fetchTeacherId();

      // Current academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (!academicYear?.id) {
        Alert.alert('Error', 'No current academic year found');
        router.back();
        return;
      }

      if (!(periodNum >= 1 && periodNum <= 5)) {
        Alert.alert('Error', 'Invalid period. Expected 1–5.');
        router.back();
        return;
      }

      // Entry details
      const { data: entryData } = await supabase
        .from('timetable_entries')
        .select(
          `
            id,
            period,
            course_id,
            teacher_id,
            courses:courses!timetable_entries_course_id_fkey(code, name, short_name)
          `
        )
        .eq('id', entryId)
        .single();

      if (!entryData) {
        Alert.alert('Error', 'Timetable entry not found');
        router.back();
        return;
      }

      if (tId && entryData.teacher_id !== tId) {
        Alert.alert('Unauthorized', 'You are not assigned to this class');
        router.back();
        return;
      }

      setEntry(entryData as TimetableEntry);

      // Apply programme/department scoping if provided
      // - programmeId maps to students.course_id (degree programme)
      // - departmentId maps to students.department_id
      let scopedStudentsQuery = supabase
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
        .eq('current_status', 'active')
        .order('roll_number');

      // Canonical: section-based roster.
      if (sectionId) {
        scopedStudentsQuery = scopedStudentsQuery.eq('section_id', sectionId);
      } else {
        scopedStudentsQuery = scopedStudentsQuery.eq('year_id', yearId);
        if (programmeId) scopedStudentsQuery = scopedStudentsQuery.eq('course_id', programmeId);
        else if (departmentId) scopedStudentsQuery = scopedStudentsQuery.eq('department_id', departmentId);
      }

      const { data: scopedStudentsData } = await scopedStudentsQuery;

      const baseStudents: StudentRow[] = (scopedStudentsData || []).map((s: any) => ({
        ...s,
        roll_number: s.roll_number || s.registration_number,
        status: 'present' as AttendanceStatus,
      }));

      // Attendance header + existing records
      const aId = await ensureAttendanceHeader(academicYear.id);
      setAttendanceId(aId);

      if (!aId) {
        setStudents(baseStudents);
        initialSnapshotRef.current = snapshotStudents(baseStudents);
        setDirty(false);
        return;
      }

      const { data: records } = await supabase
        .from('attendance_records')
        .select('student_id, status')
        .eq('attendance_id', aId);

      const merged = baseStudents.map((s) => {
        const rec = (records || []).find((r: any) => r.student_id === s.id);
        return {
          ...s,
          status: (rec?.status as AttendanceStatus) || s.status,
        };
      });

      setStudents(merged);
      initialSnapshotRef.current = snapshotStudents(merged);
      setDirty(false);
    } catch (e) {
      console.error('Teacher mark attendance load error:', e);
      Alert.alert('Error', 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [courseId, departmentId, entryId, ensureAttendanceHeader, fetchTeacherId, periodNum, programmeId, router, sectionId, user?.id, yearId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) => {
      const next = prev.map((s) => (s.id === studentId ? { ...s, status } : s));
      const nextSnapshot = snapshotStudents(next);
      setDirty(nextSnapshot !== initialSnapshotRef.current);
      return next;
    });
  };

  const saveAttendance = async () => {
    if (!attendanceId) {
      Alert.alert('Error', 'Attendance header not created');
      return;
    }

    try {
      setSaving(true);

      const rows = students.map((s) => ({
        attendance_id: attendanceId,
        student_id: s.id,
        status: s.status,
      }));

      const { error } = await supabase
        .from('attendance_records')
        .upsert(rows, { onConflict: 'attendance_id,student_id' });

      if (error) {
        console.log('Attendance records upsert error:', error.message);
        const msg = (error.message || '').toLowerCase();
        const lockedHint =
          msg.includes('row-level security') ||
          msg.includes('permission denied') ||
          msg.includes('policy') ||
          msg.includes('not allowed');

        Alert.alert(
          'Error',
          lockedHint
            ? 'Attendance is locked or outside the allowed time window.'
            : 'Failed to save attendance'
        );
        return;
      }

      Alert.alert('Saved', 'Attendance saved successfully');
      initialSnapshotRef.current = snapshotStudents(students);
      setDirty(false);
      router.back();
    } catch (e) {
      console.error('Save attendance error:', e);
      Alert.alert('Error', 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = useMemo(() => students.filter((s) => s.status === 'present').length, [students]);
  const absentCount = useMemo(() => students.filter((s) => s.status === 'absent').length, [students]);
  const lateCount = useMemo(() => students.filter((s) => s.status === 'late').length, [students]);

  const statusPillStyle = (active: boolean) => ({
    backgroundColor: active
      ? withAlpha(colors.primary, isDark ? 0.28 : 0.14)
      : isDark
        ? withAlpha(colors.textInverse, 0.07)
        : withAlpha(colors.shadowColor, 0.05),
    borderColor: active ? withAlpha(colors.primary, 0.6) : withAlpha(colors.cardBorder, 0.55),
  });

  const bottomBarBg = withAlpha(colors.background, isDark ? 0.92 : 0.96);
  const bottomBarBorder = withAlpha(colors.cardBorder, 0.55);
  const bottomBarHeight = 92;

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + bottomBarHeight + 18 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 12 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={confirmDiscardAndGoBack}
              activeOpacity={0.85}
              style={[styles.backBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]}>Mark Attendance</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {entry?.courses?.name || params.courseName || 'Class'} • P{periodNum} • {dateStr}
              </Text>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>
              Loading students...
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              {students.map((s, idx) => (
                <Animated.View key={s.id} entering={FadeInDown.delay(idx * 20).duration(250)} style={{ marginBottom: 10 }}>
                  <Card>
                    <View style={styles.studentRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {s.profiles?.full_name || 'Student'}
                        </Text>
                        <Text style={[styles.studentMeta, { color: colors.textMuted }]}>
                          Roll: {s.roll_number}
                        </Text>
                      </View>

                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() => setStatus(s.id, 'present')}
                          activeOpacity={0.85}
                          style={[styles.pill, statusPillStyle(s.status === 'present')]}
                        >
                          <Text style={[styles.pillText, { color: s.status === 'present' ? colors.primary : colors.textMuted }]}>P</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setStatus(s.id, 'absent')}
                          activeOpacity={0.85}
                          style={[styles.pill, statusPillStyle(s.status === 'absent')]}
                        >
                          <Text style={[styles.pillText, { color: s.status === 'absent' ? colors.primary : colors.textMuted }]}>A</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setStatus(s.id, 'late')}
                          activeOpacity={0.85}
                          style={[styles.pill, statusPillStyle(s.status === 'late')]}
                        >
                          <Text style={[styles.pillText, { color: s.status === 'late' ? colors.primary : colors.textMuted }]}>L</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ))}
            </ScrollView>
        )}

        {!loading ? (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <Card style={[styles.bottomBarCard, { backgroundColor: bottomBarBg, borderColor: bottomBarBorder }] as any}>
              <View style={styles.bottomBarRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bottomCounts, { color: colors.textPrimary }]} numberOfLines={1}>
                    Present {presentCount} • Absent {absentCount} • Late {lateCount}
                  </Text>
                  {dirty ? (
                    <Text style={[styles.bottomHint, { color: colors.textMuted }]} numberOfLines={1}>
                      Unsaved changes
                    </Text>
                  ) : (
                    <Text style={[styles.bottomHint, { color: colors.textMuted }]} numberOfLines={1}>
                      All changes saved
                    </Text>
                  )}
                </View>
                <PrimaryButton
                  title={saving ? 'Saving...' : 'Save'}
                  onPress={saveAttendance}
                  disabled={saving || !dirty}
                  size="small"
                />
              </View>
            </Card>
          </View>
        ) : null}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
  },
  studentMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomBarCard: {
    padding: 14,
  },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomCounts: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomHint: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
});
