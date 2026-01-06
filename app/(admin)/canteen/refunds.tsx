import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface RefundRequest {
  id: string;
  token_id: string;
  reason: string;
  refund_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  canteen_tokens: {
    token_number: number;
    total_amount: number;
    profiles: {
      full_name: string;
      email: string;
    };
  };
}

export default function RefundsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);

  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRefunds = async () => {
    try {
      let query = supabase
        .from('canteen_refund_requests')
        .select(
          `
          *,
          canteen_tokens(
            token_number,
            total_amount,
            profiles:user_id(full_name, email)
          )
        `
        )
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRefunds((data || []) as RefundRequest[]);
    } catch (error) {
      console.error('Error fetching refunds:', error);
      Alert.alert('Error', 'Failed to fetch refund requests');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setNotes('');
    setModalVisible(true);
  };

  const handleRefundAction = async (status: 'approved' | 'rejected') => {
    if (!selectedRefund) return;

    try {
      const { error } = await supabase
        .from('canteen_refund_requests')
        .update({
          status,
          admin_notes: notes || null,
          processed_at: new Date().toISOString(),
        })
        .eq('id', selectedRefund.id);

      if (error) throw error;

      Alert.alert('Success', `Refund request ${status}`, [
        { text: 'OK', onPress: () => setModalVisible(false) },
      ]);

      fetchRefunds();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      Alert.alert('Error', error.message || 'Failed to process refund');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const filters = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All' },
  ];

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Refunds</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: colors.inputBackground,
                    borderWidth: colors.borderWidth,
                    borderColor: filter === tab.id ? colors.primary : colors.inputBorder,
                  },
                ]}
                onPress={() => setFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === tab.id ? colors.primary : colors.textSecondary },
                    filter === tab.id && { fontWeight: '700' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Refunds List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          ) : refunds.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="hand-holding-usd" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {filter !== 'all' ? filter : ''} refund requests</Text>
            </View>
          ) : (
            refunds.map((refund, index) => (
              <Animated.View key={refund.id} entering={FadeInDown.delay(index * 50).springify()}>
                <GlassCard style={styles.refundCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.tokenInfo}>
                      <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>Token #{refund.canteen_tokens.token_number}</Text>
                      <Text style={[styles.studentName, { color: colors.textPrimary }]}>{refund.canteen_tokens.profiles.full_name}</Text>
                      <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>{refund.canteen_tokens.profiles.email}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: colors.inputBackground,
                          borderWidth: colors.borderWidth,
                          borderColor: getStatusColor(refund.status),
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(refund.status) }]}>
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.refundDetails}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Original Amount</Text>
                      <Text style={[styles.detailValue, { color: colors.textPrimary }]}>₹{refund.canteen_tokens.total_amount}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Refund Amount</Text>
                      <Text style={[styles.detailValue, { color: colors.error }]}>₹{refund.refund_amount}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.reasonBox,
                      {
                        backgroundColor: colors.inputBackground,
                        borderWidth: colors.borderWidth,
                        borderColor: colors.inputBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.reasonLabel, { color: colors.textMuted }]}>Reason:</Text>
                    <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{refund.reason}</Text>
                  </View>

                  <View style={styles.timeRow}>
                    <FontAwesome5 name="clock" size={12} color={colors.textMuted} />
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>{new Date(refund.created_at).toLocaleString()}</Text>
                  </View>

                  {refund.status === 'pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor: colors.inputBackground,
                            borderWidth: colors.borderWidth,
                            borderColor: colors.success,
                          },
                        ]}
                        onPress={() => openApprovalModal(refund)}
                      >
                        <FontAwesome5 name="check" size={14} color={colors.success} />
                        <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor: colors.inputBackground,
                            borderWidth: colors.borderWidth,
                            borderColor: colors.error,
                          },
                        ]}
                        onPress={() => {
                          setSelectedRefund(refund);
                          setNotes('');
                          Alert.alert('Reject Refund', 'Are you sure you want to reject this refund request?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Reject',
                              style: 'destructive',
                              onPress: () => handleRefundAction('rejected'),
                            },
                          ]);
                        }}
                      >
                        <FontAwesome5 name="times" size={14} color={colors.error} />
                        <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassCard>
              </Animated.View>
            ))
          )}
        </ScrollView>

        {/* Approval Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
            <GlassCard style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Approve Refund</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {selectedRefund && (
                <>
                  <View style={styles.modalInfo}>
                    <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Token #{selectedRefund.canteen_tokens.token_number}</Text>
                    <Text style={[styles.modalAmount, { color: colors.success }]}>₹{selectedRefund.refund_amount}</Text>
                  </View>

                  <Text style={[styles.label, { color: colors.textPrimary }]}>Notes (Optional)</Text>
                  <GlassInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add any notes about this refund..."
                    multiline
                    numberOfLines={3}
                  />

                  <PrimaryButton title="Approve Refund" onPress={() => handleRefundAction('approved')} />
                </>
              )}
            </GlassCard>
          </View>
        </Modal>
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  refundCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  refundDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  reasonBox: {
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 10,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
});
