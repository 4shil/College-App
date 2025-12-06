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

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface Exam {
  id: string;
  name: string;
  exam_type: 'internal' | 'model' | 'university' | 'practical' | 'viva';
  start_date: string;
  end_date: string;
  is_published: boolean;
  academic_year_id: string;
  semester_id: string;
  academic_year?: { year: string };
  semester?: { semester_number: number };
}

interface AcademicYear {
  id: string;
  year: string;
}

interface Semester {
  id: string;
  semester_number: number;
}

export default function ManageExamsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'internal' | 'model' | 'university' | 'practical' | 'viva'>('internal');
  const [formAcademicYearId, setFormAcademicYearId] = useState('');
  const [formSemesterId, setFormSemesterId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  const examTypeConfig = {
    internal: { label: 'Internal Assessment', color: '#3b82f6' },
    model: { label: 'Model Exam', color: '#8b5cf6' },
    university: { label: 'University Exam', color: '#ef4444' },
    practical: { label: 'Practical Exam', color: '#10b981' },
    viva: { label: 'Viva Voce', color: '#f59e0b' },
  };

  const fetchData = useCallback(async () => {
    try {
      const [examsRes, yearsRes, semestersRes] = await Promise.all([
        supabase
          .from('exams')
          .select(`
            *,
            academic_year:academic_years(year),
            semester:semesters(semester_number)
          `)
          .order('start_date', { ascending: false }),
        supabase.from('academic_years').select('*').eq('is_active', true).order('year', { ascending: false }),
        supabase.from('semesters').select('*').eq('is_active', true).order('semester_number'),
      ]);

      if (examsRes.error) throw examsRes.error;
      if (yearsRes.error) throw yearsRes.error;
      if (semestersRes.error) throw semestersRes.error;

      setExams(examsRes.data || []);
      setAcademicYears(yearsRes.data || []);
      setSemesters(semestersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch exams');
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
    setEditingExam(null);
    setShowAddModal(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setFormName(exam.name);
    setFormType(exam.exam_type);
    setFormAcademicYearId(exam.academic_year_id);
    setFormSemesterId(exam.semester_id);
    setFormStartDate(exam.start_date);
    setFormEndDate(exam.end_date);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormType('internal');
    setFormAcademicYearId('');
    setFormSemesterId('');
    setFormStartDate('');
    setFormEndDate('');
  };

  const handleSave = async () => {
    if (!formName.trim() || !formAcademicYearId || !formSemesterId || !formStartDate || !formEndDate) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const examData = {
        name: formName.trim(),
        exam_type: formType,
        academic_year_id: formAcademicYearId,
        semester_id: formSemesterId,
        start_date: formStartDate,
        end_date: formEndDate,
        is_published: false,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;
      if (editingExam) {
        const res = await supabase.from('exams').update(examData).eq('id', editingExam.id);
        error = res.error;
      } else {
        const res = await supabase.from('exams').insert([examData]);
        error = res.error;
      }

      if (error) throw error;

      Alert.alert('Success', `Exam ${editingExam ? 'updated' : 'created'} successfully`);
      setShowAddModal(false);
      resetForm();
      await fetchData();
    } catch (error: any) {
      console.error('Error saving exam:', error);
      Alert.alert('Error', error.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (exam: Exam) => {
    Alert.alert('Confirm Delete', `Delete exam "${exam.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase.from('exams').delete().eq('id', exam.id);
            if (error) throw error;

            Alert.alert('Success', 'Exam deleted successfully');
            await fetchData();
          } catch (error: any) {
            console.error('Error deleting exam:', error);
            Alert.alert('Error', error.message || 'Failed to delete exam');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handlePublish = async (exam: Exam) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('exams')
        .update({ is_published: !exam.is_published, published_at: new Date().toISOString() })
        .eq('id', exam.id);

      if (error) throw error;

      Alert.alert('Success', `Exam ${exam.is_published ? 'unpublished' : 'published'} successfully`);
      await fetchData();
    } catch (error: any) {
      console.error('Error publishing exam:', error);
      Alert.alert('Error', error.message || 'Failed to publish exam');
    } finally {
      setSaving(false);
    }
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
    <Restricted permissions={PERMISSIONS.SCHEDULE_EXAMS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Manage Exams</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {exams.length} exams scheduled
            </Text>
          </View>
          <TouchableOpacity
            onPress={openAddModal}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {exams.length === 0 ? (
          <Card style={styles.emptyCard}>
            <FontAwesome5 name="file-alt" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No exams scheduled</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Create your first exam to get started
            </Text>
          </Card>
        ) : (
          exams.map((exam, index) => (
            <Animated.View key={exam.id} entering={FadeInDown.delay(index * 50).springify()}>
              <Card style={styles.examCard}>
                <View style={styles.examHeader}>
                  <View style={[styles.examIcon, { backgroundColor: `${examTypeConfig[exam.exam_type].color}20` }]}>
                    <FontAwesome5 name="file-alt" size={20} color={examTypeConfig[exam.exam_type].color} />
                  </View>
                  <View style={styles.examInfo}>
                    <Text style={[styles.examName, { color: colors.textPrimary }]}>{exam.name}</Text>
                    <Text style={[styles.examMeta, { color: colors.textSecondary }]}>
                      {examTypeConfig[exam.exam_type].label}
                    </Text>
                  </View>
                  {exam.is_published && (
                    <View style={[styles.badge, { backgroundColor: colors.success }]}>
                      <Text style={styles.badgeText}>Published</Text>
                    </View>
                  )}
                </View>

                <View style={styles.examDetails}>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="book-open" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Semester {exam.semester?.semester_number}
                    </Text>
                  </View>
                </View>

                <View style={styles.examActions}>
                  <TouchableOpacity
                    onPress={() => handlePublish(exam)}
                    style={[styles.actionButton, { opacity: saving ? 0.5 : 1 }]}
                    disabled={saving}
                  >
                    <FontAwesome5 
                      name={exam.is_published ? "eye-slash" : "eye"} 
                      size={16} 
                      color={exam.is_published ? colors.warning : colors.success} 
                    />
                    <Text style={[styles.actionText, { color: exam.is_published ? colors.warning : colors.success }]}>
                      {exam.is_published ? 'Unpublish' : 'Publish'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openEditModal(exam)}
                    style={[styles.actionButton, { opacity: saving ? 0.5 : 1 }]}
                    disabled={saving}
                  >
                    <FontAwesome5 name="edit" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(exam)}
                    style={[styles.actionButton, { opacity: saving ? 0.5 : 1 }]}
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
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingExam ? 'Edit Exam' : 'Create New Exam'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <GlassInput
                placeholder="e.g., CIA 1 - Computer Science"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Exam Type *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={formType}
                  onValueChange={(value) => setFormType(value as any)}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  {Object.entries(examTypeConfig).map(([key, config]) => (
                    <Picker.Item key={key} label={config.label} value={key} />
                  ))}
                </Picker>
              </View>

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

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Semester *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={formSemesterId}
                  onValueChange={setFormSemesterId}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="Select Semester" value="" />
                  {semesters.map(sem => (
                    <Picker.Item key={sem.id} label={`Semester ${sem.semester_number}`} value={sem.id} />
                  ))}
                </Picker>
              </View>

              <GlassInput
                placeholder="YYYY-MM-DD"
                value={formStartDate}
                onChangeText={setFormStartDate}
              />

              <GlassInput
                placeholder="YYYY-MM-DD"
                value={formEndDate}
                onChangeText={setFormEndDate}
              />

              <PrimaryButton
                title={editingExam ? 'Update Exam' : 'Create Exam'}
                onPress={handleSave}
                loading={saving}
                style={{ marginTop: 16 }}
              />
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
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: 'center' },
  examCard: { padding: 16, marginBottom: 16 },
  examHeader: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  examIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  examInfo: { flex: 1 },
  examName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  examMeta: { fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  examDetails: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(150, 150, 150, 0.2)', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14 },
  examActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
  actionText: { fontSize: 14, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  picker: { height: 50 },
});
