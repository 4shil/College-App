import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { GlassSurface } from './GlassSurface';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors, canAnimateBackground } = useThemeStore();
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
      style={styles.container}
      activeOpacity={0.7}
    >
      <GlassSurface
        variant="pill"
        borderRadius={22}
        borderWidth={colors.borderWidth}
        borderColor={colors.glassBorder}
        backgroundColor={isDark ? colors.glassBackground : (canAnimateBackground ? colors.glassBackgroundStrong : colors.glassBackground)}
        blurIntensity={Math.max(0, Math.round(colors.blurIntensity * (isDark ? 0.7 : 1)))}
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
  },
  surface: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ThemeToggle;
