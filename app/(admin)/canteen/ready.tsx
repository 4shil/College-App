import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

interface ReadyToken {
  id: string;
  token_number: number;
  user_id: string;
  total_amount: number;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

export default function ReadyOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [readyTokens, setReadyTokens] = useState<ReadyToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReadyTokens();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('ready-tokens-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'canteen_tokens',
          filter: 'status=eq.ready'
        }, 
        () => {
          fetchReadyTokens();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchReadyTokens = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('canteen_tokens')
        .select(`
          id,
          token_number,
          user_id,
          total_amount,
          created_at,
          profiles:user_id(full_name)
        `)
        .eq('status', 'ready')
        .eq('token_date', today)
        .order('token_number', { ascending: true });

      if (error) throw error;
      setReadyTokens(data || []);
    } catch (error) {
      console.error('Error fetching ready tokens:', error);
      Alert.alert('Error', 'Failed to fetch ready orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReadyTokens();
  };

  const markAsCollected = async (tokenId: string, tokenNumber: number) => {
    Alert.alert(
      'Confirm Collection',
      `Mark Token #${tokenNumber} as collected?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Collected',
          style: 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('canteen_tokens')
                .update({ status: 'collected' })
                .eq('id', tokenId);

              if (error) throw error;
              fetchReadyTokens();
            } catch (error: any) {
              console.error('Error marking as collected:', error);
              Alert.alert('Error', error.message || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const renderToken = ({ item, index }: { item: ReadyToken; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => markAsCollected(item.id, item.token_number)}
      >
        <GlassCard style={styles.tokenCard}>
          <View style={styles.tokenContent}>
            <View style={styles.tokenLeft}>
              <View
                style={[
                  styles.tokenBadge,
                  {
                    backgroundColor: colors.inputBackground,
                    borderWidth: colors.borderWidth,
                    borderColor: colors.success,
                  },
                ]}
              >
                <Text style={[styles.tokenNumber, { color: colors.success }]}>
                  #{item.token_number}
                </Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                  {item.profiles.full_name}
                </Text>
                <View style={styles.timeRow}>
                  <FontAwesome5 name="clock" size={11} color={colors.textMuted} />
                  <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {new Date(item.created_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.tokenRight}>
              <Text style={[styles.amount, { color: colors.textSecondary }]}>
                ₹{item.total_amount}
              </Text>
              <View
                style={[
                  styles.checkButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderWidth: colors.borderWidth,
                    borderColor: colors.success,
                  },
                ]}
              >
                <FontAwesome5 name="check" size={18} color={colors.success} />
              </View>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Ready Orders</Text>
          <TouchableOpacity onPress={fetchReadyTokens} style={styles.refreshButton}>
            <Ionicons name="refresh" size={22} color={colors.success} />
          </TouchableOpacity>
        </View>

        {/* Count Badge */}
        {readyTokens.length > 0 && (
          <View style={styles.countContainer}>
            <GlassCard style={styles.countCard}>
              <FontAwesome5 name="receipt" size={24} color={colors.success} />
              <Text style={[styles.countText, { color: colors.textPrimary }]}>
                {readyTokens.length} {readyTokens.length === 1 ? 'order' : 'orders'} ready
              </Text>
            </GlassCard>
          </View>
        )}

        {/* Ready Tokens Grid */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          </View>
        ) : readyTokens.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="check-circle" size={64} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              All caught up!
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              No orders ready for pickup
            </Text>
          </View>
        ) : (
          <FlatList
            data={readyTokens}
            renderItem={renderToken}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 110 }
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.success} />
            }
          />
        )}

        {/* Instructions */}
        {readyTokens.length > 0 && (
          <View
            style={[
              styles.instructions,
              {
                backgroundColor: colors.inputBackground,
                borderWidth: colors.borderWidth,
                borderColor: colors.info,
              },
            ]}
          >
            <FontAwesome5 name="info-circle" size={14} color={colors.info} />
            <Text style={[styles.instructionText, { color: colors.info }]}>
              Tap on a token to mark it as collected
            </Text>
          </View>
        )}
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
  countContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  countCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  countText: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  tokenCard: {
    padding: 16,
    marginBottom: 12,
  },
  tokenContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
  },
  tokenRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 10,
  },
  instructionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
