import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors } = useThemeStore();
  const rotation = useSharedValue(0);

  const handlePress = () => {
    rotation.value = withSpring(rotation.value + 180);
    toggleTheme();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: colors.glassBackground,
        },
      ]}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={22}
          color={colors.primary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemeToggle;
