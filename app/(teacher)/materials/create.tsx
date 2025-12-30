import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type CourseOption = {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
};

type FileType = 'pdf' | 'ppt' | 'doc' | 'video' | 'link';

const FILE_TYPES: FileType[] = ['link', 'pdf', 'ppt', 'doc', 'video'];

export default function TeacherCreateMaterialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState<string>('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<FileType>('link');
  const [unitNumber, setUnitNumber] = useState('');
  const [topic, setTopic] = useState('');

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

    // Use timetable assignments as the safest source of “teacher can publish for this course”.
    const { data, error } = await supabase
      .from('timetable_entries')
      .select('course_id, courses:courses!timetable_entries_course_id_fkey(id, code, name, short_name)')
      .eq('teacher_id', tId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true);

    if (error) {
      console.log('Teacher materials course options error:', error.message);
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
        if (opts.length > 0) setCourseId(opts[0].id);
      }

      setLoading(false);
    };
    init();
  }, [fetchCourseOptions, fetchTeacherId]);

  const selectedCourseLabel = useMemo(() => {
    const c = courseOptions.find((o) => o.id === courseId);
    if (!c) return 'Select course';
    return `${c.short_name || c.code} • ${c.name}`;
  }, [courseId, courseOptions]);

  const canSave = useMemo(() => {
    return !!teacherId && !!courseId && title.trim().length > 0 && fileUrl.trim().length > 0 && !saving;
  }, [teacherId, courseId, title, fileUrl, saving]);

  const save = async () => {
    if (!teacherId) {
      Alert.alert('Error', 'Teacher profile not found');
      return;
    }
    if (!courseId) {
      Alert.alert('Error', 'Select a course');
      return;
    }

    const unit = unitNumber.trim().length ? Number(unitNumber.trim()) : null;
    if (unitNumber.trim().length && (Number.isNaN(unit) || unit === null)) {
      Alert.alert('Error', 'Unit number must be a number');
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        course_id: courseId,
        teacher_id: teacherId,
        file_url: fileUrl.trim(),
        file_type: fileType,
        unit_number: unit,
        topic: topic.trim() || null,
        is_active: true,
      };

      const { error } = await supabase.from('teaching_materials').insert(payload);
      if (error) {
        console.log('Create material error:', error.message);
        Alert.alert('Error', 'Failed to create material');
        return;
      }

      Alert.alert('Created', 'Material created');
      router.back();
    } finally {
      setSaving(false);
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
              <Text style={[styles.header, { color: colors.textPrimary }]}>Create Material</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Share a link or file URL</Text>
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
                  <Text style={[styles.helper, { color: colors.textMuted }]}>
                    No assigned courses found (ask admin to assign timetable).
                  </Text>
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
                <Text style={[styles.label, { color: colors.textMuted }]}>Material details</Text>
                <View style={{ height: 10 }} />

                <GlassInput
                  icon="document-text-outline"
                  placeholder="Title (required)"
                  value={title}
                  onChangeText={setTitle}
                />
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="link-outline"
                  placeholder="File URL / Link (required)"
                  value={fileUrl}
                  onChangeText={setFileUrl}
                  autoCapitalize="none"
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
                  icon="bookmark-outline"
                  placeholder="Topic (optional)"
                  value={topic}
                  onChangeText={setTopic}
                />
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="albums-outline"
                  placeholder="Unit number (optional)"
                  value={unitNumber}
                  onChangeText={setUnitNumber}
                  keyboardType="numeric"
                />
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Type</Text>
                <View style={{ height: 10 }} />
                <View style={styles.typeRow}>
                  {FILE_TYPES.map((t) => {
                    const active = t === fileType;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setFileType(t)}
                        activeOpacity={0.85}
                        style={[styles.typePill, pillStyle(active)]}
                      >
                        <Text style={[styles.typePillText, { color: active ? colors.primary : colors.textMuted }]}>
                          {t.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
