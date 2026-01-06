import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useRBAC, PERMISSIONS } from '../../../hooks/useRBAC';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

type PlannerStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type PlannerListRow = {
  id: string;
  teacher_id: string;
  course_id: string;
  week_start_date: string;
  week_end_date: string;
  status: PlannerStatus;
  submitted_at: string | null;
  created_at: string;
};

type PlannerDetailRow = PlannerListRow & {
  section_id: string | null;
  academic_year_id: string;
  planned_topics: any;
  completed_topics: any;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
};

type DiaryStatus = 'draft' | 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected';

type DiaryListRow = {
  id: string;
  teacher_id: string;
  month: number;
  year: number;
  status: DiaryStatus;
  submitted_at: string | null;
  created_at: string;
};

type DiaryDetailRow = DiaryListRow & {
  academic_year_id: string;
  daily_entries: any;
  hod_approved_by: string | null;
  hod_approved_at: string | null;
  principal_approved_by: string | null;
  principal_approved_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
};

const TABS: Array<{ key: 'planners' | 'diaries'; label: string }> = [
  { key: 'planners', label: 'Lesson Planners' },
  { key: 'diaries', label: 'Work Diaries' },
];

function safeJsonPreview(value: unknown) {
  try {
    if (value === null || value === undefined) return '—';
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function PlannerDiaryApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { hasPermission } = useRBAC();

  const canApprovePlanner =
    hasPermission(PERMISSIONS.APPROVE_PLANNER_LEVEL_1) || hasPermission(PERMISSIONS.APPROVE_PLANNER_FINAL);

  const canApproveDiaryHod = hasPermission(PERMISSIONS.APPROVE_DIARY_LEVEL_1);
  const canApproveDiaryPrincipal = hasPermission(PERMISSIONS.APPROVE_DIARY_FINAL);

  const [tab, setTab] = useState<'planners' | 'diaries'>(TABS[0].key);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [planners, setPlanners] = useState<PlannerListRow[]>([]);
  const [plannersErrorText, setPlannersErrorText] = useState<string | null>(null);
  const [plannerSelectedId, setPlannerSelectedId] = useState<string | null>(null);
  const [plannerDetail, setPlannerDetail] = useState<PlannerDetailRow | null>(null);
  const [plannerDetailLoading, setPlannerDetailLoading] = useState(false);
  const [plannerDetailErrorText, setPlannerDetailErrorText] = useState<string | null>(null);

  const [diaries, setDiaries] = useState<DiaryListRow[]>([]);
  const [diariesErrorText, setDiariesErrorText] = useState<string | null>(null);
  const [diarySelectedId, setDiarySelectedId] = useState<string | null>(null);
  const [diaryDetail, setDiaryDetail] = useState<DiaryDetailRow | null>(null);
  const [diaryDetailLoading, setDiaryDetailLoading] = useState(false);
  const [diaryDetailErrorText, setDiaryDetailErrorText] = useState<string | null>(null);

  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const diaryPendingStatuses = useMemo(() => {
    const statuses: DiaryStatus[] = [];
    if (canApproveDiaryHod) statuses.push('submitted');
    if (canApproveDiaryPrincipal) statuses.push('hod_approved');
    return statuses;
  }, [canApproveDiaryHod, canApproveDiaryPrincipal]);

  const fetchPlanners = useCallback(async () => {
    if (!canApprovePlanner) {
      setPlanners([]);
      setPlannersErrorText(null);
      return;
    }

    setPlannersErrorText(null);

    const { data, error } = await supabase
      .from('lesson_planners')
      .select('id,teacher_id,course_id,week_start_date,week_end_date,status,submitted_at,created_at')
      .eq('status', 'submitted')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching submitted planners:', error);
      setPlannersErrorText(error.message);
      setPlanners([]);
      return;
    }

    setPlanners((data as PlannerListRow[]) || []);
  }, [canApprovePlanner]);

  const fetchPlannerDetail = useCallback(async (id: string) => {
    setPlannerDetailLoading(true);
    setPlannerDetail(null);
    setPlannerDetailErrorText(null);

    const { data, error } = await supabase
      .from('lesson_planners')
      .select(
        'id,teacher_id,course_id,section_id,academic_year_id,week_start_date,week_end_date,status,planned_topics,completed_topics,submitted_at,approved_by,approved_at,rejection_reason,created_at,updated_at'
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching planner detail:', error);
      setPlannerDetail(null);
      setPlannerDetailErrorText(error.message);
      setPlannerDetailLoading(false);
      return;
    }

    setPlannerDetail((data as PlannerDetailRow) || null);
    setPlannerDetailLoading(false);
  }, []);

  const fetchDiaries = useCallback(async () => {
    if (diaryPendingStatuses.length === 0) {
      setDiaries([]);
      setDiariesErrorText(null);
      return;
    }

    setDiariesErrorText(null);

    const { data, error } = await supabase
      .from('work_diaries')
      .select('id,teacher_id,month,year,status,submitted_at,created_at')
      .in('status', diaryPendingStatuses)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching pending diaries:', error);
      setDiariesErrorText(error.message);
      setDiaries([]);
      return;
    }

    setDiaries((data as DiaryListRow[]) || []);
  }, [diaryPendingStatuses]);

  const fetchDiaryDetail = useCallback(async (id: string) => {
    setDiaryDetailLoading(true);
    setDiaryDetail(null);
    setDiaryDetailErrorText(null);

    const { data, error } = await supabase
      .from('work_diaries')
      .select(
        'id,teacher_id,academic_year_id,month,year,status,daily_entries,submitted_at,hod_approved_by,hod_approved_at,principal_approved_by,principal_approved_at,rejection_reason,created_at,updated_at'
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching diary detail:', error);
      setDiaryDetail(null);
      setDiaryDetailErrorText(error.message);
      setDiaryDetailLoading(false);
      return;
    }

    setDiaryDetail((data as DiaryDetailRow) || null);
    setDiaryDetailLoading(false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPlanners(), fetchDiaries()]);
    setLoading(false);
  }, [fetchDiaries, fetchPlanners]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPlanners(), fetchDiaries()]);
    if (plannerSelectedId) await fetchPlannerDetail(plannerSelectedId);
    if (diarySelectedId) await fetchDiaryDetail(diarySelectedId);
    setRefreshing(false);
  };

  const selectPlanner = async (id: string) => {
    setPlannerSelectedId(id);
    setRejectReason('');
    await fetchPlannerDetail(id);
  };

  const selectDiary = async (id: string) => {
    setDiarySelectedId(id);
    setRejectReason('');
    await fetchDiaryDetail(id);
  };

  const approvePlanner = async (decision: 'approve' | 'reject') => {
    if (!plannerSelectedId) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('approve_lesson_planner', {
        p_planner_id: plannerSelectedId,
        p_decision: decision,
        p_reason: rejectReason,
      });

      if (error) throw error;

      const result = (data as any)?.[0];
      if (!result?.success) {
        Alert.alert('Not allowed', result?.message || 'Approval failed.');
        return;
      }

      Alert.alert('Success', result.message || 'Updated.');
      await fetchPlanners();
      setPlannerSelectedId(null);
      setPlannerDetail(null);
      setRejectReason('');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to update planner.');
    } finally {
      setActionLoading(false);
    }
  };

  const approveDiary = async (decision: 'approve' | 'reject') => {
    if (!diarySelectedId) return;

    setActionLoading(true);
    try {
      const { data, error } = await supabase.rpc('approve_work_diary', {
        p_diary_id: diarySelectedId,
        p_decision: decision,
        p_reason: rejectReason,
      });

      if (error) throw error;

      const result = (data as any)?.[0];
      if (!result?.success) {
        Alert.alert('Not allowed', result?.message || 'Approval failed.');
        return;
      }

      Alert.alert('Success', result.message || 'Updated.');
      await fetchDiaries();
      setDiarySelectedId(null);
      setDiaryDetail(null);
      setRejectReason('');
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Failed to update diary.');
    } finally {
      setActionLoading(false);
    }
  };

  const hasAnyApproval = canApprovePlanner || canApproveDiaryHod || canApproveDiaryPrincipal;

  return (
    <Restricted
      module="planner-diary"
      showDeniedMessage
      deniedMessage="You do not have access to Planner & Diary approvals."
      fallback={
        <AnimatedBackground>
          <View style={[styles.center, { paddingTop: insets.top + 60 }]}> 
            <Text style={[styles.title, { color: colors.textPrimary }]}>Approvals</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Access denied</Text>
          </View>
        </AnimatedBackground>
      }
    >
      <AnimatedBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 110 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Approvals</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>HOD + Principal workflow</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <PrimaryButton
                title="Back"
                variant="outline"
                glowing={false}
                size="small"
                onPress={() => router.back()}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                title="Refresh"
                variant="outline"
                glowing={false}
                size="small"
                onPress={onRefresh}
                style={{ flex: 1 }}
              />
            </View>

            <View style={styles.pillsRow}>
              {TABS.map((t) => {
                const isActive = tab === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    activeOpacity={0.85}
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isActive ? colors.primary : colors.inputBackground,
                        borderColor: colors.cardBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                  >
                    <Text style={[styles.pillText, { color: isActive ? colors.textInverse : colors.textSecondary }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {!hasAnyApproval ? (
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>No approval permissions</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Your account can monitor planners/diaries, but cannot approve them.
              </Text>
            </GlassCard>
          ) : loading ? (
            <View style={styles.center}>
              <LoadingIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
            </View>
          ) : tab === 'planners' ? (
            <View style={styles.sections}>
              <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Submitted planners</Text>
                {plannersErrorText ? (
                  <>
                    <Text style={[styles.cardBody, { color: colors.error }]}>{plannersErrorText}</Text>
                    <View style={{ height: 10 }} />
                    <PrimaryButton
                      title="Retry"
                      size="small"
                      variant="outline"
                      glowing={false}
                      onPress={fetchPlanners}
                      style={{ alignSelf: 'flex-start' }}
                    />
                    <View style={{ height: 10 }} />
                  </>
                ) : null}
                {!canApprovePlanner ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>You can’t approve planners.</Text>
                ) : planners.length === 0 ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>No planners pending approval.</Text>
                ) : (
                  <View style={styles.list}>
                    {planners.map((p, idx) => (
                      <Animated.View key={p.id} entering={FadeInDown.delay(50 + idx * 18).springify()}>
                        <TouchableOpacity activeOpacity={0.85} onPress={() => selectPlanner(p.id)}>
                          <GlassCard
                            style={[
                              styles.listCard,
                              {
                                borderColor: colors.cardBorder,
                                borderWidth: colors.borderWidth,
                              },
                              plannerSelectedId === p.id ? { opacity: 1 } : { opacity: 0.92 },
                            ]}
                          >
                            <Text style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                              {p.week_start_date} → {p.week_end_date}
                            </Text>
                            <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                              Teacher: {p.teacher_id}
                            </Text>
                            <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                              Submitted: {p.submitted_at || '—'}
                            </Text>
                          </GlassCard>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </GlassCard>

              <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Planner details</Text>

                {plannerSelectedId && plannerDetailErrorText ? (
                  <>
                    <Text style={[styles.cardBody, { color: colors.error }]}>{plannerDetailErrorText}</Text>
                    <View style={{ height: 10 }} />
                    <PrimaryButton
                      title="Retry"
                      size="small"
                      variant="outline"
                      glowing={false}
                      onPress={() => fetchPlannerDetail(plannerSelectedId)}
                      style={{ alignSelf: 'flex-start' }}
                    />
                    <View style={{ height: 10 }} />
                  </>
                ) : null}

                {!plannerSelectedId ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>Select a planner to review.</Text>
                ) : plannerDetailLoading ? (
                  <View style={styles.centerInline}>
                    <LoadingIndicator color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
                  </View>
                ) : !plannerDetail ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>Couldn’t load planner.</Text>
                ) : (
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>ID: {plannerDetail.id}</Text>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>Teacher: {plannerDetail.teacher_id}</Text>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>Course: {plannerDetail.course_id}</Text>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                      Week: {plannerDetail.week_start_date} → {plannerDetail.week_end_date}
                    </Text>

                    <View style={{ marginTop: 4 }}>
                      <Text style={[styles.detailHeading, { color: colors.textPrimary }]}>Planned topics (JSON)</Text>
                      <Text style={[styles.mono, { color: colors.textSecondary }]}>{safeJsonPreview(plannerDetail.planned_topics)}</Text>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Rejection reason (optional)</Text>
                    <TextInput
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      placeholder="Add a reason if rejecting"
                      placeholderTextColor={colors.placeholder}
                      multiline
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.textPrimary,
                          borderColor: colors.inputBorder,
                          borderWidth: colors.borderWidth,
                          borderRadius: colors.borderRadius,
                        },
                      ]}
                    />

                    <View style={styles.actionsRow}>
                      <PrimaryButton
                        title={actionLoading ? 'Working…' : 'Approve'}
                        onPress={() => approvePlanner('approve')}
                        disabled={actionLoading}
                        size="small"
                        style={{ flex: 1 }}
                      />
                      <PrimaryButton
                        title={actionLoading ? 'Working…' : 'Reject'}
                        variant="outline"
                        glowing={false}
                        onPress={() => {
                          Alert.alert('Reject planner', 'Are you sure you want to reject this planner?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Reject', style: 'destructive', onPress: () => approvePlanner('reject') },
                          ]);
                        }}
                        disabled={actionLoading}
                        size="small"
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}
              </GlassCard>
            </View>
          ) : (
            <View style={styles.sections}>
              <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Pending diaries</Text>
                {diariesErrorText ? (
                  <>
                    <Text style={[styles.cardBody, { color: colors.error }]}>{diariesErrorText}</Text>
                    <View style={{ height: 10 }} />
                    <PrimaryButton
                      title="Retry"
                      size="small"
                      variant="outline"
                      glowing={false}
                      onPress={fetchDiaries}
                      style={{ alignSelf: 'flex-start' }}
                    />
                    <View style={{ height: 10 }} />
                  </>
                ) : null}
                {diaryPendingStatuses.length === 0 ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>You can’t approve diaries.</Text>
                ) : diaries.length === 0 ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>No diaries pending approval.</Text>
                ) : (
                  <View style={styles.list}>
                    {diaries.map((d, idx) => (
                      <Animated.View key={d.id} entering={FadeInDown.delay(50 + idx * 18).springify()}>
                        <TouchableOpacity activeOpacity={0.85} onPress={() => selectDiary(d.id)}>
                          <GlassCard
                            style={[
                              styles.listCard,
                              {
                                borderColor: colors.cardBorder,
                                borderWidth: colors.borderWidth,
                              },
                              diarySelectedId === d.id ? { opacity: 1 } : { opacity: 0.92 },
                            ]}
                          >
                            <Text style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                              {String(d.month).padStart(2, '0')}/{d.year}
                            </Text>
                            <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                              Status: {d.status}
                            </Text>
                            <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                              Teacher: {d.teacher_id}
                            </Text>
                          </GlassCard>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </GlassCard>

              <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Diary details</Text>

                {diarySelectedId && diaryDetailErrorText ? (
                  <>
                    <Text style={[styles.cardBody, { color: colors.error }]}>{diaryDetailErrorText}</Text>
                    <View style={{ height: 10 }} />
                    <PrimaryButton
                      title="Retry"
                      size="small"
                      variant="outline"
                      glowing={false}
                      onPress={() => fetchDiaryDetail(diarySelectedId)}
                      style={{ alignSelf: 'flex-start' }}
                    />
                    <View style={{ height: 10 }} />
                  </>
                ) : null}

                {!diarySelectedId ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>Select a diary to review.</Text>
                ) : diaryDetailLoading ? (
                  <View style={styles.centerInline}>
                    <LoadingIndicator color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
                  </View>
                ) : !diaryDetail ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>Couldn’t load diary.</Text>
                ) : (
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>ID: {diaryDetail.id}</Text>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>Teacher: {diaryDetail.teacher_id}</Text>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>Month: {String(diaryDetail.month).padStart(2, '0')}/{diaryDetail.year}</Text>
                    <Text style={[styles.detailLine, { color: colors.textSecondary }]}>Status: {diaryDetail.status}</Text>

                    <View style={{ marginTop: 4 }}>
                      <Text style={[styles.detailHeading, { color: colors.textPrimary }]}>Daily entries (JSON)</Text>
                      <Text style={[styles.mono, { color: colors.textSecondary }]}>{safeJsonPreview(diaryDetail.daily_entries)}</Text>
                    </View>

                    <Text style={[styles.label, { color: colors.textSecondary }]}>Rejection reason (optional)</Text>
                    <TextInput
                      value={rejectReason}
                      onChangeText={setRejectReason}
                      placeholder="Add a reason if rejecting"
                      placeholderTextColor={colors.placeholder}
                      multiline
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: colors.inputBackground,
                          color: colors.textPrimary,
                          borderColor: colors.inputBorder,
                          borderWidth: colors.borderWidth,
                          borderRadius: colors.borderRadius,
                        },
                      ]}
                    />

                    <View style={styles.actionsRow}>
                      <PrimaryButton
                        title={actionLoading ? 'Working…' : 'Approve'}
                        onPress={() => approveDiary('approve')}
                        disabled={actionLoading}
                        size="small"
                        style={{ flex: 1 }}
                      />
                      <PrimaryButton
                        title={actionLoading ? 'Working…' : 'Reject'}
                        variant="outline"
                        glowing={false}
                        onPress={() => {
                          Alert.alert('Reject diary', 'Are you sure you want to reject this diary?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Reject', style: 'destructive', onPress: () => approveDiary('reject') },
                          ]);
                        }}
                        disabled={actionLoading}
                        size="small"
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}
              </GlassCard>
            </View>
          )}
        </ScrollView>
      </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { marginTop: 6, fontSize: 14 },
  pillsRow: { flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  pillText: { fontSize: 13, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  sections: { paddingHorizontal: 20, gap: 12 },
  card: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  list: { marginTop: 10, gap: 10 },
  listCard: { padding: 12 },
  listTitle: { fontSize: 14, fontWeight: '700' },
  listMeta: { marginTop: 4, fontSize: 12 },
  center: { paddingHorizontal: 20, paddingVertical: 30, alignItems: 'center', gap: 10 },
  centerInline: { paddingVertical: 12, alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 14 },
  detailLine: { fontSize: 12 },
  detailHeading: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  mono: { fontSize: 12, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  textArea: { minHeight: 110, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, lineHeight: 20 },
});
