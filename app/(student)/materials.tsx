import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getStudentByUserId } from '../../lib/database';
import { withAlpha } from '../../theme/colorUtils';

type MaterialRow = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  unit_number: number | null;
  topic: string | null;
  created_at: string;
  courses?: { code: string; name: string; short_name: string | null } | null;
};

function formatShortDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export default function StudentMaterialsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentOk, setStudentOk] = useState<boolean | null>(null);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);

  const fetchStudentOk = useCallback(async () => {
    if (!user?.id) return false;
    const s = await getStudentByUserId(user.id);
    return Boolean(s?.id);
  }, [user?.id]);

  const fetchMaterials = useCallback(async () => {
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
          created_at,
          courses(code, name, short_name)
        `
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Student materials error:', error.message);
      setMaterials([]);
      return;
    }

    setMaterials((data || []) as any);
  }, []);

  const fetchAll = useCallback(async () => {
    const ok = await fetchStudentOk();
    setStudentOk(ok);
    if (!ok) {
      setMaterials([]);
      return;
    }
    await fetchMaterials();
  }, [fetchMaterials, fetchStudentOk]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    };
    init();
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const subtitle = useMemo(() => {
    const count = materials.length;
    if (count === 0) return 'No materials yet';
    if (count === 1) return '1 material';
    return `${count} materials`;
  }, [materials.length]);

  const openUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Cannot open link', 'Invalid or unsupported URL');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Study Materials</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{subtitle}</Text>
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
            {studentOk === false ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
              </Card>
            ) : materials.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No materials</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Materials shared by teachers will show here.</Text>
                <View style={{ marginTop: 12 }}>
                  <PrimaryButton title="Refresh" onPress={onRefresh} />
                </View>
              </Card>
            ) : (
              materials.map((m, index) => {
                const courseLabel = m.courses?.short_name || m.courses?.code || m.courses?.name || 'Course';
                const chipBg = isDark ? withAlpha(colors.textInverse, 0.08) : withAlpha(colors.shadowColor, 0.06);

                return (
                  <Animated.View key={m.id} entering={FadeInDown.delay(index * 30).duration(280)} style={{ marginBottom: 12 }}>
                    <Card>
                      <View style={styles.rowTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
                            {m.title}
                          </Text>
                          <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
                            {courseLabel}
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

                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                          <View style={[styles.chip, { backgroundColor: chipBg }]}>
                            <Text style={[styles.chipText, { color: colors.textMuted }]}>{formatShortDate(m.created_at)}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => openUrl(m.file_url)}
                            activeOpacity={0.85}
                            style={[styles.openBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.22 : 0.14) }]}
                          >
                            <Text style={[styles.openText, { color: colors.primary }]}>Open</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card>
                  </Animated.View>
                );
              })
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
  header: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  sub: {
    marginTop: 4,
    fontSize: 12,
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  openBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  openText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
  },
});
