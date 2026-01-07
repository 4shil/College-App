import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { withAlpha } from '../../../theme/colorUtils';

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CanteenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menu, setMenu] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    const date = todayISO();

    const { data: menuRows, error: menuError } = await supabase
      .from('canteen_daily_menu')
      .select('id, date, quantity_available, is_sold_out, items:canteen_menu_items!canteen_daily_menu_menu_item_id_fkey(name, category, price, is_veg)')
      .eq('date', date)
      .order('id');

    if (menuError) {
      console.log('Canteen menu error:', menuError.message);
      setMenu([]);
    } else {
      setMenu(menuRows || []);
    }

    if (!user?.id) {
      setTokens([]);
      return;
    }

    const { data: tokenRows, error: tokenError } = await supabase
      .from('canteen_tokens')
      .select('id, token_number, date, total_amount, status, pickup_time')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (tokenError) {
      console.log('Canteen tokens error:', tokenError.message);
      setTokens([]);
    } else {
      setTokens(tokenRows || []);
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

  const subtitle = useMemo(() => {
    const count = menu.length;
    if (count === 0) return 'No menu for today';
    return `${count} items today`;
  }, [menu.length]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Canteen</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading canteen...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today’s Menu</Text>
            {menu.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No menu posted</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>The canteen can publish today’s items.</Text>
              </Card>
            ) : (
              <Card>
                {menu.map((m: any, idx: number) => {
                  const item = m.items;
                  const soldOut = Boolean(m.is_sold_out);
                  const chipBg = soldOut ? withAlpha(colors.error, 0.12) : withAlpha(colors.success, 0.12);
                  const chipText = soldOut ? colors.error : colors.success;

                  return (
                    <View key={m.id} style={[styles.menuRow, idx < menu.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }] }>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.menuTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                          {item?.name || 'Item'}
                        </Text>
                        <Text style={[styles.menuMeta, { color: colors.textMuted }]} numberOfLines={1}>
                          {item?.category ? String(item.category) : 'Food'} • ₹{String(item?.price || '0')}
                          {item?.is_veg ? ' • Veg' : ' • Non-veg'}
                        </Text>
                      </View>
                      <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
                        <Text style={[styles.statusText, { color: chipText }]}>{soldOut ? 'SOLD OUT' : 'AVAILABLE'}</Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 18 }]}>My Tokens</Text>
            {tokens.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No tokens</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Your token history will show here.</Text>
              </Card>
            ) : (
              <Card>
                {tokens.map((t: any, idx: number) => (
                  <View key={t.id} style={[styles.tokenRow, idx < tokens.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }] }>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tokenTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        Token {t.token_number}
                      </Text>
                      <Text style={[styles.tokenMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {String(t.date)} • ₹{String(t.total_amount)} • {String(t.status).toUpperCase()}
                      </Text>
                    </View>
                    <Ionicons name="receipt-outline" size={18} color={colors.textMuted} />
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
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  menuMeta: {
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
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  tokenTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  tokenMeta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '700',
  },
});
