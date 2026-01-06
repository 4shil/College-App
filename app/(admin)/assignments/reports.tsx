import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

export default function AssignmentReportsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('all');
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [avgMarks, setAvgMarks] = useState(0);
  const [submissionRate, setSubmissionRate] = useState(0);
  const [lateSubmissions, setLateSubmissions] = useState(0);
  const [assignmentStats, setAssignmentStats] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      let dateFilter = '';
      const now = new Date();
      if (timeframe === 'today') dateFilter = now.toISOString().split('T')[0];
      else if (timeframe === 'week') dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      else if (timeframe === 'month') dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [assignmentsRes, submissionsRes, assignmentStatsRes] = await Promise.all([
        supabase.from('assignments').select('id, due_date').eq('status', 'active'),
        supabase.from('assignment_submissions').select('*, assignment:assignments(title,max_marks,due_date)'),
        supabase.from('assignments').select('id, title, max_marks, assignment_submissions(marks_obtained, submission_date, status)').eq('status', 'active'),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (submissionsRes.error) throw submissionsRes.error;
      if (assignmentStatsRes.error) throw assignmentStatsRes.error;

      const assignments = assignmentsRes.data || [];
      let submissions = submissionsRes.data || [];

      if (dateFilter && timeframe !== 'today') {
        submissions = submissions.filter((s: any) => new Date(s.submission_date) >= new Date(dateFilter));
      } else if (timeframe === 'today') {
        submissions = submissions.filter((s: any) => s.submission_date.startsWith(dateFilter));
      }

      setTotalAssignments(assignments.length);
      const pending = submissions.filter((s: any) => s.status === 'submitted').length;
      const graded = submissions.filter((s: any) => s.status === 'graded').length;
      setPendingCount(pending);
      setGradedCount(graded);

      const gradedSubmissions = submissions.filter((s: any) => s.status === 'graded' && s.marks_obtained != null);
      if (gradedSubmissions.length > 0) {
        const totalMarks = gradedSubmissions.reduce((sum: number, s: any) => sum + (s.marks_obtained || 0), 0);
        setAvgMarks(Math.round(totalMarks / gradedSubmissions.length * 10) / 10);
      } else {
        setAvgMarks(0);
      }

      const totalExpected = assignments.length * 30;
      const submissionPercentage = totalExpected > 0 ? Math.round((submissions.length / totalExpected) * 100) : 0;
      setSubmissionRate(submissionPercentage);

      const late = submissions.filter((s: any) => {
        if (!s.assignment?.due_date) return false;
        return new Date(s.submission_date) > new Date(s.assignment.due_date);
      }).length;
      setLateSubmissions(late);

      const stats = (assignmentStatsRes.data || []).map((a: any) => {
        const subs = a.assignment_submissions || [];
        const gradedSubs = subs.filter((s: any) => s.status === 'graded' && s.marks_obtained != null);
        const avgMark = gradedSubs.length > 0
          ? Math.round(gradedSubs.reduce((sum: number, s: any) => sum + s.marks_obtained, 0) / gradedSubs.length * 10) / 10
          : 0;
        const subRate = subs.length > 0 ? Math.round((subs.length / 30) * 100) : 0;
        return { title: a.title, max_marks: a.max_marks, avg_marks: avgMark, submission_rate: subRate, total_submissions: subs.length };
      });
      setAssignmentStats(stats);

      const { data: topData, error: topError } = await supabase.rpc('get_top_performers_assignments', {});
      if (!topError && topData) {
        setTopPerformers(topData.slice(0, 5));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch reports');
    }
  }, [timeframe]);

  useEffect(() => {
    const load = async () => { setLoading(true); await fetchData(); setLoading(false); };
    load();
  }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  if (loading) return <AnimatedBackground><View style={[styles.container, { paddingTop: insets.top + 60 }]}><LoadingIndicator size="large" color={colors.primary} /></View></AnimatedBackground>;

  return (
    <Restricted permissions={PERMISSIONS.MANAGE_ASSIGNMENTS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Assignment Reports</Text>

        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={[styles.filterLabel, { color: colors.textPrimary }]}>Timeframe</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder }]}>
            <Picker selectedValue={timeframe} onValueChange={setTimeframe} style={[styles.picker, { color: colors.textPrimary }]} dropdownIconColor={colors.textPrimary}>
              <Picker.Item label="All Time" value="all" />
              <Picker.Item label="Today" value="today" />
              <Picker.Item label="Last 7 Days" value="week" />
              <Picker.Item label="Last 30 Days" value="month" />
            </Picker>
          </View>
        </Card>

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <FontAwesome5 name="file-alt" size={24} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalAssignments}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Assignments</Text>
            </Card>
            <Card style={styles.statCard}>
              <FontAwesome5 name="clock" size={24} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{pendingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <FontAwesome5 name="check-circle" size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{gradedCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Graded</Text>
            </Card>
            <Card style={styles.statCard}>
              <FontAwesome5 name="chart-line" size={24} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{avgMarks}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Marks</Text>
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <FontAwesome5 name="percentage" size={24} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{submissionRate}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Submission Rate</Text>
            </Card>
            <Card style={styles.statCard}>
              <FontAwesome5 name="exclamation-triangle" size={24} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{lateSubmissions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Late Submissions</Text>
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Assignment Statistics</Text>
            {assignmentStats.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data available</Text>
            ) : (
              assignmentStats.map((stat, i) => (
                <View key={i} style={[styles.statItem, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.statItemTitle, { color: colors.textPrimary }]}>{stat.title}</Text>
                  <View style={styles.statItemDetails}>
                    <Text style={[styles.statItemText, { color: colors.textSecondary }]}>Avg: {stat.avg_marks}/{stat.max_marks}</Text>
                    <Text style={[styles.statItemText, { color: colors.textSecondary }]}>Rate: {stat.submission_rate}%</Text>
                    <Text style={[styles.statItemText, { color: colors.textSecondary }]}>Subs: {stat.total_submissions}</Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card style={{ padding: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Performers</Text>
            {topPerformers.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No data available</Text>
            ) : (
              topPerformers.map((performer, i) => (
                <View key={i} style={[styles.performerItem, { borderBottomColor: colors.cardBorder }]}>
                  <View style={[styles.rank, { backgroundColor: colors.inputBackground, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                    <Text style={[styles.rankText, { color: colors.textPrimary }]}>{i + 1}</Text>
                  </View>
                  <View style={styles.performerInfo}>
                    <Text style={[styles.performerName, { color: colors.textPrimary }]}>{performer.full_name}</Text>
                    <Text style={[styles.performerMeta, { color: colors.textSecondary }]}>{performer.roll_number}</Text>
                  </View>
                  <Text style={[styles.performerAvg, { color: colors.primary }]}>{performer.avg_marks}</Text>
                </View>
              ))
            )}
          </Card>
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  filterLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  picker: { height: 50 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  statItem: { paddingVertical: 12, borderBottomWidth: 1 },
  statItemTitle: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  statItemDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  statItemText: { fontSize: 13 },
  performerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  rank: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: 'bold' },
  performerInfo: { flex: 1 },
  performerName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  performerMeta: { fontSize: 12 },
  performerAvg: { fontSize: 16, fontWeight: 'bold' },
});
