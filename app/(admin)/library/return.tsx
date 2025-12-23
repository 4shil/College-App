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
import { withAlpha } from '../../../theme/colorUtils';

interface BookReturn {
  id: string; book_id: string; user_id: string; issue_date: string; due_date: string; fine_amount: number;
  book?: { title: string; isbn: string; }; users?: { full_name: string; };
}

export default function LibraryReturnScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issues, setIssues] = useState<BookReturn[]>([]);

  const fetchIssues = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('book_issues').select('*, book:books(title,isbn), users(full_name)')
        .eq('status', 'issued').order('due_date');
      if (error) throw error;
      const withFines = (data || []).map((d: any) => ({
        ...d,
        fine_amount: new Date(d.due_date) < new Date() 
          ? Math.max(0, Math.floor((Date.now() - new Date(d.due_date).getTime()) / (1000 * 60 * 60 * 24)) * 5)
          : 0
      }));
      setIssues(withFines);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch issued books');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchIssues(); setLoading(false); };
    load();
  }, [fetchIssues]);

  const onRefresh = async () => { setRefreshing(true); await fetchIssues(); setRefreshing(false); };

  const handleReturn = async (issue: BookReturn) => {
    Alert.alert('Return Book', `Return "${issue.book?.title}"?${issue.fine_amount > 0 ? `\n\nFine: ₹${issue.fine_amount}` : ''}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Return', onPress: async () => {
        try {
          const returnDate = new Date();
          const { error: updateError } = await supabase.from('book_issues').update({
            status: 'returned', return_date: returnDate.toISOString(), fine_amount: issue.fine_amount,
            returned_to: (await supabase.auth.getUser()).data.user?.id
          }).eq('id', issue.id);
          if (updateError) throw updateError;
          const { error: bookError } = await supabase.rpc('increment_available_copies', { book_id: issue.book_id });
          if (bookError) throw bookError;
          Alert.alert('Success', 'Book returned successfully');
          await fetchIssues();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><LoadingIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.ISSUE_RETURN_BOOKS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.header}>
          <View><Text style={[styles.title, { color: colors.textPrimary }]}>Return Books</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{issues.length} books to return</Text></View>
        </View>
        {issues.map((issue, i) => {
          const isOverdue = new Date(issue.due_date) < new Date();
          return (
            <Animated.View key={issue.id} entering={FadeInDown.delay(i * 30).springify()}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.bookIcon,
                      {
                        backgroundColor: isOverdue
                          ? withAlpha(colors.error, 0.125)
                          : withAlpha(colors.success, 0.125),
                      },
                    ]}
                  >
                    <FontAwesome5 name="book-open" size={20} color={isOverdue ? colors.error : colors.success} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>{issue.book?.title}</Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]}>{issue.users?.full_name}</Text>
                  </View>
                  {isOverdue && (
                    <View style={[styles.badge, { backgroundColor: colors.error }]}>
                      <Text style={[styles.badgeText, { color: colors.textInverse }]}>Overdue</Text>
                    </View>
                  )}
                </View>
                <View style={styles.details}>
                  <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Issue Date:</Text>
                    <Text style={[styles.value, { color: colors.textPrimary }]}>{new Date(issue.issue_date).toLocaleDateString()}</Text></View>
                  <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Due Date:</Text>
                    <Text style={[styles.value, { color: isOverdue ? colors.error : colors.textPrimary }]}>{new Date(issue.due_date).toLocaleDateString()}</Text></View>
                  {issue.fine_amount > 0 && (
                    <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Fine:</Text>
                      <Text style={[styles.value, { color: colors.error }]}>₹{issue.fine_amount}</Text></View>
                  )}
                </View>
                <TouchableOpacity onPress={() => handleReturn(issue)} style={[styles.returnButton, { backgroundColor: colors.success }]}>
                  <FontAwesome5 name="check" size={16} color={colors.textInverse} />
                  <Text style={[styles.returnText, { color: colors.textInverse }]}>Return Book</Text>
                </TouchableOpacity>
              </Card>
            </Animated.View>
          );
        })}
        {issues.length === 0 && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="check-circle" size={48} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending returns</Text>
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
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  bookIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 }, bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  details: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14 }, value: { fontSize: 14, fontWeight: '600' },
  returnButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
  returnText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
});
