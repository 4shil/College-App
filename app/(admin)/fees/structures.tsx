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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

interface FeeStructure {
  id: string;
  name: string;
  academic_year_id: string;
  department_id: string;
  year_id: string;
  semester_id: string;
  tuition_fee: number;
  exam_fee: number;
  lab_fee: number;
  library_fee: number;
  sports_fee: number;
  other_fee: number;
  due_date: string;
  is_active: boolean;
  academic_year?: { year: string };
  department?: { name: string };
  year_level?: { level: number };
  semester?: { semester_number: number };
}

interface Department {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  year: string;
}

interface YearLevel {
  id: string;
  level: number;
}

interface Semester {
  id: string;
  semester_number: number;
}

export default function FeeStructuresScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [years, setYears] = useState<YearLevel[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);

  const [formName, setFormName] = useState('');
  const [formAcademicYearId, setFormAcademicYearId] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formYearId, setFormYearId] = useState('');
  const [formSemesterId, setFormSemesterId] = useState('');
  const [formTuitionFee, setFormTuitionFee] = useState('');
  const [formExamFee, setFormExamFee] = useState('');
  const [formLabFee, setFormLabFee] = useState('');
  const [formLibraryFee, setFormLibraryFee] = useState('');
  const [formSportsFee, setFormSportsFee] = useState('');
  const [formOtherFee, setFormOtherFee] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [structuresRes, deptRes, yearsRes, yearLevelsRes, semestersRes] = await Promise.all([
        supabase
          .from('fee_structures')
          .select(`
            *,
            academic_year:academic_years(year),
            department:departments(name),
            year_level:years(level),
            semester:semesters(semester_number)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('departments').select('*').eq('is_active', true),
        supabase.from('academic_years').select('*').eq('is_active', true),
        supabase.from('years').select('*').eq('is_active', true).order('level'),
        supabase.from('semesters').select('*').eq('is_active', true).order('semester_number'),
      ]);

      if (structuresRes.error) throw structuresRes.error;
      if (deptRes.error) throw deptRes.error;
      if (yearsRes.error) throw yearsRes.error;
      if (yearLevelsRes.error) throw yearLevelsRes.error;
      if (semestersRes.error) throw semestersRes.error;

      setStructures(structuresRes.data || []);
      setDepartments(deptRes.data || []);
      setAcademicYears(yearsRes.data || []);
      setYears(yearLevelsRes.data || []);
      setSemesters(semestersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch fee structures');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openAddModal = () => {
    resetForm();
    setEditingStructure(null);
    setShowModal(true);
  };

  const openEditModal = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setFormName(structure.name);
    setFormAcademicYearId(structure.academic_year_id);
    setFormDepartmentId(structure.department_id);
    setFormYearId(structure.year_id);
    setFormSemesterId(structure.semester_id);
    setFormTuitionFee(structure.tuition_fee.toString());
    setFormExamFee(structure.exam_fee.toString());
    setFormLabFee(structure.lab_fee.toString());
    setFormLibraryFee(structure.library_fee.toString());
    setFormSportsFee(structure.sports_fee.toString());
    setFormOtherFee(structure.other_fee.toString());
    setFormDueDate(structure.due_date);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormAcademicYearId('');
    setFormDepartmentId('');
    setFormYearId('');
    setFormSemesterId('');
    setFormTuitionFee('0');
    setFormExamFee('0');
    setFormLabFee('0');
    setFormLibraryFee('0');
    setFormSportsFee('0');
    setFormOtherFee('0');
    setFormDueDate('');
  };

  const handleSave = async () => {
    if (!formName.trim() || !formAcademicYearId || !formDepartmentId || !formYearId || !formSemesterId || !formDueDate) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const structureData = {
        name: formName.trim(),
        academic_year_id: formAcademicYearId,
        department_id: formDepartmentId,
        year_id: formYearId,
        semester_id: formSemesterId,
        tuition_fee: parseFloat(formTuitionFee) || 0,
        exam_fee: parseFloat(formExamFee) || 0,
        lab_fee: parseFloat(formLabFee) || 0,
        library_fee: parseFloat(formLibraryFee) || 0,
        sports_fee: parseFloat(formSportsFee) || 0,
        other_fee: parseFloat(formOtherFee) || 0,
        due_date: formDueDate,
        is_active: true,
      };

      let error;
      if (editingStructure) {
        const res = await supabase.from('fee_structures').update(structureData).eq('id', editingStructure.id);
        error = res.error;
      } else {
        const res = await supabase.from('fee_structures').insert([structureData]);
        error = res.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Fee structure ${editingStructure ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving structure:', error);
      Alert.alert('Error', error.message || 'Failed to save fee structure');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (structure: FeeStructure) => {
    Alert.alert('Confirm Delete', `Delete fee structure "${structure.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase.from('fee_structures').delete().eq('id', structure.id);
            if (error) throw error;
            Alert.alert('Success', 'Fee structure deleted');
            await fetchData();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const getTotalFee = (structure: FeeStructure) => {
    return structure.tuition_fee + structure.exam_fee + structure.lab_fee + 
           structure.library_fee + structure.sports_fee + structure.other_fee;
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
    <Restricted permissions={PERMISSIONS.MANAGE_FEE_STRUCTURES} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Fee Structures</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{structures.length} structures</Text>
          </View>
          <TouchableOpacity
            onPress={openAddModal}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <FontAwesome5 name="plus" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {structures.map((structure, index) => (
          <Animated.View key={structure.id} entering={FadeInDown.delay(index * 50).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.structureName, { color: colors.textPrimary }]}>{structure.name}</Text>
                  <Text style={[styles.structureMeta, { color: colors.textSecondary }]}>
                    {structure.department?.name} • Year {structure.year_level?.level} • Sem {structure.semester?.semester_number}
                  </Text>
                </View>
                {structure.is_active && (
                  <View style={[styles.badge, { backgroundColor: colors.success }]}>
                    <Text style={[styles.badgeText, { color: colors.textInverse }]}>Active</Text>
                  </View>
                )}
              </View>

              <View style={styles.feeBreakdown}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Tuition:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{structure.tuition_fee}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Exam:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{structure.exam_fee}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Lab:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{structure.lab_fee}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Library:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{structure.library_fee}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Sports:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{structure.sports_fee}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>Other:</Text>
                  <Text style={[styles.feeValue, { color: colors.textPrimary }]}>₹{structure.other_fee}</Text>
                </View>
              </View>

              <View style={[styles.totalRow, { borderTopColor: colors.cardBorder }]}>
                <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total Fee:</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>₹{getTotalFee(structure)}</Text>
              </View>

              <View style={styles.actions}>
                <Text style={[styles.dueDate, { color: colors.textSecondary }]}>
                  Due: {new Date(structure.due_date).toLocaleDateString()}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => openEditModal(structure)} style={styles.actionButton}>
                    <FontAwesome5 name="edit" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(structure)} style={styles.actionButton}>
                    <FontAwesome5 name="trash" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: modalBackdropColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingStructure ? 'Edit' : 'Create'} Fee Structure
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <GlassInput placeholder="e.g., CSE Year 1 Sem 1 Fees" value={formName} onChangeText={setFormName} />

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Academic Year *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={formAcademicYearId} onValueChange={setFormAcademicYearId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select Year" value="" />
                  {academicYears.map(y => <Picker.Item key={y.id} label={y.year} value={y.id} />)}
                </Picker>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Department *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={formDepartmentId} onValueChange={setFormDepartmentId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select Department" value="" />
                  {departments.map(d => <Picker.Item key={d.id} label={d.name} value={d.id} />)}
                </Picker>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Year Level *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={formYearId} onValueChange={setFormYearId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select Year" value="" />
                  {years.map(y => <Picker.Item key={y.id} label={`Year ${y.level}`} value={y.id} />)}
                </Picker>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Semester *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={formSemesterId} onValueChange={setFormSemesterId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select Semester" value="" />
                  {semesters.map(s => <Picker.Item key={s.id} label={`Semester ${s.semester_number}`} value={s.id} />)}
                </Picker>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Fee Components</Text>
              <GlassInput placeholder="Tuition Fee" value={formTuitionFee} onChangeText={setFormTuitionFee} keyboardType="numeric" />
              <GlassInput placeholder="Exam Fee" value={formExamFee} onChangeText={setFormExamFee} keyboardType="numeric" />
              <GlassInput placeholder="Lab Fee" value={formLabFee} onChangeText={setFormLabFee} keyboardType="numeric" />
              <GlassInput placeholder="Library Fee" value={formLibraryFee} onChangeText={setFormLibraryFee} keyboardType="numeric" />
              <GlassInput placeholder="Sports Fee" value={formSportsFee} onChangeText={setFormSportsFee} keyboardType="numeric" />
              <GlassInput placeholder="Other Fee" value={formOtherFee} onChangeText={setFormOtherFee} keyboardType="numeric" />
              <GlassInput placeholder="Due Date (YYYY-MM-DD)" value={formDueDate} onChangeText={setFormDueDate} />

              <PrimaryButton title={editingStructure ? 'Update' : 'Create'} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  addButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardInfo: { flex: 1 },
  structureName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  structureMeta: { fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: 'transparent', fontSize: 12, fontWeight: '600' },
  feeBreakdown: { marginBottom: 12 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  feeLabel: { fontSize: 14 },
  feeValue: { fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginBottom: 12, borderTopWidth: 1 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueDate: { fontSize: 14 },
  actionButtons: { flexDirection: 'row', gap: 16 },
  actionButton: { padding: 8 },
  modalContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  picker: { height: 50 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
});
