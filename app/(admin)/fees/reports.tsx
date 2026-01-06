import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

const { width } = Dimensions.get('window');

interface FeeStats {
  totalCollection: number;
  totalPending: number;
  totalStudents: number;
  paidStudents: number;
  partialStudents: number;
  pendingStudents: number;
  overdueStudents: number;
  paymentsByMethod: { [key: string]: number };
}

export default function FeeReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const fetchStats = useCallback(async () => {
    try {
      let dateFilter = '';
      const now = new Date();
      
      if (timeframe === 'today') {
        dateFilter = now.toISOString().split('T')[0];
      } else if (timeframe === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = weekAgo.toISOString();
      } else if (timeframe === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = monthAgo.toISOString();
      }

      const [feesRes, paymentsRes] = await Promise.all([
        supabase.from('student_fees').select('*'),
        dateFilter
          ? supabase.from('fee_payments').select('*').gte('payment_date', dateFilter)
          : supabase.from('fee_payments').select('*'),
      ]);

      if (feesRes.error) throw feesRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const fees = feesRes.data || [];
      const payments = paymentsRes.data || [];

      const totalCollection = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const totalPending = fees.reduce((sum: number, f: any) => sum + f.amount_due, 0);

      const paymentsByMethod = payments.reduce((acc: any, p: any) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + p.amount;
        return acc;
      }, {});

      setStats({
        totalCollection,
        totalPending,
        totalStudents: fees.length,
        paidStudents: fees.filter((f: any) => f.status === 'paid').length,
        partialStudents: fees.filter((f: any) => f.status === 'partial').length,
        pendingStudents: fees.filter((f: any) => f.status === 'pending').length,
        overdueStudents: fees.filter((f: any) => f.status === 'overdue').length,
        paymentsByMethod,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [timeframe]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };
    loadData();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const collectionRate = stats && stats.totalStudents > 0
    ? ((stats.paidStudents + stats.partialStudents) / stats.totalStudents * 100).toFixed(1)
    : '0.0';

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
    <Restricted permissions={PERMISSIONS.VIEW_FINANCIAL_REPORTS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Fee Reports</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Financial analytics
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Timeframe</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker
              selectedValue={timeframe}
              onValueChange={(value) => setTimeframe(value as any)}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textPrimary}
            >
              <Picker.Item label="All Time" value="all" />
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="Last 7 Days" value="week" />
              <Picker.Item label="Last 30 Days" value="month" />
            </Picker>
          </View>
        </Card>

        {stats && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>
              Collection Overview
            </Text>
            <View style={styles.statsGrid}>
              <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="money-bill-wave" size={24} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.totalCollection}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Collected</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="hourglass-half" size={24} color={colors.error} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.totalPending}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="percentage" size={24} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{collectionRate}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Collection Rate</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="users" size={24} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalStudents}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Students</Text>
                </Card>
              </Animated.View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
              Status Breakdown
            </Text>
            <View style={styles.statsGrid}>
              <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="check-circle" size={20} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.paidStudents}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paid</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="clock" size={20} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.partialStudents}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Partial</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="hourglass-half" size={20} color={colors.textSecondary} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.pendingStudents}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
                </Card>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.statCardWrapper}>
                <Card style={styles.statCard}>
                  <FontAwesome5 name="exclamation-triangle" size={20} color={colors.error} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.overdueStudents}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
                </Card>
              </Animated.View>
            </View>

            {Object.keys(stats.paymentsByMethod).length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
                  Payment Methods
                </Text>
                {Object.entries(stats.paymentsByMethod).map(([method, amount], index) => (
                  <Animated.View key={method} entering={FadeInDown.delay(400 + index * 50).springify()}>
                    <Card style={styles.methodCard}>
                      <View style={styles.methodInfo}>
                        <FontAwesome5 
                          name={method === 'cash' ? 'money-bill-wave' : method === 'card' ? 'credit-card' : 'mobile-alt'} 
                          size={20} 
                          color={colors.primary} 
                        />
                        <Text style={[styles.methodName, { color: colors.textPrimary }]}>
                          {method.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.methodAmount, { color: colors.success }]}>
                        ₹{amount}
                      </Text>
                    </Card>
                  </Animated.View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  card: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: 8 },
  picker: { height: 50 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCardWrapper: { width: (width - 52) / 2 },
  statCard: { padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12 },
  methodCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginBottom: 8 },
  methodInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodName: { fontSize: 16, fontWeight: '600' },
  methodAmount: { fontSize: 18, fontWeight: 'bold' },
});
