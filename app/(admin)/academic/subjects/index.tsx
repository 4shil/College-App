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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  subject_type: string;
  is_lab: boolean;
  is_active: boolean;
  course_id: string;
  semester: number | null;
  course: {
    name: string;
    code: string;
  } | null;
}

interface Course {
  id: string;
  name: string;
  code: string;
  total_semesters: number;
}

export default function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formCredits, setFormCredits] = useState('3');
  const [formType, setFormType] = useState('core');
  const [formIsLab, setFormIsLab] = useState(false);
  const [formSemester, setFormSemester] = useState('');

  const fetchData = async () => {
    try {
      let query = supabase
        .from('subjects')
        .select(`
          *,
          course:courses!subjects_course_id_fkey(name, code)
        `)
        .order('code');

      if (selectedCourse !== 'all') {
        query = query.eq('course_id', selectedCourse);
      }

      const [subjectsRes, coursesRes] = await Promise.all([
        query,
        supabase.from('courses').select('id, name, code, total_semesters').eq('is_active', true).order('name'),
      ]);

      // Handle missing tables gracefully
      if (subjectsRes.error) {
        if (subjectsRes.error.code === 'PGRST205') {
          console.log('Subjects table not found - showing empty state');
          setSubjects([]);
        } else {
          throw subjectsRes.error;
        }
      } else {
        setSubjects(subjectsRes.data || []);
      }

      if (coursesRes.error) {
        if (coursesRes.error.code === 'PGRST205') {
          console.log('Courses table not found - showing empty state');
          setCourses([]);
        } else {
          throw coursesRes.error;
        }
      } else {
        setCourses(coursesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchData();
    setLoading(false);
  }, [selectedCourse]);

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
    setFormCourseId('');
    setFormCredits('3');
    setFormType('core');
    setFormIsLab(false);
    setFormSemester('');
    setEditingSubject(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (subject: Subject) => {
    setFormName(subject.name);
    setFormCode(subject.code);
    setFormCourseId(subject.course_id);
    setFormCredits(subject.credits.toString());
    setFormType(subject.subject_type);
    setFormIsLab(subject.is_lab);
    setFormSemester(subject.semester?.toString() || '');
    setEditingSubject(subject);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim() || !formCourseId) {
      Alert.alert('Validation Error', 'Name, Code, and Course are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        course_id: formCourseId,
        credits: parseInt(formCredits),
        subject_type: formType,
        is_lab: formIsLab,
        semester: formSemester ? parseInt(formSemester) : null,
      };

      if (editingSubject) {
        const { error } = await supabase.from('subjects').update(payload).eq('id', editingSubject.id);
        if (error) throw error;
        Alert.alert('Success', 'Subject updated successfully');
      } else {
        const { error } = await supabase.from('subjects').insert({ ...payload, is_active: true });
        if (error) throw error;
        Alert.alert('Success', 'Subject created successfully');
      }

      setShowAddModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      Alert.alert('Error', error.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (subject: Subject) => {
    Alert.alert(
      'Delete Subject',
      `Delete "${subject.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
              if (error) throw error;
              await fetchData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete subject');
            }
          },
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'core': return '#10b981';
      case 'elective': return '#8b5cf6';
      case 'open_elective': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const renderSubjectCard = (subject: Subject, index: number) => (
    <Animated.View
      key={subject.id}
      entering={FadeInRight.delay(50 + index * 30).duration(250)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity onPress={() => openEditModal(subject)} activeOpacity={0.8}>
        <Card style={styles.subjectCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: subject.is_lab ? '#f59e0b20' : '#6366f120' }]}>
              <FontAwesome5 name={subject.is_lab ? 'flask' : 'book'} size={16} color={subject.is_lab ? '#f59e0b' : '#6366f1'} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.subjectName, { color: colors.textPrimary }]} numberOfLines={1}>
                {subject.name}
              </Text>
              <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>{subject.code}</Text>
            </View>
            <View style={[styles.creditBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.creditText, { color: colors.primary }]}>{subject.credits} Cr</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(subject.subject_type) + '20' }]}>
              <Text style={[styles.typeText, { color: getTypeColor(subject.subject_type) }]}>
                {subject.subject_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.courseName, { color: colors.textMuted }]}>
              {subject.course?.code || 'N/A'}
            </Text>
            {subject.semester && (
              <Text style={[styles.semesterText, { color: colors.textMuted }]}>Sem {subject.semester}</Text>
            )}
            <TouchableOpacity onPress={() => handleDelete(subject)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  const selectedCourseData = courses.find(c => c.id === formCourseId);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Subjects</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subjects.length} subject(s)</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openAddModal}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Filter */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedCourse === 'all' && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedCourse('all')}
            >
              <Text style={[styles.filterChipText, { color: selectedCourse === 'all' ? '#fff' : colors.textMuted }]}>
                All Courses
              </Text>
            </TouchableOpacity>
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={[styles.filterChip, selectedCourse === course.id && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedCourse(course.id)}
              >
                <Text style={[styles.filterChipText, { color: selectedCourse === course.id ? '#fff' : colors.textMuted }]}>
                  {course.code}
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : subjects.length > 0 ? (
            <View style={styles.subjectsGrid}>
              {subjects.map((subject, index) => renderSubjectCard(subject, index))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="book" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Subjects</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Add subjects to courses</Text>
            </View>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingSubject ? 'Edit Subject' : 'Add Subject'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Subject Name *</Text>
                  <GlassInput placeholder="e.g., Data Structures" value={formName} onChangeText={setFormName} autoCapitalize="words" />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Code *</Text>
                  <GlassInput placeholder="e.g., CS201" value={formCode} onChangeText={setFormCode} autoCapitalize="characters" />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Course *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker selectedValue={formCourseId} onValueChange={setFormCourseId} style={{ color: colors.textPrimary }}>
                      <Picker.Item label="Select Course" value="" />
                      {courses.map((course) => (
                        <Picker.Item key={course.id} label={`${course.name} (${course.code})`} value={course.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Credits</Text>
                    <GlassInput placeholder="3" value={formCredits} onChangeText={setFormCredits} keyboardType="numeric" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Semester</Text>
                    <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Picker selectedValue={formSemester} onValueChange={setFormSemester} style={{ color: colors.textPrimary }}>
                        <Picker.Item label="Any" value="" />
                        {Array.from({ length: selectedCourseData?.total_semesters || 8 }, (_, i) => (
                          <Picker.Item key={i + 1} label={`Sem ${i + 1}`} value={(i + 1).toString()} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Type</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker selectedValue={formType} onValueChange={setFormType} style={{ color: colors.textPrimary }}>
                      <Picker.Item label="Core" value="core" />
                      <Picker.Item label="Elective" value="elective" />
                      <Picker.Item label="Open Elective" value="open_elective" />
                    </Picker>
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Is Lab Subject?</Text>
                  <Switch value={formIsLab} onValueChange={setFormIsLab} trackColor={{ true: colors.primary }} />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.glassBorder }]} onPress={() => setShowAddModal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <PrimaryButton
                  title={saving ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
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
  filterContainer: { marginBottom: 10 },
  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardWrapper: { width: '48%' },
  subjectCard: { padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardInfo: { flex: 1 },
  subjectName: { fontSize: 13, fontWeight: '600' },
  subjectCode: { fontSize: 11, marginTop: 2 },
  creditBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  creditText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6, flexWrap: 'wrap' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 8, fontWeight: '700' },
  courseName: { fontSize: 10 },
  semesterText: { fontSize: 10 },
  deleteBtn: { marginLeft: 'auto', padding: 4 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 12 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pickerContainer: { borderRadius: 12, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 1 },
});
