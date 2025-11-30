import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  floating?: boolean;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 40,
  floating = true,
  glowColor,
}) => {
  const { isDark, colors } = useThemeStore();
  const floatY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Entrance animation
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });

    // Floating animation
    if (floating) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-3, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [floating]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value + floatY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          shadowColor: glowColor || (isDark ? '#8B5CF6' : '#6366f1'),
        },
        animatedStyle,
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        style={styles.blur}
        tint={isDark ? 'dark' : 'light'}
      >
        <View
          style={[
            styles.content,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.7)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.8)',
            },
          ]}
        >
          {children}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 20,
  },
  blur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
  },
});

export default GlassCard;
