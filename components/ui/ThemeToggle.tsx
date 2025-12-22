import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { GlassSurface } from './GlassSurface';

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

  const backgroundColor = withAlpha(colors.glassBackground, isDark ? 0.72 : 0.86);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.container,
      ]}
      activeOpacity={0.7}
    >
      <GlassSurface
        variant="pill"
        borderRadius={22}
        borderWidth={0}
        borderColor={'transparent'}
        backgroundColor={backgroundColor}
        style={styles.surface}
      >
        <Animated.View style={animatedStyle}>
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={22}
            color={colors.primary}
          />
        </Animated.View>
      </GlassSurface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  surface: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemeToggle;
