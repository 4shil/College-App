import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton, LoadingIndicator } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

type DiaryStatus = 'draft' | 'submitted' | 'hod_approved' | 'principal_approved' | 'rejected';

type DiaryListRow = {
  id: string;
  teacher_id: string;
  academic_year_id: string;
  month: number;
  year: number;
  status: DiaryStatus;
  created_at: string;
};

type DiaryDetailRow = DiaryListRow & {
  daily_entries: any;
  submitted_at: string | null;
  hod_approved_by: string | null;
  hod_approved_at: string | null;
  principal_approved_by: string | null;
  principal_approved_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
};

const STATUS_FILTERS: Array<{ key: 'all' | DiaryStatus; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'hod_approved', label: 'HoD Approved' },
  { key: 'principal_approved', label: 'Principal Approved' },
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

export default function AdminDiariesMonitoringScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tableMissing, setTableMissing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | DiaryStatus>('all');
  const [teacherIdFilter, setTeacherIdFilter] = useState('');

  const [rows, setRows] = useState<DiaryListRow[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<DiaryDetailRow | null>(null);

  const filteredTeacherId = useMemo(() => teacherIdFilter.trim(), [teacherIdFilter]);

  const fetchRows = useCallback(async () => {
    setTableMissing(false);
    setErrorMessage(null);

    let query = supabase
      .from('work_diaries')
      .select('id,teacher_id,academic_year_id,month,year,status,created_at')
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

    setRows((data as DiaryListRow[]) || []);
  }, [filteredTeacherId, statusFilter]);

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('work_diaries')
      .select(
        'id,teacher_id,academic_year_id,month,year,status,daily_entries,submitted_at,hod_approved_by,hod_approved_at,principal_approved_by,principal_approved_at,rejection_reason,created_at,updated_at'
      )
      .eq('id', id)
      .single();

    if (error) {
      setErrorMessage(error.message);
      setDetail(null);
      setDetailLoading(false);
      return;
    }

    setDetail((data as DiaryDetailRow) || null);
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
                <Text style={[styles.title, { color: colors.textPrimary }]}>Work Diaries</Text>
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
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                {errorMessage}
              </Text>
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
                The database table `work_diaries` is missing (or not exposed). Apply migrations then refresh.
              </Text>
            </GlassCard>
          ) : rows.length === 0 ? (
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>No diaries</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                No work diaries found for the selected filters.
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
                        {String(row.month).padStart(2, '0')}/{row.year}
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
                Select a diary row above to preview.
              </Text>
            ) : detailLoading ? (
              <View style={styles.centerInline}>
                <LoadingIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading detail…</Text>
              </View>
            ) : !detail ? (
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>
                No detail found.
              </Text>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  ID: {detail.id}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Teacher: {detail.teacher_id}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Month: {String(detail.month).padStart(2, '0')}/{detail.year}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Status: {detail.status}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Submitted: {detail.submitted_at || '—'}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  HoD approved: {detail.hod_approved_at || '—'}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Principal approved: {detail.principal_approved_at || '—'}
                </Text>
                <Text style={[styles.detailLine, { color: colors.textSecondary }]}>
                  Rejection reason: {detail.rejection_reason || '—'}
                </Text>

                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.detailHeading, { color: colors.textPrimary }]}>Daily entries (JSON)</Text>
                  <Text style={[styles.mono, { color: colors.textSecondary }]}>{safeJsonPreview(detail.daily_entries)}</Text>
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
