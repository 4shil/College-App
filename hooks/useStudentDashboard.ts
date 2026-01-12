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

  // Campus previews
  canteenMenuCount: number;
  canteenSoldOutCount: number;
  myCanteenTokensCount: number;

  busSubscriptionStatus: 'none' | 'pending' | 'approved' | 'rejected';
  busRouteLabel: string | null;
  busStopLabel: string | null;

  libraryActiveIssuesCount: number;
  libraryFineDue: number;
};

export const useStudentDashboard = () => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<StudentDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeNextClass = useCallback((entries: TodayTimetableEntry[]) => {
    if (!entries || entries.length === 0) return null;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const parseMinutes = (time: string) => {
      const parts = String(time || '').split(':');
      const h = Number(parts[0] || 0);
      const m = Number(parts[1] || 0);
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };

    let best: { courseName: string; startsInMinutes: number } | null = null;
    for (const e of entries) {
      const start = parseMinutes(e.startTime);
      if (start == null) continue;
      const diff = start - nowMinutes;
      if (diff <= 0) continue;
      if (!best || diff < best.startsInMinutes) {
        best = { courseName: e.courseName, startsInMinutes: diff };
      }
    }
    return best;
  }, []);

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

      const academicYearId = academicYear?.id || student.academic_year_id || null;

      const todayDayOfWeek = (() => {
        const d = new Date();
        let day = d.getDay();
        if (day === 0) day = 7;
        return day;
      })();

      const todayTimetable: TodayTimetableEntry[] = [];
      if (academicYearId && student.section_id) {
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
          .eq('academic_year_id', academicYearId)
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

      const nextClass = computeNextClass(todayTimetable);

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

      // Notice counters (kept aligned with app/(student)/notices query semantics)
      let quickNoticesCount = 0;
      let unreadNoticesCount = 0;

      if (student.section_id || student.department_id) {
        const { data: noticeRows } = await supabase
          .from('notices')
          .select('id')
          .eq('is_active', true)
          .or(`section_id.eq.${student.section_id},department_id.eq.${student.department_id},scope.eq.college`)
          .order('created_at', { ascending: false })
          .limit(50);

        const noticeIds: string[] = (noticeRows || []).map((n: any) => String(n.id)).filter(Boolean);
        quickNoticesCount = noticeIds.length;

        if (noticeIds.length > 0 && user?.id) {
          const { data: reads } = await supabase
            .from('notice_reads')
            .select('notice_id')
            .eq('user_id', user.id)
            .in('notice_id', noticeIds);

          const readSet = new Set<string>();
          (reads || []).forEach((r: any) => {
            if (r?.notice_id) readSet.add(String(r.notice_id));
          });

          unreadNoticesCount = noticeIds.filter((id: string) => !readSet.has(String(id))).length;
        }
      }

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

      // Campus previews
      const canteenDate = toDateOnlyISO(new Date());
      let canteenMenuCount = 0;
      let canteenSoldOutCount = 0;
      let myCanteenTokensCount = 0;

      const { data: menuRows } = await supabase
        .from('canteen_daily_menu')
        .select('id, is_sold_out')
        .eq('date', canteenDate)
        .limit(50);

      canteenMenuCount = (menuRows || []).length;
      canteenSoldOutCount = (menuRows || []).filter((m: any) => Boolean(m?.is_sold_out)).length;

      if (user?.id) {
        const { data: tokenRows } = await supabase
          .from('canteen_tokens')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', canteenDate)
          .limit(50);
        myCanteenTokensCount = (tokenRows || []).length;
      }

      let busSubscriptionStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
      let busRouteLabel: string | null = null;
      let busStopLabel: string | null = null;
      if (academicYearId) {
        const { data: sub } = await supabase
          .from('bus_subscriptions')
          .select(
            'approval_status, routes:bus_routes(route_number, route_name), stops:bus_stops(stop_name)'
          )
          .eq('student_id', student.id)
          .eq('academic_year_id', academicYearId)
          .maybeSingle();

        const statusRaw = String(sub?.approval_status || 'none');
        if (statusRaw === 'pending' || statusRaw === 'approved' || statusRaw === 'rejected') {
          busSubscriptionStatus = statusRaw as any;
        }
        if (sub?.routes?.route_number || sub?.routes?.route_name) {
          busRouteLabel = `${sub.routes?.route_number || ''}${sub.routes?.route_name ? ` • ${sub.routes.route_name}` : ''}`.trim();
        }
        busStopLabel = sub?.stops?.stop_name ? String(sub.stops.stop_name) : null;
      }

      let libraryActiveIssuesCount = 0;
      let libraryFineDue = 0;
      if (user?.id) {
        const { data: issueRows } = await supabase
          .from('book_issues')
          .select('status, fine_amount, fine_paid')
          .eq('user_id', user.id)
          .limit(50);

        const activeIssues = (issueRows || []).filter((i: any) => String(i?.status || '').toLowerCase() !== 'returned');
        libraryActiveIssuesCount = activeIssues.length;
        libraryFineDue = activeIssues.reduce((sum: number, row: any) => {
          const fine = Number(row?.fine_amount || 0);
          const paid = Boolean(row?.fine_paid);
          return sum + (!paid ? fine : 0);
        }, 0);
      }

      setSummary({
        cachedAt: Date.now(),
        studentName: student.profile?.full_name || 'Student',
        studentRollNumber: student.roll_number || 'N/A',
        departmentName: student.department?.name || 'Unknown',
        todayTimetable,
        nextClass,
        attendanceSummary,
        marksSnapshot,
        upcomingAssignments,
        quickNoticesCount,
        unreadNoticesCount,

        canteenMenuCount,
        canteenSoldOutCount,
        myCanteenTokensCount,

        busSubscriptionStatus,
        busRouteLabel,
        busStopLabel,

        libraryActiveIssuesCount,
        libraryFineDue,
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
