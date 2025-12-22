import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

export type GlassSurfaceVariant = 'card' | 'input' | 'pill';

interface GlassSurfaceProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
  blurIntensity?: number;
  variant?: GlassSurfaceVariant;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  style,
  borderRadius,
  borderWidth,
  borderColor,
  backgroundColor,
  blurIntensity,
  variant = 'card',
}) => {
  const { isDark, colors, capabilities } = useThemeStore();

  const resolvedBlurIntensity = blurIntensity ?? (variant === 'card' ? 60 : 0);

  const shouldBlur =
    Platform.OS === 'ios' &&
    !!capabilities?.supportsBlur &&
    resolvedBlurIntensity > 0;

  const overlayColors: readonly [string, string, ...string[]] = isDark
    ? [withAlpha(colors.secondary, 0.06), 'transparent', withAlpha(colors.primary, 0.04)]
    : [withAlpha(colors.secondary, 0.04), 'transparent', withAlpha(colors.primary, 0.03)];

  const content = (
    <View
      style={[
        styles.surface,
        {
          borderRadius,
          borderWidth,
          borderColor,
          // Keep the same semi-transparent surface fill on iOS too.
          // BlurView renders blur behind its children; an opaque child background would hide blur.
          // Our theme surfaces are already RGBA / alpha-tinted.
          backgroundColor,
        },
        style,
      ]}
    >
      {/* Top Edge Highlight (same recipe as BottomNav) */}
      <LinearGradient
        pointerEvents="none"
        colors={
          isDark
            ? [withAlpha(colors.glassBackgroundStrong, 0.15), withAlpha(colors.glassBackgroundStrong, 0.03), 'transparent']
            : [withAlpha(colors.glassBackgroundStrong, 0.98), withAlpha(colors.glassBackgroundStrong, 0.6), 'transparent']
        }
        style={[
          styles.topHighlight,
          {
            borderTopLeftRadius: borderRadius,
            borderTopRightRadius: borderRadius,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Subtle Gradient Overlay (same recipe as BottomNav) */}
      <LinearGradient
        pointerEvents="none"
        colors={overlayColors}
        style={[styles.gradientOverlay, { borderRadius }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {children}
    </View>
  );

  if (!shouldBlur) return content;

  return (
    <BlurView
      intensity={resolvedBlurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.blurWrapper, { borderRadius }]}
    >
      {content}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  blurWrapper: {
    overflow: 'hidden',
  },
  surface: {
    overflow: 'hidden',
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default GlassSurface;
