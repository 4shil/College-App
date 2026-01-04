import React, { useEffect } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

export type SolidButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function SolidButton({ onPress, disabled = false, style, children }: SolidButtonProps) {
  const { colors } = useThemeStore();

  const scale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

  useEffect(() => {
    // Reset when becoming disabled
    if (disabled) {
      scale.value = 1;
      pressOpacity.value = 0.6;
    } else {
      pressOpacity.value = 1;
    }
  }, [disabled, pressOpacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: pressOpacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          {
            borderRadius: colors.borderRadius,
          },
          style,
          pressed && !disabled ? styles.pressed : null,
        ]}
        android_ripple={{ color: 'transparent' }}
        onPressIn={() => {
          if (disabled) return;
          scale.value = withSpring(0.98, { damping: 14, stiffness: 300 });
          pressOpacity.value = withTiming(0.92, { duration: 80 });
        }}
        onPressOut={() => {
          if (disabled) return;
          scale.value = withSpring(1, { damping: 14, stiffness: 300 });
          pressOpacity.value = withTiming(1, { duration: 140 });
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    // Keep layout stable; visual feedback handled by Animated opacity.
  },
});

export default SolidButton;
