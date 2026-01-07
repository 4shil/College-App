import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { getAttendanceSummary, getStudentWithDetails } from '../lib/database';

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
  courseName: string;
  courseCode: string | null;
  roomLabel: string | null;
  startTime: string;
  endTime: string;
};

export type StudentDashboardSummary = {
  cachedAt: number;

  studentName: string;
  studentRollNumber: string;
  departmentName: string;

  // Today's timetable
  todayTimetable: TodayTimetableEntry[];
  nextClass: { courseName: string; startsInMinutes: number } | null;

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

      const student = await getStudentWithDetails(user.id);
      if (!student) {
        setError('Student record not found');
        setLoading(false);
        return;
      }
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      const todayDayOfWeek = (() => {
        const d = new Date();
        let day = d.getDay();
        if (day === 0) day = 7;
        return day;
      })();

      const todayTimetable: TodayTimetableEntry[] = [];
      if (academicYear?.id && student.section_id) {
        const { data: timetableRows } = await supabase
          .from('timetable_entries')
          .select(
            `
              id,
              period,
              start_time,
              end_time,
              room,
              courses:courses!timetable_entries_course_id_fkey(code, name, short_name)
            `
          )
          .eq('section_id', student.section_id)
          .eq('academic_year_id', academicYear.id)
          .eq('day_of_week', todayDayOfWeek)
          .eq('is_active', true)
          .order('period');

        (timetableRows || []).forEach((row: any) => {
          todayTimetable.push({
            entryId: row.id,
            period: row.period,
            courseName: row.courses?.short_name || row.courses?.name || 'Class',
            courseCode: row.courses?.code || null,
            roomLabel: row.room || null,
            startTime: String(row.start_time || ''),
            endTime: String(row.end_time || ''),
          });
        });
      }

      const start = new Date();
      start.setDate(1);
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);

      const attendanceAgg = await getAttendanceSummary(
        student.id,
        toDateOnlyISO(start),
        toDateOnlyISO(end)
      );

      const attendanceSummary: AttendanceSummaryCard = {
        percentage: attendanceAgg.percentage,
        present: attendanceAgg.present + attendanceAgg.late,
        total: attendanceAgg.total,
        status: attendanceAgg.percentage >= 80 ? 'good' : attendanceAgg.percentage >= 75 ? 'warning' : 'critical',
      };

      const upcomingAssignments: UpcomingAssignmentCard[] = [];
      if (student.section_id) {
        const todayIso = toDateOnlyISO(new Date());
        const thirtyDaysFromNow = toDateOnlyISO(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select(`id, title, due_date, courses:courses(name)`)
          .eq('section_id', student.section_id)
          .eq('is_active', true)
          .gte('due_date', todayIso)
          .lte('due_date', thirtyDaysFromNow)
          .order('due_date', { ascending: true })
          .limit(5);

        (assignmentsData || []).forEach((a: any) => {
          const dueDate = new Date(a.due_date);
          const now = new Date();
          const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          upcomingAssignments.push({
            id: a.id,
            courseName: a.courses?.name || 'Course',
            title: a.title,
            dueDate: a.due_date,
            daysLeft,
            isOverdue: daysLeft < 0,
          });
        });
      }

      const quickNoticesCount = 0;
      const unreadNoticesCount = 0;

      // Minimal marks preview: if student has at least one internal mark, show latest.
      let marksSnapshot: InternalMarksPreview | null = null;
      const { data: marksRow } = await supabase
        .from('exam_marks')
        .select('marks_obtained, created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (marksRow?.marks_obtained != null) {
        const value = Number(marksRow.marks_obtained);
        marksSnapshot = {
          totalMarks: 100,
          obtainedMarks: value,
          percentage: Math.max(0, Math.min(100, value)),
          lastUpdated: String(marksRow.created_at || '').split('T')[0],
        };
      }

      setSummary({
        cachedAt: Date.now(),
        studentName: student.profiles?.full_name || 'Student',
        studentRollNumber: student.roll_number || 'N/A',
        departmentName: student.departments?.name || 'Unknown',
        todayTimetable,
        nextClass: null,
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
