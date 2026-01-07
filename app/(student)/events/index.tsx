import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { withAlpha } from '../../../theme/colorUtils';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { getStudentByUserId } from '../../../lib/database';

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  start_datetime: string;
  end_datetime: string | null;
  venue: string | null;
  poster_url: string | null;
  registration_link: string | null;
};

function formatWhen(startISO: string) {
  const d = new Date(startISO);
  if (Number.isNaN(d.getTime())) return startISO;
  return d.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);

  const fetchEvents = useCallback(async () => {
    if (!user?.id) return;
    setError(null);

    const student = await getStudentByUserId(user.id);
    if (!student?.id) {
      setEvents([]);
      return;
    }

    const { data, error: e } = await supabase
      .from('events')
      .select('id, title, description, event_type, start_datetime, end_datetime, venue, poster_url, registration_link, department_id, is_active')
      .eq('is_active', true)
      .or(`department_id.is.null,department_id.eq.${student.department_id}`)
      .order('start_datetime', { ascending: true })
      .limit(50);

    if (e) {
      console.log('Student events error:', e.message);
      setError('Failed to load events');
      setEvents([]);
      return;
    }

    setEvents((data || []) as any);
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchEvents();
      setLoading(false);
    };
    init();
  }, [fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };

  const upcomingCount = useMemo(() => events.length, [events.length]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Events</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{upcomingCount} listed</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading events...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {events.length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: 10 }]}>No events</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Check back later.</Text>
              </Card>
            ) : (
              events.map((e) => (
                <View key={e.id} style={{ marginBottom: 12 }}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/(student)/events/${e.id}` as any)}>
                    <Card>
                      <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={1}>{e.title}</Text>
                      <Text style={[styles.eventMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                        {formatWhen(e.start_datetime)}{e.venue ? ` • ${e.venue}` : ''}
                      </Text>
                      {e.description ? (
                        <Text style={[styles.eventDesc, { color: colors.textMuted }]} numberOfLines={2}>{e.description}</Text>
                      ) : null}
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
                          <Text style={[styles.badgeText, { color: colors.primary }]}>{(e.event_type || 'event').toUpperCase()}</Text>
                        </View>
                        {e.registration_link ? (
                          <View style={[styles.badge, { backgroundColor: withAlpha(colors.success, 0.12) }]}>
                            <Text style={[styles.badgeText, { color: colors.success }]}>REGISTER</Text>
                          </View>
                        ) : null}
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {error && (
              <Card style={{ marginTop: 8, backgroundColor: withAlpha(colors.error, 0.1) }}>
                <Text style={{ color: colors.error }}>{error}</Text>
              </Card>
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
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  eventMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  eventDesc: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12,
  },
});
