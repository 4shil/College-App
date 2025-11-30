import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, GlassCard } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabase';

type AcademicTab = 'departments' | 'courses' | 'subjects' | 'semesters';

interface Department {
  id: string;
  name: string;
  code: string;
  hod_id: string | null;
  is_active: boolean;
  students_count?: number;
  teachers_count?: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
  duration_years: number;
  total_semesters: number;
  is_active: boolean;
  department: {
    name: string;
    code: string;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  subject_type: string;
  is_lab: boolean;
  course: {
    name: string;
    code: string;
  };
}

export default function AcademicScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const [activeTab, setActiveTab] = useState<AcademicTab>('departments');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          department:departments!courses_department_id_fkey(name, code)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          course:courses!subjects_course_id_fkey(name, code)
        `)
        .eq('is_active', true)
        .order('code', { ascending: true });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDepartments(), fetchCourses(), fetchSubjects()]);
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

  const tabs = [
    { key: 'departments' as AcademicTab, label: 'Departments', icon: 'building', count: departments.length },
    { key: 'courses' as AcademicTab, label: 'Courses', icon: 'graduation-cap', count: courses.length },
    { key: 'subjects' as AcademicTab, label: 'Subjects', icon: 'book', count: subjects.length },
    { key: 'semesters' as AcademicTab, label: 'Semesters', icon: 'calendar-alt', count: 0 },
  ];

  const renderDepartmentCard = (dept: Department, index: number) => (
    <Animated.View
      key={dept.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <GlassCard style={styles.academicCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#6366f120' }]}>
            <FontAwesome5 name="building" size={20} color="#6366f1" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{dept.name}</Text>
            <Text style={[styles.cardCode, { color: colors.textSecondary }]}>{dept.code}</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome5 name="user-graduate" size={12} color={colors.textMuted} />
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              {dept.students_count || 0} Students
            </Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome5 name="chalkboard-teacher" size={12} color={colors.textMuted} />
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              {dept.teachers_count || 0} Teachers
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: colors.primary + '15' }]}
          >
            <FontAwesome5 name="users" size={11} color={colors.primary} />
            <Text style={[styles.actionChipText, { color: colors.primary }]}>View Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: '#10b98115' }]}
          >
            <FontAwesome5 name="book" size={11} color="#10b981" />
            <Text style={[styles.actionChipText, { color: '#10b981' }]}>Courses</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: '#f59e0b15' }]}
          >
            <FontAwesome5 name="edit" size={11} color="#f59e0b" />
            <Text style={[styles.actionChipText, { color: '#f59e0b' }]}>Edit</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderCourseCard = (course: Course, index: number) => (
    <Animated.View
      key={course.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <GlassCard style={styles.academicCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#10b98120' }]}>
            <FontAwesome5 name="graduation-cap" size={18} color="#10b981" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{course.name}</Text>
            <Text style={[styles.cardCode, { color: colors.textSecondary }]}>{course.code}</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome5 name="building" size={12} color={colors.textMuted} />
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              {course.department?.code || 'N/A'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome5 name="clock" size={12} color={colors.textMuted} />
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              {course.duration_years} Years
            </Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome5 name="layer-group" size={12} color={colors.textMuted} />
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>
              {course.total_semesters} Semesters
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: colors.primary + '15' }]}
          >
            <FontAwesome5 name="book-open" size={11} color={colors.primary} />
            <Text style={[styles.actionChipText, { color: colors.primary }]}>Subjects</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionChip, { backgroundColor: '#8b5cf615' }]}
          >
            <FontAwesome5 name="user-graduate" size={11} color="#8b5cf6" />
            <Text style={[styles.actionChipText, { color: '#8b5cf6' }]}>Students</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderSubjectCard = (subject: Subject, index: number) => (
    <Animated.View
      key={subject.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.cardWrapper}
    >
      <GlassCard style={styles.subjectCard}>
        <View style={styles.subjectHeader}>
          <View style={[styles.subjectIcon, { backgroundColor: subject.is_lab ? '#f59e0b20' : '#6366f120' }]}>
            <FontAwesome5 
              name={subject.is_lab ? 'flask' : 'book'} 
              size={16} 
              color={subject.is_lab ? '#f59e0b' : '#6366f1'} 
            />
          </View>
          <View style={styles.subjectInfo}>
            <Text style={[styles.subjectName, { color: colors.textPrimary }]} numberOfLines={1}>
              {subject.name}
            </Text>
            <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>{subject.code}</Text>
          </View>
          <View style={[styles.creditBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.creditText, { color: colors.primary }]}>{subject.credits} Cr</Text>
          </View>
        </View>
        <View style={styles.subjectMeta}>
          <View style={[styles.typeBadge, { 
            backgroundColor: subject.subject_type === 'core' ? '#10b98120' : '#8b5cf620' 
          }]}>
            <Text style={[styles.typeText, { 
              color: subject.subject_type === 'core' ? '#10b981' : '#8b5cf6' 
            }]}>
              {subject.subject_type?.toUpperCase() || 'N/A'}
            </Text>
          </View>
          <Text style={[styles.courseName, { color: colors.textMuted }]}>
            {subject.course?.code || 'N/A'}
          </Text>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderSemesterSection = () => (
    <View style={styles.semesterContainer}>
      <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
        Semester management coming soon...
      </Text>
    </View>
  );

  const renderEmptyState = (type: string) => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="folder-open" size={48} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No {type} Found</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Add {type.toLowerCase()} to get started
      </Text>
    </View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Academic</Text>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Bar */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && { 
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary + '40',
                  },
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
                    { backgroundColor: activeTab === tab.key ? colors.primary : colors.textMuted + '30' }
                  ]}>
                    <Text style={styles.tabBadgeText}>{tab.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
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
              {activeTab === 'departments' && (
                departments.length > 0 
                  ? departments.map((d, i) => renderDepartmentCard(d, i))
                  : renderEmptyState('Departments')
              )}
              
              {activeTab === 'courses' && (
                courses.length > 0 
                  ? courses.map((c, i) => renderCourseCard(c, i))
                  : renderEmptyState('Courses')
              )}
              
              {activeTab === 'subjects' && (
                subjects.length > 0 
                  ? <View style={styles.subjectsGrid}>
                      {subjects.map((s, i) => renderSubjectCard(s, i))}
                    </View>
                  : renderEmptyState('Subjects')
              )}

              {activeTab === 'semesters' && renderSemesterSection()}
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
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
    marginBottom: 14,
  },
  academicCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardCode: {
    fontSize: 12,
    marginTop: 2,
  },
  moreBtn: {
    padding: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  subjectCard: {
    width: '48%',
    padding: 14,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '600',
  },
  subjectCode: {
    fontSize: 11,
    marginTop: 2,
  },
  creditBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  creditText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subjectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  courseName: {
    fontSize: 11,
  },
  semesterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  comingSoon: {
    fontSize: 14,
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
