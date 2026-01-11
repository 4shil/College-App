import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, SettingsHeader, SettingsSection } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { themeRegistry } from '../../../theme/registry';

type ModeId = 'light' | 'dark' | 'system';

function ChoiceRow(props: {
  title: string;
  subtitle?: string;
  selected: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={props.onPress}
      style={[
        styles.choiceRow,
        {
          backgroundColor: props.selected ? colors.inputBackground : 'transparent',
          borderColor: colors.cardBorder,
          borderWidth: colors.borderWidth,
        },
      ]}
    >
      <View style={styles.choiceLeft}>
        <View
          style={[
            styles.choiceIcon,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.inputBorder,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Ionicons name={props.icon} size={18} color={props.selected ? colors.primary : colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.choiceTitle, { color: colors.textPrimary }]}>{props.title}</Text>
          {props.subtitle ? (
            <Text style={[styles.choiceSubtitle, { color: colors.textSecondary }]}>{props.subtitle}</Text>
          ) : null}
        </View>
      </View>

      <Ionicons
        name={props.selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={props.selected ? colors.primary : colors.textMuted}
      />
    </TouchableOpacity>
  );
}

export default function StudentAppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    colors,
    mode,
    setMode,
    activeThemeId,
    setActiveThemeId,
    animationsEnabled,
    toggleAnimations,
    supportsAnimatedBackground,
    isDark,
  } = useThemeStore();

  const isDefaultGlassmorphism = activeThemeId === 'default' || activeThemeId === 'glassmorphism';
  const showAnimations = !!supportsAnimatedBackground && (!isDark || isDefaultGlassmorphism);

  const themePresets = React.useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const preset of Object.values(themeRegistry)) {
      if (!byId.has(preset.id)) byId.set(preset.id, { id: preset.id, name: preset.name });
    }
    return Array.from(byId.values());
  }, []);

  const modeOptions: Array<{ id: ModeId; title: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
    { id: 'light', title: 'Light', subtitle: 'Bright and clean', icon: 'sunny' },
    { id: 'dark', title: 'Dark', subtitle: 'Easier on the eyes', icon: 'moon' },
    { id: 'system', title: 'System', subtitle: 'Follow device appearance', icon: 'phone-portrait' },
  ];

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 110, paddingHorizontal: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHeader
          title="Appearance"
          subtitle="Theme mode, preset, and effects"
          onBack={() => router.back()}
        />

        <SettingsSection title="Theme Mode">
          <View style={styles.block}>
            {modeOptions.map((opt) => (
              <ChoiceRow
                key={opt.id}
                title={opt.title}
                subtitle={opt.subtitle}
                icon={opt.icon}
                selected={mode === opt.id}
                onPress={() => setMode(opt.id)}
              />
            ))}
          </View>
        </SettingsSection>

        <SettingsSection title="Theme Preset">
          <View style={styles.block}>
            {themePresets.map((preset) => (
              <ChoiceRow
                key={preset.id}
                title={preset.name}
                subtitle={preset.id === activeThemeId ? 'Current preset' : undefined}
                icon={preset.id === activeThemeId ? 'radio-button-on' : 'radio-button-off'}
                selected={preset.id === activeThemeId}
                onPress={() => setActiveThemeId(preset.id)}
              />
            ))}
          </View>
        </SettingsSection>

        {showAnimations ? (
          <SettingsSection title="Effects">
            <View style={styles.block}>
              <ChoiceRow
                title="Animations"
                subtitle={animationsEnabled ? 'Enabled' : 'Disabled'}
                icon={animationsEnabled ? 'sparkles' : 'sparkles-outline'}
                selected={animationsEnabled}
                onPress={toggleAnimations}
              />
            </View>
          </SettingsSection>
        ) : (
          <View style={{ marginTop: 12, paddingHorizontal: 4 }}>
            <Text style={[styles.note, { color: colors.textMuted }]}
            >
              Some themes disable animated backgrounds in dark mode for readability.
            </Text>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  block: { padding: 12, gap: 10 },
  choiceRow: {
    padding: 12,
    borderRadius: 14,
  },
  choiceLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  choiceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  choiceTitle: { fontSize: 15, fontWeight: '800' },
  choiceSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '600' },
  note: { fontSize: 12, fontWeight: '600' },
});
