import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, SolidButton } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface LateLog {
  id: string;
  admission_no: string;
  notes: string | null;
  created_at: string;
  student_name: string | null;
}

interface GateExitLog {
  id: string;
  admission_no: string | null;
  reason: string | null;
  exit_marked_at: string | null;
  student_name: string | null;
}

export default function TodaysLogsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [refreshing, setRefreshing] = useState(false);
  const [lateLogs, setLateLogs] = useState<LateLog[]>([]);
  const [gateLogs, setGateLogs] = useState<GateExitLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const [{ data: lateData, error: lateErr }, { data: gateData, error: gateErr }] = await Promise.all([
        supabase
          .from('reception_late_pass_logs')
          .select('id, admission_no, notes, created_at, student_name')
          .eq('log_date', todayKey)
          .order('created_at', { ascending: false }),
        supabase
          .from('reception_gate_passes')
          .select('id, admission_no, reason, exit_marked_at, student_name')
          .gte('exit_marked_at', `${todayKey}T00:00:00.000Z`)
          .lte('exit_marked_at', `${todayKey}T23:59:59.999Z`)
          .order('exit_marked_at', { ascending: false }),
      ]);

      if (lateErr) throw lateErr;
      if (gateErr) throw gateErr;

      setLateLogs((lateData || []) as any);
      setGateLogs((gateData || []) as any);
    } catch (e: any) {
      setError(e?.message || 'Failed to load logs');
    } finally {
      setRefreshing(false);
    }
  }, [todayKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Restricted
      module="reception"
      permissions={PERMISSIONS.RECEPTION_VIEW_TODAYS_LOGS}
      showDeniedMessage
      deniedMessage="You do not have access to Reception logs."
    >
      <AnimatedBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: colors.cardBackground, borderRadius: colors.borderRadius }]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Today's Logs</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Read-only • {todayKey}</Text>
            </View>
          </View>

          {error ? (
            <Card>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              <View style={{ height: 12 }} />
              <SolidButton
                style={{ backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 16 }}
                onPress={load}
              >
                <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: 12 }}>Retry</Text>
              </SolidButton>
            </Card>
          ) : null}

          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Late Pass Logs</Text>
            <View style={{ height: 10 }} />
            {lateLogs.length === 0 ? (
              <Card>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Late Pass logs today.</Text>
              </Card>
            ) : (
              lateLogs.map((l) => (
                <Card key={l.id}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{l.student_name || l.admission_no}</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{l.admission_no}</Text>
                  <View style={{ height: 8 }} />
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{l.notes?.trim() ? l.notes : '—'}</Text>
                  <View style={{ height: 10 }} />
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>{new Date(l.created_at).toLocaleString()}</Text>
                </Card>
              ))
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Gate Pass Exit Logs</Text>
            <View style={{ height: 10 }} />
            {gateLogs.length === 0 ? (
              <Card>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Gate Pass exits today.</Text>
              </Card>
            ) : (
              gateLogs.map((g) => (
                <Card key={g.id}>
                  <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{g.student_name || g.admission_no || '—'}</Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{g.admission_no || '—'}</Text>
                  <View style={{ height: 8 }} />
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{g.reason?.trim() ? g.reason : '—'}</Text>
                  <View style={{ height: 10 }} />
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                    {g.exit_marked_at ? new Date(g.exit_marked_at).toLocaleString() : '—'}
                  </Text>
                </Card>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 13 },
  sectionTitle: { marginTop: 18, fontSize: 16, fontWeight: '700' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSub: { marginTop: 4, fontSize: 13 },
  timeText: { fontSize: 12 },
  emptyText: { fontSize: 13 },
  errorText: { fontSize: 13 },
});
