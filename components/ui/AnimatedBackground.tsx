import React, { useEffect } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

const { width, height } = Dimensions.get('window');

// Glowing orb component for ambient lighting effect
interface GlowOrbProps {
  color: string;
  size: number;
  x: number;
  y: number;
  delay?: number;
  intensity?: number;
}

export const GlowOrb: React.FC<GlowOrbProps> = ({
  color,
  size,
  x,
  y,
  delay = 0,
  intensity = 0.6,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(intensity * 0.5);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Smooth pulsing glow
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.9, { duration: 4000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(intensity * 0.8, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(intensity * 0.4, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      )
    );

    // Subtle drift movement
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 8000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(-20, { duration: 8000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay + 1000,
      withRepeat(
        withSequence(
          withTiming(-15, { duration: 6000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(15, { duration: 6000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: size / 2,
          elevation: 0,
        }}
      />
    </Animated.View>
  );
};

// Legacy FloatingBlob for backwards compatibility (not used in new design)
export const FloatingBlob: React.FC<{
  colors: string[];
  size: number;
  initialX: number;
  initialY: number;
  duration?: number;
  delay?: number;
}> = () => null;

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
    fadeIn.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  // Dark theme gradient colors - deep blue to purple
  const darkGradient: [string, string, string, string] = [
    '#0a0a1a', // Very dark blue-black
    '#0f0f2e', // Dark indigo
    '#1a1040', // Deep purple
    '#0d0d24', // Dark blue
  ];

  // Light theme gradient colors
  const lightGradient: [string, string, string, string] = [
    '#f8fafc',
    '#eef2ff', 
    '#e0e7ff',
    '#f1f5f9',
  ];

  // Glow orbs configuration
  const glowOrbs = isDark ? [
    { color: 'rgba(99, 102, 241, 0.4)', size: 400, x: width * 0.2, y: height * 0.15, delay: 0, intensity: 0.5 },
    { color: 'rgba(139, 92, 246, 0.35)', size: 350, x: width * 0.8, y: height * 0.3, delay: 1000, intensity: 0.45 },
    { color: 'rgba(59, 130, 246, 0.3)', size: 300, x: width * 0.1, y: height * 0.6, delay: 2000, intensity: 0.4 },
    { color: 'rgba(168, 85, 247, 0.25)', size: 280, x: width * 0.9, y: height * 0.75, delay: 500, intensity: 0.35 },
    { color: 'rgba(79, 70, 229, 0.3)', size: 320, x: width * 0.5, y: height * 0.9, delay: 1500, intensity: 0.4 },
  ] : [
    { color: 'rgba(99, 102, 241, 0.15)', size: 400, x: width * 0.2, y: height * 0.15, delay: 0, intensity: 0.25 },
    { color: 'rgba(139, 92, 246, 0.12)', size: 350, x: width * 0.8, y: height * 0.3, delay: 1000, intensity: 0.2 },
    { color: 'rgba(59, 130, 246, 0.1)', size: 300, x: width * 0.1, y: height * 0.6, delay: 2000, intensity: 0.18 },
  ];

  return (
    <View style={styles.container}>
      {/* Main gradient background */}
      <LinearGradient
        colors={isDark ? darkGradient : lightGradient}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.7, 1]}
      />

      {/* Secondary overlay gradient for depth */}
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(99, 102, 241, 0.08)', 'rgba(139, 92, 246, 0.12)', 'transparent']
            : ['transparent', 'rgba(99, 102, 241, 0.05)', 'rgba(139, 92, 246, 0.03)', 'transparent']
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 0.8 }}
      />

      {/* Animated glow orbs */}
      <Animated.View style={[StyleSheet.absoluteFillObject, containerStyle]}>
        {variant !== 'minimal' && glowOrbs.map((orb, index) => (
          <GlowOrb
            key={index}
            color={orb.color}
            size={orb.size}
            x={orb.x}
            y={orb.y}
            delay={orb.delay}
            intensity={orb.intensity}
          />
        ))}
      </Animated.View>

      {/* Top radial glow */}
      {isDark && (
        <View style={styles.topGlow}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.15)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
      )}

      {/* Noise texture overlay for depth (simulated) */}
      <View 
        style={[
          StyleSheet.absoluteFillObject, 
          { 
            backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.02)',
            opacity: 0.5,
          }
        ]} 
        pointerEvents="none"
      />

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
});

export default AnimatedBackground;
