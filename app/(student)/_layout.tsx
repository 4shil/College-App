import React, { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { Restricted } from '../../components/Restricted';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

type DockNavItem = {
  id: string;
  title: string;
  icon: string;
  route: string;
  nestedRoutes?: string[];
};

const ITEM_SIZE = 60;
const GAP = 10;
const DOCK_PADDING = 10;

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

const GlassDock: React.FC<{ activeRoute: string; onNavigate: (route: string) => void; navItems: DockNavItem[] }> = ({
  activeRoute,
  onNavigate,
  navItems,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { colors, isDark, animationsEnabled } = useThemeStore();

  const dockBlurIntensity = animationsEnabled ? Math.min(65, Math.round(colors.blurIntensity * 0.75)) : 0;
  const dockScrimColor = withAlpha(colors.background, isDark ? 0.12 : 0.1);
  const dockBorderColor = withAlpha(colors.textPrimary, isDark ? 0.16 : 0.12);

  const activeIconColor = colors.textPrimary;
  const inactiveIconColor = withAlpha(colors.textPrimary, 0.4);

  const activeIndex = navItems.findIndex((i) => {
    if (i.id === 'dashboard') {
      return activeRoute === '/(student)/dashboard' || activeRoute.endsWith('/dashboard');
    }
    if ((i as any).nestedRoutes) {
      return activeRoute.includes(i.id) || (i as any).nestedRoutes.some((route: string) => activeRoute.includes(route));
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
      const offset = -(Math.max(activeIndex, 0) * (ITEM_SIZE + GAP));
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
      <Animated.View
        style={[styles.dockContainer, { borderRadius: colors.borderRadius * 2 }, animatedContainerStyle]}
      >
        <BlurView
          intensity={dockBlurIntensity}
          tint="default"
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dockScrimColor }]} />
        <View
          pointerEvents="none"
          style={[styles.dockBorder, { borderColor: dockBorderColor, borderRadius: colors.borderRadius * 2 }]}
        />

        <View style={{ flex: 1, overflow: 'hidden', borderRadius: colors.borderRadius * 1.5 }}>
          <Animated.View style={[styles.dockItemsRow, animatedItemsStyle]}>
            {navItems.map((item) => {
              const isCurrentRoute =
                item.id === 'dashboard'
                  ? (activeRoute === '/(student)/dashboard' || activeRoute.endsWith('/dashboard'))
                  : ((item as any).nestedRoutes
                      ? (activeRoute.includes(item.id) || (item as any).nestedRoutes.some((route: string) => activeRoute.includes(route)))
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
                      onNavigate(item.route);
                      setExpanded(false);
                    }
                  }}
                  activeColor={activeIconColor}
                  inactiveColor={inactiveIconColor}
                  dotColor={colors.primary}
                />
              );
            })}
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

export default function StudentLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useThemeStore();

  const studentNavItems: DockNavItem[] = [
    { id: 'dashboard', title: 'Home', icon: 'home', route: '/(student)/dashboard' },
    { id: 'timetable', title: 'Timetable', icon: 'calendar', route: '/(student)/timetable', nestedRoutes: ['timetable'] },
    { id: 'materials', title: 'Materials', icon: 'book', route: '/(student)/materials', nestedRoutes: ['materials'] },
    { id: 'modules', title: 'Modules', icon: 'grid', route: '/(student)/modules', nestedRoutes: ['modules'] },
    { id: 'profile', title: 'Profile', icon: 'person', route: '/(student)/profile', nestedRoutes: ['profile', 'settings'] },
  ];

  return (
    <Restricted roles={['student']}>
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="attendance" />
          <Stack.Screen name="timetable" />
          <Stack.Screen name="materials" />
          <Stack.Screen name="marks" />
          <Stack.Screen name="assignments" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="library" />
          <Stack.Screen name="notices" />
          <Stack.Screen name="modules" />
          <Stack.Screen name="canteen" />
          <Stack.Screen name="bus" />
          <Stack.Screen name="fees" />
          <Stack.Screen name="events" />
          <Stack.Screen name="feedback" />
          <Stack.Screen name="honors" />
          <Stack.Screen name="support" />
          <Stack.Screen name="settings" />
        </Stack>
        <GlassDock activeRoute={pathname} onNavigate={(route) => router.push(route as any)} navItems={studentNavItems} />
        </View>
      </ErrorBoundary>
    </Restricted>
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
