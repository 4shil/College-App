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

interface CanteenStats {
  todayTokens: number;
  pendingTokens: number;
  readyTokens: number;
  todaySales: number;
}

export default function CanteenIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<CanteenStats>({
    todayTokens: 0,
    pendingTokens: 0,
    readyTokens: 0,
    todaySales: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [totalTokens, pending, ready, sales] = await Promise.all([
        supabase.from('canteen_tokens').select('id', { count: 'exact', head: true }).eq('token_date', today),
        supabase.from('canteen_tokens').select('id', { count: 'exact', head: true }).eq('token_date', today).eq('status', 'pending'),
        supabase.from('canteen_tokens').select('id', { count: 'exact', head: true }).eq('token_date', today).eq('status', 'ready'),
        supabase.from('canteen_tokens').select('total_amount').eq('token_date', today).eq('payment_status', 'paid'),
      ]);

      const totalSales = sales.data?.reduce((sum: number, token: any) => sum + (token.total_amount || 0), 0) || 0;

      setStats({
        todayTokens: totalTokens.count || 0,
        pendingTokens: pending.count || 0,
        readyTokens: ready.count || 0,
        todaySales: totalSales,
      });
    } catch (error) {
      console.error('Error fetching canteen stats:', error);
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
      case 'Token Dashboard':
        return 'warning';
      case 'Ready Orders':
        return 'success';
      case 'Refund Requests':
        return 'error';
      case 'Sales Reports':
        return 'info';
      default:
        return 'primary';
    }
  };

  const menuOptions = [
    {
      title: 'Menu Management',
      subtitle: 'Manage daily menu items',
      icon: 'utensils',
      route: '/(admin)/canteen/menu',
    },
    {
      title: 'Token Dashboard',
      subtitle: 'View and manage orders',
      icon: 'ticket-alt',
      route: '/(admin)/canteen/tokens',
      badge: stats.pendingTokens,
    },
    {
      title: 'Ready Orders',
      subtitle: 'Orders ready for pickup',
      icon: 'check-circle',
      route: '/(admin)/canteen/ready',
      badge: stats.readyTokens,
    },
    {
      title: 'Refund Requests',
      subtitle: 'Process refund requests',
      icon: 'undo',
      route: '/(admin)/canteen/refunds',
    },
    {
      title: 'Sales Reports',
      subtitle: 'Analytics and statistics',
      icon: 'chart-bar',
      route: '/(admin)/canteen/reports',
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Canteen Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage menu and token orders
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
              <FontAwesome5 name="ticket-alt" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.todayTokens}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today's Orders</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.warning, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="clock" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.pendingTokens}</Text>
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
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.readyTokens}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ready</Text>
          </View>

          <View style={[styles.statCard, { 
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
            borderWidth: colors.borderWidth,
          }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.info, shadowColor: colors.shadowColor }]}>
              <FontAwesome5 name="rupee-sign" size={20} color={colors.textInverse} />
            </View>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.todaySales.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today's Sales</Text>
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 28,
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
