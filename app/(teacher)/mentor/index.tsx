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

type MentorAssignmentRow = {
  id: string;
  student_id: string;
  academic_year_id: string;
  students?: {
    id: string;
    registration_number: string;
    roll_number: string | null;
    user_id: string;
    profiles?: { full_name: string } | null;
  } | null;
};

type MentoringSessionRow = {
  id: string;
  mentor_assignment_id: string;
  session_date: string;
  session_type: string | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
};

export default function TeacherMentorScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<AcademicYearRow | null>(null);

  const [assignments, setAssignments] = useState<MentorAssignmentRow[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');
  const [sessions, setSessions] = useState<MentoringSessionRow[]>([]);

  const [sessionType, setSessionType] = useState('regular');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

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
      console.log('Mentor academic year error:', error.message);
      setAcademicYear(null);
      return;
    }

    const list = (data || []) as AcademicYearRow[];
    const current = list.find((a) => a.is_current) || list[0] || null;
    setAcademicYear(current);
  }, []);

  const fetchAssignments = useCallback(async () => {
    if (!teacherId || !academicYear?.id) return;

    const { data, error } = await supabase
      .from('mentor_assignments')
      .select(
        `
        id,
        student_id,
        academic_year_id,
        students(id, registration_number, roll_number, user_id, profiles:user_id(full_name))
      `
      )
      .eq('mentor_id', teacherId)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Mentor assignments error:', error.message);
      setAssignments([]);
      return;
    }

    const list = (data || []) as any as MentorAssignmentRow[];
    setAssignments(list);

    if (!selectedAssignmentId) {
      setSelectedAssignmentId(list[0]?.id || '');
    } else if (list.length > 0 && !list.some((a) => a.id === selectedAssignmentId)) {
      setSelectedAssignmentId(list[0].id);
    }
  }, [academicYear?.id, selectedAssignmentId, teacherId]);

  const fetchSessions = useCallback(async () => {
    if (!selectedAssignmentId) {
      setSessions([]);
      return;
    }

    const { data, error } = await supabase
      .from('mentoring_sessions')
      .select('id, mentor_assignment_id, session_date, session_type, notes, follow_up_date, created_at')
      .eq('mentor_assignment_id', selectedAssignmentId)
      .order('session_date', { ascending: false })
      .limit(30);

    if (error) {
      console.log('Mentor sessions error:', error.message);
      setSessions([]);
      return;
    }

    setSessions((data || []) as any as MentoringSessionRow[]);
  }, [selectedAssignmentId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const tId = await fetchTeacherId();
      setTeacherId(tId);
      await fetchAcademicYear();
      setLoading(false);
    };
    init();
  }, [fetchAcademicYear, fetchTeacherId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const selectedAssignment = useMemo(
    () => assignments.find((a) => a.id === selectedAssignmentId) || null,
    [assignments, selectedAssignmentId]
  );

  const studentLabel = selectedAssignment?.students?.profiles?.full_name || selectedAssignment?.students?.registration_number || '';

  const canCreate = Boolean(selectedAssignmentId && notes.trim().length > 0 && !saving);

  const createSession = async () => {
    if (!selectedAssignmentId) return;

    try {
      setSaving(true);
      const payload = {
        mentor_assignment_id: selectedAssignmentId,
        session_date: new Date().toISOString().slice(0, 10),
        session_type: sessionType.trim() || null,
        notes: notes.trim(),
        follow_up_date: followUpDate.trim() ? followUpDate.trim() : null,
      };

      const { error } = await supabase.from('mentoring_sessions').insert(payload);
      if (error) throw error;

      setNotes('');
      setFollowUpDate('');
      await fetchSessions();
      Alert.alert('Saved', 'Mentoring note added');
    } catch (e: any) {
      console.log('Mentor create session error:', e?.message || e);
      Alert.alert('Error', e?.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAcademicYear(), fetchAssignments(), fetchSessions()]);
    setRefreshing(false);
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Mentor</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {academicYear?.name ? `${academicYear.name} • ` : ''}
            {studentLabel ? studentLabel : 'Your mentees'}
          </Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading mentor…</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {assignments.length === 0 ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No mentees assigned</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to assign mentor students.</Text>
              </Card>
            ) : (
              <>
                <Card>
                  <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Mentees</Text>
                  <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Tap to view/add notes</Text>
                  <View style={{ height: 10 }} />

                  {assignments.map((a, idx) => {
                    const isSelected = a.id === selectedAssignmentId;
                    const label = a.students?.profiles?.full_name || a.students?.registration_number || 'Student';
                    const meta = a.students?.roll_number || a.students?.registration_number || '';

                    return (
                      <Animated.View key={a.id} entering={FadeInDown.delay(idx * 20).duration(240)} style={{ marginBottom: 10 }}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setSelectedAssignmentId(a.id)}
                          style={[
                            styles.menteeRow,
                            {
                              borderColor: isSelected ? withAlpha(colors.primary, 0.35) : withAlpha(colors.cardBorder, 0.7),
                              backgroundColor: isSelected
                                ? withAlpha(colors.primary, isDark ? 0.18 : 0.08)
                                : withAlpha(colors.cardBackground, 0.2),
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.menteeName, { color: colors.textPrimary }]} numberOfLines={1}>
                              {label}
                            </Text>
                            <Text style={[styles.menteeMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                              {meta}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </Card>

                <View style={{ height: 12 }} />

                <Card>
                  <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Add mentoring note</Text>
                  <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Saved as a mentoring session</Text>

                  <View style={{ height: 12 }} />
                  <Text style={[styles.label, { color: colors.textMuted }]}>Type</Text>
                  <GlassInput value={sessionType} onChangeText={setSessionType} placeholder="regular" />

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textMuted }]}>Notes</Text>
                  <GlassInput value={notes} onChangeText={setNotes} placeholder="Write notes" multiline />

                  <View style={{ height: 10 }} />
                  <Text style={[styles.label, { color: colors.textMuted }]}>Follow up date (YYYY-MM-DD, optional)</Text>
                  <GlassInput value={followUpDate} onChangeText={setFollowUpDate} placeholder="2026-01-15" />

                  <View style={{ height: 12 }} />
                  <PrimaryButton title={saving ? 'Saving…' : 'Save Note'} onPress={createSession} disabled={!canCreate} />
                </Card>

                <View style={{ height: 12 }} />

                <Card>
                  <Text style={[styles.blockTitle, { color: colors.textPrimary }]}>Recent notes</Text>
                  <Text style={[styles.blockSub, { color: colors.textSecondary }]}>Last 30 sessions</Text>

                  <View style={{ height: 12 }} />
                  {sessions.length === 0 ? (
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>No notes yet.</Text>
                  ) : (
                    sessions.map((s, idx) => (
                      <Animated.View key={s.id} entering={FadeInDown.delay(idx * 15).duration(220)} style={{ marginBottom: 10 }}>
                        <View style={styles.sessionRow}>
                          <Text style={[styles.sessionTitle, { color: colors.textPrimary }]}>
                            {s.session_type || 'session'} • {s.session_date}
                          </Text>
                          {s.notes ? (
                            <Text style={[styles.sessionNotes, { color: colors.textSecondary }]} numberOfLines={4}>
                              {s.notes}
                            </Text>
                          ) : null}
                          {s.follow_up_date ? (
                            <Text style={[styles.sessionMeta, { color: colors.textMuted }]}>
                              Follow up: {s.follow_up_date}
                            </Text>
                          ) : null}
                        </View>
                      </Animated.View>
                    ))
                  )}
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
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  menteeRow: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  menteeName: { fontSize: 14, fontWeight: '800' },
  menteeMeta: { marginTop: 2, fontSize: 12 },
  sessionRow: { paddingVertical: 4 },
  sessionTitle: { fontSize: 13, fontWeight: '800' },
  sessionNotes: { marginTop: 6, fontSize: 12 },
  sessionMeta: { marginTop: 6, fontSize: 12, fontWeight: '700' },
});
