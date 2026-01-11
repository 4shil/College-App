import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { AnimatedBackground, SettingsHeader, SettingsSection, SettingsRow } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';

export default function StudentAboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const version = Constants.expoConfig?.version ?? Constants.manifest2?.extra?.expoClient?.version ?? '1.0.0';

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 110, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader
          title="About"
          subtitle="App info and versions"
          onBack={() => router.back()}
        />

        <SettingsSection title="App">
          <SettingsRow
            title="Version"
            subtitle="Current build"
            icon="information-circle"
            accessory={{ type: 'text', value: String(version) }}
            onPress={() => {}}
          />
          <SettingsRow
            title="Theme"
            subtitle="Powered by the new theme registry"
            icon="color-palette"
            onPress={() => router.push('/(student)/settings/appearance' as any)}
          />
        </SettingsSection>

        <View style={{ marginTop: 16, paddingHorizontal: 4 }}>
          <Text style={[styles.footer, { color: colors.textMuted }]}>
            JPM College App
          </Text>
          <Text style={[styles.footerSub, { color: colors.textMuted }]}>
            If you want, I can add a “Report a problem” screen next.
          </Text>
        </View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  footer: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  footerSub: { marginTop: 6, fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
