import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AnimatedBackground, GlassCard, LoadingIndicator } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';
import { withAlpha } from '../../theme/colorUtils';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface ModuleCard {
  id: string;
  title: string;
  icon: string;
  route: string;
  permission?: string;
  module: string;
}

export default function RoleBasedDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { roleDisplayName, accessibleModules, loading } = useRBAC();

  // All possible modules with their configurations
  const allModules: ModuleCard[] = [
    {
      id: 'reception',
      title: 'Reception',
      icon: 'id-card',
      route: '/(admin)/reception',
      module: 'reception',
    },
    {
      id: 'users',
      title: 'User Management',
      icon: 'users',
      route: '/(admin)/users',
      permission: PERMISSIONS.VIEW_ALL_USERS,
      module: 'users',
    },
    {
      id: 'academic',
      title: 'Academic Structure',
      icon: 'graduation-cap',
      route: '/(admin)/academic',
      permission: PERMISSIONS.MANAGE_ACADEMIC_STRUCTURE,
      module: 'academic',
    },
    {
      id: 'exams',
      title: 'Exams & Results',
      icon: 'file-alt',
      route: '/(admin)/exams',
      module: 'exams',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      icon: 'tasks',
      route: '/(admin)/assignments',
      module: 'assignments',
    },
    {
      id: 'fees',
      title: 'Fee Management',
      icon: 'money-bill-wave',
      route: '/(admin)/fees',
      module: 'fees',
    },
    {
      id: 'library',
      title: 'Library',
      icon: 'book',
      route: '/(admin)/library',
      module: 'library',
    },
    {
      id: 'bus',
      title: 'Transportation',
      icon: 'bus',
      route: '/(admin)/bus',
      module: 'bus',
    },
    {
      id: 'canteen',
      title: 'Canteen',
      icon: 'utensils',
      route: '/(admin)/canteen',
      module: 'canteen',
    },
    {
      id: 'notices',
      title: 'Notices',
      icon: 'bullhorn',
      route: '/(admin)/notices',
      module: 'notices',
    },
    {
      id: 'events',
      title: 'Events',
      icon: 'calendar-alt',
      route: '/(admin)/events',
      permission: PERMISSIONS.MANAGE_EVENTS,
      module: 'events',
    },
    {
      id: 'planner-diary',
      title: 'Planner & Diary',
      icon: 'clipboard-check',
      route: '/(admin)/planner-diary',
      module: 'planner-diary',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: 'clipboard-check',
      route: '/(admin)/attendance',
      module: 'attendance',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'chart-line',
      route: '/(admin)/analytics',
      module: 'analytics',
    },
  ];

  // Filter modules based on user's access
  const userModules = allModules.filter(module => 
    accessibleModules.includes(module.module)
  );

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 20, paddingHorizontal: 20 }]}>
          <View style={styles.center}>
            <LoadingIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading…</Text>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 110, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(80).duration(450).springify()} style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Modules</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Your workspace</Text>
            <View style={[styles.roleTag, { backgroundColor: withAlpha(colors.primary, isDark ? 0.15 : 0.1) }]}>
              <FontAwesome5 name="shield-alt" size={10} color={colors.primary} />
              <Text style={[styles.roleText, { color: colors.primary }]}>{roleDisplayName}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Role Badge */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.roleBadgeContainer}>
          <GlassCard intensity={35}>
            <View style={styles.roleBadgeContent}>
              <View style={[styles.roleIconContainer, { 
                backgroundColor: colors.inputBackground,
                borderColor: colors.primary,
                borderWidth: colors.borderWidth,
              }]}>
                <FontAwesome5 name="shield-alt" size={20} color={colors.primary} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>Current Role</Text>
                <Text style={[styles.roleName, { color: colors.primary }]}>{roleDisplayName}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Modules Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Modules</Text>
        <View style={styles.modulesGrid}>
          {userModules.map((module, index) => (
            <Animated.View 
              key={module.id}
              entering={FadeInDown.delay(150 + index * 50).springify()}
              style={{ width: cardWidth }}
            >
              <TouchableOpacity
                onPress={() => router.push(module.route as any)}
                activeOpacity={0.7}
              >
                <GlassCard intensity={35} noPadding>
                  <View style={styles.moduleButton}>
                    <View style={[styles.moduleIconContainer, { backgroundColor: withAlpha(colors.primary, 0.125) }]}>
                      <FontAwesome5 name={module.icon} size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.moduleTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                      {module.title}
                    </Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* No Access Message */}
        {userModules.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassCard intensity={35} style={[styles.noAccessCard, { borderColor: colors.warning, borderWidth: colors.borderWidth }]}>
              <FontAwesome5 name="exclamation-triangle" size={48} color={colors.warning} />
              <Text style={[styles.noAccessText, { color: colors.textPrimary }]}>
                No modules available for your role
              </Text>
              <Text style={[styles.noAccessSubtext, { color: colors.textSecondary }]}>
                Contact your administrator for access
              </Text>
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, marginTop: 10, fontWeight: '600' },
  header: { marginBottom: 18 },
  greeting: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '800', marginTop: 6, letterSpacing: -0.3 },
  roleTag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, alignSelf: 'flex-start' },
  roleText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  roleBadgeContainer: {
    marginBottom: 28,
  },
  roleBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleInfo: { marginLeft: 16, flex: 1 },
  roleLabel: { fontSize: 12, marginBottom: 4, fontWeight: '500' },
  roleName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionTitle: { fontSize: 19, fontWeight: '800', marginBottom: 16, letterSpacing: -0.2 },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  moduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    minHeight: 76,
  },
  moduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moduleTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  noAccessCard: {
    padding: 32,
    alignItems: 'center',
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  noAccessSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
