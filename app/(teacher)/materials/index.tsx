import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type MaterialRow = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  unit_number: number | null;
  topic: string | null;
  is_active: boolean;
  created_at: string;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

export default function TeacherMaterialsIndex() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher, error } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (error) {
      console.log('Teacher materials teacher id error:', error.message);
      setErrorText('Unable to load teacher profile');
      return null;
    }
    return teacher?.id || null;
  }, [user?.id]);

  const fetchMaterials = useCallback(async () => {
    if (!teacherId) return;

    const { data, error } = await supabase
      .from('teaching_materials')
      .select(
        `
          id,
          title,
          description,
          file_url,
          file_type,
          unit_number,
          topic,
          is_active,
          created_at,
          courses(code, name, short_name)
        `
      )
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Teacher materials error:', error.message);
      setErrorText('Unable to load materials. Pull to refresh or try again.');
      setMaterials([]);
      return;
    }

    setErrorText(null);
    setMaterials((data || []) as MaterialRow[]);
  }, [teacherId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorText(null);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      setLoading(false);
    };
    init();
  }, [fetchTeacherId]);

  useEffect(() => {
    if (!teacherId) return;
    fetchMaterials();
  }, [teacherId, fetchMaterials]);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrorText(null);
    await fetchMaterials();
    setRefreshing(false);
  };

  const openMaterial = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Cannot open', 'This link cannot be opened on your device.');
        return;
      }
      await Linking.openURL(url);
    } catch (e: any) {
      console.log('Open material error:', e?.message || e);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const subtitle = useMemo(() => {
    const count = materials.length;
    if (count === 0) return 'No materials yet';
    if (count === 1) return '1 material';
    return `${count} materials`;
  }, [materials.length]);

  const toggleActive = async (row: MaterialRow) => {
    if (!teacherId) return;

    const next = !row.is_active;
    const { error } = await supabase
      .from('teaching_materials')
      .update({ is_active: next })
      .eq('id', row.id)
      .eq('teacher_id', teacherId);

    if (error) {
      Alert.alert('Error', 'Failed to update material');
      return;
    }

    setMaterials((prev) => prev.map((m) => (m.id === row.id ? { ...m, is_active: next } : m)));
  };

  const openCreate = () => {
    router.push('/(teacher)/materials/create');
  };

  const renderRow = (m: MaterialRow, index: number) => {
    const chipBg = m.is_active
      ? withAlpha(colors.success, isDark ? 0.22 : 0.12)
      : isDark
        ? withAlpha(colors.textInverse, 0.08)
        : withAlpha(colors.shadowColor, 0.06);

    const chipText = m.is_active ? colors.success : colors.textMuted;

    return (
      <Animated.View key={m.id} entering={FadeInDown.delay(index * 30).duration(280)} style={{ marginBottom: 12 }}>
        <Card>
          <View style={styles.rowTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                {m.title}
              </Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
                {(m.courses?.short_name || m.courses?.code || m.courses?.name || 'Course')}
                {m.file_type ? ` • ${m.file_type}` : ''}
                {m.unit_number ? ` • Unit ${m.unit_number}` : ''}
              </Text>
              {m.topic ? (
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                  Topic: {m.topic}
                </Text>
              ) : null}
              {m.description ? (
                <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={2}>
                  {m.description}
                </Text>
              ) : null}
            </View>

            <View style={styles.rightCol}>
              <View style={[styles.chip, { backgroundColor: chipBg }]}> 
                <Text style={[styles.chipText, { color: chipText }]}>{m.is_active ? 'Active' : 'Hidden'}</Text>
              </View>

              {m.file_url ? (
                <TouchableOpacity
                  onPress={() => openMaterial(m.file_url)}
                  style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="open-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => toggleActive(m)}
                style={[styles.iconBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.18 : 0.1) }]}
                activeOpacity={0.85}
              >
                <Ionicons name={m.is_active ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.header, { color: colors.textPrimary }]}>Materials</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>{subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={openCreate}
              activeOpacity={0.85}
              style={[styles.fab, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.14) }]}
            >
              <Ionicons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading materials...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {errorText ? (
              <View style={{ marginBottom: 12 }}>
                <Card>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Couldn’t load materials</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>{errorText}</Text>
                  <View style={{ marginTop: 12 }}>
                    <PrimaryButton title="Retry" onPress={fetchMaterials} variant="outline" />
                  </View>
                </Card>
              </View>
            ) : null}

            {materials.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No materials</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Create your first material link for students.</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton title="Create Material" onPress={openCreate} />
                </View>
              </Card>
            ) : (
              materials.map(renderRow)
            )}

            <View style={{ height: 20 }} />
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
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  sub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
});
