import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { AnimatedBackground, Card, LoadingIndicator } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { withAlpha } from '../../theme/colorUtils';
import { signOut, supabase } from '../../lib/supabase';
import { getStudentWithDetails } from '../../lib/database';
import { uploadFileToBucket } from '../../lib/storage';
import { STUDENT_ROUTES } from '../../lib/routes';

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user, profile, setProfile, logout } = useAuthStore();

  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url || '');

  useEffect(() => {
    setPhotoUrl(profile?.photo_url || '');
  }, [profile?.photo_url]);

  useEffect(() => {
    if (user) {
      getStudentWithDetails(user.id).then((details) => {
        setStudentDetails(details);
      });
    }
  }, [user]);

  const canChangePhoto = useMemo(() => {
    return Boolean(user?.id) && !uploadingPhoto;
  }, [uploadingPhoto, user?.id]);

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
      const stablePath = `profiles/${user.id}/avatar.${ext}`;

      const { publicUrl } = await uploadFileToBucket({
        bucket: 'profile-photos',
        prefix: `profiles/${user.id}`,
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
        console.log('Student profile photo update error:', error.message);
        Alert.alert('Error', 'Failed to save profile photo');
        return;
      }

      setProfile(data as any);
      setPhotoUrl(publicUrl);
      Alert.alert('Saved', 'Profile photo updated');
    } catch (e: any) {
      console.log('Student profile photo upload error:', e?.message || e);
      Alert.alert('Error', 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

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
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleChangePhoto}
                disabled={!canChangePhoto}
                style={[styles.profileImage, { backgroundColor: photoUrl ? 'transparent' : colors.primary }]}
              >
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.profileImageInner} />
                ) : (
                  <Ionicons name="person" size={56} color={colors.background} />
                )}
                {uploadingPhoto ? (
                  <View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFillObject,
                      {
                        borderRadius: 40,
                        backgroundColor: withAlpha(colors.background, isDark ? 0.55 : 0.4),
                        alignItems: 'center',
                        justifyContent: 'center',
                      },
                    ]}
                  >
                    <LoadingIndicator color={colors.primary} size="small" />
                  </View>
                ) : null}
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {profile?.full_name || 'Student'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {user?.email}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(STUDENT_ROUTES.SETTINGS as any)}
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
              onPress={() => router.push(STUDENT_ROUTES.SETTINGS as any)}
            >
              <Ionicons name="settings" size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.textPrimary }]}>App Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}
              onPress={() => router.push(STUDENT_ROUTES.SUPPORT as any)}
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
  profileImageInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
