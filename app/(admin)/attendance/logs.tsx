import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';

interface AttendanceLog {
  id: string;
  created_at: string;
  action_type: string;
  performed_by: string;
  performer_role: string;
  target_type: string;
  target_id: string;
  student_id: string;
  timetable_entry_id: string;
  attendance_id: string;
  attendance_record_id: string;
  details: any;
  performer: { full_name: string };
  student?: { 
    roll_number: string; 
    registration_number: string;
    user_id: string;
    profile?: { full_name: string };
  };
  timetable_entry?: { courses: { name: string } };
}

type FilterType = 'all' | 'marked' | 'edited' | 'bulk_marked' | 'proxy_detected';

const ACTION_ICONS: { [key: string]: { icon: string; color: string } } = {
  marked: { icon: 'check-circle', color: '#10b981' },
  edited: { icon: 'edit', color: '#f59e0b' },
  bulk_marked: { icon: 'check-double', color: '#6366f1' },
  proxy_detected: { icon: 'exclamation-triangle', color: '#ef4444' },
  deleted: { icon: 'trash', color: '#ef4444' },
};

export default function AttendanceLogsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();

  // Data states
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  // Filter states
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 30;

  // Check if user is Super Admin
  const isSuperAdmin = profile?.primary_role === 'super_admin';

  const fetchLogs = useCallback(async (reset: boolean = false) => {
    if (!isSuperAdmin) return;

    try {
      const currentPage = reset ? 0 : page;

      let query = supabase
        .from('attendance_logs')
        .select(`
          *,
          performer:performed_by(full_name),
          student:student_id(roll_number, registration_number, user_id, profile:user_id(full_name)),
          timetable_entry:timetable_entry_id(courses(name))
        `)
        .order('created_at', { ascending: false })
        .range(currentPage * LIMIT, (currentPage + 1) * LIMIT - 1);

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('action_type', filterType);
      }

      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        query = query.gte('created_at', `${dateStr}T00:00:00`)
          .lte('created_at', `${dateStr}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setLogs(data || []);
      } else {
        setLogs(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data?.length || 0) === LIMIT);
      if (reset) setPage(0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, selectedDate, isSuperAdmin]);

  useEffect(() => {
    fetchLogs(true);
  }, [filterType, selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchLogs();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'marked':
        return 'Marked Attendance';
      case 'edited':
        return 'Edited Attendance';
      case 'bulk_marked':
        return 'Bulk Marked';
      case 'proxy_detected':
        return 'Proxy Detected';
      case 'deleted':
        return 'Deleted Attendance';
      default:
        return actionType;
    }
  };

  const renderLogCard = (log: AttendanceLog, index: number) => {
    const actionInfo = ACTION_ICONS[log.action_type] || { icon: 'info-circle', color: colors.textMuted };

    return (
      <Animated.View
        key={log.id}
        entering={FadeInRight.delay(100 + index * 20).duration(300)}
      >
        <Card style={[styles.logCard, { borderLeftColor: actionInfo.color }]}>
          <View style={styles.logHeader}>
            <View style={[styles.iconWrapper, { backgroundColor: actionInfo.color + '15' }]}>
              <FontAwesome5 name={actionInfo.icon} size={14} color={actionInfo.color} />
            </View>

            <View style={styles.logInfo}>
              <Text style={[styles.logAction, { color: colors.textPrimary }]}>
                {getActionLabel(log.action_type)}
              </Text>
              <Text style={[styles.logPerformer, { color: colors.textSecondary }]}>
                by {log.performer?.full_name || 'Unknown'} ({log.performer_role})
              </Text>
            </View>

            <Text style={[styles.logTime, { color: colors.textMuted }]}>
              {formatTime(log.created_at)}
            </Text>
          </View>

          {/* Log Details */}
          <View style={[styles.logDetails, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
            {log.student && (
              <View style={styles.detailRow}>
                <FontAwesome5 name="user" size={10} color={colors.textMuted} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Student: {log.student?.profile?.full_name || 'Unknown'} ({log.student?.roll_number || log.student?.registration_number})
                </Text>
              </View>
            )}

            {log.timetable_entry && (
              <View style={styles.detailRow}>
                <FontAwesome5 name="book" size={10} color={colors.textMuted} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Subject: {log.timetable_entry?.courses?.name || 'Unknown'}
                </Text>
              </View>
            )}

            {log.details && (
              <>
                {log.details.date && (
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="calendar" size={10} color={colors.textMuted} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Date: {log.details.date}
                    </Text>
                  </View>
                )}

                {log.details.period && (
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="clock" size={10} color={colors.textMuted} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Period: {log.details.period}
                    </Text>
                  </View>
                )}

                {log.details.status && (
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="check-circle" size={10} color={colors.textMuted} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Status: {log.details.old_status ? `${log.details.old_status} → ` : ''}{log.details.status}
                    </Text>
                  </View>
                )}

                {log.details.count && (
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="users" size={10} color={colors.textMuted} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Count: {log.details.count} students
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Access control
  if (!isSuperAdmin) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.accessDenied}>
            <FontAwesome5 name="lock" size={48} color={colors.textMuted} />
            <Text style={[styles.accessText, { color: colors.textMuted }]}>
              Access Denied
            </Text>
            <Text style={[styles.accessSubtext, { color: colors.textMuted }]}>
              Only Super Admin can view attendance logs
            </Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Activity Logs</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              All attendance actions
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Date Filter */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <TouchableOpacity
              style={[styles.dateFilterBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome5 name="calendar-alt" size={14} color={colors.primary} />
              <Text style={[styles.dateFilterText, { color: colors.textPrimary }]}>
                {selectedDate ? selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'All Dates'}
              </Text>
              {selectedDate && (
                <TouchableOpacity onPress={() => setSelectedDate(null)}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </Animated.View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
              maximumDate={new Date()}
            />
          )}

          {/* Filter Tabs */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(['all', 'marked', 'edited', 'bulk_marked', 'proxy_detected'] as FilterType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterTab,
                    filterType === type && styles.filterTabActive,
                    {
                      backgroundColor: filterType === type
                        ? type === 'proxy_detected' ? '#ef4444' : colors.primary
                        : colors.glassBackground,
                    },
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  {type !== 'all' && (
                    <FontAwesome5
                      name={ACTION_ICONS[type]?.icon || 'circle'}
                      size={10}
                      color={filterType === type ? '#fff' : ACTION_ICONS[type]?.color || colors.textMuted}
                    />
                  )}
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: filterType === type ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {type === 'all' ? 'All' : getActionLabel(type)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Logs List */}
          {loading && logs.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : logs.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="clipboard-list" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No logs found
              </Text>
            </View>
          ) : (
            <View style={styles.logsList}>
              {logs.map((log, index) => renderLogCard(log, index))}
              {hasMore && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  // Date Filter
  dateFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  dateFilterText: { flex: 1, fontSize: 14, fontWeight: '500' },
  // Filter Tabs
  filterScroll: { marginBottom: 16 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    gap: 6,
  },
  filterTabActive: {},
  filterTabText: { fontSize: 11, fontWeight: '600' },
  // Logs List
  logsList: { marginTop: 8 },
  logCard: {
    marginBottom: 12,
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logInfo: { flex: 1 },
  logAction: { fontSize: 14, fontWeight: '600' },
  logPerformer: { fontSize: 11, marginTop: 2 },
  logTime: { fontSize: 10 },
  logDetails: {
    padding: 10,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  detailText: { fontSize: 11 },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  // Access Denied
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  accessText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  accessSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
