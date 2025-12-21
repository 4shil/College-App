import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { withAlpha } from '../../../../theme/colorUtils';
import { supabase } from '../../../../lib/supabase';

interface Batch {
  id: string;
  batch_name: string;
  academic_year_id: string;
  department_id: string;
  year_id: string;
  section_id: string | null;
  start_year: number;
  end_year: number;
  is_active: boolean;
  student_count?: number;
  academic_year?: { year: string };
  department?: { name: string; code: string };
  year?: { year_name: string };
  section?: { section_name: string };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AcademicYear {
  id: string;
  year: string;
  is_current: boolean;
}

interface Year {
  id: string;
  year_name: string;
}

interface Section {
  id: string;
  section_name: string;
}

export default function BatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAcademicYearId, setFormAcademicYearId] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formYearId, setFormYearId] = useState('');
  const [formSectionId, setFormSectionId] = useState('');
  const [formStartYear, setFormStartYear] = useState(new Date().getFullYear().toString());
  const [formEndYear, setFormEndYear] = useState((new Date().getFullYear() + 3).toString());

  const fetchData = useCallback(async () => {
    try {
      const [batchesRes, deptsRes, yearsRes, academicYearsRes, sectionsRes] = await Promise.all([
        supabase
          .from('batches')
          .select(`
            *,
            academic_year:academic_years(year),
            department:departments(name, code),
            year:years(year_name),
            section:sections(section_name)
          `)
          .eq('is_active', true)
          .order('batch_name'),
        supabase.from('departments').select('*').eq('is_active', true).order('name'),
        supabase.from('years').select('*').eq('is_active', true).order('year_number'),
        supabase.from('academic_years').select('*').eq('is_active', true).order('year', { ascending: false }),
        supabase.from('sections').select('*').eq('is_active', true).order('section_name'),
      ]);

      if (batchesRes.error) throw batchesRes.error;
      if (deptsRes.error) throw deptsRes.error;
      if (yearsRes.error) throw yearsRes.error;
      if (academicYearsRes.error) throw academicYearsRes.error;
      if (sectionsRes.error) throw sectionsRes.error;

      // Get student counts for each batch
      const batchesWithCounts = await Promise.all(
        (batchesRes.data || []).map(async (batch: any) => {
          const { count } = await supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('batch_id', batch.id)
            .eq('is_active', true);
          return { ...batch, student_count: count || 0 };
        })
      );

      setBatches(batchesWithCounts);
      setDepartments(deptsRes.data || []);
      setYears(yearsRes.data || []);
      setAcademicYears(academicYearsRes.data || []);
      setSections(sectionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch batches');
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [fetchData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openAddModal = () => {
    resetForm();
    setEditingBatch(null);
    setShowAddModal(true);
  };

  const openEditModal = (batch: Batch) => {
    setEditingBatch(batch);
    setFormName(batch.batch_name);
    setFormAcademicYearId(batch.academic_year_id);
    setFormDeptId(batch.department_id);
    setFormYearId(batch.year_id);
    setFormSectionId(batch.section_id || '');
    setFormStartYear(batch.start_year.toString());
    setFormEndYear(batch.end_year.toString());
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormAcademicYearId('');
    setFormDeptId('');
    setFormYearId('');
    setFormSectionId('');
    setFormStartYear(new Date().getFullYear().toString());
    setFormEndYear((new Date().getFullYear() + 3).toString());
  };

  const handleSave = async () => {
    if (!formName.trim() || !formAcademicYearId || !formDeptId || !formYearId) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const batchData = {
        batch_name: formName.trim(),
        academic_year_id: formAcademicYearId,
        department_id: formDeptId,
        year_id: formYearId,
        section_id: formSectionId || null,
        start_year: parseInt(formStartYear),
        end_year: parseInt(formEndYear),
        is_active: true,
      };

      let error;
      if (editingBatch) {
        const res = await supabase.from('batches').update(batchData).eq('id', editingBatch.id);
        error = res.error;
      } else {
        const res = await supabase.from('batches').insert([batchData]);
        error = res.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Batch ${editingBatch ? 'updated' : 'created'} successfully`);
      setShowAddModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving batch:', error);
      Alert.alert('Error', error.message || 'Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (batch: Batch) => {
    if (batch.student_count && batch.student_count > 0) {
      Alert.alert(
        'Cannot Delete',
        `This batch has ${batch.student_count} students assigned. Please reassign or remove them first.`
      );
      return;
    }

    Alert.alert('Confirm Delete', `Delete batch "${batch.batch_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase
              .from('batches')
              .update({ is_active: false })
              .eq('id', batch.id);

            if (error) throw error;

            Alert.alert('Success', 'Batch deleted successfully');
            await fetchData();
          } catch (error: any) {
            console.error('Error deleting batch:', error);
            Alert.alert('Error', error.message || 'Failed to delete batch');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Student Batches</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {batches.length} active batches
            </Text>
          </View>
          <TouchableOpacity
            onPress={openAddModal}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="plus" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Batches List */}
        {batches.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="users-cog" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No batches yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first batch to get started
            </Text>
          </Card>
        ) : (
          batches.map((batch, index) => (
            <Animated.View key={batch.id} entering={FadeInDown.delay(index * 50).springify()}>
              <Card style={styles.batchCard}>
                <View style={styles.batchHeader}>
                  <View style={[styles.batchIcon, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
                    <FontAwesome5 name="users-cog" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.batchInfo}>
                    <Text style={[styles.batchName, { color: colors.textPrimary }]}>{batch.batch_name}</Text>
                    <Text style={[styles.batchMeta, { color: colors.textSecondary }]}>
                      {batch.department?.name} • {batch.year?.year_name}
                      {batch.section && ` • Section ${batch.section.section_name}`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.batchDetails, { borderColor: withAlpha(colors.textPrimary, isDark ? 0.12 : 0.1) }]}>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      {batch.start_year} - {batch.end_year}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="user-graduate" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      {batch.student_count || 0} students
                    </Text>
                  </View>
                </View>

                <View style={styles.batchActions}>
                  <TouchableOpacity
                    onPress={() => openEditModal(batch)}
                    style={[styles.actionButton, { opacity: saving ? 0.5 : 1 }]}
                    activeOpacity={0.7}
                    disabled={saving}
                  >
                    <FontAwesome5 name="edit" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(batch)}
                    style={[styles.actionButton, { opacity: saving ? 0.5 : 1 }]}
                    activeOpacity={0.7}
                    disabled={saving}
                  >
                    <FontAwesome5 name="trash" size={16} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: withAlpha(colors.shadowColor, 0.5) }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingBatch ? 'Edit Batch' : 'Create New Batch'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <GlassInput
                placeholder="e.g., BCA 2024 Batch A"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Academic Year *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={formAcademicYearId}
                  onValueChange={setFormAcademicYearId}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="Select Academic Year" value="" />
                  {academicYears.map(year => (
                    <Picker.Item key={year.id} label={year.year} value={year.id} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Department *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={formDeptId}
                  onValueChange={setFormDeptId}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="Select Department" value="" />
                  {departments.map(dept => (
                    <Picker.Item key={dept.id} label={`${dept.code} - ${dept.name}`} value={dept.id} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Year *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={formYearId}
                  onValueChange={setFormYearId}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="Select Year" value="" />
                  {years.map(year => (
                    <Picker.Item key={year.id} label={year.year_name} value={year.id} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Section (Optional)</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={formSectionId}
                  onValueChange={setFormSectionId}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="No Section" value="" />
                  {sections.map(section => (
                    <Picker.Item key={section.id} label={section.section_name} value={section.id} />
                  ))}
                </Picker>
              </View>

              <View style={styles.yearRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <GlassInput
                    placeholder="2024"
                    value={formStartYear}
                    onChangeText={setFormStartYear}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <GlassInput
                    placeholder="2027"
                    value={formEndYear}
                    onChangeText={setFormEndYear}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <PrimaryButton
                title={editingBatch ? 'Update Batch' : 'Create Batch'}
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  batchCard: {
    padding: 16,
    marginBottom: 16,
  },
  batchHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  batchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  batchInfo: {
    flex: 1,
  },
  batchName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  batchMeta: {
    fontSize: 14,
  },
  batchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  batchActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  yearRow: {
    flexDirection: 'row',
  },
});
