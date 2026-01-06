import React, { useCallback, useEffect, useState } from 'react';
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

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_active: boolean;
  created_at: string;
  publish_at: string | null;
  expires_at: string | null;
}

export default function ReceptionNoticesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [refreshing, setRefreshing] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('notices')
        .select('id, title, content, priority, is_active, created_at, publish_at, expires_at')
        .eq('is_active', true)
        .order('publish_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotices((data || []) as Notice[]);
    } catch (e: any) {
      setError(e?.message || 'Failed to load notices');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Restricted
      module="reception"
      permissions={PERMISSIONS.RECEPTION_VIEW_NOTICES}
      showDeniedMessage
      deniedMessage="You do not have access to view notices."
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
              <Text style={[styles.title, { color: colors.textPrimary }]}>Notices</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>VIEW ONLY</Text>
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
            {notices.length === 0 ? (
              <Card>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active notices.</Text>
              </Card>
            ) : (
              notices.map((n) => (
                <Card key={n.id}>
                  <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>{n.title}</Text>
                  <Text style={[styles.noticeMeta, { color: colors.textSecondary }]}>Priority: {n.priority}</Text>
                  <View style={{ height: 10 }} />
                  <Text style={[styles.noticeBody, { color: colors.textSecondary }]}>{n.content}</Text>
                  <View style={{ height: 10 }} />
                  <Text style={[styles.noticeMeta, { color: colors.textSecondary }]}>Published: {n.publish_at ? new Date(n.publish_at).toLocaleString() : new Date(n.created_at).toLocaleString()}</Text>
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
  noticeTitle: { fontSize: 15, fontWeight: '700' },
  noticeBody: { fontSize: 13, lineHeight: 18 },
  noticeMeta: { marginTop: 6, fontSize: 12 },
  emptyText: { fontSize: 13 },
  errorText: { fontSize: 13 },
});
