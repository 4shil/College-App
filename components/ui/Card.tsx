import React, { useEffect } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

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
  const { colors, isDark, animationsEnabled, capabilities, canAnimateBackground } = useThemeStore();
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

  const blurAmount = intensity ?? colors.blurIntensity;
  const shouldBlur =
    Platform.OS === 'ios' &&
    !!capabilities?.supportsBlur &&
    blurAmount > 0;

  const getColorAlpha = (color: string): number | null => {
    const c = color.trim();

    // rgba(r,g,b,a)
    const rgbaMatch = c.match(
      /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i
    );
    if (rgbaMatch) {
      const a = Number(rgbaMatch[4]);
      return Number.isFinite(a) ? Math.max(0, Math.min(1, a)) : null;
    }

    // rgb(r,g,b)
    if (/^rgb\(/i.test(c)) return 1;

    // #RRGGBBAA or #RGBA
    if (c.startsWith('#')) {
      const hex = c.slice(1);
      const normalized =
        hex.length === 4
          ? hex
              .split('')
              .map((ch) => ch + ch)
              .join('')
          : hex;

      if (normalized.length === 8) {
        const aa = Number.parseInt(normalized.slice(6, 8), 16);
        if (Number.isNaN(aa)) return null;
        return Math.max(0, Math.min(1, aa / 255));
      }
      if (normalized.length === 6) return 1;
    }

    return null;
  };

  // If the background is animated, make *solid* themes feel a bit more "glass-like"
  // by applying a subtle tint. IMPORTANT: never override alpha for already-translucent
  // glass themes (e.g., rgba(..., 0.06)), otherwise cards become milky/white.
  const cardAlpha = getColorAlpha(colors.cardBackground);
  const isAlreadyTranslucent = cardAlpha !== null && cardAlpha < 1;

  const shouldTintForAnimatedBg =
    !!canAnimateBackground &&
    !isAlreadyTranslucent &&
    !capabilities?.supportsGlassSurfaces;

  const tintedCardBackground = withAlpha(colors.cardBackground, isDark ? 0.72 : 0.86);

  const resolvedCardBackground = shouldTintForAnimatedBg
    ? tintedCardBackground
    : colors.cardBackground;

  const content = (
    <View
      style={[
        styles.content,
        {
          backgroundColor: shouldBlur
            ? 'transparent'
            : resolvedCardBackground,
          borderColor: colors.cardBorder,
          borderWidth: colors.borderWidth,
          borderRadius: colors.borderRadius,
          padding: noPadding ? 0 : 18,
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        animatedStyle,
        {
          // Critical: ensure overflow clipping uses rounded corners.
          borderRadius: colors.borderRadius,
          // Fill the wrapper to avoid corner artifacts on some devices.
          backgroundColor: resolvedCardBackground,
        },
        style,
      ]}
    >
      {shouldBlur ? (
        <BlurView
          intensity={blurAmount}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blur,
            {
              backgroundColor: colors.cardBackground,
              borderRadius: colors.borderRadius,
            },
          ]}
        >
          {content}
        </BlurView>
      ) : (
        content
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  blur: {
    overflow: 'hidden',
  },
  content: {
    overflow: 'hidden',
  },
});

export default Card;
