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

interface Course {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  course_type: string;
  theory_hours: number;
  lab_hours: number;
  is_active: boolean;
  department_id: string;
  semester_id: string;
  department: {
    name: string;
    code: string;
  } | null;
  semester: {
    semester_number: number;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Semester {
  id: string;
  semester_number: number;
  name: string;
}

const COURSE_TYPES = [
  { value: 'core', label: 'Core Subject', color: '#6366f1' },
  { value: 'elective', label: 'Elective', color: '#10b981' },
  { value: 'lab', label: 'Lab/Practical', color: '#f59e0b' },
  { value: 'mandatory', label: 'Mandatory', color: '#ef4444' },
];

export default function CoursesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formSemesterId, setFormSemesterId] = useState('');
  const [formType, setFormType] = useState('core');
  const [formTheoryHours, setFormTheoryHours] = useState('3');
  const [formLabHours, setFormLabHours] = useState('0');

  const fetchData = async () => {
    try {
      // Fetch courses with department and semester info
      let query = supabase
        .from('courses')
        .select(`
          *,
          department:departments(name, code),
          semester:semesters(semester_number, name)
        `)
        .order('code');

      if (selectedDept !== 'all') {
        query = query.eq('department_id', selectedDept);
      }

      const [coursesRes, deptsRes, semsRes] = await Promise.all([
        query,
        supabase.from('departments').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('semesters').select('id, semester_number, name').order('semester_number'),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (deptsRes.error) throw deptsRes.error;
      if (semsRes.error) throw semsRes.error;

      setCourses(coursesRes.data || []);
      setDepartments(deptsRes.data || []);
      setSemesters(semsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch courses');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [selectedDept]);

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
    setFormSemesterId('');
    setFormType('core');
    setFormTheoryHours('3');
    setFormLabHours('0');
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
    setFormSemesterId(course.semester_id);
    setFormType(course.course_type);
    setFormTheoryHours(course.theory_hours.toString());
    setFormLabHours(course.lab_hours.toString());
    setEditingCourse(course);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim() || !formDeptId || !formSemesterId) {
      Alert.alert('Validation Error', 'Name, Code, Department, and Semester are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        short_name: formShortName.trim() || null,
        department_id: formDeptId,
        semester_id: formSemesterId,
        course_type: formType,
        theory_hours: parseInt(formTheoryHours) || 0,
        lab_hours: parseInt(formLabHours) || 0,
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

  const handleDelete = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete "${course.name}"?`,
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
            } catch (error: any) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', error.message || 'Failed to delete course');
            }
          },
        },
      ]
    );
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

  const getTypeConfig = (type: string) => {
    return COURSE_TYPES.find(t => t.value === type) || COURSE_TYPES[0];
  };

  const renderCourseCard = (course: Course, index: number) => {
    const typeConfig = getTypeConfig(course.course_type);
    
    return (
      <Animated.View
        key={course.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <Card style={styles.courseCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: typeConfig.color + '20' }]}>
              <FontAwesome5 
                name={course.course_type === 'lab' ? 'flask' : 'book-open'} 
                size={18} 
                color={typeConfig.color} 
              />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.courseName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {course.name}
                </Text>
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
              <Text style={[styles.detailText, { color: '#6366f1' }]}>
                {course.department?.code || 'N/A'}
              </Text>
            </View>
            <View style={[styles.detailBadge, { backgroundColor: '#8b5cf620' }]}>
              <FontAwesome5 name="layer-group" size={10} color="#8b5cf6" />
              <Text style={[styles.detailText, { color: '#8b5cf6' }]}>
                Sem {course.semester?.semester_number || '?'}
              </Text>
            </View>
            <View style={[styles.detailBadge, { backgroundColor: typeConfig.color + '20' }]}>
              <Text style={[styles.detailText, { color: typeConfig.color }]}>
                {typeConfig.label}
              </Text>
            </View>
            {(course.theory_hours > 0 || course.lab_hours > 0) && (
              <View style={[styles.detailBadge, { backgroundColor: '#10b98120' }]}>
                <FontAwesome5 name="clock" size={10} color="#10b981" />
                <Text style={[styles.detailText, { color: '#10b981' }]}>
                  {course.theory_hours}T + {course.lab_hours}L
                </Text>
              </View>
            )}
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
              <FontAwesome5 
                name={course.is_active ? 'ban' : 'check'} 
                size={12} 
                color={course.is_active ? '#f59e0b' : '#10b981'} 
              />
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Courses</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {courses.length} course(s)
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]} 
            onPress={openAddModal}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Department Filter */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedDept === 'all' && { backgroundColor: colors.primary },
                { borderColor: colors.glassBorder }
              ]}
              onPress={() => setSelectedDept('all')}
            >
              <Text style={[styles.filterChipText, { color: selectedDept === 'all' ? '#fff' : colors.textSecondary }]}>
                All Departments
              </Text>
            </TouchableOpacity>
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={[
                  styles.filterChip,
                  selectedDept === dept.id && { backgroundColor: colors.primary },
                  { borderColor: colors.glassBorder }
                ]}
                onPress={() => setSelectedDept(dept.id)}
              >
                <Text style={[styles.filterChipText, { color: selectedDept === dept.id ? '#fff' : colors.textSecondary }]}>
                  {dept.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          ) : courses.length > 0 ? (
            courses.map((course, index) => renderCourseCard(course, index))
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="book-open" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Courses</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Add courses for this department
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
            <Animated.View 
              entering={FadeInDown.duration(300)} 
              style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}
            >
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
                  <GlassInput 
                    placeholder="e.g., Data Structures" 
                    value={formName} 
                    onChangeText={setFormName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Code *</Text>
                    <GlassInput 
                      placeholder="e.g., CS301" 
                      value={formCode} 
                      onChangeText={setFormCode}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Short Name</Text>
                    <GlassInput 
                      placeholder="e.g., DS" 
                      value={formShortName} 
                      onChangeText={setFormShortName}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Department *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker 
                      selectedValue={formDeptId} 
                      onValueChange={setFormDeptId} 
                      style={{ color: colors.textPrimary }}
                    >
                      <Picker.Item label="Select Department" value="" />
                      {departments.map((dept) => (
                        <Picker.Item key={dept.id} label={`${dept.name} (${dept.code})`} value={dept.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Semester *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker 
                      selectedValue={formSemesterId} 
                      onValueChange={setFormSemesterId} 
                      style={{ color: colors.textPrimary }}
                    >
                      <Picker.Item label="Select Semester" value="" />
                      {semesters.map((sem) => (
                        <Picker.Item key={sem.id} label={sem.name} value={sem.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Course Type *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker 
                      selectedValue={formType} 
                      onValueChange={setFormType} 
                      style={{ color: colors.textPrimary }}
                    >
                      {COURSE_TYPES.map((type) => (
                        <Picker.Item key={type.value} label={type.label} value={type.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Theory Hours</Text>
                    <GlassInput 
                      placeholder="3" 
                      value={formTheoryHours} 
                      onChangeText={setFormTheoryHours}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Lab Hours</Text>
                    <GlassInput 
                      placeholder="0" 
                      value={formLabHours} 
                      onChangeText={setFormLabHours}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.cancelBtn, { borderColor: colors.glassBorder }]} 
                  onPress={() => setShowAddModal(false)}
                >
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
  filterContainer: { paddingHorizontal: 20, marginBottom: 10 },
  filterScroll: { gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: '500' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  cardWrapper: { marginBottom: 14 },
  courseCard: { padding: 16 },
  cardHeader: { flexDirection: 'row' },
  iconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseName: { fontSize: 15, fontWeight: '600', flex: 1 },
  inactiveBadge: { backgroundColor: '#ef444420', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  inactiveText: { fontSize: 10, fontWeight: '600', color: '#ef4444' },
  courseCode: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 6 },
  detailBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  detailText: { fontSize: 10, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
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
