import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { uploadFileToBucket } from '../../../lib/storage';
import { withAlpha } from '../../../theme/colorUtils';

type NoticePriority = 'low' | 'normal' | 'high' | 'urgent';
const PRIORITIES: NoticePriority[] = ['low', 'normal', 'high', 'urgent'];

type TeacherSection = {
  id: string;
  name: string;
};

export default function TeacherCreateNoticeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [sectionId, setSectionId] = useState('');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('normal');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const viewUrl = typeof params.viewUrl === 'string' ? params.viewUrl : '';

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchTeacherSections = useCallback(async (tId: string) => {
    const { data: academicYear } = await supabase.from('academic_years').select('id').eq('is_current', true).single();
    if (!academicYear?.id) return [];

    const { data, error } = await supabase
      .from('timetable_entries')
      .select('section_id, sections:sections!timetable_entries_section_id_fkey(id, name)')
      .eq('teacher_id', tId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true);

    if (error) {
      console.log('Teacher create notice sections error:', error.message);
      return [];
    }

    const map = new Map<string, TeacherSection>();
    (data || []).forEach((row: any) => {
      if (!row?.section_id || !row?.sections) return;
      if (!map.has(row.section_id)) {
        map.set(row.section_id, { id: row.sections.id, name: row.sections.name });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);

      if (tId) {
        const sects = await fetchTeacherSections(tId);
        setSections(sects);
        if (sects.length > 0) setSectionId(sects[0].id);
      }

      setLoading(false);
    };
    init();
  }, [fetchTeacherId, fetchTeacherSections]);

  const canSave = useMemo(() => {
    return (
      !!user?.id &&
      !!teacherId &&
      !!sectionId &&
      title.trim().length > 0 &&
      content.trim().length > 0 &&
      !saving &&
      !uploading
    );
  }, [user?.id, teacherId, sectionId, title, content, saving, uploading]);

  const pillStyle = (active: boolean) => ({
    backgroundColor: active
      ? withAlpha(colors.primary, isDark ? 0.28 : 0.14)
      : isDark
        ? withAlpha(colors.textInverse, 0.07)
        : withAlpha(colors.shadowColor, 0.05),
    borderColor: active ? withAlpha(colors.primary, 0.6) : withAlpha(colors.cardBorder, 0.55),
  });

  const pickAndUpload = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['application/pdf', 'image/*', 'text/plain', '*/*'],
    });

    if (result.canceled) return;
    const file = result.assets?.[0];
    if (!file?.uri) {
      Alert.alert('Error', 'Failed to read file');
      return;
    }

    try {
      setUploading(true);
      const { publicUrl } = await uploadFileToBucket({
        bucket: 'teacher_uploads',
        prefix: `notices/${user.id}`,
        uri: file.uri,
        name: file.name || 'notice-attachment',
        mimeType: file.mimeType || undefined,
      });

      setAttachmentUrl(publicUrl);
      Alert.alert('Uploaded', 'Attachment uploaded successfully');
    } catch (e: any) {
      console.log('Notice upload error:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }
    if (!teacherId) {
      Alert.alert('Error', 'Teacher profile not found');
      return;
    }
    if (!sectionId) {
      Alert.alert('Error', 'No class section found. Ask admin to assign timetable.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase.from('notices').insert({
        title: title.trim(),
        content: content.trim(),
        scope: 'class',
        priority,
        section_id: sectionId,
        author_id: user.id,
        attachment_url: attachmentUrl.trim() ? attachmentUrl.trim() : null,
        is_active: true,
      });

      if (error) {
        console.log('Teacher create notice error:', error.message);
        Alert.alert('Error', 'Failed to create notice (permission or data issue)');
        return;
      }

      Alert.alert('Created', 'Notice published');
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.85}
              style={[styles.backBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]}>Create Notice</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Class notice for your taught section</Text>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 18 }}>
            {viewUrl ? (
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Attachment URL</Text>
                <Text style={[styles.value, { color: colors.primary }]} numberOfLines={2}>
                  {viewUrl}
                </Text>
                <Text style={[styles.help, { color: colors.textMuted }]}>Open this URL in browser (copied from list).</Text>
              </Card>
            ) : null}

            <Animated.View entering={FadeInDown.duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Class Section</Text>
                {sections.length === 0 ? (
                  <Text style={[styles.value, { color: colors.textPrimary }]}>No assigned sections</Text>
                ) : (
                  <View style={styles.pillsWrap}>
                    {sections.map((s) => {
                      const active = s.id === sectionId;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          activeOpacity={0.85}
                          onPress={() => setSectionId(s.id)}
                          style={[styles.pill, pillStyle(active)]}
                        >
                          <Text style={[styles.pillText, { color: active ? colors.primary : colors.textMuted }]}>
                            {s.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Title</Text>
                <GlassInput value={title} onChangeText={setTitle} placeholder="Notice title" />

                <View style={{ height: 10 }} />
                <Text style={[styles.label, { color: colors.textMuted }]}>Content</Text>
                <GlassInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write the notice..."
                  multiline
                  style={{ minHeight: 90, textAlignVertical: 'top' }}
                />

                <View style={{ height: 10 }} />
                <Text style={[styles.label, { color: colors.textMuted }]}>Priority</Text>
                <View style={styles.pillsWrap}>
                  {PRIORITIES.map((p) => {
                    const active = p === priority;
                    return (
                      <TouchableOpacity
                        key={p}
                        activeOpacity={0.85}
                        onPress={() => setPriority(p)}
                        style={[styles.pill, pillStyle(active)]}
                      >
                        <Text style={[styles.pillText, { color: active ? colors.primary : colors.textMuted }]}>
                          {p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ height: 14 }} />
                <PrimaryButton
                  title={uploading ? 'Uploading...' : attachmentUrl ? 'Replace Attachment' : 'Pick & Upload Attachment'}
                  onPress={pickAndUpload}
                  variant="outline"
                  size="medium"
                  disabled={uploading || saving}
                />

                {attachmentUrl ? (
                  <Text style={[styles.help, { color: colors.textMuted }]} numberOfLines={2}>
                    Attachment: {attachmentUrl}
                  </Text>
                ) : null}

                <View style={{ height: 14 }} />
                <PrimaryButton
                  title={saving ? 'Publishing...' : 'Publish Notice'}
                  onPress={save}
                  variant="primary"
                  size="medium"
                  disabled={!canSave}
                />
              </Card>
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  help: {
    marginTop: 10,
    fontSize: 12,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
