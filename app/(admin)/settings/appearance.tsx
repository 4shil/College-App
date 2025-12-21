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


export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, animationsEnabled, toggleAnimations, mode, setMode, supportsAnimatedBackground, capabilities, activeThemeId, setActiveThemeId } = useThemeStore();
  const canUseBlur = capabilities.supportsBlur && animationsEnabled;

  const themePresets = React.useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const preset of Object.values(themeRegistry)) {
      if (!byId.has(preset.id)) byId.set(preset.id, { id: preset.id, name: preset.name });
    }
    return Array.from(byId.values());
  }, []);

  return (
    <AnimatedBackground>
      <View style={styles2.container}>
        {/* Fixed Header */}
        <BlurView intensity={canUseBlur ? 80 : 0} tint="dark" style={[styles2.headerBlur, { paddingTop: insets.top + 10 }]}>
          <View style={styles2.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles2.backBtn, { backgroundColor: colors.cardBackground }]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles2.headerContent}>
              <Text style={[styles2.title, { color: colors.textPrimary }]}>
                Appearance
              </Text>
              <Text style={[styles2.subtitle, { color: colors.textSecondary }]}>
                Customize theme and animations
              </Text>
            </View>
          </View>
        </BlurView>

        {/* Content */}
        <ScrollView
          style={styles2.scrollView}
          contentContainerStyle={[
            styles2.content,
            { paddingTop: insets.top + 100, paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme Mode Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <BlurView
              intensity={canUseBlur ? 60 : 0}
              tint="dark"
              style={[styles2.section, { borderColor: colors.glassBorder }]}
            >
              <View style={styles2.sectionHeader}>
                <Ionicons name="color-palette" size={24} color={colors.primary} />
                <Text style={[styles2.sectionTitle, { color: colors.textPrimary }]}>
                  Theme Mode
                </Text>
              </View>
              <Text style={[styles2.sectionDesc, { color: colors.textSecondary }]}>
                Choose between light, dark, or system theme
              </Text>

              <View style={styles2.modeButtons}>
                {(['light', 'dark', 'system'] as const).map((themeMode) => (
                  <TouchableOpacity
                    key={themeMode}
                    onPress={() => setMode(themeMode)}
                    style={[
                      styles2.modeButton,
                      {
                        backgroundColor: mode === themeMode ? colors.primary : 'rgba(255, 255, 255, 0.05)',
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
                      color={mode === themeMode ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles2.modeText,
                        {
                          color: mode === themeMode ? '#FFFFFF' : colors.textPrimary,
                        },
                      ]}
                    >
                      {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                    </Text>
                    {mode === themeMode && (
                      <View style={styles2.checkmark}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Animated.View>

          {/* Theme Preset Section */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <BlurView
              intensity={canUseBlur ? 60 : 0}
              tint="dark"
              style={[styles2.section, { borderColor: colors.glassBorder }]}
            >
              <View style={styles2.sectionHeader}>
                <Ionicons name="layers" size={24} color={colors.primary} />
                <Text style={[styles2.sectionTitle, { color: colors.textPrimary }]}>
                  Theme Preset
                </Text>
              </View>
              <Text style={[styles2.sectionDesc, { color: colors.textSecondary }]}>
                Choose between available theme presets
              </Text>

              <View style={styles2.modeButtons}>
                {themePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => setActiveThemeId(preset.id)}
                    style={[
                      styles2.modeButton,
                      {
                        backgroundColor: activeThemeId === preset.id ? colors.primary : 'rgba(255, 255, 255, 0.05)',
                        borderColor: activeThemeId === preset.id ? colors.primary : colors.glassBorder,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={activeThemeId === preset.id ? 'radio-button-on' : 'radio-button-off'}
                      size={24}
                      color={activeThemeId === preset.id ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles2.modeText,
                        {
                          color: activeThemeId === preset.id ? '#FFFFFF' : colors.textPrimary,
                        },
                      ]}
                    >
                      {preset.name}
                    </Text>
                    {activeThemeId === preset.id && (
                      <View style={styles2.checkmark}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </BlurView>
          </Animated.View>

          {/* Animations Section */}
          {supportsAnimatedBackground && (
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <BlurView
                intensity={canUseBlur ? 60 : 0}
                tint="dark"
                style={[styles2.section, { borderColor: colors.glassBorder }]}
              >
                <View style={styles2.sectionHeader}>
                  <Ionicons name="sparkles" size={24} color={colors.primary} />
                  <Text style={[styles2.sectionTitle, { color: colors.textPrimary }]}>
                    Animations
                  </Text>
                </View>
                <Text style={[styles2.sectionDesc, { color: colors.textSecondary }]}>
                  Enable or disable UI animations and effects
                </Text>

                <TouchableOpacity
                  onPress={toggleAnimations}
                  style={[
                    styles2.toggleRow,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor: colors.glassBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles2.toggleLeft}>
                    <Ionicons
                      name={animationsEnabled ? 'play-circle' : 'pause-circle'}
                      size={28}
                      color={animationsEnabled ? colors.primary : colors.textSecondary}
                    />
                    <View style={styles2.toggleTextContainer}>
                      <Text style={[styles2.toggleTitle, { color: colors.textPrimary }]}>
                        {animationsEnabled ? 'Enabled' : 'Disabled'}
                      </Text>
                      <Text style={[styles2.toggleDesc, { color: colors.textSecondary }]}>
                        Smooth transitions and effects
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles2.toggle,
                      {
                        backgroundColor: animationsEnabled ? colors.primary : colors.glassBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles2.toggleKnob,
                        {
                          transform: [{ translateX: animationsEnabled ? 22 : 2 }],
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}

          {/* Info Card */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <BlurView
              intensity={canUseBlur ? 60 : 0}
              tint="dark"
              style={[styles2.infoCard, { borderColor: colors.glassBorder }]}
            >
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <View style={styles2.infoText}>
                <Text style={[styles2.infoTitle, { color: colors.textPrimary }]}>
                  Glassmorphism Theme
                </Text>
                <Text style={[styles2.infoDesc, { color: colors.textSecondary }]}>
                  Modern translucent blur effects with elegant colors
                </Text>
              </View>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles2 = StyleSheet.create({
  container: { flex: 1 },
  
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14 },

  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  modeButtons: {
    gap: 12,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleDesc: {
    fontSize: 13,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
