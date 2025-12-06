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

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface ExamStats {
  upcoming: number;
  ongoing: number;
  completed: number;
  pendingMarks: number;
}

export default function ExamsIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

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
      color: '#6366f1',
      route: '/(admin)/exams/manage',
    },
    {
      title: 'Enter Marks',
      subtitle: 'Record student marks',
      icon: 'edit',
      color: '#10b981',
      route: '/(admin)/exams/marks',
    },
    {
      title: 'External Marks',
      subtitle: 'Upload university results',
      icon: 'upload',
      color: '#f59e0b',
      route: '/(admin)/exams/external',
    },
    {
      title: 'Reports',
      subtitle: 'View results and analytics',
      icon: 'chart-bar',
      color: '#8b5cf6',
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
          <Card style={[styles.statCard, { backgroundColor: `${colors.primary}15` }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
              <FontAwesome5 name="clock" size={20} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.upcoming}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: `${colors.success}15` }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
              <FontAwesome5 name="play-circle" size={20} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.ongoing}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ongoing</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: `${colors.info}15` }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.info }]}>
              <FontAwesome5 name="check-circle" size={20} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: `${colors.warning}15` }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
              <FontAwesome5 name="edit" size={20} color="#fff" />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.pendingMarks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </Card>
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
                <Card style={styles.menuCard}>
                  <View style={[styles.menuIcon, { backgroundColor: `${option.color}20` }]}>
                    <FontAwesome5 name={option.icon} size={24} color={option.color} />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{option.title}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </Card>
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
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
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
