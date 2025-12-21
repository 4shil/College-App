import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
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
  glowing = true,
  icon,
}) => {
  const { colors, animationsEnabled, isDark } = useThemeStore();
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

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

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
      return [colors.primaryLight, colors.primary, colors.primaryDark];
    }
    if (variant === 'secondary') {
      // No dedicated secondaryDark token in legacy surface; keep a stable 3-stop gradient.
      return [colors.secondaryLight, colors.secondary, colors.secondary];
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
              borderColor: variant === 'outline' 
                ? colors.primary
                : 'transparent',
              backgroundColor: variant === 'ghost' 
                ? colors.cardBackground
                : 'transparent',
              opacity: disabled ? 0.5 : 1,
            },
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} size="small" />
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
    <Animated.View
      style={[
        styles.wrapper,
        {
          shadowColor: colors.primary,
        },
        glowStyle,
        animatedStyle,
      ]}
    >
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
            { height: heights[size], borderRadius: colors.borderRadius, opacity: disabled ? 0.5 : 1 },
            style,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Top inner highlight for depth */}
          <LinearGradient
            colors={[withAlpha(colors.glassBackgroundStrong, 0.28), withAlpha(colors.glassBackgroundStrong, 0.08), 'transparent']}
            style={styles.innerHighlight}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          
          {/* Bottom edge shadow */}
          <View style={[styles.bottomShadow, { backgroundColor: withAlpha(colors.shadowColor, 0.15) }]} />
          
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.text, 
                  { 
                    fontSize: fontSizes[size],
                    marginLeft: icon ? 8 : 0,
                    color: colors.textInverse,
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
  wrapper: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        shadowOpacity: 0.35,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    // NOTE: backgroundColor is applied at runtime to use theme colors.
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  outlineButton: {
    borderWidth: 1.5,
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
