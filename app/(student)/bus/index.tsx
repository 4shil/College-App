import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { getStudentByUserId } from '../../../lib/database';
import { withAlpha } from '../../../theme/colorUtils';

export default function BusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;

    const student = await getStudentByUserId(user.id);
    if (!student?.id) {
      setSubscription(null);
      setRoutes([]);
      setStops([]);
      setSelectedRouteId(null);
      setSelectedStopId(null);
      return;
    }

    const ayId = student.academic_year_id
      ? student.academic_year_id
      : (await supabase.from('academic_years').select('id').eq('is_current', true).single()).data?.id;

    if (ayId) {
      const { data: sub } = await supabase
        .from('bus_subscriptions')
        .select('id, approval_status, route_id, stop_id, created_at, routes:bus_routes(route_number, route_name), stops:bus_stops(stop_name)')
        .eq('student_id', student.id)
        .eq('academic_year_id', ayId)
        .maybeSingle();

      setSubscription(sub || null);
    } else {
      setSubscription(null);
    }

    const { data: routeRows } = await supabase
      .from('bus_routes')
      .select('id, route_number, route_name, vehicle_number')
      .eq('is_active', true)
      .order('route_number');
    setRoutes(routeRows || []);

    // Auto-select route/stop from existing subscription.
    const currentRouteId = (subscription?.route_id as string | undefined) || null;
    if (currentRouteId) {
      setSelectedRouteId(currentRouteId);
      setSelectedStopId((subscription?.stop_id as string | undefined) || null);
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

  const fetchStops = useCallback(async (routeId: string) => {
    const { data } = await supabase
      .from('bus_stops')
      .select('id, route_id, stop_name, stop_order, pickup_time, drop_time')
      .eq('route_id', routeId)
      .order('stop_order', { ascending: true });
    setStops(data || []);
  }, []);

  useEffect(() => {
    if (!selectedRouteId) {
      setStops([]);
      setSelectedStopId(null);
      return;
    }
    fetchStops(selectedRouteId);
  }, [fetchStops, selectedRouteId]);

  const requestSubscription = useCallback(async () => {
    if (!user?.id) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const student = await getStudentByUserId(user.id);
      if (!student?.id) {
        setMessage('Student record not found');
        return;
      }

      const ayId = student.academic_year_id
        ? student.academic_year_id
        : (await supabase.from('academic_years').select('id').eq('is_current', true).single()).data?.id;

      if (!ayId) {
        setMessage('No academic year found');
        return;
      }

      if (!selectedRouteId) {
        setMessage('Select a route');
        return;
      }

      if (!selectedStopId) {
        setMessage('Select a stop');
        return;
      }

      const { error } = await supabase.from('bus_subscriptions').insert({
        student_id: student.id,
        academic_year_id: ayId,
        route_id: selectedRouteId,
        stop_id: selectedStopId,
        approval_status: 'pending',
      } as any);

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage('Request submitted');
      await fetchAll();
    } finally {
      setSubmitting(false);
    }
  }, [fetchAll, selectedRouteId, selectedStopId, user?.id]);

  const status = useMemo(() => String(subscription?.approval_status || 'none'), [subscription?.approval_status]);
  const statusBg = status === 'approved' ? withAlpha(colors.success, 0.12) : status === 'rejected' ? withAlpha(colors.error, 0.12) : withAlpha(colors.warning, 0.12);
  const statusFg = status === 'approved' ? colors.success : status === 'rejected' ? colors.error : colors.warning;

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bus Transport</Text>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading bus info...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Subscription</Text>
            <Card>
              {subscription ? (
                <>
                  <View style={styles.subRow}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Route</Text>
                    <Text style={[styles.subValue, { color: colors.textPrimary }]}>
                      {subscription.routes?.route_number} • {subscription.routes?.route_name}
                    </Text>
                  </View>
                  <View style={styles.subRow}>
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Stop</Text>
                    <Text style={[styles.subValue, { color: colors.textPrimary }]}>
                      {subscription.stops?.stop_name || 'Not selected'}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusText, { color: statusFg }]}>{status.toUpperCase()}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No subscription</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>Select a route and stop to request approval.</Text>
                </>
              )}
            </Card>

            {!subscription && (
              <>
                {message ? (
                  <Card style={{ marginTop: 12 }}>
                    <Text style={{ color: message === 'Request submitted' ? colors.success : colors.warning, fontWeight: '800' }}>
                      {message}
                    </Text>
                  </Card>
                ) : null}

                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 18 }]}>Request Subscription</Text>

                <Card>
                  <Text style={[styles.pickLabel, { color: colors.textSecondary }]}>Route</Text>
                  <View style={{ marginTop: 8, gap: 10 }}>
                    {routes.slice(0, 20).map((r: any) => {
                      const active = selectedRouteId === r.id;
                      return (
                        <TouchableOpacity
                          key={r.id}
                          onPress={() => setSelectedRouteId(r.id)}
                          style={[
                            styles.pickRow,
                            {
                              borderColor: active ? withAlpha(colors.primary, 0.45) : colors.cardBorder,
                              backgroundColor: active ? withAlpha(colors.primary, 0.08) : 'transparent',
                            },
                          ]}
                        >
                          <Text style={[styles.pickTitle, { color: colors.textPrimary }]}>
                            {r.route_number} • {r.route_name}
                          </Text>
                          {active ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.pickLabel, { color: colors.textSecondary, marginTop: 16 }]}>Stop</Text>
                  {selectedRouteId ? (
                    stops.length === 0 ? (
                      <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 8 }]}>No stops for this route.</Text>
                    ) : (
                      <View style={{ marginTop: 8, gap: 10 }}>
                        {stops.map((s: any) => {
                          const active = selectedStopId === s.id;
                          return (
                            <TouchableOpacity
                              key={s.id}
                              onPress={() => setSelectedStopId(s.id)}
                              style={[
                                styles.pickRow,
                                {
                                  borderColor: active ? withAlpha(colors.primary, 0.45) : colors.cardBorder,
                                  backgroundColor: active ? withAlpha(colors.primary, 0.08) : 'transparent',
                                },
                              ]}
                            >
                              <Text style={[styles.pickTitle, { color: colors.textPrimary }]}>{s.stop_name}</Text>
                              {active ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} /> : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )
                  ) : (
                    <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 8 }]}>Select a route first.</Text>
                  )}

                  <TouchableOpacity
                    onPress={requestSubscription}
                    disabled={submitting}
                    activeOpacity={0.85}
                    style={[styles.requestBtn, { backgroundColor: withAlpha(colors.primary, 0.14) }]}
                  >
                    <Text style={[styles.requestText, { color: colors.primary }]}>
                      {submitting ? 'Submitting…' : 'Request'}
                    </Text>
                  </TouchableOpacity>
                </Card>
              </>
            )}

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 18 }]}>Routes</Text>
            {routes.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No routes</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Routes will appear once configured.</Text>
              </Card>
            ) : (
              routes.slice(0, 20).map((r: any) => (
                <View key={r.id} style={{ marginBottom: 12 }}>
                  <Card>
                    <Text style={[styles.routeTitle, { color: colors.textPrimary }]}>
                      {r.route_number} • {r.route_name}
                    </Text>
                    {r.vehicle_number ? (
                      <Text style={[styles.routeMeta, { color: colors.textMuted }]}>Vehicle: {r.vehicle_number}</Text>
                    ) : null}
                  </Card>
                </View>
              ))
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12,
  },
  subRow: {
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  subValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '900',
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  routeMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  pickLabel: {
    fontSize: 11,
    fontWeight: '900',
  },
  pickRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pickTitle: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
  },
  requestBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  requestText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
