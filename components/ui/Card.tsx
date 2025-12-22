import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

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
  delay = 0,
  noPadding = false,
  animated = true,
}) => {
  const { colors, animationsEnabled } = useThemeStore();
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

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          borderWidth: colors.borderWidth,
          borderRadius: colors.borderRadius,
          padding: noPadding ? 0 : 18,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
});

export default Card;
