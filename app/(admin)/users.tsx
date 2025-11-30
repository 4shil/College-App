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
import { LinearGradient } from 'expo-linear-gradient';

import { AnimatedBackground, GlassCard } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabase';

type UserTab = 'students' | 'teachers' | 'pending';

interface Student {
  id: string;
  roll_number: string;
  current_status: string;
  profile: {
    full_name: string;
    phone: string;
  } | null;
  department: {
    name: string;
    code: string;
  } | null;
}

interface Teacher {
  id: string;
  employee_id: string;
  designation: string;
  is_active: boolean;
  profile: {
    full_name: string;
    phone: string;
  } | null;
  department: {
    name: string;
    code: string;
  } | null;
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const [activeTab, setActiveTab] = useState<UserTab>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          roll_number,
          current_status,
          profile:profiles!students_user_id_fkey(full_name, phone),
          department:departments!students_department_id_fkey(name, code)
        `)
        .eq('current_status', 'active')
        .order('roll_number', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          employee_id,
          designation,
          is_active,
          profile:profiles!teachers_user_id_fkey(full_name, phone),
          department:departments!teachers_department_id_fkey(name, code)
        `)
        .eq('is_active', true)
        .order('employee_id', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchPendingStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          roll_number,
          current_status,
          profile:profiles!students_user_id_fkey(full_name, phone),
          department:departments!students_department_id_fkey(name, code)
        `)
        .eq('current_status', 'inactive')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingStudents(data || []);
    } catch (error) {
      console.error('Error fetching pending students:', error);
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStudents(), fetchTeachers(), fetchPendingStudents()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleApproveStudent = async (studentId: string) => {
    Alert.alert(
      'Approve Student',
      'Are you sure you want to approve this student registration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('students')
                .update({ current_status: 'active' })
                .eq('id', studentId);

              if (error) throw error;
              
              Alert.alert('Success', 'Student approved successfully');
              await fetchAllData();
            } catch (error) {
              console.error('Error approving student:', error);
              Alert.alert('Error', 'Failed to approve student');
            }
          },
        },
      ]
    );
  };

  const handleRejectStudent = async (studentId: string) => {
    Alert.alert(
      'Reject Student',
      'Are you sure you want to reject this student registration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', studentId);

              if (error) throw error;
              
              Alert.alert('Success', 'Student registration rejected');
              await fetchAllData();
            } catch (error) {
              console.error('Error rejecting student:', error);
              Alert.alert('Error', 'Failed to reject student');
            }
          },
        },
      ]
    );
  };

  const filterData = (data: any[], query: string) => {
    if (!query.trim()) return data;
    const lowerQuery = query.toLowerCase();
    return data.filter((item) => {
      const name = item.profile?.full_name?.toLowerCase() || '';
      const id = (item.roll_number || item.employee_id || '').toLowerCase();
      return name.includes(lowerQuery) || id.includes(lowerQuery);
    });
  };

  const filteredStudents = filterData(students, searchQuery);
  const filteredTeachers = filterData(teachers, searchQuery);
  const filteredPending = filterData(pendingStudents, searchQuery);

  const tabs = [
    { key: 'students' as UserTab, label: 'Students', count: students.length, icon: 'user-graduate' },
    { key: 'teachers' as UserTab, label: 'Teachers', count: teachers.length, icon: 'chalkboard-teacher' },
    { key: 'pending' as UserTab, label: 'Pending', count: pendingStudents.length, icon: 'user-clock' },
  ];

  const renderStudentCard = (student: Student, isPending = false) => (
    <Animated.View
      key={student.id}
      entering={FadeInRight.delay(100).duration(300)}
      style={styles.cardWrapper}
    >
      <GlassCard style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
            <FontAwesome5 name="user-graduate" size={20} color={colors.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {student.profile?.full_name || 'Unknown'}
            </Text>
            <Text style={[styles.userId, { color: colors.textSecondary }]}>
              {student.roll_number || 'No Roll Number'}
            </Text>
            <View style={styles.userMeta}>
              <View style={styles.metaItem}>
                <FontAwesome5 name="building" size={10} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {student.department?.code || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {isPending ? (
          <View style={styles.pendingActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApproveStudent(student.id)}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => handleRejectStudent(student.id)}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </GlassCard>
    </Animated.View>
  );

  const renderTeacherCard = (teacher: Teacher) => (
    <Animated.View
      key={teacher.id}
      entering={FadeInRight.delay(100).duration(300)}
      style={styles.cardWrapper}
    >
      <GlassCard style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: '#10b98120' }]}>
            <FontAwesome5 name="chalkboard-teacher" size={20} color="#10b981" />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {teacher.profile?.full_name || 'Unknown'}
            </Text>
            <Text style={[styles.userId, { color: colors.textSecondary }]}>
              {teacher.employee_id || 'No Employee ID'}
            </Text>
            <View style={styles.userMeta}>
              <View style={styles.metaItem}>
                <FontAwesome5 name="building" size={10} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {teacher.department?.code || 'N/A'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <FontAwesome5 name="briefcase" size={10} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {teacher.designation || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );

  const renderEmptyState = (type: string) => (
    <View style={styles.emptyState}>
      <FontAwesome5 
        name={type === 'pending' ? 'check-circle' : 'users'} 
        size={48} 
        color={colors.textMuted} 
      />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {type === 'pending' ? 'No Pending Approvals' : `No ${type} Found`}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        {type === 'pending' 
          ? 'All registrations have been processed' 
          : 'Try adjusting your search filters'}
      </Text>
    </View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>User Management</Text>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Bar */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <FontAwesome5 
                name={tab.icon} 
                size={14} 
                color={activeTab === tab.key ? colors.primary : colors.textMuted} 
              />
              <Text 
                style={[
                  styles.tabLabel, 
                  { color: activeTab === tab.key ? colors.primary : colors.textMuted }
                ]}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge, 
                  { backgroundColor: activeTab === tab.key ? colors.primary : colors.textMuted + '40' }
                ]}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.searchContainer}>
          <View style={[styles.searchBar, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search by name or ID..."
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
          ) : (
            <>
              {activeTab === 'students' && (
                filteredStudents.length > 0 
                  ? filteredStudents.map((s) => renderStudentCard(s))
                  : renderEmptyState('Students')
              )}
              
              {activeTab === 'teachers' && (
                filteredTeachers.length > 0 
                  ? filteredTeachers.map((t) => renderTeacherCard(t))
                  : renderEmptyState('Teachers')
              )}
              
              {activeTab === 'pending' && (
                filteredPending.length > 0 
                  ? filteredPending.map((s) => renderStudentCard(s, true))
                  : renderEmptyState('pending')
              )}
            </>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  userInfo: {
    flex: 1,
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  userId: {
    fontSize: 12,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
  moreBtn: {
    padding: 8,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: '#10b981',
  },
  rejectBtn: {
    backgroundColor: '#ef4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
});
