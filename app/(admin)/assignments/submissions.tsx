import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface Submission {
  id: string; submission_date: string; marks_obtained?: number; status: string; assignment_id: string;
  student?: { roll_number: string; user?: { full_name: string; }; };
  assignment?: { title: string; max_marks: number; due_date: string; };
}

export default function SubmissionsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filterAssignment, setFilterAssignment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [submissionsRes, assignmentsRes] = await Promise.all([
        supabase.from('assignment_submissions').select('*, student:students(roll_number,user:users(full_name)), assignment:assignments(title,max_marks,due_date)').order('submission_date', { ascending: false }),
        supabase.from('assignments').select('id, title').eq('status', 'active'),
      ]);
      if (submissionsRes.error) throw submissionsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      setSubmissions(submissionsRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch submissions');
    }
  }, []);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchData(); setLoading(false); };
    load();
  }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const filteredSubmissions = submissions.filter(s => {
    if (filterAssignment !== 'all' && s.assignment_id !== filterAssignment) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  const totalSubmissions = filteredSubmissions.length;
  const gradedCount = filteredSubmissions.filter(s => s.status === 'graded').length;
  const pendingCount = filteredSubmissions.filter(s => s.status === 'submitted').length;
  const lateCount = filteredSubmissions.filter(s => {
    if (!s.assignment?.due_date) return false;
    return new Date(s.submission_date) > new Date(s.assignment.due_date);
  }).length;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'graded': return colors.success;
      case 'submitted': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><LoadingIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.MANAGE_ASSIGNMENTS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Assignment Submissions</Text>
        
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <FontAwesome5 name="file-alt" size={24} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalSubmissions}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </Card>
          <Card style={styles.statCard}>
            <FontAwesome5 name="check-circle" size={24} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{gradedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Graded</Text>
          </Card>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <FontAwesome5 name="clock" size={24} color={colors.warning} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </Card>
          <Card style={styles.statCard}>
            <FontAwesome5 name="exclamation-triangle" size={24} color={colors.error} />
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{lateCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Late</Text>
          </Card>
        </View>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Filter by Assignment</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker selectedValue={filterAssignment} onValueChange={setFilterAssignment} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
              <Picker.Item label="All Assignments" value="all" />
              {assignments.map(a => <Picker.Item key={a.id} label={a.title} value={a.id} />)}
            </Picker>
          </View>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Filter by Status</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker selectedValue={filterStatus} onValueChange={setFilterStatus} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
              <Picker.Item label="All Status" value="all" />
              <Picker.Item label="Submitted" value="submitted" />
              <Picker.Item label="Graded" value="graded" />
            </Picker>
          </View>
        </Card>

        {filteredSubmissions.map((submission, i) => {
          const isLate = submission.assignment?.due_date && new Date(submission.submission_date) > new Date(submission.assignment.due_date);
          return (
            <Animated.View key={submission.id} entering={FadeInDown.delay(i * 30).springify()}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.icon,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <FontAwesome5 name="user-graduate" size={20} color={getStatusColor(submission.status)} />
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.studentName, { color: colors.textPrimary }]}>{submission.student?.user?.full_name}</Text>
                    <Text style={[styles.meta, { color: colors.textSecondary }]}>{submission.student?.roll_number}</Text>
                  </View>
                  {isLate && (
                    <View style={[styles.badge, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderWidth: 1 }]}>
                      <Text style={[styles.badgeText, { color: colors.error }]}>LATE</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.assignmentTitle, { color: colors.textPrimary }]}>{submission.assignment?.title}</Text>
                <View style={styles.details}>
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Submitted:</Text>
                    <Text style={[styles.value, { color: colors.textPrimary }]}>{new Date(submission.submission_date).toLocaleDateString()}</Text>
                  </View>
                  {submission.status === 'graded' && (
                    <View style={styles.row}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Marks:</Text>
                      <Text style={[styles.value, { color: colors.textPrimary }]}>{submission.marks_obtained}/{submission.assignment?.max_marks}</Text>
                    </View>
                  )}
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Status:</Text>
                    <Text style={[styles.value, { color: getStatusColor(submission.status) }]}>{submission.status.toUpperCase()}</Text>
                  </View>
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 14, marginTop: 4 },
  filterLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 8 },
  picker: { height: 50 },
  card: { padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  info: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  assignmentTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  details: {},
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
});
