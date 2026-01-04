import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { withAlpha } from '../../../../theme/colorUtils';
import { supabase } from '../../../../lib/supabase';

interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  contact_hours: number;
  subject_type: 'core' | 'elective' | 'open_elective' | 'lab';
  course_id: string;
  semester_id: string | null;
  is_active: boolean;
  courses?: { name: string; program_type?: string | null };
  semesters?: { name: string } | null;
}

interface CourseOption {
  id: string;
  name: string;
  program_type: string | null;
}

interface SemesterOption {
  id: string;
  name: string;
}

export default function SubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [semesters, setSemesters] = useState<SemesterOption[]>([]);
  const [search, setSearch] = useState('');

  // Modal / form state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    credits: '0',
    contact_hours: '0',
    subject_type: 'core' as Subject['subject_type'],
    course_id: '',
    semester_id: '',
  });

  const fetchCourses = useCallback(async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, program_type')
      .eq('is_active', true)
      .order('name');
    if (!error) setCourses(data || []);
  }, []);

  const fetchSemesters = useCallback(async () => {
    const { data, error } = await supabase
      .from('semesters')
      .select('id, name')
      .eq('is_active', true)
      .order('semester_number');
    if (!error) setSemesters(data || []);
  }, []);

  const fetchSubjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select(`
        *,
        courses:course_id(name, program_type),
        semesters:semester_id(name)
      `)
      .eq('is_active', true)
      .order('code');
    if (error) {
      console.error('Error fetching subjects:', error);
      Alert.alert('Error', 'Failed to fetch subjects');
      return;
    }
    setSubjects(data || []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCourses(), fetchSemesters(), fetchSubjects()]);
    setLoading(false);
  }, [fetchCourses, fetchSemesters, fetchSubjects]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    // Real-time sync when subjects change on the server
    const channel = supabase
      .channel('subjects-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        () => fetchSubjects()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSubjects]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
  };

  const resetForm = () => {
    setForm({
      code: '',
      name: '',
      credits: '0',
      contact_hours: '0',
      subject_type: 'core',
      course_id: '',
      semester_id: '',
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (subj: Subject) => {
    setEditing(subj);
    setForm({
      code: subj.code,
      name: subj.name,
      credits: String(subj.credits ?? 0),
      contact_hours: String(subj.contact_hours ?? 0),
      subject_type: subj.subject_type,
      course_id: subj.course_id,
      semester_id: subj.semester_id || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.course_id) {
      Alert.alert('Validation', 'Code, name, and course are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        credits: parseInt(form.credits) || 0,
        contact_hours: parseInt(form.contact_hours) || 0,
        subject_type: form.subject_type,
        course_id: form.course_id,
        semester_id: form.semester_id || null,
        is_active: true,
      };

      if (editing) {
        const { error } = await supabase.from('subjects').update(payload).eq('id', editing.id);
        if (error) throw error;
        Alert.alert('Success', 'Subject updated');
      } else {
        const { error } = await supabase.from('subjects').insert(payload);
        if (error) throw error;
        Alert.alert('Success', 'Subject created');
      }
      setShowModal(false);
      await fetchSubjects();
      resetForm();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (subj: Subject) => {
    Alert.alert('Delete Subject', `Delete ${subj.code}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase
              .from('subjects')
              .update({ is_active: false })
              .eq('id', subj.id);
            if (error) throw error;
            await fetchSubjects();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete subject');
          } finally {
            setSaving(false);
          }
        }
      }
    ]);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(s =>
      s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [search, subjects]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Subjects</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage subjects mapped to courses and semesters</Text>
          </View>
          <SolidButton style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={openCreate}>
            <FontAwesome5 name="plus" size={18} color={colors.textInverse} />
          </SolidButton>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.searchContainer}>
          <GlassInput
            placeholder="Search by code or name"
            value={search}
            onChangeText={setSearch}
            icon="search"
          />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <LoadingIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="book" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No subjects found</Text>
            </View>
          ) : (
            filtered.map((s, idx) => (
              <Animated.View key={s.id} entering={FadeInRight.delay(100 + idx * 60).duration(400)}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => openEdit(s)}>
                  <Card style={[styles.card, { borderColor: colors.cardBorder }]}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.codeBadge, { backgroundColor: withAlpha(colors.primary, 0.09) }]}>
                        <Text style={[styles.codeText, { color: colors.primary }]}>{s.code}</Text>
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{s.name}</Text>
                        <Text style={[styles.meta, { color: colors.textSecondary }]}>
                          {s.courses?.name || 'Course'} • {s.semesters?.name || 'Semester'} • {s.subject_type}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(s)} style={styles.deleteBtn}>
                        <Ionicons name="close-circle" size={22} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>Credits: {s.credits}</Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>Hours: {s.contact_hours}</Text>
                      {!s.is_active && (
                        <Text style={[styles.inactive, { color: colors.error }]}>Inactive</Text>
                      )}
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>

        <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: withAlpha(colors.shadowColor, isDark ? 0.8 : 0.5) }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}> 
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editing ? 'Edit Subject' : 'Create Subject'}
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Code *</Text>
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.primary }]}
                    placeholder="e.g., BCA101"
                    placeholderTextColor={colors.textMuted}
                    value={form.code}
                    onChangeText={(t) => setForm({ ...form, code: t })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Name *</Text>
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.primary }]}
                    placeholder="Subject name"
                    placeholderTextColor={colors.textMuted}
                    value={form.name}
                    onChangeText={(t) => setForm({ ...form, name: t })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Course *</Text>
                  <Picker
                    selectedValue={form.course_id}
                    onValueChange={(v) => setForm({ ...form, course_id: v })}
                    style={[styles.picker, { color: colors.textPrimary }]}
                  >
                    <Picker.Item label="Select course" value="" />
                    {courses.map(c => (
                      <Picker.Item
                        key={c.id}
                        label={c.program_type ? `${c.name} (${c.program_type})` : c.name}
                        value={c.id}
                      />
                    ))}
                  </Picker>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Semester</Text>
                  <Picker
                    selectedValue={form.semester_id}
                    onValueChange={(v) => setForm({ ...form, semester_id: v })}
                    style={[styles.picker, { color: colors.textPrimary }]}
                  >
                    <Picker.Item label="Select semester" value="" />
                    {semesters.map(s => (
                      <Picker.Item key={s.id} label={s.name} value={s.id} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Credits</Text>
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary, borderColor: colors.primary }]}
                      keyboardType="numeric"
                      value={form.credits}
                      onChangeText={(t) => setForm({ ...form, credits: t })}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={[styles.label, { color: colors.textPrimary }]}>Contact Hours</Text>
                    <TextInput
                      style={[styles.input, { color: colors.textPrimary, borderColor: colors.primary }]}
                      keyboardType="numeric"
                      value={form.contact_hours}
                      onChangeText={(t) => setForm({ ...form, contact_hours: t })}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Subject Type</Text>
                  <Picker
                    selectedValue={form.subject_type}
                    onValueChange={(v) => setForm({ ...form, subject_type: v as Subject['subject_type'] })}
                    style={[styles.picker, { color: colors.textPrimary }]}
                  >
                    <Picker.Item label="Core" value="core" />
                    <Picker.Item label="Elective" value="elective" />
                    <Picker.Item label="Open Elective" value="open_elective" />
                    <Picker.Item label="Lab" value="lab" />
                  </Picker>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <PrimaryButton
                  title={saving ? 'Saving...' : editing ? 'Update Subject' : 'Create Subject'}
                  onPress={handleSave}
                  disabled={saving}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 8, marginRight: 10 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 15, marginTop: 12 },
  card: { padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  codeBadge: { width: 50, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  codeText: { fontSize: 12, fontWeight: '700' },
  cardInfo: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  inactive: { fontSize: 12, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  form: { paddingHorizontal: 20 },
  formGroup: { marginTop: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  picker: { borderWidth: 1, borderColor: 'transparent', borderRadius: 10 },
  row: { flexDirection: 'row', marginTop: 6 },
  modalFooter: { padding: 20 },
});
