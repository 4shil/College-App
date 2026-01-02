import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type AssignmentInfo = {
  id: string;
  title: string;
  due_date: string;
  max_marks: number | null;
  description: string | null;
  attachment_urls: string[] | null;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

type StudentInfo = {
  id: string;
  roll_number: string | null;
  registration_number: string;
  user_id: string;
  profiles: { full_name: string } | null;
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_urls: string[];
  submitted_at: string | null;
  is_late: boolean | null;
  status: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  students?: StudentInfo | null;
};

type DraftGrade = {
  marksText: string;
  feedbackText: string;
};

function formatDueDate(dueIso: string) {
  try {
    const dt = new Date(dueIso);
    if (Number.isNaN(dt.getTime())) return dueIso;
    return dt.toLocaleString();
  } catch {
    return dueIso;
  }
}

function clampTextToNumber(text: string) {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const num = Number.parseFloat(cleaned);
  return { cleaned, num: Number.isFinite(num) ? num : null };
}

export default function TeacherAssignmentSubmissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ assignmentId: string }>();

  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const assignmentId = params.assignmentId;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);

  const [draft, setDraft] = useState<Map<string, DraftGrade>>(new Map());

  const maxMarks = useMemo(() => assignment?.max_marks ?? 10, [assignment?.max_marks]);

  const subtitle = useMemo(() => {
    const count = submissions.length;
    if (count === 0) return 'No submissions yet';
    if (count === 1) return '1 submission';
    return `${count} submissions`;
  }, [submissions.length]);

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return;

    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
          id,
          title,
          due_date,
          max_marks,
          description,
          attachment_urls,
          courses(code, name, short_name)
        `
      )
      .eq('id', assignmentId)
      .single();

    if (error) {
      console.log('Teacher assignment load error:', error.message);
      Alert.alert('Error', 'Failed to load assignment');
      router.back();
      return;
    }

    setAssignment(data as any);
  }, [assignmentId, router]);

  const fetchSubmissions = useCallback(async () => {
    if (!assignmentId) return;

    const { data, error } = await supabase
      .from('assignment_submissions')
      .select(
        `
          id,
          assignment_id,
          student_id,
          submission_urls,
          submitted_at,
          is_late,
          status,
          marks_obtained,
          feedback,
          graded_by,
          graded_at,
          students:student_id(
            id,
            roll_number,
            registration_number,
            user_id,
            profiles:user_id(full_name)
          )
        `
      )
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.log('Teacher submissions load error:', error.message);
      setSubmissions([]);
      setDraft(new Map());
      return;
    }

    const list = (data || []) as any as SubmissionRow[];
    setSubmissions(list);

    const nextDraft = new Map<string, DraftGrade>();
    list.forEach((s) => {
      nextDraft.set(s.id, {
        marksText: s.marks_obtained === null || typeof s.marks_obtained === 'undefined' ? '' : String(s.marks_obtained),
        feedbackText: s.feedback || '',
      });
    });

    setDraft(nextDraft);
  }, [assignmentId]);

  useEffect(() => {
    const init = async () => {
      if (!assignmentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await fetchAssignment();
      await fetchSubmissions();
      setLoading(false);
    };

    init();
  }, [assignmentId, fetchAssignment, fetchSubmissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions();
    setRefreshing(false);
  };

  const setDraftField = (submissionId: string, next: Partial<DraftGrade>) => {
    setDraft((prev) => {
      const copy = new Map(prev);
      const current = copy.get(submissionId) || { marksText: '', feedbackText: '' };
      copy.set(submissionId, { ...current, ...next });
      return copy;
    });
  };

  const openUrl = async (url: string) => {
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Cannot open link', url);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const saveGrades = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const updates = submissions.map((s) => {
        const d = draft.get(s.id) || { marksText: '', feedbackText: '' };
        const { cleaned, num } = clampTextToNumber(d.marksText);

        if (cleaned.length > 0 && num === null) {
          throw new Error('Invalid marks value');
        }

        if (num !== null && num > maxMarks) {
          throw new Error(`Marks cannot exceed ${maxMarks}`);
        }

        return {
          id: s.id,
          marks_obtained: cleaned.length === 0 ? null : num,
          feedback: d.feedbackText.trim().length === 0 ? null : d.feedbackText.trim(),
          graded_by: user.id,
          graded_at: cleaned.length === 0 ? null : now,
        };
      });

      const results = await Promise.all(
        updates.map((u) =>
          supabase
            .from('assignment_submissions')
            .update({
              marks_obtained: u.marks_obtained,
              feedback: u.feedback,
              graded_by: u.graded_by,
              graded_at: u.graded_at,
            })
            .eq('id', u.id)
        )
      );

      const firstError = results.find((res: { error: any }) => res.error)?.error;
      if (firstError) throw firstError;

      Alert.alert('Saved', 'Grades updated successfully');
      await fetchSubmissions();
    } catch (e: any) {
      console.log('Teacher grade save error:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = assignment?.courses?.short_name || assignment?.courses?.code || 'Submissions';

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              style={[styles.backBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]} numberOfLines={1}>
                {headerTitle}
              </Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading submissions...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {assignment ? (
              <Card>
                <Text style={[styles.assignmentTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {assignment.title}
                </Text>
                <Text style={[styles.assignmentMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  Due: {formatDueDate(assignment.due_date)} {assignment.max_marks != null ? `• Max ${assignment.max_marks}` : ''}
                </Text>
                {assignment.description ? (
                  <Text style={[styles.assignmentMeta, { color: colors.textSecondary }]} numberOfLines={4}>
                    {assignment.description}
                  </Text>
                ) : null}

                {Array.isArray(assignment.attachment_urls) && assignment.attachment_urls.length > 0 ? (
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => openUrl(assignment.attachment_urls![0])}
                      style={[styles.linkBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                    >
                      <Ionicons name="attach-outline" size={18} color={colors.primary} />
                      <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                        Open Attachment
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </Card>
            ) : null}

            <View style={{ height: 12 }} />

            {submissions.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No submissions</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Student submissions will appear here.</Text>
              </Card>
            ) : (
              submissions.map((s, index) => {
                const studentName =
                  s.students?.profiles?.full_name ||
                  s.students?.registration_number ||
                  'Student';

                const studentMetaParts = [s.students?.roll_number ? `Roll ${s.students.roll_number}` : null, s.status || null]
                  .filter(Boolean)
                  .join(' • ');

                const d = draft.get(s.id) || { marksText: '', feedbackText: '' };

                const hasFile = Array.isArray(s.submission_urls) && s.submission_urls.length > 0;

                return (
                  <Animated.View
                    key={s.id}
                    entering={FadeInDown.delay(index * 25).duration(260)}
                    style={{ marginBottom: 12 }}
                  >
                    <Card>
                      <View style={styles.rowTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {studentName}
                          </Text>
                          {studentMetaParts ? (
                            <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                              {studentMetaParts}
                            </Text>
                          ) : null}

                          <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={2}>
                            {s.submitted_at ? `Submitted: ${formatDueDate(s.submitted_at)}` : 'Not submitted'}
                            {s.is_late ? ' • Late' : ''}
                          </Text>
                        </View>

                        {hasFile ? (
                          <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={() => openUrl(s.submission_urls[0])}
                            style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                          >
                            <Ionicons name="open-outline" size={18} color={colors.primary} />
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.iconBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}>
                            <Ionicons name="document-outline" size={18} color={colors.textMuted} />
                          </View>
                        )}
                      </View>

                      <View style={{ marginTop: 10 }}>
                        <GlassInput
                          icon="create-outline"
                          placeholder={`Marks (0-${maxMarks})`}
                          keyboardType="numeric"
                          value={d.marksText}
                          onChangeText={(t) => setDraftField(s.id, { marksText: t })}
                        />
                        <View style={{ height: 10 }} />
                        <GlassInput
                          icon="chatbubble-ellipses-outline"
                          placeholder="Feedback (optional)"
                          value={d.feedbackText}
                          onChangeText={(t) => setDraftField(s.id, { feedbackText: t })}
                        />
                      </View>
                    </Card>
                  </Animated.View>
                );
              })
            )}

            {submissions.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                <PrimaryButton title={saving ? 'Saving...' : 'Save Grades'} onPress={saveGrades} disabled={saving} />
              </View>
            ) : null}

            <View style={{ height: 24 }} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
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
  assignmentTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  assignmentMeta: {
    marginTop: 6,
    fontSize: 12,
  },
  linkBtn: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowSub: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  rowMeta: {
    marginTop: 6,
    fontSize: 12,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});
