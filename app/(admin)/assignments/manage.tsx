import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface Assignment {
  id: string; title: string; description: string; due_date: string; max_marks: number; status: string; course_id: string;
  course?: { name: string; code: string; };
}

export default function ManageAssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const modalBackdropColor = isDark ? withAlpha(colors.background, 0.75) : withAlpha(colors.textPrimary, 0.5);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formMaxMarks, setFormMaxMarks] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [assignmentsRes, coursesRes] = await Promise.all([
        supabase.from('assignments').select('*, course:courses(name,code)').order('due_date', { ascending: false }),
        supabase.from('courses').select('id, name, code').eq('is_active', true),
      ]);
      if (assignmentsRes.error) throw assignmentsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      setAssignments(assignmentsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch assignments');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchData(); setLoading(false); };
    load();
  }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const openAddModal = () => {
    setEditingAssignment(null);
    setFormTitle(''); setFormDesc(''); setFormCourseId(''); setFormDueDate(''); setFormMaxMarks('');
    setShowModal(true);
  };

  const openEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormTitle(assignment.title); setFormDesc(assignment.description);
    setFormCourseId(assignment.course_id); setFormDueDate(assignment.due_date);
    setFormMaxMarks(assignment.max_marks.toString());
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle || !formCourseId || !formDueDate || !formMaxMarks) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const data = { title: formTitle, description: formDesc, course_id: formCourseId, due_date: formDueDate,
        max_marks: parseInt(formMaxMarks), status: 'active', created_by: (await supabase.auth.getUser()).data.user?.id };
      const { error } = editingAssignment
        ? await supabase.from('assignments').update(data).eq('id', editingAssignment.id)
        : await supabase.from('assignments').insert([data]);
      if (error) throw error;
      Alert.alert('Success', `Assignment ${editingAssignment ? 'updated' : 'created'}`);
      setShowModal(false);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (assignment: Assignment) => {
    Alert.alert('Delete Assignment', `Delete "${assignment.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const { error } = await supabase.from('assignments').delete().eq('id', assignment.id);
          if (error) throw error;
          Alert.alert('Success', 'Assignment deleted');
          await fetchData();
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }},
    ]);
  };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><LoadingIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.MANAGE_ASSIGNMENTS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.header}>
          <View><Text style={[styles.title, { color: colors.textPrimary }]}>Manage Assignments</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{assignments.length} assignments</Text></View>
          <SolidButton onPress={openAddModal} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="plus" size={18} color={colors.textInverse} />
          </SolidButton>
        </View>
        {assignments.map((assignment, i) => (
          <Animated.View key={assignment.id} entering={FadeInDown.delay(i * 30).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.icon, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
                  <FontAwesome5 name="file-alt" size={20} color={colors.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.assignmentTitle, { color: colors.textPrimary }]}>{assignment.title}</Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{assignment.course?.code} - {assignment.course?.name}</Text>
                </View>
              </View>
              {assignment.description && (
                <Text style={[styles.desc, { color: colors.textSecondary }]}>{assignment.description}</Text>
              )}
              <View style={styles.details}>
                <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Due:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{new Date(assignment.due_date).toLocaleDateString()}</Text></View>
                <View style={styles.row}><Text style={[styles.label, { color: colors.textSecondary }]}>Max Marks:</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{assignment.max_marks}</Text></View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEditModal(assignment)}><FontAwesome5 name="edit" size={16} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(assignment)}><FontAwesome5 name="trash" size={16} color={colors.error} /></TouchableOpacity>
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={[styles.modalContainer, { backgroundColor: modalBackdropColor }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{editingAssignment ? 'Edit' : 'Create'} Assignment</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color={colors.textPrimary} /></TouchableOpacity>
            </View>
            <ScrollView>
              <GlassInput placeholder="Assignment Title *" value={formTitle} onChangeText={setFormTitle} />
              <GlassInput placeholder="Description" value={formDesc} onChangeText={setFormDesc} multiline numberOfLines={3} />
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Select Course *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
                <Picker selectedValue={formCourseId} onValueChange={setFormCourseId} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
                  <Picker.Item label="Select Course" value="" />
                  {courses.map(c => <Picker.Item key={c.id} label={`${c.code} - ${c.name}`} value={c.id} />)}
                </Picker>
              </View>
              <GlassInput placeholder="Due Date (YYYY-MM-DD) *" value={formDueDate} onChangeText={setFormDueDate} />
              <GlassInput placeholder="Max Marks *" value={formMaxMarks} onChangeText={setFormMaxMarks} keyboardType="numeric" />
              <PrimaryButton title={editingAssignment ? 'Update' : 'Create'} onPress={handleSave} loading={saving} style={{ marginTop: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 }, subtitle: { fontSize: 16 },
  addButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12 },
  icon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 }, assignmentTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14 }, desc: { fontSize: 14, marginBottom: 12 },
  details: { marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14 }, value: { fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  picker: { height: 50 },
});
