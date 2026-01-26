import React, { useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { AnimatedBackground, Card, LoadingIndicator } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import { useAuthStore } from '../../store/authStore';

type TimetableEntry = {
  entryId?: string;
  startTime?: string | null;
  endTime?: string | null;
  period?: number | string | null;
  courseName?: string | null;
  roomLabel?: string | null;
};

type AssignmentItem = {
  id: string;
  title: string;
  courseName?: string | null;
  dueDate?: string | null;
  isOverdue?: boolean;
  daysLeft?: number;
};

function navigateWithHaptics(router: ReturnType<typeof useRouter>, route: string) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(route as any);
}

function safePct(n: number | undefined | null) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function formatRelative(d: Date) {
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

function formatTimeLabel(start?: string | null, end?: string | null) {
  const startText = start ? String(start).slice(0, 5) : '—';
  const endText = end ? String(end).slice(0, 5) : '—';
  return `${startText} - ${endText}`;
}

export default function StudentDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();
  const { summary, loading, refreshing, refresh } = useStudentDashboard();

  const [now, setNow] = useState(() => new Date());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hero = useMemo(() => {
    const hour = now.getHours();
    const greetingText = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { greetingText, timeText };
  }, [now]);

  const displayName = useMemo(() => summary?.studentName || profile?.full_name || 'Student', [summary?.studentName, profile?.full_name]);
  const firstName = useMemo(() => {
    const name = String(displayName || 'Student').trim();
    return name.split(/\s+/)[0] || 'Student';
  }, [displayName]);

  const attendanceTone = useMemo(() => {
    const status = summary?.attendanceSummary?.status;
    if (status === 'warning') return { color: colors.warning, bg: withAlpha(colors.warning, isDark ? 0.22 : 0.12) };
    if (status === 'critical') return { color: colors.error, bg: withAlpha(colors.error, isDark ? 0.22 : 0.12) };
    return { color: colors.success, bg: withAlpha(colors.success, isDark ? 0.18 : 0.1) };
  }, [summary?.attendanceSummary?.status, colors.warning, colors.error, colors.success, isDark]);

  const assignments = summary?.upcomingAssignments ?? [];
  const todayClasses: TimetableEntry[] = summary?.todayTimetable ?? [];
  const nextClass = summary?.nextClass;
  const unreadNotices = summary?.unreadNoticesCount ?? 0;
  const photoUrl = profile?.photo_url || '';
  const contentTopPadding = insets.top + 12;

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
    setLastUpdatedAt(new Date());
  };

  const renderClassTiles = () => {
    if (loading && !todayClasses.length) {
      return (
        <Card style={styles.wideCard}>
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <LoadingIndicator color={colors.primary} />
          </View>
        </Card>
      );
    }

    if (!todayClasses.length) {
      return (
        <Card style={styles.wideCard}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No classes today</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>Your timetable is clear for now.</Text>
        </Card>
      );
    }

    return (
      <View style={styles.tileGrid}>
        {todayClasses.slice(0, 4).map((c, idx) => (
          <Animated.View
            key={c.entryId || `${c.courseName}-${idx}`}
            entering={FadeInDown.delay(40 + idx * 25).duration(220)}
            style={styles.tileItem}
          >
            <Card style={styles.tileCard}>
              <View style={styles.classTileTop}>
                <Text style={[styles.classTileTime, { color: colors.textMuted }]} numberOfLines={1}>
                  {formatTimeLabel(c.startTime, c.endTime)}
                </Text>
                {!!c.roomLabel && (
                  <View style={[styles.pill, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08) }]}>
                    <Text style={[styles.pillText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {c.roomLabel}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {c.courseName || 'Class'}
              </Text>
              <Text style={[styles.tileSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {c.period ? `Period ${c.period}` : 'Upcoming period'}
              </Text>
            </Card>
          </Animated.View>
        ))}
      </View>
    );
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: contentTopPadding, paddingBottom: insets.bottom + 128 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigateWithHaptics(router, '/(student)/modules')}
              style={[styles.iconBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="Open modules"
            >
              <Ionicons name="grid-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.heroTopRight}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigateWithHaptics(router, '/(student)/notices')}
                style={[styles.iconBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
                accessibilityRole="button"
                accessibilityLabel="View notices"
              >
                <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
                {unreadNotices > 0 ? <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} /> : null}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigateWithHaptics(router, '/(student)/profile')}
                style={[styles.iconBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
                accessibilityRole="button"
                accessibilityLabel="Open profile"
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.heroAvatarImage} accessibilityIgnoresInvertColors />
                ) : (
                  <Ionicons name="person-circle-outline" size={24} color={colors.textPrimary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.heroGreeting, { color: colors.textPrimary }]} numberOfLines={1}>
            {hero.greetingText}, {firstName}
          </Text>
          <Text style={[styles.heroTime, { color: colors.textPrimary }]} accessibilityLabel={`Current time ${hero.timeText}`}>
            {hero.timeText}
          </Text>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigateWithHaptics(router, '/(student)/timetable')}
              style={[styles.heroActionBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="Open timetable"
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.heroActionText, { color: colors.textPrimary }]}>Timetable</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigateWithHaptics(router, '/(student)/assignments')}
              style={[styles.heroActionBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="Open assignments"
            >
              <Ionicons name="clipboard-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.heroActionText, { color: colors.textPrimary }]}>Assignments</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
            {lastUpdatedAt ? `Updated ${formatRelative(lastUpdatedAt)}` : 'Pull to refresh'}
          </Text>
        </View>

        <View style={{ marginTop: 12 }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tasks</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigateWithHaptics(router, '/(student)/modules')}
              style={[styles.viewAllBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="View all modules"
            >
              <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tileGrid}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => navigateWithHaptics(router, '/(student)/attendance')} style={styles.tileItem}>
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="checkmark-done-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Attendance
                </Text>
                <Text style={[styles.tileSub, { color: attendanceTone.color }]} numberOfLines={1}>
                  {safePct(summary?.attendanceSummary?.percentage).toFixed(0)}% this month
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={() => navigateWithHaptics(router, '/(student)/assignments')} style={styles.tileItem}>
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="clipboard-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Assignments
                </Text>
                <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {assignments.length ? `${assignments.length} pending` : 'All caught up'}
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={() => navigateWithHaptics(router, '/(student)/marks')} style={styles.tileItem}>
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="stats-chart-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Marks
                </Text>
                <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {summary?.marksSnapshot ? `${safePct(summary.marksSnapshot.percentage).toFixed(0)}% latest` : 'Awaiting results'}
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={() => navigateWithHaptics(router, '/(student)/notices')} style={styles.tileItem}>
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Notices
                </Text>
                <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {unreadNotices ? `${unreadNotices} unread` : 'All read'}
                </Text>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Classes</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigateWithHaptics(router, '/(student)/timetable')}
              style={[styles.viewAllBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="View all classes"
            >
              <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {nextClass ? (
            <Card style={styles.wideCard}>
              <View style={styles.wideRow}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="school-outline" size={20} color={colors.textPrimary} />
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={[styles.wideTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {nextClass.courseName || 'Next class'}
                  </Text>
                  <Text style={[styles.wideSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {nextClass.roomLabel ? `${nextClass.roomLabel} • ` : ''}{nextClass.startsInMinutes} min
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.12) }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]} numberOfLines={1}>
                    {nextClass.startsInMinutes} min
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {renderClassTiles()}
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Important</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigateWithHaptics(router, '/(student)/assignments')}
              style={[styles.viewAllBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="View all tasks"
            >
              <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {assignments.length ? (
            <View style={styles.tileGrid}>
              {assignments.slice(0, 2).map((a: AssignmentItem) => {
                const tone = a.isOverdue ? colors.error : (a.daysLeft ?? 0) <= 3 ? colors.warning : colors.primary;
                const bgTone = withAlpha(tone, isDark ? 0.22 : 0.12);
                return (
                  <TouchableOpacity
                    key={a.id}
                    activeOpacity={0.9}
                    onPress={() => navigateWithHaptics(router, '/(student)/assignments')}
                    style={styles.tileItem}
                  >
                    <Card style={styles.tileCard}>
                      <View style={styles.noticeTileTop}>
                        <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                          <Ionicons name="document-text-outline" size={20} color={colors.textPrimary} />
                        </View>
                        <View style={[styles.scopePill, { backgroundColor: bgTone }]}>
                          <Text style={[styles.scopePillText, { color: tone }]}>
                            {a.isOverdue ? 'Overdue' : `${a.daysLeft ?? 0}d`}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.noticeTileTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {a.title}
                      </Text>
                      <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                        {a.courseName || 'Course'}{a.dueDate ? ` • Due ${a.dueDate}` : ''}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Card style={styles.wideCard}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No pending tasks</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Check back for new assignments or events.</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  hero: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '900',
  },
  heroTime: {
    marginTop: 8,
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -1.2,
  },
  heroActionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
  },
  heroActionText: {
    fontSize: 13,
    fontWeight: '900',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    resizeMode: 'cover',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lastUpdated: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '900',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tileItem: {
    width: '48%',
  },
  tileCard: {
    minHeight: 132,
  },
  tileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  tileSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  wideCard: {
    marginBottom: 12,
  },
  wideRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  wideSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '900',
  },
  classTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  classTileTime: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  noticeTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  scopePill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
  },
  scopePillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  noticeTileTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
});
