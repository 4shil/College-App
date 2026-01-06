import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface BusApproval {
  id: string;
  user_id: string;
  route_id: string;
  pickup_stop: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  bus_routes: {
    route_name: string;
    route_number: string;
    vehicle_number: string;
  };
}

export default function BusApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [approvals, setApprovals] = useState<BusApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchApprovals();
  }, [filter]);

  const fetchApprovals = async () => {
    try {
      let query = supabase
        .from('bus_subscriptions')
        .select(`
          *,
          profiles:user_id(full_name, email),
          bus_routes:route_id(route_name, route_number, vehicle_number)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('approval_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApprovals(data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      Alert.alert('Error', 'Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('bus_subscriptions')
        .update({ approval_status: status })
        .eq('id', approvalId);

      if (error) throw error;
      Alert.alert('Success', `Request ${status} successfully`);
      fetchApprovals();
    } catch (error: any) {
      console.error('Error updating approval:', error);
      Alert.alert('Error', error.message || 'Failed to update approval');
    }
  };

  const confirmApproval = (approval: BusApproval, status: 'approved' | 'rejected') => {
    const action = status === 'approved' ? 'approve' : 'reject';
    Alert.alert(
      `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Are you sure you want to ${action} this request from ${approval.profiles.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: () => handleApproval(approval.id, status),
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.warning;
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bus Approvals</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'pending', 'approved', 'rejected'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  filter === tab && { backgroundColor: withAlpha(colors.primary, 0.125) },
                ]}
                onPress={() => setFilter(tab as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === tab ? colors.primary : colors.textSecondary },
                    filter === tab && { fontWeight: '700' },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Approvals List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          ) : approvals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="clipboard-check" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {filter !== 'all' ? filter : ''} approvals
              </Text>
            </View>
          ) : (
            approvals.map((approval, index) => (
              <Animated.View
                key={approval.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <GlassCard style={styles.approvalCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.studentInfo}>
                      <View style={[styles.avatar, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
                        <FontAwesome5 name="user" size={18} color={colors.primary} />
                      </View>
                      <View style={styles.studentDetails}>
                        <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                          {approval.profiles.full_name}
                        </Text>
                        <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>
                          {approval.profiles.email}
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: withAlpha(getStatusColor(approval.approval_status), 0.125) }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: getStatusColor(approval.approval_status) }
                      ]}>
                        {approval.approval_status.charAt(0).toUpperCase() + approval.approval_status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeInfo}>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="route" size={14} color={colors.textSecondary} />
                      <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                        {approval.bus_routes.route_name} ({approval.bus_routes.route_number})
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="bus" size={14} color={colors.textSecondary} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        {approval.bus_routes.vehicle_number}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="map-marker-alt" size={14} color={colors.textSecondary} />
                      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Pickup: {approval.pickup_stop}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <FontAwesome5 name="clock" size={14} color={colors.textSecondary} />
                      <Text style={[styles.infoText, { color: colors.textMuted }]}>
                        {new Date(approval.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {approval.approval_status === 'pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: withAlpha(colors.success, 0.082) }]}
                        onPress={() => confirmApproval(approval, 'approved')}
                      >
                        <FontAwesome5 name="check" size={14} color={colors.success} />
                        <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: withAlpha(colors.error, 0.082) }]}
                        onPress={() => confirmApproval(approval, 'rejected')}
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
  approvalCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentDetails: {
    flex: 1,
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
  routeInfo: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
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
});
