import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, IconBadge } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { themeRegistry } from '../../../theme/registry';

export default function TeacherAppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    colors,
    animationsEnabled,
    toggleAnimations,
    mode,
    setMode,
    supportsAnimatedBackground,
    capabilities,
    activeThemeId,
    setActiveThemeId,
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

  const modeOptions: Array<{ id: 'light' | 'dark' | 'system'; title: string; icon: string }> = [
    { id: 'light', title: 'Light', icon: 'sunny' },
    { id: 'dark', title: 'Dark', icon: 'moon' },
    { id: 'system', title: 'System', icon: 'phone-portrait' },
  ];

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(250)} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.85}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Appearance</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Customize theme and animations</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(260)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <IconBadge family="ion" name="color-palette" tone="primary" size={18} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Theme Mode</Text>
                <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Light, Dark, or System</Text>
              </View>
            </View>

            <View style={{ height: 10 }} />

            <Card noPadding animated={false}>
              {modeOptions.map((opt, idx) => {
                const selected = mode === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.85}
                    onPress={() => setMode(opt.id)}
                    style={[
                      styles.row,
                      {
                        backgroundColor: selected ? colors.inputBackground : 'transparent',
                        borderBottomColor: colors.cardBorder,
                        borderBottomWidth: idx === modeOptions.length - 1 ? 0 : colors.borderWidth,
                      },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons name={opt.icon as any} size={18} color={selected ? colors.primary : colors.textMuted} />
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{opt.title}</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(260)}>
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <IconBadge family="ion" name="layers" tone="primary" size={18} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Theme Preset</Text>
                <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Choose a preset</Text>
              </View>
            </View>

            <View style={{ height: 10 }} />

            <Card noPadding animated={false}>
              {themePresets.map((preset, idx) => {
                const selected = activeThemeId === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.85}
                    onPress={() => setActiveThemeId(preset.id)}
                    style={[
                      styles.row,
                      {
                        backgroundColor: selected ? colors.inputBackground : 'transparent',
                        borderBottomColor: colors.cardBorder,
                        borderBottomWidth: idx === themePresets.length - 1 ? 0 : colors.borderWidth,
                      },
                    ]}
                  >
                    <View style={styles.rowLeft}>
                      <Ionicons
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                        {preset.name}
                      </Text>
                    </View>
                    <Ionicons
                      name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </Card>
        </Animated.View>

        {showAnimations ? (
          <Animated.View entering={FadeInDown.delay(200).duration(260)}>
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <IconBadge family="ion" name="sparkles" tone="primary" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Animations</Text>
                  <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>Enable UI effects</Text>
                </View>
              </View>

              <View style={{ height: 10 }} />

              <View
                style={[
                  styles.toggleRow,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.cardBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <View style={styles.toggleLeft}>
                  <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Enable animations</Text>
                  <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>Recommended</Text>
                </View>
                <Switch
                  value={animationsEnabled}
                  onValueChange={toggleAnimations}
                  trackColor={{ false: colors.inputBorder, true: colors.primary }}
                  thumbColor={animationsEnabled ? colors.primary : colors.cardBackground}
                />
              </View>
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { marginTop: 3, fontSize: 13, fontWeight: '600' },

  sectionCard: { marginBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionDesc: { marginTop: 2, fontSize: 12, fontWeight: '600' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', flex: 1 },

  toggleRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: { flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: '800' },
  toggleSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '600' },
});
