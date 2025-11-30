import React, { useEffect } from 'react';
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

// ============================================================
// AURORA WAVE - Flowing gradient wave animation
// ============================================================
const AuroraWave: React.FC<{ 
  isDark: boolean; 
  delay?: number;
  colors: readonly [string, string, ...string[]];
  duration?: number;
  reverse?: boolean;
}> = ({ isDark, delay = 0, colors, duration = 8000, reverse = false }) => {
  const translateX = useSharedValue(reverse ? width : -width);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Fade in
    opacity.value = withDelay(delay, withTiming(1, { duration: 1500 }));

    // Horizontal wave motion
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(reverse ? -width : width, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(reverse ? width : -width, { duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Vertical drift
    translateY.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(50, { duration: duration * 0.7, easing: Easing.inOut(Easing.sin) }),
          withTiming(-50, { duration: duration * 0.7, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Breathing scale
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: duration * 0.6, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.9, { duration: duration * 0.6, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
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
};

// ============================================================
// SHIMMER OVERLAY - Diagonal light sweep effect
// ============================================================
const ShimmerOverlay: React.FC<{ isDark: boolean }> = React.memo(({ isDark }) => {
  const translateX = useSharedValue(-width * 1.5);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(width * 1.5, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withDelay(1000, withTiming(-width * 1.5, { duration: 0 }))
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
            : ['transparent', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.3)', 'transparent']
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
// BREATHING GLOW - Pulsing ambient light
// ============================================================
const BreathingGlow: React.FC<{ 
  isDark: boolean;
  position: 'top' | 'bottom' | 'center';
  color: string;
  delay?: number;
}> = ({ isDark, position, color, delay = 0 }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.9, { duration: 4000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
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
};

// ============================================================
// COLOR SHIFT BACKGROUND - Animating gradient colors
// ============================================================
const ColorShiftBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    return () => cancelAnimation(progress);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(progress.value, [0, 1], [0, 15]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.05, 1]);
    
    return {
      transform: [
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, animatedStyle]}>
      <LinearGradient
        colors={
          isDark
            ? ['#0a0a18', '#12122a', '#1a1040', '#12122a', '#0a0a18']
            : ['#f8faff', '#ede9fe', '#e0e7ff', '#ede9fe', '#f8faff']
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.25, 0.5, 0.75, 1]}
      />
    </Animated.View>
  );
};

// ============================================================
// MOVING GRADIENT MESH
// ============================================================
const GradientMesh: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const offset1 = useSharedValue(0);
  const offset2 = useSharedValue(0);

  useEffect(() => {
    offset1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    offset2.value = withDelay(
      2000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(offset1);
      cancelAnimation(offset2);
    };
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: interpolate(offset1.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
    transform: [
      { translateY: interpolate(offset1.value, [0, 1], [-30, 30]) },
    ],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: interpolate(offset2.value, [0, 0.5, 1], [0.2, 0.5, 0.2]),
    transform: [
      { translateX: interpolate(offset2.value, [0, 1], [-20, 20]) },
    ],
  }));

  return (
    <>
      <Animated.View style={[styles.meshLayer, animatedStyle1]} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['transparent', 'rgba(139, 92, 246, 0.15)', 'transparent']
              : ['transparent', 'rgba(139, 92, 246, 0.08)', 'transparent']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View style={[styles.meshLayer, animatedStyle2]} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['transparent', 'rgba(59, 130, 246, 0.12)', 'transparent']
              : ['transparent', 'rgba(59, 130, 246, 0.06)', 'transparent']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
    </>
  );
};

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
  const { isDark } = useThemeStore();
  const fadeIn = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(fadeIn);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const isMinimal = variant === 'minimal';

  // Aurora wave colors
  const auroraColors1: readonly [string, string, ...string[]] = isDark
    ? ['transparent', 'rgba(139, 92, 246, 0.2)', 'rgba(99, 102, 241, 0.15)', 'transparent']
    : ['transparent', 'rgba(139, 92, 246, 0.1)', 'rgba(99, 102, 241, 0.08)', 'transparent'];
  
  const auroraColors2: readonly [string, string, ...string[]] = isDark
    ? ['transparent', 'rgba(59, 130, 246, 0.18)', 'rgba(6, 182, 212, 0.12)', 'transparent']
    : ['transparent', 'rgba(59, 130, 246, 0.08)', 'rgba(6, 182, 212, 0.05)', 'transparent'];

  const auroraColors3: readonly [string, string, ...string[]] = isDark
    ? ['transparent', 'rgba(168, 85, 247, 0.15)', 'rgba(236, 72, 153, 0.1)', 'transparent']
    : ['transparent', 'rgba(168, 85, 247, 0.06)', 'rgba(236, 72, 153, 0.04)', 'transparent'];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a14' : '#F8FAFC' }]}>
      {/* Animated color-shifting base */}
      {!isMinimal && <ColorShiftBackground isDark={isDark} />}

      {/* Static base gradient for minimal */}
      {isMinimal && (
        <LinearGradient
          colors={isDark ? ['#0a0a14', '#0F0F1A', '#0a0a14'] : ['#F8FAFC', '#EEE8FF', '#F8FAFC']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Animated layers */}
      <Animated.View style={[StyleSheet.absoluteFillObject, containerStyle]}>
        {/* Moving gradient mesh */}
        {!isMinimal && <GradientMesh isDark={isDark} />}

        {/* Aurora waves - flowing gradients */}
        {!isMinimal && (
          <>
            <AuroraWave isDark={isDark} colors={auroraColors1} delay={0} duration={10000} />
            <AuroraWave isDark={isDark} colors={auroraColors2} delay={1500} duration={12000} reverse />
            <AuroraWave isDark={isDark} colors={auroraColors3} delay={3000} duration={14000} />
          </>
        )}

        {/* Breathing glows */}
        {!isMinimal && (
          <>
            <BreathingGlow 
              isDark={isDark} 
              position="top" 
              color={isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(139, 92, 246, 0.12)'} 
              delay={0}
            />
            <BreathingGlow 
              isDark={isDark} 
              position="bottom" 
              color={isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'} 
              delay={1500}
            />
          </>
        )}

        {/* Shimmer effect */}
        {!isMinimal && <ShimmerOverlay isDark={isDark} />}
      </Animated.View>

      {/* Top static glow */}
      <View style={styles.topGlow} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['rgba(139, 92, 246, 0.12)', 'rgba(99, 102, 241, 0.06)', 'transparent']
              : ['rgba(139, 92, 246, 0.06)', 'rgba(99, 102, 241, 0.03)', 'transparent']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Bottom static glow */}
      <View style={styles.bottomGlow} pointerEvents="none">
        <LinearGradient
          colors={
            isDark
              ? ['transparent', 'rgba(59, 130, 246, 0.08)', 'rgba(139, 92, 246, 0.12)']
              : ['transparent', 'rgba(59, 130, 246, 0.04)', 'rgba(139, 92, 246, 0.06)']
          }
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Vignette */}
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
