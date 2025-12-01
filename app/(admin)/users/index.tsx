import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';

interface MenuOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconType: 'fa5' | 'ionicon';
  color: string;
  route: string;
  badge?: number;
}

export default function UsersIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const menuOptions: MenuOption[] = [
    {
      id: 'pending',
      title: 'Pending Approvals',
      subtitle: 'Review and approve student registrations',
      icon: 'user-clock',
      iconType: 'fa5',
      color: '#f59e0b',
      route: '/(admin)/users/pending',
      badge: 3,
    },
    {
      id: 'teachers',
      title: 'Teachers',
      subtitle: 'Manage teacher accounts and assignments',
      icon: 'chalkboard-teacher',
      iconType: 'fa5',
      color: '#3b82f6',
      route: '/(admin)/users/teachers',
    },
    {
      id: 'students',
      title: 'Students',
      subtitle: 'View and manage student profiles',
      icon: 'user-graduate',
      iconType: 'fa5',
      color: '#10b981',
      route: '/(admin)/users/students',
    },
    {
      id: 'staff',
      title: 'Staff Members',
      subtitle: 'Non-teaching staff management',
      icon: 'users-cog',
      iconType: 'fa5',
      color: '#8b5cf6',
      route: '/(admin)/users/staff',
    },
  ];

  const renderMenuCard = (option: MenuOption, index: number) => (
    <Animated.View
      key={option.id}
      entering={FadeInRight.delay(100 + index * 80).duration(350)}
      style={styles.menuCardWrapper}
    >
      <TouchableOpacity
        onPress={() => router.push(option.route as any)}
        activeOpacity={0.8}
      >
        <GlassCard style={styles.menuCard}>
          <View style={styles.menuCardContent}>
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              {option.iconType === 'fa5' ? (
                <FontAwesome5 name={option.icon} size={22} color={option.color} />
              ) : (
                <Ionicons name={option.icon as any} size={22} color={option.color} />
              )}
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                {option.title}
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
                {option.subtitle}
              </Text>
            </View>
            <View style={styles.menuArrow}>
              {option.badge !== undefined && option.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.badgeText}>{option.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              User Management
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage all users in the system
            </Text>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsContainer}
        >
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>45</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Teachers</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#10b981' }]}>380</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Students</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>3</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Menu Options */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {menuOptions.map((option, index) => renderMenuCard(option, index))}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statsCard: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    opacity: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  menuCardWrapper: {
    marginBottom: 12,
  },
  menuCard: {
    padding: 16,
  },
  menuCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  menuArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
