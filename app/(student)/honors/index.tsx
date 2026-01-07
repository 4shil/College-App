import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Animated, { FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { withAlpha } from '../../../theme/colorUtils';

type MinorRow = {
  id: string;
  available_seats: number | null;
  eligibility_criteria: string | null;
  is_active: boolean;
  courses?: { id?: string; code: string; name: string; short_name: string | null; department_id?: string; semester_id?: string } | null;
};

type RegistrationRow = {
  id: string;
  minor_subject_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | string;
  approved_at: string | null;
  created_at: string;
};

function statusTone(status: string | null | undefined) {
  if (status === 'approved' || status === 'completed') return 'success' as const;
  if (status === 'pending') return 'warning' as const;
  if (status === 'rejected') return 'error' as const;
  return 'muted' as const;
}

export default function HonorsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentId, setStudentId] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [semesterId, setSemesterId] = useState<string | null>(null);

  const [minors, setMinors] = useState<MinorRow[]>([]);
  const [registration, setRegistration] = useState<RegistrationRow | null>(null);
  const [selectedMinorId, setSelectedMinorId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;

    setError(null);
    const student = await getStudentByUserId(user.id);
    if (!student) {
      setStudentId(null);
      setAcademicYearId(null);
      setDepartmentId(null);
      setSemesterId(null);
      setMinors([]);
      setRegistration(null);
      setSelectedMinorId(null);
      return;
    }

    setStudentId(student.id);
    setAcademicYearId(student.academic_year_id);
    setDepartmentId(student.department_id);
    setSemesterId(student.semester_id);

    const { data: reg, error: regError } = await supabase
      .from('student_minor_registrations')
      .select('id, minor_subject_id, status, approved_at, created_at')
      .eq('student_id', student.id)
      .eq('academic_year_id', student.academic_year_id)
      .maybeSingle();

    if (regError) {
      console.log('Minor registration error:', regError.message);
      setRegistration(null);
    } else {
      setRegistration((reg as any) || null);
      setSelectedMinorId((reg as any)?.minor_subject_id || null);
    }

    const { data: ms, error: minorsError } = await supabase
      .from('minor_subjects')
      .select('id, available_seats, eligibility_criteria, is_active, courses(code, name, short_name, department_id, semester_id)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (minorsError) {
      setError(minorsError.message);
      setMinors([]);
      return;
    }

    const filtered = (ms || []).filter((m: any) => {
      const c = m.courses;
      if (!c) return false;
      if (departmentId && c.department_id && c.department_id !== student.department_id) return false;
      if (semesterId && c.semester_id && c.semester_id !== student.semester_id) return false;
      return true;
    });

    setMinors(filtered as any);
  }, [departmentId, semesterId, user?.id]);

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

  const selectedMinor = useMemo(() => {
    if (!selectedMinorId) return null;
    return minors.find((m) => m.id === selectedMinorId) || null;
  }, [minors, selectedMinorId]);

  const currentMinor = useMemo(() => {
    if (!registration?.minor_subject_id) return null;
    return minors.find((m) => m.id === registration.minor_subject_id) || null;
  }, [minors, registration?.minor_subject_id]);

  const canSubmit = useMemo(() => {
    if (!studentId || !academicYearId) return false;
    if (!selectedMinorId) return false;
    if (!registration) return true;
    if (registration.status === 'rejected') return true;
    return false;
  }, [academicYearId, registration, selectedMinorId, studentId]);

  const submitSelection = async () => {
    if (!user?.id) return;
    if (!studentId || !academicYearId || !selectedMinorId) return;

    setSaving(true);
    try {
      if (!registration) {
        const { error: insertError } = await supabase.from('student_minor_registrations').insert({
          student_id: studentId,
          academic_year_id: academicYearId,
          minor_subject_id: selectedMinorId,
        });
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('student_minor_registrations')
          .update({
            minor_subject_id: selectedMinorId,
            status: 'pending',
            approved_by: null,
            approved_at: null,
          })
          .eq('id', registration.id);

        if (updateError) throw updateError;
      }

      await fetchAll();
      Alert.alert('Submitted', 'Your minor selection was submitted for approval.');
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not submit selection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Honors / Minor</Text>
          <View style={{ width: 28 }} />
        </View>

        {!user?.id ? (
          <Card>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Not signed in</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Please log in to view honors/minor.</Text>
          </Card>
        ) : loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInRight.duration(300)}>
              {!!error && (
                <Card style={{ marginBottom: 12 }}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </Card>
              )}

              {!studentId ? (
                <Card>
                  <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
                </Card>
              ) : (
                <>
                  <Card style={{ marginBottom: 12 }}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Selection</Text>
                    {!registration ? (
                      <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 8 }]}>No minor selected yet.</Text>
                    ) : (
                      <View style={{ marginTop: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                            {currentMinor?.courses?.short_name || currentMinor?.courses?.code || currentMinor?.courses?.name || 'Minor'}
                          </Text>
                          {(() => {
                            const tone = statusTone(registration.status);
                            const accent =
                              tone === 'success'
                                ? colors.success
                                : tone === 'warning'
                                  ? colors.warning
                                  : tone === 'error'
                                    ? colors.error
                                    : colors.textMuted;
                            return (
                              <View style={[styles.chip, { backgroundColor: withAlpha(accent, isDark ? 0.22 : 0.12), borderColor: withAlpha(accent, 0.35) }]}>
                                <Text style={[styles.chipText, { color: accent }]}>{String(registration.status)}</Text>
                              </View>
                            );
                          })()}
                        </View>
                        {!!currentMinor?.eligibility_criteria && (
                          <Text style={[styles.rowMeta, { color: colors.textSecondary, marginTop: 8 }]} numberOfLines={3}>
                            Eligibility: {currentMinor.eligibility_criteria}
                          </Text>
                        )}
                        <Text style={[styles.rowMeta, { color: colors.textMuted, marginTop: 6 }]}>
                          Submitted {registration.created_at ? new Date(registration.created_at).toLocaleDateString() : ''}
                        </Text>
                        {registration.status === 'rejected' && (
                          <Text style={[styles.rowMeta, { color: colors.textSecondary, marginTop: 8 }]}>You can resubmit a different choice.</Text>
                        )}
                      </View>
                    )}
                  </Card>

                  <Card>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Minors</Text>
                    <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                      Choose one minor for this academic year
                    </Text>

                    {minors.length === 0 ? (
                      <Text style={[styles.emptySub, { color: colors.textMuted, marginTop: 10 }]}>No minors available for your semester.</Text>
                    ) : (
                      <View style={{ marginTop: 12 }}>
                        {minors.map((m) => {
                          const label = m.courses?.short_name || m.courses?.code || m.courses?.name || 'Minor';
                          const selected = selectedMinorId === m.id;
                          return (
                            <TouchableOpacity
                              key={m.id}
                              onPress={() => setSelectedMinorId(m.id)}
                              activeOpacity={0.85}
                              style={[
                                styles.minorRow,
                                {
                                  borderColor: selected ? withAlpha(colors.primary, 0.35) : colors.cardBorder,
                                  backgroundColor: selected
                                    ? withAlpha(colors.primary, isDark ? 0.18 : 0.1)
                                    : withAlpha(colors.cardBackground, isDark ? 0.18 : 0.08),
                                },
                              ]}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{label}</Text>
                                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>Seats: {m.available_seats ?? '-'}</Text>
                                {!!m.eligibility_criteria && (
                                  <Text style={[styles.rowMeta, { color: colors.textSecondary, marginTop: 6 }]} numberOfLines={3}>
                                    {m.eligibility_criteria}
                                  </Text>
                                )}
                              </View>
                              {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                            </TouchableOpacity>
                          );
                        })}

                        <View style={{ marginTop: 12 }}>
                          <PrimaryButton
                            title={registration ? 'Submit Change' : 'Submit Selection'}
                            onPress={submitSelection}
                            loading={saving}
                            disabled={!canSubmit || saving}
                            variant="outline"
                            size="medium"
                          />
                          {!selectedMinor && (
                            <Text style={[styles.hint, { color: colors.textMuted }]}>Select a minor to submit.</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </Card>
                </>
              )}
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rowMeta: {
    fontSize: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  minorRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  hint: {
    fontSize: 11,
    marginTop: 8,
  },
});
