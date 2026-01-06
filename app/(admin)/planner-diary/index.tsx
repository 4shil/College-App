import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, PrimaryButton, LoadingIndicator } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { useRBAC, PERMISSIONS } from '../../../hooks/useRBAC';

type PlannerRow = {
  id: string;
  week_start_date: string;
  week_end_date: string;
  status: string;
  created_at: string;
};

type DiaryRow = {
  id: string;
  month: number;
  year: number;
  status: string;
  created_at: string;
};

export default function PlannerDiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { hasPermission } = useRBAC();

  const canApproveAnything =
    hasPermission(PERMISSIONS.APPROVE_PLANNER_LEVEL_1) ||
    hasPermission(PERMISSIONS.APPROVE_PLANNER_FINAL) ||
    hasPermission(PERMISSIONS.APPROVE_DIARY_LEVEL_1) ||
    hasPermission(PERMISSIONS.APPROVE_DIARY_FINAL);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [plannerTableMissing, setPlannerTableMissing] = useState(false);
  const [diaryTableMissing, setDiaryTableMissing] = useState(false);

  const [plannerErrorText, setPlannerErrorText] = useState<string | null>(null);
  const [diaryErrorText, setDiaryErrorText] = useState<string | null>(null);

  const [recentPlanners, setRecentPlanners] = useState<PlannerRow[]>([]);
  const [recentDiaries, setRecentDiaries] = useState<DiaryRow[]>([]);

  const fetchData = useCallback(async () => {
    setPlannerTableMissing(false);
    setDiaryTableMissing(false);
    setPlannerErrorText(null);
    setDiaryErrorText(null);

    const [planners, diaries] = await Promise.all([
      supabase
        .from('lesson_planners')
        .select('id,week_start_date,week_end_date,status,created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('work_diaries')
        .select('id,month,year,status,created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (planners.error) {
      if ((planners.error as any)?.code === 'PGRST205') {
        setPlannerTableMissing(true);
        setRecentPlanners([]);
      } else {
        console.error('Error fetching lesson planners:', planners.error);
        setPlannerErrorText(planners.error.message);
        setRecentPlanners([]);
      }
    } else {
      setRecentPlanners((planners.data as PlannerRow[]) || []);
    }

    if (diaries.error) {
      if ((diaries.error as any)?.code === 'PGRST205') {
        setDiaryTableMissing(true);
        setRecentDiaries([]);
      } else {
        console.error('Error fetching work diaries:', diaries.error);
        setDiaryErrorText(diaries.error.message);
        setRecentDiaries([]);
      }
    } else {
      setRecentDiaries((diaries.data as DiaryRow[]) || []);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    load();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Planner & Diary</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Admin monitoring (read-only)</Text>

            <View style={styles.actionsRow}>
              {canApproveAnything ? (
                <PrimaryButton
                  title="Approvals"
                  onPress={() => router.push('/(admin)/planner-diary/approvals' as any)}
                  size="medium"
                />
              ) : null}
              <PrimaryButton
                title="Monitor Planners"
                onPress={() => router.push('/(admin)/planner-diary/planners' as any)}
                size="medium"
              />
              <PrimaryButton
                title="Monitor Diaries"
                onPress={() => router.push('/(admin)/planner-diary/diaries' as any)}
                variant="outline"
                glowing={false}
                size="medium"
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <LoadingIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
            </View>
          ) : (
            <View style={styles.sections}>
              <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}
              >
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Lesson Planners</Text>
                {plannerErrorText ? (
                  <>
                    <Text style={[styles.cardBody, { color: colors.error }]}>{plannerErrorText}</Text>
                    <View style={{ height: 10 }} />
                    <PrimaryButton title="Retry" size="small" onPress={onRefresh} style={{ alignSelf: 'flex-start' }} />
                  </>
                ) : null}
                {plannerTableMissing ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}
                  >
                    The database table `lesson_planners` is missing (or not exposed). Apply migrations then refresh.
                  </Text>
                ) : recentPlanners.length === 0 ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}
                  >
                    No lesson planners found.
                  </Text>
                ) : (
                  <View style={styles.list}>
                    {recentPlanners.map((p, idx) => (
                      <Animated.View key={p.id} entering={FadeInDown.delay(60 + idx * 25).springify()}>
                        <View style={styles.listRow}>
                          <Text style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {p.week_start_date} → {p.week_end_date}
                          </Text>
                          <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                            Status: {p.status}
                          </Text>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </GlassCard>

              <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}
              >
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Work Diaries</Text>
                {diaryErrorText ? (
                  <>
                    <Text style={[styles.cardBody, { color: colors.error }]}>{diaryErrorText}</Text>
                    <View style={{ height: 10 }} />
                    <PrimaryButton title="Retry" size="small" onPress={onRefresh} style={{ alignSelf: 'flex-start' }} />
                  </>
                ) : null}
                {diaryTableMissing ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}
                  >
                    The database table `work_diaries` is missing (or not exposed). Apply migrations then refresh.
                  </Text>
                ) : recentDiaries.length === 0 ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}
                  >
                    No work diaries found.
                  </Text>
                ) : (
                  <View style={styles.list}>
                    {recentDiaries.map((d, idx) => (
                      <Animated.View key={d.id} entering={FadeInDown.delay(60 + idx * 25).springify()}>
                        <View style={styles.listRow}>
                          <Text style={[styles.listTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {String(d.month).padStart(2, '0')}/{d.year}
                          </Text>
                          <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                            Status: {d.status}
                          </Text>
                        </View>
                      </Animated.View>
                    ))}
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
  header: { paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { marginTop: 6, fontSize: 14 },
  actionsRow: { marginTop: 12, gap: 12 },
  center: { paddingHorizontal: 20, paddingVertical: 30, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14 },
  sections: { paddingHorizontal: 20, gap: 12 },
  card: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardBody: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  list: { marginTop: 10, gap: 10 },
  listRow: { gap: 4 },
  listTitle: { fontSize: 14, fontWeight: '600' },
  listMeta: { fontSize: 13 },
});
