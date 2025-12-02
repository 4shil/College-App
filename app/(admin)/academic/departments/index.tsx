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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  students_count?: number;
  teachers_count?: number;
}

export default function DepartmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchDepartments = async () => {
    try {
      // Fetch departments
      const { data: depts, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;

      // Fetch counts for each department
      const deptsWithCounts = await Promise.all(
        (depts || []).map(async (dept: Department) => {
          const [studentsRes, teachersRes] = await Promise.all([
            supabase.from('students').select('id', { count: 'exact', head: true }).eq('department_id', dept.id),
            supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('department_id', dept.id),
          ]);
          return {
            ...dept,
            students_count: studentsRes.count || 0,
            teachers_count: teachersRes.count || 0,
          };
        })
      );

      setDepartments(deptsWithCounts);
    } catch (error) {
      console.error('Error fetching departments:', error);
      Alert.alert('Error', 'Failed to fetch departments');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchDepartments();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
  };

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormDescription('');
    setEditingDept(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (dept: Department) => {
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormDescription(dept.description || '');
    setEditingDept(dept);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) {
      Alert.alert('Validation Error', 'Name and Code are required');
      return;
    }

    setSaving(true);
    try {
      if (editingDept) {
        // Update existing
        const { error } = await supabase
          .from('departments')
          .update({
            name: formName.trim(),
            code: formCode.trim().toUpperCase(),
            description: formDescription.trim() || null,
          })
          .eq('id', editingDept.id);

        if (error) throw error;
        Alert.alert('Success', 'Department updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('departments')
          .insert({
            name: formName.trim(),
            code: formCode.trim().toUpperCase(),
            description: formDescription.trim() || null,
            is_active: true,
          });

        if (error) throw error;
        Alert.alert('Success', 'Department created successfully');
      }

      setShowAddModal(false);
      resetForm();
      await fetchDepartments();
    } catch (error: any) {
      console.error('Error saving department:', error);
      Alert.alert('Error', error.message || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = (dept: Department) => {
    Alert.alert(
      dept.is_active ? 'Deactivate Department' : 'Activate Department',
      `Are you sure you want to ${dept.is_active ? 'deactivate' : 'activate'} ${dept.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('departments')
                .update({ is_active: !dept.is_active })
                .eq('id', dept.id);

              if (error) throw error;
              await fetchDepartments();
            } catch (error) {
              console.error('Error toggling department:', error);
              Alert.alert('Error', 'Failed to update department');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (dept: Department) => {
    if (dept.students_count || dept.teachers_count) {
      Alert.alert('Cannot Delete', 'This department has students or teachers assigned. Remove them first.');
      return;
    }

    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete ${dept.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('departments')
                .delete()
                .eq('id', dept.id);

              if (error) throw error;
              Alert.alert('Success', 'Department deleted');
              await fetchDepartments();
            } catch (error) {
              console.error('Error deleting department:', error);
              Alert.alert('Error', 'Failed to delete department');
            }
          },
        },
      ]
    );
  };

  const renderDepartmentCard = (dept: Department, index: number) => (
    <Animated.View
      key={dept.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <Card style={styles.deptCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: dept.is_active ? '#6366f120' : '#6b728020' }]}>
            <FontAwesome5 name="building" size={22} color={dept.is_active ? '#6366f1' : '#6b7280'} />
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.deptName, { color: colors.textPrimary }]}>{dept.name}</Text>
              {!dept.is_active && (
                <View style={[styles.inactiveBadge]}>
                  <Text style={styles.inactiveText}>Inactive</Text>
                </View>
              )}
            </View>
            <Text style={[styles.deptCode, { color: colors.primary }]}>{dept.code}</Text>
            {dept.description && (
              <Text style={[styles.deptDesc, { color: colors.textMuted }]} numberOfLines={2}>
                {dept.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBadge, { backgroundColor: '#10b98120' }]}>
            <FontAwesome5 name="user-graduate" size={12} color="#10b981" />
            <Text style={[styles.statText, { color: '#10b981' }]}>{dept.students_count || 0} Students</Text>
          </View>
          <View style={[styles.statBadge, { backgroundColor: '#3b82f620' }]}>
            <FontAwesome5 name="chalkboard-teacher" size={12} color="#3b82f6" />
            <Text style={[styles.statText, { color: '#3b82f6' }]}>{dept.teachers_count || 0} Teachers</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
            onPress={() => openEditModal(dept)}
          >
            <FontAwesome5 name="edit" size={12} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: dept.is_active ? '#f59e0b15' : '#10b98115' }]}
            onPress={() => handleToggleActive(dept)}
          >
            <FontAwesome5 name={dept.is_active ? 'ban' : 'check'} size={12} color={dept.is_active ? '#f59e0b' : '#10b981'} />
            <Text style={[styles.actionBtnText, { color: dept.is_active ? '#f59e0b' : '#10b981' }]}>
              {dept.is_active ? 'Disable' : 'Enable'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef444415' }]}
            onPress={() => handleDelete(dept)}
          >
            <FontAwesome5 name="trash" size={12} color="#ef4444" />
            <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Departments</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {departments.length} department(s)
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={openAddModal}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : departments.length > 0 ? (
            departments.map((dept, index) => renderDepartmentCard(dept, index))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="building" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Departments</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Add your first department to get started
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingDept ? 'Edit Department' : 'Add Department'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Department Name *</Text>
                <GlassInput
                  placeholder="e.g., Computer Science"
                  value={formName}
                  onChangeText={setFormName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Code *</Text>
                <GlassInput
                  placeholder="e.g., CS"
                  value={formCode}
                  onChangeText={setFormCode}
                  autoCapitalize="characters"
                  maxLength={10}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description</Text>
                <GlassInput
                  placeholder="Brief description of the department"
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                  numberOfLines={3}
                  style={{ height: 80, textAlignVertical: 'top' }}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.glassBorder }]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <PrimaryButton
                  title={saving ? 'Saving...' : (editingDept ? 'Update' : 'Create')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  cardWrapper: { marginBottom: 14 },
  deptCard: { padding: 16 },
  cardHeader: { flexDirection: 'row' },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deptName: { fontSize: 17, fontWeight: '600' },
  inactiveBadge: {
    backgroundColor: '#ef444420',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inactiveText: { fontSize: 10, fontWeight: '600', color: '#ef4444' },
  deptCode: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  deptDesc: { fontSize: 12, marginTop: 6 },
  statsRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statText: { fontSize: 11, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', marginTop: 14, gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionBtnText: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
