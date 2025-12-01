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

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Course {
  id: string;
  name: string;
  code: string;
  duration_years: number;
  total_semesters: number;
  description: string | null;
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formDuration, setFormDuration] = useState('4');
  const [formSemesters, setFormSemesters] = useState('8');
  const [formDescription, setFormDescription] = useState('');

  const fetchData = async () => {
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        supabase
          .from('courses')
          .select(`
            *,
            department:departments!courses_department_id_fkey(name, code)
          `)
          .order('name'),
        supabase.from('departments').select('id, name, code').eq('is_active', true).order('name'),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (deptsRes.error) throw deptsRes.error;

      setCourses(coursesRes.data || []);
      setDepartments(deptsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch courses');
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
    setFormDeptId('');
    setFormDuration('4');
    setFormSemesters('8');
    setFormDescription('');
    setEditingCourse(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (course: Course) => {
    setFormName(course.name);
    setFormCode(course.code);
    setFormDeptId(course.department_id);
    setFormDuration(course.duration_years.toString());
    setFormSemesters(course.total_semesters.toString());
    setFormDescription(course.description || '');
    setEditingCourse(course);
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
        department_id: formDeptId,
        duration_years: parseInt(formDuration),
        total_semesters: parseInt(formSemesters),
        description: formDescription.trim() || null,
      };

      if (editingCourse) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editingCourse.id);
        if (error) throw error;
        Alert.alert('Success', 'Course updated successfully');
      } else {
        const { error } = await supabase.from('courses').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Success', 'Course created successfully');
      }

      setShowAddModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving course:', error);
      Alert.alert('Error', error.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: !course.is_active })
        .eq('id', course.id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error toggling course:', error);
      Alert.alert('Error', 'Failed to update course');
    }
  };

  const handleDelete = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete ${course.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('courses').delete().eq('id', course.id);
              if (error) throw error;
              Alert.alert('Success', 'Course deleted');
              await fetchData();
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course. It may have associated subjects.');
            }
          },
        },
      ]
    );
  };

  const renderCourseCard = (course: Course, index: number) => (
    <Animated.View
      key={course.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <GlassCard style={styles.courseCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: course.is_active ? '#10b98120' : '#6b728020' }]}>
            <FontAwesome5 name="graduation-cap" size={20} color={course.is_active ? '#10b981' : '#6b7280'} />
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.courseName, { color: colors.textPrimary }]}>{course.name}</Text>
              {!course.is_active && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveText}>Inactive</Text>
                </View>
              )}
            </View>
            <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={[styles.detailBadge, { backgroundColor: '#6366f120' }]}>
            <FontAwesome5 name="building" size={10} color="#6366f1" />
            <Text style={[styles.detailText, { color: '#6366f1' }]}>{course.department?.code || 'N/A'}</Text>
          </View>
          <View style={[styles.detailBadge, { backgroundColor: '#f59e0b20' }]}>
            <FontAwesome5 name="clock" size={10} color="#f59e0b" />
            <Text style={[styles.detailText, { color: '#f59e0b' }]}>{course.duration_years} Years</Text>
          </View>
          <View style={[styles.detailBadge, { backgroundColor: '#8b5cf620' }]}>
            <FontAwesome5 name="layer-group" size={10} color="#8b5cf6" />
            <Text style={[styles.detailText, { color: '#8b5cf6' }]}>{course.total_semesters} Sems</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary + '15' }]}
            onPress={() => openEditModal(course)}
          >
            <FontAwesome5 name="edit" size={12} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: course.is_active ? '#f59e0b15' : '#10b98115' }]}
            onPress={() => handleToggleActive(course)}
          >
            <FontAwesome5 name={course.is_active ? 'ban' : 'check'} size={12} color={course.is_active ? '#f59e0b' : '#10b981'} />
            <Text style={[styles.actionBtnText, { color: course.is_active ? '#f59e0b' : '#10b981' }]}>
              {course.is_active ? 'Disable' : 'Enable'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ef444415' }]}
            onPress={() => handleDelete(course)}
          >
            <FontAwesome5 name="trash" size={12} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </GlassCard>
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Courses</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{courses.length} course(s)</Text>
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
          ) : courses.length > 0 ? (
            courses.map((course, index) => renderCourseCard(course, index))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="graduation-cap" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Courses</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add your first course</Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingCourse ? 'Edit Course' : 'Add Course'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Course Name *</Text>
                  <GlassInput placeholder="e.g., Bachelor of Technology" value={formName} onChangeText={setFormName} autoCapitalize="words" />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Code *</Text>
                  <GlassInput placeholder="e.g., B.Tech" value={formCode} onChangeText={setFormCode} autoCapitalize="characters" />
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

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Duration (Years)</Text>
                    <GlassInput placeholder="4" value={formDuration} onChangeText={setFormDuration} keyboardType="numeric" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Semesters</Text>
                    <GlassInput placeholder="8" value={formSemesters} onChangeText={setFormSemesters} keyboardType="numeric" />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Description</Text>
                  <GlassInput
                    placeholder="Course description"
                    value={formDescription}
                    onChangeText={setFormDescription}
                    multiline
                    numberOfLines={3}
                    style={{ height: 80, textAlignVertical: 'top' }}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.glassBorder }]} onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <PrimaryButton
                  title={saving ? 'Saving...' : editingCourse ? 'Update' : 'Create'}
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
