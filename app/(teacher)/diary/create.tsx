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

function toDateOnlyISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TeacherCreateDiaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const [todaySummary, setTodaySummary] = useState('');

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    return teacher?.id || null;
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      setLoading(false);
    };
    init();
  }, [fetchTeacherId]);

  const canSave = useMemo(() => {
    return !!teacherId && todaySummary.trim().length > 0 && !saving;
  }, [teacherId, todaySummary, saving]);

  const save = async () => {
    if (!teacherId) {
      Alert.alert('Error', 'Teacher profile not found');
      return;
    }

    const m = Number(month.trim());
    const y = Number(year.trim());

    if (Number.isNaN(m) || m < 1 || m > 12) {
      Alert.alert('Error', 'Month must be 1-12');
      return;
    }
    if (Number.isNaN(y) || y < 2000 || y > 2100) {
      Alert.alert('Error', 'Year must be valid');
      return;
    }

    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (!academicYear?.id) {
      Alert.alert('Error', 'No current academic year found');
      return;
    }

    // Minimal daily_entries structure that stays compatible with the JSONB design.
    const daily_entries = [
      {
        date: toDateOnlyISO(new Date()),
        periods: [],
        summary: todaySummary.trim(),
      },
    ];

    try {
      setSaving(true);

      const payload: any = {
        teacher_id: teacherId,
        academic_year_id: academicYear.id,
        month: m,
        year: y,
        daily_entries,
        status: 'draft',
      };

      const { error } = await supabase.from('work_diaries').insert(payload);
      if (error) {
        console.log('Create diary error:', error.message);
        if (error.message?.toLowerCase().includes('duplicate') || (error as any)?.code === '23505') {
          Alert.alert('Already exists', 'A diary for this month/year already exists.');
        } else {
          Alert.alert('Error', 'Failed to create diary');
        }
        return;
      }

      Alert.alert('Created', 'Diary draft created');
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
              <Text style={[styles.header, { color: colors.textPrimary }]}>Create Diary</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Draft → submit for approval</Text>
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
                <Text style={[styles.label, { color: colors.textMuted }]}>Month</Text>
                <View style={{ height: 10 }} />

                <View style={styles.monthRow}>
                  <View style={{ flex: 1 }}>
                    <GlassInput
                      icon="calendar-outline"
                      placeholder="Month (1-12)"
                      value={month}
                      onChangeText={setMonth}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <GlassInput
                      icon="calendar-outline"
                      placeholder="Year (e.g. 2025)"
                      value={year}
                      onChangeText={setYear}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(50).duration(300)} style={{ marginBottom: 12 }}>
              <Card>
                <Text style={[styles.label, { color: colors.textMuted }]}>Today summary</Text>
                <View style={{ height: 10 }} />
                <GlassInput
                  icon="create-outline"
                  placeholder="What was covered today? (required)"
                  value={todaySummary}
                  onChangeText={setTodaySummary}
                />
                <Text style={[styles.helper, { color: colors.textMuted }]}>This saves one diary entry in JSON.</Text>
              </Card>
            </Animated.View>

            <View style={{ marginTop: 6 }}>
              <PrimaryButton title={saving ? 'Saving...' : 'Create Draft'} onPress={save} disabled={!canSave} />
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
  helper: {
    marginTop: 8,
    fontSize: 13,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
