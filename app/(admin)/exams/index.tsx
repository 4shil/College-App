import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface ExamStats {
  upcoming: number;
  ongoing: number;
  completed: number;
  pendingMarks: number;
}

export default function ExamsIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ExamStats>({
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    pendingMarks: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [upcoming, ongoing, completed] = await Promise.all([
        supabase.from('exams').select('id', { count: 'exact', head: true }).gt('start_date', today),
        supabase.from('exams').select('id', { count: 'exact', head: true }).lte('start_date', today).gte('end_date', today),
        supabase.from('exams').select('id', { count: 'exact', head: true }).lt('end_date', today),
      ]);

      setStats({
        upcoming: upcoming.count || 0,
        ongoing: ongoing.count || 0,
        completed: completed.count || 0,
        pendingMarks: 0, // Calculate from exam_marks
      });
    } catch (error) {
      console.error('Error fetching exam stats:', error);
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

  const menuOptions = [
    {
      title: 'Manage Exams',
      subtitle: 'Create and schedule exams',
      icon: 'file-alt',
      color: colors.primary,
      route: '/(admin)/exams/manage',
    },
    {
      title: 'Enter Marks',
      subtitle: 'Record student marks',
      icon: 'edit',
      color: colors.success,
      route: '/(admin)/exams/marks',
    },
    {
      title: 'External Marks',
      subtitle: 'Upload university results',
      icon: 'upload',
      color: colors.warning,
      route: '/(admin)/exams/external',
    },
    {
      title: 'Reports',
      subtitle: 'View results and analytics',
      icon: 'chart-bar',
      color: colors.info,
      route: '/(admin)/exams/reports',
    },
  ];

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Exam Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage exams, schedules and marks
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsGrid}>
          <View style={[styles.statCard, { 
            backgroundColor: isDark ? withAlpha(colors.primary, 0.082) : withAlpha(colors.primary, 0.063),
            borderColor: isDark ? withAlpha(colors.primary, 0.188) : withAlpha(colors.primary, 0.145),
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="clock" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.upcoming}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: isDark ? withAlpha(colors.success, 0.082) : withAlpha(colors.success, 0.063),
            borderColor: isDark ? withAlpha(colors.success, 0.188) : withAlpha(colors.success, 0.145),
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="play-circle" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.ongoing}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ongoing</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: isDark ? withAlpha(colors.info, 0.082) : withAlpha(colors.info, 0.063),
            borderColor: isDark ? withAlpha(colors.info, 0.188) : withAlpha(colors.info, 0.145),
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.info, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="check-circle" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: isDark ? withAlpha(colors.warning, 0.082) : withAlpha(colors.warning, 0.063),
            borderColor: isDark ? withAlpha(colors.warning, 0.188) : withAlpha(colors.warning, 0.145),
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="edit" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.pendingMarks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
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
                  backgroundColor: isDark ? withAlpha(colors.textInverse, 0.05) : withAlpha(colors.shadowColor, 0.02),
                  borderColor: isDark ? withAlpha(colors.textInverse, 0.1) : withAlpha(colors.shadowColor, 0.06),
                }]}>
                  <View style={[styles.menuIcon, { backgroundColor: withAlpha(option.color, 0.125) }]}>
                    <FontAwesome5 name={option.icon} size={24} color={option.color} />
                  </View>
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
    borderRadius: 18,
    borderWidth: 1.5,
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
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
    borderRadius: 18,
    borderWidth: 1.5,
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
