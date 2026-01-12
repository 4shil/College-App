import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { useAuthStore } from '../../../../store/authStore';
import { supabase } from '../../../../lib/supabase';
import { withAlpha } from '../../../../theme/colorUtils';

type SectionRow = {
  id: string;
  name: string;
  departments?: { code: string } | null;
  years?: { name: string } | null;
};

type LeaveRow = {
  id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  created_at: string;
  student?: {
    roll_number: string | null;
    registration_number: string;
    profiles?: { full_name: string } | null;
  } | null;
};

function shortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export default function TeacherLeaveRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sections, setSections] = useState<SectionRow[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  const [filter, setFilter] = useState<'pending' | 'all' | 'approved' | 'rejected' | 'cancelled'>('pending');
  const [rows, setRows] = useState<LeaveRow[]>([]);

  const fetchSections = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('sections')
      .select('id, name, departments(code), years(name)')
      .eq('class_teacher_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.log('Leave requests sections error:', error.message);
      setSections([]);
      setSelectedSectionId('');
      return;
    }

    const list = (data || []) as any as SectionRow[];
    setSections(list);
    if (!selectedSectionId) setSelectedSectionId(list[0]?.id || '');
    if (list.length > 0 && selectedSectionId && !list.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(list[0]?.id || '');
    }
  }, [selectedSectionId, user?.id]);

  const fetchRequests = useCallback(async () => {
    if (!selectedSectionId) {
      setRows([]);
      return;
    }

    const q = supabase
      .from('student_leave_applications')
      .select(
        `id, from_date, to_date, reason, status, created_at,
         student:students!student_leave_applications_student_id_fkey(registration_number, roll_number, profiles:user_id(full_name))`
      )
      .eq('section_id', selectedSectionId)
      .order('created_at', { ascending: false })
      .limit(60);

    const { data, error } =
      filter === 'all'
        ? await q
        : await q.eq('status', filter);

    if (error) {
      console.log('Leave requests list error:', error.message);
      setRows([]);
      return;
    }

    setRows((data || []) as any);
  }, [filter, selectedSectionId]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchSections();
    setLoading(false);
  }, [fetchSections]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSections(), fetchRequests()]);
    setRefreshing(false);
  };

  const selectedSection = useMemo(() => sections.find((s) => s.id === selectedSectionId) || null, [sections, selectedSectionId]);
  const headerSub = selectedSection ? `${selectedSection.departments?.code || 'Dept'} • ${selectedSection.years?.name || 'Year'} • ${selectedSection.name}` : 'Select a section';

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Leave Requests</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{headerSub}</Text>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {sections.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No class assigned</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to set you as class teacher.</Text>
              </Card>
            ) : (
              <>
                <Card>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Section</Text>
                  <View style={{ marginTop: 10, gap: 10 }}>
                    {sections.slice(0, 6).map((s) => {
                      const active = s.id === selectedSectionId;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          onPress={() => setSelectedSectionId(s.id)}
                          activeOpacity={0.85}
                          style={[
                            styles.pickRow,
                            {
                              borderColor: active ? withAlpha(colors.primary, 0.45) : colors.cardBorder,
                              backgroundColor: active ? withAlpha(colors.primary, 0.08) : 'transparent',
                            },
                          ]}
                        >
                          <Text style={[styles.pickTitle, { color: colors.textPrimary }]}>
                            {s.departments?.code || 'Dept'} • {s.years?.name || 'Year'} • {s.name}
                          </Text>
                          {active ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Card>

                <View style={{ marginTop: 14, marginBottom: 10 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Filter</Text>
                  <View style={styles.filterRow}>
                    {(['pending', 'approved', 'rejected', 'cancelled', 'all'] as const).map((f) => {
                      const active = filter === f;
                      return (
                        <TouchableOpacity
                          key={f}
                          onPress={() => setFilter(f)}
                          activeOpacity={0.85}
                          style={[
                            styles.filterChip,
                            {
                              backgroundColor: active ? withAlpha(colors.primary, 0.18) : withAlpha(colors.textPrimary, isDark ? 0.12 : 0.06),
                            },
                          ]}
                        >
                          <Text style={[styles.filterText, { color: active ? colors.primary : colors.textSecondary }]}>
                            {f.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {rows.length === 0 ? (
                  <Card>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No requests</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>Nothing to review for this filter.</Text>
                  </Card>
                ) : (
                  rows.map((r, idx) => {
                    const status = String(r.status || 'pending');
                    const chipBg =
                      status === 'approved'
                        ? withAlpha(colors.success, isDark ? 0.18 : 0.12)
                        : status === 'rejected'
                          ? withAlpha(colors.error, isDark ? 0.18 : 0.12)
                          : status === 'cancelled'
                            ? withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08)
                            : withAlpha(colors.warning, isDark ? 0.18 : 0.12);

                    const chipText =
                      status === 'approved'
                        ? colors.success
                        : status === 'rejected'
                          ? colors.error
                          : status === 'cancelled'
                            ? colors.textMuted
                            : colors.warning;

                    const name = r.student?.profiles?.full_name || 'Student';
                    const roll = r.student?.roll_number ? `Roll ${r.student.roll_number}` : r.student?.registration_number || '';

                    return (
                      <Animated.View key={r.id} entering={FadeInDown.delay(idx * 20).duration(240)} style={{ marginBottom: 12 }}>
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => router.push(`/(teacher)/class-tools/leaves/${r.id}` as any)}
                        >
                          <Card>
                            <View style={styles.rowTop}>
                              <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                {name}
                              </Text>
                              <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
                                <Text style={[styles.statusText, { color: chipText }]}>{status.toUpperCase()}</Text>
                              </View>
                            </View>
                            <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                              {roll}
                            </Text>
                            <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>
                              {shortDate(r.from_date)} → {shortDate(r.to_date)}
                            </Text>
                            <Text style={[styles.reason, { color: colors.textMuted }]} numberOfLines={2}>
                              {r.reason}
                            </Text>
                          </Card>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })
                )}
              </>
            )}

            <View style={{ height: 16 }} />
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
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  pickRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pickTitle: {
    fontSize: 12,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '900',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  rowSub: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
  },
  reason: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
  },
});
