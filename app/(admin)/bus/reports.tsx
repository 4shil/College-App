import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');

export default function BusReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [stats, setStats] = useState({
    totalRoutes: 0,
    totalVehicles: 0,
    totalStudents: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch routes count
      const { count: routesCount } = await supabase
        .from('bus_routes')
        .select('*', { count: 'exact', head: true });

      // Fetch vehicles count
      const { count: vehiclesCount } = await supabase
        .from('bus_vehicles')
        .select('*', { count: 'exact', head: true });

      // Fetch active subscriptions
      const { count: activeCount } = await supabase
        .from('bus_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'approved');

      // Fetch pending approvals
      const { count: pendingCount } = await supabase
        .from('bus_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');

      // Calculate revenue (assuming routes have monthly_fee)
      const { data: routes } = await supabase
        .from('bus_routes')
        .select('monthly_fee');

      const totalRevenue = routes?.reduce((sum: number, route: any) => sum + (route.monthly_fee || 0), 0) || 0;

      setStats({
        totalRoutes: routesCount || 0,
        totalVehicles: vehiclesCount || 0,
        totalStudents: activeCount || 0,
        monthlyRevenue: totalRevenue * (activeCount || 0),
        activeSubscriptions: activeCount || 0,
        pendingApprovals: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const reportSections = [
    {
      title: 'Route Statistics',
      icon: 'route',
      color: colors.primary,
      items: [
        { label: 'Total Routes', value: stats.totalRoutes },
        { label: 'Active Vehicles', value: stats.totalVehicles },
        { label: 'Total Students', value: stats.totalStudents },
      ],
    },
    {
      title: 'Financial Overview',
      icon: 'rupee-sign',
      color: colors.success,
      items: [
        { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}` },
        { label: 'Active Subscriptions', value: stats.activeSubscriptions },
        { label: 'Average per Student', value: stats.activeSubscriptions > 0 ? `₹${Math.round(stats.monthlyRevenue / stats.activeSubscriptions)}` : '₹0' },
      ],
    },
    {
      title: 'Approval Status',
      icon: 'clipboard-check',
      color: colors.warning,
      items: [
        { label: 'Pending Approvals', value: stats.pendingApprovals },
        { label: 'Approved', value: stats.activeSubscriptions },
        { label: 'Approval Rate', value: `${stats.activeSubscriptions + stats.pendingApprovals > 0 ? Math.round((stats.activeSubscriptions / (stats.activeSubscriptions + stats.pendingApprovals)) * 100) : 0}%` },
      ],
    },
  ];

  const exportOptions = [
    { id: 'pdf', label: 'Export as PDF', icon: 'file-pdf', color: colors.error },
    { id: 'excel', label: 'Export as Excel', icon: 'file-excel', color: colors.success },
    { id: 'csv', label: 'Export as CSV', icon: 'file-csv', color: colors.info },
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
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <GlassCard style={styles.summaryCard}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                Transportation Overview
              </Text>
              <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
                Current Month Statistics
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {stats.totalRoutes}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Routes</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    {stats.totalStudents}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    Students
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.warning }]}>
                    ₹{(stats.monthlyRevenue / 1000).toFixed(1)}K
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
                  <View style={[styles.reportIcon, { backgroundColor: `${section.color}20` }]}>
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
                  <View style={[styles.exportIcon, { backgroundColor: `${option.color}15` }]}>
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
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
