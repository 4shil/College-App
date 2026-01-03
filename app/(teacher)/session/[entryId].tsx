import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';

type TimetableEntryRow = {
  id: string;
  day_of_week: number;
  period: number;
  course_id: string | null;
  year_id: string | null;
  section_id: string | null;
  room: string | null;
  is_lab: boolean | null;
  teacher_id: string | null;
  courses?: { code: string; name: string; short_name: string | null } | null;
  years?: { name: string } | null;
  sections?: { name: string } | null;
};

const PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35' },
  { period: 2, start: '10:50', end: '11:40' },
  { period: 3, start: '11:50', end: '12:45' },
  { period: 4, start: '13:25', end: '14:15' },
  { period: 5, start: '14:20', end: '15:10' },
];

function todayYmd() {
  return new Date().toISOString().split('T')[0];
}

export default function TeacherSessionToolsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ entryId: string }>();

  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const entryId = (params.entryId || '').trim();

  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [entry, setEntry] = useState<TimetableEntryRow | null>(null);

  const timing = useMemo(() => {
    const p = entry?.period || 0;
    return PERIOD_TIMINGS.find((x) => x.period === p) || null;
  }, [entry?.period]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchEntry = useCallback(
    async (tId: string | null) => {
      if (!entryId) return null;

      const { data, error } = await supabase
        .from('timetable_entries')
        .select(
          `
            id,
            day_of_week,
            period,
            course_id,
            year_id,
            section_id,
            room,
            is_lab,
            teacher_id,
            courses:courses!timetable_entries_course_id_fkey(code, name, short_name),
            years(name),
            sections(name)
          `
        )
        .eq('id', entryId)
        .single();

      if (error || !data) {
        console.log('Teacher session tools entry error:', error?.message || 'Not found');
        return null;
      }

      if (tId && data.teacher_id && data.teacher_id !== tId) {
        Alert.alert('Unauthorized', 'You are not assigned to this class');
        router.back();
        return null;
      }

      return data as TimetableEntryRow;
    },
    [entryId, router]
  );

  useEffect(() => {
    const init = async () => {
      if (!entryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      const row = await fetchEntry(tId);
      setEntry(row);
      setLoading(false);

      if (!row) {
        Alert.alert('Error', 'Timetable entry not found');
        router.back();
      }
    };

    init();
  }, [entryId, fetchEntry, fetchTeacherId, router]);

  const canMarkAttendance = !!entry?.course_id && !!entry?.year_id && !!entry?.period;

  const openAttendance = () => {
    if (!entry) return;
    if (!canMarkAttendance) {
      Alert.alert('Missing info', 'This period is missing course/year details');
      return;
    }

    router.push({
      pathname: '/(teacher)/attendance/mark',
      params: {
        entryId: entry.id,
        courseId: entry.course_id as string,
        yearId: entry.year_id as string,
        period: String(entry.period),
        date: todayYmd(),
        courseName: entry.courses?.name || '',
      },
    });
  };

  const openMaterials = () => {
    if (!entry?.course_id) {
      router.push('/(teacher)/materials/create');
      return;
    }
    router.push({ pathname: '/(teacher)/materials/create', params: { courseId: entry.course_id } });
  };

  const openAssignments = () => {
    if (!entry?.course_id) {
      router.push('/(teacher)/assignments/create');
      return;
    }
    router.push({ pathname: '/(teacher)/assignments/create', params: { courseId: entry.course_id } });
  };

  const openNotices = () => {
    if (!entry?.section_id) {
      router.push('/(teacher)/notices/create');
      return;
    }
    router.push({ pathname: '/(teacher)/notices/create', params: { sectionId: entry.section_id } });
  };

  const openResults = () => {
    router.push('/(teacher)/results/index');
  };

  const title = useMemo(() => {
    const course = entry?.courses?.short_name || entry?.courses?.code || entry?.courses?.name || 'Class';
    const year = entry?.years?.name ? ` • ${entry.years.name}` : '';
    const sect = entry?.sections?.name ? ` • ${entry.sections.name}` : '';
    return `${course}${year}${sect}`;
  }, [entry?.courses, entry?.sections?.name, entry?.years?.name]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}> 
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 14 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Session tools</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Quick actions for this period</Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : !entry ? null : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  P{entry.period}
                  {timing ? ` • ${timing.start}-${timing.end}` : ''}
                </Text>
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{title}</Text>
                {entry.room ? (
                  <Text style={[styles.meta, { color: colors.textMuted }]}>Room: {entry.room}</Text>
                ) : null}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(350)} style={{ gap: 10 }}>
              <PrimaryButton
                title="Mark attendance"
                onPress={openAttendance}
                disabled={!canMarkAttendance}
              />
              <PrimaryButton title="Create material" onPress={openMaterials} />
              <PrimaryButton title="Create assignment" onPress={openAssignments} />
              <PrimaryButton title="Create notice" onPress={openNotices} />
              <PrimaryButton title="Open marks entry" onPress={openResults} />
            </Animated.View>

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
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subTitle: {
    marginTop: 6,
    fontSize: 13,
  },
  meta: {
    marginTop: 8,
    fontSize: 12,
  },
});
