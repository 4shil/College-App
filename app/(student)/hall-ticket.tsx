import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedBackground, LoadingIndicator } from '../../components/ui';
import { HallTicket } from '../../components/HallTicket';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getStudentByUserId } from '../../lib/database';
import { withAlpha } from '../../theme/colorUtils';

interface ExamScheduleItem {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  courses: {
    code: string;
    name: string;
  } | null;
}

export default function HallTicketScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [examSchedule, setExamSchedule] = useState<ExamScheduleItem[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch student details
      const student = await getStudentByUserId(user.id);
      if (!student) {
        Alert.alert('Error', 'Student profile not found');
        return;
      }

      // Fetch student with full details
      const { data: studentDetails, error: studentError } = await supabase
        .from('students')
        .select(
          `
          id,
          registration_number,
          roll_number,
          profiles!inner(full_name, avatar_url),
          departments(name),
          sections(name),
          years(year_number)
        `
        )
        .eq('id', student.id)
        .single();

      if (studentError) throw studentError;

      setStudentData(studentDetails);

      // Fetch upcoming exam schedules for the student
      const { data: schedules, error: scheduleError } = await supabase
        .from('exam_schedules')
        .select(
          `
          id,
          date,
          start_time,
          end_time,
          courses(code, name),
          exams!inner(name, status)
        `
        )
        .eq('exams.status', 'published')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(20);

      if (scheduleError) throw scheduleError;

      setExamSchedule(schedules || []);
      
      // Auto-select first exam
      if (schedules && schedules.length > 0) {
        setSelectedExam(schedules[0].id);
      }
    } catch (error: any) {
      console.error('Hall ticket fetch error:', error);
      Alert.alert('Error', error.message || 'Failed to load hall ticket data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'long' });
  };

  const formatTime = (timeStr: string) => {
    return timeStr ? timeStr.substring(0, 5) : '-';
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <LoadingIndicator color={colors.primary} />
            <Text style={{ marginTop: 10, color: colors.textMuted, fontSize: 13 }}>
              Loading hall ticket...
            </Text>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  if (!studentData || examSchedule.length === 0) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
          <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 20 }}>
            <Text style={[styles.header, { color: colors.textPrimary }]}>Hall Ticket</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              Examination admission card
            </Text>
          </Animated.View>

          <View style={[styles.emptyContainer, { backgroundColor: withAlpha(colors.warning, isDark ? 0.15 : 0.1) }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Upcoming Exams
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Hall tickets will appear when exams are scheduled
            </Text>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  // Prepare hall ticket data
  const hallTicketData = {
    studentName: studentData.profiles.full_name,
    registrationNumber: studentData.registration_number,
    rollNumber: studentData.roll_number,
    courseName: `${studentData.departments?.name || 'Department'} - Year ${studentData.years?.year_number || '-'}`,
    semester: studentData.years?.year_number ? (studentData.years.year_number * 2 - 1) : 1,
    examName: 'Internal Examination',
    photoUrl: studentData.profiles.avatar_url,
    examSchedule: examSchedule.map((exam) => ({
      date: formatDate(exam.date),
      day: formatDay(exam.date),
      time: `${formatTime(exam.start_time)} - ${formatTime(exam.end_time)}`,
      subjectCode: exam.courses?.code || 'N/A',
      subjectName: exam.courses?.name || 'Subject',
    })),
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 110 }]}>
        <Animated.View entering={FadeInRight.duration(350)} style={{ marginBottom: 16 }}>
          <Text style={[styles.header, { color: colors.textPrimary }]}>Hall Ticket</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {examSchedule.length} exam(s) scheduled
          </Text>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.15) }]}
            onPress={() => Alert.alert('Coming Soon', 'Download PDF feature will be available soon')}
          >
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Download PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: withAlpha(colors.secondary, isDark ? 0.2 : 0.15) }]}
            onPress={() => Alert.alert('Coming Soon', 'Print feature will be available soon')}
          >
            <Ionicons name="print-outline" size={18} color={colors.secondary} />
            <Text style={[styles.actionText, { color: colors.secondary }]}>Print</Text>
          </TouchableOpacity>
        </View>

        <HallTicket data={hallTicketData} collegeName="Your College Name" />
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
  },
  headerSub: {
    marginTop: 4,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
