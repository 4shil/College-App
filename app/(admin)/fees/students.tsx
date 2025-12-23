import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface StudentFee {
  id: string;
  student_id: string;
  fee_structure_id: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  due_date: string;
  student?: {
    admission_number: string;
    users: { full_name: string; email: string };
  };
  fee_structure?: {
    name: string;
    academic_year: { year: string };
  };
}

export default function StudentFeesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'paid' | 'overdue'>('all');

  const fetchStudentFees = useCallback(async () => {
    try {
      let query = supabase
        .from('student_fees')
        .select(`
          *,
          student:students(
            admission_number,
            users(full_name, email)
          ),
          fee_structure:fee_structures(
            name,
            academic_year:academic_years(year)
          )
        `)
        .order('due_date', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setStudentFees(data || []);
    } catch (error) {
      console.error('Error fetching student fees:', error);
      Alert.alert('Error', 'Failed to fetch student fees');
    }
  }, [filter]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStudentFees();
      setLoading(false);
    };
    loadData();
  }, [fetchStudentFees]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudentFees();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'partial': return colors.warning;
      case 'pending': return colors.textSecondary;
      case 'overdue': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'check-circle';
      case 'partial': return 'clock';
      case 'pending': return 'hourglass-half';
      case 'overdue': return 'exclamation-triangle';
      default: return 'circle';
    }
  };

  const stats = {
    total: studentFees.length,
    pending: studentFees.filter(f => f.status === 'pending').length,
    partial: studentFees.filter(f => f.status === 'partial').length,
    paid: studentFees.filter(f => f.status === 'paid').length,
    overdue: studentFees.filter(f => f.status === 'overdue').length,
    totalDue: studentFees.reduce((sum, f) => sum + f.amount_due, 0),
    totalPaid: studentFees.reduce((sum, f) => sum + f.amount_paid, 0),
  };

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
    <Restricted permissions={PERMISSIONS.MANAGE_FEES} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Student Fees</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{stats.total} students</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.paid}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Paid</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{stats.partial}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Partial</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.error }]}>{stats.overdue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>₹{stats.totalPaid}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Collected</Text>
          </Card>
          <Card style={[styles.statCard, { flex: 1 }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>₹{stats.totalDue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </Card>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['all', 'pending', 'partial', 'paid', 'overdue'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f as any)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filter === f ? colors.primary : colors.inputBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: filter === f ? colors.textInverse : colors.textPrimary }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Student List */}
        {studentFees.map((fee, index) => (
          <Animated.View key={fee.id} entering={FadeInDown.delay(index * 30).springify()}>
            <Card style={styles.studentCard}>
              <View style={styles.studentHeader}>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                    {fee.student?.users?.full_name}
                  </Text>
                  <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                    {fee.student?.admission_number} • {fee.fee_structure?.name}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <FontAwesome5 name={getStatusIcon(fee.status)} size={12} color={getStatusColor(fee.status)} />
                  <Text style={[styles.statusText, { color: getStatusColor(fee.status) }]}>
                    {fee.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.feeDetails}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Total:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{fee.total_amount}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Paid:</Text>
                  <Text style={[styles.feeValue, { color: colors.success }]}>₹{fee.amount_paid}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Due:</Text>
                  <Text style={[styles.feeValue, { color: colors.error }]}>₹{fee.amount_due}</Text>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
                  Due: {new Date(fee.due_date).toLocaleDateString()}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(admin)/fees/payment' as any)}
                  style={[styles.payButton, { backgroundColor: colors.primary }]}
                >
                  <FontAwesome5 name="rupee-sign" size={14} color={colors.textInverse} />
                  <Text style={[styles.payButtonText, { color: colors.textInverse }]}>Pay</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </Animated.View>
        ))}

        {studentFees.length === 0 && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="receipt" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No student fees found</Text>
          </Card>
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  filters: { marginBottom: 16 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  filterText: { fontSize: 14, fontWeight: '600' },
  studentCard: { padding: 16, marginBottom: 12 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentMeta: { fontSize: 14 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  feeDetails: { marginBottom: 12 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  feeLabel: { fontSize: 14 },
  feeValue: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueDate: { fontSize: 14 },
  payButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  payButtonText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
});
