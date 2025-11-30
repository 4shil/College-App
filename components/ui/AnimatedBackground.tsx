import React, { useEffect, useMemo } from 'react';
import { View, Dimensions, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

const { width, height } = Dimensions.get('window');

// Performance: Check if Android for reduced animations
const isAndroid = Platform.OS === 'android';

// ============================================================
// AURORA WAVE - Flowing gradient wave animation (optimized)
// ============================================================
const AuroraWave: React.FC<{ 
  isDark: boolean; 
  delay?: number;
  colors: readonly [string, string, ...string[]];
  duration?: number;
  reverse?: boolean;
}> = React.memo(({ isDark, delay = 0, colors, duration = 8000, reverse = false }) => {
  const translateX = useSharedValue(reverse ? width : -width);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in
    opacity.value = withDelay(delay, withTiming(1, { duration: 1500 }));

    // Horizontal wave motion only (removed Y and scale for performance)
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(reverse ? -width : width, { duration, easing: Easing.linear }),
          withTiming(reverse ? width : -width, { duration, easing: Easing.linear })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.auroraWave, animatedStyle]}>
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
});

// ============================================================
// SHIMMER OVERLAY - Diagonal light sweep effect (optimized)
// ============================================================
const ShimmerOverlay: React.FC<{ isDark: boolean }> = React.memo(({ isDark }) => {
  const translateX = useSharedValue(-width * 1.5);

  useEffect(() => {
    // Slower animation for better performance
    translateX.value = withRepeat(
      withSequence(
        withTiming(width * 1.5, { duration: 6000, easing: Easing.linear }),
        withDelay(2000, withTiming(-width * 1.5, { duration: 0 }))
      ),
      -1,
      false
    );

    return () => cancelAnimation(translateX);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: '-20deg' },
    ],
  }));

  return (
    <Animated.View style={[styles.shimmerContainer, animatedStyle]} pointerEvents="none">
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)', 'transparent']
            : ['transparent', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.4)', 'transparent']
        }
        style={styles.shimmerGradient}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0, 0.3, 0.5, 0.7, 1]}
      />
    </Animated.View>
  );
});

// ============================================================
// BREATHING GLOW - Pulsing ambient light (optimized)
// ============================================================
const BreathingGlow: React.FC<{ 
  isDark: boolean;
  position: 'top' | 'bottom' | 'center';
  color: string;
  delay?: number;
}> = React.memo(({ isDark, position, color, delay = 0 }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Simpler animation - opacity only, no scale for better performance
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: 4000, easing: Easing.linear }),
          withTiming(0.3, { duration: 4000, easing: Easing.linear })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const positionStyle = {
    top: { top: -height * 0.2, left: -width * 0.3 },
    bottom: { bottom: -height * 0.2, right: -width * 0.3 },
    center: { top: height * 0.3, left: width * 0.1 },
  }[position];

  return (
    <Animated.View 
      style={[styles.breathingGlow, positionStyle, animatedStyle]} 
      pointerEvents="none"
    >
      <LinearGradient
        colors={[color, 'transparent']}
        style={styles.glowGradient}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
});

// ============================================================
// COLOR SHIFT BACKGROUND - Animating gradient colors (optimized)
// ============================================================
const ColorShiftBackground: React.FC<{ isDark: boolean }> = React.memo(({ isDark }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Slower, simpler animation for performance
    progress.value = withRepeat(
      withTiming(1, { duration: 15000, easing: Easing.linear }),
      -1,
      true
    );

    return () => cancelAnimation(progress);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Reduced rotation range for smoother animation
    const rotate = interpolate(progress.value, [0, 1], [0, 8]);
    
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
      <LinearGradient
        colors={
          isDark
            ? ['#0a0a18', '#12122a', '#1a1040', '#12122a', '#0a0a18']
            : ['#FFFFFF', '#F0F9FF', '#E0F2FE', '#F0F9FF', '#FFFFFF']
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.25, 0.5, 0.75, 1]}
      />
    </Animated.View>
  );
});

// ============================================================
// MOVING GRADIENT MESH (optimized)
// ============================================================
const GradientMesh: React.FC<{ isDark: boolean }> = React.memo(({ isDark }) => {
  const offset1 = useSharedValue(0);

  useEffect(() => {
    // Single animation instead of two for better performance
    offset1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 8000, easing: Easing.linear }),
        withTiming(0, { duration: 8000, easing: Easing.linear })
      ),
      -1,
      true
    );

    return () => {
      cancelAnimation(offset1);
    };
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(offset1.value, [0, 0.5, 1], [0.2, 0.4, 0.2]),
  }));

  return (
    <Animated.View style={[styles.meshLayer, animatedStyle1]} pointerEvents="none">
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(139, 92, 246, 0.12)', 'transparent']
            : ['transparent', 'rgba(59, 130, 246, 0.08)', 'transparent']
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
});

// Legacy exports for backwards compatibility
export const FloatingBlob: React.FC<any> = () => null;
export const GlowOrb: React.FC<any> = () => null;

// ============================================================
// MAIN ANIMATED BACKGROUND COMPONENT
// ============================================================
interface AnimatedBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'minimal';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  children,
  variant = 'default',
}) => {
  const { isDark, animationsEnabled } = useThemeStore();
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(fadeIn);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  // Disable animations if user turned them off, variant is minimal, OR in light mode (clean white theme)
  const isMinimal = variant === 'minimal' || !animationsEnabled || !isDark;
  // On Android, reduce number of animated layers for better performance
  const reducedAnimations = isAndroid && !isMinimal;

  // Aurora wave colors - only used in dark mode now
  const auroraColors1: readonly [string, string, ...string[]] = 
    ['transparent', 'rgba(139, 92, 246, 0.2)', 'rgba(99, 102, 241, 0.15)', 'transparent'];
  
  const auroraColors2: readonly [string, string, ...string[]] = 
    ['transparent', 'rgba(59, 130, 246, 0.18)', 'rgba(6, 182, 212, 0.12)', 'transparent'];

  const auroraColors3: readonly [string, string, ...string[]] = 
    ['transparent', 'rgba(168, 85, 247, 0.15)', 'rgba(236, 72, 153, 0.1)', 'transparent'];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a14' : '#FFFFFF' }]}>
      {/* Animated color-shifting base - dark mode only */}
      {!isMinimal && isDark && <ColorShiftBackground isDark={isDark} />}

      {/* Static base gradient for light mode - clean white */}
      {!isDark && (
        <LinearGradient
          colors={['#FFFFFF', '#FAFAFA', '#FFFFFF']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Static base gradient for minimal dark mode */}
      {isMinimal && isDark && (
        <LinearGradient
          colors={['#0a0a14', '#0F0F1A', '#0a0a14']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Animated layers - dark mode only */}
      {isDark && (
        <Animated.View style={[StyleSheet.absoluteFillObject, containerStyle]}>
          {/* Moving gradient mesh */}
          {!isMinimal && <GradientMesh isDark={isDark} />}

          {/* Aurora waves - reduced on Android for performance */}
          {!isMinimal && (
            <>
              <AuroraWave isDark={isDark} colors={auroraColors1} delay={0} duration={12000} />
              {!reducedAnimations && (
                <AuroraWave isDark={isDark} colors={auroraColors2} delay={2000} duration={14000} reverse />
              )}
              {!reducedAnimations && (
                <AuroraWave isDark={isDark} colors={auroraColors3} delay={4000} duration={16000} />
              )}
            </>
          )}

          {/* Breathing glows */}
          {!isMinimal && !reducedAnimations && (
            <>
              <BreathingGlow 
                isDark={isDark} 
                position="top" 
                color={'rgba(139, 92, 246, 0.25)'} 
                delay={0}
              />
              <BreathingGlow 
                isDark={isDark} 
                position="bottom" 
                color={'rgba(59, 130, 246, 0.2)'} 
                delay={2000}
              />
            </>
          )}

          {/* Shimmer effect - skip on Android for performance */}
          {!isMinimal && !isAndroid && <ShimmerOverlay isDark={isDark} />}
        </Animated.View>
      )}

      {/* Top static glow - subtle for light mode */}
      <View style={styles.topGlow} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['rgba(139, 92, 246, 0.12)', 'rgba(99, 102, 241, 0.06)', 'transparent']
              : ['rgba(59, 130, 246, 0.04)', 'rgba(96, 165, 250, 0.02)', 'transparent']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Bottom static glow - subtle for light mode */}
      <View style={styles.bottomGlow} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['transparent', 'rgba(59, 130, 246, 0.08)', 'rgba(139, 92, 246, 0.12)']
              : ['transparent', 'rgba(59, 130, 246, 0.02)', 'rgba(96, 165, 250, 0.04)']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Vignette - dark mode only */}
      {isDark && (
        <View style={styles.vignette} pointerEvents="none">
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.25)', 'transparent', 'transparent', 'rgba(0, 0, 0, 0.2)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.15, 0.85, 1]}
          />
        </View>
      )}

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmerContainer: {
    position: 'absolute',
    top: -height * 0.3,
    left: -width * 0.5,
    width: width * 0.8,
    height: height * 1.6,
  },
  shimmerGradient: {
    flex: 1,
  },
  auroraWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width * 2,
    height: height,
  },
  breathingGlow: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
  },
  glowGradient: {
    flex: 1,
    borderRadius: width,
  },
  meshLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default AnimatedBackground;
