import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton, LoadingIndicator } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

type PlannerStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

type PlannerListRow = {
  id: string;
  teacher_id: string;
  course_id: string;
  section_id: string | null;
  week_start_date: string;
  week_end_date: string;
  status: PlannerStatus;
  created_at: string;
};

type PlannerDetailRow = PlannerListRow & {
  academic_year_id: string;
  planned_topics: any;
  completed_topics: any;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
};

const STATUS_FILTERS: Array<{ key: 'all' | PlannerStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

function safeJsonPreview(value: unknown) {
  if (value == null) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AdminPlannersMonitoringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tableMissing, setTableMissing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | PlannerStatus>('all');
  const [teacherIdFilter, setTeacherIdFilter] = useState('');

  const [rows, setRows] = useState<PlannerListRow[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<PlannerDetailRow | null>(null);

  const filteredTeacherId = useMemo(() => teacherIdFilter.trim(), [teacherIdFilter]);

  const fetchRows = useCallback(async () => {
    setTableMissing(false);
    setErrorMessage(null);

    let query = supabase
      .from('lesson_planners')
      .select('id,teacher_id,course_id,section_id,week_start_date,week_end_date,status,created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (filteredTeacherId) {
      query = query.eq('teacher_id', filteredTeacherId);
    }

    const { data, error } = await query;

    if (error) {
      if ((error as any)?.code === 'PGRST205') {
        setTableMissing(true);
        setRows([]);
        return;
      }
      setErrorMessage(error.message);
      setRows([]);
      return;
    }

    setRows((data as PlannerListRow[]) || []);
  }, [filteredTeacherId, statusFilter]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('lesson_planners')
      .select(
        'id,teacher_id,course_id,section_id,academic_year_id,week_start_date,week_end_date,status,planned_topics,completed_topics,submitted_at,approved_by,approved_at,rejection_reason,created_at,updated_at'
      )
      .eq('id', id)
      .single();

    if (error) {
      setErrorMessage(error.message);
      setDetail(null);
      setDetailLoading(false);
      return;
    }

    setDetail((data as PlannerDetailRow) || null);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchRows();
      setLoading(false);
    };
    load();
  }, [fetchRows]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRows();
    if (selectedId) await fetchDetail(selectedId);
    setRefreshing(false);
  };

  const selectRow = async (id: string) => {
    setSelectedId(id);
    await fetchDetail(id);
  };

  return (
    <Restricted
      module="planner-diary"
      showDeniedMessage
      deniedMessage="You do not have permission to access Planner & Diary monitoring."
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
                <Text style={[styles.title, { color: colors.textPrimary }]}>Lesson Planners</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Monitoring (read-only)
                </Text>
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
          </View>

          <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Filters</Text>

            <View style={styles.pillsRow}>
              {STATUS_FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.85}
                  onPress={() => setStatusFilter(f.key)}
                  style={[
                    styles.pill,
                    {
                      borderRadius: colors.borderRadius,
                      borderWidth: colors.borderWidth,
                      borderColor: colors.cardBorder,
                      backgroundColor:
                        statusFilter === f.key ? colors.cardBackground : colors.inputBackground,
                    },
                  ]}
                >
                  <Text style={[styles.pillText, { color: colors.textPrimary }]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Teacher ID (optional)</Text>
              <GlassInput
                placeholder="UUID"
                value={teacherIdFilter}
                onChangeText={setTeacherIdFilter}
              />
            </View>

            {errorMessage ? (
              <>
                <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
                <View style={{ height: 10 }} />
                <PrimaryButton
                  title="Retry"
                  size="small"
                  variant="outline"
                  glowing={false}
                  onPress={fetchRows}
                  style={{ alignSelf: 'flex-start' }}
                />
              </>
            ) : null}
          </GlassCard>

          {loading ? (
            <View style={styles.center}>
              <LoadingIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
            </View>
          ) : tableMissing ? (
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Table not found</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                The database table `lesson_planners` is missing (or not exposed). Apply migrations then refresh.
              </Text>
            </GlassCard>
          ) : rows.length === 0 ? (
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>No planners</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                No lesson planners found for the selected filters.
              </Text>
            </GlassCard>
          ) : (
            <View style={styles.list}>
              {rows.map((row, idx) => (
                <Animated.View key={row.id} entering={FadeInDown.delay(60 + idx * 20).springify()}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => selectRow(row.id)}>
                    <GlassCard
                      style={[
                        styles.card,
                        {
                          borderColor: colors.cardBorder,
                          borderWidth: colors.borderWidth,
                        },
                        selectedId === row.id ? { opacity: 1 } : null,
                      ]}
                    >
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {row.week_start_date} → {row.week_end_date}
                      </Text>
                      <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        Status: {row.status}
                      </Text>
                      <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        Teacher: {row.teacher_id}
                      </Text>
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

          <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Detail Preview</Text>
            {!selectedId ? (
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                Select a planner row above to preview.
              </Text>
            ) : detailLoading ? (
              <View style={styles.centerInline}>
                <LoadingIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading detail…</Text>
              </View>
            ) : !detail ? (
              <>
                <Text style={[styles.cardBody, { color: colors.textSecondary }]}>No detail found.</Text>
                {errorMessage ? (
                  <>
                    <View style={{ height: 10 }} />
                    <PrimaryButton
                      title="Retry"
                      size="small"
                      variant="outline"
                      glowing={false}
                      onPress={() => fetchDetail(selectedId)}
                      style={{ alignSelf: 'flex-start' }}
                    />
                  </>
                ) : null}
              </>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  ID: {detail.id}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Teacher: {detail.teacher_id}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Course: {detail.course_id}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Section: {detail.section_id || '—'}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Status: {detail.status}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Submitted: {detail.submitted_at || '—'}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Approved: {detail.approved_at || '—'}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Rejection reason: {detail.rejection_reason || '—'}
                </Text>

                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.detailHeading, { color: colors.textPrimary }]}>Planned topics (JSON)</Text>
                  <Text style={[styles.mono, { color: colors.textSecondary }]}>{safeJsonPreview(detail.planned_topics)}</Text>
                </View>
              </View>
            )}
          </GlassCard>
        </ScrollView>
      </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { marginTop: 6, fontSize: 14 },
  actionsRow: { marginTop: 12, flexDirection: 'row', gap: 10 },
  center: { paddingHorizontal: 20, paddingVertical: 26, alignItems: 'center', gap: 10 },
  centerInline: { paddingVertical: 12, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14 },
  list: { paddingHorizontal: 20, gap: 10 },
  card: { marginHorizontal: 20, marginBottom: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  cardMeta: { marginTop: 6, fontSize: 13 },
  errorText: { marginTop: 10, fontSize: 13 },
  pillsRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { fontSize: 13, fontWeight: '600' },
  filterLabel: { fontSize: 13, marginBottom: 8 },
  detailLine: { fontSize: 13, lineHeight: 18 },
  detailHeading: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  mono: { fontSize: 12, lineHeight: 16 },
});
