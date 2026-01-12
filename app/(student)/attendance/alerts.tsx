import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';

type AttendanceAlert = {
  id: string;
  absence_date: string;
  alert_type: string;
  total_periods_scheduled: number;
  periods_absent: number;
  has_approved_leave: boolean;
  notification_sent_to_student: boolean;
  notification_sent_to_teacher: boolean;
  resolved_at: string | null;
  created_at: string;
};

function formatDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentAttendanceAlertsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AttendanceAlert[]>([]);

  const fetchStudentId = useCallback(async () => {
    if (!user?.id) return null;
    const student = await getStudentByUserId(user.id);
    return student?.id || null;
  }, [user?.id]);

  const fetchAlerts = useCallback(async (sId: string) => {
    const { data, error } = await supabase
      .from('attendance_alerts')
      .select('*')
      .eq('student_id', sId)
      .order('absence_date', { ascending: false })
      .limit(50);

    if (error) {
      console.log('Student attendance alerts error:', error.message);
      setAlerts([]);
      return;
    }

    setAlerts((data || []) as AttendanceAlert[]);
  }, []);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;

    const sId = studentId || (await fetchStudentId());
    setStudentId(sId);

    if (!sId) {
      setAlerts([]);
      return;
    }

    await fetchAlerts(sId);
  }, [fetchAlerts, fetchStudentId, studentId, user?.id]);

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

  const unresolvedAlerts = alerts.filter(a => !a.resolved_at);
  const resolvedAlerts = alerts.filter(a => a.resolved_at);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance Alerts</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Full-day absences without permission
          </Text>
        </Animated.View>

        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>Loading alerts...</Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {!studentId ? (
              <Card>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Student profile not found</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>Ask admin to link your account.</Text>
              </Card>
            ) : (
              <>
                {unresolvedAlerts.length > 0 && (
                  <>
                    <View style={{ marginBottom: 10 }}>
                      <Text style={[styles.sectionTitle, { color: colors.error }]}>
                        ⚠️ Unresolved ({unresolvedAlerts.length})
                      </Text>
                      <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                        Action required - apply for leave or contact teacher
                      </Text>
                    </View>

                    {unresolvedAlerts.map((alert, index) => (
                      <Animated.View
                        key={alert.id}
                        entering={FadeInDown.delay(index * 25).duration(260)}
                        style={{ marginBottom: 12 }}
                      >
                        <Card
                          style={{
                            borderWidth: 2,
                            borderColor: colors.error,
                            backgroundColor: `${colors.error}12`,
                          }}
                        >
                          <View style={styles.alertHeader}>
                            <Ionicons name="warning" size={20} color={colors.error} />
                            <Text style={[styles.alertDate, { color: colors.error }]}>
                              {formatDate(alert.absence_date)}
                            </Text>
                          </View>

                          <View style={{ height: 8 }} />
                          <Text style={[styles.alertMessage, { color: colors.textPrimary }]}>
                            {alert.alert_type === 'full_day_absent_no_permission'
                              ? `Full day absent (${alert.periods_absent}/${alert.total_periods_scheduled} periods) without approved leave`
                              : 'No attendance marked for this day'}
                          </Text>

                          <View style={{ height: 8 }} />
                          <View style={styles.notificationRow}>
                            <Ionicons
                              name={alert.notification_sent_to_student ? 'checkmark-circle' : 'time'}
                              size={14}
                              color={alert.notification_sent_to_student ? colors.success : colors.textMuted}
                            />
                            <Text style={[styles.notificationText, { color: colors.textSecondary }]}>
                              {alert.notification_sent_to_student
                                ? 'You were notified'
                                : 'Notification pending'}
                            </Text>
                          </View>

                          <View style={styles.notificationRow}>
                            <Ionicons
                              name={alert.notification_sent_to_teacher ? 'checkmark-circle' : 'time'}
                              size={14}
                              color={alert.notification_sent_to_teacher ? colors.success : colors.textMuted}
                            />
                            <Text style={[styles.notificationText, { color: colors.textSecondary }]}>
                              {alert.notification_sent_to_teacher
                                ? 'Teacher notified'
                                : 'Teacher notification pending'}
                            </Text>
                          </View>
                        </Card>
                      </Animated.View>
                    ))}
                  </>
                )}

                {resolvedAlerts.length > 0 && (
                  <>
                    <View style={{ marginTop: 16, marginBottom: 10 }}>
                      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                        ✓ Resolved ({resolvedAlerts.length})
                      </Text>
                      <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                        Previously flagged absences
                      </Text>
                    </View>

                    {resolvedAlerts.map((alert, index) => (
                      <Animated.View
                        key={alert.id}
                        entering={FadeInDown.delay(index * 25).duration(260)}
                        style={{ marginBottom: 12 }}
                      >
                        <Card style={{ opacity: 0.7 }}>
                          <View style={styles.alertHeader}>
                            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                            <Text style={[styles.alertDate, { color: colors.textPrimary }]}>
                              {formatDate(alert.absence_date)}
                            </Text>
                          </View>

                          <View style={{ height: 8 }} />
                          <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                            {alert.alert_type === 'full_day_absent_no_permission'
                              ? `Full day absent (${alert.periods_absent}/${alert.total_periods_scheduled} periods)`
                              : 'No attendance marked'}
                          </Text>

                          <View style={{ height: 6 }} />
                          <Text style={[styles.resolvedText, { color: colors.success }]}>
                            ✓ Resolved {alert.resolved_at ? formatDate(alert.resolved_at) : ''}
                          </Text>
                        </Card>
                      </Animated.View>
                    ))}
                  </>
                )}

                {alerts.length === 0 && (
                  <Card>
                    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                      <Ionicons name="shield-checkmark" size={48} color={colors.success} />
                      <Text style={[styles.emptyTitle, { color: colors.textPrimary, marginTop: 12 }]}>
                        No attendance alerts
                      </Text>
                      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                        Your attendance record is clean!
                      </Text>
                    </View>
                  </Card>
                )}
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    marginTop: 3,
    fontSize: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDate: {
    fontSize: 15,
    fontWeight: '900',
  },
  alertMessage: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  notificationText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resolvedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
});
