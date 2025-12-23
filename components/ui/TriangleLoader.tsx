import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export type TriangleLoaderProps = {
  size?: number;
  color?: string;
  animating?: boolean;
  style?: ViewStyle;
};

const TRI_HEIGHT_RATIO = 0.866; // ~= sqrt(3)/2

export function TriangleLoader({ size = 50, color, animating = true, style }: TriangleLoaderProps) {
  const { colors } = useThemeStore();
  const fill = color ?? colors.primary;

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animating) {
      progress.stopAnimation(() => {
        progress.setValue(0);
      });
      return;
    }

    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        isInteraction: false,
      }),
      { iterations: -1, resetBeforeIteration: true }
    );

    loop.start();
    return () => {
      loop.stop();
      progress.setValue(0);
    };
  }, [animating, progress]);

  const { width, height, smallSide, smallHeight } = useMemo(() => {
    const w = size;
    const h = size * TRI_HEIGHT_RATIO;
    const s = Math.round(size / 2);
    const sh = s * TRI_HEIGHT_RATIO;
    return { width: w, height: h, smallSide: s, smallHeight: sh };
  }, [size]);

  const topOpacity = progress.interpolate({
    inputRange: [0, 0.1333, 0.6, 0.7333, 1],
    outputRange: [0, 1, 1, 0, 0],
    extrapolate: 'clamp',
  });

  const rightOpacity = progress.interpolate({
    inputRange: [0, 0.2667, 0.6, 0.8667, 1],
    outputRange: [0, 1, 1, 0, 0],
    extrapolate: 'clamp',
  });

  const leftOpacity = progress.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  const topScale = progress.interpolate({
    inputRange: [0, 0.1333, 0.6, 0.7333, 1],
    outputRange: [0.88, 1, 1, 0.9, 0.88],
    extrapolate: 'clamp',
  });

  const rightScale = progress.interpolate({
    inputRange: [0, 0.2667, 0.6, 0.8667, 1],
    outputRange: [0.88, 1, 1, 0.9, 0.88],
    extrapolate: 'clamp',
  });

  const leftScale = progress.interpolate({
    inputRange: [0, 0.4, 0.6, 1],
    outputRange: [0.88, 1, 1, 0.88],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.container, { width, height }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <Animated.View
        style={[
          styles.triangleWrap,
          {
            left: (width - smallSide) / 2,
            top: 0,
            opacity: topOpacity,
            transform: [{ scale: topScale }],
          },
        ]}
      >
        <View style={triangleStyle(smallSide, fill)} />
      </Animated.View>

      <Animated.View
        style={[
          styles.triangleWrap,
          {
            left: width / 2,
            top: height - smallHeight,
            opacity: rightOpacity,
            transform: [{ scale: rightScale }],
          },
        ]}
      >
        <View style={triangleStyle(smallSide, fill)} />
      </Animated.View>

      <Animated.View
        style={[
          styles.triangleWrap,
          {
            left: 0,
            top: height - smallHeight,
            opacity: leftOpacity,
            transform: [{ scale: leftScale }],
          },
        ]}
      >
        <View style={triangleStyle(smallSide, fill)} />
      </Animated.View>
    </View>
  );
}

function triangleStyle(side: number, fill: string) {
  const h = side * TRI_HEIGHT_RATIO;

  return {
    width: 0,
    height: 0,
    borderLeftWidth: side / 2,
    borderRightWidth: side / 2,
    borderBottomWidth: h,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: fill,
  } as const;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  triangleWrap: {
    position: 'absolute',
  },
});
