import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnimatedBackground, Card, GlassInput, LoadingIndicator, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { useAuthStore } from '../../../../store/authStore';
import { supabase } from '../../../../lib/supabase';
import { withAlpha } from '../../../../theme/colorUtils';

type LeaveDetails = {
  id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  student?: {
    registration_number: string;
    roll_number: string | null;
    profiles?: { full_name: string } | null;
  } | null;
};

function prettyDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TeacherLeaveRequestDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const leaveId = String((params as any)?.id || '');

  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [row, setRow] = useState<LeaveDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchOne = useCallback(async () => {
    if (!leaveId) return;

    const { data, error } = await supabase
      .from('student_leave_applications')
      .select(
        `id, from_date, to_date, reason, status, created_at, reviewed_at, rejection_reason,
         student:students!student_leave_applications_student_id_fkey(registration_number, roll_number, profiles:user_id(full_name))`
      )
      .eq('id', leaveId)
      .single();

    if (error) {
      console.log('Leave request details error:', error.message);
      setRow(null);
      return;
    }

    const d = data as any as LeaveDetails;
    setRow(d);
    setRejectionReason(d.rejection_reason || '');
  }, [leaveId]);

  const load = useCallback(async () => {
    setLoading(true);
    await fetchOne();
    setLoading(false);
  }, [fetchOne]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOne();
    setRefreshing(false);
  };

  const canReview = useMemo(() => {
    if (!user?.id) return false;
    if (!row) return false;
    return String(row.status) === 'pending' && !saving;
  }, [row, saving, user?.id]);

  const approve = async () => {
    if (!user?.id || !row) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('student_leave_applications')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', row.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Approved', 'Leave request approved.');
      await fetchOne();
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    if (!user?.id || !row) return;

    const reason = rejectionReason.trim();
    if (reason.length < 3) {
      Alert.alert('Reason required', 'Enter a short rejection reason.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('student_leave_applications')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', row.id);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert('Rejected', 'Leave request rejected.');
      await fetchOne();
    } finally {
      setSaving(false);
    }
  };

  const status = String(row?.status || '');
  const statusBg =
    status === 'approved'
      ? withAlpha(colors.success, isDark ? 0.18 : 0.12)
      : status === 'rejected'
        ? withAlpha(colors.error, isDark ? 0.18 : 0.12)
        : status === 'cancelled'
          ? withAlpha(colors.textPrimary, isDark ? 0.12 : 0.08)
          : withAlpha(colors.warning, isDark ? 0.18 : 0.12);

  const statusFg =
    status === 'approved'
      ? colors.success
      : status === 'rejected'
        ? colors.error
        : status === 'cancelled'
          ? colors.textMuted
          : colors.warning;

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Leave Request</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{leaveId ? `ID ${leaveId.slice(0, 8)}…` : ''}</Text>
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
            {!row ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Not found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>You may not have access to this request.</Text>
              </Card>
            ) : (
              <>
                <Card>
                  <View style={styles.rowTop}>
                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {row.student?.profiles?.full_name || 'Student'}
                    </Text>
                    <View style={[styles.statusChip, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusText, { color: statusFg }]}>{status.toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    {(row.student?.roll_number ? `Roll ${row.student.roll_number}` : row.student?.registration_number) || ''}
                  </Text>

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Dates</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>
                    {prettyDate(row.from_date)} → {prettyDate(row.to_date)}
                  </Text>

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Reason</Text>
                  <Text style={[styles.value, { color: colors.textPrimary }]}>{row.reason}</Text>

                  {row.status === 'rejected' && row.rejection_reason ? (
                    <>
                      <View style={{ height: 10 }} />
                      <Text style={[styles.label, { color: colors.error }]}>Rejection reason</Text>
                      <Text style={[styles.value, { color: colors.error }]}>{row.rejection_reason}</Text>
                    </>
                  ) : null}

                  <View style={{ height: 10 }} />
                  <Text style={[styles.meta, { color: colors.textMuted }]}>Created: {prettyDate(row.created_at)}</Text>
                  {row.reviewed_at ? (
                    <Text style={[styles.meta, { color: colors.textMuted }]}>Reviewed: {prettyDate(row.reviewed_at)}</Text>
                  ) : null}
                </Card>

                <View style={{ height: 12 }} />
                <Card>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Review</Text>
                  <Text style={[styles.helper, { color: colors.textMuted }]}>Approve or reject (pending only).</Text>

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Rejection reason (only if rejecting)</Text>
                  <GlassInput value={rejectionReason} onChangeText={setRejectionReason} placeholder="Reason" />

                  <View style={{ height: 14 }} />
                  <PrimaryButton
                    title={saving ? 'Saving…' : 'Approve'}
                    onPress={approve}
                    disabled={!canReview}
                    variant="primary"
                    size="medium"
                  />
                  <View style={{ height: 10 }} />
                  <PrimaryButton
                    title={saving ? 'Saving…' : 'Reject'}
                    onPress={reject}
                    disabled={!canReview}
                    variant="outline"
                    style={{ borderColor: colors.error }}
                    textStyle={{ color: colors.error }}
                    size="medium"
                  />
                </Card>
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
  meta: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
  },
  value: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
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
});
