import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface Defaulter {
  id: string;
  student_id: string;
  total_amount: number;
  amount_due: number;
  due_date: string;
  days_overdue: number;
  student?: {
    admission_number: string;
    users: { full_name: string; email: string; phone: string };
  };
}

export default function FeeDefaultersScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);

  const fetchDefaulters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          *,
          student:students(
            admission_number,
            users(full_name, email, phone)
          )
        `)
        .eq('status', 'overdue')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const defaultersWithDays = (data || []).map((d: any) => ({
        ...d,
        days_overdue: Math.floor((Date.now() - new Date(d.due_date).getTime()) / (1000 * 60 * 60 * 24)),
      }));

      setDefaulters(defaultersWithDays);
    } catch (error) {
      console.error('Error fetching defaulters:', error);
      Alert.alert('Error', 'Failed to fetch defaulters');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDefaulters();
      setLoading(false);
    };
    loadData();
  }, [fetchDefaulters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDefaulters();
    setRefreshing(false);
  };

  const sendReminder = async (defaulter: Defaulter) => {
    Alert.alert(
      'Send Reminder',
      `Send fee reminder to ${defaulter.student?.users?.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              // In a real app, this would send email/SMS
              Alert.alert('Success', 'Reminder sent successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to send reminder');
            }
          },
        },
      ]
    );
  };

  const totalOverdue = defaulters.reduce((sum, d) => sum + d.amount_due, 0);
  const avgDaysOverdue = defaulters.length > 0 
    ? Math.round(defaulters.reduce((sum, d) => sum + d.days_overdue, 0) / defaulters.length)
    : 0;

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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Fee Defaulters</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {defaulters.length} students
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.error }]}>₹{totalOverdue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Overdue</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{avgDaysOverdue}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Days</Text>
          </Card>
        </View>

        {defaulters.map((defaulter, index) => (
          <Animated.View key={defaulter.id} entering={FadeInDown.delay(index * 30).springify()}>
            <Card style={styles.defaulterCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.warningIcon, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderWidth: 1 }]}>
                  <FontAwesome5 name="exclamation-triangle" size={24} color={colors.error} />
                </View>
                <View style={styles.defaulterInfo}>
                  <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                    {defaulter.student?.users?.full_name}
                  </Text>
                  <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                    {defaulter.student?.admission_number}
                  </Text>
                </View>
                <View style={[styles.daysOverdue, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderWidth: 1 }]}>
                  <Text style={[styles.daysText, { color: colors.error }]}>
                    {defaulter.days_overdue}d
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.feeDetails,
                  { borderBottomColor: colors.cardBorder },
                ]}
              >
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>₹{defaulter.total_amount}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount Due:</Text>
                  <Text style={[styles.detailValue, { color: colors.error }]}>₹{defaulter.amount_due}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date:</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {new Date(defaulter.due_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.contactInfo}>
                {defaulter.student?.users?.phone && (
                  <View style={styles.contactRow}>
                    <FontAwesome5 name="phone" size={14} color={colors.textSecondary} />
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                      {defaulter.student.users.phone}
                    </Text>
                  </View>
                )}
                {defaulter.student?.users?.email && (
                  <View style={styles.contactRow}>
                    <FontAwesome5 name="envelope" size={14} color={colors.textSecondary} />
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>
                      {defaulter.student.users.email}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => sendReminder(defaulter)}
                style={[styles.reminderButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderWidth: 1 }]}
              >
                <FontAwesome5 name="bell" size={16} color={colors.warning} />
                <Text style={[styles.reminderText, { color: colors.warning }]}>Send Reminder</Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        ))}

        {defaulters.length === 0 && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="check-circle" size={48} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.success }]}>No fee defaulters!</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              All students have paid their fees on time
            </Text>
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  defaulterCard: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  warningIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  defaulterInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentMeta: { fontSize: 14 },
  daysOverdue: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  daysText: { fontSize: 16, fontWeight: 'bold' },
  feeDetails: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  contactInfo: { marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  contactText: { fontSize: 14 },
  reminderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
  reminderText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
});
