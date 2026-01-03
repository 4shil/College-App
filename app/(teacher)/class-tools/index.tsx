import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';

type AcademicYearRow = { id: string; name: string; is_current: boolean };

type SectionRow = {
  id: string;
  name: string;
  department_id: string;
  year_id: string;
  academic_year_id: string;
  years?: { name: string } | null;
  departments?: { name: string; code: string } | null;
};

type StudentRow = {
  id: string;
  registration_number: string;
  roll_number: string | null;
  user_id: string;
  profiles?: { full_name: string } | null;
};

export default function TeacherClassToolsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [academicYear, setAcademicYear] = useState<AcademicYearRow | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [students, setStudents] = useState<StudentRow[]>([]);

  const fetchAcademicYear = useCallback(async () => {
    const { data, error } = await supabase
      .from('academic_years')
      .select('id, name, is_current')
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (error) {
      console.log('Class tools academic year error:', error.message);
      setAcademicYear(null);
      return;
    }

    const list = (data || []) as AcademicYearRow[];
    const current = list.find((a) => a.is_current) || list[0] || null;
    setAcademicYear(current);
  }, []);

  const fetchSections = useCallback(async () => {
    if (!user?.id) return;
    if (!academicYear?.id) return;

    const { data, error } = await supabase
      .from('sections')
      .select('id, name, department_id, year_id, academic_year_id, years(name), departments(name, code)')
      .eq('academic_year_id', academicYear.id)
      .eq('class_teacher_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.log('Class tools sections error:', error.message);
      setSections([]);
      return;
    }

    const list = (data || []) as any as SectionRow[];
    setSections(list);

    if (!selectedSectionId) {
      setSelectedSectionId(list[0]?.id || '');
    } else if (list.length > 0 && !list.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(list[0].id);
    }
  }, [academicYear?.id, selectedSectionId, user?.id]);

  const fetchStudents = useCallback(async () => {
    if (!selectedSectionId) {
      setStudents([]);
      return;
    }

    const { data, error } = await supabase
      .from('students')
      .select('id, registration_number, roll_number, user_id, profiles:user_id(full_name)')
      .eq('section_id', selectedSectionId)
      .eq('current_status', 'active')
      .order('roll_number');

    if (error) {
      console.log('Class tools students error:', error.message);
      setStudents([]);
      return;
    }

    setStudents((data || []) as any as StudentRow[]);
  }, [selectedSectionId]);

  const selectedSection = useMemo(() => sections.find((s) => s.id === selectedSectionId) || null, [sections, selectedSectionId]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchAcademicYear();
    setLoading(false);
  }, [fetchAcademicYear]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!academicYear?.id) return;
    fetchSections();
  }, [academicYear?.id, fetchSections]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAcademicYear(), fetchSections(), fetchStudents()]);
    setRefreshing(false);
  };

  const headerTitle = selectedSection
    ? `${selectedSection.departments?.code || 'Dept'} • ${selectedSection.years?.name || 'Year'} • ${selectedSection.name}`
    : 'Your class';

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Class Tools</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{headerTitle}</Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading class…</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {sections.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No class assigned</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to set class teacher for a section.</Text>
              </Card>
            ) : (
              <>
                <Card>
                  <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Students</Text>
                  <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Active students in your class</Text>

                  <View style={{ height: 12 }} />

                  {students.length === 0 ? (
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>No students found.</Text>
                  ) : (
                    students.map((s, idx) => (
                      <Animated.View key={s.id} entering={FadeInDown.delay(idx * 25).duration(250)} style={{ marginBottom: 10 }}>
                        <View style={styles.studentRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
                              {s.profiles?.full_name || s.registration_number}
                            </Text>
                            <Text style={[styles.studentMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                              {s.roll_number || s.registration_number}
                            </Text>
                          </View>
                        </View>
                      </Animated.View>
                    ))
                  )}
                </Card>

                <View style={{ height: 12 }} />

                <Card>
                  <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Notes</Text>
                  <Text style={[styles.blockSub, { color: colors.textSecondary }]}>This is the initial Class Teacher module (read-only roster).</Text>
                  <View style={{ height: 8 }} />
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    Next: attendance summary, parent contacts, leave approvals (if required).
                  </Text>
                </Card>
              </>
            )}

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
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, textAlign: 'center' },
  blockTitle: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  blockSub: { marginTop: 6, fontSize: 12, textAlign: 'center' },
  studentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  studentName: { fontSize: 14, fontWeight: '700' },
  studentMeta: { marginTop: 2, fontSize: 12 },
});
