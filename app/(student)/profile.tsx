import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { withAlpha } from '../../theme/colorUtils';
import { signOut } from '../../lib/supabase';
import { getStudentWithDetails } from '../../lib/database';

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user, profile, logout } = useAuthStore();

  const [studentDetails, setStudentDetails] = useState<any>(null);

  useEffect(() => {
    if (user) {
      getStudentWithDetails(user.id).then((details) => {
        setStudentDetails(details);
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Card>
            <View style={styles.profileSection}>
              {profile?.photo_url ? (
                <Image
                  source={{ uri: profile.photo_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, { backgroundColor: colors.primary }]}>
                  <Ionicons name="person" size={56} color={colors.background} />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {profile?.full_name || 'Student'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {user?.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(student)/settings' as any)}
                style={[styles.editButton, { borderColor: colors.primary }]}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Academic Details */}
        {studentDetails && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              Academic Details
            </Text>
            <Card>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Roll Number</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {studentDetails.roll_number || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.detailDivider, { backgroundColor: colors.cardBorder }]} />
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Department</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                    {studentDetails.department?.name || 'N/A'}
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Contact Information */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
            Contact Information
          </Text>
          <Card>
            <View style={styles.contactItem}>
              <View style={[styles.contactIcon, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                <Ionicons name="mail" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.contactValue, { color: colors.textPrimary }]}>{user?.email || 'N/A'}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
            Settings
          </Text>
          <Card>
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}
              onPress={() => router.push('/(student)/settings' as any)}
            >
              <Ionicons name="settings" size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>App Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}
              onPress={() => router.push('/(student)/support' as any)}
            >
              <Ionicons name="help-circle" size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>Support & Help</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={20} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </Card>
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailDivider: {
    width: 1,
    height: 40,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
