import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  total_copies: number;
  available_copies: number;
  shelf_location: string;
  is_active: boolean;
}

export default function LibraryBooksScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formISBN, setFormISBN] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formPublisher, setFormPublisher] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCopies, setFormCopies] = useState('');
  const [formShelf, setFormShelf] = useState('');

  const fetchBooks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('books').select('*').order('title');
      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch books');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchBooks(); setLoading(false); };
    load();
  }, [fetchBooks]);

  const onRefresh = async () => { setRefreshing(true); await fetchBooks(); setRefreshing(false); };

  const openAddModal = () => {
    setEditingBook(null);
    setFormISBN(''); setFormTitle(''); setFormAuthor(''); setFormPublisher('');
    setFormCategory(''); setFormCopies(''); setFormShelf('');
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormISBN(book.isbn); setFormTitle(book.title); setFormAuthor(book.author);
    setFormPublisher(book.publisher); setFormCategory(book.category);
    setFormCopies(book.total_copies.toString()); setFormShelf(book.shelf_location);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formISBN || !formTitle || !formAuthor) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }
    setSaving(true);
    try {
      const data = { isbn: formISBN, title: formTitle, author: formAuthor, publisher: formPublisher,
        category: formCategory, total_copies: parseInt(formCopies) || 1,
        available_copies: parseInt(formCopies) || 1, shelf_location: formShelf, is_active: true };
      const { error } = editingBook
        ? await supabase.from('books').update(data).eq('id', editingBook.id)
        : await supabase.from('books').insert([data]);
      if (error) throw error;
      Alert.alert('Success', `Book ${editingBook ? 'updated' : 'added'}`);
      setShowModal(false);
      await fetchBooks();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (book: Book) => {
    Alert.alert('Delete Book', `Delete "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('books').delete().eq('id', book.id);
          if (error) throw error;
          Alert.alert('Success', 'Book deleted');
          await fetchBooks();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><LoadingIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.MANAGE_BOOKS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.header}>
          <View><Text style={[styles.title, { color: colors.textPrimary }]}>Library Books</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{books.length} books</Text></View>
          <SolidButton onPress={openAddModal} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="plus" size={18} color={colors.textInverse} />
          </SolidButton>
        </View>
        {books.map((book, i) => (
          <Animated.View key={book.id} entering={FadeInDown.delay(i * 30).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.bookIcon, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
                  <FontAwesome5 name="book" size={20} color={colors.primary} />
                </View>
                <View style={styles.bookInfo}>
                  <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>{book.title}</Text>
                  <Text style={[styles.bookMeta, { color: colors.textSecondary }]}>{book.author} • {book.isbn}</Text>
                </View>
              </View>
              <View style={styles.bookDetails}>
                <View style={styles.detailRow}><Text style={[styles.label, { color: colors.textSecondary }]}>Publisher:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{book.publisher}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.label, { color: colors.textSecondary }]}>Category:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{book.category}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.label, { color: colors.textSecondary }]}>Copies:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{book.available_copies}/{book.total_copies}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.label, { color: colors.textSecondary }]}>Shelf:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{book.shelf_location}</Text></View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEditModal(book)}><FontAwesome5 name="edit" size={16} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(book)}><FontAwesome5 name="trash" size={16} color={colors.error} /></TouchableOpacity>
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: modalBackdropColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{editingBook ? 'Edit' : 'Add'} Book</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            <ScrollView>
              <GlassInput placeholder="ISBN *" value={formISBN} onChangeText={setFormISBN} />
              <GlassInput placeholder="Title *" value={formTitle} onChangeText={setFormTitle} />
              <GlassInput placeholder="Author *" value={formAuthor} onChangeText={setFormAuthor} />
              <GlassInput placeholder="Publisher" value={formPublisher} onChangeText={setFormPublisher} />
              <GlassInput placeholder="Category" value={formCategory} onChangeText={setFormCategory} />
              <GlassInput placeholder="Total Copies" value={formCopies} onChangeText={setFormCopies} keyboardType="numeric" />
              <GlassInput placeholder="Shelf Location" value={formShelf} onChangeText={setFormShelf} />
              <PrimaryButton title={editingBook ? 'Update' : 'Add'} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 }, subtitle: { fontSize: 16 },
  addButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  bookIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bookInfo: { flex: 1 }, bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  bookMeta: { fontSize: 14 }, bookDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14 }, value: { fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
});
