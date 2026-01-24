import React from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  AnimatedBackground,
  Card,
  SettingsHeader,
  SettingsRow,
  SettingsSection,
} from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import { STUDENT_ROUTES, AUTH_ROUTES } from '../../../lib/routes';

export default function StudentSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, activeThemeName, mode } = useThemeStore();
  const { user, profile, logout } = useAuthStore();
  const { pushNotificationsEnabled } = useAppSettingsStore();

  const version = Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.0.0';

  const doLogout = async () => {
    try {
      try {
        await (supabase.auth as any).signOut?.({ scope: 'local' });
      } catch {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore and still clear local state
    }

    logout();
    router.replace(AUTH_ROUTES.LOGIN);
  };

  const confirmLogout = () => {
    Alert.alert('Sign out?', 'You will need to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 110, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader title="Settings" subtitle="Preferences and account" onBack={() => router.back()} />

        <Animated.View entering={FadeInDown.duration(220)}>
          <Card style={styles.profileCard}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile?.full_name || user?.email || 'Student'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {user?.email || profile?.email || 'Not available'}
            </Text>
            <View style={styles.profileMetaRow}>
              <Text style={[styles.profileMeta, { color: colors.textMuted }]}>Theme: {activeThemeName}</Text>
              <Text style={[styles.profileMeta, { color: colors.textMuted }]}>Mode: {mode}</Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(220)}>
          <SettingsSection title="Account">
            <SettingsRow
              title="Profile"
              subtitle="View your details"
              icon="person"
              onPress={() => router.push(STUDENT_ROUTES.PROFILE as any)}
            />
            <SettingsRow
              title="Sign out"
              subtitle="Log out from this device"
              icon="log-out-outline"
              destructive
              onPress={confirmLogout}
              disabled={!user}
            />
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(220)}>
          <SettingsSection title="Appearance">
            <SettingsRow
              title="Theme & effects"
              subtitle="Mode, preset, animations"
              icon="color-palette"
              onPress={() => router.push(STUDENT_ROUTES.SETTINGS_APPEARANCE as any)}
            />
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(220)}>
          <SettingsSection title="Notifications">
            <SettingsRow
              title="Notifications"
              subtitle={pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
              icon="notifications"
              onPress={() => router.push(STUDENT_ROUTES.SETTINGS_NOTIFICATIONS as any)}
            />
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(170).duration(220)}>
          <SettingsSection title="Privacy">
            <SettingsRow
              title="Privacy & security"
              subtitle="Data saver, analytics, lock"
              icon="shield-checkmark"
              onPress={() => router.push(STUDENT_ROUTES.SETTINGS_PRIVACY as any)}
            />
          </SettingsSection>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(210).duration(220)}>
          <SettingsSection title="About">
            <SettingsRow
              title="About this app"
              subtitle={`Version ${String(version)}`}
              icon="information-circle"
              onPress={() => router.push(STUDENT_ROUTES.SETTINGS_ABOUT as any)}
            />
          </SettingsSection>
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    marginTop: 6,
    marginBottom: 8,
    padding: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
  },
  profileEmail: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },
  profileMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileMeta: {
    fontSize: 11,
    fontWeight: '700',
  },
});
