import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { Restricted } from '../../../components/Restricted';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { toDateOnlyISO, formatDateDisplay } from '../../../lib/dateUtils';

interface AttendanceRow {
  attendance_id: string;
  attendance_record_id: string;
  student_id: string;
  student_name: string;
  roll_number: string | null;
  registration_number: string | null;
  department_name: string | null;
  section_name: string | null;
  year_name: string | null;
  period: number | null;
  status: 'present' | 'absent' | 'late' | 'excused' | 'od' | string;
  marked_at: string | null;
  marked_by_name: string | null;
}

export default function ReceptionAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [date, setDate] = useState<Date>(new Date());
  const [status, setStatus] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const dateKey = useMemo(() => toDateOnlyISO(date), [date]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_attendance_for_reception', {
        p_date: dateKey,
        p_department_id: departmentId,
        p_status: status,
        p_search: search.trim() || null,
      });
      if (rpcError) throw rpcError;
      setRows(Array.isArray(data) ? (data as AttendanceRow[]) : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateKey, departmentId, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const setStatusFilter = (next: string | null) => {
    if (status === next) return;
    setStatus(next);
  };

  const renderStatusTab = (label: string, value: string | null, count?: number) => {
    const active = status === value || (value === null && status === null);
    return (
      <TouchableOpacity
        onPress={() => setStatusFilter(value)}
        style={[styles.statusTab, { backgroundColor: active ? colors.primary : colors.cardBackground, borderRadius: colors.borderRadius }]}
      >
        <Text style={[styles.statusTabText, { color: active ? colors.textInverse : colors.textPrimary }]}>
          {label}
          {typeof count === 'number' ? ` ${count}` : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const counts = useMemo(() => {
    const all = rows.length;
    const absent = rows.filter(r => r.status === 'absent').length;
    const present = rows.filter(r => r.status === 'present').length;
    const late = rows.filter(r => r.status === 'late').length;
    return { all, absent, present, late };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!status) return rows;
    return rows.filter(r => r.status === status);
  }, [rows, status]);

  return (
    <Restricted
      module="reception"
      permissions={PERMISSIONS.RECEPTION_VIEW_ALL_ATTENDANCE}
      showDeniedMessage
      deniedMessage="You do not have access to Reception attendance overview."
    >
      <AnimatedBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: colors.cardBackground, borderRadius: colors.borderRadius }]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Attendance Overview</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{formatDateDisplay(dateKey)}</Text>
            </View>
            <TouchableOpacity onPress={load} style={[styles.iconBtn, { backgroundColor: colors.cardBackground, borderRadius: colors.borderRadius }]}>
              <Ionicons name="refresh" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Card>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
              <View style={{ height: 10 }} />
              <GlassInput
                placeholder="YYYY-MM-DD"
                value={dateKey}
                onChangeText={(txt) => {
                  const next = new Date(txt);
                  if (!isNaN(next.getTime())) setDate(next);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                icon="calendar"
              />
              <View style={{ height: 12 }} />
              <Text style={[styles.label, { color: colors.textSecondary }]}>Search (name / roll / admission)</Text>
              <View style={{ height: 10 }} />
              <GlassInput
                placeholder="Search student"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                autoCorrect={false}
                icon="search"
                onSubmitEditing={load}
              />
              <View style={{ height: 12 }} />
              <PrimaryButton
                title={loading ? 'Loading...' : 'Apply Filters'}
                onPress={load}
                loading={loading}
                disabled={loading}
                icon={<FontAwesome5 name="filter" size={14} color={colors.textInverse} />}
              />
              {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <View style={styles.tabRow}>
              {renderStatusTab('All', null, counts.all)}
              {renderStatusTab('Absent', 'absent', counts.absent)}
              {renderStatusTab('Present', 'present', counts.present)}
              {renderStatusTab('Late', 'late', counts.late)}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160).springify()}>
            {loading && rows.length === 0 ? (
              <View style={styles.center}>
                <LoadingIndicator color={colors.primary} />
              </View>
            ) : filteredRows.length === 0 ? (
              <Card>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No records for the selected filters.</Text>
              </Card>
            ) : (
              filteredRows.map((row) => (
                <Card key={row.attendance_record_id}>
                  <View style={styles.rowHeader}>
                    <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{row.student_name || '—'}</Text>
                    <StatusBadge status={row.status} colors={colors} />
                  </View>
                  <View style={{ height: 6 }} />
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Roll: {row.roll_number || '—'} • Reg: {row.registration_number || '—'}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Dept: {row.department_name || '—'} • Section: {row.section_name || '—'} • Year: {row.year_name || '—'}
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                    Period: {row.period ?? '—'} • Marked by: {row.marked_by_name || '—'}
                  </Text>
                  <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                    {row.marked_at ? new Date(row.marked_at).toLocaleString() : '—'}
                  </Text>
                </Card>
              ))
            )}
          </Animated.View>
        </ScrollView>
      </AnimatedBackground>
    </Restricted>
  );
}

function StatusBadge({ status, colors }: { status: string; colors: any }) {
  const tone = status === 'absent' ? colors.error : status === 'late' ? colors.warning || '#f5a524' : colors.success || '#4caf50';
  const label = status ? status.toUpperCase() : '—';
  return (
    <View style={[styles.badge, { backgroundColor: colors.inputBackground, borderRadius: colors.borderRadius }]}> 
      <Text style={[styles.badgeText, { color: tone }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 13 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13 },
  errorText: { marginTop: 10, fontSize: 13 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  statusTab: { paddingVertical: 10, paddingHorizontal: 14 },
  statusTabText: { fontSize: 13, fontWeight: '700' },
  center: { paddingVertical: 18, alignItems: 'center' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { marginTop: 6, fontSize: 13 },
  timeText: { marginTop: 6, fontSize: 12 },
  emptyText: { fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
});
