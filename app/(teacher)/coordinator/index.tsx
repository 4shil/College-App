import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type AcademicYearRow = { id: string; name: string; is_current: boolean };

type TeacherRow = { id: string; user_id: string; profiles?: { full_name: string } | null };

type TimetableEntryRow = {
  id: string;
  day_of_week: number;
  period: number;
};

type SubstitutionRow = {
  id: string;
  date: string;
  status: string;
  reason: string | null;
  timetable_entry_id: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  created_at: string;
  timetable_entries?: { day_of_week: number; period: number } | null;
};

export default function TeacherCoordinatorScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<AcademicYearRow | null>(null);

  const [myEntries, setMyEntries] = useState<TimetableEntryRow[]>([]);
  const [allTeachers, setAllTeachers] = useState<TeacherRow[]>([]);

  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [timetableEntryId, setTimetableEntryId] = useState('');
  const [subTeacherId, setSubTeacherId] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<SubstitutionRow[]>([]);

  const fetchTeacherId = useCallback(async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase.from('teachers').select('id').eq('user_id', user.id).single();
    if (error) return null;
    return (data as any)?.id || null;
  }, [user?.id]);

  const fetchAcademicYear = useCallback(async () => {
    const { data, error } = await supabase
      .from('academic_years')
      .select('id, name, is_current')
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (error) {
      console.log('Coordinator academic year error:', error.message);
      setAcademicYear(null);
      return;
    }

    const list = (data || []) as AcademicYearRow[];
    const current = list.find((a) => a.is_current) || list[0] || null;
    setAcademicYear(current);
  }, []);

  const fetchMyTimetableEntries = useCallback(async () => {
    if (!teacherId || !academicYear?.id) {
      setMyEntries([]);
      return;
    }

    const { data, error } = await supabase
      .from('timetable_entries')
      .select('id, day_of_week, period')
      .eq('teacher_id', teacherId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('period', { ascending: true });

    if (error) {
      console.log('Coordinator timetable entries error:', error.message);
      setMyEntries([]);
      return;
    }

    const list = (data || []) as any as TimetableEntryRow[];
    setMyEntries(list);
    if (!timetableEntryId) setTimetableEntryId(list[0]?.id || '');
  }, [academicYear?.id, teacherId, timetableEntryId]);

  const fetchTeachers = useCallback(async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('id, user_id, profiles:user_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.log('Coordinator teachers error:', error.message);
      setAllTeachers([]);
      return;
    }

    setAllTeachers((data || []) as any as TeacherRow[]);
  }, []);

  const fetchSubstitutions = useCallback(async () => {
    // Coordinator: list substitutions (RLS governs visibility).
    const { data, error } = await supabase
      .from('substitutions')
      .select('id, date, status, reason, timetable_entry_id, original_teacher_id, substitute_teacher_id, created_at, timetable_entries(day_of_week, period)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Coordinator substitutions error:', error.message);
      setItems([]);
      return;
    }

    setItems((data || []) as any as SubstitutionRow[]);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      await fetchAcademicYear();
      await fetchTeachers();
      await fetchSubstitutions();
      setLoading(false);
    };
    init();
  }, [fetchAcademicYear, fetchSubstitutions, fetchTeacherId, fetchTeachers]);

  useEffect(() => {
    fetchMyTimetableEntries();
  }, [fetchMyTimetableEntries]);

  const myCount = useMemo(() => {
    if (!teacherId) return 0;
    return items.filter((i) => i.original_teacher_id === teacherId || i.substitute_teacher_id === teacherId).length;
  }, [items, teacherId]);

  const canCreate = Boolean(
    teacherId &&
      academicYear?.id &&
      timetableEntryId &&
      subTeacherId &&
      date.trim().length === 10 &&
      !saving
  );

  const createRequest = async () => {
    if (!teacherId) return;

    try {
      setSaving(true);
      const payload = {
        timetable_entry_id: timetableEntryId,
        date: date.trim(),
        original_teacher_id: teacherId,
        substitute_teacher_id: subTeacherId,
        reason: reason.trim() ? reason.trim() : null,
        status: 'pending',
      };

      const { error } = await supabase.from('substitutions').insert(payload);
      if (error) throw error;

      setReason('');
      await fetchSubstitutions();
      Alert.alert('Requested', 'Substitution request created');
    } catch (e: any) {
      console.log('Coordinator create substitution error:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to create substitution request');
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSubstitutions(), fetchAcademicYear(), fetchMyTimetableEntries(), fetchTeachers()]);
    setRefreshing(false);
  };

  const explain = () => {
    Alert.alert(
      'Coordinator',
      'Create substitution requests for your timetable entries. Approvals are handled by HoD/Admin (based on RLS).'
    );
  };

  const entryLabel = (e: TimetableEntryRow) => {
    const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][Math.max(0, Math.min(4, e.day_of_week - 1))] || `D${e.day_of_week}`;
    return `${day} • P${e.period}`;
  };

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return allTeachers.slice(0, 20);
    return allTeachers
      .filter((t) => (t.profiles?.full_name || '').toLowerCase().includes(q))
      .slice(0, 20);
  }, [allTeachers, teacherSearch]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Coordinator</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            Substitutions • {myCount} involving you
          </Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading substitutions…</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>What you can do</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Create substitution requests + view recent entries</Text>
              <View style={{ height: 12 }} />
              <PrimaryButton title="About this screen" onPress={explain} />
            </Card>

            <View style={{ height: 12 }} />

            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Create request</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>
                {academicYear?.name ? `${academicYear.name} • ` : ''}Your timetable only
              </Text>

              <View style={{ height: 12 }} />
              <Text style={[styles.label, { color: colors.textMuted }]}>Date (YYYY-MM-DD)</Text>
              <GlassInput value={date} onChangeText={setDate} placeholder="2026-01-02" />

              <View style={{ height: 10 }} />
              <Text style={[styles.label, { color: colors.textMuted }]}>Select your period</Text>
              <View style={{ marginTop: 6 }}>
                {myEntries.length === 0 ? (
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>No timetable entries found.</Text>
                ) : (
                  myEntries.map((e, idx) => {
                    const selected = e.id === timetableEntryId;
                    return (
                      <Animated.View key={e.id} entering={FadeInDown.delay(idx * 10).duration(180)} style={{ marginBottom: 8 }}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setTimetableEntryId(e.id)}
                          style={[
                            styles.pill,
                            {
                              borderColor: selected ? withAlpha(colors.primary, 0.35) : withAlpha(colors.cardBorder, 0.6),
                              backgroundColor: selected
                                ? withAlpha(colors.primary, isDark ? 0.18 : 0.08)
                                : withAlpha(colors.cardBackground, 0.18),
                            },
                          ]}
                        >
                          <Text style={[styles.pillText, { color: colors.textPrimary }]}>{entryLabel(e)}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })
                )}
              </View>

              <View style={{ height: 10 }} />
              <Text style={[styles.label, { color: colors.textMuted }]}>Search substitute teacher</Text>
              <GlassInput value={teacherSearch} onChangeText={setTeacherSearch} placeholder="Type name" />

              <View style={{ height: 10 }} />
              <Text style={[styles.label, { color: colors.textMuted }]}>Select substitute</Text>
              <View style={{ marginTop: 6 }}>
                {filteredTeachers.length === 0 ? (
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>No matching teachers.</Text>
                ) : (
                  filteredTeachers.map((t, idx) => {
                    const name = t.profiles?.full_name || 'Teacher';
                    const selected = t.id === subTeacherId;
                    return (
                      <Animated.View key={t.id} entering={FadeInDown.delay(idx * 8).duration(160)} style={{ marginBottom: 8 }}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setSubTeacherId(t.id)}
                          style={[
                            styles.pill,
                            {
                              borderColor: selected ? withAlpha(colors.primary, 0.35) : withAlpha(colors.cardBorder, 0.6),
                              backgroundColor: selected
                                ? withAlpha(colors.primary, isDark ? 0.18 : 0.08)
                                : withAlpha(colors.cardBackground, 0.18),
                            },
                          ]}
                        >
                          <Text style={[styles.pillText, { color: colors.textPrimary }]} numberOfLines={1}>
                            {name}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })
                )}
              </View>

              <View style={{ height: 10 }} />
              <Text style={[styles.label, { color: colors.textMuted }]}>Reason (optional)</Text>
              <GlassInput value={reason} onChangeText={setReason} placeholder="Reason" multiline />

              <View style={{ height: 12 }} />
              <PrimaryButton title={saving ? 'Submitting…' : 'Submit Request'} onPress={createRequest} disabled={!canCreate} />
            </Card>

            <View style={{ height: 12 }} />

            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Recent substitutions</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Last 50 records</Text>
              <View style={{ height: 12 }} />

              {items.length === 0 ? (
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>No substitutions found.</Text>
              ) : (
                items.map((s, idx) => (
                  <Animated.View key={s.id} entering={FadeInDown.delay(idx * 12).duration(220)} style={{ marginBottom: 10 }}>
                    <View style={styles.row}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                        {s.date}
                        {s.timetable_entries ? ` • P${s.timetable_entries.period}` : ''} • {s.status}
                      </Text>
                      {s.reason ? (
                        <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>
                          {s.reason}
                        </Text>
                      ) : null}
                    </View>
                  </Animated.View>
                ))
              )}
            </Card>

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { fontSize: 22, fontWeight: '700' },
  headerSub: { marginTop: 4, fontSize: 13 },
  blockTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  blockSub: { marginTop: 6, fontSize: 12, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 13, textAlign: 'center' },
  pill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  pillText: { fontSize: 13, fontWeight: '800' },
  row: { paddingVertical: 4 },
  rowTitle: { fontSize: 13, fontWeight: '800' },
  rowSub: { marginTop: 6, fontSize: 12 },
  rowMeta: { marginTop: 6, fontSize: 12, fontWeight: '700' },
});
