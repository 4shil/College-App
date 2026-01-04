import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export type TriangleLoaderProps = {
  size?: number;
  color?: string;
  animating?: boolean;
  style?: ViewStyle;
};

const BAR_COUNT = 8;

export function TriangleLoader({ size = 50, color, animating = true, style }: TriangleLoaderProps) {
  const { colors } = useThemeStore();
  const fill = color ?? colors.primary;

  const barProgress = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!animating) {
      for (const v of barProgress) {
        v.stopAnimation(() => v.setValue(0));
      }
      return;
    }

    const animations = barProgress.map((v, index) => {
      const delay = (index + 1) * 100;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 600,
            easing: Easing.linear,
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 600,
            easing: Easing.linear,
            useNativeDriver: true,
            isInteraction: false,
          }),
        ]),
        { iterations: -1, resetBeforeIteration: true }
      );
    });

    animations.forEach((a) => a.start());
    return () => {
      animations.forEach((a) => a.stop());
      for (const v of barProgress) v.setValue(0);
    };
  }, [animating, barProgress]);

  const { barWidth, barHeight, gap, containerWidth } = useMemo(() => {
    // Keep the same visual proportions as the provided CSS loader:
    // size=50 => barWidth≈10, barHeight≈70.
    const w = Math.max(2, Math.round(size * 0.2));
    const h = Math.max(16, Math.round(size * 1.4));
    const g = Math.max(2, Math.round(w * 0.4));
    const total = BAR_COUNT * w + (BAR_COUNT - 1) * g;
    return { barWidth: w, barHeight: h, gap: g, containerWidth: total };
  }, [size]);

  return (
    <View
      style={[styles.container, { width: containerWidth, height: barHeight }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <View style={[styles.row, { gap }]}>
        {barProgress.map((v, index) => {
          const scaleY = v.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 1],
          });

          const opacity = v.interpolate({
            inputRange: [0, 1],
            outputRange: [0.15, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: barHeight,
                  backgroundColor: fill,
                  opacity,
                  transform: [{ scaleY }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    transformOrigin: 'bottom' as any,
  },
});
