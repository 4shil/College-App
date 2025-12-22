import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card, IconBadge } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface PendingStudent {
  id: string;
  registration_number: string | null;
  admission_year: number | null;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    photo_url: string | null;
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

export default function PendingApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          registration_number,
          admission_year,
          created_at,
          profile:profiles!students_user_id_fkey(id, full_name, email, phone, photo_url),
          department:departments!students_department_id_fkey(id, name, code),
          year:years!students_year_id_fkey(id, name, year_number),
          section:sections!students_section_id_fkey(id, name)
        `)
        .eq('current_status', 'inactive')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingStudents(data || []);
    } catch (error) {
      console.error('Error fetching pending students:', error);
      Alert.alert('Error', 'Failed to fetch pending students');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchPendingStudents();
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingStudents();
    setRefreshing(false);
  };

  const handleApprove = async (student: PendingStudent) => {
    Alert.alert(
      'Approve Student',
      `Are you sure you want to approve ${student.profile?.full_name || 'this student'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessingId(student.id);
            try {
              // Update student status
              const { error: studentError } = await supabase
                .from('students')
                .update({ current_status: 'active' })
                .eq('id', student.id);

              if (studentError) throw studentError;

              // Update profile status
              if (student.profile?.id) {
                const { error: profileError } = await supabase
                  .from('profiles')
                  .update({ status: 'active' })
                  .eq('id', student.profile.id);

                if (profileError) throw profileError;
              }

              Alert.alert('Success', 'Student approved successfully');
              await fetchPendingStudents();
            } catch (error) {
              console.error('Error approving student:', error);
              Alert.alert('Error', 'Failed to approve student');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (student: PendingStudent) => {
    Alert.alert(
      'Reject Student',
      `Are you sure you want to reject ${student.profile?.full_name || 'this student'}? This will delete their registration.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(student.id);
            try {
              // Delete student record
              const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', student.id);

              if (error) throw error;

              Alert.alert('Success', 'Student registration rejected');
              await fetchPendingStudents();
            } catch (error) {
              console.error('Error rejecting student:', error);
              Alert.alert('Error', 'Failed to reject student');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStudentCard = (student: PendingStudent, index: number) => {
    const isProcessing = processingId === student.id;

    return (
      <Animated.View
        key={student.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <Card style={styles.studentCard}>
          {/* Header with Photo */}
          <View style={styles.cardHeader}>
            <View style={styles.photoContainer}>
              {student.profile?.photo_url ? (
                <Image
                  source={{ uri: student.profile.photo_url }}
                  style={styles.photo}
                />
              ) : (
                <IconBadge
                  family="fa5"
                  name="user-graduate"
                  tone="primary"
                  size={24}
                  style={styles.photoPlaceholder}
                />
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                {student.profile?.full_name || 'Unknown'}
              </Text>
              <Text style={[styles.studentEmail, { color: colors.textSecondary }]}>
                {student.profile?.email || 'No email'}
              </Text>
              <View
                style={[
                  styles.pendingBadge,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
              >
                <FontAwesome5 name="clock" size={10} color={colors.warning} />
                <Text style={[styles.pendingText, { color: colors.warning }]}>Pending Approval</Text>
              </View>
            </View>
          </View>

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View
              style={[
                styles.detailItem,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <FontAwesome5 name="building" size={12} color={colors.textMuted} />
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Department</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {student.department?.name || 'N/A'}
              </Text>
            </View>
            <View
              style={[
                styles.detailItem,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <FontAwesome5 name="layer-group" size={12} color={colors.textMuted} />
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Year</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {student.year?.name || 'N/A'}
              </Text>
            </View>
            <View
              style={[
                styles.detailItem,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <FontAwesome5 name="phone" size={12} color={colors.textMuted} />
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Phone</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {student.profile?.phone || 'N/A'}
              </Text>
            </View>
            <View
              style={[
                styles.detailItem,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  borderWidth: colors.borderWidth,
                },
              ]}
            >
              <FontAwesome5 name="calendar" size={12} color={colors.textMuted} />
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Applied</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {formatDate(student.created_at)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error }, { opacity: isProcessing ? 0.5 : 1 }]}
              onPress={() => handleReject(student)}
              disabled={isProcessing}
            >
              {isProcessing && processingId === student.id ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="close" size={18} color={colors.textInverse} />
                  <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>Reject</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }, { opacity: isProcessing ? 0.5 : 1 }]}
              onPress={() => handleApprove(student)}
              disabled={isProcessing}
            >
              {isProcessing && processingId === student.id ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.textInverse} />
                  <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View
      entering={FadeInDown.delay(200).duration(400)}
      style={styles.emptyState}
    >
      <IconBadge family="fa5" name="check-circle" tone="primary" size={40} style={styles.emptyIcon} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        All Caught Up!
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        No pending student approvals at the moment
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
              Pending Approvals
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {pendingStudents.length} student(s) waiting
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.refreshBtn,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
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
                Loading pending approvals...
              </Text>
            </View>
          ) : pendingStudents.length > 0 ? (
            pendingStudents.map((student, index) => renderStudentCard(student, index))
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
  refreshBtn: {
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
    marginBottom: 16,
  },
  studentCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  photoContainer: {
    marginRight: 14,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  headerInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
  },
  studentEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  detailItem: {
    width: '47%',
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  approveBtn: {
    backgroundColor: 'transparent',
  },
  rejectBtn: {
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
