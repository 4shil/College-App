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
            isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            isDark ? 'rgba(139, 92, 246, 0.6)' : 'rgba(59, 130, 246, 0.5)',
          ]
        );
    
    return {
      borderColor,
    };
  });

  return (
    <Animated.View style={[styles.wrapper, animatedContainerStyle, containerStyle]}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.05)',
          },
          animatedBorderStyle,
        ]}
      >
        <View style={styles.innerContent}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={
                isFocused
                  ? isDark ? '#8B5CF6' : '#3B82F6'
                  : isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
              }
              style={styles.icon}
            />
          )}
          <TextInput
            style={[
              styles.input,
              {
                color: isDark ? '#FFFFFF' : '#1F2937',
              },
            ]}
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
            secureTextEntry={isPassword && !showPassword}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            selectionColor={isDark ? '#8B5CF6' : '#3B82F6'}
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
                color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
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
  container: {
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    overflow: 'hidden',
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
