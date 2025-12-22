import React, { useState, useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRBAC } from '../../hooks/useRBAC';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

// Configuration
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_SIZE = 60;
const GAP = 10;
const DOCK_PADDING = 10;

// Dock Item Component
const DockItem: React.FC<{
  icon: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
  dotColor: string;
}> = ({ icon, isActive, onPress, activeColor, inactiveColor, dotColor }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.dockItem, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.dockItemInner}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isActive ? activeColor : inactiveColor}
        />
        {isActive && <View style={[styles.activeDot, { backgroundColor: dotColor }]} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Glass Dock Component
const GlassDock: React.FC<{ activeRoute: string; onNavigate: (route: string) => void }> = ({ 
  activeRoute, 
  onNavigate 
}) => {
  const [expanded, setExpanded] = useState(false);
  const { colors, isDark, animationsEnabled } = useThemeStore();

  const activeIconColor = colors.textPrimary;
  const inactiveIconColor = withAlpha(colors.textPrimary, 0.4);

  const navItems = [
    { id: 'dashboard', icon: 'home-outline', route: '/(admin)/dashboard' },
    { id: 'analytics', icon: 'stats-chart-outline', route: '/(admin)/analytics' },
    { id: 'users', icon: 'people-outline', route: '/(admin)/users' },
    { 
      id: 'role-dashboard', 
      icon: 'apps-outline', 
      route: '/(admin)/role-dashboard',
      // Nested module routes that should activate this icon
      nestedRoutes: [
        'academic', 'timetable', 'attendance', 'exams', 'assignments', 
        'library', 'fees', 'bus', 'canteen', 'notices', 'audit', 'reception'
      ]
    },
    { id: 'settings', icon: 'settings-outline', route: '/(admin)/settings' },
  ];

  const activeIndex = navItems.findIndex((i) => {
    if (i.id === 'dashboard') {
      return activeRoute === '/(admin)/dashboard' || activeRoute === '/dashboard' || activeRoute.endsWith('/dashboard');
    }
    if (i.id === 'role-dashboard') {
      // Check if we're on role-dashboard or any nested module route
      if (activeRoute.includes('role-dashboard')) return true;
      return i.nestedRoutes?.some(route => activeRoute.includes(route)) || false;
    }
    return activeRoute.includes(i.id);
  });
  const dockWidth = useSharedValue(ITEM_SIZE + DOCK_PADDING * 2);
  const translateX = useSharedValue(0);
  const EXPANDED_WIDTH =
    navItems.length * ITEM_SIZE + (navItems.length - 1) * GAP + DOCK_PADDING * 2;

  useEffect(() => {
    if (expanded) {
      dockWidth.value = withSpring(EXPANDED_WIDTH, { damping: 15 });
      translateX.value = withSpring(0, { damping: 15 });
    } else {
      dockWidth.value = withSpring(ITEM_SIZE + DOCK_PADDING * 2, { damping: 15 });
      const offset = -(activeIndex * (ITEM_SIZE + GAP));
      translateX.value = withSpring(offset, { damping: 15 });
    }
  }, [expanded, activeIndex]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    width: dockWidth.value,
  }));

  const animatedItemsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.dockWrapper}>
      <Animated.View style={[styles.dockContainer, { borderRadius: colors.borderRadius * 2 }, animatedContainerStyle]}>
        <BlurView
          intensity={animationsEnabled ? colors.blurIntensity : 0}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.dockBorder, { borderColor: colors.glassBorder, borderRadius: colors.borderRadius * 2 }]} />

        <View style={{ flex: 1, overflow: 'hidden', borderRadius: colors.borderRadius * 1.5 }}>
          <Animated.View style={[styles.dockItemsRow, animatedItemsStyle]}>
            {navItems.map((item) => {
              const isCurrentRoute = item.id === 'dashboard' 
                ? (activeRoute === '/(admin)/dashboard' || activeRoute === '/dashboard' || activeRoute.endsWith('/dashboard'))
                : (item.id === 'role-dashboard' 
                    ? (activeRoute.includes('role-dashboard') || (item as any).nestedRoutes?.some((route: string) => activeRoute.includes(route)))
                    : activeRoute.includes(item.id));
              
              return (
                <DockItem
                  key={item.id}
                  icon={item.icon}
                  isActive={isCurrentRoute}
                  onPress={() => {
                    if (!expanded) {
                      setExpanded(true);
                    } else {
                      // Always navigate to the route, even if on a nested module page
                      if (item.id === 'role-dashboard') {
                        // Always go back to main modules page
                        onNavigate(item.route);
                      } else if (!isCurrentRoute) {
                        onNavigate(item.route);
                      }
                      setExpanded(false);
                    }
                  }}
                  activeColor={activeIconColor}
                  inactiveColor={inactiveIconColor}
                  dotColor={colors.textPrimary}
                />
              );
            })}
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

export default function AdminLayout() {
  const { canAccessModule } = useRBAC();
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigate = (route: string) => {
    router.replace(route as any);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="users" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="role-dashboard" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notices" />
        <Stack.Screen name="academic" />
        <Stack.Screen name="timetable" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="exams" />
        <Stack.Screen name="assignments" />
        <Stack.Screen name="library" />
        <Stack.Screen name="fees" />
        <Stack.Screen name="bus" />
        <Stack.Screen name="canteen" />
        <Stack.Screen name="reception/index" />
        <Stack.Screen name="audit" />
        <Stack.Screen name="college-info" />
        <Stack.Screen name="change-password" />
      </Stack>

      {!pathname.includes('college-info') && (
        <GlassDock activeRoute={pathname} onNavigate={handleNavigate} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  dockContainer: {
    height: ITEM_SIZE + DOCK_PADDING * 2,
    overflow: 'hidden',
    padding: DOCK_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dockBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderTopWidth: 1.5,
  },
  dockItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP,
  },
  dockItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
  },
  dockItemInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

