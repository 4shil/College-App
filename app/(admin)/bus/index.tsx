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

interface BusStats {
  totalRoutes: number;
  activeVehicles: number;
  pendingApprovals: number;
  totalStudents: number;
}

export default function BusIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<BusStats>({
    totalRoutes: 0,
    activeVehicles: 0,
    pendingApprovals: 0,
    totalStudents: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [routes, approvals, subscriptions] = await Promise.all([
        supabase.from('bus_routes').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bus_subscriptions').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('bus_subscriptions').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved'),
      ]);

      setStats({
        totalRoutes: routes.count || 0,
        activeVehicles: routes.count || 0, // Assuming 1 vehicle per route
        pendingApprovals: approvals.count || 0,
        totalStudents: subscriptions.count || 0,
      });
    } catch (error) {
      console.error('Error fetching bus stats:', error);
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
      case 'Approvals':
        return 'warning';
      case 'Reports':
        return 'info';
      case 'Vehicle Management':
        return 'success';
      default:
        return 'primary';
    }
  };

  const menuOptions = [
    {
      title: 'Bus Routes',
      subtitle: 'Manage routes and stops',
      icon: 'route',
      route: '/(admin)/bus/routes',
    },
    {
      title: 'Vehicle Management',
      subtitle: 'Manage bus fleet',
      icon: 'bus',
      route: '/(admin)/bus/vehicles',
    },
    {
      title: 'Approvals',
      subtitle: 'Student subscription requests',
      icon: 'user-check',
      route: '/(admin)/bus/approvals',
      badge: stats.pendingApprovals,
    },
    {
      title: 'Alerts & Notifications',
      subtitle: 'Send updates to students',
      icon: 'bell',
      route: '/(admin)/bus/alerts',
    },
    {
      title: 'Reports',
      subtitle: 'Analytics and statistics',
      icon: 'chart-line',
      route: '/(admin)/bus/reports',
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Transportation Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage bus routes and student subscriptions
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsGrid}>
          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary }]}>
              <FontAwesome5 name="route" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalRoutes}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Routes</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.success }]}>
              <FontAwesome5 name="bus" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.activeVehicles}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vehicles</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning }]}>
              <FontAwesome5 name="clock" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.pendingApprovals}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.info }]}>
              <FontAwesome5 name="users" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalStudents}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Students</Text>
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
                  {option.badge && option.badge > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.error }]}>
                      <Text style={[styles.badgeText, { color: colors.textInverse }]}>{option.badge}</Text>
                    </View>
                  )}
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
  badge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 26,
    alignItems: 'center',
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
