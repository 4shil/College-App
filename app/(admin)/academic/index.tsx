import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { IconBadge } from '../../../components/ui/IconBadge';
import { supabase } from '../../../lib/supabase';

interface MenuOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  count?: number;
}

export default function AcademicIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [counts, setCounts] = useState({
    departments: 0,
    courses: 0,
    subjects: 0,
    years: 0,
    semesters: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const [depts, courses, subjects, years, semesters] = await Promise.all([
        supabase.from('departments').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true).not('program_type', 'is', null),
        supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('years').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('semesters').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setCounts({
        departments: depts.count || 0,
        courses: courses.count || 0,
        subjects: subjects.count || 0,
        years: years.count || 0,
        semesters: semesters.count || 0,
      });
    } catch (error) {
      console.error('Error fetching academic counts:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCounts();
      setLoading(false);
    };
    loadData();
  }, [fetchCounts]);

  useEffect(() => {
    // Real-time updates when any academic table changes
    const channels = [
      supabase.channel('academic-depts').on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, fetchCounts).subscribe(),
      supabase.channel('academic-courses').on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, fetchCounts).subscribe(),
      supabase.channel('academic-subjects').on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, fetchCounts).subscribe(),
      supabase.channel('academic-years').on('postgres_changes', { event: '*', schema: 'public', table: 'years' }, fetchCounts).subscribe(),
      supabase.channel('academic-semesters').on('postgres_changes', { event: '*', schema: 'public', table: 'semesters' }, fetchCounts).subscribe(),
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchCounts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCounts();
    setRefreshing(false);
  };

  const menuOptions: MenuOption[] = [
    {
      id: 'departments',
      title: 'Departments',
      subtitle: 'Manage academic departments',
      icon: 'building',
      route: '/(admin)/academic/departments',
      count: counts.departments,
    },
    {
      id: 'courses',
      title: 'Courses',
      subtitle: 'Degree programs and specializations',
      icon: 'graduation-cap',
      route: '/(admin)/academic/courses',
      count: counts.courses,
    },
    {
      id: 'subjects',
      title: 'Subjects',
      subtitle: 'Course subjects and curriculum',
      icon: 'book',
      route: '/(admin)/academic/subjects',
      count: counts.subjects,
    },
    {
      id: 'years',
      title: 'Years & Sections',
      subtitle: 'Academic years and class sections',
      icon: 'layer-group',
      route: '/(admin)/academic/years',
      count: counts.years,
    },
    {
      id: 'batches',
      title: 'Batches',
      subtitle: 'Student batch management',
      icon: 'users-cog',
      route: '/(admin)/academic/batches',
    },
    {
      id: 'semesters',
      title: 'Semesters',
      subtitle: 'Academic terms and schedules',
      icon: 'calendar-alt',
      route: '/(admin)/academic/semesters',
      count: counts.semesters,
    },
  ];

  const renderMenuCard = (option: MenuOption, index: number) => (
    <Animated.View
      key={option.id}
      entering={FadeInRight.delay(100 + index * 80).duration(350)}
      style={styles.menuCardWrapper}
    >
      <TouchableOpacity
        onPress={() => router.push(option.route as any)}
        activeOpacity={0.8}
      >
        <Card style={styles.menuCard}>
          <View style={styles.menuCardContent}>
            <IconBadge family="fa5" name={option.icon} tone="primary" size={22} style={styles.iconContainer} />
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                {option.title}
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                {option.subtitle}
              </Text>
            </View>
            <View style={styles.menuArrow}>
              {option.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Text style={[styles.countText, { color: colors.textSecondary }]}>{option.count}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Academic Management
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage academic structure
            </Text>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsContainer}
        >
          <Card style={styles.statsCard}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <FontAwesome5 name="building" size={16} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{counts.departments}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Depts</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
                <View style={styles.statItem}>
                  <FontAwesome5 name="graduation-cap" size={16} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{counts.courses}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Courses</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
                <View style={styles.statItem}>
                  <FontAwesome5 name="book" size={16} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{counts.subjects}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Subjects</Text>
                </View>
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Menu Options */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {menuOptions.map((option, index) => renderMenuCard(option, index))}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statsCard: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuCardWrapper: {
    marginBottom: 12,
  },
  menuCard: {
    padding: 16,
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  menuArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    minWidth: 28,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
