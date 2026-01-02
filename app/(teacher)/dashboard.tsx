import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, PrimaryButton, ThemeToggle } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { getUnlockedTeacherNavItems } from '../../lib/teacherModules';

export default function TeacherDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user, profile, logout, roles } = useAuthStore();

  const unlocked = getUnlockedTeacherNavItems(roles)
    .filter((i) => i.id !== 'dashboard' && i.id !== 'profile')
    // Keep the most common teaching modules first, role-unlocked modules after.
    .sort((a, b) => {
      const order = [
        'timetable',
        'attendance',
        'results',
        'materials',
        'assignments',
        'notices',
        'planner',
        'diary',
        'class_tools',
        'mentor',
        'coordinator',
        'department',
      ];
      return order.indexOf(a.id) - order.indexOf(b.id);
    });

  const handleLogout = async () => {
    await signOut();
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <AnimatedBackground>
      {/* Theme Toggle */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={[styles.themeToggleContainer, { top: insets.top + 10 }]}
      >
        <ThemeToggle />
      </Animated.View>

      <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 }]}>
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.cardContainer}
        >
          <Card>
            <View style={styles.iconContainer}>
              <FontAwesome5 name="chalkboard-teacher" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Teacher Dashboard
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Welcome back, {profile?.full_name || user?.email || 'Teacher'}!
            </Text>

            <View style={styles.actions}>
              {unlocked.map((item, idx) => (
                <PrimaryButton
                  key={item.id}
                  title={item.title}
                  onPress={() => router.push(item.route as any)}
                  variant={idx === 0 ? 'primary' : 'outline'}
                  size="medium"
                />
              ))}
            </View>

            <View style={styles.signOut}>
              <PrimaryButton title="Sign Out" onPress={handleLogout} variant="ghost" size="medium" />
            </View>
          </Card>
        </Animated.View>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  themeToggleContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  actions: {
    marginTop: 10,
    gap: 10,
  },
  signOut: {
    marginTop: 14,
  },
});
