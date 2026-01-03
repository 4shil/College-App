import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type SubstitutionRow = {
  id: string;
  date: string;
  status: string;
  reason: string | null;
  created_at: string;
  timetable_entries?: { day_of_week: number; period: number } | null;
};

const dayLabel = (dayOfWeek: number | null | undefined) => {
  const map: Record<number, string> = {
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
    7: 'Sun',
  };
  if (!dayOfWeek) return '—';
  return map[dayOfWeek] || `D${dayOfWeek}`;
};

export default function TeacherPrincipalScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<SubstitutionRow[]>([]);

  const fetchSubstitutions = useCallback(async () => {
    const { data, error } = await supabase
      .from('substitutions')
      .select('id, date, status, reason, created_at, timetable_entries(day_of_week, period)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Principal substitutions error:', error.message);
      setItems([]);
      return;
    }

    setItems((data || []) as any as SubstitutionRow[]);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchSubstitutions();
      setLoading(false);
    };
    init();
  }, [fetchSubstitutions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubstitutions();
    setRefreshing(false);
  };

  const counts = useMemo(() => {
    const next = { pending: 0, approved: 0, rejected: 0, other: 0 };
    for (const row of items) {
      const s = (row.status || '').toLowerCase();
      if (s === 'pending') next.pending += 1;
      else if (s === 'approved') next.approved += 1;
      else if (s === 'rejected') next.rejected += 1;
      else next.other += 1;
    }
    return next;
  }, [items]);

  const statusPill = (status: string) => {
    const s = (status || '').toLowerCase();
    const bg =
      s === 'approved'
        ? withAlpha(colors.success, isDark ? 0.18 : 0.12)
        : s === 'rejected'
          ? withAlpha(colors.error, isDark ? 0.18 : 0.12)
          : withAlpha(colors.primary, isDark ? 0.18 : 0.10);

    const fg =
      s === 'approved'
        ? colors.success
        : s === 'rejected'
          ? colors.error
          : colors.primary;

    return (
      <View style={[styles.pill, { backgroundColor: bg, borderColor: withAlpha(fg, 0.25) }]}>
        <Text style={[styles.pillText, { color: fg }]}>{status || '—'}</Text>
      </View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Principal</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Monitoring (read-only)</Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading overview…</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Substitution overview</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Last 50 requests</Text>

              <View style={{ height: 12 }} />
              <View style={styles.countRow}>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: colors.textPrimary }]}>{counts.pending}</Text>
                  <Text style={[styles.countLabel, { color: colors.textMuted }]}>Pending</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: colors.textPrimary }]}>{counts.approved}</Text>
                  <Text style={[styles.countLabel, { color: colors.textMuted }]}>Approved</Text>
                </View>
                <View style={styles.countItem}>
                  <Text style={[styles.countValue, { color: colors.textPrimary }]}>{counts.rejected}</Text>
                  <Text style={[styles.countLabel, { color: colors.textMuted }]}>Rejected</Text>
                </View>
              </View>
            </Card>

            <View style={{ height: 12 }} />

            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Recent substitutions</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Read-only list</Text>

              <View style={{ height: 12 }} />
              {items.length === 0 ? (
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>No substitutions visible.</Text>
              ) : (
                items.map((s, idx) => {
                  const day = dayLabel(s.timetable_entries?.day_of_week);
                  const period = s.timetable_entries?.period;
                  return (
                    <Animated.View
                      key={s.id}
                      entering={FadeInDown.delay(idx * 10).duration(220)}
                      style={{ marginBottom: 12 }}
                    >
                      <View style={styles.subRow}>
                        <View style={styles.rowTop}>
                          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                            {s.date}
                            {typeof period === 'number' ? ` • ${day} • P${period}` : ` • ${day}`}
                          </Text>
                          {statusPill(s.status)}
                        </View>
                        {s.reason ? (
                          <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>
                            {s.reason}
                          </Text>
                        ) : null}
                      </View>
                    </Animated.View>
                  );
                })
              )}
            </Card>

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
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  blockSub: {
    marginTop: 4,
    fontSize: 13,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  countItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  countValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  countLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  subRow: {
    paddingVertical: 10,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    marginTop: 6,
    fontSize: 13,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 10,
  },
});
