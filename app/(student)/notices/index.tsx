import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { withAlpha } from '../../../theme/colorUtils';

type NoticeRow = {
  id: string;
  title: string;
  content: string;
  scope: string;
  priority: string;
  department_id: string | null;
  section_id: string | null;
  attachment_url: string | null;
  created_at: string;
};

type NoticeReadRow = {
  notice_id: string;
};

function formatShortDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function priorityTone(priority: string) {
  if (priority === 'urgent' || priority === 'high') return 'high';
  if (priority === 'low') return 'low';
  return 'normal';
}

export default function NoticesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentOk, setStudentOk] = useState<boolean | null>(null);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;

    setError(null);
    const student = await getStudentByUserId(user.id);
    setStudentOk(Boolean(student?.id));
    if (!student?.id) {
      setNotices([]);
      setReadIds(new Set());
      return;
    }

    const { data: noticeRows, error: noticeError } = await supabase
      .from('notices')
      .select('id, title, content, scope, priority, department_id, section_id, attachment_url, created_at')
      .eq('is_active', true)
      .or(`section_id.eq.${student.section_id},department_id.eq.${student.department_id},scope.eq.college`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (noticeError) {
      console.log('Student notices error:', noticeError.message);
      setError('Failed to load notices');
      setNotices([]);
      setReadIds(new Set());
      return;
    }

    setNotices((noticeRows || []) as any);

    const noticeIds = (noticeRows || []).map((n: any) => n.id).filter(Boolean);
    if (noticeIds.length === 0) {
      setReadIds(new Set());
      return;
    }

    const { data: reads, error: readsError } = await supabase
      .from('notice_reads')
      .select('notice_id')
      .eq('user_id', user.id)
      .in('notice_id', noticeIds);

    if (readsError) {
      console.log('Student notice_reads error:', readsError.message);
      setReadIds(new Set());
      return;
    }

    const set = new Set<string>();
    (reads || []).forEach((r: NoticeReadRow) => set.add(r.notice_id));
    setReadIds(set);
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

  const filtered = useMemo(() => {
    if (filter === 'all') return notices;
    return notices.filter((n) => !readIds.has(n.id));
  }, [filter, notices, readIds]);

  const unreadCount = useMemo(() => notices.filter((n) => !readIds.has(n.id)).length, [notices, readIds]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notices</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{unreadCount} unread</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setFilter('all')}
            style={[styles.filterChip, { backgroundColor: filter === 'all' ? withAlpha(colors.primary, 0.18) : withAlpha(colors.textPrimary, 0.06) }]}
          >
            <Text style={[styles.filterChipText, { color: filter === 'all' ? colors.primary : colors.textSecondary }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFilter('unread')}
            style={[styles.filterChip, { backgroundColor: filter === 'unread' ? withAlpha(colors.primary, 0.18) : withAlpha(colors.textPrimary, 0.06) }]}
          >
            <Text style={[styles.filterChipText, { color: filter === 'unread' ? colors.primary : colors.textSecondary }]}>Unread</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading notices...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {studentOk === false ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
              </Card>
            ) : filtered.length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: 28 }}>
                <Ionicons name="notifications-off" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: 10 }]}>No notices</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>You’re all caught up.</Text>
              </Card>
            ) : (
              filtered.map((n, idx) => {
                const isRead = readIds.has(n.id);
                const tone = priorityTone(n.priority);
                const chipBg =
                  tone === 'high'
                    ? withAlpha(colors.error, 0.12)
                    : tone === 'low'
                      ? withAlpha(colors.textPrimary, 0.06)
                      : withAlpha(colors.warning, 0.12);
                const chipText =
                  tone === 'high' ? colors.error : tone === 'low' ? colors.textMuted : colors.warning;

                return (
                  <View key={n.id} style={{ marginBottom: 12 }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => router.push(`/(student)/notices/${n.id}` as any)}
                    >
                      <Card>
                        <View style={styles.noticeRow}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.noticeTopLine}>
                              {!isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                              <Text style={[styles.noticeTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                                {n.title}
                              </Text>
                            </View>
                            <Text style={[styles.noticeSnippet, { color: colors.textSecondary }]} numberOfLines={2}>
                              {n.content}
                            </Text>
                            <Text style={[styles.noticeMeta, { color: colors.textMuted }]}>
                              {formatShortDate(n.created_at)} • {String(n.scope).toUpperCase()}
                              {n.attachment_url ? ' • Attachment' : ''}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 8 }}>
                            <View style={[styles.priorityChip, { backgroundColor: chipBg }]}>
                              <Text style={[styles.priorityText, { color: chipText }]}>{String(n.priority).toUpperCase()}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  </View>
                );
              })
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
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  noticeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noticeTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  noticeSnippet: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  noticeMeta: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
  },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priorityText: {
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
