import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface Book { id: string; title: string; isbn: string; available_copies: number; }
interface User { id: string; full_name: string; }
interface BookIssue {
  id: string; book_id: string; user_id: string; issue_date: string; due_date: string; status: string;
  book?: Book; users?: User;
}

export default function LibraryIssueScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [daysCount, setDaysCount] = useState('14');

  const fetchData = useCallback(async () => {
    try {
      const [issuesRes, booksRes, usersRes] = await Promise.all([
        supabase.from('book_issues').select('*, book:books(id,title,isbn,available_copies), users(id,full_name)').eq('status', 'issued').order('issue_date', { ascending: false }),
        supabase.from('books').select('id, title, isbn, available_copies').gt('available_copies', 0).eq('is_active', true),
        supabase.from('users').select('id, full_name').eq('is_active', true),
      ]);
      if (issuesRes.error) throw issuesRes.error;
      if (booksRes.error) throw booksRes.error;
      if (usersRes.error) throw usersRes.error;
      setIssues(issuesRes.data || []);
      setBooks(booksRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch data');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchData(); setLoading(false); };
    load();
  }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const openModal = () => {
    setSelectedBookId('');
    setSelectedUserId('');
    setDaysCount('14');
    setShowModal(true);
  };

  const handleIssue = async () => {
    if (!selectedBookId || !selectedUserId) {
      Alert.alert('Error', 'Please select book and user');
      return;
    }
    setSaving(true);
    try {
      const issueDate = new Date();
      const dueDate = new Date(issueDate.getTime() + parseInt(daysCount) * 24 * 60 * 60 * 1000);
      const { error: issueError } = await supabase.from('book_issues').insert([{
        book_id: selectedBookId, user_id: selectedUserId, issue_date: issueDate.toISOString(),
        due_date: dueDate.toISOString(), status: 'issued', issued_by: (await supabase.auth.getUser()).data.user?.id
      }]);
      if (issueError) throw issueError;
      const book = books.find(b => b.id === selectedBookId);
      if (book) {
        const { error: updateError } = await supabase.from('books').update({ available_copies: book.available_copies - 1 }).eq('id', selectedBookId);
        if (updateError) throw updateError;
      }
      Alert.alert('Success', 'Book issued successfully');
      setShowModal(false);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><ActivityIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.header}>
          <View><Text style={[styles.title, { color: colors.textPrimary }]}>Issue Books</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{issues.length} active issues</Text></View>
          <TouchableOpacity onPress={openModal} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        {issues.map((issue, i) => (
          <Animated.View key={issue.id} entering={FadeInDown.delay(i * 30).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.bookIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <FontAwesome5 name="book-open" size={20} color={colors.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>{issue.book?.title}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{issue.users?.full_name}</Text>
                </View>
              </View>
              <View style={styles.details}>
                <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Issue Date:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{new Date(issue.issue_date).toLocaleDateString()}</Text></View>
                <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Due Date:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{new Date(issue.due_date).toLocaleDateString()}</Text></View>
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Issue Book</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select Book *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={selectedBookId} onValueChange={setSelectedBookId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select Book" value="" />
                  {books.map(b => <Picker.Item key={b.id} label={`${b.title} (${b.available_copies} available)`} value={b.id} />)}
                </Picker>
              </View>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select User *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={selectedUserId} onValueChange={setSelectedUserId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select User" value="" />
                  {users.map(u => <Picker.Item key={u.id} label={u.full_name} value={u.id} />)}
                </Picker>
              </View>
              <GlassInput placeholder="Days (default: 14)" value={daysCount} onChangeText={setDaysCount} keyboardType="numeric" />
              <PrimaryButton title="Issue Book" onPress={handleIssue} loading={saving} style={{ marginTop: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
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
  info: { flex: 1 }, bookTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14 }, details: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14 }, value: { fontSize: 14, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  picker: { height: 50 },
});
