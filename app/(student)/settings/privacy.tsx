import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AnimatedBackground, SettingsHeader, SettingsSection, SettingsRow } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAppSettingsStore } from '../../../store/appSettingsStore';

export default function StudentPrivacySettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const {
    analyticsEnabled,
    dataSaverEnabled,
    biometricLockEnabled,
    set,
    reset,
  } = useAppSettingsStore();

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 110, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader
          title="Privacy"
          subtitle="Data, analytics, and lock"
          onBack={() => router.back()}
        />

        <SettingsSection title="Data">
          <SettingsRow
            title="Data saver"
            subtitle="Reduce images/animations when possible"
            icon="cloud-outline"
            accessory={{ type: 'switch', value: dataSaverEnabled, onValueChange: (v) => set('dataSaverEnabled', v) }}
          />
        </SettingsSection>

        <SettingsSection title="Security">
          <SettingsRow
            title="Biometric lock"
            subtitle="Require fingerprint/face to open"
            icon="lock-closed"
            accessory={{ type: 'switch', value: biometricLockEnabled, onValueChange: (v) => set('biometricLockEnabled', v) }}
          />
          <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
            <Text style={[styles.note, { color: colors.textMuted }]}
            >
              If your device doesn’t support biometrics, this option won’t do anything yet.
              (We can wire it to `expo-local-authentication` next.)
            </Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Analytics">
          <SettingsRow
            title="Share anonymous usage data"
            subtitle="Helps us improve performance and stability"
            icon="pulse"
            accessory={{ type: 'switch', value: analyticsEnabled, onValueChange: (v) => set('analyticsEnabled', v) }}
          />
        </SettingsSection>

        <SettingsSection title="Reset">
          <SettingsRow
            title="Reset app preferences"
            subtitle="Restore defaults for notifications/privacy"
            icon="refresh"
            onPress={() => {
              Alert.alert('Reset preferences?', 'This will restore default settings for this device.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => reset() },
              ]);
            }}
          />
        </SettingsSection>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  note: { fontSize: 12, fontWeight: '600' },
});
