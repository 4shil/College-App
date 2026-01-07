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

export default function AssignmentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
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
          *,
          courses(name, code),
          assignment_submissions(status)
        `)
        .eq('section_id', student.section_id)
        .order('due_date', { ascending: true });

      if (fetchError) throw fetchError;

      setAssignments(data || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'all') return true;
    const status = a.assignment_submissions?.[0]?.status || 'pending';
    return status === filter;
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
                const dueDate = new Date(assignment.due_date);
                const now = new Date();
                const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysLeft < 0;

                return (
                  <TouchableOpacity
                    key={assignment.id}
                    style={[styles.assignmentItem, { borderBottomColor: colors.border }, index < filteredAssignments.length - 1 && { borderBottomWidth: 1 }]}
                  >
                    <View style={styles.assignmentContent}>
                      <Text style={[styles.assignmentTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                        {assignment.title}
                      </Text>
                      <Text style={[styles.assignmentCourse, { color: colors.textSecondary }]}>
                        {assignment.courses?.name} • Due {assignment.due_date}
                      </Text>
                      <Text style={[styles.assignmentDescription, { color: colors.textMuted }]} numberOfLines={1}>
                        {assignment.description || 'No description'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.dueBadge,
                        {
                          backgroundColor: isOverdue ? withAlpha(colors.danger || '#ef4444', 0.1) : withAlpha(colors.warning || '#f59e0b', 0.1),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dueBadgeText,
                          {
                            color: isOverdue ? colors.danger || '#ef4444' : colors.warning || '#f59e0b',
                          },
                        ]}
                      >
                        {isOverdue ? 'Overdue' : `${daysLeft}d`}
                      </Text>
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
  },
  dueBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noText: {
    fontSize: 14,
  },
});
