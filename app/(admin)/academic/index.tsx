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

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';

interface MenuOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  route: string;
  count?: number;
}

export default function AcademicIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const menuOptions: MenuOption[] = [
    {
      id: 'departments',
      title: 'Departments',
      subtitle: 'Manage academic departments',
      icon: 'building',
      color: '#6366f1',
      route: '/(admin)/academic/departments',
    },
    {
      id: 'courses',
      title: 'Courses',
      subtitle: 'Subjects taught in each department',
      icon: 'book-open',
      color: '#10b981',
      route: '/(admin)/academic/courses',
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
        <Card style={styles.menuCard}>
          <View style={styles.menuCardContent}>
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <FontAwesome5 name={option.icon} size={22} color={option.color} />
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
              {option.count !== undefined && (
                <View style={[styles.countBadge, { backgroundColor: option.color + '20' }]}>
                  <Text style={[styles.countText, { color: option.color }]}>{option.count}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </View>
        </Card>
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
              Academic Management
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage academic structure
            </Text>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsContainer}
        >
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <FontAwesome5 name="building" size={16} color="#6366f1" />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>-</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Departments</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.glassBorder }]} />
              <View style={styles.statItem}>
                <FontAwesome5 name="book-open" size={16} color="#10b981" />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>-</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Courses</Text>
              </View>
            </View>
          </Card>
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
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
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
  countBadge: {
    minWidth: 28,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
