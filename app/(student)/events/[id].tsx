import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';
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

function formatFullWhen(startISO: string, endISO: string | null) {
  const s = new Date(startISO);
  if (Number.isNaN(s.getTime())) return startISO;
  const left = s.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (!endISO) return left;
  const e = new Date(endISO);
  if (Number.isNaN(e.getTime())) return left;
  const right = e.toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${left} – ${right}`;
}

export default function EventDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    setError(null);

    const { data, error: e } = await supabase
      .from('events')
      .select('id, title, description, event_type, start_datetime, end_datetime, venue, poster_url, registration_link')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (e) {
      console.log('Event detail error:', e.message);
      setError('Failed to load event');
      setEvent(null);
      return;
    }

    setEvent(data as any);

    if (user?.id) {
      const student = await getStudentByUserId(user.id);
      if (student?.id) {
        const { data: cert } = await supabase
          .from('event_certificates')
          .select('certificate_url')
          .eq('event_id', String((data as any).id))
          .eq('student_id', student.id)
          .maybeSingle();

        setCertificateUrl((cert as any)?.certificate_url || null);
      }
    }
  }, [id, user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchEvent();
      setLoading(false);
    };
    init();
  }, [fetchEvent]);

  const openUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Cannot open link', 'Invalid or unsupported URL');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>Event</Text>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : error ? (
          <Card style={{ backgroundColor: withAlpha(colors.error, 0.1) }}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </Card>
        ) : !event ? (
          <Card>
            <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Not found</Text>
          </Card>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {formatFullWhen(event.start_datetime, event.end_datetime)}
              </Text>
              {event.venue ? <Text style={[styles.meta, { color: colors.textMuted }]}>Venue: {event.venue}</Text> : null}

              {event.description ? (
                <Text style={[styles.body, { color: colors.textSecondary }]}>{event.description}</Text>
              ) : null}

              <View style={styles.actionsRow}>
                {event.registration_link ? (
                  <TouchableOpacity
                    onPress={() => openUrl(event.registration_link!)}
                    activeOpacity={0.9}
                    style={[styles.actionBtn, { backgroundColor: withAlpha(colors.primary, 0.14) }]}
                  >
                    <Ionicons name="open" size={18} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Open registration</Text>
                  </TouchableOpacity>
                ) : null}
                {certificateUrl ? (
                  <TouchableOpacity
                    onPress={() => openUrl(certificateUrl)}
                    activeOpacity={0.9}
                    style={[styles.actionBtn, { backgroundColor: withAlpha(colors.success, 0.14) }]}
                  >
                    <Ionicons name="download" size={18} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Download certificate</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Card>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    maxWidth: '75%',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
