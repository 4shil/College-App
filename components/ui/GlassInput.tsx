import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

interface GlassInputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  error?: boolean;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  icon,
  isPassword = false,
  containerStyle,
  error = false,
  ...props
}) => {
  const { colors, isDark, canAnimateBackground, capabilities } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isMultiline = !!props.multiline;
  const editable = props.editable !== false;

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
          [colors.inputBorder, colors.inputFocusBorder]
        );
    
    return {
      borderColor,
      borderWidth: colors.borderWidth > 0 ? colors.borderWidth : 1,
    };
  });

  const isGlassTheme = !!capabilities?.supportsGlassSurfaces;
  const blurAmount = Math.max(0, Math.min(100, colors.blurIntensity));
  const shouldBlur =
    Platform.OS !== 'web' &&
    !!capabilities?.supportsBlur &&
    blurAmount > 0;

  const baseBackground = isGlassTheme ? colors.glassBackground : colors.inputBackground;

  // Only tint non-glass themes when an animated background is enabled; do not override
  // alpha for already-translucent glass themes.
  const resolvedBackground =
    canAnimateBackground && !isGlassTheme
      ? withAlpha(baseBackground, isDark ? 0.72 : 0.86)
      : baseBackground;

  const disabledOpacity = editable ? 1 : 0.6;

  return (
    <Animated.View style={[styles.wrapper, animatedContainerStyle, containerStyle]}>
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: shouldBlur ? 'transparent' : resolvedBackground,
            borderRadius: colors.borderRadius,
            opacity: disabledOpacity,
          },
          animatedBorderStyle,
        ]}
      >
        {shouldBlur && (
          <>
            <BlurView
              pointerEvents="none"
              intensity={blurAmount}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: resolvedBackground }]}
            />
          </>
        )}

        <View style={[styles.innerContent, isMultiline && styles.innerContentMultiline]}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={colors.textSecondary}
              style={styles.icon}
            />
          )}
          <TextInput
            style={[
              styles.input,
              isMultiline && styles.inputMultiline,
              {
                color: colors.textPrimary,
              },
            ]}
            placeholderTextColor={colors.placeholder}
            secureTextEntry={isPassword && !showPassword}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoCapitalize="none"
            selectionColor={colors.primary}
            editable={editable}
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
                color={colors.textSecondary}
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
    minHeight: 52,
    overflow: 'hidden',
    position: 'relative',
  },
  innerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  innerContentMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    letterSpacing: 0.2,
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  eyeButton: {
    padding: 6,
  },
});

export default GlassInput;
