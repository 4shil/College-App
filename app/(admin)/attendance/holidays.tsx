import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface Holiday {
  id: string;
  date: string;
  title: string;
  description: string;
  holiday_type: 'college' | 'department';
  department_id: string | null;
  departments?: { name: string };
  created_by: string;
  profiles?: { full_name: string };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function HolidaysScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { profile } = useAuthStore();

  // Data states
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [holidayType, setHolidayType] = useState<'college' | 'department'>('college');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

  // Filter
  const [filterType, setFilterType] = useState<'all' | 'college' | 'department'>('all');

  // Check if user is Super Admin
  const isSuperAdmin = profile?.primary_role === 'super_admin';
  const isHOD = profile?.primary_role === 'hod';

  const fetchHolidays = useCallback(async () => {
    try {
      let query = supabase
        .from('holidays')
        .select(`
          *,
          departments(name),
          profiles:created_by(full_name)
        `)
        .order('date', { ascending: true });

      // If HOD, only show college holidays and their department's holidays
      if (isHOD && profile?.department_id) {
        query = query.or(`holiday_type.eq.college,department_id.eq.${profile.department_id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setLoading(false);
    }
  }, [isHOD, profile?.department_id]);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('departments')
        .select('id, name, code')
        .eq('is_active', true)
        .order('code');

      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
    fetchDepartments();
  }, [fetchHolidays, fetchDepartments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHolidays();
    setRefreshing(false);
  };

  const resetForm = () => {
    setSelectedDate(new Date());
    setTitle('');
    setDescription('');
    setHolidayType('college');
    setSelectedDepartment('');
    setEditingHoliday(null);
  };

  const handleOpenModal = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setSelectedDate(new Date(holiday.date));
      setTitle(holiday.title);
      setDescription(holiday.description || '');
      setHolidayType(holiday.holiday_type);
      setSelectedDepartment(holiday.department_id || '');
    } else {
      resetForm();
      // HOD can only create department holidays
      if (isHOD && !isSuperAdmin) {
        setHolidayType('department');
        setSelectedDepartment(profile?.department_id || '');
      }
    }
    setShowModal(true);
  };

  const handleSaveHoliday = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (holidayType === 'department' && !selectedDepartment) {
      Alert.alert('Error', 'Please select a department');
      return;
    }

    setSaving(true);
    try {
      const holidayData = {
        date: selectedDate.toISOString().split('T')[0],
        title: title.trim(),
        description: description.trim() || null,
        holiday_type: holidayType,
        department_id: holidayType === 'department' ? selectedDepartment : null,
        created_by: profile?.id,
      };

      if (editingHoliday) {
        const { error } = await supabase
          .from('holidays')
          .update(holidayData)
          .eq('id', editingHoliday.id);

        if (error) throw error;
        Alert.alert('Success', 'Holiday updated successfully');
      } else {
        const { error } = await supabase.from('holidays').insert(holidayData);

        if (error) throw error;
        Alert.alert('Success', 'Holiday created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchHolidays();
    } catch (error: any) {
      console.error('Error saving holiday:', error);
      Alert.alert('Error', error.message || 'Failed to save holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holiday: Holiday) => {
    Alert.alert(
      'Delete Holiday',
      `Are you sure you want to delete "${holiday.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('holidays').delete().eq('id', holiday.id);

              if (error) throw error;
              fetchHolidays();
            } catch (error) {
              console.error('Error deleting holiday:', error);
              Alert.alert('Error', 'Failed to delete holiday');
            }
          },
        },
      ]
    );
  };

  const filteredHolidays = holidays.filter(h => {
    if (filterType === 'all') return true;
    return h.holiday_type === filterType;
  });

  const upcomingHolidays = filteredHolidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = filteredHolidays.filter(h => new Date(h.date) < new Date());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateStr);
    const diffTime = holidayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `In ${diffDays} days`;
  };

  const renderHolidayCard = (holiday: Holiday, index: number, isPast: boolean = false) => {
    const canEdit = isSuperAdmin || (isHOD && holiday.department_id === profile?.department_id);
    const typeColor = holiday.holiday_type === 'college' ? colors.success : colors.warning;

    return (
      <Animated.View
        key={holiday.id}
        entering={FadeInRight.delay(100 + index * 30).duration(300)}
      >
        <Card
          style={[
            styles.holidayCard,
            isPast && { opacity: 0.6 },
          ]}
        >
          <View style={styles.holidayHeader}>
            <View style={styles.holidayDateBadge}>
              <Text style={[styles.holidayDateDay, { color: colors.primary }]}>
                {new Date(holiday.date).getDate()}
              </Text>
              <Text style={[styles.holidayDateMonth, { color: colors.textSecondary }]}>
                {new Date(holiday.date).toLocaleString('default', { month: 'short' })}
              </Text>
            </View>

            <View style={styles.holidayInfo}>
              <Text style={[styles.holidayTitle, { color: colors.textPrimary }]}>{holiday.title}</Text>
              {holiday.description && (
                <Text style={[styles.holidayDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {holiday.description}
                </Text>
              )}
              <View style={styles.holidayMeta}>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, borderWidth: colors.borderWidth },
                  ]}
                >
                  <FontAwesome5
                    name={holiday.holiday_type === 'college' ? 'university' : 'building'}
                    size={10}
                    color={typeColor}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      { color: typeColor },
                    ]}
                  >
                    {holiday.holiday_type === 'college' ? 'College' : holiday.departments?.name}
                  </Text>
                </View>
                <Text style={[styles.daysUntil, { color: colors.textMuted }]}>
                  {getDaysUntil(holiday.date)}
                </Text>
              </View>
            </View>

            {canEdit && !isPast && (
              <View style={styles.holidayActions}>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.primary,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  onPress={() => handleOpenModal(holiday)}
                >
                  <FontAwesome5 name="edit" size={12} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.error,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  onPress={() => handleDeleteHoliday(holiday)}
                >
                  <FontAwesome5 name="trash" size={12} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderModal = () => (
    <Modal visible={showModal} transparent animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: withAlpha(colors.shadowColor, 0.6) }]}
      >
        <Card style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingHoliday ? 'Edit Holiday' : 'Add Holiday'}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Date Picker */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
            <TouchableOpacity
              style={[
                styles.datePickerBtn,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome5 name="calendar-alt" size={16} color={colors.primary} />
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {formatDate(selectedDate.toISOString())}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
                minimumDate={new Date()}
              />
            )}

            {/* Title */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
            <GlassInput
              placeholder="Holiday title"
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description (Optional)</Text>
            <GlassInput
              placeholder="Brief description"
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ minHeight: 80 }}
            />

            {/* Holiday Type */}
            {isSuperAdmin && (
              <>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      holidayType === 'college' && styles.typeOptionActive,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: holidayType === 'college' ? colors.success : colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    onPress={() => setHolidayType('college')}
                  >
                    <FontAwesome5
                      name="university"
                      size={14}
                      color={holidayType === 'college' ? colors.success : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        { color: holidayType === 'college' ? colors.success : colors.textSecondary },
                      ]}
                    >
                      College-wide
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      holidayType === 'department' && styles.typeOptionActive,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: holidayType === 'department' ? colors.warning : colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    onPress={() => setHolidayType('department')}
                  >
                    <FontAwesome5
                      name="building"
                      size={14}
                      color={holidayType === 'department' ? colors.warning : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        { color: holidayType === 'department' ? colors.warning : colors.textSecondary },
                      ]}
                    >
                      Department
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Department Picker */}
            {holidayType === 'department' && isSuperAdmin && (
              <>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Department</Text>
                <View
                  style={[
                    styles.pickerWrapper,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Picker
                    selectedValue={selectedDepartment}
                    onValueChange={setSelectedDepartment}
                    style={{ color: colors.textPrimary }}
                    dropdownIconColor={colors.textMuted}
                  >
                    <Picker.Item label="Select Department" value="" />
                    {departments.map(d => (
                      <Picker.Item key={d.id} label={`${d.code} - ${d.name}`} value={d.id} />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            {/* HOD Info */}
            {isHOD && !isSuperAdmin && (
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.warning,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <FontAwesome5 name="info-circle" size={14} color={colors.warning} />
                <Text style={[styles.infoText, { color: colors.warning }]}>
                  As HOD, you can only create department holidays for your department.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.glassBackground }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              onPress={handleSaveHoliday}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={[styles.modalBtnText, { color: colors.textInverse }]}>
                  {editingHoliday ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    </Modal>
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>Holidays</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isSuperAdmin ? 'Manage college & department holidays' : 'Manage department holidays'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleOpenModal()}
          >
            <FontAwesome5 name="plus" size={14} color={colors.textInverse} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Filter Tabs */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.filterTabs}>
                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    filterType === 'all' && styles.filterTabActive,
                    { backgroundColor: filterType === 'all' ? colors.primary : colors.glassBackground },
                  ]}
                  onPress={() => setFilterType('all')}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: filterType === 'all' ? colors.textInverse : colors.textSecondary },
                    ]}
                  >
                    All ({holidays.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    filterType === 'college' && styles.filterTabActive,
                    { backgroundColor: filterType === 'college' ? colors.success : colors.glassBackground },
                  ]}
                  onPress={() => setFilterType('college')}
                >
                  <FontAwesome5
                    name="university"
                    size={12}
                    color={filterType === 'college' ? colors.textInverse : colors.success}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: filterType === 'college' ? colors.textInverse : colors.textSecondary },
                    ]}
                  >
                    College
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterTab,
                    filterType === 'department' && styles.filterTabActive,
                    { backgroundColor: filterType === 'department' ? colors.warning : colors.glassBackground },
                  ]}
                  onPress={() => setFilterType('department')}
                >
                  <FontAwesome5
                    name="building"
                    size={12}
                    color={filterType === 'department' ? colors.textInverse : colors.warning}
                  />
                  <Text
                    style={[
                      styles.filterTabText,
                      { color: filterType === 'department' ? colors.textInverse : colors.textSecondary },
                    ]}
                  >
                    Department
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Upcoming Holidays */}
              {upcomingHolidays.length > 0 && (
                <Animated.View entering={FadeIn.delay(200).duration(400)}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    Upcoming ({upcomingHolidays.length})
                  </Text>
                  {upcomingHolidays.map((holiday, index) => renderHolidayCard(holiday, index))}
                </Animated.View>
              )}

              {/* Past Holidays */}
              {pastHolidays.length > 0 && (
                <Animated.View entering={FadeIn.delay(300).duration(400)}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 20 }]}>
                    Past ({pastHolidays.length})
                  </Text>
                  {pastHolidays.map((holiday, index) => renderHolidayCard(holiday, index, true))}
                </Animated.View>
              )}

              {/* Empty State */}
              {filteredHolidays.length === 0 && (
                <View style={styles.emptyState}>
                  <FontAwesome5 name="calendar-day" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No holidays found
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.emptyBtn,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.primary,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    onPress={() => handleOpenModal()}
                  >
                    <FontAwesome5 name="plus" size={12} color={colors.primary} />
                    <Text style={[styles.emptyBtnText, { color: colors.primary }]}>Add Holiday</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {renderModal()}
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
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  filterTabActive: {},
  filterTabText: { fontSize: 12, fontWeight: '600' },
  // Section Title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  // Holiday Card
  holidayCard: {
    marginBottom: 12,
  },
  holidayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  holidayDateBadge: {
    alignItems: 'center',
    marginRight: 14,
    minWidth: 40,
  },
  holidayDateDay: {
    fontSize: 24,
    fontWeight: '700',
  },
  holidayDateMonth: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  holidayInfo: { flex: 1 },
  holidayTitle: { fontSize: 15, fontWeight: '600' },
  holidayDesc: { fontSize: 12, marginTop: 4 },
  holidayMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  typeText: { fontSize: 10, fontWeight: '600' },
  daysUntil: { fontSize: 11 },
  holidayActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  dateText: { fontSize: 15, fontWeight: '500' },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  typeOptionActive: {},
  typeOptionText: { fontSize: 13, fontWeight: '600' },
  pickerWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 12 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
