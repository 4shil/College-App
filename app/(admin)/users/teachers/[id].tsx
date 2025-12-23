import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { AnimatedBackground, Card, IconBadge, LoadingIndicator } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface TeacherDetails {
  id: string;
  employee_id: string | null;
  designation: string | null;
  qualification: string | null;
  specialization: string | null;
  experience_years: number | null;
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

interface Course {
  id: string;
  subject: {
    name: string;
    code: string;
  };
  section: {
    name: string;
    year: {
      name: string;
    };
  };
}

export default function TeacherDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<TeacherDetails | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetchTeacherDetails();
    fetchTeacherCourses();
  }, [id]);

  const fetchTeacherDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          employee_id,
          designation,
          qualification,
          specialization,
          experience_years,
          created_at,
          profile:profiles!teachers_user_id_fkey(id, full_name, email, phone, photo_url, status),
          department:departments!teachers_department_id_fkey(id, name, code)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTeacher(data);
    } catch (error) {
      console.error('Error fetching teacher:', error);
      Alert.alert('Error', 'Failed to fetch teacher details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          subject:subjects!courses_subject_id_fkey(name, code),
          section:sections!courses_section_id_fkey(
            name,
            year:years!sections_year_id_fkey(name)
          )
        `)
        .eq('teacher_id', id);

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!teacher?.profile) return;

    const newStatus = teacher.profile.status === 'active' ? 'inactive' : 'active';
    
    Alert.alert(
      `${newStatus === 'active' ? 'Activate' : 'Deactivate'} Teacher`,
      `Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this teacher?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', teacher.profile!.id);

              if (error) throw error;

              setTeacher(prev => prev ? {
                ...prev,
                profile: prev.profile ? { ...prev.profile, status: newStatus } : null,
              } : null);

              Alert.alert('Success', `Teacher ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            } catch (error) {
              console.error('Error updating status:', error);
              Alert.alert('Error', 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'inactive': return colors.warning;
      case 'blocked': return colors.error;
      default: return colors.textMuted;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <LoadingIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading teacher details...
          </Text>
        </View>
      </AnimatedBackground>
    );
  }

  if (!teacher) return null;

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
              Teacher Details
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.editBtn,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
            onPress={() => Alert.alert('Edit', 'Edit feature coming soon')}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <Card style={styles.profileCard}>
              <View style={styles.profileHeader}>
                {teacher.profile?.photo_url ? (
                  <Image
                    source={{ uri: teacher.profile.photo_url }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <IconBadge
                    family="fa5"
                    name="chalkboard-teacher"
                    tone="primary"
                    size={36}
                    style={styles.profilePhotoPlaceholder}
                  />
                )}
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {teacher.profile?.full_name || 'Unknown'}
                  </Text>
                  <Text style={[styles.profileDesignation, { color: colors.textSecondary }]}>
                    {teacher.designation || 'Teacher'}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(teacher.profile?.status || 'inactive') }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(teacher.profile?.status || 'inactive') }]}>
                      {teacher.profile?.status || 'Unknown'}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Contact Info */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Card style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Contact Information
              </Text>
              <View style={styles.infoRow}>
                <FontAwesome5 name="envelope" size={14} color={colors.textMuted} />
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {teacher.profile?.email || 'No email'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <FontAwesome5 name="phone" size={14} color={colors.textMuted} />
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {teacher.profile?.phone || 'No phone'}
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Professional Info */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <Card style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Professional Information
              </Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Department</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {teacher.department?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Employee ID</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {teacher.employee_id || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Qualification</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {teacher.qualification || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Experience</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {teacher.experience_years ? `${teacher.experience_years} years` : 'N/A'}
                  </Text>
                </View>
              </View>
              {teacher.specialization && (
                <View style={styles.infoRow}>
                  <FontAwesome5 name="star" size={14} color={colors.textMuted} />
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {teacher.specialization}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <FontAwesome5 name="calendar" size={14} color={colors.textMuted} />
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  Joined {formatDate(teacher.created_at)}
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Assigned Courses */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Card style={styles.infoCard}>
              <View style={styles.coursesHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Assigned Courses ({courses.length})
                </Text>
                <TouchableOpacity
                  style={[
                    styles.assignBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  onPress={() => Alert.alert('Assign', 'Assign course feature coming soon')}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={[styles.assignBtnText, { color: colors.primary }]}>Assign</Text>
                </TouchableOpacity>
              </View>
              {courses.length > 0 ? (
                courses.map((course, index) => (
                  <Animated.View
                    key={course.id}
                    entering={FadeInRight.delay(350 + index * 50).duration(300)}
                    style={[
                      styles.courseItem,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                  >
                    <Text style={[styles.courseName, { color: colors.textPrimary }]}>
                      {course.subject?.name || 'Unknown Subject'}
                    </Text>
                    <Text style={[styles.courseCode, { color: colors.textSecondary }]}>
                      {course.subject?.code || 'N/A'} • {course.section?.year?.name || ''} {course.section?.name || ''}
                    </Text>
                  </Animated.View>
                ))
              ) : (
                <View style={styles.emptyCourses}>
                  <FontAwesome5 name="book-open" size={24} color={colors.textMuted} />
                  <Text style={[styles.emptyCoursesText, { color: colors.textSecondary }]}>
                    No courses assigned yet
                  </Text>
                </View>
              )}
            </Card>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={handleToggleStatus}
              >
                <FontAwesome5 
                  name={teacher.profile?.status === 'active' ? 'user-slash' : 'user-check'}
                  size={16} 
                  color={teacher.profile?.status === 'active' ? colors.warning : colors.success}
                />
                <Text style={[
                  styles.actionBtnText,
                  { color: teacher.profile?.status === 'active' ? colors.warning : colors.success }
                ]}>
                  {teacher.profile?.status === 'active' ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={() => Alert.alert('Delete', 'Delete feature coming soon')}
              >
                <FontAwesome5 name="trash" size={16} color={colors.error} />
                <Text style={[styles.actionBtnText, { color: colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  profileCard: {
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  profilePhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileDesignation: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoGridItem: {
    width: '50%',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
  },
  coursesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  courseItem: {
    paddingLeft: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '500',
  },
  courseCode: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyCourses: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyCoursesText: {
    fontSize: 13,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

