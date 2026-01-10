import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

type StudentModuleCard = {
  id: string;
  title: string;
  icon: string;
  route: string;
};

export default function StudentModulesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const modules = useMemo<StudentModuleCard[]>(() => {
    const all: StudentModuleCard[] = [
      { id: 'attendance', title: 'Attendance', icon: 'checkmark-circle', route: '/(student)/attendance' },
      { id: 'timetable', title: 'Schedule', icon: 'calendar', route: '/(student)/timetable' },
      { id: 'materials', title: 'Materials', icon: 'book', route: '/(student)/materials' },
      { id: 'assignments', title: 'Assignments', icon: 'clipboard', route: '/(student)/assignments' },
      { id: 'marks', title: 'Marks', icon: 'stats-chart', route: '/(student)/marks' },
      { id: 'exams', title: 'Exams', icon: 'school', route: '/(student)/exams' },
      { id: 'results', title: 'Results', icon: 'trophy', route: '/(student)/results' },
      { id: 'library', title: 'Library', icon: 'library', route: '/(student)/library' },
      { id: 'notices', title: 'Notices', icon: 'notifications', route: '/(student)/notices' },
      { id: 'events', title: 'Events', icon: 'calendar-number', route: '/(student)/events' },
      { id: 'fees', title: 'Fees', icon: 'receipt', route: '/(student)/fees' },
      { id: 'canteen', title: 'Canteen', icon: 'restaurant', route: '/(student)/canteen' },
      { id: 'bus', title: 'Bus', icon: 'bus', route: '/(student)/bus' },
      { id: 'feedback', title: 'Feedback', icon: 'chatbubbles', route: '/(student)/feedback' },
      { id: 'honors', title: 'Honors', icon: 'medal', route: '/(student)/honors' },
      { id: 'support', title: 'Support', icon: 'help-circle', route: '/(student)/support' },
      { id: 'profile', title: 'Profile', icon: 'person', route: '/(student)/profile' },
      { id: 'settings', title: 'Settings', icon: 'settings', route: '/(student)/settings' },
    ];

    // Keep a stable, predictable order.
    const order = all.map((m) => m.id);
    return all.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, []);

  const cardWidthStyle = { width: '48%' as const };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Modules</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>All student tools in one place</Text>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {modules.map((m, index) => (
              <Animated.View
                key={m.id}
                entering={FadeInDown.delay(60 + index * 25).duration(250)}
                style={cardWidthStyle}
              >
                <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(m.route as any)}>
                  <Card>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1),
                          borderColor: withAlpha(colors.primary, 0.35),
                        },
                      ]}
                    >
                      <Ionicons name={m.icon as any} size={22} color={colors.primary} />
                    </View>
                    <Text style={[styles.moduleTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                      {m.title}
                    </Text>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {modules.length === 0 ? (
            <Card>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No modules available</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Contact admin for access.</Text>
            </Card>
          ) : null}

          <View style={{ height: 10 }} />
        </ScrollView>
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
    fontWeight: '800',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
});
