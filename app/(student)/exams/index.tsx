import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Animated, { FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { withAlpha } from '../../../theme/colorUtils';

type ExamRow = {
  id: string;
  name: string;
  exam_type: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
};

type ScheduleRow = {
  id: string;
  exam_id: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string | null;
  max_marks: number | null;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

type ExternalRow = {
  id: string;
  result_pdf_url: string;
  sgpa: number | null;
  cgpa: number | null;
  upload_status: 'pending' | 'approved' | 'rejected' | string | null;
  rejection_reason: string | null;
  created_at: string;
  semesters?: { semester_number: number } | null;
  academic_years?: { name: string } | null;
};

function formatShortDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function statusTone(status: string | null | undefined) {
  if (status === 'approved') return 'success' as const;
  if (status === 'rejected') return 'error' as const;
  if (status === 'pending') return 'warning' as const;
  return 'muted' as const;
}

export default function ExamsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [examById, setExamById] = useState<Record<string, ExamRow>>({});
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [latestExternal, setLatestExternal] = useState<ExternalRow | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;

    setError(null);
    const student = await getStudentByUserId(user.id);
    if (!student) {
      setExamById({});
      setSchedules([]);
      setLatestExternal(null);
      return;
    }

    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('id, name, exam_type, start_date, end_date, is_published')
      .eq('academic_year_id', student.academic_year_id)
      .eq('semester_id', student.semester_id)
      .eq('is_published', true)
      .order('start_date', { ascending: true });

    if (examsError) {
      setError(examsError.message);
      setExamById({});
      setSchedules([]);
      setLatestExternal(null);
      return;
    }

    const examMap: Record<string, ExamRow> = {};
    (exams || []).forEach((e: any) => {
      examMap[e.id] = e as ExamRow;
    });
    setExamById(examMap);

    const examIds = (exams || []).map((e: any) => e.id).filter(Boolean);
    if (examIds.length === 0) {
      setSchedules([]);
    } else {
      const { data: sched, error: schedError } = await supabase
        .from('exam_schedules')
        .select('id, exam_id, date, start_time, end_time, room, max_marks, courses(code, name, short_name)')
        .in('exam_id', examIds)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (schedError) {
        console.log('Exam schedules error:', schedError.message);
        setSchedules([]);
      } else {
        setSchedules((sched || []) as any);
      }
    }

    const { data: external, error: externalError } = await supabase
      .from('external_marks')
      .select(
        `
          id,
          result_pdf_url,
          sgpa,
          cgpa,
          upload_status,
          rejection_reason,
          created_at,
          semesters(semester_number),
          academic_years(name)
        `
      )
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (externalError) {
      console.log('External marks latest error:', externalError.message);
      setLatestExternal(null);
    } else {
      setLatestExternal((external?.[0] as any) || null);
    }
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    init();
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const openUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Cannot open link', 'Invalid or unsupported URL');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const upcoming = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return schedules
      .filter((s) => {
        const d = new Date(s.date);
        if (Number.isNaN(d.getTime())) return true;
        return d >= startOfToday;
      })
      .slice(0, 30);
  }, [schedules]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Exams</Text>
          <View style={{ width: 28 }} />
        </View>

        {!user?.id ? (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Not signed in</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Please log in to view exams.</Text>
          </Card>
        ) : loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading exams...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInRight.duration(300)}>
              <Card style={{ marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Internal marks + external uploads</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton
                    title="View My Results"
                    onPress={() => router.push('/(student)/results')}
                    variant="outline"
                    size="medium"
                  />
                </View>
              </Card>

              <Card style={{ marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>External Marks (Latest)</Text>
                {!latestExternal ? (
                  <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 8 }]}>No external upload found.</Text>
                ) : (
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                        Sem {latestExternal.semesters?.semester_number ?? '-'} • {latestExternal.academic_years?.name ?? 'Year'}
                      </Text>
                      {(() => {
                        const tone = statusTone(latestExternal.upload_status);
                        const bg =
                          tone === 'success'
                            ? withAlpha(colors.success, isDark ? 0.22 : 0.12)
                            : tone === 'warning'
                              ? withAlpha(colors.warning, isDark ? 0.22 : 0.12)
                              : tone === 'error'
                                ? withAlpha(colors.error, isDark ? 0.22 : 0.12)
                                : withAlpha(colors.textMuted, isDark ? 0.16 : 0.1);
                        const fg =
                          tone === 'success'
                            ? colors.success
                            : tone === 'warning'
                              ? colors.warning
                              : tone === 'error'
                                ? colors.error
                                : colors.textMuted;
                        return (
                          <View style={[styles.chip, { backgroundColor: bg, borderColor: withAlpha(fg, 0.35) }]}>
                            <Text style={[styles.chipText, { color: fg }]}>{String(latestExternal.upload_status || 'unknown')}</Text>
                          </View>
                        );
                      })()}
                    </View>

                    <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                      Uploaded {formatShortDate(latestExternal.created_at)}
                      {latestExternal.sgpa != null ? ` • SGPA ${latestExternal.sgpa}` : ''}
                      {latestExternal.cgpa != null ? ` • CGPA ${latestExternal.cgpa}` : ''}
                    </Text>

                    {latestExternal.upload_status === 'rejected' && !!latestExternal.rejection_reason && (
                      <Text style={[styles.rowMeta, { color: colors.textSecondary, marginTop: 6 }]}>
                        Reason: {latestExternal.rejection_reason}
                      </Text>
                    )}

                    <View style={{ marginTop: 10 }}>
                      <PrimaryButton
                        title="Open Result PDF"
                        onPress={() => openUrl(latestExternal.result_pdf_url)}
                        variant="outline"
                        size="small"
                      />
                    </View>
                  </View>
                )}
              </Card>

              <Card>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Exam Schedule</Text>
                <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Published exams for your semester</Text>

                {!!error && (
                  <Text style={[styles.errorText, { color: colors.error, marginTop: 10 }]}>{error}</Text>
                )}

                {upcoming.length === 0 ? (
                  <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 10 }]}>No upcoming exams found.</Text>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    {upcoming.map((s) => {
                      const exam = examById[s.exam_id];
                      const courseLabel = s.courses?.short_name || s.courses?.code || s.courses?.name || 'Course';
                      const examLabel = exam?.name || 'Exam';
                      const room = s.room ? ` • ${s.room}` : '';
                      const time = `${String(s.start_time).slice(0, 5)}–${String(s.end_time).slice(0, 5)}`;

                      return (
                        <View key={s.id} style={styles.scheduleRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                              {formatShortDate(s.date)} • {time}{room}
                            </Text>
                            <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                              {courseLabel} • {examLabel} ({exam?.exam_type || 'type'})
                              {s.max_marks != null ? ` • Max ${s.max_marks}` : ''}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </Card>
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
  },
  scheduleRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
