import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

interface Student {
  id: string;
  admission_number: string;
  users: { full_name: string };
}

interface StudentFee {
  id: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
}

interface FeePayment {
  id: string;
  student_fee_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'cheque' | 'dd' | 'net_banking';
  payment_date: string;
  receipt_number: string;
  remarks: string;
  student_fee?: {
    student: {
      admission_number: string;
      users: { full_name: string };
    };
  };
}

export default function FeePaymentScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const modalBackdropColor = isDark ? withAlpha(colors.background, 0.75) : withAlpha(colors.textPrimary, 0.5);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState<'cash' | 'card' | 'upi' | 'cheque' | 'dd' | 'net_banking'>('cash');
  const [formRemarks, setFormRemarks] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        supabase
          .from('fee_payments')
          .select(`
            *,
            student_fee:student_fees(
              student:students(
                admission_number,
                users(full_name)
              )
            )
          `)
          .order('payment_date', { ascending: false })
          .limit(50),
        supabase
          .from('students')
          .select('id, admission_number, users(full_name)')
          .eq('is_active', true)
          .order('admission_number'),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setPayments(paymentsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch data');
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

  const fetchStudentFees = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select('*')
        .eq('student_id', studentId)
        .neq('status', 'paid');

      if (error) throw error;
      setStudentFees(data || []);
      if (data && data.length > 0) {
        setSelectedFeeId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching student fees:', error);
    }
  };

  const openModal = () => {
    setSelectedStudentId('');
    setStudentFees([]);
    setSelectedFeeId('');
    setFormAmount('');
    setFormMethod('cash');
    setFormRemarks('');
    setShowModal(true);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (studentId) {
      fetchStudentFees(studentId);
    } else {
      setStudentFees([]);
      setSelectedFeeId('');
    }
  };

  const handlePayment = async () => {
    if (!selectedStudentId || !selectedFeeId || !formAmount) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    const amount = parseFloat(formAmount);
    const selectedFee = studentFees.find(f => f.id === selectedFeeId);
    if (!selectedFee) return;

    if (amount <= 0 || amount > selectedFee.amount_due) {
      Alert.alert('Validation Error', `Amount must be between ₹1 and ₹${selectedFee.amount_due}`);
      return;
    }

    setSaving(true);
    try {
      const receiptNumber = `RCP${Date.now()}`;
      const paymentData = {
        student_fee_id: selectedFeeId,
        amount,
        payment_method: formMethod,
        payment_date: new Date().toISOString(),
        receipt_number: receiptNumber,
        remarks: formRemarks.trim(),
        collected_by: (await supabase.auth.getUser()).data.user?.id,
      };

      const { error: paymentError } = await supabase.from('fee_payments').insert([paymentData]);
      if (paymentError) throw paymentError;

      // Update student fee
      const newAmountPaid = selectedFee.amount_paid + amount;
      const newAmountDue = selectedFee.amount_due - amount;
      const newStatus = newAmountDue === 0 ? 'paid' : 'partial';

      const { error: updateError } = await supabase
        .from('student_fees')
        .update({
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          status: newStatus,
          last_payment_date: new Date().toISOString(),
        })
        .eq('id', selectedFeeId);

      if (updateError) throw updateError;

      Alert.alert('Success', `Payment recorded successfully\nReceipt: ${receiptNumber}`);
      setShowModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', error.message || 'Failed to process payment');
    } finally {
      setSaving(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'money-bill-wave';
      case 'card': return 'credit-card';
      case 'upi': return 'mobile-alt';
      case 'cheque': return 'file-invoice';
      case 'dd': return 'file-invoice-dollar';
      case 'net_banking': return 'university';
      default: return 'rupee-sign';
    }
  };

  const selectedFee = studentFees.find(f => f.id === selectedFeeId);
  const todayTotal = payments
    .filter(p => new Date(p.payment_date).toDateString() === new Date().toDateString())
    .reduce((sum, p) => sum + p.amount, 0);

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
    <Restricted permissions={PERMISSIONS.PROCESS_PAYMENTS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Fee Payments</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Today: ₹{todayTotal}
            </Text>
          </View>
          <SolidButton
            onPress={openModal}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <FontAwesome5 name="plus" size={18} color={colors.textInverse} />
          </SolidButton>
        </View>

        {/* Recent Payments */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Payments</Text>
        {payments.map((payment, index) => (
          <Animated.View key={payment.id} entering={FadeInDown.delay(index * 30).springify()}>
            <Card style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View style={[styles.methodIcon, { backgroundColor: withAlpha(colors.primary, 0.2) }]}>
                  <FontAwesome5 name={getMethodIcon(payment.payment_method)} size={20} color={colors.primary} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                    {payment.student_fee?.student?.users?.full_name}
                  </Text>
                  <Text style={[styles.paymentMeta, { color: colors.textSecondary }]}>
                    {payment.student_fee?.student?.admission_number} • {payment.payment_method.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.paymentAmount}>
                  <Text style={[styles.amount, { color: colors.success }]}>₹{payment.amount}</Text>
                  <Text style={[styles.receiptNo, { color: colors.textSecondary }]}>{payment.receipt_number}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.paymentFooter,
                  { borderTopColor: withAlpha(colors.textPrimary, isDark ? 0.18 : 0.12) },
                ]}
              >
                <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>
                  {new Date(payment.payment_date).toLocaleString()}
                </Text>
                {payment.remarks && (
                  <Text style={[styles.remarks, { color: colors.textSecondary }]}>
                    {payment.remarks}
                  </Text>
                )}
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: modalBackdropColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Record Payment</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select Student *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={selectedStudentId}
                  onValueChange={handleStudentSelect}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="Select Student" value="" />
                  {students.map(s => (
                    <Picker.Item
                      key={s.id}
                      label={`${s.admission_number} - ${s.users?.full_name}`}
                      value={s.id}
                    />
                  ))}
                </Picker>
              </View>

              {studentFees.length > 0 && (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select Fee *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                    <Picker
                      selectedValue={selectedFeeId}
                      onValueChange={setSelectedFeeId}
                      style={[styles.picker, { color: colors.textPrimary }]}
                      dropdownIconColor={colors.textPrimary}
                    >
                      {studentFees.map(f => (
                        <Picker.Item
                          key={f.id}
                          label={`Due: ₹${f.amount_due} (Total: ₹${f.total_amount})`}
                          value={f.id}
                        />
                      ))}
                    </Picker>
                  </View>

                  {selectedFee && (
                    <Card style={styles.feeInfoCard}>
                      <View style={styles.feeInfoRow}>
                        <Text style={[styles.feeInfoLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
                        <Text style={[styles.feeInfoValue, { color: colors.textPrimary }]}>₹{selectedFee.total_amount}</Text>
                      </View>
                      <View style={styles.feeInfoRow}>
                        <Text style={[styles.feeInfoLabel, { color: colors.textSecondary }]}>Already Paid:</Text>
                        <Text style={[styles.feeInfoValue, { color: colors.success }]}>₹{selectedFee.amount_paid}</Text>
                      </View>
                      <View style={styles.feeInfoRow}>
                        <Text style={[styles.feeInfoLabel, { color: colors.textSecondary }]}>Amount Due:</Text>
                        <Text style={[styles.feeInfoValue, { color: colors.error }]}>₹{selectedFee.amount_due}</Text>
                      </View>
                    </Card>
                  )}

                  <GlassInput
                    placeholder={`Max: ₹${selectedFee?.amount_due || 0}`}
                    value={formAmount}
                    onChangeText={setFormAmount}
                    keyboardType="numeric"
                  />

                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Payment Method *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                    <Picker
                      selectedValue={formMethod}
                      onValueChange={(value) => setFormMethod(value as any)}
                      style={[styles.picker, { color: colors.textPrimary }]}
                      dropdownIconColor={colors.textPrimary}
                    >
                      <Picker.Item label="Cash" value="cash" />
                      <Picker.Item label="Card" value="card" />
                      <Picker.Item label="UPI" value="upi" />
                      <Picker.Item label="Cheque" value="cheque" />
                      <Picker.Item label="Demand Draft" value="dd" />
                      <Picker.Item label="Net Banking" value="net_banking" />
                    </Picker>
                  </View>

                  <GlassInput
                    placeholder="Payment remarks (optional)"
                    value={formRemarks}
                    onChangeText={setFormRemarks}
                    multiline
                    numberOfLines={2}
                  />

                  <PrimaryButton
                    title="Record Payment"
                    onPress={handlePayment}
                    loading={saving}
                    style={{ marginTop: 16 }}
                  />
                </>
              )}

              {selectedStudentId && studentFees.length === 0 && (
                <Card style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No pending fees for this student
                  </Text>
                </Card>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  addButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  paymentCard: { padding: 16, marginBottom: 12 },
  paymentHeader: { flexDirection: 'row', marginBottom: 8 },
  methodIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  paymentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  paymentMeta: { fontSize: 14 },
  paymentAmount: { alignItems: 'flex-end' },
  amount: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  receiptNo: { fontSize: 12 },
  paymentFooter: { borderTopWidth: 1, borderTopColor: 'transparent', paddingTop: 8, marginTop: 8 },
  paymentDate: { fontSize: 14 },
  remarks: { fontSize: 14, fontStyle: 'italic', marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  picker: { height: 50 },
  feeInfoCard: { padding: 12, marginVertical: 8 },
  feeInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  feeInfoLabel: { fontSize: 14 },
  feeInfoValue: { fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 20, alignItems: 'center', marginTop: 16 },
  emptyText: { fontSize: 16 },
});
