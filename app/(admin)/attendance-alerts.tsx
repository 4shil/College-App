import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator, GlassInput, PrimaryButton } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

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
  resolution_note: string | null;
  created_at: string;
  students?: {
    registration_number: string;
    roll_number: string | null;
    profiles?: { full_name: string } | null;
  } | null;
  sections?: {
    name: string;
    departments?: { name: string; code: string } | null;
    years?: { name: string } | null;
  } | null;
};

function formatDate(dateISO: string) {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO;
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminAttendanceAlertsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<AttendanceAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<AttendanceAlert | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchAlerts = useCallback(async () => {
    const { data, error } = await supabase
      .from('attendance_alerts')
      .select(`
        *,
        students!inner(
          registration_number,
          roll_number,
          profiles:user_id(full_name)
        ),
        sections!inner(
          name,
          departments(name, code),
          years(name)
        )
      `)
      .order('absence_date', { ascending: false })
      .limit(100);

    if (error) {
      console.log('Admin attendance alerts error:', error.message);
      setAlerts([]);
      return;
    }

    setAlerts((data || []) as any);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAlerts();
      setLoading(false);
    };
    init();
  }, [fetchAlerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleResolve = async (alert: AttendanceAlert) => {
    if (!resolutionNote.trim()) {
      Alert.alert('Resolution Note Required', 'Please provide a note explaining the resolution.');
      return;
    }

    setResolving(true);
    const { error } = await supabase
      .from('attendance_alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id,
        resolution_note: resolutionNote.trim(),
      })
      .eq('id', alert.id);

    if (error) {
      Alert.alert('Error', `Failed to resolve alert: ${error.message}`);
    } else {
      Alert.alert('Success', 'Alert resolved successfully');
      setSelectedAlert(null);
      setResolutionNote('');
      await fetchAlerts();
    }
    setResolving(false);
  };

  const unresolvedAlerts = alerts.filter(a => !a.resolved_at);
  const resolvedAlerts = alerts.filter(a => a.resolved_at);

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 100 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance Alerts</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Monitor full-day absences without permission
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
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.statsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statValue, { color: colors.error }]}>{unresolvedAlerts.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Unresolved</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statValue, { color: colors.success }]}>{resolvedAlerts.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>{alerts.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                </View>
              </View>
            </Card>

            {unresolvedAlerts.length > 0 && (
              <>
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.sectionTitle, { color: colors.error }]}>
                    ⚠️ Unresolved ({unresolvedAlerts.length})
                  </Text>
                </View>

                {unresolvedAlerts.map((alert, index) => (
                  <Animated.View
                    key={alert.id}
                    entering={FadeInDown.delay(index * 25).duration(260)}
                    style={{ marginBottom: 12 }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setSelectedAlert(alert)}
                    >
                      <Card
                        style={{
                          borderWidth: 2,
                          borderColor: colors.error,
                          backgroundColor: `${colors.error}10`,
                        }}
                      >
                        <View style={styles.alertHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                              {alert.students?.profiles?.full_name || alert.students?.registration_number}
                            </Text>
                            <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                              {alert.sections?.departments?.code} • {alert.sections?.years?.name} • {alert.sections?.name}
                            </Text>
                          </View>
                        </View>

                        <View style={{ height: 8 }} />
                        <View style={styles.dateRow}>
                          <Ionicons name="calendar" size={14} color={colors.error} />
                          <Text style={[styles.dateText, { color: colors.error }]}>
                            {formatDate(alert.absence_date)}
                          </Text>
                        </View>

                        <View style={{ height: 6 }} />
                        <Text style={[styles.alertDetail, { color: colors.textSecondary }]}>
                          {alert.alert_type === 'full_day_absent_no_permission'
                            ? `${alert.periods_absent}/${alert.total_periods_scheduled} periods absent`
                            : 'No attendance marked'}
                        </Text>

                        <View style={{ height: 8 }} />
                        <View style={styles.statusRow}>
                          <View style={styles.statusBadge}>
                            <Ionicons
                              name={alert.notification_sent_to_student ? 'checkmark' : 'close'}
                              size={12}
                              color={alert.notification_sent_to_student ? colors.success : colors.textMuted}
                            />
                            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Student</Text>
                          </View>
                          <View style={styles.statusBadge}>
                            <Ionicons
                              name={alert.notification_sent_to_teacher ? 'checkmark' : 'close'}
                              size={12}
                              color={alert.notification_sent_to_teacher ? colors.success : colors.textMuted}
                            />
                            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Teacher</Text>
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
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
                </View>

                {resolvedAlerts.slice(0, 20).map((alert, index) => (
                  <Animated.View
                    key={alert.id}
                    entering={FadeInDown.delay(index * 25).duration(260)}
                    style={{ marginBottom: 12 }}
                  >
                    <Card style={{ opacity: 0.6 }}>
                      <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                        {alert.students?.profiles?.full_name || alert.students?.registration_number}
                      </Text>
                      <Text style={[styles.studentMeta, { color: colors.textSecondary }]}>
                        {formatDate(alert.absence_date)} • {alert.sections?.departments?.code}
                      </Text>
                      <View style={{ height: 6 }} />
                      <Text style={[styles.resolvedText, { color: colors.success }]}>
                        ✓ Resolved {alert.resolved_at ? formatDate(alert.resolved_at) : ''}
                      </Text>
                      {alert.resolution_note && (
                        <Text style={[styles.resolutionNote, { color: colors.textMuted }]}>
                          {alert.resolution_note}
                        </Text>
                      )}
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
                    No alerts found
                  </Text>
                  <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                    All students have proper attendance records
                  </Text>
                </View>
              </Card>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>

      {selectedAlert && (
        <View style={[styles.modal, { backgroundColor: colors.shadowColor + '80' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Resolve Alert</Text>
              <TouchableOpacity onPress={() => setSelectedAlert(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalStudentName, { color: colors.textPrimary }]}>
              {selectedAlert.students?.profiles?.full_name || selectedAlert.students?.registration_number}
            </Text>
            <Text style={[styles.modalDate, { color: colors.textSecondary }]}>
              {formatDate(selectedAlert.absence_date)}
            </Text>

            <View style={{ height: 16 }} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Resolution Note *</Text>
            <GlassInput
              value={resolutionNote}
              onChangeText={setResolutionNote}
              placeholder="Explain how this was resolved..."
              multiline
              numberOfLines={4}
            />

            <View style={{ height: 16 }} />
            <PrimaryButton
              title={resolving ? 'Resolving...' : 'Mark as Resolved'}
              onPress={() => handleResolve(selectedAlert)}
              disabled={resolving || !resolutionNote.trim()}
              variant="primary"
              size="medium"
            />
          </View>
        </View>
      )}
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '800',
  },
  studentMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '900',
  },
  alertDetail: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  resolvedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  resolutionNote: {
    marginTop: 4,
    fontSize: 11,
    fontStyle: 'italic',
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
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalStudentName: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalDate: {
    marginTop: 4,
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
});
