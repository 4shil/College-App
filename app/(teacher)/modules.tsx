import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { getUnlockedTeacherNavItems } from '../../lib/teacherModules';
import { withAlpha } from '../../theme/colorUtils';

export default function TeacherModulesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { roles } = useAuthStore();

  const modules = useMemo(() => {
    // Everything except the dock items.
    const exclude = new Set(['dashboard', 'timetable', 'materials', 'settings']);

    const unlocked = getUnlockedTeacherNavItems(roles).filter((m) => !exclude.has(m.id));

    // Keep a stable, predictable order.
    const order = [
      'attendance',
      'assignments',
      'notices',
      'results',
      'planner',
      'diary',
      'class_tools',
      'mentor',
      'coordinator',
      'department',
      'profile',
    ];

    return unlocked.sort((a, b) => {
      const ai = order.indexOf(a.id);
      const bi = order.indexOf(b.id);
      if (ai === -1 && bi === -1) return a.title.localeCompare(b.title);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [roles]);

  const cardWidthStyle = { width: '48%' as const };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Modules</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>All teacher tools in one place</Text>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {modules.map((m, index) => (
              <Animated.View
                key={m.id}
                entering={FadeInDown.delay(60 + index * 25).duration(250)}
                style={cardWidthStyle}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push(m.route as any)}
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
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Contact admin to unlock teacher access.</Text>
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
