import React, { useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { AnimatedBackground, Card, LoadingIndicator, StatCard } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { useStudentDashboard } from '../../hooks/useStudentDashboard';
import { useAuthStore } from '../../store/authStore';

export default function StudentDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();
  const { summary, loading, refreshing, refresh } = useStudentDashboard();

  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const photoUrl = profile?.photo_url || '';

  const displayName = useMemo(() => {
    return summary?.studentName || profile?.full_name || 'Student';
  }, [summary?.studentName, profile?.full_name]);

  const firstName = useMemo(() => {
    const n = String(displayName || 'Student').trim();
    return n.split(/\s+/)[0] || 'Student';
  }, [displayName]);

  const attendanceTone = useMemo(() => {
    const status = summary?.attendanceSummary?.status;
    if (status === 'good') return { color: colors.success, bg: withAlpha(colors.success, isDark ? 0.18 : 0.12) };
    if (status === 'warning') return { color: colors.warning, bg: withAlpha(colors.warning, isDark ? 0.18 : 0.12) };
    if (status === 'critical') return { color: colors.error, bg: withAlpha(colors.error, isDark ? 0.18 : 0.12) };
    return { color: colors.primary, bg: withAlpha(colors.primary, isDark ? 0.18 : 0.12) };
  }, [summary?.attendanceSummary?.status, colors, isDark]);

  const handleRefresh = async () => {
    await refresh();
    setLastUpdatedAt(new Date());
  };

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  const formatRelative = (d: Date) => {
    const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    return `${h}h ago`;
  };

  const safePct = (n: number | undefined | null) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(100, v));
  };

  const SectionHeader: React.FC<{ title: string; actionText?: string; onPress?: () => void }> = ({
    title,
    actionText,
    onPress,
  }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {!!actionText && !!onPress && (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.sectionAction}>
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>{actionText}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const ActionTile: React.FC<{ icon: string; label: string; subtitle?: string; onPress: () => void }> = ({
    icon,
    label,
    subtitle,
    onPress,
  }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={{ flexBasis: '48%' }}>
      <Card animated={false} style={styles.actionTile}>
        <View style={[styles.actionIcon, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]} numberOfLines={1}>
            {label}
          </Text>
          {!!subtitle && (
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={withAlpha(colors.textPrimary, 0.4)} />
      </Card>
    </TouchableOpacity>
  );

  if (loading && !summary) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 }]}>
          <LoadingIndicator />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: insets.bottom + 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Overview / Hero */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <Card noPadding style={styles.heroCard}>
            <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
              <LinearGradient
                colors={[
                  withAlpha(colors.primary, isDark ? 0.22 : 0.18),
                  withAlpha(colors.secondary, isDark ? 0.18 : 0.14),
                  withAlpha(colors.background, 0),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>

            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroLeft}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
                  ) : (
                    <View style={[styles.profilePhoto, { backgroundColor: colors.primary }]}>
                      <Ionicons name="person" size={22} color={colors.background} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.heroKicker, { color: colors.textSecondary }]}>Have a good day!</Text>
                    <Text style={[styles.heroName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {firstName}
                    </Text>
                    <View style={styles.heroMetaRow}>
                      {!!summary?.studentRollNumber && (
                        <View style={[styles.metaPill, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.08) }]}>
                          <Ionicons name="id-card" size={14} color={withAlpha(colors.textPrimary, 0.7)} />
                          <Text style={[styles.metaPillText, { color: colors.textPrimary }]} numberOfLines={1}>
                            {summary.studentRollNumber}
                          </Text>
                        </View>
                      )}
                      {!!summary?.departmentName && (
                        <View style={[styles.metaPill, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.1 : 0.08) }]}>
                          <Ionicons name="school" size={14} color={withAlpha(colors.textPrimary, 0.7)} />
                          <Text style={[styles.metaPillText, { color: colors.textPrimary }]} numberOfLines={1}>
                            {summary.departmentName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.heroIconRow}>
                  <TouchableOpacity
                    onPress={() => handleNavigate('/(student)/notices')}
                    activeOpacity={0.85}
                    style={[styles.heroIconButton, { backgroundColor: withAlpha(colors.background, isDark ? 0.18 : 0.45) }]}
                  >
                    <Ionicons name="notifications" size={18} color={colors.textPrimary} />
                    {!!summary?.unreadNoticesCount && summary.unreadNoticesCount > 0 && (
                      <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleNavigate('/(student)/profile')}
                    activeOpacity={0.85}
                    style={[styles.heroIconButton, { backgroundColor: withAlpha(colors.background, isDark ? 0.18 : 0.45) }]}
                  >
                    <Ionicons name="settings" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.heroStatsRow}>
                <StatCard
                  title="Attendance"
                  value={`${safePct(summary?.attendanceSummary?.percentage).toFixed(0)}%`}
                  icon={{ family: 'ion', name: 'checkmark-circle' }}
                  tone={summary?.attendanceSummary?.status === 'good' ? 'success' : summary?.attendanceSummary?.status === 'warning' ? 'warning' : summary?.attendanceSummary?.status === 'critical' ? 'error' : 'primary'}
                  onPress={() => handleNavigate('/(student)/attendance')}
                  style={styles.statCard}
                />
                <StatCard
                  title="Marks"
                  value={summary?.marksSnapshot ? `${safePct(summary.marksSnapshot.percentage).toFixed(0)}%` : '—'}
                  icon={{ family: 'ion', name: 'stats-chart' }}
                  tone="info"
                  onPress={() => handleNavigate('/(student)/marks')}
                  style={styles.statCard}
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Next class + month attendance */}
        <Animated.View entering={FadeInDown.delay(170).duration(450)} style={{ marginTop: 14 }}>
          <Card>
            <View style={styles.overviewRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewTitle, { color: colors.textPrimary }]}>Today Overview</Text>
                <Text style={[styles.overviewSubtitle, { color: colors.textSecondary }]}>
                  {summary?.nextClass
                    ? `Next: ${summary.nextClass.courseName} · ${summary.nextClass.startsInMinutes} min`
                    : 'No upcoming class right now'}
                </Text>
              </View>
              <View style={[styles.overviewChip, { backgroundColor: attendanceTone.bg }]}
              >
                <Text style={[styles.overviewChipValue, { color: attendanceTone.color }]}>
                  {safePct(summary?.attendanceSummary?.percentage).toFixed(0)}%
                </Text>
                <Text style={[styles.overviewChipLabel, { color: withAlpha(attendanceTone.color, 0.85) }]}>
                  This month
                </Text>
              </View>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08) }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${safePct(summary?.attendanceSummary?.percentage)}%`,
                    backgroundColor: attendanceTone.color,
                  },
                ]}
              />
            </View>

            <View style={styles.overviewFooterRow}>
              <View style={styles.overviewFooterItem}>
                <Text style={[styles.overviewFooterValue, { color: colors.textPrimary }]}>
                  {summary?.attendanceSummary ? summary.attendanceSummary.present : '—'}
                </Text>
                <Text style={[styles.overviewFooterLabel, { color: colors.textSecondary }]}>Present</Text>
              </View>
              <View style={[styles.overviewFooterDivider, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.14 : 0.1) }]} />
              <View style={styles.overviewFooterItem}>
                <Text style={[styles.overviewFooterValue, { color: colors.textPrimary }]}>
                  {summary?.attendanceSummary ? summary.attendanceSummary.total : '—'}
                </Text>
                <Text style={[styles.overviewFooterLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
              <View style={[styles.overviewFooterDivider, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.14 : 0.1) }]} />
              <View style={styles.overviewFooterItem}>
                <Text style={[styles.overviewFooterValue, { color: colors.textPrimary }]}>
                  {summary ? summary.unreadNoticesCount : '—'}
                </Text>
                <Text style={[styles.overviewFooterLabel, { color: colors.textSecondary }]}>Unread</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Today's classes */}
        <Animated.View entering={FadeInDown.delay(240).duration(450)} style={{ marginTop: 16 }}>
          <SectionHeader
            title="Today's Schedule"
            actionText="View all"
            onPress={() => handleNavigate('/(student)/timetable')}
          />
          <Card>
            {summary?.todayTimetable && summary.todayTimetable.length > 0 ? (
              <>
                {summary.todayTimetable.slice(0, 4).map((entry, index) => (
                  <View
                    key={entry.entryId}
                    style={[
                      styles.scheduleRow,
                      index < Math.min(3, summary.todayTimetable.length - 1) && {
                        borderBottomWidth: 1,
                        borderBottomColor: withAlpha(colors.textPrimary, isDark ? 0.14 : 0.1),
                      },
                    ]}
                  >
                    <View style={[styles.scheduleTime, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}>
                      <Text style={[styles.scheduleTimeText, { color: colors.primary }]}>
                        {String(entry.startTime || '').slice(0, 5)}
                      </Text>
                      <Text style={[styles.scheduleTimeSub, { color: withAlpha(colors.textPrimary, 0.55) }]}>
                        P{entry.period}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scheduleTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {entry.courseName}
                      </Text>
                      <Text style={[styles.scheduleSub, { color: colors.textSecondary }]} numberOfLines={1}>
                        {String(entry.endTime || '').slice(0, 5)} · {entry.roomLabel || 'Room TBA'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={withAlpha(colors.textPrimary, 0.4)} />
                  </View>
                ))}
              </>
            ) : (
              <View style={{ paddingVertical: 10 }}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classes scheduled for today.</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Spotlight cards */}
        <Animated.View entering={FadeInDown.delay(310).duration(450)} style={{ marginTop: 16 }}>
          <SectionHeader title="Highlights" />
          <View style={styles.twoColRow}>
            <TouchableOpacity onPress={() => handleNavigate('/(student)/attendance')} activeOpacity={0.85} style={{ flex: 1 }}>
              <Card animated={false} style={styles.halfCard}>
                <Text style={[styles.halfTitle, { color: colors.textSecondary }]}>Attendance</Text>
                <Text style={[styles.halfValue, { color: attendanceTone.color }]}>
                  {safePct(summary?.attendanceSummary?.percentage).toFixed(0)}%
                </Text>
                <Text style={[styles.halfSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {summary?.attendanceSummary
                    ? `${summary.attendanceSummary.present}/${summary.attendanceSummary.total} present`
                    : '—'}
                </Text>
                <View style={[styles.miniTrack, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08) }]}>
                  <View
                    style={{
                      height: '100%',
                      width: `${safePct(summary?.attendanceSummary?.percentage)}%`,
                      borderRadius: 999,
                      backgroundColor: attendanceTone.color,
                    }}
                  />
                </View>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleNavigate('/(student)/marks')} activeOpacity={0.85} style={{ flex: 1 }}>
              <Card animated={false} style={styles.halfCard}>
                <Text style={[styles.halfTitle, { color: colors.textSecondary }]}>Marks</Text>
                <Text style={[styles.halfValue, { color: colors.primary }]}>
                  {summary?.marksSnapshot ? `${safePct(summary.marksSnapshot.percentage).toFixed(0)}%` : '—'}
                </Text>
                <Text style={[styles.halfSub, { color: colors.textMuted }]} numberOfLines={1}>
                  {summary?.marksSnapshot
                    ? `${summary.marksSnapshot.obtainedMarks}/${summary.marksSnapshot.totalMarks} · ${summary.marksSnapshot.lastUpdated}`
                    : 'No marks published yet'}
                </Text>
                <View style={[styles.miniTrack, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08) }]}>
                  <View
                    style={{
                      height: '100%',
                      width: `${safePct(summary?.marksSnapshot?.percentage)}%`,
                      borderRadius: 999,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Upcoming Assignments */}
        {summary?.upcomingAssignments && summary.upcomingAssignments.length > 0 && (
          <Animated.View entering={FadeInDown.delay(380).duration(450)} style={{ marginTop: 16 }}>
            <SectionHeader
              title="Pending Tasks"
              actionText="View all"
              onPress={() => handleNavigate('/(student)/assignments')}
            />
            <Card>
              {summary.upcomingAssignments.slice(0, 3).map((assignment, index) => {
                const toneColor = assignment.isOverdue
                  ? colors.error
                  : assignment.daysLeft <= 3
                  ? colors.warning
                  : colors.success;
                return (
                  <TouchableOpacity
                    key={assignment.id}
                    onPress={() => handleNavigate('/(student)/assignments')}
                    activeOpacity={0.85}
                    style={[
                      styles.taskRow,
                      index < Math.min(2, summary.upcomingAssignments.length - 1) && {
                        borderBottomWidth: 1,
                        borderBottomColor: withAlpha(colors.textPrimary, isDark ? 0.14 : 0.1),
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskCourse, { color: colors.textSecondary }]} numberOfLines={1}>
                        {assignment.courseName}
                      </Text>
                      <Text style={[styles.taskTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {assignment.title}
                      </Text>
                      <Text style={[styles.taskSub, { color: colors.textMuted }]} numberOfLines={1}>
                        Due {assignment.dueDate}
                      </Text>
                    </View>
                    <View style={[styles.taskChip, { backgroundColor: withAlpha(toneColor, isDark ? 0.18 : 0.12) }]}>
                      <Text style={[styles.taskChipText, { color: toneColor }]}>
                        {assignment.isOverdue ? 'Overdue' : `${assignment.daysLeft}d`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </Animated.View>
        )}

        {/* Quick access */}
        <Animated.View entering={FadeInDown.delay(450).duration(450)} style={{ marginTop: 16 }}>
          <SectionHeader title="Quick Access" />
          <View style={styles.actionsGrid}>
            <ActionTile
              icon="calendar"
              label="Timetable"
              subtitle={summary?.todayTimetable?.length ? `${summary.todayTimetable.length} periods today` : 'View schedule'}
              onPress={() => handleNavigate('/(student)/timetable')}
            />
            <ActionTile
              icon="clipboard"
              label="Assignments"
              subtitle={summary?.upcomingAssignments?.length ? `${summary.upcomingAssignments.length} upcoming` : 'View tasks'}
              onPress={() => handleNavigate('/(student)/assignments')}
            />
            <ActionTile
              icon="book"
              label="Materials"
              subtitle="Notes & downloads"
              onPress={() => handleNavigate('/(student)/materials')}
            />
            <ActionTile
              icon="notifications"
              label="Notices"
              subtitle={summary ? `${summary.unreadNoticesCount} unread` : 'Updates'}
              onPress={() => handleNavigate('/(student)/notices')}
            />
            <ActionTile
              icon="restaurant"
              label="Canteen"
              subtitle={
                summary
                  ? summary.canteenMenuCount > 0
                    ? `${summary.canteenMenuCount} items today${summary.myCanteenTokensCount ? ` · ${summary.myCanteenTokensCount} token(s)` : ''}`
                    : 'No menu today'
                  : 'Menu & tokens'
              }
              onPress={() => handleNavigate('/(student)/canteen')}
            />
            <ActionTile
              icon="bus"
              label="Bus"
              subtitle={
                summary
                  ? summary.busSubscriptionStatus === 'none'
                    ? 'No subscription'
                    : `${summary.busSubscriptionStatus.toUpperCase()}${summary.busRouteLabel ? ` · ${summary.busRouteLabel}` : ''}`
                  : 'Route & status'
              }
              onPress={() => handleNavigate('/(student)/bus')}
            />
            <ActionTile
              icon="library"
              label="Library"
              subtitle={
                summary
                  ? `${summary.libraryActiveIssuesCount} active${summary.libraryFineDue > 0 ? ` · ₹${Math.round(summary.libraryFineDue)}` : ''}`
                  : 'Books & issues'
              }
              onPress={() => handleNavigate('/(student)/library')}
            />
            <ActionTile
              icon="grid"
              label="All Modules"
              subtitle="Browse everything"
              onPress={() => handleNavigate('/(student)/modules')}
            />
          </View>
        </Animated.View>

        {/* Last Updated */}
        {lastUpdatedAt && (
          <View style={styles.lastUpdatedContainer}>
            <Text style={[styles.lastUpdatedText, { color: colors.textMuted }]}>
              Updated {formatRelative(lastUpdatedAt)}
            </Text>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroInner: {
    padding: 18,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  profilePhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  heroIconRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },

  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  overviewSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  overviewChip: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  overviewChipValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  overviewChipLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  overviewFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  overviewFooterItem: {
    flex: 1,
    alignItems: 'center',
  },
  overviewFooterDivider: {
    width: 1,
    height: 28,
  },
  overviewFooterValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  overviewFooterLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  scheduleTime: {
    width: 64,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTimeText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  scheduleTimeSub: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  scheduleSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },

  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    minHeight: 126,
  },
  halfTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  halfValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 8,
  },
  halfSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  miniTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  taskCourse: {
    fontSize: 12,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.1,
    marginTop: 3,
  },
  taskSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  taskChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  taskChipText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionTile: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: -0.1,
  },
  actionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },

  lastUpdatedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  lastUpdatedText: {
    fontSize: 12,
  },
});
