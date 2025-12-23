import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface SubstitutionStats {
  totalThisMonth: number;
  totalThisWeek: number;
  totalToday: number;
  mostSubstituted: {
    teacher_name: string;
    count: number;
  } | null;
  topSubstitute: {
    teacher_name: string;
    count: number;
  } | null;
  byDepartment: {
    department_name: string;
    count: number;
  }[];
  recentSubstitutions: {
    id: string;
    date: string;
    period: number;
    original_teacher: string;
    substitute_teacher: string;
    reason: string | null;
    course_name: string | null;
  }[];
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SubstitutionStats>({
    totalThisMonth: 0,
    totalThisWeek: 0,
    totalToday: 0,
    mostSubstituted: null,
    topSubstitute: null,
    byDepartment: [],
    recentSubstitutions: [],
  });

  const fetchStats = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get start of week (Monday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);
      const weekStart = startOfWeek.toISOString().split('T')[0];
      
      // Get start of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStart = startOfMonth.toISOString().split('T')[0];

      // Fetch all substitutions for this month
      const { data: substitutions, error } = await supabase
        .from('substitutions')
        .select(`
          id,
          date,
          period,
          reason,
          original_teacher:teachers!substitutions_original_teacher_id_fkey(
            id,
            profiles(full_name),
            departments(name)
          ),
          substitute_teacher:teachers!substitutions_substitute_teacher_id_fkey(
            id,
            profiles(full_name)
          ),
          timetable_entries(
            courses(name, short_name)
          )
        `)
        .gte('date', monthStart)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching substitutions:', error);
        return;
      }

      const subs = substitutions || [];
      
      // Calculate counts
      const totalThisMonth = subs.length;
      const totalThisWeek = (subs as Array<any>).filter(s => s.date >= weekStart).length;
      const totalToday = (subs as Array<any>).filter(s => s.date === todayStr).length;

      // Calculate most substituted teacher
      const substitutedCounts: Record<string, { name: string; count: number }> = {};
      (subs as Array<any>).forEach(s => {
        const teacherId = (s.original_teacher as any)?.id;
        const teacherName = (s.original_teacher as any)?.profiles?.full_name || 'Unknown';
        if (teacherId) {
          if (!substitutedCounts[teacherId]) {
            substitutedCounts[teacherId] = { name: teacherName, count: 0 };
          }
          substitutedCounts[teacherId].count++;
        }
      });

      const mostSubstituted = Object.values(substitutedCounts)
        .sort((a, b) => b.count - a.count)[0] || null;

      // Calculate top substitute
      const substituteCounts: Record<string, { name: string; count: number }> = {};
      (subs as Array<any>).forEach(s => {
        const teacherId = (s.substitute_teacher as any)?.id;
        const teacherName = (s.substitute_teacher as any)?.profiles?.full_name || 'Unknown';
        if (teacherId) {
          if (!substituteCounts[teacherId]) {
            substituteCounts[teacherId] = { name: teacherName, count: 0 };
          }
          substituteCounts[teacherId].count++;
        }
      });

      const topSubstitute = Object.values(substituteCounts)
        .sort((a, b) => b.count - a.count)[0] || null;

      // Calculate by department
      const deptCounts: Record<string, { name: string; count: number }> = {};
      (subs as Array<any>).forEach(s => {
        const deptName = (s.original_teacher as any)?.departments?.name || 'Unknown';
        if (!deptCounts[deptName]) {
          deptCounts[deptName] = { name: deptName, count: 0 };
        }
        deptCounts[deptName].count++;
      });

      const byDepartment = Object.values(deptCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(d => ({ department_name: d.name, count: d.count }));

      // Recent substitutions
      const recentSubstitutions = (subs as Array<any>).slice(0, 10).map(s => ({
        id: s.id,
        date: s.date,
        period: s.period,
        original_teacher: (s.original_teacher as any)?.profiles?.full_name || 'Unknown',
        substitute_teacher: (s.substitute_teacher as any)?.profiles?.full_name || 'Unknown',
        reason: s.reason,
        course_name: (s.timetable_entries as any)?.courses?.short_name || null,
      }));

      setStats({
        totalThisMonth,
        totalThisWeek,
        totalToday,
        mostSubstituted: mostSubstituted ? { teacher_name: mostSubstituted.name, count: mostSubstituted.count } : null,
        topSubstitute: topSubstitute ? { teacher_name: topSubstitute.name, count: topSubstitute.count } : null,
        byDepartment,
        recentSubstitutions,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
    
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Reports</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Substitution analytics
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading reports...</Text>
            </View>
          ) : (
            <>
              {/* Summary Cards */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.summaryRow}>
                <View
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Text style={[styles.summaryValue, { color: colors.warning }]}>{stats.totalToday}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Today</Text>
                </View>
                <View
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Text style={[styles.summaryValue, { color: colors.info }]}>{stats.totalThisWeek}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>This Week</Text>
                </View>
                <View
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Text style={[styles.summaryValue, { color: colors.success }]}>{stats.totalThisMonth}</Text>
                  <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>This Month</Text>
                </View>
              </Animated.View>

              {/* Top Teachers */}
              <Animated.View entering={FadeInRight.delay(200).duration(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Teacher Insights</Text>
                
                <View style={styles.insightRow}>
                  <View style={[
                    styles.insightCard, 
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      borderWidth: colors.borderWidth,
                    }
                  ]}>
                    <View style={styles.insightIcon}>
                      <FontAwesome5 name="user-minus" size={18} color={colors.error} />
                    </View>
                    <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Most Substituted</Text>
                    <Text style={[styles.insightValue, { color: colors.textPrimary }]} numberOfLines={1}>
                      {stats.mostSubstituted?.teacher_name || '-'}
                    </Text>
                    {stats.mostSubstituted && (
                      <Text style={[styles.insightCount, { color: colors.error }]}>
                        {stats.mostSubstituted.count} times
                      </Text>
                    )}
                  </View>

                  <View style={[
                    styles.insightCard, 
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      borderWidth: colors.borderWidth,
                    }
                  ]}>
                    <View style={styles.insightIcon}>
                      <FontAwesome5 name="user-plus" size={18} color={colors.success} />
                    </View>
                    <Text style={[styles.insightLabel, { color: colors.textMuted }]}>Top Substitute</Text>
                    <Text style={[styles.insightValue, { color: colors.textPrimary }]} numberOfLines={1}>
                      {stats.topSubstitute?.teacher_name || '-'}
                    </Text>
                    {stats.topSubstitute && (
                      <Text style={[styles.insightCount, { color: colors.success }]}>
                        {stats.topSubstitute.count} times
                      </Text>
                    )}
                  </View>
                </View>
              </Animated.View>

              {/* By Department */}
              {stats.byDepartment.length > 0 && (
                <Animated.View entering={FadeInRight.delay(250).duration(400)} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>By Department</Text>
                  
                  <View style={[
                    styles.chartCard, 
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                      borderWidth: colors.borderWidth,
                    }
                  ]}>
                    {stats.byDepartment.map((dept, index) => {
                      const maxCount = stats.byDepartment[0]?.count || 1;
                      const percentage = (dept.count / maxCount) * 100;
                      
                      return (
                        <View key={dept.department_name} style={styles.barItem}>
                          <View style={styles.barLabel}>
                            <Text style={[styles.barLabelText, { color: colors.textPrimary }]} numberOfLines={1}>
                              {dept.department_name}
                            </Text>
                            <Text style={[styles.barCount, { color: colors.textMuted }]}>
                              {dept.count}
                            </Text>
                          </View>
                          <View style={[styles.barTrack, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.05 : 0.05) }]}>
                            <View 
                              style={[
                                styles.barFill, 
                                { 
                                  width: `${percentage}%`,
                                  backgroundColor: index === 0 ? colors.warning : colors.info,
                                }
                              ]} 
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* Recent Substitutions */}
              <Animated.View entering={FadeInRight.delay(300).duration(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
                
                {stats.recentSubstitutions.length === 0 ? (
                  <View style={styles.emptyState}>
                    <FontAwesome5 name="chart-line" size={40} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      No substitution data available
                    </Text>
                  </View>
                ) : (
                  stats.recentSubstitutions.map((sub, index) => (
                    <Animated.View
                      key={sub.id}
                      entering={FadeInDown.delay(350 + index * 30).duration(300)}
                      style={[
                        styles.activityCard,
                        { 
                          backgroundColor: colors.cardBackground,
                          borderColor: colors.cardBorder,
                          borderWidth: colors.borderWidth,
                        }
                      ]}
                    >
                      <View style={styles.activityHeader}>
                        <View style={[styles.dateBadge, { backgroundColor: withAlpha(colors.primary, 0.08) }]}>
                          <Text style={[styles.dateBadgeText, { color: colors.primary }]}>
                            {formatDate(sub.date)}
                          </Text>
                        </View>
                        <Text style={[styles.periodBadge, { color: colors.textMuted }]}>
                          Period {sub.period}
                        </Text>
                        {sub.course_name && (
                          <Text style={[styles.courseBadge, { color: colors.primary }]}>
                            {sub.course_name}
                          </Text>
                        )}
                      </View>
                      <View style={styles.activityBody}>
                        <Text style={[styles.teacherSwap, { color: colors.textPrimary }]}>
                          <Text style={{ color: colors.error }}>{sub.original_teacher}</Text>
                          {'  →  '}
                          <Text style={{ color: colors.success }}>{sub.substitute_teacher}</Text>
                        </Text>
                        {sub.reason && (
                          <Text style={[styles.reasonText, { color: colors.textMuted }]} numberOfLines={1}>
                            {sub.reason}
                          </Text>
                        )}
                      </View>
                    </Animated.View>
                  ))
                )}
              </Animated.View>
            </>
          )}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16 
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  // Insight Cards
  insightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  insightIcon: {
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  insightCount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  // Chart Card
  chartCard: {
    padding: 16,
    borderRadius: 14,
  },
  barItem: {
    marginBottom: 12,
  },
  barLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabelText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  barCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Activity Cards
  activityCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  periodBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  courseBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  activityBody: {},
  teacherSwap: {
    fontSize: 14,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});
