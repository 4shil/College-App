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

interface FloatingBlobProps {
  colors: string[];
  size: number;
  initialX: number;
  initialY: number;
  duration?: number;
  delay?: number;
}

export const FloatingBlob: React.FC<FloatingBlobProps> = ({
  colors,
  size,
  initialX,
  initialY,
  duration = 10000,
  delay = 0,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Horizontal floating
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(40, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(-40, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 0.5, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Vertical floating
    translateY.value = withDelay(
      delay + 500,
      withRepeat(
        withSequence(
          withTiming(-35, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(35, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 0.4, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Scale breathing
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Opacity pulse
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) })
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
          left: initialX,
          top: initialY,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={colors as [string, string, ...string[]]}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

interface AnimatedBackgroundProps {
  children: React.ReactNode;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children }) => {
  const { isDark, colors } = useThemeStore();

  const darkBlobs = [
    { colors: ['#8B5CF6', '#3B82F6'], size: 320, x: -120, y: height * 0.05, duration: 12000, delay: 0 },
    { colors: ['#EC4899', '#8B5CF6'], size: 280, x: width - 80, y: height * 0.35, duration: 14000, delay: 2000 },
    { colors: ['#06B6D4', '#3B82F6'], size: 240, x: width * 0.2, y: height * 0.65, duration: 10000, delay: 1000 },
    { colors: ['#F59E0B', '#EF4444'], size: 200, x: width * 0.6, y: height * 0.85, duration: 11000, delay: 3000 },
  ];

  const lightBlobs = [
    { colors: ['#c7d2fe', '#a5b4fc'], size: 320, x: -120, y: height * 0.05, duration: 12000, delay: 0 },
    { colors: ['#fce7f3', '#f5d0fe'], size: 280, x: width - 80, y: height * 0.35, duration: 14000, delay: 2000 },
    { colors: ['#cffafe', '#bae6fd'], size: 240, x: width * 0.2, y: height * 0.65, duration: 10000, delay: 1000 },
    { colors: ['#fef3c7', '#fde68a'], size: 200, x: width * 0.6, y: height * 0.85, duration: 11000, delay: 3000 },
  ];

  const blobs = isDark ? darkBlobs : lightBlobs;

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#0f172a', '#1e1b4b', '#312e81']
            : ['#e0e7ff', '#f0f9ff', '#f8fafc']
        }
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Radial glow */}
      <View
        style={[
          styles.radialGlow,
          {
            backgroundColor: isDark
              ? 'rgba(139, 92, 246, 0.12)'
              : 'rgba(99, 102, 241, 0.08)',
          },
        ]}
      />

      {/* Floating blobs */}
      {blobs.map((blob, index) => (
        <FloatingBlob
          key={index}
          colors={blob.colors}
          size={blob.size}
          initialX={blob.x}
          initialY={blob.y}
          duration={blob.duration}
          delay={blob.delay}
        />
      ))}

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  radialGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    top: height * 0.15,
    left: -width * 0.25,
  },
});

export default AnimatedBackground;
