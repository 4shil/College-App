import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  delay?: number;
  noPadding?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 50,
  delay = 0,
  noPadding = false,
}) => {
  const { isDark } = useThemeStore();
  const progress = useSharedValue(0);

  useEffect(() => {
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

  // Glass background colors - no shadows, just translucent blur
  const glassBackground = isDark
    ? 'rgba(30, 30, 50, 0.6)'
    : 'rgba(255, 255, 255, 0.7)';

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.5)';

  const renderContent = () => (
    <View
      style={[
        styles.content,
        {
          backgroundColor: Platform.OS === 'android' ? glassBackground : 'transparent',
          borderColor,
          padding: noPadding ? 0 : 18,
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          style={[styles.blur, { backgroundColor: glassBackground }]}
          tint={isDark ? 'dark' : 'light'}
        >
          {renderContent()}
        </BlurView>
      ) : (
        <View style={[styles.blur, { backgroundColor: glassBackground }]}>
          {renderContent()}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default GlassCard;
