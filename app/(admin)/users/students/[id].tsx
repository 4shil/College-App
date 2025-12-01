import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { AnimatedBackground, GlassCard } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface StudentDetails {
  id: string;
  user_id: string;
  registration_number: string | null;
  admission_year: number | null;
  admission_date: string | null;
  roll_number: string | null;
  current_status: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    photo_url: string | null;
    gender: string | null;
    date_of_birth: string | null;
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

interface ParentInfo {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  relation: string;
}

export default function StudentDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [parents, setParents] = useState<ParentInfo[]>([]);

  useEffect(() => {
    fetchStudentDetails();
  }, [id]);

  const fetchStudentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          user_id,
          registration_number,
          admission_year,
          admission_date,
          roll_number,
          current_status,
          created_at,
          profile:profiles!students_user_id_fkey(
            id, full_name, email, phone, photo_url, gender, date_of_birth, status
          ),
          department:departments!students_department_id_fkey(id, name, code),
          year:years!students_year_id_fkey(id, name, year_number),
          section:sections!students_section_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setStudent(data);

      // Fetch parent info if available
      if (data?.user_id) {
        const { data: parentData } = await supabase
          .from('parents')
          .select(`
            id,
            relation,
            profile:profiles!parents_user_id_fkey(full_name, phone, email)
          `)
          .eq('student_id', data.user_id);

        if (parentData) {
          const formattedParents = parentData.map((p: any) => ({
            id: p.id,
            full_name: p.profile?.full_name || 'Unknown',
            phone: p.profile?.phone,
            email: p.profile?.email,
            relation: p.relation || 'Parent',
          }));
          setParents(formattedParents);
        }
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      Alert.alert('Error', 'Failed to fetch student details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    Alert.alert(
      'Change Status',
      `Change student status to "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('students')
                .update({ current_status: newStatus })
                .eq('id', id);

              if (error) throw error;

              // Also update profile status
              if (student?.profile?.id) {
                await supabase
                  .from('profiles')
                  .update({ status: newStatus === 'active' ? 'active' : 'inactive' })
                  .eq('id', student.profile.id);
              }

              setStudent(prev => prev ? { ...prev, current_status: newStatus } : null);
              Alert.alert('Success', 'Status updated successfully');
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
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'graduated': return '#3b82f6';
      case 'suspended': return '#ef4444';
      case 'dropped': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading student details...
          </Text>
        </View>
      </AnimatedBackground>
    );
  }

  if (!student) return null;

  const age = calculateAge(student.profile?.date_of_birth || null);

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
              Student Details
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.primary + '15' }]}
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
            <GlassCard style={styles.profileCard}>
              <View style={styles.profileHeader}>
                {student.profile?.photo_url ? (
                  <Image
                    source={{ uri: student.profile.photo_url }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <View style={[styles.profilePhotoPlaceholder, { backgroundColor: '#10b98120' }]}>
                    <FontAwesome5 name="user-graduate" size={36} color="#10b981" />
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                    {student.profile?.full_name || 'Unknown'}
                  </Text>
                  <Text style={[styles.profileRegNo, { color: colors.primary }]}>
                    {student.registration_number || 'No Reg. No.'}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.current_status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(student.current_status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(student.current_status) }]}>
                      {student.current_status}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Academic Info */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <GlassCard style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Academic Information
              </Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Department</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {student.department?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Year</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {student.year?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Section</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {student.section?.name || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Roll No.</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {student.roll_number || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Admission Year</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {student.admission_year || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Admission Date</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {formatDate(student.admission_date)}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Personal Info */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)}>
            <GlassCard style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Personal Information
              </Text>
              <View style={styles.infoRow}>
                <FontAwesome5 name="envelope" size={14} color={colors.textMuted} />
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {student.profile?.email || 'No email'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <FontAwesome5 name="phone" size={14} color={colors.textMuted} />
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                  {student.profile?.phone || 'No phone'}
                </Text>
              </View>
              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Gender</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {student.profile?.gender || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Date of Birth</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                    {formatDate(student.profile?.date_of_birth || null)}
                    {age && ` (${age} yrs)`}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Parent/Guardian Info */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <GlassCard style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Parent/Guardian Information
              </Text>
              {parents.length > 0 ? (
                parents.map((parent, index) => (
                  <View
                    key={parent.id}
                    style={[
                      styles.parentItem,
                      index < parents.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        paddingBottom: 12,
                        marginBottom: 12,
                      },
                    ]}
                  >
                    <View style={styles.parentHeader}>
                      <View style={[styles.parentIcon, { backgroundColor: '#8b5cf620' }]}>
                        <FontAwesome5 name="user" size={12} color="#8b5cf6" />
                      </View>
                      <View>
                        <Text style={[styles.parentName, { color: colors.textPrimary }]}>
                          {parent.full_name}
                        </Text>
                        <Text style={[styles.parentRelation, { color: colors.textSecondary }]}>
                          {parent.relation}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.parentContact}>
                      {parent.phone && (
                        <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#10b98115' }]}>
                          <FontAwesome5 name="phone" size={12} color="#10b981" />
                          <Text style={[styles.contactBtnText, { color: '#10b981' }]}>
                            {parent.phone}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyParents}>
                  <FontAwesome5 name="users" size={24} color={colors.textMuted} />
                  <Text style={[styles.emptyParentsText, { color: colors.textSecondary }]}>
                    No parent information available
                  </Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <GlassCard style={styles.infoCard}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Quick Actions
              </Text>
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#3b82f620' }]}
                  onPress={() => Alert.alert('View', 'Attendance feature coming soon')}
                >
                  <FontAwesome5 name="calendar-check" size={16} color="#3b82f6" />
                  <Text style={[styles.quickActionText, { color: '#3b82f6' }]}>
                    Attendance
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#f59e0b20' }]}
                  onPress={() => Alert.alert('View', 'Results feature coming soon')}
                >
                  <FontAwesome5 name="chart-bar" size={16} color="#f59e0b" />
                  <Text style={[styles.quickActionText, { color: '#f59e0b' }]}>
                    Results
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.quickActionBtn, { backgroundColor: '#10b98120' }]}
                  onPress={() => Alert.alert('View', 'Fees feature coming soon')}
                >
                  <FontAwesome5 name="money-bill" size={16} color="#10b981" />
                  <Text style={[styles.quickActionText, { color: '#10b981' }]}>
                    Fees
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Status Actions */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <View style={styles.statusActions}>
              {student.current_status !== 'active' && (
                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: '#10b98120' }]}
                  onPress={() => handleStatusChange('active')}
                >
                  <FontAwesome5 name="check" size={14} color="#10b981" />
                  <Text style={[styles.statusBtnText, { color: '#10b981' }]}>
                    Activate
                  </Text>
                </TouchableOpacity>
              )}
              {student.current_status === 'active' && (
                <>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#f59e0b20' }]}
                    onPress={() => handleStatusChange('inactive')}
                  >
                    <FontAwesome5 name="pause" size={14} color="#f59e0b" />
                    <Text style={[styles.statusBtnText, { color: '#f59e0b' }]}>
                      Deactivate
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: '#3b82f620' }]}
                    onPress={() => handleStatusChange('graduated')}
                  >
                    <FontAwesome5 name="graduation-cap" size={14} color="#3b82f6" />
                    <Text style={[styles.statusBtnText, { color: '#3b82f6' }]}>
                      Graduate
                    </Text>
                  </TouchableOpacity>
                </>
              )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileRegNo: {
    fontSize: 14,
    fontWeight: '600',
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
  parentItem: {},
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parentIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  parentRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  parentContact: {
    flexDirection: 'row',
    marginTop: 10,
    marginLeft: 44,
    gap: 8,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyParents: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyParentsText: {
    fontSize: 13,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
