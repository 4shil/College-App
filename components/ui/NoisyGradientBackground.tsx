import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useThemeStore } from '../../store/themeStore';

type NoisyGradientBackgroundProps = {
  animated?: boolean;
};

export const NoisyGradientBackground: React.FC<NoisyGradientBackgroundProps> = ({ animated = true }) => {
  const { colors, isDark } = useThemeStore();

  const t = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;

    t.value = withRepeat(
      withTiming(1, {
        duration: 18000,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [animated, t]);

  const gradientColors = useMemo(
    () => [colors.backgroundGradientStart, colors.primary, colors.backgroundGradientEnd] as const,
    [colors.backgroundGradientStart, colors.primary, colors.backgroundGradientEnd]
  );

  const animatedGradientStyle = useAnimatedStyle(() => {
    const phase = t.value * Math.PI * 2;
    const translateX = Math.sin(phase) * 40;
    const translateY = Math.cos(phase) * 34;
    const rotate = `${Math.sin(phase * 0.6) * 10}deg`;

    return {
      transform: [{ translateX }, { translateY }, { rotate }],
    };
  });

  const animatedNoiseStyle = useAnimatedStyle(() => {
    const phase = t.value * Math.PI * 2;
    const translateX = Math.cos(phase * 1.25) * 90;
    const translateY = Math.sin(phase * 1.1) * 70;

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[styles.gradientWrap, animatedGradientStyle]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <BlurView
        tint={isDark ? 'dark' : 'light'}
        intensity={isDark ? 65 : 45}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.Image
        source={require('../../assets/noise.png')}
        resizeMode="repeat"
        style={[styles.noise, animatedNoiseStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  gradientWrap: {
    position: 'absolute',
    width: '160%',
    height: '160%',
    left: '-30%',
    top: '-30%',
  },
  noise: {
    position: 'absolute',
    width: '140%',
    height: '140%',
    left: '-20%',
    top: '-20%',
    opacity: 0.06,
  },
});

export default NoisyGradientBackground;
