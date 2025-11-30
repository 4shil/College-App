import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
  style?: ViewStyle;
  intensity?: number;
  floating?: boolean;
  glowColor?: string;
  delay?: number;
  variant?: 'default' | 'elevated' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 40,
  floating = false,
  glowColor,
  delay = 0,
  variant = 'default',
}) => {
  const { isDark } = useThemeStore();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, {
        damping: 18,
        stiffness: 80,
        mass: 0.8,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [24, 0]);
    const opacity = interpolate(progress.value, [0, 0.4, 1], [0, 0.6, 1]);
    const scale = interpolate(progress.value, [0, 1], [0.97, 1]);

    return {
      opacity,
      transform: [
        { translateY },
        { scale },
      ],
    };
  });

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 28,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.09)'
            : 'rgba(255, 255, 255, 0.88)',
        };
      case 'subtle':
        return {
          shadowOpacity: 0.08,
          shadowRadius: 12,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.04)'
            : 'rgba(255, 255, 255, 0.55)',
        };
      default:
        return {
          shadowOpacity: isDark ? 0.25 : 0.1,
          shadowRadius: 22,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.06)'
            : 'rgba(255, 255, 255, 0.75)',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const defaultGlowColor = isDark ? '#8B5CF6' : '#7C3AED';

  // Android-specific background colors (no blur, just solid translucent)
  const androidBackground = isDark
    ? 'rgba(22, 22, 40, 0.98)'
    : 'rgba(255, 255, 255, 0.98)';

  // Platform-specific shadow styles
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: glowColor || defaultGlowColor,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  });

  const renderContent = () => (
    <View
      style={[
        styles.content,
        {
          backgroundColor: Platform.OS === 'android' 
            ? androidBackground 
            : variantStyles.backgroundColor,
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(255, 255, 255, 0.92)',
        },
      ]}
    >
      {/* Top edge highlight */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.5)', 'transparent']
        }
        style={styles.topHighlight}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Purple inner glow effect */}
      <View
        style={[
          styles.innerGlow,
          {
            backgroundColor: isDark
              ? 'rgba(139, 92, 246, 0.025)'
              : 'rgba(139, 92, 246, 0.02)',
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        shadowStyle,
        animatedStyle,
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          style={styles.blur}
          tint={isDark ? 'dark' : 'light'}
        >
          {renderContent()}
        </BlurView>
      ) : (
        <View style={styles.blur}>
          {renderContent()}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  content: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

export default GlassCard;
