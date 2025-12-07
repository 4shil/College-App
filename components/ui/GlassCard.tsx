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
  intensity,
  delay = 0,
  noPadding = false,
}) => {
  const { isDark, colors, animationsEnabled } = useThemeStore();
  const blurAmount = intensity ?? colors.blurIntensity;
  const shouldAnimate = animationsEnabled;
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

  // Use theme colors directly
  const borderColor = colors.glassBorder;

  const renderContent = () => (
    <View
      style={[
        styles.content,
        {
          backgroundColor: Platform.OS === 'android' ? colors.glassBackground : 'transparent',
          borderColor,
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
    <Animated.View style={[styles.wrapper, { borderRadius: colors.borderRadius }, animatedStyle, style]}>
      {Platform.OS === 'ios' && blurAmount > 0 ? (
        <BlurView
          intensity={blurAmount}
          style={[styles.blur, { backgroundColor: colors.glassBackground, borderRadius: colors.borderRadius }]}
          tint={isDark ? 'dark' : 'light'}
        >
          {renderContent()}
        </BlurView>
      ) : (
        <View style={[styles.blur, { backgroundColor: colors.glassBackground, borderRadius: colors.borderRadius }]}>
          {renderContent()}
        </View>
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

export default GlassCard;
