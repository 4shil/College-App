import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import { AnimatedBackground } from '../../../components/ui';
import { useThemeStore, styleMetadata, UIStyle } from '../../../store/themeStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 columns with padding

export default function AppearanceSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, uiStyle, setUIStyle, animationsEnabled } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Depth & Texture', 'Retro & Nostalgia', 'Clean & Corporate', 'High Contrast & Bold', 'Artistic & Niche'];

  const styles = Object.entries(styleMetadata).filter(([_, meta]) => 
    selectedCategory === 'All' || meta.category === selectedCategory
  );

  const getStylePreview = (style: UIStyle) => {
    const meta = styleMetadata[style];
    // Preview colors based on style
    const previewColors: Record<UIStyle, { bg: string; accent: string; text: string }> = {
      glassmorphism: { bg: 'rgba(139, 92, 246, 0.1)', accent: '#8B5CF6', text: '#FFFFFF' },
      neumorphism: { bg: '#E6E6EB', accent: '#5A5A6B', text: '#5A5A6B' },
      claymorphism: { bg: 'rgba(255, 107, 157, 0.15)', accent: '#FF6B9D', text: '#FF6B9D' },
      skeuomorphism: { bg: 'rgba(139, 69, 19, 0.1)', accent: '#8B4513', text: '#8B4513' },
      papercraft: { bg: '#FFFFFF', accent: '#3B82F6', text: '#1F2937' },
      y2k: { bg: '#C0C0C0', accent: '#000080', text: '#000000' },
      pixel: { bg: 'rgba(74, 222, 128, 1)', accent: '#EF4444', text: '#000000' },
      terminal: { bg: 'rgba(0, 255, 0, 0.1)', accent: '#00FF00', text: '#00FF00' },
      synthwave: { bg: 'rgba(255, 0, 255, 0.15)', accent: '#FF00FF', text: '#FF00FF' },
      cyberpunk: { bg: 'rgba(0, 255, 255, 0.1)', accent: '#00FFFF', text: '#00FFFF' },
      material: { bg: '#FFFFFF', accent: '#6200EE', text: '#1F2937' },
      fluent: { bg: 'rgba(249, 249, 249, 0.7)', accent: '#0078D4', text: '#1F2937' },
      saas: { bg: '#FFFFFF', accent: '#635BFF', text: '#1F2937' },
      minimalist: { bg: '#FFFFFF', accent: '#000000', text: '#000000' },
      neobrutalism: { bg: 'rgba(255, 255, 0, 1)', accent: '#FF0000', text: '#000000' },
      bauhaus: { bg: '#FFFFFF', accent: '#E30613', text: '#000000' },
      swiss: { bg: '#FFFFFF', accent: '#000000', text: '#000000' },
      popart: { bg: 'rgba(255, 237, 0, 1)', accent: '#FF6EC7', text: '#000000' },
      memphis: { bg: 'rgba(255, 195, 0, 1)', accent: '#FF0080', text: '#000000' },
      industrial: { bg: 'rgba(66, 66, 66, 1)', accent: '#FFEB3B', text: '#FFFFFF' },
      sketch: { bg: 'rgba(255, 255, 255, 0.95)', accent: '#4A5568', text: '#4A5568' },
      blueprint: { bg: 'rgba(12, 74, 110, 0.8)', accent: '#FFFFFF', text: '#FFFFFF' },
      magazine: { bg: '#FFFFFF', accent: '#1A1A1A', text: '#1A1A1A' },
      artdeco: { bg: 'rgba(0, 0, 0, 0.9)', accent: '#D4AF37', text: '#D4AF37' },
      aurora: { bg: 'rgba(167, 139, 250, 0.1)', accent: '#A78BFA', text: '#FFFFFF' },
    };

    return previewColors[style];
  };

  return (
    <AnimatedBackground>
      <View style={styles2.container}>
        {/* Fixed Header */}
        <BlurView intensity={animationsEnabled ? 80 : 0} tint="dark" style={[styles2.headerBlur, { paddingTop: insets.top + 10 }]}>
          <View style={styles2.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles2.backBtn, { backgroundColor: colors.cardBackground }]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles2.headerContent}>
              <Text style={[styles2.title, { color: colors.textPrimary }]}>
                UI Themes
              </Text>
              <Text style={[styles2.subtitle, { color: colors.textSecondary }]}>
                Choose your visual style
              </Text>
            </View>
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles2.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles2.categoryChip,
                  {
                    backgroundColor: selectedCategory === cat ? colors.primary : colors.cardBackground,
                    borderColor: colors.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles2.categoryText,
                    { color: selectedCategory === cat ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>

        {/* Theme Grid */}
        <ScrollView
          style={styles2.scrollView}
          contentContainerStyle={[
            styles2.content,
            { paddingTop: 180, paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles2.grid}>
            {styles.map(([styleKey, meta], index) => {
              const style = styleKey as UIStyle;
              const preview = getStylePreview(style);
              const isActive = uiStyle === style;

              return (
                <Animated.View
                  key={style}
                  entering={FadeInDown.delay(index * 50).duration(400)}
                >
                  <TouchableOpacity
                    onPress={() => setUIStyle(style)}
                    style={[
                      styles2.themeCard,
                      {
                        width: CARD_WIDTH,
                        borderColor: isActive ? colors.primary : colors.glassBorder,
                        borderWidth: isActive ? 3 : 1,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    {/* Preview Box */}
                    <View
                      style={[
                        styles2.previewBox,
                        { backgroundColor: preview.bg },
                      ]}
                    >
                      <View style={[styles2.previewElement, { backgroundColor: preview.accent }]} />
                      <View style={[styles2.previewElement, { backgroundColor: preview.accent, opacity: 0.5 }]} />
                      <Text style={[styles2.previewText, { color: preview.text }]}>Aa</Text>
                    </View>

                    {/* Info */}
                    <View style={[styles2.themeInfo, { backgroundColor: colors.cardBackground }]}>
                      <View style={styles2.themeHeader}>
                        <Text style={[styles2.themeName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {meta.name}
                        </Text>
                        {isActive && (
                          <View style={[styles2.activeBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>
                      <Text style={[styles2.themeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {meta.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Current Selection Info */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles2.currentInfo}>
            <BlurView
              intensity={animationsEnabled ? 60 : 0}
              tint="dark"
              style={[styles2.currentCard, { borderColor: colors.glassBorder }]}
            >
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <View style={styles2.currentText}>
                <Text style={[styles2.currentTitle, { color: colors.textPrimary }]}>
                  Current: {styleMetadata[uiStyle].name}
                </Text>
                <Text style={[styles2.currentDesc, { color: colors.textSecondary }]}>
                  Theme applied across all screens
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
    paddingBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
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

  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },

  scrollView: { flex: 1 },
  content: {
    paddingHorizontal: 20,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },

  themeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },

  previewBox: {
    height: 120,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  previewElement: {
    width: 40,
    height: 8,
    borderRadius: 4,
  },
  previewText: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 8,
  },

  themeInfo: {
    padding: 12,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  themeName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  activeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },

  currentInfo: {
    marginTop: 24,
    marginBottom: 8,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  currentText: {
    flex: 1,
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  currentDesc: {
    fontSize: 13,
  },
});
