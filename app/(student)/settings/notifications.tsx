import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AnimatedBackground, SettingsHeader, SettingsSection, SettingsRow } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAppSettingsStore } from '../../../store/appSettingsStore';

export default function StudentNotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const {
    pushNotificationsEnabled,
    emailNotificationsEnabled,
    soundsEnabled,
    hapticsEnabled,
    set,
  } = useAppSettingsStore();

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 110, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader
          title="Notifications"
          subtitle="Alerts, sound, and vibration"
          onBack={() => router.back()}
        />

        <SettingsSection title="Alerts">
          <SettingsRow
            title="Push notifications"
            subtitle="Announcements, results, timetable changes"
            icon="notifications"
            accessory={{ type: 'switch', value: pushNotificationsEnabled, onValueChange: (v) => set('pushNotificationsEnabled', v) }}
          />
          <SettingsRow
            title="Email updates"
            subtitle="Get important summaries via email"
            icon="mail"
            accessory={{ type: 'switch', value: emailNotificationsEnabled, onValueChange: (v) => set('emailNotificationsEnabled', v) }}
          />
        </SettingsSection>

        <SettingsSection title="Feedback">
          <SettingsRow
            title="Sounds"
            subtitle="Play sound for certain alerts"
            icon="volume-high"
            accessory={{ type: 'switch', value: soundsEnabled, onValueChange: (v) => set('soundsEnabled', v) }}
          />
          <SettingsRow
            title="Haptics"
            subtitle="Small vibrations for actions"
            icon="phone-portrait"
            accessory={{ type: 'switch', value: hapticsEnabled, onValueChange: (v) => set('hapticsEnabled', v) }}
          />
        </SettingsSection>

        <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
          <Text style={[styles.note, { color: colors.textMuted }]}
          >
            Note: This screen controls in-app preferences. If your device has notifications disabled for this app,
            you won’t receive push alerts even when enabled here.
          </Text>
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  note: { fontSize: 12, fontWeight: '600' },
});
