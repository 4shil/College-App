import React, { useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../components/ui';
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
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const photoUrl = profile?.photo_url || '';

  const handleRefresh = async () => {
    await refresh();
    setLastUpdatedAt(new Date());
  };

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

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
        style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroSection}>
          <Card>
            <View style={styles.heroContent}>
              <View style={styles.heroLeft}>
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <View style={[styles.profilePhoto, { backgroundColor: colors.primary }]}>
                    <Ionicons name="person" size={32} color={colors.background} />
                  </View>
                )}
                <View style={styles.heroTextContent}>
                  <Text style={[styles.heroName, { color: colors.textPrimary }]}>
                    {summary?.studentName || profile?.full_name || 'Student'}
                  </Text>
                  <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                    {summary?.studentRollNumber}
                  </Text>
                  <Text style={[styles.heroDept, { color: colors.textMuted }]}>
                    {summary?.departmentName}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleNavigate('/(student)/profile')}
                style={[styles.editButton, { borderColor: colors.primary }]}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Today's Classes */}
        {summary?.todayTimetable && summary.todayTimetable.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Today's Schedule
            </Text>
            <Card>
              {summary.todayTimetable.slice(0, 3).map((entry, index) => (
                <View key={entry.entryId} style={[styles.timetableEntry, { borderBottomColor: colors.border }, index < 2 && { borderBottomWidth: 1 }]}>
                  <View style={styles.periodBadge}>
                    <Text style={[styles.periodText, { color: colors.background }]}>
                      P{entry.period}
                    </Text>
                  </View>
                  <View style={styles.timetableInfo}>
                    <Text style={[styles.courseNameSmall, { color: colors.textPrimary }]}>
                      {entry.courseName}
                    </Text>
                    <Text style={[styles.courseDetails, { color: colors.textSecondary }]}>
                      {entry.timeLabel} • {entry.roomLabel || 'Room TBA'}
                    </Text>
                  </View>
                </View>
              ))}
              {summary.todayTimetable.length > 3 && (
                <TouchableOpacity
                  onPress={() => handleNavigate('/(student)/timetable')}
                  style={styles.viewMoreLink}
                >
                  <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                    View Full Schedule →
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Attendance Summary */}
        {summary?.attendanceSummary && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Attendance
            </Text>
            <TouchableOpacity onPress={() => handleNavigate('/(student)/attendance')} activeOpacity={0.8}>
              <Card>
                <View style={styles.attendanceContent}>
                  <View style={styles.attendanceCircle}>
                    <Text style={[styles.attendancePercentage, { color: colors.primary }]}>
                      {summary.attendanceSummary.percentage}%
                    </Text>
                  </View>
                  <View style={styles.attendanceStats}>
                    <Text style={[styles.attendanceLabel, { color: colors.textPrimary }]}>
                      Attendance Status
                    </Text>
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.primary }]}>
                          {summary.attendanceSummary.present}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Present
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textMuted }]}>
                          {summary.attendanceSummary.total - summary.attendanceSummary.present}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Absent
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textMuted }]}>
                          {summary.attendanceSummary.total}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          Total
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Internal Marks Preview */}
        {summary?.marksSnapshot && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Latest Marks
            </Text>
            <TouchableOpacity onPress={() => handleNavigate('/(student)/marks')} activeOpacity={0.8}>
              <Card>
                <View style={styles.marksContent}>
                  <View style={styles.marksLeft}>
                    <Text style={[styles.marksValue, { color: colors.primary }]}>
                      {summary.marksSnapshot.percentage.toFixed(1)}%
                    </Text>
                    <Text style={[styles.marksLabel, { color: colors.textSecondary }]}>
                      {summary.marksSnapshot.obtainedMarks}/{summary.marksSnapshot.totalMarks}
                    </Text>
                  </View>
                  <View style={[styles.marksRight, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                    <Ionicons name="bar-chart" size={24} color={colors.primary} />
                    <Text style={[styles.marksUpdate, { color: colors.textSecondary }]}>
                      Updated
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Upcoming Assignments */}
        {summary?.upcomingAssignments && summary.upcomingAssignments.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Pending Tasks
            </Text>
            <Card>
              {summary.upcomingAssignments.slice(0, 3).map((assignment, index) => (
                <TouchableOpacity
                  key={assignment.id}
                  onPress={() => handleNavigate(`/(student)/assignments`)}
                  style={[styles.assignmentItem, { borderBottomColor: colors.border }, index < 2 && { borderBottomWidth: 1 }]}
                >
                  <View style={styles.assignmentLeft}>
                    <Text style={[styles.assignmentCourse, { color: colors.textSecondary }]}>
                      {assignment.courseName}
                    </Text>
                    <Text style={[styles.assignmentTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {assignment.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.assignmentDueTag,
                      {
                        backgroundColor: assignment.isOverdue
                          ? withAlpha(colors.danger || '#ff4444', 0.1)
                          : assignment.daysLeft <= 3
                          ? withAlpha(colors.warning || '#ffaa00', 0.1)
                          : withAlpha(colors.success || '#44ff44', 0.1),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dueTagText,
                        {
                          color: assignment.isOverdue
                            ? colors.danger || '#ff4444'
                            : assignment.daysLeft <= 3
                            ? colors.warning || '#ffaa00'
                            : colors.success || '#44ff44',
                        },
                      ]}
                    >
                      {assignment.isOverdue ? 'Overdue' : `${assignment.daysLeft}d`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {summary.upcomingAssignments.length > 3 && (
                <TouchableOpacity
                  onPress={() => handleNavigate('/(student)/assignments')}
                  style={styles.viewMoreLink}
                >
                  <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                    View All Tasks ({summary.upcomingAssignments.length}) →
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Quick Links */}
        <Animated.View entering={FadeInDown.delay(600).duration(500)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
            Quick Access
          </Text>
          <View style={styles.quickLinksGrid}>
            {[
              { icon: 'document-text', label: 'Materials', route: '/(student)/materials' },
              { icon: 'library', label: 'Library', route: '/(student)/library' },
              { icon: 'restaurant', label: 'Canteen', route: '/(student)/canteen' },
              { icon: 'bus', label: 'Bus', route: '/(student)/bus' },
              { icon: 'receipt', label: 'Fees', route: '/(student)/fees' },
              { icon: 'settings', label: 'Settings', route: '/(student)/settings' },
            ].map((link) => (
              <TouchableOpacity
                key={link.label}
                onPress={() => handleNavigate(link.route)}
                activeOpacity={0.7}
              >
                <Card style={styles.quickLinkCard}>
                  <View style={[styles.quickLinkIcon, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                    <Ionicons name={link.icon as any} size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.quickLinkLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                    {link.label}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Last Updated */}
        {lastUpdatedAt && (
          <View style={styles.lastUpdatedContainer}>
            <Text style={[styles.lastUpdatedText, { color: colors.textMuted }]}>
              Updated {Math.round((Date.now() - lastUpdatedAt.getTime()) / 1000)}s ago
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
  heroSection: {
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContent: {
    flex: 1,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  heroDept: {
    fontSize: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  timetableEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  periodBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timetableInfo: {
    flex: 1,
  },
  courseNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseDetails: {
    fontSize: 12,
  },
  viewMoreLink: {
    paddingVertical: 12,
    justifyContent: 'center',
  },
  viewMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  attendanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f3f4f6',
  },
  attendancePercentage: {
    fontSize: 32,
    fontWeight: '700',
  },
  attendanceStats: {
    flex: 1,
  },
  attendanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  marksContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marksLeft: {
    flex: 1,
  },
  marksValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  marksLabel: {
    fontSize: 13,
  },
  marksRight: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marksUpdate: {
    fontSize: 11,
    marginTop: 4,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  assignmentLeft: {
    flex: 1,
  },
  assignmentCourse: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  assignmentTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  assignmentDueTag: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 12,
  },
  dueTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLinkCard: {
    width: '31%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  lastUpdatedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  lastUpdatedText: {
    fontSize: 12,
  },
});

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
