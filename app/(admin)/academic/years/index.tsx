import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { withAlpha } from '../../../../theme/colorUtils';
import { supabase } from '../../../../lib/supabase';

interface Year {
  id: string;
  year_number: number;
  name: string;
  is_active: boolean;
  created_at: string;
  students_count?: number;
  semesters_count?: number;
}

export default function YearsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [years, setYears] = useState<Year[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingYear, setEditingYear] = useState<Year | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formYearNumber, setFormYearNumber] = useState('');
  const [formName, setFormName] = useState('');

  const fetchYears = async () => {
    try {
      const { data: yearsData, error } = await supabase
        .from('years')
        .select('*')
        .eq('is_active', true)
        .order('year_number');

      if (error) throw error;

      // Fetch counts for each year
      const yearsWithCounts = await Promise.all(
        (yearsData || []).map(async (year: Year) => {
          const [studentsRes, semestersRes] = await Promise.all([
            supabase.from('students').select('id', { count: 'exact', head: true }).eq('year_id', year.id),
            supabase.from('semesters').select('id', { count: 'exact', head: true }).eq('year_id', year.id),
          ]);
          return {
            ...year,
            students_count: studentsRes.count || 0,
            semesters_count: semestersRes.count || 0,
          };
        })
      );

      setYears(yearsWithCounts);
    } catch (error) {
      console.error('Error fetching years:', error);
      Alert.alert('Error', 'Failed to fetch years');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchYears();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('years-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'years' },
        () => fetchYears()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchYears();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormYearNumber('');
    setFormName('');
    setEditingYear(null);
  };

  const openAddModal = () => {
    resetForm();
    // Auto-suggest next year number
    const maxYear = years.reduce((max, y) => Math.max(max, y.year_number), 0);
    const nextYear = maxYear + 1;
    setFormYearNumber(nextYear.toString());
    setFormName(getYearName(nextYear));
    setShowAddModal(true);
  };

  const getYearName = (num: number): string => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const suffix = num <= 3 ? suffixes[num] : suffixes[0];
    return `${num}${suffix} Year`;
  };

  const openEditModal = (year: Year) => {
    setFormYearNumber(year.year_number.toString());
    setFormName(year.name);
    setEditingYear(year);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    const yearNum = parseInt(formYearNumber);
    if (!yearNum || yearNum < 1 || yearNum > 6) {
      Alert.alert('Validation Error', 'Year number must be between 1 and 6');
      return;
    }
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Year name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        year_number: yearNum,
        name: formName.trim(),
      };

      if (editingYear) {
        const { error } = await supabase.from('years').update(payload).eq('id', editingYear.id);
        if (error) throw error;
        Alert.alert('Success', 'Year updated successfully');
      } else {
        const { error } = await supabase.from('years').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Success', 'Year created successfully');
      }

      setShowAddModal(false);
      resetForm();
      await fetchYears();
    } catch (error: any) {
      console.error('Error saving year:', error);
      Alert.alert('Error', error.message || 'Failed to save year');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (year: Year) => {
    try {
      const { error } = await supabase
        .from('years')
        .update({ is_active: !year.is_active })
        .eq('id', year.id);

      if (error) throw error;
      await fetchYears();
    } catch (error) {
      console.error('Error toggling year:', error);
      Alert.alert('Error', 'Failed to update year');
    }
  };

  const handleDelete = (year: Year) => {
    if (year.students_count && year.students_count > 0) {
      Alert.alert('Cannot Delete', `This year has ${year.students_count} students. Remove or reassign students first.`);
      return;
    }

    Alert.alert(
      'Delete Year',
      `Are you sure you want to delete ${year.name}? This will deactivate it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('years')
                .update({ is_active: false })
                .eq('id', year.id);
              if (error) throw error;
              Alert.alert('Success', 'Year deactivated');
              await fetchYears();
            } catch (error: any) {
              console.error('Error deleting year:', error);
              Alert.alert('Error', error.message || 'Failed to delete year');
            }
          },
        },
      ]
    );
  };

  const renderYearCard = (year: Year, index: number) => {
    const yearColors = [colors.primary, colors.success, colors.warning, colors.error, colors.info, colors.primary];
    const color = yearColors[(year.year_number - 1) % yearColors.length];

    return (
      <Animated.View
        key={year.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <Card style={styles.yearCard}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: year.is_active
                    ? withAlpha(color, 0.125)
                    : withAlpha(colors.textMuted, 0.125),
                },
              ]}
            >
              <Text style={[styles.yearNumber, { color: year.is_active ? color : colors.textMuted }]}>
                {year.year_number}
              </Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.yearName, { color: colors.textPrimary }]}>{year.name}</Text>
                {!year.is_active && (
                  <View style={[styles.inactiveBadge, { backgroundColor: withAlpha(colors.error, 0.125) }]}>
                    <Text style={[styles.inactiveText, { color: colors.error }]}>Inactive</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.yearSubtitle, { color: colors.textSecondary }]}>
                Academic Year {year.year_number}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
              <FontAwesome5 name="user-graduate" size={12} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.primary }]}>
                {year.students_count || 0} Students
              </Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: withAlpha(colors.success, 0.125) }]}>
              <FontAwesome5 name="calendar-alt" size={12} color={colors.success} />
              <Text style={[styles.statText, { color: colors.success }]}>
                {year.semesters_count || 0} Semesters
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: withAlpha(colors.primary, 0.08) }]}
              onPress={() => openEditModal(year)}
            >
              <FontAwesome5 name="edit" size={12} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: year.is_active ? withAlpha(colors.warning, 0.08) : withAlpha(colors.success, 0.08) },
              ]}
              onPress={() => handleToggleActive(year)}
            >
              <FontAwesome5
                name={year.is_active ? 'ban' : 'check'}
                size={12}
                color={year.is_active ? colors.warning : colors.success}
              />
              <Text style={[styles.actionBtnText, { color: year.is_active ? colors.warning : colors.success }]}>
                {year.is_active ? 'Disable' : 'Enable'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: withAlpha(colors.error, 0.08) }]}
              onPress={() => handleDelete(year)}
            >
              <FontAwesome5 name="trash" size={12} color={colors.error} />
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Academic Years</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{years.length} year(s)</Text>
          </View>
          <SolidButton style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={22} color={colors.textInverse} />
          </SolidButton>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" color={colors.primary} />
            </View>
          ) : years.length > 0 ? (
            years.map((year, index) => renderYearCard(year, index))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="layer-group" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Years</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add academic years</Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingYear ? 'Edit Year' : 'Add Year'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Year Number *</Text>
                <GlassInput
                  placeholder="e.g., 1, 2, 3, 4"
                  value={formYearNumber}
                  onChangeText={(v) => {
                    setFormYearNumber(v);
                    const num = parseInt(v);
                    if (num >= 1 && num <= 6) {
                      setFormName(getYearName(num));
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Display Name *</Text>
                <GlassInput
                  placeholder="e.g., 1st Year"
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.glassBorder }]} onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <PrimaryButton
                  title={saving ? 'Saving...' : editingYear ? 'Update' : 'Create'}
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  cardWrapper: { marginBottom: 14 },
  yearCard: { padding: 16 },
  cardHeader: { flexDirection: 'row' },
  iconContainer: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  yearNumber: { fontSize: 24, fontWeight: '800' },
  cardInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearName: { fontSize: 18, fontWeight: '600' },
  inactiveBadge: { backgroundColor: 'transparent', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  inactiveText: { fontSize: 10, fontWeight: '600' },
  yearSubtitle: { fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  statBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 8 },
  statText: { fontSize: 12, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
