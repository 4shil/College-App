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

  // If the background is animated, make cards feel "glass-like" even on non-blur themes
  // by using a subtle translucent tint.
  const shouldTintForAnimatedBg = !!canAnimateBackground;
  const tintedCardBackground = withAlpha(
    colors.cardBackground,
    isDark ? 0.72 : 0.86
  );

  const content = (
    <View
      style={[
        styles.content,
        {
          backgroundColor: shouldBlur
            ? 'transparent'
            : (shouldTintForAnimatedBg ? tintedCardBackground : colors.cardBackground),
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
