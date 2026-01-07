import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Animated, { FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, PrimaryButton, ThemeToggle } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

export default function StudentSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, animationsEnabled, toggleAnimations, activeThemeName } = useThemeStore();
  const { user, profile, logout } = useAuthStore();

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
    router.replace('/(auth)/login');
  };

  const confirmLogout = () => {
    Alert.alert('Sign out?', 'You will need to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doLogout },
    ]);
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
          <ThemeToggle />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInRight.duration(300)}>
            <Card style={{ marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>Signed in as</Text>

              <View style={{ marginTop: 10 }}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {profile?.full_name || user?.email || 'Student'}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>
                  {user?.email || profile?.email || 'Not available'}
                </Text>
              </View>

              <View style={{ marginTop: 12 }}>
                <PrimaryButton
                  title="Open Profile"
                  onPress={() => router.push('/(student)/profile')}
                  variant="outline"
                  size="medium"
                />
              </View>
            </Card>

            <Card style={{ marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Appearance</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Theme: {activeThemeName}
              </Text>

              <View style={styles.switchRow}>
                <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>Animations</Text>
                <Switch
                  value={animationsEnabled}
                  onValueChange={toggleAnimations}
                  trackColor={{ false: withAlpha(colors.textMuted, 0.25), true: withAlpha(colors.primary, 0.35) }}
                  thumbColor={animationsEnabled ? colors.primary : colors.textMuted}
                />
              </View>

              <Text style={[styles.hint, { color: colors.textMuted }]}>Use the moon/sun button to toggle dark mode.</Text>
            </Card>

            <Card>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Security</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Sign out from this device
              </Text>
              <View style={{ marginTop: 12 }}>
                <PrimaryButton
                  title="Sign out"
                  onPress={confirmLogout}
                  variant="outline"
                  size="medium"
                  disabled={!user}
                />
              </View>
            </Card>
          </Animated.View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 4,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowMeta: {
    fontSize: 12,
  },
  switchRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: {
    marginTop: 8,
    fontSize: 11,
  },
});
