import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { uploadFileToBucket } from '../../../lib/storage';
import { withAlpha } from '../../../theme/colorUtils';

type CourseOption = {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
};

function toIsoOrNull(date: Date | null) {
  if (!date) return null;
  const t = date.getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}

export default function TeacherCreateAssignmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const preferredCourseId = typeof params.courseId === 'string' ? params.courseId : '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState<string>('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMarks, setMaxMarks] = useState('10');

  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  const [dueDate, setDueDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);
  const [dueIsoText, setDueIsoText] = useState(() => toIsoOrNull(dueDate) || '');

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  const fetchCourseOptions = useCallback(async (tId: string) => {
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (!academicYear?.id) return [];

    const { data, error } = await supabase
      .from('timetable_entries')
      .select('course_id, courses:courses!timetable_entries_course_id_fkey(id, code, name, short_name)')
      .eq('teacher_id', tId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true);

    if (error) {
      console.log('Teacher assignments course options error:', error.message);
      return [];
    }

    const map = new Map<string, CourseOption>();
    (data || []).forEach((row: any) => {
      if (!row?.course_id || !row?.courses) return;
      if (!map.has(row.course_id)) {
        map.set(row.course_id, {
          id: row.courses.id,
          code: row.courses.code,
          name: row.courses.name,
          short_name: row.courses.short_name,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.code || '').localeCompare(b.code || ''));
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);

      if (tId) {
        const opts = await fetchCourseOptions(tId);
        setCourseOptions(opts);
        if (opts.length > 0) {
          const preferred = preferredCourseId && opts.some((o) => o.id === preferredCourseId) ? preferredCourseId : '';
          setCourseId(preferred || opts[0].id);
        }
      }

      setLoading(false);
    };
    init();
  }, [fetchCourseOptions, fetchTeacherId, preferredCourseId]);

  useEffect(() => {
    const iso = toIsoOrNull(dueDate);
    if (iso) setDueIsoText(iso);
  }, [dueDate]);

  const selectedCourseLabel = useMemo(() => {
    const c = courseOptions.find((o) => o.id === courseId);
    if (!c) return 'Select course';
    return `${c.short_name || c.code} • ${c.name}`;
  }, [courseId, courseOptions]);

  const canSave = useMemo(() => {
    return !!teacherId && !!courseId && title.trim().length > 0 && !saving && !uploading;
  }, [teacherId, courseId, title, saving, uploading]);

  const addAttachment = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Not signed in');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['application/pdf', 'application/msword', 'application/vnd.ms-powerpoint', 'image/*', 'text/plain', '*/*'],
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
        prefix: `assignments/${user.id}`,
        uri: file.uri,
        name: file.name || 'attachment',
        mimeType: file.mimeType || undefined,
      });

      setAttachmentUrls((prev) => [...prev, publicUrl]);
      Alert.alert('Uploaded', 'Attachment uploaded');
    } catch (e: any) {
      console.log('Assignment attachment upload error:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const pillStyle = (active: boolean) => ({
    backgroundColor: active
      ? withAlpha(colors.primary, isDark ? 0.28 : 0.14)
      : isDark
        ? withAlpha(colors.textInverse, 0.07)
        : withAlpha(colors.shadowColor, 0.05),
    borderColor: active ? withAlpha(colors.primary, 0.6) : withAlpha(colors.cardBorder, 0.55),
  });

  const save = async () => {
    if (!teacherId) {
      Alert.alert('Error', 'Teacher profile not found');
      return;
    }
    if (!courseId) {
      Alert.alert('Error', 'Select a course');
      return;
    }

    const mm = Number(maxMarks.trim() || '10');
    if (Number.isNaN(mm) || mm <= 0) {
      Alert.alert('Error', 'Max marks must be a positive number');
      return;
    }

    const dueIso = Platform.OS === 'web' ? dueIsoText.trim() : toIsoOrNull(dueDate);
    if (!dueIso) {
      Alert.alert('Error', 'Invalid due date');
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        course_id: courseId,
        section_id: null,
        teacher_id: teacherId,
        due_date: dueIso,
        max_marks: mm,
        attachment_urls: attachmentUrls,
        is_active: true,
      };

      const { error } = await supabase.from('assignments').insert(payload);
      if (error) {
        console.log('Create assignment error:', error.message);
        Alert.alert('Error', 'Failed to create assignment');
        return;
      }

      Alert.alert('Created', 'Assignment created');
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
              <Text style={[styles.header, { color: colors.textPrimary }]}>Create Assignment</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Set due date and marks</Text>
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
            <Animated.View entering={FadeInDown.duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Course</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={2}>
                  {selectedCourseLabel}
                </Text>

                <View style={{ height: 10 }} />

                {courseOptions.length === 0 ? (
                  <Text style={[styles.helper, { color: colors.textMuted }]}>No assigned courses found (ask admin to assign timetable).</Text>
                ) : (
                  <View style={styles.courseList}>
                    {courseOptions.map((c) => {
                      const active = c.id === courseId;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => setCourseId(c.id)}
                          activeOpacity={0.85}
                          style={[styles.coursePill, pillStyle(active)]}
                        >
                          <Text style={[styles.coursePillText, { color: active ? colors.primary : colors.textMuted }]}>
                            {c.short_name || c.code}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(50).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Details</Text>
                <View style={{ height: 10 }} />

                <GlassInput
                  icon="document-text-outline"
                  placeholder="Title (required)"
                  value={title}
                  onChangeText={setTitle}
                />
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="chatbox-ellipses-outline"
                  placeholder="Description (optional)"
                  value={description}
                  onChangeText={setDescription}
                />
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="podium-outline"
                  placeholder="Max marks (default 10)"
                  value={maxMarks}
                  onChangeText={setMaxMarks}
                  keyboardType="numeric"
                />
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(75).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Attachments</Text>
                <Text style={[styles.helper, { color: colors.textMuted, marginTop: 6 }]}>Optional</Text>

                <View style={{ marginTop: 10 }}>
                  <PrimaryButton
                    title={uploading ? 'Uploading…' : 'Add Attachment'}
                    onPress={addAttachment}
                    disabled={uploading || saving}
                    variant="outline"
                    size="medium"
                    glowing={false}
                  />
                </View>

                {attachmentUrls.length > 0 ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {attachmentUrls.map((u, idx) => (
                      <View key={u + idx} style={[styles.attachmentRow, { borderColor: withAlpha(colors.cardBorder, 0.7) }]}
                      >
                        <Text style={[styles.attachmentText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {u}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setAttachmentUrls((prev) => prev.filter((_, i) => i !== idx))}
                          activeOpacity={0.85}
                          style={[styles.removeBtn, { backgroundColor: withAlpha(colors.error, 0.12) }]}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Due date</Text>
                <View style={{ height: 10 }} />

                {Platform.OS === 'web' ? (
                  <GlassInput
                    icon="time-outline"
                    placeholder="Due date ISO (e.g. 2025-12-31T18:30:00.000Z)"
                    value={dueIsoText}
                    onChangeText={setDueIsoText}
                    autoCapitalize="none"
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowPicker(true)}
                      activeOpacity={0.85}
                      style={[styles.dateBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                    >
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                      <Text style={[styles.dateBtnText, { color: colors.primary }]}>{dueDate.toLocaleString()}</Text>
                    </TouchableOpacity>

                    {showPicker ? (
                      <DateTimePicker
                        value={dueDate}
                        mode="datetime"
                        onChange={(e, selected) => {
                          setShowPicker(false);
                          if (selected) setDueDate(selected);
                        }}
                      />
                    ) : null}
                  </>
                )}
              </Card>
            </Animated.View>

            <View style={{ marginTop: 6 }}>
              <PrimaryButton title={saving ? 'Saving...' : 'Create'} onPress={save} disabled={!canSave} />
            </View>
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
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
  },
  helper: {
    marginTop: 6,
    fontSize: 13,
  },
  courseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coursePill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  coursePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  attachmentRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
