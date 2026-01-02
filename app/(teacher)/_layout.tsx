import React, { useEffect, useState } from 'react';
import { Stack, usePathname, useRouter } from 'expo-router';
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { Restricted } from '../../components/Restricted';
import { useAuthStore } from '../../store/authStore';
import type { TeacherNavItem } from '../../lib/teacherModules';
import { getUnlockedTeacherNavItems } from '../../lib/teacherModules';

// Keep the same navbar structure as admin, but teacher has only Home for now.
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

const GlassDock: React.FC<{ activeRoute: string; onNavigate: (route: string) => void; navItems: TeacherNavItem[] }> = ({
  activeRoute,
  onNavigate,
  navItems,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { colors, isDark, animationsEnabled } = useThemeStore();

  const activeIconColor = colors.textPrimary;
  const inactiveIconColor = withAlpha(colors.textPrimary, 0.4);

  const activeIndex = navItems.findIndex((i) => {
    if (i.id === 'dashboard') {
      return activeRoute === '/(teacher)/dashboard' || activeRoute.endsWith('/dashboard');
    }
    if ((i as any).nestedRoutes) {
      return (i as any).nestedRoutes.some((route: string) => activeRoute.includes(route));
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
          intensity={animationsEnabled ? colors.blurIntensity : 0}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.dockBorder, { borderColor: colors.glassBorder, borderRadius: colors.borderRadius * 2 }]} />

        <View style={{ flex: 1, overflow: 'hidden', borderRadius: colors.borderRadius * 1.5 }}>
          <Animated.View style={[styles.dockItemsRow, animatedItemsStyle]}>
            {navItems.map((item) => {
              const isCurrentRoute =
                item.id === 'dashboard'
                  ? (activeRoute === '/(teacher)/dashboard' || activeRoute.endsWith('/dashboard'))
                  : ((item as any).nestedRoutes
                      ? (item as any).nestedRoutes.some((route: string) => activeRoute.includes(route))
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
                      if (!isCurrentRoute) onNavigate(item.route);
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

export default function TeacherLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { roles } = useAuthStore();

  const unlockedNavItems = getUnlockedTeacherNavItems(roles);

  const handleNavigate = (route: string) => {
    router.replace(route as any);
  };

  return (
    <Restricted
      roles={['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod']}
      showDeniedMessage
      deniedMessage="Teacher access required."
    >
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="timetable/index" />
          <Stack.Screen name="attendance/index" />
          <Stack.Screen name="attendance/mark" />
          <Stack.Screen name="attendance/history" />
          <Stack.Screen name="results/index" />
          <Stack.Screen name="results/mark" />
          <Stack.Screen name="materials/index" />
          <Stack.Screen name="materials/create" />
          <Stack.Screen name="assignments/index" />
          <Stack.Screen name="assignments/create" />
          <Stack.Screen name="assignments/submissions" />
          <Stack.Screen name="notices/index" />
          <Stack.Screen name="notices/create" />
          <Stack.Screen name="planner/index" />
          <Stack.Screen name="planner/create" />
          <Stack.Screen name="planner/edit/[id]" />
          <Stack.Screen name="diary/index" />
          <Stack.Screen name="diary/create" />
          <Stack.Screen name="diary/edit/[id]" />
        </Stack>
        <GlassDock activeRoute={pathname} onNavigate={handleNavigate} navItems={unlockedNavItems} />
      </View>
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
