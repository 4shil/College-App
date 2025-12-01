import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Student {
  id: string;
  registration_number: string | null;
  admission_year: number | null;
  current_status: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    status: string;
  } | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  year: {
    id: string;
    name: string;
    year_number: number;
  } | null;
  section: {
    id: string;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function StudentsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      let query = supabase
        .from('students')
        .select(`
          id,
          registration_number,
          admission_year,
          current_status,
          profile:profiles!students_user_id_fkey(id, full_name, email, phone, status),
          department:departments!students_department_id_fkey(id, name, code),
          year:years!students_year_id_fkey(id, name, year_number),
          section:sections!students_section_id_fkey(id, name)
        `)
        .eq('current_status', 'active')
        .order('created_at', { ascending: false });

      if (selectedDept) {
        query = query.eq('department_id', selectedDept);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(s =>
          s.profile?.full_name?.toLowerCase().includes(search) ||
          s.profile?.email?.toLowerCase().includes(search) ||
          s.registration_number?.toLowerCase().includes(search)
        );
      }

      setStudents(filtered);
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'Failed to fetch students');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStudents(), fetchDepartments()]);
    setLoading(false);
  }, [selectedDept, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'graduated': return '#3b82f6';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderStudentCard = (student: Student, index: number) => (
    <Animated.View
      key={student.id}
      entering={FadeInRight.delay(100 + index * 40).duration(300)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(admin)/users/students/${student.id}` as any)}
        activeOpacity={0.8}
      >
        <GlassCard style={styles.studentCard}>
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: '#10b98120' }]}>
              <FontAwesome5 name="user-graduate" size={18} color="#10b981" />
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {student.profile?.full_name || 'Unknown'}
                </Text>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(student.current_status) }]} />
              </View>
              <Text style={[styles.studentRegNo, { color: colors.textSecondary }]}>
                {student.registration_number || 'No Reg No'}
              </Text>
              <View style={styles.metaRow}>
                <View style={[styles.metaBadge, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.metaText, { color: colors.primary }]}>
                    {student.department?.code || 'N/A'}
                  </Text>
                </View>
                <View style={[styles.metaBadge, { backgroundColor: '#8b5cf620' }]}>
                  <Text style={[styles.metaText, { color: '#8b5cf6' }]}>
                    {student.year?.name || 'N/A'} - {student.section?.name || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Arrow */}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderFilterChip = (dept: Department) => (
    <TouchableOpacity
      key={dept.id}
      style={[
        styles.filterChip,
        {
          backgroundColor: selectedDept === dept.id ? colors.primary : colors.primary + '15',
        },
      ]}
      onPress={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: selectedDept === dept.id ? '#fff' : colors.primary },
        ]}
      >
        {dept.code}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      style={styles.emptyState}
    >
      <View style={[styles.emptyIcon, { backgroundColor: '#10b98115' }]}>
        <FontAwesome5 name="user-graduate" size={40} color="#10b981" />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No Students Found
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery || selectedDept
          ? 'Try adjusting your filters'
          : 'No active students in the system'}
      </Text>
    </Animated.View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Students
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {students.length} active student(s)
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: showFilters ? colors.primary : colors.primary + '15' }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={18} color={showFilters ? '#fff' : colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.searchContainer}
        >
          <GlassCard style={styles.searchCard}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search by name, email, or reg no..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Filters */}
        {showFilters && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            style={styles.filtersContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScroll}
            >
              {departments.map(renderFilterChip)}
            </ScrollView>
          </Animated.View>
        )}

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading students...
              </Text>
            </View>
          ) : students.length > 0 ? (
            students.map((student, index) => renderStudentCard(student, index))
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchCard: {
    padding: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 4,
  },
  filtersContainer: {
    marginBottom: 10,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  cardWrapper: {
    marginBottom: 10,
  },
  studentCard: {
    padding: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  studentRegNo: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
