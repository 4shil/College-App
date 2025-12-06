import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

const { width } = Dimensions.get('window');

interface LibraryStats {
  totalBooks: number;
  totalIssued: number;
  totalReturned: number;
  totalOverdue: number;
  totalFines: number;
  popularBooks: Array<{ title: string; issueCount: number; }>;
}

export default function LibraryReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const fetchStats = useCallback(async () => {
    try {
      const [booksRes, issuesRes] = await Promise.all([
        supabase.from('books').select('*'),
        supabase.from('book_issues').select('*, book:books(title)'),
      ]);
      if (booksRes.error) throw booksRes.error;
      if (issuesRes.error) throw issuesRes.error;

      const books = booksRes.data || [];
      const issues = issuesRes.data || [];

      const totalIssued = issues.filter((i: any) => i.status === 'issued').length;
      const totalReturned = issues.filter((i: any) => i.status === 'returned').length;
      const overdue = issues.filter((i: any) => i.status === 'issued' && new Date(i.due_date) < new Date()).length;
      const totalFines = issues.filter((i: any) => i.status === 'returned' && i.fine_amount > 0).reduce((sum: number, i: any) => sum + i.fine_amount, 0);

      const bookCounts: any = {};
      issues.forEach((i: any) => {
        const title = i.book?.title || 'Unknown';
        bookCounts[title] = (bookCounts[title] || 0) + 1;
      });
      const popularBooks = Object.entries(bookCounts).map(([title, count]) => ({ title, issueCount: count as number }))
        .sort((a, b) => b.issueCount - a.issueCount).slice(0, 5);

      setStats({ totalBooks: books.length, totalIssued, totalReturned, totalOverdue: overdue, totalFines, popularBooks });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [timeframe]);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchStats(); setLoading(false); };
    load();
  }, [fetchStats]);

  const onRefresh = async () => { setRefreshing(true); await fetchStats(); setRefreshing(false); };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><ActivityIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.MANAGE_LIBRARY} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Library Reports</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Circulation analytics</Text>
        </View>
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Timeframe</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker selectedValue={timeframe} onValueChange={(value) => setTimeframe(value as any)} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
              <Picker.Item label="All Time" value="all" />
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="Last 7 Days" value="week" />
              <Picker.Item label="Last 30 Days" value="month" />
            </Picker>
          </View>
        </Card>
        {stats && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 12 }]}>Overview</Text>
            <View style={styles.statsGrid}>
              <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.statCardWrapper}>
                <Card style={[styles.statCard, { borderLeftColor: colors.primary, borderLeftWidth: 4 }]}>
                  <FontAwesome5 name="book" size={24} color={colors.primary} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalBooks}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Books</Text>
                </Card>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.statCardWrapper}>
                <Card style={[styles.statCard, { borderLeftColor: colors.warning, borderLeftWidth: 4 }]}>
                  <FontAwesome5 name="book-open" size={24} color={colors.warning} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalIssued}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Issued</Text>
                </Card>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statCardWrapper}>
                <Card style={[styles.statCard, { borderLeftColor: colors.success, borderLeftWidth: 4 }]}>
                  <FontAwesome5 name="check-circle" size={24} color={colors.success} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalReturned}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Returned</Text>
                </Card>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.statCardWrapper}>
                <Card style={[styles.statCard, { borderLeftColor: colors.error, borderLeftWidth: 4 }]}>
                  <FontAwesome5 name="exclamation-triangle" size={24} color={colors.error} />
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.totalOverdue}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
                </Card>
              </Animated.View>
            </View>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Card style={[styles.statCard, { marginTop: 12 }]}>
                <FontAwesome5 name="rupee-sign" size={24} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>₹{stats.totalFines}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Fines Collected</Text>
              </Card>
            </Animated.View>
            {stats.popularBooks.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>Popular Books</Text>
                {stats.popularBooks.map((book, i) => (
                  <Animated.View key={i} entering={FadeInDown.delay(250 + i * 50).springify()}>
                    <Card style={styles.bookCard}>
                      <View style={[styles.rank, { backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : colors.primary }]}>
                        <Text style={styles.rankText}>{i + 1}</Text>
                      </View>
                      <View style={styles.bookInfo}>
                        <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>{book.title}</Text>
                        <Text style={[styles.bookMeta, { color: colors.textSecondary }]}>{book.issueCount} issues</Text>
                      </View>
                    </Card>
                  </Animated.View>
                ))}
              </>
            )}
          </>
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
  card: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginTop: 8 },
  picker: { height: 50 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCardWrapper: { width: (width - 52) / 2 },
  statCard: { padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12 },
  bookCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 8 },
  rank: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rankText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  bookMeta: { fontSize: 14 },
});
