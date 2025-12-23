import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { withAlpha } from '../../../../theme/colorUtils';
import { supabase } from '../../../../lib/supabase';

interface Course {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  program_type: 'undergraduate' | 'postgraduate' | null;
  duration_years: number | null;
  total_semesters: number | null;
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

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);

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
  const [formShortName, setFormShortName] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formProgramType, setFormProgramType] = useState<'undergraduate' | 'postgraduate'>('undergraduate');
  const [formDuration, setFormDuration] = useState('3');
  const [formSemesters, setFormSemesters] = useState('6');

  const fetchData = async () => {
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        supabase
          .from('courses')
          .select(`
            *,
            department:departments(name, code)
          `)
          .eq('is_active', true)
          .not('program_type', 'is', null)
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

  useEffect(() => {
    // Keep UI in sync with server-side course changes
    const channel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
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

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormShortName('');
    setFormDeptId('');
    setFormProgramType('undergraduate');
    setFormDuration('3');
    setFormSemesters('6');
    setEditingCourse(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (course: Course) => {
    setFormName(course.name);
    setFormCode(course.code);
    setFormShortName(course.short_name || '');
    setFormDeptId(course.department_id);
    setFormProgramType(course.program_type || 'undergraduate');
    setFormDuration((course.duration_years || 3).toString());
    setFormSemesters((course.total_semesters || 6).toString());
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
      // Get first semester for new courses
      const { data: semesterData } = await supabase
        .from('semesters')
        .select('id')
        .eq('semester_number', 1)
        .limit(1)
        .single();

      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        short_name: formShortName.trim() || null,
        department_id: formDeptId,
        program_type: formProgramType,
        duration_years: parseInt(formDuration),
        total_semesters: parseInt(formSemesters),
        semester_id: semesterData?.id,
        course_type: 'core' as const,
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
      `Are you sure you want to delete "${course.name}"? This will deactivate it but data will be preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const { error } = await supabase
                .from('courses')
                .update({ is_active: false })
                .eq('id', course.id);
              
              if (error) {
                console.error('Delete error:', error);
                throw new Error(error.message || 'Failed to delete course');
              }
              
              Alert.alert('Success', `${course.name} has been deactivated`);
              await fetchData();
            } catch (error: any) {
              console.error('Error deleting course:', error);
              Alert.alert(
                'Delete Failed',
                error.message || 'Unable to delete course. It may have associated students or subjects.',
                [{ text: 'OK' }]
              );
            } finally {
              setSaving(false);
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
      <Card style={styles.courseCard}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: course.is_active ? withAlpha(colors.success, 0.125) : withAlpha(colors.textMuted, 0.125) },
            ]}
          >
            <FontAwesome5 name="graduation-cap" size={20} color={course.is_active ? colors.success : colors.textMuted} />
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>{course.name}</Text>
              {!course.is_active && (
                <View style={[styles.inactiveBadge, { backgroundColor: withAlpha(colors.error, 0.125) }]}>
                  <Text style={[styles.inactiveText, { color: colors.error }]}>Inactive</Text>
                </View>
              )}
            </View>
            <Text style={[styles.courseCode, { color: colors.primary }]}>{course.code}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={[styles.detailBadge, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
            <FontAwesome5 name="building" size={10} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.primary }]}>{course.department?.code || 'N/A'}</Text>
          </View>
          <View
            style={[
              styles.detailBadge,
              {
                backgroundColor:
                  course.program_type === 'postgraduate'
                    ? withAlpha(colors.info, 0.125)
                    : withAlpha(colors.success, 0.125),
              },
            ]}
          >
            <FontAwesome5
              name="award"
              size={10}
              color={course.program_type === 'postgraduate' ? colors.info : colors.success}
            />
            <Text
              style={[
                styles.detailText,
                { color: course.program_type === 'postgraduate' ? colors.info : colors.success },
              ]}
            >
              {course.program_type === 'postgraduate' ? 'PG' : 'UG'}
            </Text>
          </View>
          <View style={[styles.detailBadge, { backgroundColor: withAlpha(colors.warning, 0.125) }]}>
            <FontAwesome5 name="clock" size={10} color={colors.warning} />
            <Text style={[styles.detailText, { color: colors.warning }]}>{course.duration_years || 3} Years</Text>
          </View>
          <View style={[styles.detailBadge, { backgroundColor: withAlpha(colors.info, 0.125) }]}>
            <FontAwesome5 name="layer-group" size={10} color={colors.info} />
            <Text style={[styles.detailText, { color: colors.info }]}>{course.total_semesters || 6} Sems</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: withAlpha(colors.primary, 0.08), opacity: saving ? 0.5 : 1 }]}
            onPress={() => openEditModal(course)}
            disabled={saving}
          >
            <FontAwesome5 name="edit" size={12} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: course.is_active ? withAlpha(colors.warning, 0.08) : withAlpha(colors.success, 0.08),
                opacity: saving ? 0.5 : 1,
              },
            ]}
            onPress={() => handleToggleActive(course)}
            disabled={saving}
          >
            <FontAwesome5
              name={course.is_active ? 'ban' : 'check'}
              size={12}
              color={course.is_active ? colors.warning : colors.success}
            />
            <Text style={[styles.actionBtnText, { color: course.is_active ? colors.warning : colors.success }]}>
              {course.is_active ? 'Disable' : 'Enable'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: withAlpha(colors.error, 0.08), opacity: saving ? 0.5 : 1 }]}
            onPress={() => handleDelete(course)}
            disabled={saving}
          >
            <FontAwesome5 name="trash" size={12} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Courses</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{courses.length} course(s)</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={22} color={colors.textInverse} />
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
              <LoadingIndicator size="large" color={colors.primary} />
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
          <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
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
                  <GlassInput placeholder="e.g., BCA, B.Com" value={formName} onChangeText={setFormName} autoCapitalize="words" />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Code *</Text>
                    <GlassInput placeholder="e.g., BCA" value={formCode} onChangeText={setFormCode} autoCapitalize="characters" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Short Name</Text>
                    <GlassInput placeholder="e.g., BCA" value={formShortName} onChangeText={setFormShortName} />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Department *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.06 : 0.03) }]}>
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
                  <View style={[styles.pickerContainer, { backgroundColor: withAlpha(colors.textPrimary, isDark ? 0.06 : 0.03) }]}>
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
  inactiveBadge: { backgroundColor: 'transparent', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  inactiveText: { fontSize: 10, fontWeight: '600' },
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
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
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
