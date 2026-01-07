import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
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

export default function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissionsByAssignmentId, setSubmissionsByAssignmentId] = useState<Record<string, any>>({});
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_marks,
          attachment_urls,
          courses:courses(name, code)
        `)
        .eq('section_id', student.section_id)
        .eq('is_active', true)
        .order('due_date', { ascending: true });

      if (fetchError) throw fetchError;

      const rows = data || [];
      setAssignments(rows);

      const assignmentIds = rows.map((r: any) => r.id).filter(Boolean);
      if (assignmentIds.length === 0) {
        setSubmissionsByAssignmentId({});
        return;
      }

      const { data: subs, error: subError } = await supabase
        .from('assignment_submissions')
        .select('id, assignment_id, submitted_at, is_late, marks_obtained, graded_at')
        .eq('student_id', student.id)
        .in('assignment_id', assignmentIds);

      if (subError) {
        console.log('Student submissions error:', subError.message);
        setSubmissionsByAssignmentId({});
        return;
      }

      const map: Record<string, any> = {};
      (subs || []).forEach((s: any) => {
        map[s.assignment_id] = s;
      });
      setSubmissionsByAssignmentId(map);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
  };

  const computedAssignments = useMemo(() => {
    return assignments.map((a: any) => {
      const sub = submissionsByAssignmentId[a.id];
      const status: 'pending' | 'submitted' | 'graded' = !sub
        ? 'pending'
        : sub.graded_at || sub.marks_obtained != null
          ? 'graded'
          : 'submitted';
      return { ...a, _submission: sub, _status: status };
    });
  }, [assignments, submissionsByAssignmentId]);

  const filteredAssignments = computedAssignments.filter((a: any) => {
    if (filter === 'all') return true;
    return a._status === filter;
  });

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Assignments</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
            {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: filter === f ? colors.primary : withAlpha(colors.primary, 0.1),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: filter === f ? colors.background : colors.primary,
                      fontWeight: filter === f ? '700' : '600',
                    },
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Assignments List */}
        {filteredAssignments.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Card style={{ marginTop: 16 }}>
              {filteredAssignments.map((assignment: any, index) => {
                const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
                const now = new Date();
                const hasValidDue = !!dueDate && !Number.isNaN(dueDate.getTime());
                const daysLeft = hasValidDue
                  ? Math.ceil(((dueDate as Date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const isOverdue = hasValidDue ? (daysLeft as number) < 0 : false;

                const status = assignment._status as 'pending' | 'submitted' | 'graded';
                const statusAccent =
                  status === 'graded'
                    ? colors.success
                    : status === 'submitted'
                      ? colors.warning
                      : colors.textMuted;
                const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

                return (
                  <TouchableOpacity
                    key={assignment.id}
                    style={[styles.assignmentItem, { borderBottomColor: colors.cardBorder }, index < filteredAssignments.length - 1 && { borderBottomWidth: 1 }]}
                    activeOpacity={0.9}
                    onPress={() => router.push(`/(student)/assignments/${assignment.id}`)}
                  >
                    <View style={styles.assignmentContent}>
                      <Text style={[styles.assignmentTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {assignment.title}
                      </Text>
                      <Text style={[styles.assignmentCourse, { color: colors.textSecondary }]}>
                        {assignment.courses?.name || 'Course'}
                        {assignment.due_date ? ` • Due ${assignment.due_date}` : ''}
                      </Text>
                      <Text style={[styles.assignmentDescription, { color: colors.textMuted }]} numberOfLines={1}>
                        {assignment.description || 'No description'}
                      </Text>

                      {!!assignment.attachment_urls?.length && (
                        <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {assignment.attachment_urls.slice(0, 2).map((u: string) => (
                            <TouchableOpacity
                              key={u}
                              onPress={(e) => {
                                e.stopPropagation?.();
                                Linking.openURL(u);
                              }}
                              style={[
                                styles.attachmentChip,
                                {
                                  backgroundColor: withAlpha(colors.primary, isDark ? 0.16 : 0.1),
                                  borderColor: withAlpha(colors.primary, 0.35),
                                },
                              ]}
                            >
                              <Ionicons name="attach-outline" size={14} color={colors.primary} />
                              <Text style={[styles.attachmentText, { color: colors.primary }]} numberOfLines={1}>
                                Open
                              </Text>
                            </TouchableOpacity>
                          ))}

                          {assignment.attachment_urls.length > 2 && (
                            <View
                              style={[
                                styles.attachmentChip,
                                {
                                  backgroundColor: withAlpha(colors.textMuted, isDark ? 0.18 : 0.1),
                                  borderColor: withAlpha(colors.textMuted, 0.35),
                                },
                              ]}
                            >
                              <Text style={[styles.attachmentText, { color: colors.textSecondary }]}>
                                +{assignment.attachment_urls.length - 2}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                      <View
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor: withAlpha(statusAccent, isDark ? 0.22 : 0.12),
                            borderColor: withAlpha(statusAccent, 0.35),
                          },
                        ]}
                      >
                        <Text style={[styles.statusChipText, { color: statusAccent }]}>{statusLabel}</Text>
                      </View>

                      <View
                        style={[
                          styles.dueBadge,
                          {
                            backgroundColor: isOverdue
                              ? withAlpha(colors.error, 0.12)
                              : withAlpha(colors.warning, 0.12),
                            borderColor: isOverdue
                              ? withAlpha(colors.error, 0.35)
                              : withAlpha(colors.warning, 0.35),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dueBadgeText,
                            {
                              color: isOverdue ? colors.error : colors.warning,
                            },
                          ]}
                        >
                          {hasValidDue ? (isOverdue ? 'Overdue' : `${daysLeft}d`) : 'No due'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </Card>
          </Animated.View>
        ) : (
          <Card style={{ marginTop: 20, alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.noText, { color: colors.textSecondary, marginTop: 12 }]}>
              No assignments found
            </Text>
          </Card>
        )}

        {error && (
          <Card style={{ marginTop: 16, backgroundColor: withAlpha(colors.error, 0.12) }}>
            <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text>
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
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  assignmentContent: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  assignmentCourse: {
    fontSize: 12,
    marginBottom: 4,
  },
  assignmentDescription: {
    fontSize: 11,
  },
  dueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  dueBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 110,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  noText: {
    fontSize: 14,
  },
});
