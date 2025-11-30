import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  floating?: boolean;
  glowColor?: string;
  delay?: number;
  variant?: 'default' | 'elevated' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 50,
  floating = false,
  glowColor,
  delay = 0,
  variant = 'default',
}) => {
  const { isDark } = useThemeStore();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, {
        damping: 20,
        stiffness: 90,
        mass: 1,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [30, 0]);
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]);
    const scale = interpolate(progress.value, [0, 1], [0.95, 1]);

    return {
      opacity,
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 25,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(255, 255, 255, 0.85)',
        };
      case 'subtle':
        return {
          shadowOpacity: 0.1,
          shadowRadius: 10,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.03)'
            : 'rgba(255, 255, 255, 0.5)',
        };
      default:
        return {
          shadowOpacity: isDark ? 0.3 : 0.12,
          shadowRadius: 20,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.7)',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const defaultGlowColor = isDark ? '#8B5CF6' : '#6366f1';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          shadowColor: glowColor || defaultGlowColor,
          shadowOpacity: variantStyles.shadowOpacity,
          shadowRadius: variantStyles.shadowRadius,
        },
        animatedStyle,
        style,
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? intensity : intensity * 1.5}
        style={styles.blur}
        tint={isDark ? 'dark' : 'light'}
      >
        <View
          style={[
            styles.content,
            {
              backgroundColor: variantStyles.backgroundColor,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.9)',
            },
          ]}
        >
          {/* Inner glow effect */}
          <View
            style={[
              styles.innerGlow,
              {
                backgroundColor: isDark
                  ? 'rgba(139, 92, 246, 0.03)'
                  : 'rgba(99, 102, 241, 0.02)',
              },
            ]}
            pointerEvents="none"
          />
          {children}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    elevation: 15,
  },
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});

export default GlassCard;
