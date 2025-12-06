import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Year {
  id: string;
  year_number: number;
  name: string;
}

interface Semester {
  id: string;
  semester_number: number;
  name: string;
  year_id: string;
  is_active: boolean;
  created_at: string;
  year?: {
    year_number: number;
    name: string;
  };
  courses_count?: number;
}

export default function SemestersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formSemesterNumber, setFormSemesterNumber] = useState('');
  const [formName, setFormName] = useState('');
  const [formYearId, setFormYearId] = useState('');

  const fetchData = async () => {
    try {
      const [semestersRes, yearsRes] = await Promise.all([
        supabase
          .from('semesters')
          .select(`
            *,
            year:years(year_number, name)
          `)
          .eq('is_active', true)
          .order('semester_number'),
        supabase.from('years').select('id, year_number, name').eq('is_active', true).order('year_number'),
      ]);

      if (semestersRes.error) throw semestersRes.error;
      if (yearsRes.error) throw yearsRes.error;

      // Fetch course counts
      const semestersWithCounts = await Promise.all(
        (semestersRes.data || []).map(async (sem: Semester) => {
          const { count } = await supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .eq('semester_id', sem.id);
          return {
            ...sem,
            courses_count: count || 0,
          };
        })
      );

      setSemesters(semestersWithCounts);
      setYears(yearsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch semesters');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('semesters-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'semesters' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredSemesters = selectedYear === 'all'
    ? semesters
    : semesters.filter(s => s.year_id === selectedYear);

  const resetForm = () => {
    setFormSemesterNumber('');
    setFormName('');
    setFormYearId('');
    setEditingSemester(null);
  };

  const openAddModal = () => {
    resetForm();
    // Auto-suggest next semester number
    const maxSem = semesters.reduce((max, s) => Math.max(max, s.semester_number), 0);
    const nextSem = maxSem + 1;
    setFormSemesterNumber(nextSem.toString());
    setFormName(`Semester ${nextSem}`);
    setShowAddModal(true);
  };

  const openEditModal = (semester: Semester) => {
    setFormSemesterNumber(semester.semester_number.toString());
    setFormName(semester.name);
    setFormYearId(semester.year_id);
    setEditingSemester(semester);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    const semNum = parseInt(formSemesterNumber);
    if (!semNum || semNum < 1 || semNum > 8) {
      Alert.alert('Validation Error', 'Semester number must be between 1 and 8');
      return;
    }
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Semester name is required');
      return;
    }
    if (!formYearId) {
      Alert.alert('Validation Error', 'Please select a year');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        semester_number: semNum,
        name: formName.trim(),
        year_id: formYearId,
      };

      if (editingSemester) {
        const { error } = await supabase.from('semesters').update(payload).eq('id', editingSemester.id);
        if (error) throw error;
        Alert.alert('Success', 'Semester updated successfully');
      } else {
        const { error } = await supabase.from('semesters').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Success', 'Semester created successfully');
      }

      setShowAddModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving semester:', error);
      Alert.alert('Error', error.message || 'Failed to save semester');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (semester: Semester) => {
    try {
      const { error } = await supabase
        .from('semesters')
        .update({ is_active: !semester.is_active })
        .eq('id', semester.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error toggling semester:', error);
      Alert.alert('Error', 'Failed to update semester');
    }
  };

  const handleDelete = (semester: Semester) => {
    if (semester.courses_count && semester.courses_count > 0) {
      Alert.alert('Cannot Delete', `This semester has ${semester.courses_count} courses. Remove courses first.`);
      return;
    }

    Alert.alert(
      'Delete Semester',
      `Are you sure you want to delete ${semester.name}? This will deactivate it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('semesters')
                .update({ is_active: false })
                .eq('id', semester.id);
              if (error) throw error;
              Alert.alert('Success', 'Semester deactivated');
              await fetchData();
            } catch (error: any) {
              console.error('Error deleting semester:', error);
              Alert.alert('Error', error.message || 'Failed to delete semester');
            }
          },
        },
      ]
    );
  };

  const getSemesterColor = (num: number): string => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'];
    return colors[(num - 1) % colors.length];
  };

  const renderSemesterCard = (semester: Semester, index: number) => {
    const color = getSemesterColor(semester.semester_number);

    return (
      <Animated.View
        key={semester.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <Card style={styles.semesterCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: semester.is_active ? color + '20' : '#6b728020' }]}>
              <Text style={[styles.semNumber, { color: semester.is_active ? color : '#6b7280' }]}>
                S{semester.semester_number}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.semName, { color: colors.textPrimary }]}>{semester.name}</Text>
                {!semester.is_active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.semSubtitle, { color: colors.textSecondary }]}>
                {semester.year?.name || 'No Year Assigned'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: '#6366f120' }]}>
              <FontAwesome5 name="book" size={12} color="#6366f1" />
              <Text style={[styles.statText, { color: '#6366f1' }]}>
                {semester.courses_count || 0} Subjects
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: color + '20' }]}>
              <FontAwesome5 name="layer-group" size={12} color={color} />
              <Text style={[styles.statText, { color }]}>
                Year {semester.year?.year_number || '-'}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={() => openEditModal(semester)}
            >
              <FontAwesome5 name="edit" size={12} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: semester.is_active ? '#f59e0b15' : '#10b98115' }]}
              onPress={() => handleToggleActive(semester)}
            >
              <FontAwesome5 name={semester.is_active ? 'ban' : 'check'} size={12} color={semester.is_active ? '#f59e0b' : '#10b981'} />
              <Text style={[styles.actionBtnText, { color: semester.is_active ? '#f59e0b' : '#10b981' }]}>
                {semester.is_active ? 'Disable' : 'Enable'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#ef444415' }]}
              onPress={() => handleDelete(semester)}
            >
              <FontAwesome5 name="trash" size={12} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Semesters</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{filteredSemesters.length} semester(s)</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Year Filter */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filterContainer}>
          <View style={[styles.filterPicker, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={setSelectedYear}
              style={{ color: colors.textPrimary }}
            >
              <Picker.Item label="All Years" value="all" />
              {years.map((year) => (
                <Picker.Item key={year.id} label={year.name} value={year.id} />
              ))}
            </Picker>
          </View>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredSemesters.length > 0 ? (
            filteredSemesters.map((semester, index) => renderSemesterCard(semester, index))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="calendar-alt" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Semesters</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add academic semesters</Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingSemester ? 'Edit Semester' : 'Add Semester'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Semester Number *</Text>
                <GlassInput
                  placeholder="e.g., 1, 2, 3..."
                  value={formSemesterNumber}
                  onChangeText={(v) => {
                    setFormSemesterNumber(v);
                    const num = parseInt(v);
                    if (num >= 1 && num <= 8) {
                      setFormName(`Semester ${num}`);
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Display Name *</Text>
                <GlassInput
                  placeholder="e.g., Semester 1"
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Academic Year *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Picker
                    selectedValue={formYearId}
                    onValueChange={setFormYearId}
                    style={{ color: colors.textPrimary }}
                  >
                    <Picker.Item label="Select Year" value="" />
                    {years.map((year) => (
                      <Picker.Item key={year.id} label={year.name} value={year.id} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.glassBorder }]} onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <PrimaryButton
                  title={saving ? 'Saving...' : editingSemester ? 'Update' : 'Create'}
                  onPress={handleSave}
                  disabled={saving}
                  style={styles.saveBtn}
                />
              </View>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filterContainer: { paddingHorizontal: 20, marginBottom: 10 },
  filterPicker: { borderRadius: 12, overflow: 'hidden' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  cardWrapper: { marginBottom: 14 },
  semesterCard: { padding: 16 },
  cardHeader: { flexDirection: 'row' },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  semNumber: { fontSize: 18, fontWeight: '800' },
  cardInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  semName: { fontSize: 18, fontWeight: '600' },
  inactiveBadge: { backgroundColor: '#ef444420', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  inactiveText: { fontSize: 10, fontWeight: '600', color: '#ef4444' },
  semSubtitle: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  statBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 8 },
  statText: { fontSize: 12, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  pickerContainer: { borderRadius: 12, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
