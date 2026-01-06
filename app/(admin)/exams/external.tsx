import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

interface Semester {
  id: string;
  semester_number: number;
}

interface Student {
  id: string;
  admission_number: string;
  users: { full_name: string };
}

interface ExternalMark {
  id?: string;
  student_id: string;
  semester_id: string;
  sgpa: number;
  cgpa: number;
  result_status: 'pass' | 'fail' | 'reappear' | 'withheld';
  remarks: string;
  is_approved: boolean;
}

export default function ExternalMarksScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const modalBackdropColor = isDark ? withAlpha(colors.background, 0.75) : withAlpha(colors.textPrimary, 0.5);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [externalMarks, setExternalMarks] = useState<Map<string, ExternalMark>>(new Map());

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState('');
  const [formSGPA, setFormSGPA] = useState('');
  const [formCGPA, setFormCGPA] = useState('');
  const [formStatus, setFormStatus] = useState<'pass' | 'fail' | 'reappear' | 'withheld'>('pass');
  const [formRemarks, setFormRemarks] = useState('');

  const fetchSemesters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .eq('is_active', true)
        .order('semester_number');

      if (error) throw error;
      setSemesters(data || []);
      if (data && data.length > 0 && !selectedSemesterId) {
        setSelectedSemesterId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching semesters:', error);
      Alert.alert('Error', 'Failed to fetch semesters');
    }
  }, [selectedSemesterId]);

  const fetchStudentsAndMarks = useCallback(async () => {
    if (!selectedSemesterId) return;

    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          admission_number,
          users(full_name)
        `)
        .eq('is_active', true)
        .order('admission_number');

      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch external marks
      const { data: marksData, error: marksError } = await supabase
        .from('external_marks')
        .select('*')
        .eq('semester_id', selectedSemesterId);

      if (marksError) throw marksError;

      const marksMap = new Map<string, ExternalMark>();
      marksData?.forEach((mark: any) => {
        marksMap.set(mark.student_id, mark);
      });
      setExternalMarks(marksMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch students and marks');
    }
  }, [selectedSemesterId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchSemesters();
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSemesterId) {
      fetchStudentsAndMarks();
    }
  }, [selectedSemesterId, fetchStudentsAndMarks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSemesters(), fetchStudentsAndMarks()]);
    setRefreshing(false);
  };

  const openEditModal = (studentId: string) => {
    const mark = externalMarks.get(studentId);
    setEditingStudentId(studentId);
    setFormSGPA(mark?.sgpa?.toString() || '');
    setFormCGPA(mark?.cgpa?.toString() || '');
    setFormStatus(mark?.result_status || 'pass');
    setFormRemarks(mark?.remarks || '');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    const sgpa = parseFloat(formSGPA);
    const cgpa = parseFloat(formCGPA);

    if (isNaN(sgpa) || isNaN(cgpa) || sgpa < 0 || sgpa > 10 || cgpa < 0 || cgpa > 10) {
      Alert.alert('Validation Error', 'Please enter valid SGPA and CGPA (0-10)');
      return;
    }

    setSaving(true);
    try {
      const existingMark = externalMarks.get(editingStudentId);
      const markData = {
        student_id: editingStudentId,
        semester_id: selectedSemesterId,
        sgpa,
        cgpa,
        result_status: formStatus,
        remarks: formRemarks.trim(),
        is_approved: false,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;
      if (existingMark?.id) {
        const res = await supabase.from('external_marks').update(markData).eq('id', existingMark.id);
        error = res.error;
      } else {
        const res = await supabase.from('external_marks').insert([markData]);
        error = res.error;
      }

      if (error) throw error;

      Alert.alert('Success', 'External marks saved successfully');
      setShowEditModal(false);
      await fetchStudentsAndMarks();
    } catch (error: any) {
      console.error('Error saving marks:', error);
      Alert.alert('Error', error.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    const mark = externalMarks.get(studentId);
    if (!mark?.id) return;

    Alert.alert(
      'Confirm Approval',
      'Approve these external marks? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setSaving(true);
              const { error } = await supabase
                .from('external_marks')
                .update({
                  is_approved: true,
                  approved_by: (await supabase.auth.getUser()).data.user?.id,
                  approved_at: new Date().toISOString(),
                })
                .eq('id', mark.id);

              if (error) throw error;

              Alert.alert('Success', 'External marks approved successfully');
              await fetchStudentsAndMarks();
            } catch (error: any) {
              console.error('Error approving marks:', error);
              Alert.alert('Error', error.message || 'Failed to approve marks');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (studentId: string) => {
    const mark = externalMarks.get(studentId);
    if (!mark?.id) return;

    Alert.alert('Confirm Delete', 'Delete external marks for this student?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase.from('external_marks').delete().eq('id', mark.id);
            if (error) throw error;

            Alert.alert('Success', 'External marks deleted successfully');
            await fetchStudentsAndMarks();
          } catch (error: any) {
            console.error('Error deleting marks:', error);
            Alert.alert('Error', error.message || 'Failed to delete marks');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return colors.success;
      case 'fail': return colors.error;
      case 'reappear': return colors.warning;
      case 'withheld': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const pendingApproval = Array.from(externalMarks.values()).filter(m => !m.is_approved).length;
  const approved = Array.from(externalMarks.values()).filter(m => m.is_approved).length;

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <LoadingIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <Restricted permissions={PERMISSIONS.VERIFY_MARKS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>External Results</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {approved} approved, {pendingApproval} pending
            </Text>
          </View>
        </View>

        {/* Semester Selection */}
        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Semester</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker
              selectedValue={selectedSemesterId}
              onValueChange={setSelectedSemesterId}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textPrimary}
            >
              {semesters.map(sem => (
                <Picker.Item key={sem.id} label={`Semester ${sem.semester_number}`} value={sem.id} />
              ))}
            </Picker>
          </View>
        </Card>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>{approved}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Approved</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{pendingApproval}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </Card>
        </View>

        {/* Students List */}
        {students.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 8 }]}>
              Students ({students.length})
            </Text>
            {students.map((student, index) => {
              const mark = externalMarks.get(student.id);

              return (
                <Animated.View key={student.id} entering={FadeInDown.delay(index * 30).springify()}>
                  <Card style={styles.studentCard}>
                    <View style={styles.studentHeader}>
                      <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                          {student.users?.full_name}
                        </Text>
                        <Text style={[styles.studentAdmNo, { color: colors.textSecondary }]}>
                          {student.admission_number}
                        </Text>
                      </View>
                      {mark?.is_approved && (
                        <View style={[styles.badge, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderWidth: 1 }]}>
                          <FontAwesome5 name="check-circle" size={12} color={colors.success} />
                          <Text style={[styles.badgeText, { color: colors.success }]}>Approved</Text>
                        </View>
                      )}
                    </View>

                    {mark ? (
                      <>
                        <View
                          style={[
                            styles.marksRow,
                            { borderColor: withAlpha(colors.textPrimary, isDark ? 0.18 : 0.12) },
                          ]}
                        >
                          <View style={styles.markItem}>
                            <Text style={[styles.markLabel, { color: colors.textSecondary }]}>SGPA</Text>
                            <Text style={[styles.markValue, { color: colors.textPrimary }]}>{mark.sgpa.toFixed(2)}</Text>
                          </View>
                          <View style={styles.markItem}>
                            <Text style={[styles.markLabel, { color: colors.textSecondary }]}>CGPA</Text>
                            <Text style={[styles.markValue, { color: colors.textPrimary }]}>{mark.cgpa.toFixed(2)}</Text>
                          </View>
                          <View style={styles.markItem}>
                            <Text style={[styles.markLabel, { color: colors.textSecondary }]}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderWidth: 1 }]}>
                              <Text style={[styles.statusText, { color: getStatusColor(mark.result_status) }]}>
                                {mark.result_status.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {mark.remarks && (
                          <Text style={[styles.remarks, { color: colors.textSecondary }]}>
                            Remarks: {mark.remarks}
                          </Text>
                        )}

                        <View style={styles.actions}>
                          {!mark.is_approved && (
                            <>
                              <TouchableOpacity
                                onPress={() => openEditModal(student.id)}
                                style={styles.actionButton}
                                disabled={saving}
                              >
                                <FontAwesome5 name="edit" size={16} color={colors.primary} />
                                <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleApprove(student.id)}
                                style={styles.actionButton}
                                disabled={saving}
                              >
                                <FontAwesome5 name="check-circle" size={16} color={colors.success} />
                                <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDelete(student.id)}
                                style={styles.actionButton}
                                disabled={saving}
                              >
                                <FontAwesome5 name="trash" size={16} color={colors.error} />
                                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() => openEditModal(student.id)}
                        style={[styles.addButton, { borderColor: colors.primary }]}
                      >
                        <FontAwesome5 name="plus" size={16} color={colors.primary} />
                        <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Result</Text>
                      </TouchableOpacity>
                    )}
                  </Card>
                </Animated.View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: modalBackdropColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Enter External Result</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <GlassInput
                placeholder="e.g., 8.5"
                value={formSGPA}
                onChangeText={setFormSGPA}
                keyboardType="numeric"
              />

              <GlassInput
                placeholder="e.g., 8.3"
                value={formCGPA}
                onChangeText={setFormCGPA}
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Result Status *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker
                  selectedValue={formStatus}
                  onValueChange={(value) => setFormStatus(value as any)}
                  style={[styles.picker, { color: colors.textPrimary }]}
                  dropdownIconColor={colors.textPrimary}
                >
                  <Picker.Item label="Pass" value="pass" />
                  <Picker.Item label="Fail" value="fail" />
                  <Picker.Item label="Reappear" value="reappear" />
                  <Picker.Item label="Withheld" value="withheld" />
                </Picker>
              </View>

              <GlassInput
                placeholder="Optional remarks"
                value={formRemarks}
                onChangeText={setFormRemarks}
                multiline
                numberOfLines={3}
              />

              <PrimaryButton
                title="Save Result"
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
  header: { marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  card: { padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  picker: { height: 50 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16 },
  statValue: { fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 14 },
  studentCard: { padding: 16, marginBottom: 12 },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  studentAdmNo: { fontSize: 14 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  marksRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'transparent', marginBottom: 12 },
  markItem: { alignItems: 'center' },
  markLabel: { fontSize: 12, marginBottom: 4 },
  markValue: { fontSize: 24, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  remarks: { fontSize: 14, fontStyle: 'italic', marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600' },
  addButton: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addButtonText: { fontSize: 16, fontWeight: '600' },
  modalContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
});
