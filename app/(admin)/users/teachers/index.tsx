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

import { AnimatedBackground, Card } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Teacher {
  id: string;
  employee_id: string | null;
  designation: string | null;
  qualification: string | null;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    photo_url: string | null;
    status: string;
  } | null;
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export default function TeachersListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      let query = supabase
        .from('teachers')
        .select(`
          id,
          employee_id,
          designation,
          qualification,
          created_at,
          profile:profiles!teachers_user_id_fkey(id, full_name, email, phone, photo_url, status),
          department:departments!teachers_department_id_fkey(id, name, code)
        `)
        .order('created_at', { ascending: false });

      if (selectedDept) {
        query = query.eq('department_id', selectedDept);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter((t: Teacher) => 
          t.profile?.full_name?.toLowerCase().includes(search) ||
          t.profile?.email?.toLowerCase().includes(search) ||
          t.employee_id?.toLowerCase().includes(search)
        );
      }

      setTeachers(filtered);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      Alert.alert('Error', 'Failed to fetch teachers');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchTeachers();
    setLoading(false);
  }, [selectedDept, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderTeacherCard = (teacher: Teacher, index: number) => (
    <Animated.View
      key={teacher.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(admin)/users/teachers/${teacher.id}` as any)}
        activeOpacity={0.8}
      >
        <Card style={styles.teacherCard}>
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <FontAwesome5 name="chalkboard-teacher" size={20} color={colors.primary} />
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={[styles.teacherName, { color: colors.textPrimary }]}>
                  {teacher.profile?.full_name || 'Unknown'}
                </Text>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(teacher.profile?.status || 'inactive') }]} />
              </View>
              <Text style={[styles.teacherEmail, { color: colors.textSecondary }]}>
                {teacher.profile?.email || 'No email'}
              </Text>
              <View style={styles.metaRow}>
                {teacher.department && (
                  <View style={[styles.metaBadge, { backgroundColor: colors.primary + '15' }]}>
                    <FontAwesome5 name="building" size={10} color={colors.primary} />
                    <Text style={[styles.metaText, { color: colors.primary }]}>
                      {teacher.department.code}
                    </Text>
                  </View>
                )}
                {teacher.designation && (
                  <View style={[styles.metaBadge, { backgroundColor: '#8b5cf620' }]}>
                    <FontAwesome5 name="id-badge" size={10} color="#8b5cf6" />
                    <Text style={[styles.metaText, { color: '#8b5cf6' }]}>
                      {teacher.designation}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Arrow */}
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      style={styles.emptyState}
    >
      <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
        <FontAwesome5 name="chalkboard-teacher" size={40} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No Teachers Found
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {searchQuery 
          ? 'Try adjusting your search criteria'
          : 'Add your first teacher to get started'}
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
              Teachers
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {teachers.length} teacher(s) registered
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(admin)/users/teachers/create' as any)}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.searchContainer}
        >
          <Card style={styles.searchCard}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search teachers..."
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
          </Card>
        </Animated.View>

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
                Loading teachers...
              </Text>
            </View>
          ) : teachers.length > 0 ? (
            teachers.map((teacher, index) => renderTeacherCard(teacher, index))
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
  addBtn: {
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
    marginBottom: 12,
  },
  teacherCard: {
    padding: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
  teacherName: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teacherEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
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
