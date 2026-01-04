import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AnimatedBackground, Card, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

interface Reservation {
  id: string; book_id: string; user_id: string; reservation_date: string; status: string;
  book?: { title: string; }; users?: { full_name: string; };
}

export default function LibraryReservationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [resRes, booksRes, usersRes] = await Promise.all([
        supabase.from('book_reservations').select('*, book:books(title), profiles(full_name)').eq('status', 'pending').order('reservation_date'),
        supabase.from('books').select('id, title').eq('is_active', true),
        supabase.from('profiles').select('id, full_name').eq('status', 'active'),
      ]);
      if (resRes.error) throw resRes.error;
      if (booksRes.error) throw booksRes.error;
      if (usersRes.error) throw usersRes.error;
      setReservations(resRes.data || []);
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
    setShowModal(true);
  };

  const handleReserve = async () => {
    if (!selectedBookId || !selectedUserId) {
      Alert.alert('Error', 'Please select book and user');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('book_reservations').insert([{
        book_id: selectedBookId, user_id: selectedUserId, reservation_date: new Date().toISOString(), status: 'pending'
      }]);
      if (error) throw error;
      Alert.alert('Success', 'Book reserved successfully');
      setShowModal(false);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (res: Reservation) => {
    Alert.alert('Cancel Reservation', 'Cancel this reservation?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        try {
          const { error } = await supabase.from('book_reservations').update({ status: 'cancelled' }).eq('id', res.id);
          if (error) throw error;
          Alert.alert('Success', 'Reservation cancelled');
          await fetchData();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><LoadingIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.MANAGE_LIBRARY} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.header}>
          <View><Text style={[styles.title, { color: colors.textPrimary }]}>Reservations</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{reservations.length} pending</Text></View>
          <SolidButton onPress={openModal} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="plus" size={18} color={colors.textInverse} />
          </SolidButton>
        </View>
        {reservations.map((res, i) => (
          <Animated.View key={res.id} entering={FadeInDown.delay(i * 30).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.icon, { backgroundColor: withAlpha(colors.warning, 0.125) }]}>
                  <FontAwesome5 name="bookmark" size={20} color={colors.warning} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.title2, { color: colors.textPrimary }]}>{res.book?.title}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{res.users?.full_name}</Text>
                </View>
              </View>
              <View style={styles.details}>
                <Text style={[styles.date, { color: colors.textSecondary }]}>
                  Reserved: {new Date(res.reservation_date).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleCancel(res)} style={[styles.cancelButton, { borderColor: colors.error }]}>
                <FontAwesome5 name="times" size={16} color={colors.error} />
                <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        ))}
        {reservations.length === 0 && (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="bookmark" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reservations</Text>
          </Card>
        )}
      </ScrollView>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: modalBackdropColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reserve Book</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select Book *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={selectedBookId} onValueChange={setSelectedBookId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select Book" value="" />
                  {books.map(b => <Picker.Item key={b.id} label={b.title} value={b.id} />)}
                </Picker>
              </View>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select User *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={selectedUserId} onValueChange={setSelectedUserId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select User" value="" />
                  {users.map(u => <Picker.Item key={u.id} label={u.full_name} value={u.id} />)}
                </Picker>
              </View>
              <PrimaryButton title="Reserve Book" onPress={handleReserve} loading={saving} style={{ marginTop: 16 }} />
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
  icon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 }, title2: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14 }, details: { marginBottom: 12 },
  date: { fontSize: 14 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  cancelText: { fontSize: 14, fontWeight: '600' },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  modalContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  picker: { height: 50 },
});
