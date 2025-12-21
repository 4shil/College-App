import React, { useEffect } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import type { ThemeColors } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavPage = 'dashboard' | 'attendance' | 'materials' | 'results' | 'profile';

interface BottomNavProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

interface NavItem {
  id: NavPage;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: 'home-outline', iconActive: 'home' },
  { id: 'attendance', icon: 'calendar-outline', iconActive: 'calendar' },
  { id: 'materials', icon: 'folder-outline', iconActive: 'folder' },
  { id: 'results', icon: 'trophy-outline', iconActive: 'trophy' },
  { id: 'profile', icon: 'person-outline', iconActive: 'person' },
];

// Animated NavButton component
const NavButton: React.FC<{
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
  isDark: boolean;
  activeColor: string;
  inactiveColor: string;
  glowColors: readonly [string, string, ...string[]];
  activeBackgroundColor: string;
}> = ({ item, isActive, onPress, isDark, activeColor, inactiveColor, glowColors, activeBackgroundColor }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(isActive ? 1 : 0);
  const iconScale = useSharedValue(isActive ? 1.1 : 1);

  useEffect(() => {
    glowOpacity.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 120,
    });
    iconScale.value = withSpring(isActive ? 1.1 : 1, {
      damping: 12,
      stiffness: 150,
    });
  }, [isActive]);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: interpolate(glowOpacity.value, [0, 1], [0.8, 1]) }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.navButtonContainer}
    >
      <Animated.View style={[styles.navButton, animatedButtonStyle]}>
        {/* Active Glow Effect */}
        <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
          <LinearGradient
            colors={glowColors}
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Active Background */}
        {isActive && (
          <View
            style={[
              styles.activeBackground,
              {
                backgroundColor: activeBackgroundColor,
              },
            ]}
          />
        )}

        {/* Icon */}
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={isActive ? item.iconActive : item.icon}
            size={24}
            color={isActive ? activeColor : inactiveColor}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// NavBar content component - extracted for reuse
const NavBarContent: React.FC<{
  isDark: boolean;
  colors: ThemeColors;
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}> = ({ isDark, colors, currentPage, onNavigate }) => {
  const activeColor = colors.primary;
  const inactiveColor = withAlpha(colors.textMuted, isDark ? 0.85 : 0.8);
  const activeBackgroundColor = withAlpha(colors.glassBackgroundStrong, isDark ? 0.15 : 0.6);
  const glowColors: readonly [string, string, ...string[]] = isDark
    ? [withAlpha(colors.primary, 0.5), withAlpha(colors.secondary, 0.35), 'transparent']
    : [withAlpha(colors.primary, 0.35), withAlpha(colors.secondary, 0.25), 'transparent'];

  const overlayColors: readonly [string, string, ...string[]] = isDark
    ? [withAlpha(colors.secondary, 0.06), 'transparent', withAlpha(colors.primary, 0.04)]
    : [withAlpha(colors.secondary, 0.04), 'transparent', withAlpha(colors.primary, 0.03)];

  return (
  <View
    style={[
      styles.navBar,
      {
        backgroundColor: Platform.OS === 'android' ? 'transparent' : colors.glassBackground,
        borderColor: colors.glassBorder,
      },
    ]}
  >
    {/* Top Edge Highlight */}
    <LinearGradient
      colors={
        isDark
          ? [withAlpha(colors.glassBackgroundStrong, 0.15), withAlpha(colors.glassBackgroundStrong, 0.03), 'transparent']
          : [withAlpha(colors.glassBackgroundStrong, 0.98), withAlpha(colors.glassBackgroundStrong, 0.6), 'transparent']
      }
      style={styles.topHighlight}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />

    {/* Subtle Gradient Overlay */}
    <LinearGradient
      colors={overlayColors}
      style={styles.gradientOverlay}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />

    {/* Navigation Items */}
    <View style={styles.navItems}>
      {navItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={currentPage === item.id}
          onPress={() => onNavigate(item.id)}
          isDark={isDark}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          glowColors={glowColors}
          activeBackgroundColor={activeBackgroundColor}
        />
      ))}
    </View>
  </View>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onNavigate,
}) => {
  const { isDark, colors, capabilities } = useThemeStore();
  const canUseBlur = capabilities.supportsBlur;
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(100);

  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 18,
      stiffness: 90,
      mass: 0.8,
    });
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 16) },
        animatedContainerStyle,
      ]}
    >
      {/* Outer Shadow/Glow */}
      <View
        style={[
          styles.outerShadow,
          {
            shadowColor: colors.primary,
            backgroundColor: 'transparent',
          },
        ]}
      />

      {/* Main Nav Bar */}
      <View
        style={[
          styles.navBarWrapper,
          Platform.OS === 'ios'
            ? {
                shadowColor: colors.shadowColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }
            : null,
        ]}
      >
        {Platform.OS === 'ios' && canUseBlur ? (
          <BlurView
            intensity={60}
            style={styles.blurView}
            tint={isDark ? 'dark' : 'light'}
          >
            <NavBarContent isDark={isDark} colors={colors} currentPage={currentPage} onNavigate={onNavigate} />
          </BlurView>
        ) : (
          <View
            style={[
              styles.blurView,
              {
                backgroundColor: canUseBlur ? colors.glassBackgroundStrong : colors.cardBackground,
              },
            ]}
          >
            <NavBarContent isDark={isDark} colors={colors} currentPage={currentPage} onNavigate={onNavigate} />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  outerShadow: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    height: 60,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {},
    }),
  },
  navBarWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        // iOS shadow is applied at runtime to use theme.shadowColor.
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurView: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 28,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
  },
  navButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
    borderRadius: 24,
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});

export default BottomNav;
