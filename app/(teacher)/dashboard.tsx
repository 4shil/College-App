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

export default function TeacherDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user, profile, logout } = useAuthStore();

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
            <Text style={[styles.placeholder, { color: colors.textMuted }]}>
              Your teacher dashboard is coming soon...
            </Text>
            
            <View style={styles.buttonContainer}>
              <PrimaryButton
                title="Sign Out"
                onPress={handleLogout}
                variant="outline"
              />
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
  placeholder: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
