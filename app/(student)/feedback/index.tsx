import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Animated, { FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type FeedbackRow = {
  id: string;
  feedback_type: 'teacher' | 'course' | 'facility' | 'general' | string;
  target_id: string | null;
  rating: number | null;
  comments: string | null;
  is_anonymous: boolean;
  created_at: string;
};

type ComplaintRow = {
  id: string;
  ticket_number: string;
  category: string;
  subject: string;
  description: string;
  attachment_url: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | string;
  priority: 'low' | 'normal' | 'high' | string;
  resolution: string | null;
  created_at: string;
  updated_at: string;
};

function formatShortDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function complaintTone(status: string) {
  if (status === 'resolved' || status === 'closed') return 'success' as const;
  if (status === 'in_progress') return 'warning' as const;
  if (status === 'open') return 'error' as const;
  return 'muted' as const;
}

function feedbackTone(rating: number | null) {
  if (!rating) return 'muted' as const;
  if (rating >= 4) return 'success' as const;
  if (rating === 3) return 'warning' as const;
  return 'error' as const;
}

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'feedback' | 'complaints'>('feedback');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [complaintRows, setComplaintRows] = useState<ComplaintRow[]>([]);

  // Feedback form
  const [feedbackType, setFeedbackType] = useState<FeedbackRow['feedback_type']>('general');
  const [feedbackTargetId, setFeedbackTargetId] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackAnonymous, setFeedbackAnonymous] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Complaint form
  const [complaintCategory, setComplaintCategory] = useState<string>('academic');
  const [complaintPriority, setComplaintPriority] = useState<string>('normal');
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintAttachmentUrl, setComplaintAttachmentUrl] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;

    const [{ data: fb, error: fbError }, { data: comp, error: compError }] = await Promise.all([
      supabase
        .from('feedback')
        .select('id, feedback_type, target_id, rating, comments, is_anonymous, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('complaints')
        .select(
          'id, ticket_number, category, subject, description, attachment_url, status, priority, resolution, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    if (fbError) {
      console.log('Feedback fetch error:', fbError.message);
      setFeedbackRows([]);
    } else {
      setFeedbackRows((fb || []) as any);
    }

    if (compError) {
      console.log('Complaints fetch error:', compError.message);
      setComplaintRows([]);
    } else {
      setComplaintRows((comp || []) as any);
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

  const submitFeedback = async () => {
    if (!user?.id) return;

    const comments = feedbackComments.trim();
    if (!comments && !feedbackRating) {
      Alert.alert('Missing details', 'Add a rating or comments to submit feedback.');
      return;
    }

    setSubmittingFeedback(true);
    const payload: any = {
      user_id: user.id,
      feedback_type: feedbackType,
      target_id: feedbackTargetId.trim().length ? feedbackTargetId.trim() : null,
      rating: feedbackRating,
      comments: comments.length ? comments : null,
      is_anonymous: feedbackAnonymous,
    };

    const { error } = await supabase.from('feedback').insert(payload);
    setSubmittingFeedback(false);

    if (error) {
      Alert.alert('Failed to submit', error.message);
      return;
    }

    setFeedbackTargetId('');
    setFeedbackRating(null);
    setFeedbackComments('');
    setFeedbackAnonymous(false);
    await fetchAll();
    Alert.alert('Submitted', 'Thank you for your feedback.');
  };

  const submitComplaint = async () => {
    if (!user?.id) return;

    const subject = complaintSubject.trim();
    const description = complaintDescription.trim();
    if (!subject || !description) {
      Alert.alert('Missing details', 'Subject and description are required.');
      return;
    }

    const ticket = `CMP-${Date.now().toString(36).toUpperCase()}`;

    setSubmittingComplaint(true);
    const { error } = await supabase.from('complaints').insert({
      user_id: user.id,
      ticket_number: ticket,
      category: complaintCategory,
      subject,
      description,
      attachment_url: complaintAttachmentUrl.trim().length ? complaintAttachmentUrl.trim() : null,
      priority: complaintPriority,
    });
    setSubmittingComplaint(false);

    if (error) {
      Alert.alert('Failed to submit', error.message);
      return;
    }

    setComplaintSubject('');
    setComplaintDescription('');
    setComplaintAttachmentUrl('');
    await fetchAll();
    Alert.alert('Ticket created', `Your ticket number is ${ticket}`);
  };

  const feedbackTypes = useMemo(
    () => ['teacher', 'course', 'facility', 'general'] as const,
    []
  );
  const complaintCategories = useMemo(
    () => ['academic', 'facility', 'transport', 'hostel', 'other'] as const,
    []
  );
  const priorities = useMemo(() => ['low', 'normal', 'high'] as const, []);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Feedback & Complaints</Text>
          <View style={{ width: 28 }} />
        </View>

        {!user?.id ? (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Not signed in</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Please log in to use feedback.</Text>
          </Card>
        ) : loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInRight.duration(300)}>
              <Card style={{ marginBottom: 12 }}>
                <View style={styles.tabRow}>
                  <TouchableOpacity
                    onPress={() => setActiveTab('feedback')}
                    style={[
                      styles.tab,
                      {
                        backgroundColor:
                          activeTab === 'feedback'
                            ? withAlpha(colors.primary, isDark ? 0.2 : 0.12)
                            : withAlpha(colors.cardBackground, isDark ? 0.22 : 0.1),
                        borderColor:
                          activeTab === 'feedback' ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.tabText, { color: activeTab === 'feedback' ? colors.primary : colors.textSecondary }]}>
                      Feedback
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveTab('complaints')}
                    style={[
                      styles.tab,
                      {
                        backgroundColor:
                          activeTab === 'complaints'
                            ? withAlpha(colors.primary, isDark ? 0.2 : 0.12)
                            : withAlpha(colors.cardBackground, isDark ? 0.22 : 0.1),
                        borderColor:
                          activeTab === 'complaints' ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.tabText, { color: activeTab === 'complaints' ? colors.primary : colors.textSecondary }]}>
                      Complaints
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>

              {activeTab === 'feedback' ? (
                <>
                  <Card style={{ marginBottom: 12 }}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Submit Feedback</Text>
                    <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Teacher/course/facility/general</Text>

                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type</Text>
                      <View style={styles.choiceRow}>
                        {feedbackTypes.map((t) => {
                          const selected = feedbackType === t;
                          return (
                            <TouchableOpacity
                              key={t}
                              onPress={() => setFeedbackType(t)}
                              style={[
                                styles.choiceChip,
                                {
                                  backgroundColor: selected
                                    ? withAlpha(colors.primary, isDark ? 0.22 : 0.12)
                                    : withAlpha(colors.cardBackground, isDark ? 0.22 : 0.1),
                                  borderColor: selected ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                                },
                              ]}
                            >
                              <Text style={[styles.choiceText, { color: selected ? colors.primary : colors.textSecondary }]}>
                                {t}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Rating</Text>
                      <View style={styles.ratingRow}>
                        {[1, 2, 3, 4, 5].map((r) => {
                          const selected = feedbackRating === r;
                          return (
                            <TouchableOpacity
                              key={r}
                              onPress={() => setFeedbackRating(selected ? null : r)}
                              style={[
                                styles.ratingDot,
                                {
                                  backgroundColor: selected
                                    ? withAlpha(colors.primary, isDark ? 0.22 : 0.12)
                                    : withAlpha(colors.cardBackground, isDark ? 0.22 : 0.1),
                                  borderColor: selected ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                                },
                              ]}
                            >
                              <Text style={[styles.ratingText, { color: selected ? colors.primary : colors.textSecondary }]}>
                                {r}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                      <GlassInput
                        placeholder="Target ID (optional)"
                        value={feedbackTargetId}
                        onChangeText={setFeedbackTargetId}
                        icon="link-outline"
                      />
                      <Text style={[styles.hint, { color: colors.textMuted }]}>Optional: teacher_id or course_id</Text>
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <GlassInput
                        placeholder="Comments"
                        value={feedbackComments}
                        onChangeText={setFeedbackComments}
                        icon="chatbubble-ellipses-outline"
                        multiline
                      />
                    </View>

                    <View style={styles.switchRow}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Submit anonymously</Text>
                      <Switch
                        value={feedbackAnonymous}
                        onValueChange={setFeedbackAnonymous}
                        trackColor={{ false: withAlpha(colors.textMuted, 0.25), true: withAlpha(colors.primary, 0.35) }}
                        thumbColor={feedbackAnonymous ? colors.primary : colors.textMuted}
                      />
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <PrimaryButton
                        title="Submit Feedback"
                        onPress={submitFeedback}
                        loading={submittingFeedback}
                        disabled={submittingFeedback}
                        variant="outline"
                        size="medium"
                      />
                    </View>
                  </Card>

                  <Card>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Feedback</Text>
                    {feedbackRows.length === 0 ? (
                      <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 10 }]}>No feedback submitted yet.</Text>
                    ) : (
                      <View style={{ marginTop: 8 }}>
                        {feedbackRows.map((f) => {
                          const tone = feedbackTone(f.rating);
                          const accent =
                            tone === 'success'
                              ? colors.success
                              : tone === 'warning'
                                ? colors.warning
                                : tone === 'error'
                                  ? colors.error
                                  : colors.textMuted;
                          return (
                            <View key={f.id} style={styles.listRow}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                                    {f.feedback_type}{f.is_anonymous ? ' • anonymous' : ''}
                                  </Text>
                                  <View
                                    style={[
                                      styles.chip,
                                      {
                                        backgroundColor: withAlpha(accent, isDark ? 0.22 : 0.12),
                                        borderColor: withAlpha(accent, 0.35),
                                      },
                                    ]}
                                  >
                                    <Text style={[styles.chipText, { color: accent }]}>
                                      {f.rating != null ? `${f.rating}/5` : 'no rating'}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>
                                  {formatShortDate(f.created_at)}
                                  {f.target_id ? ` • target: ${f.target_id}` : ''}
                                </Text>
                                {!!f.comments && (
                                  <Text style={[styles.rowBody, { color: colors.textSecondary }]} numberOfLines={4}>
                                    {f.comments}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Card>
                </>
              ) : (
                <>
                  <Card style={{ marginBottom: 12 }}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Create Complaint</Text>
                    <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Creates a support ticket</Text>

                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
                      <View style={styles.choiceRow}>
                        {complaintCategories.map((c) => {
                          const selected = complaintCategory === c;
                          return (
                            <TouchableOpacity
                              key={c}
                              onPress={() => setComplaintCategory(c)}
                              style={[
                                styles.choiceChip,
                                {
                                  backgroundColor: selected
                                    ? withAlpha(colors.primary, isDark ? 0.22 : 0.12)
                                    : withAlpha(colors.cardBackground, isDark ? 0.22 : 0.1),
                                  borderColor: selected ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                                },
                              ]}
                            >
                              <Text style={[styles.choiceText, { color: selected ? colors.primary : colors.textSecondary }]}>
                                {c}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Priority</Text>
                      <View style={styles.choiceRow}>
                        {priorities.map((p) => {
                          const selected = complaintPriority === p;
                          return (
                            <TouchableOpacity
                              key={p}
                              onPress={() => setComplaintPriority(p)}
                              style={[
                                styles.choiceChip,
                                {
                                  backgroundColor: selected
                                    ? withAlpha(colors.primary, isDark ? 0.22 : 0.12)
                                    : withAlpha(colors.cardBackground, isDark ? 0.22 : 0.1),
                                  borderColor: selected ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                                },
                              ]}
                            >
                              <Text style={[styles.choiceText, { color: selected ? colors.primary : colors.textSecondary }]}>
                                {p}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ marginTop: 12 }}>
                      <GlassInput
                        placeholder="Subject"
                        value={complaintSubject}
                        onChangeText={setComplaintSubject}
                        icon="document-text-outline"
                      />
                    </View>
                    <View style={{ marginTop: 10 }}>
                      <GlassInput
                        placeholder="Describe the issue"
                        value={complaintDescription}
                        onChangeText={setComplaintDescription}
                        icon="alert-circle-outline"
                        multiline
                      />
                    </View>
                    <View style={{ marginTop: 10 }}>
                      <GlassInput
                        placeholder="Attachment URL (optional)"
                        value={complaintAttachmentUrl}
                        onChangeText={setComplaintAttachmentUrl}
                        icon="attach-outline"
                      />
                    </View>

                    <View style={{ marginTop: 10 }}>
                      <PrimaryButton
                        title="Submit Complaint"
                        onPress={submitComplaint}
                        loading={submittingComplaint}
                        disabled={submittingComplaint}
                        variant="outline"
                        size="medium"
                      />
                    </View>
                  </Card>

                  <Card>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Tickets</Text>
                    {complaintRows.length === 0 ? (
                      <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 10 }]}>No complaints filed yet.</Text>
                    ) : (
                      <View style={{ marginTop: 8 }}>
                        {complaintRows.map((c) => {
                          const tone = complaintTone(c.status);
                          const accent =
                            tone === 'success'
                              ? colors.success
                              : tone === 'warning'
                                ? colors.warning
                                : tone === 'error'
                                  ? colors.error
                                  : colors.textMuted;
                          return (
                            <View key={c.id} style={styles.listRow}>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {c.subject}
                                  </Text>
                                  <View
                                    style={[
                                      styles.chip,
                                      {
                                        backgroundColor: withAlpha(accent, isDark ? 0.22 : 0.12),
                                        borderColor: withAlpha(accent, 0.35),
                                      },
                                    ]}
                                  >
                                    <Text style={[styles.chipText, { color: accent }]}>{String(c.status).replace('_', ' ')}</Text>
                                  </View>
                                </View>

                                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>Ticket {c.ticket_number} • {c.category} • {formatShortDate(c.created_at)}</Text>
                                <Text style={[styles.rowBody, { color: colors.textSecondary }]} numberOfLines={4}>
                                  {c.description}
                                </Text>

                                {!!c.resolution && (
                                  <Text style={[styles.rowMeta, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={3}>
                                    Resolution: {c.resolution}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Card>
                </>
              )}
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
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  hint: {
    fontSize: 11,
    marginTop: 6,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  choiceText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  ratingDot: {
    width: 44,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listRow: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  rowBody: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
  },
});
