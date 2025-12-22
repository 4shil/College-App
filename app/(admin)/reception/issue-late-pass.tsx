import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface StudentLookup {
  student_id: string;
  admission_no: string;
  student_name: string | null;
}

interface PeriodTiming {
  end_time: string;
}

export default function IssueLatePassScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [admissionNo, setAdmissionNo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentLookup | null>(null);
  const [cutoffEndTime, setCutoffEndTime] = useState<string | null>(null);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('period_timings')
          .select('end_time')
          .eq('period_number', 3)
          .single();

        if (error) throw error;
        setCutoffEndTime((data as PeriodTiming).end_time);
      } catch {
        setCutoffEndTime(null);
      }
    })();
  }, []);

  const isAfterCutoff = useMemo(() => {
    if (!cutoffEndTime) return false;

    const [hh, mm, ss] = cutoffEndTime.split(':').map((x) => parseInt(x, 10));
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(hh || 0, mm || 0, ss || 0, 0);
    return now.getTime() > cutoff.getTime();
  }, [cutoffEndTime]);

  const lookupStudent = useCallback(async (registrationNumber: string) => {
    const { data, error } = await supabase.rpc('reception_get_student_by_admission_no', {
      p_admission_no: registrationNumber,
    });

    if (error) throw error;
    const found = (Array.isArray(data) ? data[0] : data) as any as StudentLookup | undefined;
    if (!found?.student_id) throw new Error('Student not found');
    return found;
  }, []);

  const onIssue = useCallback(async () => {
    const trimmed = admissionNo.trim();
    if (!trimmed) {
      setError('Enter Admission Number');
      return;
    }

    if (isAfterCutoff) {
      Alert.alert('Not Allowed', 'Late Pass can be issued only until end of 3rd hour.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const s = await lookupStudent(trimmed);
      setStudent(s);

      const { data, error: rpcError } = await supabase.rpc('reception_issue_late_pass', {
        p_admission_no: trimmed,
        p_notes: notes.trim() ? notes.trim() : null,
      });

      if (rpcError) throw rpcError;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result?.success) {
        Alert.alert('Not Issued', result?.message || 'Failed to issue late pass');
        return;
      }

      Alert.alert('Issued', result?.message || 'Late Pass logged successfully.');
      setNotes('');
    } catch (e: any) {
      setError(e?.message || 'Failed to issue late pass');
    } finally {
      setLoading(false);
    }
  }, [admissionNo, isAfterCutoff, lookupStudent, notes, user?.id]);

  return (
    <Restricted
      module="reception"
      permissions={PERMISSIONS.RECEPTION_ISSUE_LATE_PASS}
      showDeniedMessage
      deniedMessage="You do not have access to issue Late Pass."
    >
      <AnimatedBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: colors.cardBackground, borderRadius: colors.borderRadius }]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Issue Late Pass</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Discipline log only • One per day</Text>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Card>
              <View style={styles.noticeRow}>
                <FontAwesome5 name="clock" size={14} color={colors.textSecondary} />
                <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                  Cutoff: end of 3rd hour{cutoffEndTime ? ` (${cutoffEndTime})` : ''}
                </Text>
              </View>

              {isAfterCutoff ? (
                <Text style={[styles.cutoffText, { color: colors.error }]}>Cutoff passed. Cannot issue now.</Text>
              ) : null}

              <View style={{ height: 14 }} />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Admission Number</Text>
              <View style={{ height: 10 }} />
              <GlassInput
                placeholder="e.g., JPM2023CSE001"
                value={admissionNo}
                onChangeText={setAdmissionNo}
                autoCapitalize="characters"
                autoCorrect={false}
                icon="id-card"
              />

              <View style={{ height: 14 }} />

              <Text style={[styles.label, { color: colors.textSecondary }]}>Reason / Notes (optional)</Text>
              <View style={{ height: 10 }} />
              <View
                style={[
                  styles.notesBox,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderRadius: colors.borderRadius,
                    borderWidth: colors.borderWidth > 0 ? colors.borderWidth : 1,
                  },
                ]}
              >
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Late arrival reason"
                  placeholderTextColor={colors.placeholder}
                  style={[styles.notesInput, { color: colors.textPrimary }]}
                  multiline
                />
              </View>

              <View style={{ height: 14 }} />
              <PrimaryButton
                title={loading ? 'Issuing...' : 'Issue Late Pass'}
                onPress={onIssue}
                loading={loading}
                disabled={loading || isAfterCutoff}
                icon={<FontAwesome5 name="check" size={16} color={colors.textInverse} />}
              />

              {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

              {loading ? (
                <View style={styles.center}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null}

              {student ? (
                <View style={{ marginTop: 14 }}>
                  <Text style={[styles.smallTitle, { color: colors.textPrimary }]}>Student</Text>
                  <Text style={[styles.smallText, { color: colors.textSecondary }]}>Name: {student.student_name || '—'}</Text>
                  <Text style={[styles.smallText, { color: colors.textSecondary }]}>Admission No: {student.admission_no}</Text>
                </View>
              ) : null}
            </Card>
          </Animated.View>
        </ScrollView>
      </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 13 },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeText: { fontSize: 13 },
  cutoffText: { marginTop: 10, fontSize: 13, fontWeight: '700' },
  label: { fontSize: 13 },
  notesBox: { paddingHorizontal: 12, paddingVertical: 10 },
  notesInput: { minHeight: 86, fontSize: 14 },
  errorText: { marginTop: 10, fontSize: 13 },
  center: { paddingTop: 14, alignItems: 'center' },
  smallTitle: { fontSize: 14, fontWeight: '700' },
  smallText: { marginTop: 4, fontSize: 13 },
});
