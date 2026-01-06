import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

export default function CanteenReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    avgOrderValue: 0,
    totalMenuItems: 0,
    popularItem: 'N/A',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Today's orders
      const { count: todayCount, data: todayTokens } = await supabase
        .from('canteen_tokens')
        .select('total_amount', { count: 'exact' })
        .eq('token_date', today);

      const todayRevenue = todayTokens?.reduce((sum: number, t: any) => sum + t.total_amount, 0) || 0;

      // Week revenue
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data: weekTokens } = await supabase
        .from('canteen_tokens')
        .select('total_amount')
        .gte('token_date', weekAgo.toISOString().split('T')[0]);

      const weekRevenue = weekTokens?.reduce((sum: number, t: any) => sum + t.total_amount, 0) || 0;

      // Month revenue
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { data: monthTokens } = await supabase
        .from('canteen_tokens')
        .select('total_amount')
        .gte('token_date', monthAgo.toISOString().split('T')[0]);

      const monthRevenue = monthTokens?.reduce((sum: number, t: any) => sum + t.total_amount, 0) || 0;

      // Menu items count
      const { count: menuCount } = await supabase
        .from('canteen_menu_items')
        .select('*', { count: 'exact', head: true });

      setStats({
        todayOrders: todayCount || 0,
        todayRevenue,
        weekRevenue,
        monthRevenue,
        avgOrderValue: todayCount ? Math.round(todayRevenue / todayCount) : 0,
        totalMenuItems: menuCount || 0,
        popularItem: 'Masala Dosa', // This would need a proper query
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const reportSections = [
    {
      title: 'Daily Overview',
      icon: 'calendar-day',
      color: colors.primary,
      items: [
        { label: 'Total Orders', value: stats.todayOrders },
        { label: 'Revenue', value: `₹${stats.todayRevenue.toLocaleString()}` },
        { label: 'Average Order', value: `₹${stats.avgOrderValue}` },
      ],
    },
    {
      title: 'Revenue Summary',
      icon: 'chart-line',
      color: colors.success,
      items: [
        { label: 'Today', value: `₹${stats.todayRevenue.toLocaleString()}` },
        { label: 'This Week', value: `₹${stats.weekRevenue.toLocaleString()}` },
        { label: 'This Month', value: `₹${stats.monthRevenue.toLocaleString()}` },
      ],
    },
    {
      title: 'Menu Analytics',
      icon: 'utensils',
      color: colors.info,
      items: [
        { label: 'Total Items', value: stats.totalMenuItems },
        { label: 'Most Popular', value: stats.popularItem },
        { label: 'Categories', value: 4 },
      ],
    },
  ];

  const exportOptions = [
    { id: 'daily', label: 'Daily Sales Report', icon: 'file-alt', color: colors.primary },
    { id: 'weekly', label: 'Weekly Summary', icon: 'calendar-week', color: colors.success },
    { id: 'monthly', label: 'Monthly Report', icon: 'calendar', color: colors.info },
    { id: 'items', label: 'Item-wise Sales', icon: 'list', color: colors.warning },
  ];

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reports</Text>
          <TouchableOpacity onPress={fetchStats} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <GlassCard style={styles.summaryCard}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                Today's Performance
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <FontAwesome5 name="receipt" size={24} color={colors.primary} />
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {stats.todayOrders}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Orders
                  </Text>
                </View>
                <View
                  style={[
                    styles.summaryDivider,
                    { backgroundColor: colors.cardBorder },
                  ]}
                />
                <View style={styles.summaryItem}>
                  <FontAwesome5 name="rupee-sign" size={24} color={colors.success} />
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    ₹{(stats.todayRevenue / 1000).toFixed(1)}K
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Revenue
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Report Sections */}
          {reportSections.map((section, index) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.delay((index + 1) * 100).springify()}
            >
              <GlassCard style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View
                    style={[
                      styles.reportIcon,
                      {
                        backgroundColor: colors.inputBackground,
                        borderWidth: colors.borderWidth,
                        borderColor: section.color,
                      },
                    ]}
                  >
                    <FontAwesome5 name={section.icon} size={20} color={section.color} />
                  </View>
                  <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
                    {section.title}
                  </Text>
                </View>
                <View style={styles.reportItems}>
                  {section.items.map((item, idx) => (
                    <View key={idx} style={styles.reportItem}>
                      <Text style={[styles.reportLabel, { color: colors.textSecondary }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.reportValue, { color: colors.textPrimary }]}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>
          ))}

          {/* Export Options */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Export Reports
          </Text>
          {exportOptions.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInDown.delay((reportSections.length + index + 1) * 100).springify()}
            >
              <TouchableOpacity>
                <GlassCard style={styles.exportCard}>
                  <View
                    style={[
                      styles.exportIcon,
                      {
                        backgroundColor: colors.inputBackground,
                        borderWidth: colors.borderWidth,
                        borderColor: option.color,
                      },
                    ]}
                  >
                    <FontAwesome5 name={option.icon} size={22} color={option.color} />
                  </View>
                  <Text style={[styles.exportLabel, { color: colors.textPrimary }]}>
                    {option.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          ))}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'transparent',
  },
  reportCard: {
    padding: 16,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  reportItems: {
    gap: 12,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportLabel: {
    fontSize: 14,
  },
  reportValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exportLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
