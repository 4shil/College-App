import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { signOut, supabase } from '../../lib/supabase';
import { withAlpha } from '../../theme/colorUtils';
import { uploadFileToBucket } from '../../lib/storage';

export default function TeacherProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user, profile, setProfile, logout } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '');

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setPhotoUrl(profile?.photo_url || '');
  }, [profile?.full_name, profile?.phone]);

  const handleChangePhoto = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['image/*'],
    });

    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file?.uri) {
      Alert.alert('Error', 'Failed to read selected image');
      return;
    }

    try {
      setUploadingPhoto(true);

      const fileName = file.name || 'avatar.jpg';
      const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
      const stablePath = `avatars/${user.id}/avatar.${ext}`;

      const { publicUrl } = await uploadFileToBucket({
        bucket: 'teacher_uploads',
        prefix: `avatars/${user.id}`,
        path: stablePath,
        upsert: true,
        uri: file.uri,
        name: fileName,
        mimeType: file.mimeType || 'image/jpeg',
      });

      const { data, error } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user.id)
        .select('*')
        .single();

      if (error) {
        console.log('Teacher profile photo update error:', error.message);
        Alert.alert('Error', 'Failed to save profile photo');
        return;
      }

      setProfile(data as any);
      setPhotoUrl(publicUrl);
      Alert.alert('Saved', 'Profile photo updated');
    } catch (e: any) {
      console.log('Teacher profile photo upload error:', e?.message || e);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const canSave = useMemo(() => {
    if (!user?.id) return false;
    if (!profile?.id && !user?.id) return false;
    if (!fullName.trim()) return false;
    const changed = fullName.trim() !== (profile?.full_name || '') || (phone.trim() || '') !== (profile?.phone || '');
    return changed && !saving;
  }, [fullName, phone, profile?.full_name, profile?.phone, profile?.id, saving, user?.id]);

  const handleSave = async () => {
    const profileId = profile?.id || user?.id;
    if (!profileId) {
      Alert.alert('Error', 'Profile not found');
      return;
    }

    const name = fullName.trim();
    if (!name) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          phone: phone.trim() ? phone.trim() : null,
        })
        .eq('id', profileId)
        .select('*')
        .single();

      if (error) {
        console.log('Teacher profile update error:', error.message);
        Alert.alert('Error', 'Failed to update profile');
        return;
      }

      setProfile(data as any);
      Alert.alert('Saved', 'Profile updated');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    logout();
    router.replace('/(auth)/login');
  };

  if (!user) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 }]}>
          <LoadingIndicator color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{user.email}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={{ marginBottom: 12 }}>
          <Card>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={[styles.avatar, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.12) }]}
                onPress={handleChangePhoto}
                activeOpacity={0.85}
                disabled={uploadingPhoto}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={22} color={colors.primary} />
                )}
                {uploadingPhoto ? (
                  <View style={[styles.avatarOverlay, { backgroundColor: withAlpha(colors.background, isDark ? 0.55 : 0.4) }]}>
                    <LoadingIndicator color={colors.primary} size="small" />
                  </View>
                ) : null}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                  {profile?.full_name || user.email}
                </Text>
                <Text style={[styles.role, { color: colors.textMuted }]}>Teacher</Text>
              </View>
            </View>

            <View style={{ height: 14 }} />

            <Text style={[styles.label, { color: colors.textMuted }]}>Full name</Text>
            <GlassInput value={fullName} onChangeText={setFullName} placeholder="Full name" />

            <View style={{ height: 10 }} />
            <Text style={[styles.label, { color: colors.textMuted }]}>Phone (optional)</Text>
            <GlassInput value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />

            <View style={{ height: 14 }} />
            <PrimaryButton
              title={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              disabled={!canSave}
              variant="primary"
              size="medium"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(350)}>
          <Card>
            <TouchableOpacity style={styles.option} onPress={handleLogout} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
              <Text style={[styles.optionText, { color: colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 12 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 18, fontWeight: '700' },
  role: { fontSize: 13, marginTop: 2 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  optionText: { fontSize: 16, fontWeight: '600' },
});
