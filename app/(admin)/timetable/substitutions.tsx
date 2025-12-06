import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';

const { width } = Dimensions.get('window');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35' },
  { period: 2, start: '10:50', end: '11:40' },
  { period: 3, start: '11:50', end: '12:45' },
  { period: 4, start: '13:25', end: '14:15' },
  { period: 5, start: '14:20', end: '15:10' },
];

interface Teacher {
  id: string;
  employee_id: string;
  department_id: string;
  profiles: { full_name: string };
  departments?: { code: string; name: string };
}

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period: number;
  course_id: string;
  teacher_id: string;
  room: string | null;
  program_id: string;
  year_id: string;
  courses: { code: string; name: string; short_name: string };
  teachers: { id: string; employee_id: string; profiles: { full_name: string } };
  year: { name: string };
}

interface Substitution {
  id: string;
  timetable_entry_id: string;
  date: string;
  reason: string | null;
  status: string;
  created_at: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  original_teacher: { id: string; employee_id: string; profiles: { full_name: string } };
  substitute_teacher: { id: string; employee_id: string; profiles: { full_name: string } };
  timetable_entries: TimetableEntry;
}

type TabType = 'today' | 'upcoming' | 'history';

export default function SubstitutionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [todayEntries, setTodayEntries] = useState<TimetableEntry[]>([]);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<string>('');
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [availableEntries, setAvailableEntries] = useState<TimetableEntry[]>([]);

  // Stats
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    thisMonth: 0,
  });

  const fetchSubstitutions = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('substitutions')
        .select(`
          *,
          original_teacher:teachers!substitutions_original_teacher_id_fkey(id, employee_id, profiles(full_name)),
          substitute_teacher:teachers!substitutions_substitute_teacher_id_fkey(id, employee_id, profiles(full_name)),
          timetable_entry:timetable_entry_id(
            id, day_of_week, period, course_id, teacher_id, room, program_id, year_id,
            courses(code, name, short_name),
            teachers(id, employee_id, profiles(full_name)),
            year:year_id(name)
          )
        `)
        .order('date', { ascending: activeTab === 'history' ? false : true });

      if (activeTab === 'today') {
        query = query.eq('date', today);
      } else if (activeTab === 'upcoming') {
        query = query.gte('date', today);
      } else {
        query = query.lt('date', today);
      }

      const { data, error } = await query.limit(50);
      
      if (error) {
        console.error('Error fetching substitutions:', error);
        setSubstitutions([]);
        return;
      }

      setSubstitutions(data || []);

      // Fetch stats
      const [todayRes, upcomingRes, monthRes] = await Promise.all([
        supabase.from('substitutions').select('id', { count: 'exact', head: true }).eq('date', today),
        supabase.from('substitutions').select('id', { count: 'exact', head: true }).gte('date', today),
        supabase.from('substitutions').select('id', { count: 'exact', head: true })
          .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      ]);

      setStats({
        today: todayRes.count || 0,
        upcoming: upcomingRes.count || 0,
        thisMonth: monthRes.count || 0,
      });

    } catch (error) {
      console.error('Error:', error);
    }
  }, [activeTab]);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('teachers')
      .select('id, employee_id, department_id, profiles(full_name), departments(code, name)')
      .eq('is_active', true)
      .order('employee_id');
    setTeachers(data || []);
  };

  const fetchEntriesForDate = async (date: Date) => {
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday...
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setAvailableEntries([]);
      return;
    }

    // Get current academic year
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (!academicYear) return;

    const { data } = await supabase
      .from('timetable_entries')
      .select(`
        id, day_of_week, period, course_id, teacher_id, room, program_id, year_id,
        courses(code, name, short_name),
        teachers(id, employee_id, profiles(full_name)),
        year:year_id(name)
      `)
      .eq('day_of_week', dayOfWeek)
      .eq('academic_year_id', academicYear.id)
      .eq('is_active', true)
      .not('teacher_id', 'is', null)
      .order('period');

    setAvailableEntries(data || []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSubstitutions(), fetchTeachers()])
      .finally(() => setLoading(false));
  }, [fetchSubstitutions]);

  useEffect(() => {
    if (showCreateModal) {
      fetchEntriesForDate(selectedDate);
    }
  }, [selectedDate, showCreateModal]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubstitutions();
    setRefreshing(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setSelectedEntry('');
    }
  };

  const handleCreateSubstitution = async () => {
    if (!selectedEntry || !selectedSubstitute) {
      Alert.alert('Error', 'Please select a period and substitute teacher');
      return;
    }

    const entry = availableEntries.find(e => e.id === selectedEntry);
    if (!entry) return;

    // Check if substitute is the same as original
    if (entry.teacher_id === selectedSubstitute) {
      Alert.alert('Error', 'Substitute teacher cannot be the same as original teacher');
      return;
    }

    // Check for existing substitution
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('substitutions')
      .select('id')
      .eq('timetable_entry_id', selectedEntry)
      .eq('date', dateStr)
      .single();

    if (existing) {
      Alert.alert('Error', 'A substitution already exists for this period on this date');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('substitutions').insert({
        timetable_entry_id: selectedEntry,
        date: dateStr,
        original_teacher_id: entry.teacher_id,
        substitute_teacher_id: selectedSubstitute,
        reason: reason.trim() || null,
        status: 'approved', // Instant approval
      });

      if (error) throw error;

      Alert.alert('Success', 'Substitution created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchSubstitutions();
    } catch (error) {
      console.error('Error creating substitution:', error);
      Alert.alert('Error', 'Failed to create substitution');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubstitution = (sub: Substitution) => {
    Alert.alert(
      'Cancel Substitution',
      'Are you sure you want to cancel this substitution?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('substitutions')
                .delete()
                .eq('id', sub.id);
              if (error) throw error;
              fetchSubstitutions();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel substitution');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setSelectedEntry('');
    setSelectedSubstitute('');
    setReason('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const getSelectedEntry = () => availableEntries.find(e => e.id === selectedEntry);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'today', label: 'Today', count: stats.today },
    { key: 'upcoming', label: 'Upcoming', count: stats.upcoming },
    { key: 'history', label: 'History', count: stats.thisMonth },
  ];

  const renderSubstitutionCard = (sub: Substitution, index: number) => {
    const entry = sub.timetable_entries;
    const timing = PERIOD_TIMINGS[entry?.period - 1];
    const isToday = sub.date === new Date().toISOString().split('T')[0];
    const isPast = new Date(sub.date) < new Date(new Date().toDateString());

    return (
      <Animated.View
        key={sub.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <Card style={styles.subCard}>
          <View style={styles.cardHeader}>
            <View style={styles.dateContainer}>
              <FontAwesome5 
                name="calendar-alt" 
                size={14} 
                color={isToday ? '#10b981' : colors.textMuted} 
              />
              <Text style={[
                styles.dateText, 
                { color: isToday ? '#10b981' : colors.textSecondary }
              ]}>
                {formatDate(sub.date)}
              </Text>
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayText}>TODAY</Text>
                </View>
              )}
            </View>
            {!isPast && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleDeleteSubstitution(sub)}
              >
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.periodRow}>
            <View style={[styles.periodBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.periodText, { color: colors.primary }]}>
                P{entry?.period}
              </Text>
            </View>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {timing?.start} - {timing?.end}
            </Text>
            <View style={[styles.classBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Text style={[styles.classText, { color: colors.textSecondary }]}>
                {entry?.year?.name} - P{entry?.period}
              </Text>
            </View>
          </View>

          <View style={styles.subjectRow}>
            <FontAwesome5 name="book" size={12} color={colors.textMuted} />
            <Text style={[styles.subjectText, { color: colors.textPrimary }]}>
              {entry?.courses?.short_name || entry?.courses?.code} - {entry?.courses?.name}
            </Text>
          </View>

          <View style={styles.teacherSwap}>
            <View style={styles.teacherBox}>
              <Text style={[styles.teacherLabel, { color: colors.textMuted }]}>Original</Text>
              <View style={[styles.teacherInfo, { backgroundColor: '#ef444415' }]}>
                <FontAwesome5 name="user" size={12} color="#ef4444" />
                <Text style={[styles.teacherName, { color: '#ef4444' }]}>
                  {sub.original_teacher?.profiles?.full_name || 'Unknown'}
                </Text>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </View>

            <View style={styles.teacherBox}>
              <Text style={[styles.teacherLabel, { color: colors.textMuted }]}>Substitute</Text>
              <View style={[styles.teacherInfo, { backgroundColor: '#10b98115' }]}>
                <FontAwesome5 name="user-check" size={12} color="#10b981" />
                <Text style={[styles.teacherName, { color: '#10b981' }]}>
                  {sub.substitute_teacher?.profiles?.full_name || 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {sub.reason && (
            <View style={styles.reasonRow}>
              <FontAwesome5 name="comment-alt" size={11} color={colors.textMuted} />
              <Text style={[styles.reasonText, { color: colors.textMuted }]}>
                {sub.reason}
              </Text>
            </View>
          )}
        </Card>
      </Animated.View>
    );
  };

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Create Substitution
            </Text>
            <TouchableOpacity onPress={() => { setShowCreateModal(false); resetForm(); }}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Date Picker */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
            <TouchableOpacity
              style={[styles.datePickerBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome5 name="calendar-alt" size={16} color={colors.primary} />
              <Text style={[styles.datePickerText, { color: colors.textPrimary }]}>
                {selectedDate.toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {/* Weekend Warning */}
            {(selectedDate.getDay() === 0 || selectedDate.getDay() === 6) && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={16} color="#f59e0b" />
                <Text style={styles.warningText}>Weekends have no classes</Text>
              </View>
            )}

            {/* Period Selection */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Select Period & Class
            </Text>
            <View style={[styles.pickerBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Picker
                selectedValue={selectedEntry}
                onValueChange={setSelectedEntry}
                style={{ color: colors.textPrimary }}
                dropdownIconColor={colors.textMuted}
              >
                <Picker.Item label="-- Select Period --" value="" />
                {availableEntries.map(entry => (
                  <Picker.Item
                    key={entry.id}
                    label={`P${entry.period} | ${entry.year?.name} | ${entry.courses?.short_name} (${entry.teachers?.profiles?.full_name})`}
                    value={entry.id}
                  />
                ))}
              </Picker>
            </View>

            {/* Selected Entry Info */}
            {selectedEntry && getSelectedEntry() && (
              <View style={[styles.selectedInfo, { backgroundColor: colors.primary + '10' }]}>
                <Text style={[styles.selectedLabel, { color: colors.primary }]}>Selected:</Text>
                <Text style={[styles.selectedText, { color: colors.textPrimary }]}>
                  Period {getSelectedEntry()?.period} • {getSelectedEntry()?.year?.name}
                </Text>
                <Text style={[styles.selectedText, { color: colors.textSecondary }]}>
                  {getSelectedEntry()?.courses?.name}
                </Text>
                <Text style={[styles.selectedText, { color: '#ef4444' }]}>
                  Original: {getSelectedEntry()?.teachers?.profiles?.full_name}
                </Text>
              </View>
            )}

            {/* Substitute Teacher */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Substitute Teacher
            </Text>
            <View style={[styles.pickerBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Picker
                selectedValue={selectedSubstitute}
                onValueChange={setSelectedSubstitute}
                style={{ color: colors.textPrimary }}
                dropdownIconColor={colors.textMuted}
                enabled={!!selectedEntry}
              >
                <Picker.Item label="-- Select Substitute --" value="" />
                {teachers
                  .filter(t => t.id !== getSelectedEntry()?.teacher_id)
                  .map(teacher => (
                    <Picker.Item
                      key={teacher.id}
                      label={`${teacher.profiles?.full_name} (${teacher.departments?.code || 'N/A'})`}
                      value={teacher.id}
                    />
                  ))}
              </Picker>
            </View>

            {/* Reason (Optional) */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Reason <Text style={{ color: colors.textMuted }}>(Optional)</Text>
            </Text>
            <GlassInput
              placeholder="e.g., Medical leave, Training, Personal"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={2}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <PrimaryButton
              title={saving ? 'Creating...' : 'Create Substitution'}
              onPress={handleCreateSubstitution}
              disabled={saving || !selectedEntry || !selectedSubstitute}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="exchange-alt" size={48} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        No Substitutions
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        {activeTab === 'today' 
          ? 'No substitutions scheduled for today'
          : activeTab === 'upcoming'
            ? 'No upcoming substitutions'
            : 'No past substitutions found'}
      </Text>
    </View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Substitutions</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage teacher replacements
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#10b98115' }]}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.today}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.upcoming}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b15' }]}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{stats.thisMonth}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>This Month</Text>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.tabBar}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.primary : colors.textMuted },
              ]}>
                {tab.label}
              </Text>
              <View style={[
                styles.tabBadge,
                { backgroundColor: activeTab === tab.key ? colors.primary : colors.textMuted + '40' },
              ]}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : substitutions.length > 0 ? (
            substitutions.map((sub, index) => renderSubstitutionCard(sub, index))
          ) : (
            renderEmptyState()
          )}
        </ScrollView>

        {renderCreateModal()}
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabLabel: { fontSize: 13, fontWeight: '600' },
  tabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  loadingContainer: { paddingTop: 60, alignItems: 'center' },
  cardWrapper: { marginBottom: 14 },
  subCard: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, fontWeight: '600' },
  todayBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  cancelBtn: { padding: 4 },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  periodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodText: { fontSize: 13, fontWeight: '700' },
  timeText: { fontSize: 12 },
  classBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  classText: { fontSize: 12, fontWeight: '500' },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  subjectText: { fontSize: 14, fontWeight: '500' },
  teacherSwap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teacherBox: { flex: 1 },
  teacherLabel: { fontSize: 10, marginBottom: 4, textAlign: 'center' },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  teacherName: { fontSize: 12, fontWeight: '600' },
  arrowContainer: { paddingHorizontal: 4 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  reasonText: { fontSize: 12, fontStyle: 'italic' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalBody: { padding: 20, maxHeight: 500 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  datePickerText: { flex: 1, fontSize: 15 },
  pickerBox: { borderRadius: 12, overflow: 'hidden' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b15',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  warningText: { color: '#f59e0b', fontSize: 13 },
  selectedInfo: {
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  selectedLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6 },
  selectedText: { fontSize: 13, marginTop: 2 },
  modalFooter: { padding: 20, paddingBottom: 40 },
});
