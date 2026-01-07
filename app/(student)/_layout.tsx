import React, { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

type DockNavItem = {
  id: string;
  title: string;
  icon: string;
  route: string;
  nestedRoutes?: string[];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

      <View
        style={{
          position: 'absolute',
          bottom: '100%',
          right: 0,
          marginBottom: 8,
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
        }}
      >
        {navItems.map((item, index) => (
          <TouchableOpacity
            key={`label-${item.id}`}
            onPress={() => {
              onNavigate(item.route);
              setExpanded(false);
            }}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 8,
              marginBottom: 4,
            }}
          >
            <View
              style={{
                backgroundColor: withAlpha(colors.background, 0.9),
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: colors.borderRadius,
              }}
            >
              <Animated.Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 12,
                  fontWeight: '600',
                }}
              >
                {item.title}
              </Animated.Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function StudentLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useThemeStore();

  const studentNavItems: DockNavItem[] = [
    { id: 'dashboard', title: 'Home', icon: 'home', route: '/(student)/dashboard' },
    { id: 'attendance', title: 'Attendance', icon: 'checkmark-circle', route: '/(student)/attendance', nestedRoutes: ['attendance'] },
    { id: 'timetable', title: 'Schedule', icon: 'calendar', route: '/(student)/timetable', nestedRoutes: ['timetable'] },
    { id: 'materials', title: 'Materials', icon: 'book', route: '/(student)/materials', nestedRoutes: ['materials'] },
    { id: 'marks', title: 'Marks', icon: 'stats-chart', route: '/(student)/marks', nestedRoutes: ['marks', 'exams'] },
    { id: 'assignments', title: 'Tasks', icon: 'clipboard', route: '/(student)/assignments', nestedRoutes: ['assignments'] },
    { id: 'library', title: 'Library', icon: 'library', route: '/(student)/library', nestedRoutes: ['library'] },
    { id: 'notices', title: 'Updates', icon: 'notifications', route: '/(student)/notices', nestedRoutes: ['notices'] },
    { id: 'profile', title: 'Profile', icon: 'person', route: '/(student)/profile' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="attendance" options={{ presentation: 'modal' }} />
        <Stack.Screen name="timetable" options={{ presentation: 'modal' }} />
        <Stack.Screen name="materials" options={{ presentation: 'modal' }} />
        <Stack.Screen name="marks" options={{ presentation: 'modal' }} />
        <Stack.Screen name="assignments" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="library" options={{ presentation: 'modal' }} />
        <Stack.Screen name="notices" options={{ presentation: 'modal' }} />
        <Stack.Screen name="canteen" options={{ presentation: 'modal' }} />
        <Stack.Screen name="bus" options={{ presentation: 'modal' }} />
        <Stack.Screen name="fees" options={{ presentation: 'modal' }} />
        <Stack.Screen name="events" options={{ presentation: 'modal' }} />
        <Stack.Screen name="feedback" options={{ presentation: 'modal' }} />
        <Stack.Screen name="honors" options={{ presentation: 'modal' }} />
        <Stack.Screen name="support" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>

      <GlassDock
        activeRoute={pathname}
        onNavigate={(route) => router.push(route as any)}
        navItems={studentNavItems}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000,
  },
  dockContainer: {
    paddingVertical: DOCK_PADDING,
    paddingHorizontal: DOCK_PADDING,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    borderWidth: 1,
  },
  dockBorder: {
    borderWidth: 1,
    position: 'absolute',
  },
  dockItemsRow: {
    flexDirection: 'row',
    gap: GAP,
    alignItems: 'center',
  },
  dockItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dockItemInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
