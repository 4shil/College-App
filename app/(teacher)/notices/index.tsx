import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type NoticePriority = 'low' | 'normal' | 'high' | 'urgent';

type Notice = {
  id: string;
  title: string;
  content: string;
  scope: string;
  priority: NoticePriority;
  department_id: string | null;
  section_id: string | null;
  author_id: string;
  attachment_url: string | null;
  publish_at: string | null;
  created_at: string;
};

type TeacherSection = {
  id: string;
  name: string;
};

const priorityTone: Record<NoticePriority, 'primary' | 'info' | 'warning' | 'error'> = {
  low: 'info',
  normal: 'primary',
  high: 'warning',
  urgent: 'error',
};

export default function TeacherNoticesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user, profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher, error } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
    if (error) {
      console.log('Teacher notices teacher id error:', error.message);
      return null;
    }
    return teacher?.id || null;
  }, [user?.id]);

  const fetchTeacherSections = useCallback(async (tId: string) => {
    const { data: academicYear } = await supabase.from('academic_years').select('id').eq('is_current', true).single();
    if (!academicYear?.id) return [];

    const { data, error } = await supabase
      .from('timetable_entries')
      .select('section_id, sections:sections!timetable_entries_section_id_fkey(id, name)')
      .eq('teacher_id', tId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true);

    if (error) {
      console.log('Teacher notices sections error:', error.message);
      setErrorText('Some notice scopes could not be loaded. Pull to refresh or retry.');
      return [];
    }

    const map = new Map<string, TeacherSection>();
    (data || []).forEach((row: any) => {
      if (!row?.section_id || !row?.sections) return;
      if (!map.has(row.section_id)) {
        map.set(row.section_id, { id: row.sections.id, name: row.sections.name });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, []);

  const fetchNotices = useCallback(async () => {
    if (!user?.id) return;

    let hadAnyError = false;

    // Load teacher id + sections first
    const tId = teacherId || (await fetchTeacherId());
    if (!tId) {
      setErrorText('Unable to load teacher profile.');
      setTeacherId(null);
      setSections([]);
      setNotices([]);
      return;
    }

    setTeacherId(tId);

    const sects = await fetchTeacherSections(tId);
    setSections(sects);
    const sectionIds = sects.map((s) => s.id);

    // Query relevant notices in 2-3 small queries to avoid complex OR conditions.
    const rows: Notice[] = [];

    const { data: collegeNotices, error: collegeErr } = await supabase
      .from('notices')
      .select('id, title, content, scope, priority, department_id, section_id, author_id, attachment_url, publish_at, created_at')
      .eq('is_active', true)
      .eq('scope', 'college')
      .order('created_at', { ascending: false })
      .limit(25);

    if (collegeErr) {
      hadAnyError = true;
      console.log('Teacher notices college error:', collegeErr.message);
    } else {
      rows.push(...((collegeNotices || []) as Notice[]));
    }

    if (profile?.department_id) {
      const { data: deptNotices, error: deptErr } = await supabase
        .from('notices')
        .select('id, title, content, scope, priority, department_id, section_id, author_id, attachment_url, publish_at, created_at')
        .eq('is_active', true)
        .eq('scope', 'department')
        .eq('department_id', profile.department_id)
        .order('created_at', { ascending: false })
        .limit(25);

      if (deptErr) {
        hadAnyError = true;
        console.log('Teacher notices department error:', deptErr.message);
      } else {
        rows.push(...((deptNotices || []) as Notice[]));
      }
    }

    if (sectionIds.length > 0) {
      const { data: classNotices, error: classErr } = await supabase
        .from('notices')
        .select('id, title, content, scope, priority, department_id, section_id, author_id, attachment_url, publish_at, created_at')
        .eq('is_active', true)
        .eq('scope', 'class')
        .in('section_id', sectionIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (classErr) {
        hadAnyError = true;
        console.log('Teacher notices class error:', classErr.message);
      } else {
        rows.push(...((classNotices || []) as Notice[]));
      }
    }

    // Deduplicate + sort
    const unique = new Map<string, Notice>();
    rows.forEach((n) => unique.set(n.id, n));

    const merged = Array.from(unique.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setNotices(merged);
    setErrorText(hadAnyError ? 'Some notices could not be loaded. Pull to refresh or retry.' : null);
  }, [fetchTeacherId, fetchTeacherSections, profile?.department_id, teacherId, user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorText(null);
      await fetchNotices();
      setLoading(false);
    };
    init();
  }, [fetchNotices]);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrorText(null);
    await fetchNotices();
    setRefreshing(false);
  };

  const openAttachment = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Cannot open', 'This attachment link cannot be opened on your device.');
        return;
      }
      await Linking.openURL(url);
    } catch (e: any) {
      console.log('Open notice attachment error:', e?.message || e);
      Alert.alert('Error', 'Failed to open attachment');
    }
  };

  const sectionNameById = useMemo(() => {
    const map = new Map<string, string>();
    sections.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [sections]);

  const renderNotice = (n: Notice, index: number) => {
    const tone = priorityTone[n.priority] || 'primary';
    const pillBg =
      tone === 'error'
        ? withAlpha(colors.error, isDark ? 0.22 : 0.14)
        : tone === 'warning'
          ? withAlpha(colors.warning, isDark ? 0.22 : 0.14)
          : tone === 'info'
            ? withAlpha(colors.info, isDark ? 0.22 : 0.14)
            : withAlpha(colors.primary, isDark ? 0.22 : 0.12);

    const pillText =
      tone === 'error'
        ? colors.error
        : tone === 'warning'
          ? colors.warning
          : tone === 'info'
            ? colors.info
            : colors.primary;

    const metaParts: string[] = [];
    if (n.scope === 'class' && n.section_id) metaParts.push(`Class: ${sectionNameById.get(n.section_id) || 'Section'}`);
    if (n.scope === 'department') metaParts.push('Department');
    if (n.scope === 'college') metaParts.push('College');

    return (
      <Animated.View key={n.id} entering={FadeInDown.delay(index * 30).duration(350)} style={{ marginBottom: 12 }}>
        <Card>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>{n.title}</Text>
              <Text style={[styles.noticeMeta, { color: colors.textMuted }]}>
                {metaParts.join(' • ')} • {new Date(n.publish_at || n.created_at).toLocaleString()}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: pillBg, borderColor: withAlpha(pillText, 0.5) }]}>
              <Text style={[styles.pillText, { color: pillText }]}>{n.priority.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={[styles.noticeBody, { color: colors.textSecondary }]}>{n.content}</Text>

          {n.attachment_url ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openAttachment(n.attachment_url!)}
              style={[styles.attachmentRow, { backgroundColor: withAlpha(colors.primary, isDark ? 0.16 : 0.08) }]}
            >
              <Ionicons name="attach" size={18} color={colors.primary} />
              <Text style={[styles.attachmentText, { color: colors.primary }]} numberOfLines={1}>
                Open attachment
              </Text>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]}>Notices</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>College, department, and your class notices</Text>
            </View>
            <PrimaryButton
              title="Create"
              onPress={() => router.push('/(teacher)/notices/create' as any)}
              variant="outline"
              size="small"
            />
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading notices...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {errorText ? (
              <View style={{ marginBottom: 12 }}>
                <Card>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Some data didn’t load</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>{errorText}</Text>
                  <View style={{ marginTop: 12 }}>
                    <PrimaryButton title="Retry" onPress={fetchNotices} variant="outline" />
                  </View>
                </Card>
              </View>
            ) : null}

            {notices.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No notices</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>No active notices for your scope.</Text>
              </Card>
            ) : (
              notices.map(renderNotice)
            )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  noticeMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  attachmentRow: {
    marginTop: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
});
