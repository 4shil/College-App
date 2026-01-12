import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { withAlpha } from '../../../theme/colorUtils';

type LeaveRow = {
  id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | string;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};

function isValidISODate(value: string) {
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

function shortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentLeaveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [classTeacherName, setClassTeacherName] = useState<string | null>(null);

  const [leaves, setLeaves] = useState<LeaveRow[]>([]);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchContext = useCallback(async () => {
    if (!user?.id) return;

    const student = await getStudentByUserId(user.id);
    if (!student?.id) {
      setStudentId(null);
      setSectionId(null);
      setClassTeacherName(null);
      return;
    }

    setStudentId(student.id);
    setSectionId(student.section_id || null);

    if (!student.section_id) {
      setClassTeacherName(null);
      return;
    }

    const { data: sectionRow, error: sectionError } = await supabase
      .from('sections')
      .select('class_teacher_id')
      .eq('id', student.section_id)
      .maybeSingle();

    if (sectionError) {
      console.log('Student leave section error:', sectionError.message);
      setClassTeacherName(null);
      return;
    }

    const ctId = (sectionRow as any)?.class_teacher_id as string | null;
    if (!ctId) {
      setClassTeacherName(null);
      return;
    }

    const { data: ctProfile, error: ctError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', ctId)
      .maybeSingle();

    if (ctError) {
      console.log('Student leave class teacher profile error:', ctError.message);
      setClassTeacherName(null);
      return;
    }

    setClassTeacherName((ctProfile as any)?.full_name || null);
  }, [user?.id]);

  const fetchLeaves = useCallback(async (sId: string) => {
    const { data, error } = await supabase
      .from('student_leave_applications')
      .select('id, from_date, to_date, reason, status, created_at, reviewed_at, rejection_reason')
      .eq('student_id', sId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Student leave list error:', error.message);
      setLeaves([]);
      return;
    }

    setLeaves((data || []) as any);
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    await fetchContext();

    const student = await getStudentByUserId(user.id);
    if (student?.id) {
      await fetchLeaves(student.id);
    } else {
      setLeaves([]);
    }

    setLoading(false);
  }, [fetchContext, fetchLeaves, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const submit = async () => {
    if (!user?.id) return;
    if (!studentId || !sectionId) {
      Alert.alert('Error', 'Student profile not linked to a section.');
      return;
    }

    const f = fromDate.trim();
    const t = toDate.trim();
    const r = reason.trim();

    if (!isValidISODate(f) || !isValidISODate(t)) {
      Alert.alert('Invalid date', 'Please use YYYY-MM-DD format.');
      return;
    }

    if (new Date(t).getTime() < new Date(f).getTime()) {
      Alert.alert('Invalid range', 'To date must be after From date.');
      return;
    }

    if (r.length < 5) {
      Alert.alert('Reason required', 'Please enter a short reason.');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('student_leave_applications').insert({
        student_id: studentId,
        section_id: sectionId,
        from_date: f,
        to_date: t,
        reason: r,
      } as any);

      if (error) {
        console.log('Student leave create error:', error.message);
        Alert.alert('Error', error.message);
        return;
      }

      setFromDate('');
      setToDate('');
      setReason('');
      Alert.alert('Submitted', 'Your leave request was sent to your class teacher.');
      await fetchLeaves(studentId);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (leaveId: string) => {
    if (!studentId) return;

    Alert.alert('Cancel request?', 'This will mark the request as cancelled.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('student_leave_applications')
            .update({ status: 'cancelled' })
            .eq('id', leaveId);

          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          await fetchLeaves(studentId);
        },
      },
    ]);
  };

  const pendingCount = useMemo(() => leaves.filter((l) => l.status === 'pending').length, [leaves]);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Leave Application</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {classTeacherName ? `Class teacher: ${classTeacherName}` : 'Class teacher will review your request'}
            </Text>
          </View>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading…</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          >
            {!studentId ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
              </Card>
            ) : (
              <>
                <Card>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Apply for leave</Text>
                  <Text style={[styles.helper, { color: colors.textMuted }]}>Use date format YYYY-MM-DD.</Text>

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textSecondary }]}>From</Text>
                  <GlassInput value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textSecondary }]}>To</Text>
                  <GlassInput value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Reason</Text>
                  <GlassInput value={reason} onChangeText={setReason} placeholder="Reason (sick, family, etc.)" />

                  <View style={{ height: 14 }} />
                  <PrimaryButton
                    title={submitting ? 'Submitting…' : 'Submit to Class Teacher'}
                    onPress={submit}
                    disabled={submitting}
                    variant="primary"
                    size="medium"
                  />
                </Card>

                <View style={{ marginTop: 14, marginBottom: 10 }}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My requests</Text>
                  <Text style={[styles.helper, { color: colors.textMuted }]}>
                    {pendingCount} pending • {leaves.length} total
                  </Text>
                </View>

                {leaves.length === 0 ? (
                  <Card>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No requests</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>Your leave requests will appear here.</Text>
                  </Card>
                ) : (
                  leaves.map((l, idx) => {
                    const status = String(l.status || 'pending');
                    const chipBg =
                      status === 'approved'
                        ? withAlpha(colors.success, isDark ? 0.18 : 0.12)
                        : status === 'rejected'
                          ? withAlpha(colors.error, isDark ? 0.18 : 0.12)
                          : status === 'cancelled'
                            ? withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08)
                            : withAlpha(colors.warning, isDark ? 0.18 : 0.12);

                    const chipText =
                      status === 'approved'
                        ? colors.success
                        : status === 'rejected'
                          ? colors.error
                          : status === 'cancelled'
                            ? colors.textMuted
                            : colors.warning;

                    return (
                      <Animated.View
                        key={l.id}
                        entering={FadeInDown.delay(idx * 25).duration(260)}
                        style={{ marginBottom: 12 }}
                      >
                        <Card>
                          <View style={styles.rowTop}>
                            <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                              {shortDate(l.from_date)} → {shortDate(l.to_date)}
                            </Text>
                            <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
                              <Text style={[styles.statusText, { color: chipText }]}>{status.toUpperCase()}</Text>
                            </View>
                          </View>

                          <Text style={[styles.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>
                            {l.reason}
                          </Text>

                          {status === 'rejected' && l.rejection_reason ? (
                            <Text style={[styles.rejection, { color: colors.error }]}>
                              Rejection: {l.rejection_reason}
                            </Text>
                          ) : null}

                          <View style={styles.rowFooter}>
                            <Text style={[styles.meta, { color: colors.textMuted }]}>Created {shortDate(l.created_at)}</Text>
                            {status === 'pending' ? (
                              <TouchableOpacity onPress={() => cancelRequest(l.id)} activeOpacity={0.85}>
                                <Text style={[styles.cancelText, { color: colors.error }]}>Cancel</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </Card>
                      </Animated.View>
                    );
                  })
                )}
              </>
            )}

            <View style={{ height: 16 }} />
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
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  helper: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '900',
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },
  rowSub: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  rejection: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '800',
  },
  rowFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    fontSize: 11,
    fontWeight: '700',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
