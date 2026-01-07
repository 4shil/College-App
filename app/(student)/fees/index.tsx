import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { getStudentByUserId } from '../../../lib/database';
import { withAlpha } from '../../../theme/colorUtils';

export default function FeesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    const student = await getStudentByUserId(user.id);
    if (!student?.id) {
      setFees([]);
      setPayments([]);
      return;
    }

    const { data: feeRows, error: feeError } = await supabase
      .from('student_fees')
      .select('id, amount_due, amount_paid, payment_status, due_date, fee_structures:fee_structure_id(name, fee_type, amount)')
      .eq('student_id', student.id)
      .order('due_date', { ascending: true });

    if (feeError) {
      console.log('Student fees error:', feeError.message);
      setFees([]);
    } else {
      setFees(feeRows || []);
    }

    const feeIds = (feeRows || []).map((r: any) => r.id);
    if (feeIds.length === 0) {
      setPayments([]);
      return;
    }

    const { data: payRows, error: payError } = await supabase
      .from('fee_payments')
      .select('id, amount, payment_date, payment_method, receipt_url, student_fee_id')
      .in('student_fee_id', feeIds)
      .order('payment_date', { ascending: false })
      .limit(10);

    if (payError) {
      console.log('Fee payments error:', payError.message);
      setPayments([]);
    } else {
      setPayments(payRows || []);
    }
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    init();
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const dueTotal = useMemo(() => fees.reduce((sum: number, f: any) => sum + Number(f.amount_due || 0) - Number(f.amount_paid || 0), 0), [fees]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Fees & Payments</Text>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading fees...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            <Card>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Outstanding</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>₹{dueTotal.toFixed(2)}</Text>
              <Text style={[styles.summaryHint, { color: colors.textMuted }]}>Based on current fee records</Text>
            </Card>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 18 }]}>Fee Items</Text>
            {fees.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No fee records</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Fees will appear once assigned.</Text>
              </Card>
            ) : (
              <Card>
                {fees.map((f: any, idx: number) => {
                  const pending = Math.max(0, Number(f.amount_due || 0) - Number(f.amount_paid || 0));
                  const status = String(f.payment_status || 'pending');
                  const bg = status === 'paid' ? withAlpha(colors.success, 0.12) : status === 'overdue' ? withAlpha(colors.error, 0.12) : withAlpha(colors.warning, 0.12);
                  const fg = status === 'paid' ? colors.success : status === 'overdue' ? colors.error : colors.warning;
                  return (
                    <View key={f.id} style={[styles.feeRow, idx < fees.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }] }>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.feeTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {f.fee_structures?.name || 'Fee'}
                        </Text>
                        <Text style={[styles.feeMeta, { color: colors.textMuted }]} numberOfLines={1}>
                          {String(f.fee_structures?.fee_type || 'fee').toUpperCase()} • Due: {String(f.due_date || '-')}
                        </Text>
                        <Text style={[styles.feeMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                          Paid: ₹{Number(f.amount_paid || 0).toFixed(2)} • Pending: ₹{pending.toFixed(2)}
                        </Text>
                      </View>
                      <View style={[styles.statusChip, { backgroundColor: bg }]}>
                        <Text style={[styles.statusText, { color: fg }]}>{status.toUpperCase()}</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 18 }]}>Recent Payments</Text>
            {payments.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No payments</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Payment receipts will show here.</Text>
              </Card>
            ) : (
              <Card>
                {payments.map((p: any, idx: number) => (
                  <View key={p.id} style={[styles.payRow, idx < payments.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }] }>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.payTitle, { color: colors.textPrimary }]}>
                        ₹{Number(p.amount || 0).toFixed(2)}
                      </Text>
                      <Text style={[styles.payMeta, { color: colors.textMuted }]}>
                        {String(p.payment_date)}{p.payment_method ? ` • ${String(p.payment_method).toUpperCase()}` : ''}
                      </Text>
                    </View>
                    <Ionicons name={p.receipt_url ? 'document-text-outline' : 'cash-outline'} size={18} color={colors.textMuted} />
                  </View>
                ))}
              </Card>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: '900',
  },
  summaryHint: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12,
  },
  feeRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  feeTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  feeMeta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  payRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  payTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  payMeta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
  },
});
