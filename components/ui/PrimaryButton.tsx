import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

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
  const { isDark, colors } = useThemeStore();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    if (glowing && variant === 'primary' && !disabled) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0.25, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      );
    }
  }, [glowing, variant, disabled]);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    pressProgress.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    pressProgress.value = withTiming(0, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const brightness = interpolate(pressProgress.value, [0, 1], [1, 0.9]);
    return {
      transform: [{ scale: scale.value }],
      opacity: brightness,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  const heights = {
    small: 40,
    medium: 48,
    large: 54,
  };

  const fontSizes = {
    small: 13,
    medium: 14,
    large: 15,
  };

  const getGradientColors = (): [string, string, string] => {
    if (variant === 'primary') {
      return isDark 
        ? ['#8B5CF6', '#7C3AED', '#6D28D9'] 
        : ['#7C3AED', '#6D28D9', '#5B21B6'];
    }
    if (variant === 'secondary') {
      return isDark 
        ? ['#6366F1', '#4F46E5', '#4338CA'] 
        : ['#4F46E5', '#4338CA', '#3730A3'];
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
              borderColor: variant === 'outline' 
                ? (isDark ? 'rgba(139, 92, 246, 0.5)' : colors.primary)
                : 'transparent',
              backgroundColor: variant === 'ghost' 
                ? (isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.08)')
                : 'transparent',
              opacity: disabled ? 0.5 : 1,
            },
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={isDark ? '#A78BFA' : colors.primary} size="small" />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.outlineText,
                  { 
                    color: isDark ? '#A78BFA' : colors.primary, 
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
          shadowColor: isDark ? '#8B5CF6' : '#7C3AED',
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
            { height: heights[size], opacity: disabled ? 0.5 : 1 },
            style,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Inner highlight */}
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'transparent']}
            style={styles.innerHighlight}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              {icon}
              <Text
                style={[
                  styles.text, 
                  { 
                    fontSize: fontSizes[size],
                    marginLeft: icon ? 8 : 0,
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
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  outlineButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  ghostButton: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  outlineText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default PrimaryButton;
