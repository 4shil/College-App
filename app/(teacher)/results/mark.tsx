import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

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

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    // Trim trailing empty fields/rows
    const trimmed = row.map((c) => c.trim());
    const hasAny = trimmed.some((c) => c.length > 0);
    if (hasAny) rows.push(trimmed);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (ch === ',' || ch === ';' || ch === '\t')) {
      pushField();
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      // Handle CRLF
      if (ch === '\r' && next === '\n') i++;
      pushField();
      pushRow();
      continue;
    }

    field += ch;
  }

  // Flush
  pushField();
  pushRow();

  return rows;
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

  const [isLocked, setIsLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState<string | null>(null);

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

  const fetchLockStatus = useCallback(async () => {
    if (!scheduleId || !sectionId) return;

    const { data, error } = await supabase
      .from('exam_marks_locks')
      .select('locked_at, locked_by')
      .eq('exam_schedule_id', scheduleId)
      .eq('section_id', sectionId)
      .maybeSingle();

    if (error) {
      console.log('Teacher marks lock status error:', error.message);
      setIsLocked(false);
      setLockedAt(null);
      return;
    }

    setIsLocked(Boolean(data));
    setLockedAt((data as any)?.locked_at ?? null);
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
      await fetchLockStatus();
      setLoading(false);
    };

    load();
  }, [fetchScheduleAndSection, fetchStudentsAndExistingMarks, fetchLockStatus, scheduleId, sectionId]);

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
      const msg = String(e?.message || '').toLowerCase();
      const lockedHint =
        msg.includes('row-level security') ||
        msg.includes('permission denied') ||
        msg.includes('policy') ||
        msg.includes('not allowed') ||
        msg.includes('locked');

      Alert.alert('Error', lockedHint ? 'Marks are locked or you do not have access.' : e?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const importCsv = async () => {
    if (isLocked) return;
    if (!students.length) {
      Alert.alert('No students', 'There are no students to import marks for.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/vnd.ms-excel', '*/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file?.uri) {
      Alert.alert('Error', 'Failed to read file');
      return;
    }

    try {
      const text = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const rows = parseCsv(text);

      if (!rows.length) {
        Alert.alert('Empty file', 'No rows found in CSV.');
        return;
      }

      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_');
      const header = rows[0].map(norm);
      const hasHeader = header.some((h) =>
        ['registration_number', 'regno', 'roll_number', 'rollno', 'marks', 'mark', 'is_absent', 'absent'].includes(h)
      );

      const effectiveHeader = hasHeader ? header : ['registration_number', 'marks'];
      const startIndex = hasHeader ? 1 : 0;

      const idx = (names: string[]) => effectiveHeader.findIndex((h) => names.includes(h));
      const regIdx = idx(['registration_number', 'regno']);
      const rollIdx = idx(['roll_number', 'rollno']);
      const marksIdx = idx(['marks', 'mark']);
      const absentIdx = idx(['is_absent', 'absent']);

      if (regIdx < 0 && rollIdx < 0) {
        Alert.alert('Invalid CSV', 'CSV must include registration_number or roll_number column.');
        return;
      }
      if (marksIdx < 0 && absentIdx < 0) {
        Alert.alert('Invalid CSV', 'CSV must include marks column (or is_absent).');
        return;
      }

      const byReg = new Map<string, string>();
      const byRoll = new Map<string, string>();
      students.forEach((s) => {
        byReg.set(String(s.registration_number).trim().toLowerCase(), s.id);
        if (s.roll_number) byRoll.set(String(s.roll_number).trim().toLowerCase(), s.id);
      });

      let imported = 0;
      let skipped = 0;

      setMarks((prev) => {
        const copy = new Map(prev);

        for (let i = startIndex; i < rows.length; i++) {
          const r = rows[i];
          const reg = regIdx >= 0 ? String(r[regIdx] ?? '').trim().toLowerCase() : '';
          const roll = rollIdx >= 0 ? String(r[rollIdx] ?? '').trim().toLowerCase() : '';
          const marksRaw = marksIdx >= 0 ? String(r[marksIdx] ?? '').trim() : '';
          const absentRaw = absentIdx >= 0 ? String(r[absentIdx] ?? '').trim().toLowerCase() : '';
          const isAbsent = ['1', 'true', 'yes', 'y', 'abs', 'a'].includes(absentRaw);

          const studentId = (reg && byReg.get(reg)) || (roll && byRoll.get(roll)) || '';
          if (!studentId) {
            skipped++;
            continue;
          }

          copy.set(studentId, { marksText: isAbsent ? '' : marksRaw, is_absent: isAbsent });
          imported++;
        }

        return copy;
      });

      Alert.alert('Imported', `Imported ${imported} row(s). Skipped ${skipped} row(s).`);
    } catch (e: any) {
      console.log('CSV import error:', e?.message || e);
      Alert.alert('Error', 'Failed to import CSV');
    }
  };

  const lockMarks = async () => {
    if (isLocked) return;
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    if (!scheduleId || !sectionId) return;

    Alert.alert('Final Submit', 'Lock marks for this class? You will not be able to edit after locking.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Lock',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase.from('exam_marks_locks').insert({
              exam_schedule_id: scheduleId,
              section_id: sectionId,
              locked_by: user.id,
            });

            if (error) throw error;

            setIsLocked(true);
            setLockedAt(new Date().toISOString());
            Alert.alert('Locked', 'Marks are locked successfully');
          } catch (e: any) {
            console.log('Lock marks error:', e?.message || e);
            Alert.alert('Error', e?.message || 'Failed to lock marks');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
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

        {isLocked ? (
          <Card style={styles.lockBanner}>
            <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>Marks locked</Text>
            <Text style={[styles.lockSub, { color: colors.textSecondary }]}>Editing is disabled for this class.</Text>
            {lockedAt ? (
              <Text style={[styles.lockSub, { color: colors.textSecondary }]} numberOfLines={1}>
                Locked at: {new Date(lockedAt).toLocaleString()}
              </Text>
            ) : null}
          </Card>
        ) : null}

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
                      if (isLocked) return;
                      const nextAbsent = !m.is_absent;
                      setMarkField(s.id, { is_absent: nextAbsent, marksText: nextAbsent ? '' : m.marksText });
                    }}
                    style={[
                      styles.absentBtn,
                      {
                        backgroundColor: m.is_absent ? withAlpha(colors.error, 0.14) : withAlpha(colors.cardBackground, 0.3),
                        borderColor: m.is_absent ? withAlpha(colors.error, 0.35) : withAlpha(colors.cardBorder, 0.6),
                        opacity: isLocked ? 0.5 : 1,
                      },
                    ]}
                    activeOpacity={0.9}
                    disabled={isLocked}
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
                      editable={!m.is_absent && !isLocked}
                      containerStyle={{ marginBottom: 0 }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </Card>

        <View style={styles.footer}>
          {!isLocked ? (
            <View style={styles.footerActions}>
              <PrimaryButton
                title="Import CSV"
                onPress={importCsv}
                variant="outline"
                size="medium"
                disabled={saving}
                glowing={false}
              />
              <PrimaryButton
                title="Final Submit (Lock)"
                onPress={lockMarks}
                variant="secondary"
                size="medium"
                disabled={saving}
                glowing={false}
              />
            </View>
          ) : null}

          <PrimaryButton
            title={saving ? 'Saving…' : isLocked ? 'Locked' : 'Save Marks'}
            onPress={saveMarks}
            disabled={saving || isLocked}
          />
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
  lockBanner: { marginBottom: 14 },
  lockTitle: { fontSize: 14, fontWeight: '800' },
  lockSub: { marginTop: 6, fontSize: 12, fontWeight: '600' },
  footer: { marginTop: 14 },
  footerActions: { gap: 10, marginBottom: 10 },
  backBtn: { alignSelf: 'center', paddingVertical: 10 },
  backText: { fontSize: 13, fontWeight: '700' },
});
