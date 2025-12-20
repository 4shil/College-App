import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AnimatedBackground, GlassCard } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface ModuleCard {
  id: string;
  title: string;
  icon: string;
  color: string;
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
      id: 'users',
      title: 'User Management',
      icon: 'users',
      color: '#8B5CF6',
      route: '/(admin)/users',
      permission: PERMISSIONS.VIEW_ALL_USERS,
      module: 'users',
    },
    {
      id: 'academic',
      title: 'Academic Structure',
      icon: 'graduation-cap',
      color: '#06B6D4',
      route: '/(admin)/academic',
      permission: PERMISSIONS.MANAGE_ACADEMIC_STRUCTURE,
      module: 'academic',
    },
    {
      id: 'exams',
      title: 'Exams & Results',
      icon: 'file-alt',
      color: '#F59E0B',
      route: '/(admin)/exams',
      module: 'exams',
    },
    {
      id: 'assignments',
      title: 'Assignments',
      icon: 'tasks',
      color: '#10B981',
      route: '/(admin)/assignments',
      module: 'assignments',
    },
    {
      id: 'fees',
      title: 'Fee Management',
      icon: 'money-bill-wave',
      color: '#16A34A',
      route: '/(admin)/fees',
      module: 'fees',
    },
    {
      id: 'library',
      title: 'Library',
      icon: 'book',
      color: '#6366F1',
      route: '/(admin)/library',
      module: 'library',
    },
    {
      id: 'bus',
      title: 'Transportation',
      icon: 'bus',
      color: '#EF4444',
      route: '/(admin)/bus',
      module: 'bus',
    },
    {
      id: 'canteen',
      title: 'Canteen',
      icon: 'utensils',
      color: '#EC4899',
      route: '/(admin)/canteen',
      module: 'canteen',
    },
    {
      id: 'notices',
      title: 'Notices',
      icon: 'bullhorn',
      color: '#14B8A6',
      route: '/(admin)/notices',
      module: 'notices',
    },
    {
      id: 'attendance',
      title: 'Attendance',
      icon: 'clipboard-check',
      color: '#8B5CF6',
      route: '/(admin)/attendance',
      module: 'attendance',
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'chart-line',
      color: '#0EA5E9',
      route: '/(admin)/analytics',
      module: 'analytics',
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      icon: 'clipboard-list',
      color: '#64748B',
      route: '/(admin)/audit/logs',
      module: 'audit',
    },
  ];

  // Filter modules based on user's access
  const userModules = allModules.filter(module => 
    accessibleModules.includes(module.module)
  );

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
          <View style={styles.center}>
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading...</Text>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{roleDisplayName}</Text>
          </View>
        </View>

        {/* Role Badge - Redesigned without Card background */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.roleBadgeContainer}>
          <View style={[styles.roleBadge, { 
            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : 'rgba(124, 58, 237, 0.08)',
            borderColor: isDark ? 'rgba(139, 92, 246, 0.25)' : 'rgba(124, 58, 237, 0.2)',
          }]}>
            <View style={[styles.roleIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <FontAwesome5 name="shield-alt" size={20} color={colors.primary} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>Current Role</Text>
              <Text style={[styles.roleName, { color: colors.primary }]}>{roleDisplayName}</Text>
            </View>
          </View>
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
                <View style={[styles.moduleCard, { 
                  backgroundColor: isDark ? `${module.color}15` : `${module.color}10`,
                  borderColor: isDark ? `${module.color}30` : `${module.color}25`,
                }]}>
                  <View style={[styles.iconContainer, { backgroundColor: module.color }]}>
                    <FontAwesome5 name={module.icon} size={24} color="#fff" />
                  </View>
                  <Text style={[styles.moduleTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {module.title}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* No Access Message */}
        {userModules.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassCard style={[styles.noAccessCard, { borderColor: colors.warning }]}>
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
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 16, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: 'bold' },
  roleBadgeContainer: {
    marginBottom: 28,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
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
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  moduleCard: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    height: 150,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  noAccessCard: {
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
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
