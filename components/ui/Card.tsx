import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { GlassSurface } from './GlassSurface';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  delay?: number;
  noPadding?: boolean;
  animated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  intensity,
  delay = 0,
  noPadding = false,
  animated = true,
}) => {
  const { colors, isDark, animationsEnabled, capabilities } = useThemeStore();
  const shouldAnimate = animationsEnabled && animated;
  const progress = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (shouldAnimate) {
      progress.value = withDelay(
        delay,
        withSpring(1, {
          damping: 18,
          stiffness: 80,
          mass: 0.8,
        })
      );
    } else {
      progress.value = 1;
    }
  }, [shouldAnimate]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!shouldAnimate) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }
    const translateY = interpolate(progress.value, [0, 1], [16, 0]);
    const opacity = interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const blurAmount = intensity ?? 60;

  // Glassmorphic surface (blur on iOS when available; tinted fallback otherwise)
  const baseSurfaceBackground = capabilities?.supportsGlassSurfaces ? colors.glassBackgroundStrong : colors.cardBackground;
  const baseSurfaceBorder = capabilities?.supportsGlassSurfaces ? colors.glassBorder : colors.cardBorder;

  const resolvedCardBackground = withAlpha(baseSurfaceBackground, isDark ? 0.72 : 0.86);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        animatedStyle,
        {
          // Critical: ensure overflow clipping uses rounded corners.
          borderRadius: colors.borderRadius,
          // Important: keep wrapper transparent so iOS BlurView can blur content behind.
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      <GlassSurface
        variant="card"
        blurIntensity={blurAmount}
        borderRadius={colors.borderRadius}
        borderWidth={colors.borderWidth}
        borderColor={baseSurfaceBorder}
        backgroundColor={resolvedCardBackground}
        style={[styles.content, { padding: noPadding ? 0 : 18 }]}
      >
        {children}
      </GlassSurface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  content: {
    // Padding is applied dynamically.
  },
});

export default Card;
