import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { withAlpha } from '../../../theme/colorUtils';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { GlassInput, PrimaryButton } from '../../../components/ui';

type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number | null;
  attachment_urls: string[] | null;
  created_at: string;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_urls: string[];
  submitted_at: string | null;
  is_late: boolean;
  status: string;
  marks_obtained: number | null;
  feedback: string | null;
};

function toLocalDateLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function parseUrls(text: string) {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<AssignmentRow | null>(null);
  const [submission, setSubmission] = useState<SubmissionRow | null>(null);

  const [urlsText, setUrlsText] = useState('');

  const dueMeta = useMemo(() => {
    if (!assignment?.due_date) return null;
    const due = new Date(assignment.due_date);
    if (Number.isNaN(due.getTime())) return assignment.due_date;
    return due.toLocaleString();
  }, [assignment?.due_date]);

  const fetchData = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);

    try {
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      const { data: a, error: aErr } = await supabase
        .from('assignments')
        .select(
          `
            id,
            title,
            description,
            due_date,
            max_marks,
            attachment_urls,
            created_at,
            courses:courses!assignments_course_id_fkey(code, name, short_name)
          `
        )
        .eq('id', id)
        .single();

      if (aErr) throw aErr;
      setAssignment((a as any) || null);

      const { data: s, error: sErr } = await supabase
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
            feedback
          `
        )
        .eq('assignment_id', id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (sErr) throw sErr;
      setSubmission((s as any) || null);

      const existingUrls = (s as any)?.submission_urls as string[] | undefined;
      if (existingUrls?.length) {
        setUrlsText(existingUrls.join('\n'));
      }
    } catch (e: any) {
      console.log('Assignment detail load error:', e?.message || e);
      setError(e?.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = useCallback(async () => {
    if (!user || !assignment || !id) return;
    setSaving(true);
    setError(null);

    try {
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      const urls = parseUrls(urlsText);
      if (urls.length === 0) {
        setError('Add at least one submission URL');
        return;
      }

      const nowIso = new Date().toISOString();
      const due = assignment.due_date ? new Date(assignment.due_date) : null;
      const isLate = !!due && !Number.isNaN(due.getTime()) ? new Date(nowIso).getTime() > due.getTime() : false;

      const payload = {
        assignment_id: String(id),
        student_id: student.id,
        submission_urls: urls,
        submitted_at: nowIso,
        is_late: isLate,
        status: 'submitted',
      };

      const { error: upsertErr } = await supabase
        .from('assignment_submissions')
        .upsert(payload as any, { onConflict: 'assignment_id,student_id' });

      if (upsertErr) throw upsertErr;

      await fetchData();
    } catch (e: any) {
      console.log('Assignment submit error:', e?.message || e);
      setError(e?.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  }, [assignment, fetchData, id, urlsText, user]);

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.center, { paddingTop: insets.top + 24 }]}>
          <LoadingIndicator />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            Assignment
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {error && (
          <Card style={{ marginBottom: 12, backgroundColor: withAlpha(colors.error, 0.12) }}>
            <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
          </Card>
        )}

        <Card>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{assignment?.title || 'Untitled'}</Text>
          <Text style={[styles.meta, { color: colors.textSecondary, marginTop: 6 }]}>
            {assignment?.courses?.short_name || assignment?.courses?.code || assignment?.courses?.name || 'Course'}
            {dueMeta ? ` • Due: ${dueMeta}` : ''}
            {assignment?.max_marks != null ? ` • Max: ${assignment.max_marks}` : ''}
          </Text>

          {!!assignment?.description && (
            <Text style={[styles.desc, { color: colors.textSecondary, marginTop: 12 }]}>
              {assignment.description}
            </Text>
          )}

          {!!assignment?.attachment_urls?.length && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Attachments</Text>
              <View style={{ marginTop: 8, gap: 8 }}>
                {assignment.attachment_urls.map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => Linking.openURL(u)}
                    style={[
                      styles.linkRow,
                      {
                        borderColor: colors.cardBorder,
                        backgroundColor: withAlpha(colors.cardBackground, isDark ? 0.18 : 0.08),
                      },
                    ]}
                  >
                    <Ionicons name="attach-outline" size={18} color={colors.primary} />
                    <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Submission</Text>
            {!!submission?.status && (
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: withAlpha(
                      submission.status === 'graded'
                        ? colors.success
                        : submission.status === 'submitted'
                          ? colors.warning
                          : colors.textMuted,
                      isDark ? 0.22 : 0.12
                    ),
                    borderColor: withAlpha(
                      submission.status === 'graded'
                        ? colors.success
                        : submission.status === 'submitted'
                          ? colors.warning
                          : colors.textMuted,
                      0.35
                    ),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        submission.status === 'graded'
                          ? colors.success
                          : submission.status === 'submitted'
                            ? colors.warning
                            : colors.textMuted,
                    },
                  ]}
                >
                  {submission.status}
                </Text>
              </View>
            )}
          </View>

          {!!submission?.submitted_at && (
            <Text style={[styles.meta, { color: colors.textSecondary, marginTop: 8 }]}>
              Submitted: {toLocalDateLabel(submission.submitted_at)}
              {submission.is_late ? ' • Late' : ''}
            </Text>
          )}

          {submission?.marks_obtained != null && (
            <Text style={[styles.meta, { color: colors.textSecondary, marginTop: 6 }]}>
              Marks: {submission.marks_obtained}
              {assignment?.max_marks != null ? ` / ${assignment.max_marks}` : ''}
            </Text>
          )}

          {!!submission?.feedback && (
            <Text style={[styles.desc, { color: colors.textSecondary, marginTop: 10 }]}>
              Feedback: {submission.feedback}
            </Text>
          )}

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 8 }]}>Submission URLs</Text>
            <GlassInput
              placeholder="Paste one URL per line"
              value={urlsText}
              onChangeText={setUrlsText}
              multiline
              numberOfLines={5}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <PrimaryButton title={saving ? 'Submitting…' : 'Submit'} onPress={onSubmit} disabled={saving} />
          </View>

          <Text style={[styles.hint, { color: colors.textMuted, marginTop: 10 }]}>
            Tip: You can re-submit to replace previous URLs.
          </Text>
        </Card>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: '900' },
  meta: { fontSize: 12, fontWeight: '600' },
  desc: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  hint: { fontSize: 12 },
  linkRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: { fontSize: 12, fontWeight: '700', flex: 1 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '800', textTransform: 'capitalize' },
});
