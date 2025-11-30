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
  Easing,
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
    // Buttery smooth pulsing with longer duration
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.85, { duration: 5000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(intensity * 0.9, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
          withTiming(intensity * 0.35, { duration: 4000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    // Very smooth drift movement
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(25, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-25, { duration: 10000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
          withTiming(20, { duration: 8000, easing: Easing.inOut(Easing.sin) })
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
          shadowRadius: size / 2.5,
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
    fadeIn.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  // Dark theme gradient - warm deep brown/orange tones
  const darkGradient: [string, string, string, string] = [
    '#0C0A09', // Very dark warm black
    '#1C1410', // Deep brown
    '#231815', // Warm dark brown
    '#0F0C0A', // Near black
  ];

  // Light theme gradient - warm cream/peach
  const lightGradient: [string, string, string, string] = [
    '#FFFBF5',
    '#FFF5EB', 
    '#FFE8D6',
    '#FFF8F0',
  ];

  // Warm glow orbs - orange, amber, rose tones
  const glowOrbs = isDark ? [
    { color: 'rgba(251, 146, 60, 0.35)', size: 380, x: width * 0.15, y: height * 0.12, delay: 0, intensity: 0.55 },
    { color: 'rgba(234, 88, 12, 0.3)', size: 320, x: width * 0.85, y: height * 0.28, delay: 800, intensity: 0.45 },
    { color: 'rgba(251, 191, 36, 0.28)', size: 300, x: width * 0.08, y: height * 0.58, delay: 1600, intensity: 0.42 },
    { color: 'rgba(248, 113, 113, 0.22)', size: 260, x: width * 0.92, y: height * 0.72, delay: 400, intensity: 0.35 },
    { color: 'rgba(253, 186, 116, 0.25)', size: 290, x: width * 0.5, y: height * 0.88, delay: 1200, intensity: 0.4 },
  ] : [
    { color: 'rgba(251, 146, 60, 0.18)', size: 380, x: width * 0.15, y: height * 0.12, delay: 0, intensity: 0.28 },
    { color: 'rgba(234, 88, 12, 0.14)', size: 320, x: width * 0.85, y: height * 0.28, delay: 800, intensity: 0.22 },
    { color: 'rgba(251, 191, 36, 0.12)', size: 300, x: width * 0.08, y: height * 0.58, delay: 1600, intensity: 0.2 },
  ];

  return (
    <View style={styles.container}>
      {/* Main gradient background */}
      <LinearGradient
        colors={isDark ? darkGradient : lightGradient}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.35, 0.7, 1]}
      />

      {/* Secondary overlay gradient for depth - warm tones */}
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(251, 146, 60, 0.06)', 'rgba(234, 88, 12, 0.08)', 'transparent']
            : ['transparent', 'rgba(251, 146, 60, 0.04)', 'rgba(251, 191, 36, 0.03)', 'transparent']
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

      {/* Top warm radial glow */}
      {isDark && (
        <View style={styles.topGlow}>
          <LinearGradient
            colors={['rgba(251, 146, 60, 0.12)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
      )}

      {/* Subtle noise texture overlay */}
      <View 
        style={[
          StyleSheet.absoluteFillObject, 
          { 
            backgroundColor: isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.015)',
            opacity: 0.4,
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
    backgroundColor: '#0C0A09',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
});

export default AnimatedBackground;
