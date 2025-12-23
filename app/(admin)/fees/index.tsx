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

interface FeeStats {
  totalDue: number;
  totalCollected: number;
  pending: number;
  overdue: number;
}

export default function FeesIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<FeeStats>({
    totalDue: 0,
    totalCollected: 0,
    pending: 0,
    overdue: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const { count: pending } = await supabase
        .from('student_fees')
        .select('id', { count: 'exact', head: true })
        .eq('payment_status', 'pending');

      const { count: overdue } = await supabase
        .from('student_fees')
        .select('id', { count: 'exact', head: true })
        .eq('payment_status', 'overdue');

      setStats({
        totalDue: 0,
        totalCollected: 0,
        pending: pending || 0,
        overdue: overdue || 0,
      });
    } catch (error) {
      console.error('Error fetching fee stats:', error);
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
      case 'Defaulters':
        return 'error';
      case 'Record Payment':
        return 'success';
      case 'Reports':
        return 'info';
      default:
        return 'primary';
    }
  };

  const menuOptions = [
    {
      title: 'Fee Structures',
      subtitle: 'Manage fee categories',
      icon: 'list-alt',
      route: '/(admin)/fees/structures',
    },
    {
      title: 'Student Fees',
      subtitle: 'View and track payments',
      icon: 'users',
      route: '/(admin)/fees/students',
    },
    {
      title: 'Record Payment',
      subtitle: 'Add new payment',
      icon: 'rupee-sign',
      route: '/(admin)/fees/payment',
    },
    {
      title: 'Reports',
      subtitle: 'Fee collection reports',
      icon: 'chart-line',
      route: '/(admin)/fees/reports',
    },
    {
      title: 'Defaulters',
      subtitle: 'Overdue payments',
      icon: 'exclamation-triangle',
      route: '/(admin)/fees/defaulters',
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Fee Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track and manage student fees
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
              <FontAwesome5 name="rupee-sign" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.totalDue.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Due</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="check-circle" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.totalCollected.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Collected</Text>
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
    fontSize: 24,
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
