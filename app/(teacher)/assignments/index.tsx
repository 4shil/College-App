import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type AssignmentRow = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  max_marks: number | null;
  is_active: boolean;
  created_at: string;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

function formatDueDate(dueIso: string) {
  try {
    const dt = new Date(dueIso);
    if (Number.isNaN(dt.getTime())) return dueIso;
    return dt.toLocaleString();
  } catch {
    return dueIso;
  }
}

export default function TeacherAssignmentsIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.log('Teacher assignments teacher id error:', error.message);
      setErrorText('Unable to load teacher profile');
      return null;
    }
    return teacher?.id || null;
  }, [user?.id]);

  const fetchAssignments = useCallback(async () => {
    if (!teacherId) return;

    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
          id,
          title,
          description,
          due_date,
          max_marks,
          is_active,
          created_at,
          courses(code, name, short_name)
        `
      )
      .eq('teacher_id', teacherId)
      .order('due_date', { ascending: true });

    if (error) {
      console.log('Teacher assignments error:', error.message);
      setErrorText('Unable to load assignments. Pull to refresh or try again.');
      setAssignments([]);
      return;
    }

    setErrorText(null);
    setAssignments((data || []) as AssignmentRow[]);
  }, [teacherId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorText(null);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      setLoading(false);
    };
    init();
  }, [fetchTeacherId]);

  useEffect(() => {
    if (!teacherId) return;
    fetchAssignments();
  }, [teacherId, fetchAssignments]);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrorText(null);
    await fetchAssignments();
    setRefreshing(false);
  };

  const subtitle = useMemo(() => {
    const count = assignments.length;
    if (count === 0) return 'No assignments yet';
    if (count === 1) return '1 assignment';
    return `${count} assignments`;
  }, [assignments.length]);

  const openCreate = () => {
    router.push('/(teacher)/assignments/create');
  };

  const openSubmissions = (assignmentId: string) => {
    router.push({
      pathname: '/(teacher)/assignments/submissions',
      params: { assignmentId },
    });
  };

  const toggleActive = async (row: AssignmentRow) => {
    if (!teacherId) return;

    const next = !row.is_active;
    const { error } = await supabase
      .from('assignments')
      .update({ is_active: next })
      .eq('id', row.id)
      .eq('teacher_id', teacherId);

    if (error) {
      Alert.alert('Error', 'Failed to update assignment');
      return;
    }

    setAssignments((prev) => prev.map((a) => (a.id === row.id ? { ...a, is_active: next } : a)));
  };

  const renderRow = (a: AssignmentRow, index: number) => {
    const chipBg = a.is_active
      ? withAlpha(colors.success, isDark ? 0.22 : 0.12)
      : isDark
        ? withAlpha(colors.textInverse, 0.08)
        : withAlpha(colors.shadowColor, 0.06);

    const chipText = a.is_active ? colors.success : colors.textMuted;

    return (
      <Animated.View key={a.id} entering={FadeInDown.delay(index * 30).duration(280)} style={{ marginBottom: 12 }}>
        <Card>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {a.title}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
                {(a.courses?.short_name || a.courses?.code || a.courses?.name || 'Course')}
                {a.max_marks != null ? ` • Max ${a.max_marks}` : ''}
              </Text>
              <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                Due: {formatDueDate(a.due_date)}
              </Text>
              {a.description ? (
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
                  {a.description}
                </Text>
              ) : null}
            </View>

            <View style={styles.rightCol}>
              <View style={[styles.chip, { backgroundColor: chipBg }]}>
                <Text style={[styles.chipText, { color: chipText }]}>{a.is_active ? 'Active' : 'Closed'}</Text>
              </View>

              <TouchableOpacity
                onPress={() => openSubmissions(a.id)}
                style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                activeOpacity={0.85}
              >
                <Ionicons name="people-outline" size={18} color={colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => toggleActive(a)}
                style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                activeOpacity={0.85}
              >
                <Ionicons name={a.is_active ? 'pause-outline' : 'play-outline'} size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]}>Assignments</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>{subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={openCreate}
              activeOpacity={0.85}
              style={[styles.fab, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.14) }]}
            >
              <Ionicons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading assignments...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {errorText ? (
              <View style={{ marginBottom: 12 }}>
                <Card>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Couldn’t load assignments</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>{errorText}</Text>
                  <View style={{ marginTop: 12 }}>
                    <PrimaryButton title="Retry" onPress={fetchAssignments} variant="outline" />
                  </View>
                </Card>
              </View>
            ) : null}

            {assignments.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No assignments</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Create an assignment for your class.</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton title="Create Assignment" onPress={openCreate} />
                </View>
              </Card>
            ) : (
              assignments.map(renderRow)
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});
