import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import { AnimatedBackground } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { themeRegistry } from '../../../theme/registry';

function parseColorToRgb(color: string): { r: number; g: number; b: number } | null {
  const c = color.trim();

  // #RGB, #RRGGBB, #RRGGBBAA
  if (c[0] === '#') {
    const hex = c.slice(1);
    const isShort = hex.length === 3;
    const isLong = hex.length === 6 || hex.length === 8;
    if (!isShort && !isLong) return null;

    const full = isShort
      ? hex.split('').map((ch) => ch + ch).join('')
      : hex.slice(0, 6);

    const r = Number.parseInt(full.slice(0, 2), 16);
    const g = Number.parseInt(full.slice(2, 4), 16);
    const b = Number.parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  // rgb()/rgba()
  const rgbMatch = c.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((p) => p.trim());
    if (parts.length < 3) return null;
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
  }

  return null;
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  // sRGB → linear
  const toLinear = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(bg: string, fg: string): number | null {
  const bgRgb = parseColorToRgb(bg);
  const fgRgb = parseColorToRgb(fg);
  if (!bgRgb || !fgRgb) return null;
  const L1 = relativeLuminance(bgRgb);
  const L2 = relativeLuminance(fgRgb);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getBestContrastOnColor(
  backgroundColor: string,
  candidateA: string,
  candidateB: string,
  fallback: string
): string {
  const a = contrastRatio(backgroundColor, candidateA);
  const b = contrastRatio(backgroundColor, candidateB);
  if (a == null && b == null) return fallback;
  if (a == null) return candidateB;
  if (b == null) return candidateA;
  return a >= b ? candidateA : candidateB;
}

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

  const canUseBlur = capabilities.supportsBlur && animationsEnabled;
  const isGlassTheme = !!capabilities.supportsGlassSurfaces;
  const blurTint: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const isDefaultGlassmorphism = activeThemeId === 'default' || activeThemeId === 'glassmorphism';
  const showAnimations = !!supportsAnimatedBackground && (!isDark || isDefaultGlassmorphism);

  const onSelectedColor = React.useMemo(
    () =>
      getBestContrastOnColor(
        colors.primary,
        colors.textPrimary,
        colors.textInverse,
        colors.textInverse
      ),
    [colors.primary, colors.textPrimary, colors.textInverse]
  );

  const themePresets = React.useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const preset of Object.values(themeRegistry)) {
      if (!byId.has(preset.id)) byId.set(preset.id, { id: preset.id, name: preset.name });
    }
    return Array.from(byId.values());
  }, []);

  return (
    <AnimatedBackground>
      <View style={styles.container}>
        <BlurView
          intensity={canUseBlur ? 80 : 0}
          tint={blurTint}
          style={[
            styles.headerBlur,
            {
              paddingTop: insets.top + 10,
              backgroundColor: isGlassTheme ? colors.glassBackground : colors.cardBackground,
            },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isGlassTheme ? colors.glassBackground : colors.cardBackground,
                  borderColor: isGlassTheme ? colors.glassBorder : colors.cardBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Appearance</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Customize theme and animations
              </Text>
            </View>
          </View>
        </BlurView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: insets.top + 100, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <BlurView
              intensity={canUseBlur ? 60 : 0}
              tint={blurTint}
              style={[
                styles.section,
                {
                  borderColor: isGlassTheme ? colors.glassBorder : colors.cardBorder,
                  backgroundColor: isGlassTheme ? colors.glassBackground : colors.cardBackground,
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="color-palette" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Theme Mode</Text>
              </View>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                Choose between light, dark, or system theme
              </Text>

              <View style={styles.modeButtons}>
                {(['light', 'dark', 'system'] as const).map((themeMode) => (
                  <TouchableOpacity
                    key={themeMode}
                    onPress={() => setMode(themeMode)}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: mode === themeMode ? colors.primary : colors.cardBackground,
                        borderColor: mode === themeMode ? colors.primary : colors.glassBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        themeMode === 'light'
                          ? 'sunny'
                          : themeMode === 'dark'
                          ? 'moon'
                          : 'phone-portrait'
                      }
                      size={24}
                      color={mode === themeMode ? onSelectedColor : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modeText,
                        { color: mode === themeMode ? onSelectedColor : colors.textPrimary },
                      ]}
                    >
                      {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                    </Text>
                    {mode === themeMode && (
                      <View
                        style={[
                          styles.checkmark,
                          {
                            backgroundColor: colors.cardBackground,
                            borderColor: onSelectedColor,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Ionicons name="checkmark" size={16} color={onSelectedColor} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <BlurView
              intensity={canUseBlur ? 60 : 0}
              tint="dark"
              style={[styles.section, { borderColor: colors.glassBorder }]}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="layers" size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Theme Preset</Text>
              </View>
              <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                Choose between available theme presets
              </Text>

              <View style={styles.modeButtons}>
                {themePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => setActiveThemeId(preset.id)}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor: activeThemeId === preset.id ? colors.primary : colors.cardBackground,
                        borderColor: activeThemeId === preset.id ? colors.primary : colors.glassBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={activeThemeId === preset.id ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={activeThemeId === preset.id ? onSelectedColor : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.modeText,
                        { color: activeThemeId === preset.id ? onSelectedColor : colors.textPrimary },
                      ]}
                    >
                      {preset.name}
                    </Text>
                    {activeThemeId === preset.id && (
                      <View
                        style={[
                          styles.checkmark,
                          {
                            backgroundColor: colors.cardBackground,
                            borderColor: onSelectedColor,
                            borderWidth: 1,
                          },
                        ]}
                      >
                        <Ionicons name="checkmark" size={16} color={onSelectedColor} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Animated.View>

          {showAnimations && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <BlurView
                intensity={canUseBlur ? 60 : 0}
                tint="dark"
                style={[styles.section, { borderColor: colors.glassBorder }]}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="sparkles" size={24} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Animations</Text>
                </View>
                <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
                  Enable or disable UI animations and effects
                </Text>

                <TouchableOpacity
                  onPress={toggleAnimations}
                  style={[
                    styles.toggleRow,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.glassBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.toggleLeft}>
                    <Ionicons
                      name={animationsEnabled ? 'toggle' : 'toggle-outline'}
                      size={28}
                      color={animationsEnabled ? colors.success : colors.textMuted}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>Enable Animations</Text>
                      <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>Recommended for best experience</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.togglePill,
                      {
                        backgroundColor: animationsEnabled ? colors.success : colors.inputBackground,
                        borderColor: colors.glassBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.togglePillText,
                        { color: animationsEnabled ? colors.textInverse : colors.textSecondary },
                      ]}
                    >
                      {animationsEnabled ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerContent: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { marginTop: 2, fontSize: 13 },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionDesc: { marginTop: 6, fontSize: 13, lineHeight: 18 },
  modeButtons: { marginTop: 12, gap: 10 },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
  },
  modeText: { fontSize: 14, fontWeight: '700', flex: 1 },
  checkmark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: '800' },
  toggleSubtitle: { marginTop: 2, fontSize: 12 },
  togglePill: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  togglePillText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
});
