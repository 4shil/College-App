import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type NoticeRow = {
  id: string;
  title: string;
  content: string;
  scope: string;
  priority: string;
  attachment_url: string | null;
  created_at: string;
};

function formatFullDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NoticeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NoticeRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const markRead = useCallback(async (noticeId: string) => {
    if (!user?.id) return;
    await supabase.from('notice_reads').upsert({ notice_id: noticeId, user_id: user.id }, { onConflict: 'notice_id,user_id' });
  }, [user?.id]);

  const fetchNotice = useCallback(async () => {
    if (!id) return;
    setError(null);

    const { data, error: e } = await supabase
      .from('notices')
      .select('id, title, content, scope, priority, attachment_url, created_at')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (e) {
      console.log('Notice detail error:', e.message);
      setError('Failed to load notice');
      setNotice(null);
      return;
    }

    setNotice(data as any);
    await markRead(String((data as any).id));
  }, [id, markRead]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchNotice();
      setLoading(false);
    };
    init();
  }, [fetchNotice]);

  const openAttachment = async (url: string) => {
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>Notice</Text>
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
        ) : !notice ? (
          <Card>
            <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Not found</Text>
          </Card>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{notice.title}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {formatFullDate(notice.created_at)} • {String(notice.scope).toUpperCase()} • {String(notice.priority).toUpperCase()}
              </Text>
              <Text style={[styles.body, { color: colors.textSecondary }]}>{notice.content}</Text>

              {notice.attachment_url ? (
                <TouchableOpacity
                  onPress={() => openAttachment(notice.attachment_url!)}
                  activeOpacity={0.9}
                  style={[styles.attachmentBtn, { backgroundColor: withAlpha(colors.primary, 0.14) }]}
                >
                  <Ionicons name="attach" size={18} color={colors.primary} />
                  <Text style={[styles.attachmentText, { color: colors.primary }]}>Open attachment</Text>
                </TouchableOpacity>
              ) : null}
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
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  attachmentBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
