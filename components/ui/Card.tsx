import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
  style?: ViewStyle;
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
  const { colors, isDark } = useThemeStore();
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, {
        damping: 18,
        stiffness: 80,
        mass: 0.8,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
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
        return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
      default:
        return isDark ? 'rgba(30, 30, 50, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outlined') {
      return isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
    }
    return isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <View
        style={[
          styles.content,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            padding: noPadding ? 0 : 18,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default Card;
