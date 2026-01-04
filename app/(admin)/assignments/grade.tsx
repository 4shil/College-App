import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface Submission {
  id: string; marks_obtained?: number; feedback?: string; status: string;
  student?: { roll_number: string; user?: { full_name: string; }; };
}

export default function GradeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [selectedAssignmentData, setSelectedAssignmentData] = useState<any>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [marksInput, setMarksInput] = useState<Record<string, string>>({});
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('assignments').select('*').eq('status', 'active').order('due_date', { ascending: false });
      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch assignments');
    }
  }, []);

  const fetchSubmissions = useCallback(async (assignmentId: string) => {
    try {
      const [submissionsRes, assignmentRes] = await Promise.all([
        supabase.from('assignment_submissions').select('*, student:students(roll_number,user:users(full_name))').eq('assignment_id', assignmentId).order('student.roll_number'),
        supabase.from('assignments').select('*').eq('id', assignmentId).single(),
      ]);
      if (submissionsRes.error) throw submissionsRes.error;
      if (assignmentRes.error) throw assignmentRes.error;
      setSubmissions(submissionsRes.data || []);
      setSelectedAssignmentData(assignmentRes.data);
      const marks: Record<string, string> = {};
      const feedback: Record<string, string> = {};
      (submissionsRes.data || []).forEach((s: any) => {
        marks[s.id] = s.marks_obtained?.toString() || '';
        feedback[s.id] = s.feedback || '';
      });
      setMarksInput(marks);
      setFeedbackInput(feedback);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch submissions');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchAssignments(); setLoading(false); };
    load();
  }, [fetchAssignments]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment);
    } else {
      setSubmissions([]);
      setSelectedAssignmentData(null);
    }
  }, [selectedAssignment, fetchSubmissions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    if (selectedAssignment) await fetchSubmissions(selectedAssignment);
    setRefreshing(false);
  };

  const handleSaveGrade = async (submissionId: string) => {
    const marks = marksInput[submissionId];
    const feedback = feedbackInput[submissionId];
    if (!marks) {
      Alert.alert('Error', 'Please enter marks');
      return;
    }
    const marksNum = parseInt(marks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > selectedAssignmentData?.max_marks) {
      Alert.alert('Error', `Marks must be between 0 and ${selectedAssignmentData?.max_marks}`);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('assignment_submissions').update({
        marks_obtained: marksNum, feedback, status: 'graded',
        graded_by: (await supabase.auth.getUser()).data.user?.id, graded_at: new Date().toISOString(),
      }).eq('id', submissionId);
      if (error) throw error;
      Alert.alert('Success', 'Grade saved');
      setEditingSubmission(null);
      await fetchSubmissions(selectedAssignment);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><LoadingIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.GRADE_ASSIGNMENTS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Grade Assignments</Text>
        
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Select Assignment</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker selectedValue={selectedAssignment} onValueChange={setSelectedAssignment} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
              <Picker.Item label="Choose Assignment..." value="" />
              {assignments.map(a => <Picker.Item key={a.id} label={a.title} value={a.id} />)}
            </Picker>
          </View>
          {selectedAssignmentData && (
            <View style={styles.info}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>Max Marks: {selectedAssignmentData.max_marks}</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>Due: {new Date(selectedAssignmentData.due_date).toLocaleDateString()}</Text>
            </View>
          )}
        </Card>

        {selectedAssignment && submissions.length === 0 && (
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <FontAwesome5 name="inbox" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No submissions yet</Text>
          </Card>
        )}

        {submissions.map((submission, i) => (
          <Animated.View key={submission.id} entering={FadeInDown.delay(i * 30).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.icon, { backgroundColor: submission.status === 'graded' ? withAlpha(colors.success, 0.125) : withAlpha(colors.warning, 0.125) }]}>
                  <FontAwesome5 name="user-graduate" size={20} color={submission.status === 'graded' ? colors.success : colors.warning} />
                </View>
                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.textPrimary }]}>{submission.student?.user?.full_name}</Text>
                  <Text style={[styles.rollNumber, { color: colors.textSecondary }]}>{submission.student?.roll_number}</Text>
                </View>
                {submission.status === 'graded' && (
                  <View style={[styles.badge, { backgroundColor: colors.success }]}>
                    <Text style={[styles.badgeText, { color: colors.textInverse }]}>GRADED</Text>
                  </View>
                )}
              </View>
              {editingSubmission === submission.id ? (
                <View style={styles.gradeForm}>
                  <GlassInput placeholder={`Marks (0-${selectedAssignmentData?.max_marks})`}
                    value={marksInput[submission.id]} onChangeText={(v) => setMarksInput({ ...marksInput, [submission.id]: v })}
                    keyboardType="numeric" />
                  <GlassInput placeholder="Feedback (optional)" value={feedbackInput[submission.id]}
                    onChangeText={(v) => setFeedbackInput({ ...feedbackInput, [submission.id]: v })}
                    multiline numberOfLines={3} />
                  <View style={styles.formActions}>
                    <TouchableOpacity onPress={() => setEditingSubmission(null)} style={[styles.cancelButton, { borderColor: colors.cardBorder }]}>
                      <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <PrimaryButton title="Save Grade" onPress={() => handleSaveGrade(submission.id)} loading={saving} style={{ flex: 1 }} />
                  </View>
                </View>
              ) : (
                <View>
                  {submission.status === 'graded' && (
                    <View style={styles.gradeDisplay}>
                      <Text style={[styles.marksText, { color: colors.textPrimary }]}>Marks: {submission.marks_obtained}/{selectedAssignmentData?.max_marks}</Text>
                      {submission.feedback && <Text style={[styles.feedbackText, { color: colors.textSecondary }]}>Feedback: {submission.feedback}</Text>}
                    </View>
                  )}
                  <SolidButton onPress={() => setEditingSubmission(submission.id)} style={[styles.gradeButton, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.gradeButtonText, { color: colors.textInverse }]}>{submission.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}</Text>
                  </SolidButton>
                </View>
              )}
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  picker: { height: 50 },
  info: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  infoText: { fontSize: 14 },
  emptyText: { fontSize: 16, marginTop: 12 },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  rollNumber: { fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  gradeForm: { marginTop: 8 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600' },
  gradeDisplay: { marginBottom: 12 },
  marksText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  feedbackText: { fontSize: 14 },
  gradeButton: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  gradeButtonText: { fontSize: 14, fontWeight: '600' },
});
