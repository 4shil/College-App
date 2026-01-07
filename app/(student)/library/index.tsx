import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';
import { useAuthStore } from '../../../store/authStore';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [myIssues, setMyIssues] = useState<any[]>([]);

  const fetchAll = useCallback(async () => {
    setError(null);

    const { data: bookRows, error: bookError } = await supabase
      .from('books')
      .select('id, title, author, category, total_copies, available_copies, shelf_location')
      .eq('is_active', true)
      .order('title', { ascending: true })
      .limit(200);

    if (bookError) {
      console.log('Library books error:', bookError.message);
      setError('Failed to load library');
      setBooks([]);
    } else {
      setBooks(bookRows || []);
    }

    if (!user?.id) {
      setMyIssues([]);
      return;
    }

    const { data: issues, error: issueError } = await supabase
      .from('book_issues')
      .select('id, due_date, status, fine_amount, fine_paid, books:book_id(title, author)')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })
      .limit(10);

    if (issueError) {
      console.log('Library issues error:', issueError.message);
      setMyIssues([]);
    } else {
      setMyIssues(issues || []);
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

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) =>
      String(b.title || '').toLowerCase().includes(q) ||
      String(b.author || '').toLowerCase().includes(q) ||
      String(b.category || '').toLowerCase().includes(q)
    );
  }, [books, search]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Library</Text>
          <View style={{ width: 28 }} />
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <LoadingIndicator />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading library...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            <View style={[styles.searchBar, { borderColor: colors.glassBorder, backgroundColor: withAlpha(colors.textPrimary, 0.05) }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search title, author, category"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }]}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Borrowed Books</Text>
            {myIssues.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No active issues</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Issued books will show here.</Text>
              </Card>
            ) : (
              <Card>
                {myIssues.map((i: any, idx: number) => (
                  <View key={i.id} style={[styles.issueRow, idx < myIssues.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.glassBorder }] }>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.issueTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {i.books?.title || 'Book'}
                      </Text>
                      <Text style={[styles.issueMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        Due: {String(i.due_date)} • {String(i.status).toUpperCase()}
                      </Text>
                    </View>
                    {Number(i.fine_amount || 0) > 0 ? (
                      <View style={[styles.fineChip, { backgroundColor: withAlpha(colors.warning, 0.12) }]}>
                        <Text style={[styles.fineText, { color: colors.warning }]}>₹{String(i.fine_amount)}</Text>
                      </View>
                    ) : null}
                  </View>
                ))}
              </Card>
            )}

            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 18 }]}>Books</Text>
            {filteredBooks.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No matches</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Try a different search.</Text>
              </Card>
            ) : (
              filteredBooks.slice(0, 40).map((b: any) => {
                const available = Number(b.available_copies || 0);
                const chipBg = available > 0 ? withAlpha(colors.success, 0.12) : withAlpha(colors.error, 0.12);
                const chipText = available > 0 ? colors.success : colors.error;
                return (
                  <View key={b.id} style={{ marginBottom: 12 }}>
                    <Card>
                      <View style={styles.bookRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.bookTitle, { color: colors.textPrimary }]} numberOfLines={1}>{b.title}</Text>
                          <Text style={[styles.bookMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                            {b.author || 'Unknown author'}{b.category ? ` • ${b.category}` : ''}
                          </Text>
                          {b.shelf_location ? (
                            <Text style={[styles.bookMeta, { color: colors.textMuted }]} numberOfLines={1}>Shelf: {b.shelf_location}</Text>
                          ) : null}
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                          <View style={[styles.availChip, { backgroundColor: chipBg }]}>
                            <Text style={[styles.availText, { color: chipText }]}>{available > 0 ? 'AVAILABLE' : 'OUT'}</Text>
                          </View>
                          <Text style={[styles.copiesText, { color: colors.textMuted }]}>
                            {available}/{Number(b.total_copies || 0)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </View>
                );
              })
            )}

            {error && (
              <Card style={{ marginTop: 8, backgroundColor: withAlpha(colors.error, 0.1) }}>
                <Text style={{ color: colors.error }}>{error}</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
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
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  issueTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  issueMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  fineChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  fineText: {
    fontSize: 11,
    fontWeight: '900',
  },
  bookRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  bookMeta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  availChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  availText: {
    fontSize: 10,
    fontWeight: '900',
  },
  copiesText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
