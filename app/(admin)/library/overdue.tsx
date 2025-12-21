import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

interface OverdueBook {
  id: string; book_id: string; user_id: string; due_date: string; days_overdue: number; fine_amount: number;
  book?: { title: string; }; users?: { full_name: string; email: string; phone: string; };
}

export default function LibraryOverdueScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>([]);

  const fetchOverdueBooks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('book_issues').select('*, book:books(title), users(full_name,email,phone)')
        .eq('status', 'issued').lt('due_date', new Date().toISOString()).order('due_date');
      if (error) throw error;
      const withFines = (data || []).map((d: any) => {
        const daysOverdue = Math.floor((Date.now() - new Date(d.due_date).getTime()) / (1000 * 60 * 60 * 24));
        return { ...d, days_overdue: daysOverdue, fine_amount: daysOverdue * 5 };
      });
      setOverdueBooks(withFines);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch overdue books');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchOverdueBooks(); setLoading(false); };
    load();
  }, [fetchOverdueBooks]);

  const onRefresh = async () => { setRefreshing(true); await fetchOverdueBooks(); setRefreshing(false); };

  const sendReminder = (book: OverdueBook) => {
    Alert.alert('Send Reminder', `Send overdue reminder to ${book.users?.full_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: () => Alert.alert('Success', 'Reminder sent successfully') },
    ]);
  };

  const totalFines = overdueBooks.reduce((sum, b) => sum + b.fine_amount, 0);

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><ActivityIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.MANAGE_LIBRARY} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Overdue Books</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{overdueBooks.length} books</Text>
        </View>
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { borderLeftColor: colors.error, borderLeftWidth: 4 }]}>
            <Text style={[styles.statValue, { color: colors.error }]}>₹{totalFines}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Fines</Text>
          </Card>
          <Card style={[styles.statCard, { borderLeftColor: colors.warning, borderLeftWidth: 4 }]}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{overdueBooks.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
          </Card>
        </View>
        {overdueBooks.map((book, i) => (
          <Animated.View key={book.id} entering={FadeInDown.delay(i * 30).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.icon, { backgroundColor: withAlpha(colors.error, 0.125) }]}>
                  <FontAwesome5 name="exclamation-triangle" size={24} color={colors.error} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>{book.book?.title}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{book.users?.full_name}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: withAlpha(colors.error, 0.125) }]}>
                  <Text style={[styles.badgeText, { color: colors.error }]}>{book.days_overdue}d</Text>
                </View>
              </View>
              <View style={[styles.details, { borderBottomColor: withAlpha(colors.textPrimary, 0.1) }]}>
                <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Due Date:</Text>
                  <Text style={[styles.value, { color: colors.error }]}>{new Date(book.due_date).toLocaleDateString()}</Text></View>
                <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Fine:</Text>
                  <Text style={[styles.value, { color: colors.error }]}>₹{book.fine_amount}</Text></View>
              </View>
              <View style={styles.contact}>
                {book.users?.phone && (
                  <View style={styles.contactRow}>
                    <FontAwesome5 name="phone" size={14} color={colors.textSecondary} />
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>{book.users.phone}</Text>
                  </View>
                )}
                {book.users?.email && (
                  <View style={styles.contactRow}>
                    <FontAwesome5 name="envelope" size={14} color={colors.textSecondary} />
                    <Text style={[styles.contactText, { color: colors.textSecondary }]}>{book.users.email}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => sendReminder(book)} style={[styles.reminderButton, { backgroundColor: colors.warning }]}>
                <FontAwesome5 name="bell" size={16} color={colors.textInverse} />
                <Text style={[styles.reminderText, { color: colors.textInverse }]}>Send Reminder</Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        ))}
        {overdueBooks.length === 0 && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="check-circle" size={48} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.success }]}>No overdue books!</Text>
          </Card>
        )}
      </ScrollView>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 }, subtitle: { fontSize: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  icon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 }, bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  badgeText: { fontSize: 16, fontWeight: 'bold' },
  details: { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14 }, value: { fontSize: 14, fontWeight: '600' },
  contact: { marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  contactText: { fontSize: 14 },
  reminderButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
  reminderText: { color: 'transparent', fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
});
