import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, LoadingIndicator } from '../../../components/ui';
import { IconBadge, type IconBadgeTone } from '../../../components/ui/IconBadge';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface AssignmentStats {
  active: number;
  pending: number;
  graded: number;
  overdue: number;
}

export default function AssignmentsIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AssignmentStats>({
    active: 0,
    pending: 0,
    graded: 0,
    overdue: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const now = new Date().toISOString();

      const [active, submissions] = await Promise.all([
        supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('is_active', true).gte('due_date', now),
        supabase.from('assignment_submissions').select('id, marks_obtained', { count: 'exact' }),
      ]);

      const pending = submissions.data?.filter((s: any) => s.marks_obtained === null).length || 0;
      const graded = submissions.data?.filter((s: any) => s.marks_obtained !== null).length || 0;

      setStats({
        active: active.count || 0,
        pending,
        graded,
        overdue: 0,
      });
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getOptionTone = (title: string): IconBadgeTone => {
    switch (title) {
      case 'Submissions':
        return 'success';
      case 'Grade Submissions':
        return 'warning';
      case 'Reports':
        return 'info';
      default:
        return 'primary';
    }
  };

  const menuOptions = [
    {
      title: 'Manage Assignments',
      subtitle: 'Create and edit assignments',
      icon: 'tasks',
      route: '/(admin)/assignments/manage',
    },
    {
      title: 'Submissions',
      subtitle: 'View student submissions',
      icon: 'file-alt',
      route: '/(admin)/assignments/submissions',
    },
    {
      title: 'Grade Submissions',
      subtitle: 'Review and grade work',
      icon: 'check-square',
      route: '/(admin)/assignments/grade',
    },
    {
      title: 'Reports',
      subtitle: 'Assignment analytics',
      icon: 'chart-bar',
      route: '/(admin)/assignments/reports',
    },
  ];

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <LoadingIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Assignments</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage assignments and submissions
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsGrid}>
          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="tasks" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.active}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="clock" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="check-circle" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.graded}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Graded</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.error, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="exclamation-triangle" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.overdue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
          </View>
        </Animated.View>

        {/* Menu Options */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.title}
              onPress={() => router.push(option.route as any)}
              activeOpacity={0.7}
            >
              <Animated.View entering={FadeInDown.delay(350 + index * 50).springify()}>
                <View style={[styles.menuCard, {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  borderWidth: colors.borderWidth,
                }]}>
                  <IconBadge
                    family="fa5"
                    name={option.icon}
                    tone={getOptionTone(option.title)}
                    size={24}
                    style={styles.menuIcon}
                  />
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{option.title}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </View>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  statCard: {
    width: '48%',
    padding: 18,
    marginBottom: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 0,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 0,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
  },
});
