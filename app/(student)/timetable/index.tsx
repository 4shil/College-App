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

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [error, setError] = useState<string | null>(null);

  const fetchTimetableData = async () => {
    if (!user) return;

    try {
      setError(null);
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      // Fetch this week's timetable
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { data, error: fetchError } = await supabase
        .from('timetable_entries')
        .select(`
          *,
          courses(*),
          teachers(full_name),
          rooms(room_number)
        `)
        .eq('department_id', student.department_id)
        .eq('year_id', student.year_id)
        .eq('section_id', student.section_id)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', weekEnd.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('period', { ascending: true });

      if (fetchError) throw fetchError;

      setTimetableData(data || []);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setError(err instanceof Error ? err.message : 'Failed to load timetable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTimetableData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTimetableData();
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const getTodayClasses = () => {
    const today = new Date();
    today.setDate(today.getDate() - today.getDay() + selectedDay);
    const dateStr = today.toISOString().split('T')[0];
    return timetableData.filter((entry: any) => entry.date === dateStr);
  };

  const todayClasses = getTodayClasses();

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Timetable</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Day Selector */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={day}
                onPress={() => setSelectedDay(index)}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: selectedDay === index ? colors.primary : withAlpha(colors.primary, 0.1),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    {
                      color: selectedDay === index ? colors.background : colors.primary,
                      fontWeight: selectedDay === index ? '700' : '600',
                    },
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Classes List */}
        {todayClasses.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              Classes Today
            </Text>
            <Card>
              {todayClasses.map((entry: any, index) => (
                <View key={entry.id} style={[styles.classItem, { borderBottomColor: colors.border }, index < todayClasses.length - 1 && { borderBottomWidth: 1 }]}>
                  <View style={[styles.periodBadge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.periodText, { color: colors.background }]}>P{entry.period}</Text>
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={[styles.courseName, { color: colors.textPrimary }]}>
                      {entry.courses?.name || 'Unknown'}
                    </Text>
                    <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
                      {entry.courses?.code || ''} • {entry.rooms?.room_number || 'Room TBA'}
                    </Text>
                    <Text style={[styles.teacher, { color: colors.textMuted }]}>
                      {entry.teachers?.full_name || 'Teacher TBA'}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : (
          <Card style={{ marginTop: 20, alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.noClassText, { color: colors.textSecondary, marginTop: 12 }]}>
              No classes scheduled for this day
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
  daySelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  dayButtonText: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  periodBadge: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
  },
  classInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 12,
    marginBottom: 2,
  },
  teacher: {
    fontSize: 11,
  },
  noClassText: {
    fontSize: 14,
  },
});
