import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { TriangleLoader } from './TriangleLoader';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  glowing?: boolean;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'large',
  style,
  textStyle,
  glowing = false,
  icon,
}) => {
  const { colors, animationsEnabled, isDark, canAnimateBackground } = useThemeStore();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.25);
  const pressProgress = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (animationsEnabled && glowing && variant === 'primary' && !disabled) {
      // Subtle pulsing glow
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.2, { duration: 2500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      
      // Shimmer effect
      shimmer.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    }
  }, [animationsEnabled, glowing, variant, disabled]);

  const handlePressIn = () => {
    scale.value = withSpring(0.965, { damping: 12, stiffness: 350 });
    pressProgress.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 350 });
    pressProgress.value = withTiming(0, { duration: 180 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const brightness = interpolate(pressProgress.value, [0, 1], [1, 0.92]);
    return {
      transform: [{ scale: scale.value }],
      opacity: brightness,
    };
  });

  const accent = variant === 'secondary' ? colors.secondary : colors.primary;
  const surfaceBg = withAlpha(accent, isDark ? 0.18 : 0.1);
  const surfaceBorder = withAlpha(accent, isDark ? 0.35 : 0.3);

  const heights = {
    small: 42,
    medium: 50,
    large: 56,
  };

  const fontSizes = {
    small: 13,
    medium: 14,
    large: 15,
  };

  const getGradientColors = (): [string, string, string] => {
    if (variant === 'primary') {
      const c = canAnimateBackground ? withAlpha(colors.primary, isDark ? 0.22 : 0.14) : withAlpha(colors.primary, isDark ? 0.18 : 0.12);
      return [c, c, c];
    }
    if (variant === 'secondary') {
      const c = canAnimateBackground ? withAlpha(colors.secondary, isDark ? 0.22 : 0.14) : withAlpha(colors.secondary, isDark ? 0.18 : 0.12);
      return [c, c, c];
    }
    return ['transparent', 'transparent', 'transparent'];
  };

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          activeOpacity={0.8}
          style={[
            variant === 'outline' ? styles.outlineButton : styles.ghostButton,
            {
              height: heights[size],
              borderRadius: colors.borderRadius,
              borderWidth: variant === 'outline' ? colors.borderWidth : 0,
              borderColor: variant === 'outline' 
                ? colors.primary
                : 'transparent',
              backgroundColor: variant === 'ghost' 
                ? (canAnimateBackground
                    ? withAlpha(colors.cardBackground, isDark ? 0.72 : 0.86)
                    : colors.cardBackground)
                : 'transparent',
              opacity: disabled ? 0.5 : 1,
            },
            style,
          ]}
        >
          {loading ? (
            <TriangleLoader size={16} color={colors.primary} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.outlineText,
                  { 
                    color: colors.primary,
                    fontSize: fontSizes[size],
                    marginLeft: icon ? 8 : 0,
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={[
            styles.gradient,
            {
              height: heights[size],
              borderRadius: colors.borderRadius,
              opacity: disabled ? 0.5 : 1,
              borderWidth: colors.borderWidth,
              borderColor: surfaceBorder,
              backgroundColor: surfaceBg,
            },
            style,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {loading ? (
            <TriangleLoader size={16} color={accent} />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.text, 
                  { 
                    fontSize: fontSizes[size],
                    marginLeft: icon ? 8 : 0,
                    color: accent,
                  }, 
                  textStyle
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {},
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    overflow: 'hidden',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  outlineButton: {
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  outlineText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default PrimaryButton;
