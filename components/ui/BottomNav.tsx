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
}> = ({ item, isActive, onPress, isDark }) => {
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

  // Colors
  const activeColor = isDark ? '#60A5FA' : '#3B82F6';
  const inactiveColor = isDark ? 'rgba(156, 163, 175, 0.8)' : 'rgba(107, 114, 128, 0.8)';

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
            colors={
              isDark
                ? ['rgba(59, 130, 246, 0.5)', 'rgba(139, 92, 246, 0.4)', 'transparent']
                : ['rgba(59, 130, 246, 0.35)', 'rgba(139, 92, 246, 0.25)', 'transparent']
            }
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
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(255, 255, 255, 0.6)',
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
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}> = ({ isDark, currentPage, onNavigate }) => (
  <View
    style={[
      styles.navBar,
      {
        backgroundColor: Platform.OS === 'android'
          ? 'transparent'
          : isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(255, 255, 255, 0.75)',
        borderColor: isDark
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(255, 255, 255, 0.9)',
      },
    ]}
  >
    {/* Top Edge Highlight */}
    <LinearGradient
      colors={
        isDark
          ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.03)', 'transparent']
          : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.6)', 'transparent']
      }
      style={styles.topHighlight}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    />

    {/* Subtle Gradient Overlay */}
    <LinearGradient
      colors={
        isDark
          ? ['rgba(139, 92, 246, 0.05)', 'transparent', 'rgba(59, 130, 246, 0.03)']
          : ['rgba(139, 92, 246, 0.03)', 'transparent', 'rgba(59, 130, 246, 0.02)']
      }
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
        />
      ))}
    </View>
  </View>
);

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
            shadowColor: isDark ? '#8B5CF6' : '#7C3AED',
            backgroundColor: 'transparent',
          },
        ]}
      />

      {/* Main Nav Bar */}
      <View style={styles.navBarWrapper}>
        {Platform.OS === 'ios' && canUseBlur ? (
          <BlurView
            intensity={60}
            style={styles.blurView}
            tint={isDark ? 'dark' : 'light'}
          >
            <NavBarContent isDark={isDark} currentPage={currentPage} onNavigate={onNavigate} />
          </BlurView>
        ) : (
          <View
            style={[
              styles.blurView,
              {
                backgroundColor: canUseBlur
                  ? isDark
                    ? 'rgba(20, 20, 35, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)'
                  : colors.cardBackground,
              },
            ]}
          >
            <NavBarContent isDark={isDark} currentPage={currentPage} onNavigate={onNavigate} />
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
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
