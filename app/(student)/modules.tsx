import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

type StudentModuleItem = {
  id: string;
  title: string;
  icon: string;
  route: string;
  implemented: boolean;
};

export default function StudentModulesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const navigatingRef = useRef(false);

  const handleNavigation = (route: string) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push(route as any);
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
  };

  const modules = useMemo(() => {
    const allModules: StudentModuleItem[] = [
      { id: 'dashboard', title: 'Home', icon: 'home', route: '/(student)/dashboard', implemented: true },
      { id: 'attendance', title: 'Attendance', icon: 'checkmark-circle', route: '/(student)/attendance', implemented: true },
      { id: 'timetable', title: 'Timetable', icon: 'calendar', route: '/(student)/timetable', implemented: true },
      { id: 'materials', title: 'Materials', icon: 'book', route: '/(student)/materials', implemented: true },
      { id: 'marks', title: 'Marks', icon: 'stats-chart', route: '/(student)/marks', implemented: true },
      { id: 'exams', title: 'Exams', icon: 'school', route: '/(student)/exams', implemented: true },
      { id: 'results', title: 'Results', icon: 'document-text', route: '/(student)/results', implemented: true },
      { id: 'assignments', title: 'Assignments', icon: 'clipboard', route: '/(student)/assignments', implemented: true },
      { id: 'notices', title: 'Notices', icon: 'notifications', route: '/(student)/notices', implemented: true },
      { id: 'events', title: 'Events', icon: 'calendar-number', route: '/(student)/events', implemented: true },
      { id: 'library', title: 'Library', icon: 'library', route: '/(student)/library', implemented: true },
      { id: 'canteen', title: 'Canteen', icon: 'restaurant', route: '/(student)/canteen', implemented: true },
      { id: 'bus', title: 'Bus', icon: 'bus', route: '/(student)/bus', implemented: true },
      { id: 'fees', title: 'Fees', icon: 'receipt', route: '/(student)/fees', implemented: true },
      { id: 'feedback', title: 'Feedback', icon: 'chatbox-ellipses', route: '/(student)/feedback', implemented: true },
      { id: 'honors', title: 'Honors / Minor', icon: 'ribbon', route: '/(student)/honors', implemented: true },
      { id: 'support', title: 'Support', icon: 'help-circle', route: '/(student)/support', implemented: true },
      { id: 'settings', title: 'Settings', icon: 'settings', route: '/(student)/settings', implemented: true },
      { id: 'profile', title: 'Profile', icon: 'person', route: '/(student)/profile', implemented: true },
    ];

    // Keep parity with teacher: show everything except dock items.
    const exclude = new Set([
      'dashboard',
      'timetable',
      'materials',
      'modules',
      'settings',
    ]);

    const unlocked = allModules.filter((m) => m.implemented && !exclude.has(m.id));

    const order = ['results', 'exams', 'events', 'canteen', 'bus', 'fees', 'feedback', 'honors', 'support', 'settings'];

    return unlocked.sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      if (ai === -1 && bi === -1) return a.title.localeCompare(b.title);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, []);

  const cardWidthStyle = { width: '48%' as const };

  return (
    <AnimatedBackground>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer, 
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Modules</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>All student tools in one place</Text>
        </Animated.View>

        <View style={styles.grid}>
          {modules.map((m, index) => (
              <Animated.View
                key={m.id}
                entering={FadeInDown.delay(60 + index * 25).duration(250)}
                style={cardWidthStyle}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleNavigation(m.route)}
                >
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
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Contact admin if something is missing.</Text>
          </Card>
        ) : null}

        <View style={{ height: 10 }} />
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
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
