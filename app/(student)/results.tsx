import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getStudentByUserId } from '../../lib/database';
import { withAlpha } from '../../theme/colorUtils';

type MarkRow = {
  id: string;
  marks_obtained: number | null;
  is_absent: boolean;
  remarks: string | null;
  verified_at: string | null;
  exam_schedules: {
    id: string;
    date: string;
    max_marks: number | null;
    courses?: { code: string; name: string; short_name: string | null } | null;
    exams?: { id: string; name: string; exam_type: string } | null;
  };
};

type ExternalRow = {
  id: string;
  result_pdf_url: string;
  sgpa: number | null;
  cgpa: number | null;
  upload_status: 'pending' | 'approved' | 'rejected' | string | null;
  verified_at: string | null;
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

export default function StudentResultsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarkRow[]>([]);
  const [external, setExternal] = useState<ExternalRow[]>([]);

  const fetchStudentId = useCallback(async () => {
    if (!user?.id) return null;
    const student = await getStudentByUserId(user.id);
    return student?.id || null;
  }, [user?.id]);

  const fetchMarks = useCallback(async (sId: string) => {
    const { data, error } = await supabase
      .from('exam_marks')
      .select(
        `
          id,
          marks_obtained,
          is_absent,
          remarks,
          verified_at,
          exam_schedules!inner(
            id,
            date,
            max_marks,
            courses(code, name, short_name),
            exams(id, name, exam_type)
          )
        `
      )
      .eq('student_id', sId)
      .order('verified_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Student marks error:', error.message);
      setMarks([]);
      return;
    }

    setMarks((data || []) as any);
  }, []);

  const fetchExternal = useCallback(async (sId: string) => {
    const { data, error } = await supabase
      .from('external_marks')
      .select(
        `
          id,
          result_pdf_url,
          sgpa,
          cgpa,
          upload_status,
          verified_at,
          rejection_reason,
          created_at,
          semesters(semester_number),
          academic_years(name)
        `
      )
      .eq('student_id', sId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Student external marks error:', error.message);
      setExternal([]);
      return;
    }

    setExternal((data || []) as any);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    const sId = studentId || (await fetchStudentId());
    setStudentId(sId);
    if (!sId) {
      setMarks([]);
      setExternal([]);
      return;
    }

    await Promise.all([fetchMarks(sId), fetchExternal(sId)]);
  }, [fetchExternal, fetchMarks, fetchStudentId, studentId, user?.id]);

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

  const subtitle = useMemo(() => {
    const m = marks.length;
    const e = external.length;
    return `Internal marks: ${m} • External uploads: ${e}`;
  }, [external.length, marks.length]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>My Results</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{subtitle}</Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading results...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {!studentId ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
              </Card>
            ) : (
              <>
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Internal Marks</Text>
                  <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Shows only verified marks for published exams</Text>
                </View>

                {marks.length === 0 ? (
                  <Card>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No internal marks</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>Marks will appear after verification.</Text>
                  </Card>
                ) : (
                  marks.map((m, index) => {
                    const courseLabel =
                      m.exam_schedules?.courses?.short_name ||
                      m.exam_schedules?.courses?.code ||
                      m.exam_schedules?.courses?.name ||
                      'Course';

                    const examLabel = m.exam_schedules?.exams?.name || 'Exam';
                    const max = m.exam_schedules?.max_marks ?? null;
                    const score = m.is_absent ? 'AB' : (m.marks_obtained ?? '-');

                    const chipBg = m.is_absent
                      ? withAlpha(colors.error, isDark ? 0.22 : 0.12)
                      : withAlpha(colors.success, isDark ? 0.22 : 0.12);
                    const chipText = m.is_absent ? colors.error : colors.success;

                    return (
                      <Animated.View key={m.id} entering={FadeInDown.delay(index * 25).duration(260)} style={{ marginBottom: 12 }}>
                        <Card>
                          <View style={styles.rowTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                {courseLabel}
                              </Text>
                              <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                                {examLabel} • {formatShortDate(m.exam_schedules.date)}
                              </Text>
                              {m.remarks ? (
                                <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={2}>
                                  {m.remarks}
                                </Text>
                              ) : null}
                            </View>

                            <View style={{ alignItems: 'flex-end', gap: 8 }}>
                              <View style={[styles.scoreChip, { backgroundColor: chipBg }]}>
                                <Text style={[styles.scoreText, { color: chipText }]}>{max ? `${score}/${max}` : String(score)}</Text>
                              </View>
                              <Text style={[styles.verified, { color: colors.textMuted }]}>
                                {m.verified_at ? `Verified ${formatShortDate(m.verified_at)}` : 'Not verified'}
                              </Text>
                            </View>
                          </View>
                        </Card>
                      </Animated.View>
                    );
                  })
                )}

                <View style={{ marginTop: 16, marginBottom: 10 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>External Results</Text>
                  <Text style={[styles.sectionSub, { color: colors.textMuted }]}>University result PDF uploads</Text>
                </View>

                {external.length === 0 ? (
                  <Card>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No external results</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>Upload will appear once submitted.</Text>
                  </Card>
                ) : (
                  external.map((e, index) => {
                    const status = (e.upload_status || 'pending').toLowerCase();
                    const tone = status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning';
                    const chipBg =
                      tone === 'success'
                        ? withAlpha(colors.success, isDark ? 0.22 : 0.12)
                        : tone === 'error'
                          ? withAlpha(colors.error, isDark ? 0.22 : 0.12)
                          : withAlpha(colors.warning, isDark ? 0.22 : 0.12);

                    const chipText =
                      tone === 'success' ? colors.success : tone === 'error' ? colors.error : colors.warning;

                    const title = `${e.academic_years?.name || 'Academic Year'} • Sem ${e.semesters?.semester_number ?? '-'}`;

                    return (
                      <Animated.View key={e.id} entering={FadeInDown.delay(index * 25).duration(260)} style={{ marginBottom: 12 }}>
                        <Card>
                          <View style={styles.rowTop}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                {title}
                              </Text>
                              <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                                SGPA: {e.sgpa ?? '-'} • CGPA: {e.cgpa ?? '-'}
                              </Text>
                              {status === 'rejected' && e.rejection_reason ? (
                                <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={2}>
                                  Reason: {e.rejection_reason}
                                </Text>
                              ) : null}
                            </View>

                            <View style={{ alignItems: 'flex-end', gap: 8 }}>
                              <View style={[styles.chip, { backgroundColor: chipBg }]}>
                                <Text style={[styles.chipText, { color: chipText }]}>{status.toUpperCase()}</Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => openUrl(e.result_pdf_url)}
                                activeOpacity={0.85}
                                style={[styles.openBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.14) }]}
                              >
                                <Text style={[styles.openText, { color: colors.primary }]}>Open PDF</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </Card>
                      </Animated.View>
                    );
                  })
                )}
              </>
            )}

            <View style={{ height: 20 }} />
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
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    marginTop: 3,
    fontSize: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
  },
  rowMeta: {
    marginTop: 6,
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scoreChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '900',
  },
  verified: {
    fontSize: 11,
    fontWeight: '600',
  },
  openBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  openText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
  },
});
