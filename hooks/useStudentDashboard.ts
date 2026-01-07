import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

function toDateOnlyISO(d: Date) {
  return d.toISOString().split('T')[0];
}

export type AttendanceSummaryCard = {
  percentage: number;
  present: number;
  total: number;
  status: 'good' | 'warning' | 'critical';
};

export type UpcomingAssignmentCard = {
  id: string;
  courseName: string;
  title: string;
  dueDate: string;
  daysLeft: number;
  isOverdue: boolean;
};

export type InternalMarksPreview = {
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  lastUpdated: string;
};

export type TodayTimetableEntry = {
  entryId: string;
  period: number;
  timeLabel: string;
  courseName: string;
  courseCode: string;
  roomLabel: string | null;
  teacherName: string;
};

export type StudentDashboardSummary = {
  cachedAt: number;

  studentName: string;
  studentRollNumber: string;
  departmentName: string;

  // Today's timetable
  todayTimetable: TodayTimetableEntry[];
  nextClass: {
    courseName: string;
    timeLabel: string;
    startsInMinutes: number;
  } | null;

  // Attendance snapshot
  attendanceSummary: AttendanceSummaryCard;

  // Internal marks snapshot
  marksSnapshot: InternalMarksPreview | null;

  // Upcoming assignments
  upcomingAssignments: UpcomingAssignmentCard[];

  // Quick links
  quickNoticesCount: number;
  unreadNoticesCount: number;
};

const CACHE_KEY = 'student_dashboard_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useStudentDashboard = () => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          profiles(*),
          departments(*),
          years(*),
          sections(*)
        `)
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;

      if (!student) {
        setError('Student record not found');
        setLoading(false);
        return;
      }

      const today = toDateOnlyISO(new Date());
      const thirtyDaysFromNow = toDateOnlyISO(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

      // Fetch today's timetable
      const { data: timetableData } = await supabase
        .from('timetable_entries')
        .select(`
          *,
          courses(*),
          teachers(full_name),
          rooms(room_number)
        `)
        .eq('department_id', student.department_id)
        .eq('year_id', student.year_id)
        .eq('section_id', student.section_id)
        .eq('date', today)
        .order('period', { ascending: true });

      const todayTimetable: TodayTimetableEntry[] = (timetableData || []).map((entry: any) => ({
        entryId: entry.id,
        period: entry.period,
        timeLabel: `Period ${entry.period}`,
        courseName: entry.courses?.name || 'Unknown Course',
        courseCode: entry.courses?.code || '',
        roomLabel: entry.rooms?.room_number || null,
        teacherName: entry.teachers?.full_name || 'TBA',
      }));

      // Fetch attendance summary
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', student.id);

      const attendanceRecords = attendanceData || [];
      const presentCount = attendanceRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length;
      const totalCount = attendanceRecords.length;
      const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

      const attendanceSummary: AttendanceSummaryCard = {
        percentage: attendancePercentage,
        present: presentCount,
        total: totalCount,
        status: attendancePercentage >= 80 ? 'good' : attendancePercentage >= 75 ? 'warning' : 'critical',
      };

      // Fetch internal marks
      const { data: marksData } = await supabase
        .from('exam_marks')
        .select('marks')
        .eq('student_id', student.id)
        .limit(1)
        .single();

      let marksSnapshot: InternalMarksPreview | null = null;
      if (marksData) {
        marksSnapshot = {
          totalMarks: 100,
          obtainedMarks: marksData.marks || 0,
          percentage: marksData.marks || 0,
          lastUpdated: new Date().toISOString().split('T')[0],
        };
      }

      // Fetch upcoming assignments
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select(`
          *,
          courses(name)
        `)
        .eq('section_id', student.section_id)
        .gte('due_date', today)
        .lte('due_date', thirtyDaysFromNow)
        .order('due_date', { ascending: true })
        .limit(5);

      const upcomingAssignments: UpcomingAssignmentCard[] = (assignmentsData || []).map((a: any) => {
        const dueDate = new Date(a.due_date);
        const now = new Date();
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: a.id,
          courseName: a.courses?.name || 'Unknown Course',
          title: a.title,
          dueDate: a.due_date,
          daysLeft: Math.max(0, daysLeft),
          isOverdue: daysLeft < 0,
        };
      });

      // Fetch notices count
      const { data: noticesData } = await supabase
        .from('notices')
        .select('id, is_read')
        .eq('visible_to', 'student')
        .order('created_at', { ascending: false });

      const quickNoticesCount = (noticesData || []).length;
      const unreadNoticesCount = (noticesData || []).filter((n: any) => !n.is_read).length;

      setSummary({
        cachedAt: Date.now(),
        studentName: student.profiles?.full_name || 'Student',
        studentRollNumber: student.roll_number || 'N/A',
        departmentName: student.departments?.name || 'Unknown',
        todayTimetable,
        nextClass: null, // Will be calculated in component
        attendanceSummary,
        marksSnapshot,
        upcomingAssignments,
        quickNoticesCount,
        unreadNoticesCount,
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
  }, [fetchDashboardData]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  return {
    summary,
    loading,
    refreshing,
    error,
    refresh,
  };
};
