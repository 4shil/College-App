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

interface Program {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  program_type: 'undergraduate' | 'postgraduate';
  duration_years: number;
  total_semesters: number;
  is_active: boolean;
  department_id: string;
  department: {
    name: string;
    code: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formProgramType, setFormProgramType] = useState<'undergraduate' | 'postgraduate'>('undergraduate');
  const [formDuration, setFormDuration] = useState('3');
  const [formSemesters, setFormSemesters] = useState('6');

  const fetchData = async () => {
    try {
      const [programsRes, deptsRes] = await Promise.all([
        supabase
          .from('programs')
          .select(`
            *,
            department:departments(name, code)
          `)
          .order('name'),
        supabase.from('departments').select('id, name, code').eq('is_active', true).order('name'),
      ]);

      if (programsRes.error) throw programsRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setPrograms(programsRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch programs');
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormShortName('');
    setFormDeptId('');
    setFormProgramType('undergraduate');
    setFormDuration('3');
    setFormSemesters('6');
    setEditingProgram(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (program: Program) => {
    setFormName(program.name);
    setFormCode(program.code);
    setFormShortName(program.short_name || '');
    setFormDeptId(program.department_id);
    setFormProgramType(program.program_type);
    setFormDuration(program.duration_years.toString());
    setFormSemesters(program.total_semesters.toString());
    setEditingProgram(program);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim() || !formDeptId) {
      Alert.alert('Validation Error', 'Name, Code, and Department are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        short_name: formShortName.trim() || null,
        department_id: formDeptId,
        program_type: formProgramType,
        duration_years: parseInt(formDuration),
        total_semesters: parseInt(formSemesters),
      };

      if (editingProgram) {
        const { error } = await supabase.from('programs').update(payload).eq('id', editingProgram.id);
        if (error) throw error;
        Alert.alert('Success', 'Program updated successfully');
      } else {
        const { error } = await supabase.from('programs').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Success', 'Program created successfully');
      }

      setShowAddModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving program:', error);
      Alert.alert('Error', error.message || 'Failed to save program');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (program: Program) => {
    try {
      const { error } = await supabase
        .from('programs')
        .update({ is_active: !program.is_active })
        .eq('id', program.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error toggling program:', error);
      Alert.alert('Error', 'Failed to update program');
    }
  };

  const handleDelete = (program: Program) => {
    Alert.alert(
      'Delete Program',
      `Are you sure you want to delete ${program.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('programs').delete().eq('id', program.id);
              if (error) throw error;
              Alert.alert('Success', 'Program deleted');
              await fetchData();
            } catch (error) {
              console.error('Error deleting program:', error);
              Alert.alert('Error', 'Failed to delete program. It may have associated students or subjects.');
            }
          },
        },
      ]
    );
  };

  const renderProgramCard = (program: Program, index: number) => (
    <Animated.View
      key={program.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <Card style={styles.courseCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: program.is_active ? '#10b98120' : '#6b728020' }]}>
            <FontAwesome5 name="graduation-cap" size={20} color={program.is_active ? '#10b981' : '#6b7280'} />
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>{program.name}</Text>
              {!program.is_active && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>Inactive</Text>
                </View>
              )}
            </View>
            <Text style={[styles.courseCode, { color: colors.primary }]}>{program.code}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={[styles.detailBadge, { backgroundColor: '#6366f120' }]}>
            <FontAwesome5 name="building" size={10} color="#6366f1" />
            <Text style={[styles.detailText, { color: '#6366f1' }]}>{program.department?.code || 'N/A'}</Text>
          </View>
          <View style={[styles.detailBadge, { backgroundColor: program.program_type === 'postgraduate' ? '#ec489920' : '#10b98120' }]}>
            <FontAwesome5 name="award" size={10} color={program.program_type === 'postgraduate' ? '#ec4899' : '#10b981'} />
            <Text style={[styles.detailText, { color: program.program_type === 'postgraduate' ? '#ec4899' : '#10b981' }]}>
              {program.program_type === 'postgraduate' ? 'PG' : 'UG'}
            </Text>
          </View>
          <View style={[styles.detailBadge, { backgroundColor: '#f59e0b20' }]}>
            <FontAwesome5 name="clock" size={10} color="#f59e0b" />
            <Text style={[styles.detailText, { color: '#f59e0b' }]}>{program.duration_years} Years</Text>
          </View>
          <View style={[styles.detailBadge, { backgroundColor: '#8b5cf620' }]}>
            <FontAwesome5 name="layer-group" size={10} color="#8b5cf6" />
            <Text style={[styles.detailText, { color: '#8b5cf6' }]}>{program.total_semesters} Sems</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
            onPress={() => openEditModal(program)}
          >
            <FontAwesome5 name="edit" size={12} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: program.is_active ? '#f59e0b15' : '#10b98115' }]}
            onPress={() => handleToggleActive(program)}
          >
            <FontAwesome5 name={program.is_active ? 'ban' : 'check'} size={12} color={program.is_active ? '#f59e0b' : '#10b981'} />
            <Text style={[styles.actionBtnText, { color: program.is_active ? '#f59e0b' : '#10b981' }]}>
              {program.is_active ? 'Disable' : 'Enable'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef444415' }]}
            onPress={() => handleDelete(program)}
          >
            <FontAwesome5 name="trash" size={12} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Programs</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{programs.length} program(s)</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
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
          ) : programs.length > 0 ? (
            programs.map((program, index) => renderProgramCard(program, index))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="graduation-cap" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Programs</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add your first program</Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingProgram ? 'Edit Program' : 'Add Program'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Program Name *</Text>
                  <GlassInput placeholder="e.g., Bachelor of Commerce" value={formName} onChangeText={setFormName} autoCapitalize="words" />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Code *</Text>
                    <GlassInput placeholder="e.g., BCOM" value={formCode} onChangeText={setFormCode} autoCapitalize="characters" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Short Name</Text>
                    <GlassInput placeholder="e.g., B.Com" value={formShortName} onChangeText={setFormShortName} />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Department *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker selectedValue={formDeptId} onValueChange={setFormDeptId} style={{ color: colors.textPrimary }}>
                      <Picker.Item label="Select Department" value="" />
                      {departments.map((dept) => (
                        <Picker.Item key={dept.id} label={`${dept.name} (${dept.code})`} value={dept.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Program Type *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker selectedValue={formProgramType} onValueChange={(v) => setFormProgramType(v as 'undergraduate' | 'postgraduate')} style={{ color: colors.textPrimary }}>
                      <Picker.Item label="Undergraduate (UG)" value="undergraduate" />
                      <Picker.Item label="Postgraduate (PG)" value="postgraduate" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Duration (Years)</Text>
                    <GlassInput placeholder="3" value={formDuration} onChangeText={setFormDuration} keyboardType="numeric" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Semesters</Text>
                    <GlassInput placeholder="6" value={formSemesters} onChangeText={setFormSemesters} keyboardType="numeric" />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.glassBorder }]} onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <PrimaryButton
                  title={saving ? 'Saving...' : editingProgram ? 'Update' : 'Create'}
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
  courseCard: { padding: 16 },
  cardHeader: { flexDirection: 'row' },
  iconContainer: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseName: { fontSize: 16, fontWeight: '600' },
  inactiveBadge: { backgroundColor: '#ef444420', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  inactiveText: { fontSize: 10, fontWeight: '600', color: '#ef4444' },
  courseCode: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  detailsRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  detailBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6 },
  detailText: { fontSize: 11, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 12 },
  pickerContainer: { borderRadius: 12, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
