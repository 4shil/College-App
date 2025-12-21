import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { changePassword, getSession } from '../../lib/supabase';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, animationsEnabled, capabilities } = useThemeStore();
  const canUseBlur = capabilities.supportsBlur && animationsEnabled;
  const { isAuthenticated, setSession } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!isAuthenticated) return false;
    if (!currentPassword.trim()) return false;
    if (!newPassword.trim()) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    if (newPassword === currentPassword) return false;
    return true;
  }, [isAuthenticated, currentPassword, newPassword, confirmPassword]);

  const onSave = async () => {
    if (!isAuthenticated) {
      setError('Please sign in again.');
      return;
    }

    if (!currentPassword.trim()) {
      setError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const { error: changeError } = await changePassword(currentPassword, newPassword);
      if (changeError) {
        setError(changeError.message || 'Unable to change password.');
        return;
      }

      // Refresh session in store (keeps UI in sync)
      const { session } = await getSession();
      if (session) setSession(session);

      Alert.alert('Success', 'Your password has been updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedBackground>
      <View style={styles.container}>
        {/* Fixed Header */}
        <BlurView
          intensity={canUseBlur ? 80 : 0}
          tint="dark"
          style={[styles.headerBlur, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: colors.cardBackground }]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Change Password</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Update your login credentials</Text>
            </View>
          </View>
        </BlurView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: insets.top + 100, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Security</Text>
            <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>For your safety, we verify your current password.</Text>

            <View style={{ height: 14 }} />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password</Text>
            <GlassInput
              placeholder="Enter current password"
              icon="lock-closed"
              isPassword
              value={currentPassword}
              onChangeText={setCurrentPassword}
              error={!!error}
              autoCorrect={false}
              autoCapitalize="none"
              textContentType="password"
            />

            <View style={{ height: 14 }} />

            <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
            <GlassInput
              placeholder="Enter new password (min 8 chars)"
              icon="key"
              isPassword
              value={newPassword}
              onChangeText={setNewPassword}
              error={!!error}
              autoCorrect={false}
              autoCapitalize="none"
              textContentType="newPassword"
            />

            <View style={{ height: 14 }} />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
            <GlassInput
              placeholder="Re-enter new password"
              icon="key"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={!!error}
              autoCorrect={false}
              autoCapitalize="none"
              textContentType="newPassword"
            />

            {!!error && (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            )}

            <View style={{ height: 18 }} />

            <PrimaryButton
              title={saving ? 'Updating…' : 'Update Password'}
              onPress={onSave}
              loading={saving}
              disabled={!canSubmit || saving}
            />
          </Card>
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
});
