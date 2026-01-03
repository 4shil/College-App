import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

type DepartmentRow = { id: string; name: string };

type DepartmentTeacherRow = {
  id: string;
  profiles?: { full_name: string } | null;
  department_id: string | null;
};

type SubstitutionRow = {
  id: string;
  date: string;
  status: string;
  reason: string | null;
  timetable_entry_id: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
};

type TimetableMeta = {
  id: string;
  period: number;
  section_id?: string;
  program_id?: string;
  department_id?: string;
};

export default function TeacherDepartmentScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [departmentTeachers, setDepartmentTeachers] = useState<DepartmentTeacherRow[]>([]);
  const [pendingSubs, setPendingSubs] = useState<SubstitutionRow[]>([]);
  const [actingId, setActingId] = useState<string>('');

  const [subPeriodByEntryId, setSubPeriodByEntryId] = useState<Record<string, number>>({});

  const fetchMyDepartments = useCallback(async () => {
    if (!user?.id) {
      setDepartments([]);
      return;
    }

    const { data, error } = await supabase.from('departments').select('id, name').eq('hod_user_id', user.id);
    if (error) {
      console.log('Department fetch departments error:', error.message);
      setDepartments([]);
      return;
    }

    setDepartments((data || []) as any as DepartmentRow[]);
  }, [user?.id]);

  const fetchDepartmentTeachers = useCallback(async () => {
    const deptIds = departments.map((d) => d.id);
    if (deptIds.length === 0) {
      setDepartmentTeachers([]);
      return;
    }

    const { data, error } = await supabase
      .from('teachers')
      .select('id, department_id, profiles:user_id(full_name)')
      .in('department_id', deptIds)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.log('Department teachers error:', error.message);
      setDepartmentTeachers([]);
      return;
    }

    setDepartmentTeachers((data || []) as any as DepartmentTeacherRow[]);
  }, [departments]);

  const fetchPendingSubstitutions = useCallback(async () => {
    const deptIds = departments.map((d) => d.id);
    if (deptIds.length === 0) {
      setPendingSubs([]);
      return;
    }

    const { data: subsData, error: subsError } = await supabase
      .from('substitutions')
      .select('id, date, status, reason, timetable_entry_id, approved_by, approved_at, created_at')
      .eq('status', 'pending')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (subsError) {
      console.log('Department pending substitutions error:', subsError.message);
      setPendingSubs([]);
      return;
    }

    const list = (subsData || []) as any as SubstitutionRow[];
    const entryIds = Array.from(new Set(list.map((s) => s.timetable_entry_id).filter(Boolean)));

    let metaById = new Map<string, TimetableMeta>();

    // Preferred: timetable_entries.section_id -> sections.department_id
    const { data: teSectionData, error: teSectionError } = await supabase
      .from('timetable_entries')
      .select('id, period, section_id')
      .in('id', entryIds);

    if (!teSectionError) {
      const metas = (teSectionData || []) as any as TimetableMeta[];
      const sectionIds = Array.from(new Set(metas.map((m) => m.section_id).filter(Boolean))) as string[];

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('id, department_id')
        .in('id', sectionIds);

      const deptBySection = new Map<string, string>();
      if (!sectionsError) {
        (sectionsData || []).forEach((row: any) => deptBySection.set(row.id, row.department_id));
      }

      metas.forEach((m) => {
        const department_id = m.section_id ? deptBySection.get(m.section_id) : undefined;
        metaById.set(m.id, { ...m, department_id });
      });
    } else {
      // Fallback: timetable_entries.program_id -> courses.department_id (programs table removed)
      const { data: teProgramData, error: teProgramError } = await supabase
        .from('timetable_entries')
        .select('id, period, program_id')
        .in('id', entryIds);

      if (teProgramError) {
        console.log('Department timetable meta error:', teProgramError.message);
      } else {
        const metas = (teProgramData || []) as any as TimetableMeta[];
        const programmeIds = Array.from(new Set(metas.map((m) => m.program_id).filter(Boolean))) as string[];
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, department_id')
          .in('id', programmeIds);

        const deptByProgramme = new Map<string, string>();
        if (!coursesError) {
          (coursesData || []).forEach((row: any) => deptByProgramme.set(row.id, row.department_id));
        }

        metas.forEach((m) => {
          const department_id = m.program_id ? deptByProgramme.get(m.program_id) : undefined;
          metaById.set(m.id, { ...m, department_id });
        });
      }
    }

    const filtered = list.filter((s) => {
      const deptId = metaById.get(s.timetable_entry_id)?.department_id;
      return deptId ? deptIds.includes(deptId) : false;
    });

    const nextPeriods: Record<string, number> = {};
    metaById.forEach((m) => {
      if (typeof m.period === 'number') nextPeriods[m.id] = m.period;
    });
    setSubPeriodByEntryId(nextPeriods);

    setPendingSubs(filtered);
  }, [departments]);

  const actOnSubstitution = async (id: string, nextStatus: 'approved' | 'rejected') => {
    if (!user?.id) return;
    try {
      setActingId(id);
      const payload = {
        status: nextStatus,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('substitutions').update(payload).eq('id', id);
      if (error) throw error;

      await fetchPendingSubstitutions();
    } catch (e: any) {
      console.log('Department act substitution error:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to update substitution');
    } finally {
      setActingId('');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMyDepartments();
      setLoading(false);
    };
    init();
  }, [fetchMyDepartments]);

  useEffect(() => {
    fetchDepartmentTeachers();
  }, [fetchDepartmentTeachers]);

  useEffect(() => {
    fetchPendingSubstitutions();
  }, [fetchPendingSubstitutions]);

  const myDepartments = useMemo(() => departments.map((d) => d.name), [departments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMyDepartments(), fetchDepartmentTeachers(), fetchPendingSubstitutions()]);
    setRefreshing(false);
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Department</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {myDepartments.length > 0 ? `HoD of: ${myDepartments.join(', ')}` : 'Department overview'}
          </Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading department…</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Departments</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Departments where you are HoD</Text>

              <View style={{ height: 12 }} />
              {departments.length === 0 ? (
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>No HoD department found.</Text>
              ) : (
                departments.map((d, idx) => (
                  <Animated.View key={d.id} entering={FadeInDown.delay(idx * 15).duration(220)} style={{ marginBottom: 10 }}>
                    <View style={styles.row}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{d.name}</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>Active</Text>
                    </View>
                  </Animated.View>
                ))
              )}
            </Card>

            <View style={{ height: 12 }} />

            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Pending substitutions</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Approve or reject</Text>

              <View style={{ height: 12 }} />
              {pendingSubs.length === 0 ? (
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>No pending substitutions.</Text>
              ) : (
                pendingSubs.map((s, idx) => (
                  <Animated.View key={s.id} entering={FadeInDown.delay(idx * 12).duration(220)} style={{ marginBottom: 12 }}>
                    <View style={styles.subRow}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                        {s.date}
                        {typeof subPeriodByEntryId[s.timetable_entry_id] === 'number'
                          ? ` • P${subPeriodByEntryId[s.timetable_entry_id]}`
                          : ''}
                      </Text>
                      {s.reason ? (
                        <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>
                          {s.reason}
                        </Text>
                      ) : null}

                      <View style={styles.actionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={actingId === s.id}
                          onPress={() => actOnSubstitution(s.id, 'approved')}
                          style={[
                            styles.actionBtn,
                            { borderColor: withAlpha(colors.primary, 0.35), backgroundColor: withAlpha(colors.primary, 0.12) },
                          ]}
                        >
                          <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                            {actingId === s.id ? 'Working…' : 'Approve'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          disabled={actingId === s.id}
                          onPress={() => actOnSubstitution(s.id, 'rejected')}
                          style={[
                            styles.actionBtn,
                            { borderColor: withAlpha(colors.cardBorder, 0.6), backgroundColor: withAlpha(colors.cardBackground, 0.18) },
                          ]}
                        >
                          <Text style={[styles.actionText, { color: colors.textPrimary }]}>
                            {actingId === s.id ? 'Working…' : 'Reject'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animated.View>
                ))
              )}
            </Card>

            <View style={{ height: 12 }} />

            <Card>
              <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Teachers</Text>
              <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Visible teacher list</Text>

              <View style={{ height: 12 }} />
              {departmentTeachers.length === 0 ? (
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>No teacher rows visible (or blocked by RLS).</Text>
              ) : (
                departmentTeachers.slice(0, 40).map((t, idx) => (
                  <Animated.View key={t.id} entering={FadeInDown.delay(idx * 12).duration(220)} style={{ marginBottom: 10 }}>
                    <View style={styles.row}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{t.profiles?.full_name || 'Teacher'}</Text>
                      <Text style={[styles.rowSub, { color: colors.textSecondary }]}>{t.department_id || '—'}</Text>
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
  emptySub: { fontSize: 13, textAlign: 'center' },
  row: { paddingVertical: 4 },
  subRow: { paddingVertical: 4 },
  rowTitle: { fontSize: 13, fontWeight: '800' },
  rowSub: { marginTop: 6, fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '800' },
});
