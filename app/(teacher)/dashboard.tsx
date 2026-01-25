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
import { TEACHER_ROUTES } from '../../lib/routes';
import { useTeacherDashboardSummary } from '../../hooks/useTeacherDashboardSummary';
import { useAuthStore } from '../../store/authStore';

function titleCaseScope(scope: string) {
  if (!scope) return '';
  if (scope === 'exam') return 'Exam Cell';
  if (scope === 'department') return 'Department';
  if (scope === 'college') return 'Principal';
  return scope;
}

// Helper to navigate with haptic feedback
function navigateWithHaptics(router: ReturnType<typeof useRouter>, route: typeof TEACHER_ROUTES[keyof typeof TEACHER_ROUTES]) {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push(route as any);
}

export default function TeacherDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();
  const { summary, loading, refreshing, refresh } = useTeacherDashboardSummary();

  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const photoUrl = profile?.photo_url || '';

  const alert = summary?.criticalAlert || null;
  const showAlert = Boolean(alert);

  // Hero is always first; the alert banner (if present) is the second child.
  const stickyHeaderIndices = useMemo(() => (showAlert ? [1] : undefined), [showAlert]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refresh();
    setLastUpdatedAt(new Date());
  };

  const handleAlertCta = () => {
    if (!alert) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (alert.kind === 'attendance') {
      router.push(TEACHER_ROUTES.ATTENDANCE as any);
      return;
    }
    if (alert.kind === 'marks') {
      router.push(TEACHER_ROUTES.RESULTS as any);
      return;
    }
    router.push(TEACHER_ROUTES.ASSIGNMENTS as any);
  };

  const alertBg = alert
    ? alert.kind === 'attendance'
      ? withAlpha(colors.error, isDark ? 0.25 : 0.14)
      : alert.kind === 'marks'
        ? withAlpha(colors.warning, isDark ? 0.25 : 0.14)
        : withAlpha(colors.warning, isDark ? 0.25 : 0.12)
    : 'transparent';

  const alertText = alert
    ? alert.kind === 'attendance'
      ? colors.error
      : alert.kind === 'marks'
        ? colors.warning
        : colors.warning
    : colors.textPrimary;

  const contentTopPadding = insets.top + 12;

  const hero = useMemo(() => {
    const hour = now.getHours();
    const greetingText = hour < 12 ? 'Good Morning!' : hour < 17 ? 'Good Afternoon!' : 'Good Evening!';
    const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { greetingText, timeText };
  }, [now]);

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: contentTopPadding, paddingBottom: insets.bottom + 128 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        stickyHeaderIndices={stickyHeaderIndices}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero (Inspired) */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(TEACHER_ROUTES.MODULES as any)}
              style={[styles.iconBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="Modules menu"
              accessibilityHint="Opens the modules menu"
            >
              <Ionicons name="grid-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.heroTopRight}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push(TEACHER_ROUTES.PROFILE as any)}
                style={[styles.iconBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
                accessibilityRole="button"
                accessibilityLabel="View profile"
                accessibilityHint="Opens your profile page"
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.heroAvatarImage} accessibilityIgnoresInvertColors />
                ) : (
                  <Ionicons name="person-circle-outline" size={24} color={colors.textPrimary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <Text 
            style={[styles.heroGreeting, { color: colors.textPrimary }]} 
            numberOfLines={1}
            accessibilityRole="header"
          >
            {hero.greetingText}
          </Text>
          <Text 
            style={[styles.heroTime, { color: colors.textPrimary }]}
            accessibilityLabel={`Current time: ${hero.timeText}`}
          >
            {hero.timeText}
          </Text>

          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(TEACHER_ROUTES.NOTICES as any)}
              style={[styles.heroActionBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="View notices"
              accessibilityHint="Opens the notices screen"
            >
              <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.heroActionText, { color: colors.textPrimary }]}>Notices</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.lastUpdated, { color: colors.textMuted }]} numberOfLines={1}>
            {lastUpdatedAt ? `Last updated: ${lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Pull to refresh'}
          </Text>
        </View>

        {/* Critical Alert Strip (Conditional + Sticky) */}
        {showAlert ? (
          <View 
            style={[styles.alertStrip, { backgroundColor: alertBg, borderColor: withAlpha(alertText, 0.45) }]}
            accessibilityRole="alert"
            accessibilityLabel={`Alert: ${alert?.title}`}
          >
            <View style={styles.alertLeft}>
              <View style={[styles.alertIcon, { backgroundColor: withAlpha(alertText, isDark ? 0.16 : 0.1) }]}>
                <Ionicons name="alert-circle-outline" size={18} color={alertText} />
              </View>
              <Text style={[styles.alertText, { color: alertText }]} numberOfLines={2}>
                {alert?.title}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAlertCta}
              style={[styles.alertCta, { backgroundColor: withAlpha(alertText, isDark ? 0.18 : 0.12) }]}
              accessibilityRole="button"
              accessibilityLabel={alert?.ctaLabel || 'Take action'}
              accessibilityHint="Navigates to resolve this alert"
            >
              <Text style={[styles.alertCtaText, { color: alertText }]} numberOfLines={1}>
                {alert?.ctaLabel}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={alertText} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Tasks (Tile Grid) */}
        <View style={{ marginTop: showAlert ? 18 : 10 }}>
          <View style={styles.sectionRow}>
            <Text 
              style={[styles.sectionTitle, { color: colors.textPrimary }]}
              accessibilityRole="header"
            >
              Tasks
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(TEACHER_ROUTES.MODULES as any)}
              style={[styles.viewAllBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="View all tasks"
            >
              <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tileGrid}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigateWithHaptics(router, TEACHER_ROUTES.ATTENDANCE)}
              style={styles.tileItem}
              accessibilityRole="button"
              accessibilityLabel={`Attendance. ${summary?.attendancePendingCount ?? 0} pending`}
              accessibilityHint="Opens attendance management"
            >
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="clipboard-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Attendance
                </Text>
                <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {summary?.attendancePendingCount ?? (loading ? '—' : 0)} pending
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigateWithHaptics(router, TEACHER_ROUTES.ASSIGNMENTS)}
              style={styles.tileItem}
              accessibilityRole="button"
              accessibilityLabel={`Assignments. ${summary?.assignmentsToEvaluateCount ?? 0} to evaluate`}
              accessibilityHint="Opens assignment management"
            >
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Assignments
                </Text>
                <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {summary?.assignmentsToEvaluateCount ?? (loading ? '—' : 0)} to evaluate
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigateWithHaptics(router, TEACHER_ROUTES.RESULTS)}
              style={styles.tileItem}
              accessibilityRole="button"
              accessibilityLabel={`Internal Marks. ${summary?.internalMarksPendingCount ?? 0} pending`}
              accessibilityHint="Opens internal marks management"
            >
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="stats-chart-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Internal Marks
                </Text>
                <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {summary?.internalMarksPendingCount == null ? '—' : summary.internalMarksPendingCount} pending
                </Text>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigateWithHaptics(router, TEACHER_ROUTES.NOTICES)}
              style={styles.tileItem}
              accessibilityRole="button"
              accessibilityLabel={`Notices. ${summary?.noticesUnreadCount ?? 0} unread`}
              accessibilityHint="Opens notices"
            >
              <Card style={styles.tileCard}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  Notices
                </Text>
                <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {summary?.noticesUnreadCount == null ? '—' : summary.noticesUnreadCount} unread
                </Text>
              </Card>
            </TouchableOpacity>
          </View>
        </View>

        {/* Classes (Inspired) */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionRow}>
            <Text 
              style={[styles.sectionTitle, { color: colors.textPrimary }]}
              accessibilityRole="header"
            >
              Classes
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(TEACHER_ROUTES.TIMETABLE as any)}
              style={[styles.viewAllBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
              accessibilityRole="button"
              accessibilityLabel="View all classes"
              accessibilityHint="Opens the full timetable"
            >
              <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {summary?.nextClass ? (
            <View
              accessibilityLabel={`Next class: ${summary.nextClass.subjectLabel} in ${summary.nextClass.startsInMinutes} minutes. ${summary.nextClass.classLabel}${summary.nextClass.roomLabel ? ` in ${summary.nextClass.roomLabel}` : ''}`}
              accessibilityRole="summary"
            >
              <Card style={styles.wideCard}>
                <View style={styles.wideRow}>
                <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                  <Ionicons name="school-outline" size={20} color={colors.textPrimary} />
                </View>
                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text style={[styles.wideTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {summary.nextClass.subjectLabel}
                  </Text>
                  <Text style={[styles.wideSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {summary.nextClass.classLabel}
                    {summary.nextClass.roomLabel ? ` • ${summary.nextClass.roomLabel}` : ''}
                  </Text>
                </View>
                <View style={[styles.pill, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.12) }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]} numberOfLines={1}>
                    {summary.nextClass.startsInMinutes} min
                  </Text>
                </View>
              </View>
            </Card>
            </View>
          ) : null}

          {loading && !summary ? (
            <Card style={styles.wideCard}>
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <LoadingIndicator color={colors.primary} />
              </View>
            </Card>
          ) : summary?.todayClasses?.length ? (
            <View style={styles.tileGrid}>
              {summary.todayClasses.slice(0, 4).map((c, idx) => {
                const isWarningStatus = c.status === 'Attendance Pending';
                const chipText = isWarningStatus ? colors.warning : colors.primary;
                const chipBg = isWarningStatus
                  ? withAlpha(colors.warning, isDark ? 0.22 : 0.12)
                  : withAlpha(colors.primary, isDark ? 0.18 : 0.1);

                return (
                  <Animated.View
                    key={c.entryId}
                    entering={FadeInDown.delay(40 + idx * 25).duration(220)}
                    style={styles.tileItem}
                  >
                    <Card style={styles.tileCard}>
                      <View style={styles.classTileTop}>
                        <Text style={[styles.classTileTime, { color: colors.textMuted }]} numberOfLines={1}>
                          {c.timeLabel}
                        </Text>
                      </View>
                      <Text style={[styles.tileTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {c.subjectLabel}
                      </Text>
                      <Text style={[styles.tileSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {c.classLabel}
                        {c.roomLabel ? ` • ${c.roomLabel}` : ''}
                      </Text>

                      <View style={styles.classNotifierRow}>
                        <View style={[styles.miniChip, { backgroundColor: chipBg, borderColor: withAlpha(chipText, 0.35) }]}>
                          <Text style={[styles.miniChipText, { color: chipText }]} numberOfLines={1}>
                            {c.status}
                          </Text>
                        </View>
                      </View>

                      {c.status === 'Attendance Pending' && c.routeParams ? (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() =>
                            router.push({
                              pathname: '/(teacher)/attendance/mark',
                              params: c.routeParams,
                            } as any)
                          }
                          style={[
                            styles.miniCta,
                            {
                              backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1),
                              borderColor: withAlpha(colors.primary, 0.35),
                            },
                          ]}
                        >
                          <Ionicons name="checkbox-outline" size={16} color={colors.primary} />
                          <Text style={[styles.miniCtaText, { color: colors.primary }]} numberOfLines={1}>
                            Mark
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <Card style={styles.wideCard}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No classes today</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Your timetable has no active entries for today.</Text>
            </Card>
          )}
        </View>

        {/* Important Notices (Tiles) */}
        <View style={{ marginTop: 20 }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Important</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(TEACHER_ROUTES.NOTICES as any)}
              style={[styles.viewAllBtn, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05) }]}
            >
              <Text style={[styles.viewAllText, { color: colors.textPrimary }]}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {loading && !summary ? (
            <Card style={styles.wideCard}>
              <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                <LoadingIndicator color={colors.primary} size="small" />
              </View>
            </Card>
          ) : summary?.importantNotices?.length ? (
            <View style={styles.tileGrid}>
              {summary.importantNotices.slice(0, 2).map((n) => (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.9}
                  onPress={() => router.push(TEACHER_ROUTES.NOTICES as any)}
                  style={styles.tileItem}
                >
                  <Card style={styles.tileCard}>
                    <View style={styles.noticeTileTop}>
                      <View style={[styles.tileIconWrap, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.06) }]}>
                        <Ionicons name="megaphone-outline" size={20} color={colors.textPrimary} />
                      </View>
                      <View style={[styles.scopePill, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.12) }]}>
                        <Text style={[styles.scopePillText, { color: colors.primary }]} numberOfLines={1}>
                          {titleCaseScope(n.scope)}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.noticeTileTitle, { color: colors.textPrimary }]} numberOfLines={3}>
                      {n.title}
                    </Text>
                    <Text style={[styles.tileSub, { color: colors.textMuted }]} numberOfLines={1}>
                      Tap to open notices
                    </Text>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Card style={styles.wideCard}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No important notices</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Nothing urgent from exam cell/department/principal.</Text>
            </Card>
          )}
        </View>

        <View style={{ height: 10 }} />
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
  heroSpacer: {
    flex: 1,
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
  lastUpdated: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  alertStrip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  alertLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  alertCta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertCtaText: {
    fontSize: 13,
    fontWeight: '800',
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
  wideCard: {
    marginBottom: 12,
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
  classTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  classNotifierRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  classTileTime: {
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '900',
  },
  miniCta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
  },
  miniCtaText: {
    fontSize: 12,
    fontWeight: '900',
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
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 13,
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
