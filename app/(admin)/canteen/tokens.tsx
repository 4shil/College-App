import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface Token {
  id: string;
  token_number: number;
  user_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'collected';
  total_amount: number;
  token_date: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
  token_items: {
    quantity: number;
    canteen_menu_items: {
      name: string;
      price: number;
    };
  }[];
}

export default function CanteenTokensScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchTokens();
  }, [filter]);

  const fetchTokens = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('canteen_tokens')
        .select(`
          *,
          profiles:user_id(full_name, email),
          token_items(
            quantity,
            canteen_menu_items(name, price)
          )
        `)
        .eq('token_date', today)
        .order('token_number', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      Alert.alert('Error', 'Failed to fetch tokens');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTokens();
  };

  const updateTokenStatus = async (tokenId: string, newStatus: Token['status']) => {
    try {
      const { error } = await supabase
        .from('canteen_tokens')
        .update({ status: newStatus })
        .eq('id', tokenId);

      if (error) throw error;
      fetchTokens();
    } catch (error: any) {
      console.error('Error updating token status:', error);
      Alert.alert('Error', error.message || 'Failed to update token status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'preparing': return colors.info;
      case 'ready': return colors.success;
      case 'collected': return colors.textMuted;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'clock';
      case 'preparing': return 'spinner';
      case 'ready': return 'check-circle';
      case 'collected': return 'check-double';
      default: return 'question';
    }
  };

  const getNextStatus = (currentStatus: Token['status']): Token['status'] | null => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'collected';
      default: return null;
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
    { id: 'collected', label: 'Collected' },
  ];

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Token Dashboard</Text>
          <TouchableOpacity onPress={fetchTokens} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
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

        {/* Tokens List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          ) : tokens.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="receipt" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {filter !== 'all' ? filter : ''} tokens today
              </Text>
            </View>
          ) : (
            tokens.map((token, index) => (
              <Animated.View
                key={token.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <GlassCard style={styles.tokenCard}>
                  <View style={styles.tokenHeader}>
                    <View style={styles.tokenNumberContainer}>
                      <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>Token</Text>
                      <Text style={[styles.tokenNumber, { color: colors.primary }]}>
                        #{token.token_number}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: colors.inputBackground,
                          borderWidth: colors.borderWidth,
                          borderColor: getStatusColor(token.status),
                        },
                      ]}
                    >
                      <FontAwesome5
                        name={getStatusIcon(token.status)}
                        size={12}
                        color={getStatusColor(token.status)}
                      />
                      <Text
                        style={[styles.statusText, { color: getStatusColor(token.status) }]}
                      >
                        {token.status.charAt(0).toUpperCase() + token.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.studentInfo,
                      { borderBottomColor: colors.cardBorder },
                    ]}
                  >
                    <FontAwesome5 name="user" size={14} color={colors.textSecondary} />
                    <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                      {token.profiles.full_name}
                    </Text>
                  </View>

                  <View style={styles.itemsList}>
                    {token.token_items.map((item, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={[styles.itemText, { color: colors.textSecondary }]}>
                          {item.quantity}x {item.canteen_menu_items.name}
                        </Text>
                        <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                          ₹{item.quantity * item.canteen_menu_items.price}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.totalRow,
                      { borderTopColor: colors.cardBorder },
                    ]}
                  >
                    <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
                    <Text style={[styles.totalAmount, { color: colors.primary }]}>
                      ₹{token.total_amount}
                    </Text>
                  </View>

                  <View style={styles.timeRow}>
                    <FontAwesome5 name="clock" size={12} color={colors.textMuted} />
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>
                      {new Date(token.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {getNextStatus(token.status) && (
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: colors.inputBackground,
                          borderWidth: colors.borderWidth,
                          borderColor: getStatusColor(getNextStatus(token.status)!),
                        },
                      ]}
                      onPress={() => updateTokenStatus(token.id, getNextStatus(token.status)!)}
                    >
                      <FontAwesome5
                        name="arrow-right"
                        size={14}
                        color={getStatusColor(getNextStatus(token.status)!)}
                      />
                      <Text
                        style={[
                          styles.actionText,
                          { color: getStatusColor(getNextStatus(token.status)!) },
                        ]}
                      >
                        Mark as {getNextStatus(token.status)!.charAt(0).toUpperCase() + getNextStatus(token.status)!.slice(1)}
                      </Text>
                    </TouchableOpacity>
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
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  tokenCard: {
    padding: 16,
    marginBottom: 16,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenNumberContainer: {
    alignItems: 'flex-start',
  },
  tokenLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  tokenNumber: {
    fontSize: 28,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemsList: {
    gap: 8,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
