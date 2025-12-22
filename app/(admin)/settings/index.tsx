import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, IconBadge } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { signOut } from '../../../lib/supabase';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconType: 'fa5' | 'ion' | 'mci';
  color: string;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  route?: string;
  action?: () => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { user, profile, primaryRole, logout } = useAuthStore();

  const [notifications, setNotifications] = useState(true);
  const [autoApproval, setAutoApproval] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const sections: SettingSection[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'password',
          title: 'Change Password',
          subtitle: 'Update your login credentials',
          icon: 'lock',
          iconType: 'fa5',
          color: colors.success,
          type: 'navigation',
          route: '/(admin)/change-password',
        },
      ],
    },
    {
      title: 'College Settings',
      items: [
        {
          id: 'college-info',
          title: 'College Information',
          subtitle: 'Name, address, contact details',
          icon: 'building',
          iconType: 'fa5',
          color: colors.primary,
          type: 'navigation',
          route: '/(admin)/college-info',
        },
        {
          id: 'academic-year',
          title: 'Academic Year',
          subtitle: 'Current: 2024-2025',
          icon: 'calendar-alt',
          iconType: 'fa5',
          color: colors.warning,
          type: 'navigation',
          route: '/(admin)/settings/academic-year',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'appearance',
          title: 'Appearance & Theme',
          subtitle: 'Customize app colors and style',
          icon: 'color-palette',
          iconType: 'ion',
          color: colors.primary,
          type: 'navigation',
          route: '/(admin)/settings/appearance',
        },
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          subtitle: 'Switch between light and dark themes',
          icon: 'moon',
          iconType: 'ion',
          color: colors.info,
          type: 'toggle',
          value: isDark,
          action: toggleTheme,
        },
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive alerts and updates',
          icon: 'notifications',
          iconType: 'ion',
          color: colors.error,
          type: 'toggle',
          value: notifications,
          action: () => setNotifications(!notifications),
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          id: 'auto-approval',
          title: 'Auto Approve Students',
          subtitle: 'Automatically approve new registrations',
          icon: 'check-circle',
          iconType: 'fa5',
          color: colors.success,
          type: 'toggle',
          value: autoApproval,
          action: () => setAutoApproval(!autoApproval),
        },
        {
          id: 'audit-logs',
          title: 'Audit Logs',
          subtitle: 'View system activity logs',
          icon: 'clipboard-list',
          iconType: 'fa5',
          color: colors.textMuted,
          type: 'navigation',
          route: '/(admin)/audit/logs',
        },
        {
          id: 'backup',
          title: 'Backup & Restore',
          subtitle: 'Manage data backups',
          icon: 'database',
          iconType: 'fa5',
          color: colors.info,
          type: 'navigation',
          route: '/(admin)/backup',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          subtitle: 'FAQs and contact support',
          icon: 'help-circle',
          iconType: 'ion',
          color: colors.info,
          type: 'navigation',
          route: '/(admin)/help',
        },
        {
          id: 'about',
          title: 'About App',
          subtitle: 'Version 1.0.0',
          icon: 'information-circle',
          iconType: 'ion',
          color: colors.textMuted,
          type: 'navigation',
          route: '/(admin)/about',
        },
      ],
    },
  ];

  const getItemTone = (item: SettingItem) => {
    switch (item.id) {
      case 'audit-logs':
      case 'about':
        return 'neutral' as const;
      default:
        return 'primary' as const;
    }
  };

  const renderSettingItem = (item: SettingItem, index: number) => {
    return (
      <Animated.View
        key={item.id}
        entering={FadeInRight.delay(100 + index * 30).duration(300)}
      >
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: colors.cardBackground,
              borderBottomColor: colors.cardBorder,
              borderBottomWidth: colors.borderWidth,
            },
          ]}
          onPress={() => {
            if (item.type === 'navigation' && item.route) {
              router.push(item.route as any);
            } else if (item.type === 'action' && item.action) {
              item.action();
            } else if (item.type === 'toggle' && item.action) {
              item.action();
            }
          }}
          activeOpacity={item.type === 'toggle' ? 1 : 0.7}
          disabled={item.type === 'toggle'}
        >
          <IconBadge family={item.iconType} name={item.icon} tone={getItemTone(item)} size={18} style={styles.itemIcon} />
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
            {item.subtitle && (
              <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
          {item.type === 'toggle' ? (
            <Switch
              value={item.value}
              onValueChange={item.action}
              trackColor={{ false: colors.inputBorder, true: colors.primary }}
              thumbColor={item.value ? colors.primary : colors.cardBackground}
            />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
        </Animated.View>

        {/* Admin Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Card style={styles.adminCard}>
            <View style={styles.adminInfo}>
              <IconBadge family="fa5" name="user-shield" tone="primary" size={24} style={styles.adminAvatar} />
              <View style={styles.adminDetails}>
                <Text style={[styles.adminName, { color: colors.textPrimary }]}>
                  {profile?.full_name || 'Admin'}
                </Text>
                <Text style={[styles.adminEmail, { color: colors.textSecondary }]}>
                  {user?.email || 'admin@college.edu'}
                </Text>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Text style={[styles.roleText, { color: colors.primary }]}>
                    {primaryRole?.replace('_', ' ').toUpperCase() || 'SUPER ADMIN'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Settings Sections */}
        {sections.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.delay(200 + sectionIndex * 50).duration(400)}
            style={styles.section}
          >
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              {section.items.map((item, index) => renderSettingItem(item, index))}
            </View>
          </Animated.View>
        ))}

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.logoutSection}>
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App Version */}
        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.version}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            JPM College App v1.0.0
          </Text>
          <Text style={[styles.versionSubtext, { color: colors.textMuted }]}>
            Made with ❤️ for JPM College
          </Text>
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  adminCard: {
    marginBottom: 24,
    padding: 16,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '700',
  },
  adminEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
  },
  versionSubtext: {
    fontSize: 11,
    marginTop: 4,
  },
});
