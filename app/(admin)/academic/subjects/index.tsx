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

// Subject = courses table in DB (actual subjects like DBMS, OS)
interface Subject {
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
  } | null;
}

// Program for filtering (programs table)
interface Program {
  id: string;
  name: string;
  code: string;
  total_semesters: number;
  department_id: string;
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

export default function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formSemesterId, setFormSemesterId] = useState('');
  const [formTheoryHours, setFormTheoryHours] = useState('3');
  const [formLabHours, setFormLabHours] = useState('0');
  const [formType, setFormType] = useState('core');

  const fetchData = async () => {
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          department:departments(name, code),
          semester:semesters(semester_number)
        `)
        .order('code');

      if (selectedDept !== 'all') {
        query = query.eq('department_id', selectedDept);
      }

      const [subjectsRes, deptsRes, semsRes] = await Promise.all([
        query,
        supabase.from('departments').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('semesters').select('id, semester_number, name').order('semester_number'),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (deptsRes.error) throw deptsRes.error;
      if (semsRes.error) throw semsRes.error;

      setSubjects(subjectsRes.data || []);
      setDepartments(deptsRes.data || []);
      setSemesters(semsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    setFormTheoryHours('3');
    setFormLabHours('0');
    setFormType('core');
    setEditingSubject(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (subject: Subject) => {
    setFormName(subject.name);
    setFormCode(subject.code);
    setFormShortName(subject.short_name || '');
    setFormDeptId(subject.department_id);
    setFormSemesterId(subject.semester_id);
    setFormTheoryHours(subject.theory_hours.toString());
    setFormLabHours(subject.lab_hours.toString());
    setFormType(subject.course_type);
    setEditingSubject(subject);
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
        theory_hours: parseInt(formTheoryHours) || 0,
        lab_hours: parseInt(formLabHours) || 0,
        course_type: formType,
      };

      if (editingSubject) {
        const { error } = await supabase.from('courses').update(payload).eq('id', editingSubject.id);
        if (error) throw error;
        Alert.alert('Success', 'Subject updated successfully');
      } else {
        const { error } = await supabase.from('courses').insert({ ...payload, is_active: true });
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
              const { error } = await supabase.from('courses').delete().eq('id', subject.id);
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
      case 'lab': return '#f59e0b';
      case 'major': return '#ec4899';
      case 'minor': return '#06b6d4';
      default: return '#6b7280';
    }
  };

  const isLabSubject = (subject: Subject) => subject.lab_hours > 0 && subject.theory_hours === 0;

  const renderSubjectCard = (subject: Subject, index: number) => (
    <Animated.View
      key={subject.id}
      entering={FadeInRight.delay(50 + index * 30).duration(250)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity onPress={() => openEditModal(subject)} activeOpacity={0.8}>
        <Card style={styles.subjectCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: isLabSubject(subject) ? '#f59e0b20' : '#6366f120' }]}>
              <FontAwesome5 name={isLabSubject(subject) ? 'flask' : 'book'} size={16} color={isLabSubject(subject) ? '#f59e0b' : '#6366f1'} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.subjectName, { color: colors.textPrimary }]} numberOfLines={1}>
                {subject.name}
              </Text>
              <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>{subject.code}</Text>
            </View>
            <View style={[styles.creditBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.creditText, { color: colors.primary }]}>
                {subject.theory_hours + subject.lab_hours}h
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(subject.course_type) + '20' }]}>
              <Text style={[styles.typeText, { color: getTypeColor(subject.course_type) }]}>
                {subject.course_type.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.courseName, { color: colors.textMuted }]}>
              {subject.department?.code || 'N/A'}
            </Text>
            {subject.semester && (
              <Text style={[styles.semesterText, { color: colors.textMuted }]}>Sem {subject.semester.semester_number}</Text>
            )}
            <TouchableOpacity onPress={() => handleDelete(subject)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
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
              style={[styles.filterChip, selectedDept === 'all' && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedDept('all')}
            >
              <Text style={[styles.filterChipText, { color: selectedDept === 'all' ? '#fff' : colors.textMuted }]}>
                All Depts
              </Text>
            </TouchableOpacity>
            {departments.map((dept) => (
              <TouchableOpacity
                key={dept.id}
                style={[styles.filterChip, selectedDept === dept.id && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedDept(dept.id)}
              >
                <Text style={[styles.filterChipText, { color: selectedDept === dept.id ? '#fff' : colors.textMuted }]}>
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

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Code *</Text>
                    <GlassInput placeholder="e.g., CS201" value={formCode} onChangeText={setFormCode} autoCapitalize="characters" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Short Name</Text>
                    <GlassInput placeholder="e.g., DS" value={formShortName} onChangeText={setFormShortName} />
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
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Semester *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker selectedValue={formSemesterId} onValueChange={setFormSemesterId} style={{ color: colors.textPrimary }}>
                      <Picker.Item label="Select Semester" value="" />
                      {semesters.map((sem) => (
                        <Picker.Item key={sem.id} label={sem.name} value={sem.id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Theory Hours</Text>
                    <GlassInput placeholder="3" value={formTheoryHours} onChangeText={setFormTheoryHours} keyboardType="numeric" />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Lab Hours</Text>
                    <GlassInput placeholder="0" value={formLabHours} onChangeText={setFormLabHours} keyboardType="numeric" />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Type</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker selectedValue={formType} onValueChange={setFormType} style={{ color: colors.textPrimary }}>
                      <Picker.Item label="Core" value="core" />
                      <Picker.Item label="Elective" value="elective" />
                      <Picker.Item label="Open Elective" value="open_elective" />
                      <Picker.Item label="Lab" value="lab" />
                      <Picker.Item label="Major" value="major" />
                      <Picker.Item label="Minor" value="minor" />
                      <Picker.Item label="Mandatory" value="mandatory" />
                    </Picker>
                  </View>
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
