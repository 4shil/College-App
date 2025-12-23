import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
import { useRBAC, PERMISSIONS } from '../../../hooks/useRBAC';

interface StudentLookup {
  student_id: string;
  admission_no: string;
  student_name: string | null;
  phone: string | null;
  department_name: string | null;
  department_code: string | null;
  year_name: string | null;
  year_number: number | null;
}

interface GatePass {
  id: string;
  reason: string | null;
  approved_at: string | null;
  exit_marked_at: string | null;
  closed_at: string | null;
}

export default function GatePassVerificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const { hasPermission } = useRBAC();

  const [admissionNo, setAdmissionNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState<StudentLookup | null>(null);
  const [passes, setPasses] = useState<GatePass[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canMarkExit = hasPermission(PERMISSIONS.RECEPTION_MARK_GATE_PASS_EXIT);

  const fetchApprovedPasses = useCallback(async (studentId: string) => {
    const { data, error: passError } = await supabase
      .from('reception_gate_passes')
      .select('id, reason, approved_at, exit_marked_at, closed_at')
      .eq('student_id', studentId)
      .not('approved_at', 'is', null)
      .is('closed_at', null)
      .order('approved_at', { ascending: false });

    if (passError) throw passError;
    setPasses((data || []) as GatePass[]);
  }, []);

  const onSearch = useCallback(async () => {
    const trimmed = admissionNo.trim();
    if (!trimmed) {
      setError('Enter Admission Number');
      return;
    }

    setLoading(true);
    setError(null);
    setStudent(null);
    setPasses([]);

    try {
      const { data, error: studentError } = await supabase.rpc('reception_get_student_by_admission_no', {
        p_admission_no: trimmed,
      });

      if (studentError) throw studentError;
      const found = (Array.isArray(data) ? data[0] : data) as StudentLookup | undefined;
      if (!found?.student_id) {
        throw new Error('Student not found');
      }

      setStudent(found);
      await fetchApprovedPasses(found.student_id);
    } catch (e: any) {
      setError(e?.message || 'Failed to search');
    } finally {
      setLoading(false);
    }
  }, [admissionNo, fetchApprovedPasses]);

  const markExitNow = useCallback(
    async (passId: string) => {
      if (!user?.id) {
        Alert.alert('Error', 'Not logged in');
        return;
      }

      Alert.alert('Confirm', 'Mark EXIT time and close this pass?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark EXIT',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);

              const { data, error: rpcError } = await supabase.rpc('reception_close_gate_pass', {
                p_pass_id: passId,
              });

              if (rpcError) throw rpcError;
              const result = Array.isArray(data) ? data[0] : data;
              if (!result?.success) {
                throw new Error(result?.message || 'Failed to close gate pass');
              }

              if (student?.student_id) {
                await fetchApprovedPasses(student.student_id);
              }

              Alert.alert('Done', result?.message || 'Gate pass closed');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to update');
            } finally {
              setLoading(false);
            }
          },
        },
      ]);
    },
    [fetchApprovedPasses, student?.student_id, user?.id]
  );

  return (
    <Restricted
      module="reception"
      permissions={PERMISSIONS.RECEPTION_VIEW_APPROVED_GATE_PASSES}
      showDeniedMessage
      deniedMessage="You do not have access to Gate Pass verification."
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
              <Text style={[styles.title, { color: colors.textPrimary }]}>Gate Pass Verification</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Approved only • Admission Number required</Text>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Card>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Admission Number</Text>
              <View style={{ height: 10 }} />
              <GlassInput
                placeholder="e.g., JPM2023CSE001"
                value={admissionNo}
                onChangeText={setAdmissionNo}
                autoCapitalize="characters"
                autoCorrect={false}
                icon="id-card"
                returnKeyType="search"
                onSubmitEditing={onSearch}
              />
              <View style={{ height: 12 }} />
              <PrimaryButton
                title={loading ? 'Searching...' : 'Search'}
                onPress={onSearch}
                loading={loading}
                disabled={loading}
                icon={<FontAwesome5 name="search" size={16} color={colors.textInverse} />}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              ) : null}
            </Card>
          </Animated.View>

          {student && (
            <Animated.View entering={FadeInDown.delay(120).springify()}>
              <Card>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Student</Text>
                <View style={{ height: 10 }} />

                <View style={styles.kvRow}>
                  <Text style={[styles.kLabel, { color: colors.textSecondary }]}>Name</Text>
                  <Text style={[styles.kValue, { color: colors.textPrimary }]}>{student.student_name || '—'}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={[styles.kLabel, { color: colors.textSecondary }]}>Admission No</Text>
                  <Text style={[styles.kValue, { color: colors.textPrimary }]}>{student.admission_no}</Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={[styles.kLabel, { color: colors.textSecondary }]}>Department</Text>
                  <Text style={[styles.kValue, { color: colors.textPrimary }]}>
                    {student.department_name ? `${student.department_name}${student.department_code ? ` (${student.department_code})` : ''}` : '—'}
                  </Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={[styles.kLabel, { color: colors.textSecondary }]}>Year</Text>
                  <Text style={[styles.kValue, { color: colors.textPrimary }]}>{student.year_name || '—'}</Text>
                </View>
              </Card>
            </Animated.View>
          )}

          {student && (
            <Animated.View entering={FadeInDown.delay(160).springify()}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Approved Gate Passes</Text>
              <View style={{ height: 10 }} />

              {loading && passes.length === 0 ? (
                <View style={styles.center}>
                  <LoadingIndicator color={colors.primary} />
                </View>
              ) : passes.length === 0 ? (
                <Card>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No approved open passes found.</Text>
                </Card>
              ) : (
                passes.map((p) => (
                  <Card key={p.id}>
                    <View style={styles.passHeader}>
                      <Text style={[styles.passTitle, { color: colors.textPrimary }]}>Gate Pass</Text>
                      <View style={[styles.badge, { backgroundColor: colors.inputBackground, borderRadius: colors.borderRadius }]}
                      >
                        <Text style={[styles.badgeText, { color: colors.textSecondary }]}>APPROVED</Text>
                      </View>
                    </View>

                    <Text style={[styles.passReason, { color: colors.textSecondary }]}>
                      {p.reason?.trim() ? p.reason : '—'}
                    </Text>

                    <View style={{ height: 12 }} />
                    <View style={styles.kvRow}>
                      <Text style={[styles.kLabel, { color: colors.textSecondary }]}>Approved At</Text>
                      <Text style={[styles.kValue, { color: colors.textPrimary }]}> {p.approved_at ? new Date(p.approved_at).toLocaleString() : '—'}</Text>
                    </View>
                    <View style={styles.kvRow}>
                      <Text style={[styles.kLabel, { color: colors.textSecondary }]}>Exit At</Text>
                      <Text style={[styles.kValue, { color: colors.textPrimary }]}> {p.exit_marked_at ? new Date(p.exit_marked_at).toLocaleString() : '—'}</Text>
                    </View>

                    <View style={{ height: 12 }} />
                    <PrimaryButton
                      title={p.exit_marked_at ? 'Exit Marked' : 'Mark EXIT & Close'}
                      onPress={() => markExitNow(p.id)}
                      disabled={!canMarkExit || loading || !!p.exit_marked_at}
                      loading={loading}
                      icon={<FontAwesome5 name="door-open" size={16} color={colors.textInverse} />}
                    />

                    {!canMarkExit ? (
                      <Text style={[styles.hintText, { color: colors.textSecondary }]}>You don’t have permission to mark exit.</Text>
                    ) : null}
                  </Card>
                ))
              )}
            </Animated.View>
          )}
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
  label: { fontSize: 13 },
  errorText: { marginTop: 10, fontSize: 13 },
  sectionTitle: { marginTop: 18, fontSize: 16, fontWeight: '700' },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  kLabel: { fontSize: 13, flex: 1 },
  kValue: { fontSize: 13, flex: 1, textAlign: 'right' },
  emptyText: { fontSize: 13 },
  center: { paddingVertical: 18, alignItems: 'center' },
  passHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  passTitle: { fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  passReason: { marginTop: 10, fontSize: 13, lineHeight: 18 },
  hintText: { marginTop: 10, fontSize: 12 },
});
