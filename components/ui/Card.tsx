import React from 'react';
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
  delay?: number;
  noPadding?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  delay = 0,
  noPadding = false,
  variant = 'default',
}) => {
  const { colors, animationsEnabled } = useThemeStore();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (animationsEnabled) {
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
  }, [animationsEnabled]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!animationsEnabled) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }
    const translateY = interpolate(progress.value, [0, 1], [16, 0]);
    const opacity = interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const getBackgroundColor = () => {
    switch (variant) {
      case 'outlined':
        return 'transparent';
      case 'filled':
        return colors.cardBackground;
      default:
        return colors.cardBackground;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outlined') {
      return colors.glassBorder;
    }
    return colors.cardBorder;
  };

  return (
    <Animated.View style={[styles.wrapper, { borderRadius: colors.borderRadius }, animatedStyle, style]}>
      <View
        style={[
          styles.content,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: colors.borderWidth,
            borderRadius: colors.borderRadius,
            padding: noPadding ? 0 : 18,
            shadowColor: colors.shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: colors.shadowIntensity,
            shadowRadius: 8,
            elevation: colors.shadowIntensity * 10,
          },
        ]}
      >
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  content: {
    overflow: 'hidden',
  },
});

export default Card;
