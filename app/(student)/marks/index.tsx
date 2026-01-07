import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { withAlpha } from '../../../theme/colorUtils';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { useRouter } from 'expo-router';

export default function MarksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [marksData, setMarksData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMarks = async () => {
    if (!user) return;

    try {
      setError(null);
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      // Fetch internal marks
      const { data: internalMarks, error: internalError } = await supabase
        .from('exam_marks')
        .select(`
          *,
          exams(*),
          courses(name, code)
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (internalError) throw internalError;

      // Fetch external marks
      const { data: externalMarks, error: externalError } = await supabase
        .from('external_marks')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (externalError) throw externalError;

      // Calculate overall stats
      const totalMarks = (internalMarks || []).reduce((sum: number, m: any) => sum + (m.marks || 0), 0);
      const avgMarks = (internalMarks && internalMarks.length > 0) ? Math.round(totalMarks / internalMarks.length) : 0;

      setMarksData({
        internalMarks: internalMarks || [],
        externalMarks: externalMarks || [],
        totalMarks,
        avgMarks,
        recordCount: (internalMarks || []).length,
      });
    } catch (err) {
      console.error('Error fetching marks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMarks();
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <LoadingIndicator />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Marks & Results</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Overall Summary */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Card>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average Marks</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>{marksData?.avgMarks || 0}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Records</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{marksData?.recordCount || 0}</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>External</Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{(marksData?.externalMarks || []).length}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Internal Marks */}
        {marksData?.internalMarks && marksData.internalMarks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              Internal Marks
            </Text>
            <Card>
              {marksData.internalMarks.slice(0, 10).map((mark: any, index: number) => (
                <View key={mark.id} style={[styles.markItem, { borderBottomColor: colors.border }, index < 9 && { borderBottomWidth: 1 }]}>
                  <View style={styles.markLeft}>
                    <Text style={[styles.markCourse, { color: colors.textPrimary }]}>
                      {mark.courses?.name || 'Unknown'}
                    </Text>
                    <Text style={[styles.markExam, { color: colors.textSecondary }]}>
                      {mark.exams?.name || 'Exam'}
                    </Text>
                  </View>
                  <View style={[styles.markBadge, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                    <Text style={[styles.markScore, { color: colors.primary }]}>{mark.marks}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {/* External Marks */}
        {marksData?.externalMarks && marksData.externalMarks.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              External Marks
            </Text>
            <Card>
              {marksData.externalMarks.map((mark: any, index: number) => (
                <View key={mark.id} style={[styles.markItem, { borderBottomColor: colors.border }, index < marksData.externalMarks.length - 1 && { borderBottomWidth: 1 }]}>
                  <View style={styles.markLeft}>
                    <Text style={[styles.markCourse, { color: colors.textPrimary }]}>
                      {mark.semester || 'Semester'} - {mark.year || 'Year'}
                    </Text>
                    <Text style={[styles.markExam, { color: colors.textSecondary }]}>
                      Status: {mark.upload_status || 'Pending'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: mark.upload_status === 'verified' ? withAlpha(colors.success || '#22c55e', 0.1) : withAlpha(colors.warning || '#f59e0b', 0.1),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: mark.upload_status === 'verified' ? colors.success || '#22c55e' : colors.warning || '#f59e0b',
                        },
                      ]}
                    >
                      {mark.upload_status?.charAt(0).toUpperCase() + mark.upload_status?.slice(1) || 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        )}

        {error && (
          <Card style={{ marginTop: 16, backgroundColor: withAlpha(colors.danger || '#ef4444', 0.1) }}>
            <Text style={{ color: colors.danger || '#ef4444', fontSize: 14 }}>{error}</Text>
          </Card>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  markItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  markLeft: {
    flex: 1,
  },
  markCourse: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  markExam: {
    fontSize: 12,
  },
  markBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  markScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
