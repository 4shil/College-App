import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

interface GlassInputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
  error?: boolean;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const GlassInput: React.FC<GlassInputProps> = ({
  icon,
  isPassword = false,
  containerStyle,
  error = false,
  ...props
}) => {
  const { isDark, colors } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withSpring(isFocused ? 1 : 0, {
      damping: 20,
      stiffness: 300,
    });
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(focusProgress.value, [0, 1], [1, 1.01]);
    return {
      transform: [{ scale }],
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? colors.error
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [
            isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(148, 163, 184, 0.3)',
            isDark ? 'rgba(139, 92, 246, 0.6)' : 'rgba(124, 58, 237, 0.5)',
          ]
        );
    const shadowOpacity = interpolate(focusProgress.value, [0, 1], [0, 0.25]);
    
    return {
      borderColor,
      shadowOpacity,
    };
  });

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focusProgress.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(focusProgress.value, [0, 1], [0.98, 1]) }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedContainerStyle, containerStyle]}>
      {/* Outer glow effect when focused */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            shadowColor: error ? colors.error : '#8B5CF6',
          },
          animatedGlowStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: Platform.OS === 'android'
              ? isDark
                ? 'rgba(30, 30, 50, 0.9)'
                : 'rgba(255, 255, 255, 0.85)'
              : isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.7)',
            shadowColor: '#8B5CF6',
          },
          animatedBorderStyle,
        ]}
      >
        {/* Inner blur effect - iOS only */}
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={isDark ? 20 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}
        
        <View style={styles.innerContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={
                isFocused
                  ? isDark ? '#8B5CF6' : '#7C3AED'
                  : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(100,116,139,0.6)'
              }
              style={styles.icon}
            />
          )}
          <TextInput
            style={[
              styles.input,
              {
                color: colors.textPrimary,
              },
            ]}
            placeholderTextColor={isDark ? '#6B6B80' : '#94A3B8'}
            secureTextEntry={isPassword && !showPassword}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            selectionColor={isDark ? '#8B5CF6' : '#7C3AED'}
            {...props}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={isDark ? 'rgba(255,255,255,0.45)' : 'rgba(100,116,139,0.6)'}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  outerGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 12,
        shadowOpacity: 0.3,
      },
      android: {},
    }),
  },
  container: {
    borderRadius: 16,
    borderWidth: 1.5,
    height: 54,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  innerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    letterSpacing: 0.2,
  },
  eyeButton: {
    padding: 6,
  },
});

export default GlassInput;
