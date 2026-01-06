import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, LoadingIndicator, PrimaryButton } from '../../components/ui';
import { Restricted } from '../../components/Restricted';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabase';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';

type EventRow = {
  id: string;
  title: string;
  event_type: string | null;
  start_datetime: string;
  end_datetime: string | null;
  venue: string | null;
  is_active: boolean;
  created_at: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { hasPermission } = useRBAC();

  const canManageEvents = hasPermission(PERMISSIONS.MANAGE_EVENTS);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setErrorText(null);
    setTableMissing(false);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,event_type,start_datetime,end_datetime,venue,is_active,created_at')
        .order('start_datetime', { ascending: false })
        .limit(25);

      if (error) {
        if ((error as any)?.code === 'PGRST205') {
          setTableMissing(true);
          setEvents([]);
          return;
        }
        throw error;
      }

      setEvents((data as EventRow[]) || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setEvents([]);
      setErrorText('Unable to load events. Pull to refresh or retry.');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchEvents();
      setLoading(false);
    };
    load();
  }, [fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  return (
    <Restricted
      module="events"
      permissions={PERMISSIONS.MANAGE_EVENTS}
      showDeniedMessage
      deniedMessage="You do not have permission to access Events."
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
                <Text style={[styles.title, { color: colors.textPrimary }]}>Events</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create, edit, and publish events</Text>
              </View>
            </View>

            {canManageEvents && !tableMissing && (
              <PrimaryButton
                title="Create Event"
                onPress={() => router.push('/(admin)/events-create' as any)}
                size="medium"
                style={{ marginTop: 12 }}
              />
            )}
          </View>

          {loading ? (
            <View style={styles.center}>
              <LoadingIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading events…</Text>
            </View>
          ) : errorText ? (
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Couldn’t load events</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{errorText}</Text>
              <PrimaryButton title="Retry" onPress={fetchEvents} size="medium" style={{ marginTop: 12 }} />
            </GlassCard>
          ) : tableMissing ? (
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Events table not found</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}
              >
                The database table `events` is missing (or not exposed via RLS/API). Create/apply migrations then refresh.
              </Text>
            </GlassCard>
          ) : events.length === 0 ? (
            <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>No events yet</Text>
              <Text style={[styles.cardBody, { color: colors.textSecondary }]}
              >
                {canManageEvents
                  ? 'Create your first event using the button above.'
                  : 'You do not have permission to manage events.'}
              </Text>
            </GlassCard>
          ) : (
            <View style={styles.list}>
              {events.map((event, idx) => (
                <Animated.View key={event.id} entering={FadeInDown.delay(60 + idx * 25).springify()}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({ pathname: '/(admin)/events-edit', params: { id: event.id } } as any)
                    }
                  >
                    <GlassCard style={[styles.card, { borderColor: colors.cardBorder, borderWidth: colors.borderWidth }]}>
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                            {event.title}
                          </Text>
                          <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                            {event.event_type ? `${event.event_type} • ` : ''}{formatDateTime(event.start_datetime)}
                            {event.venue ? ` • ${event.venue}` : ''}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: event.is_active ? colors.success : colors.warning,
                            },
                          ]}
                        >
                          <Text style={[styles.badgeText, { color: colors.background }]}>
                            {event.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </Animated.View>
              ))}
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
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { marginTop: 6, fontSize: 14 },
  center: { paddingHorizontal: 20, paddingVertical: 30, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 14 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { marginTop: 6, fontSize: 13 },
  cardBody: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
