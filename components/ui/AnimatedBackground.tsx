import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useThemeStore } from '../../store/themeStore';

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'minimal';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children, variant = 'default' }) => {
  const { colors, animationsEnabled, activeThemeId } = useThemeStore();

  // Animated background is only available for the Glassmorphic theme.
  const isGlassmorphicTheme = activeThemeId === 'glassmorphism' || activeThemeId === 'default';
  const reduceMotion = variant === 'minimal' || !animationsEnabled || !isGlassmorphicTheme;
  const layerScale = reduceMotion ? 1 : (variant === 'auth' ? 1.4 : 1.25);

  const progressA = useSharedValue(0);
  const progressB = useSharedValue(0);

  React.useEffect(() => {
    if (reduceMotion) return;

    const durationA = variant === 'auth' ? 9000 : 12000;
    const durationB = variant === 'auth' ? 11000 : 15000;

    progressA.value = withRepeat(
      withTiming(1, { duration: durationA, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    progressB.value = withRepeat(
      withTiming(1, { duration: durationB, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [progressA, progressB, reduceMotion, variant]);

  const animatedLayerA = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 1, transform: [{ scale: layerScale }, { translateX: 0 }, { translateY: 0 }] };
    const translateX = (progressA.value - 0.5) * 80;
    const translateY = (0.5 - progressA.value) * 60;
    const opacity = 0.85;
    return { opacity, transform: [{ scale: layerScale }, { translateX }, { translateY }] };
  });

  const animatedLayerB = useAnimatedStyle(() => {
    if (reduceMotion) return { opacity: 0.7, transform: [{ scale: layerScale }, { translateX: 0 }, { translateY: 0 }] };
    const translateX = (0.5 - progressB.value) * 70;
    const translateY = (progressB.value - 0.5) * 90;
    const opacity = 0.65;
    return { opacity, transform: [{ scale: layerScale }, { translateX }, { translateY }] };
  });

  const blurIntensity = Math.max(0, Math.min(100, colors.blurIntensity));

  const gradientA = [
    colors.backgroundGradientStart,
    colors.background,
    colors.backgroundGradientEnd,
  ] as const;

  const gradientB = [
    colors.backgroundGradientEnd,
    colors.secondary,
    colors.backgroundGradientStart,
  ] as const;

  // Non-glass themes: keep a clean static background.
  if (!isGlassmorphicTheme) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedLayerA]}>
          <LinearGradient
            colors={gradientA}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFillObject, animatedLayerB]}>
          <LinearGradient
            colors={gradientB}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <BlurView
          intensity={reduceMotion ? 0 : blurIntensity}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedBackground;
