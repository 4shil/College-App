import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { getAttendanceSummary, getStudentWithDetails } from '../lib/database';
import { toDateOnlyISO } from '../lib/dateUtils';
import type { PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

// Cache staleness time: 2 minutes
const STALE_TIME_MS = 2 * 60 * 1000;

// ============================================
// Query Result Types for Type-Safe Promise.all
// ============================================

type TimetableRow = {
  id: string;
  period: number;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  courses: { code: string | null; name: string; short_name: string | null } | null;
};

type AssignmentRow = {
  id: string;
  title: string;
  due_date: string;
  courses: { name: string } | null;
};

type NoticeRow = {
  id: string;
};

type MarksRow = {
  marks_obtained: number | null;
  created_at: string | null;
} | null;

type CanteenMenuItem = {
  id: string;
  is_sold_out: boolean | null;
};

type CanteenToken = {
  id: string;
};

type BusSubscription = {
  approval_status: string | null;
  routes: { route_number: string | null; route_name: string | null } | null;
  stops: { stop_name: string | null } | null;
} | null;

type BookIssue = {
  status: string | null;
  fine_amount: number | null;
  fine_paid: boolean | null;
};

type NoticeRead = {
  notice_id: string;
};

// ============================================
// Dashboard Types
// ============================================

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
  const lastFetchedRef = useRef<number>(0);

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

      // Pre-compute commonly used values
      const todayDayOfWeek = (() => {
        const d = new Date();
        let day = d.getDay();
        if (day === 0) day = 7;
        return day;
      })();

      const start = new Date();
      start.setDate(1);
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);

      const todayIso = toDateOnlyISO(new Date());
      const thirtyDaysFromNow = toDateOnlyISO(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      const canteenDate = todayIso;

      // Fetch academic year first (needed for other queries)
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .maybeSingle();

      const academicYearId = academicYear?.id || student.academic_year_id || null;

      // Build all independent queries to run in parallel with proper types
      // Query 1: Timetable (if conditions met)
      const timetableQuery: Promise<{ data: TimetableRow[] | null }> = (academicYearId && student.section_id)
        ? supabase
            .from('timetable_entries')
            .select(`
              id,
              period,
              start_time,
              end_time,
              room,
              courses:courses!timetable_entries_course_id_fkey(code, name, short_name)
            `)
            .eq('section_id', student.section_id)
            .eq('academic_year_id', academicYearId)
            .eq('day_of_week', todayDayOfWeek)
            .eq('is_active', true)
            .order('period') as unknown as Promise<{ data: TimetableRow[] | null }>
        : Promise.resolve({ data: [] });

      // Query 2: Attendance summary
      const attendanceQuery = getAttendanceSummary(
        student.id,
        toDateOnlyISO(start),
        toDateOnlyISO(end)
      );

      // Query 3: Assignments (if section_id exists)
      const assignmentsQuery: Promise<{ data: AssignmentRow[] | null }> = student.section_id
        ? supabase
            .from('assignments')
            .select(`id, title, due_date, courses:courses(name)`)
            .eq('section_id', student.section_id)
            .eq('is_active', true)
            .gte('due_date', todayIso)
            .lte('due_date', thirtyDaysFromNow)
            .order('due_date', { ascending: true })
            .limit(5) as unknown as Promise<{ data: AssignmentRow[] | null }>
        : Promise.resolve({ data: [] });

      // Query 4: Notices
      const noticesQuery: Promise<{ data: NoticeRow[] | null }> = (student.section_id || student.department_id)
        ? supabase
            .from('notices')
            .select('id')
            .eq('is_active', true)
            .or(`section_id.eq.${student.section_id},department_id.eq.${student.department_id},scope.eq.college`)
            .order('created_at', { ascending: false })
            .limit(50) as unknown as Promise<{ data: NoticeRow[] | null }>
        : Promise.resolve({ data: [] });

      // Query 5: Marks
      const marksQuery: Promise<{ data: MarksRow }> = supabase
        .from('exam_marks')
        .select('marks_obtained, created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as unknown as Promise<{ data: MarksRow }>;

      // Query 6: Canteen menu
      const canteenMenuQuery: Promise<{ data: CanteenMenuItem[] | null }> = supabase
        .from('canteen_daily_menu')
        .select('id, is_sold_out')
        .eq('date', canteenDate)
        .limit(50) as unknown as Promise<{ data: CanteenMenuItem[] | null }>;

      // Query 7: Canteen tokens (if user exists)
      const canteenTokensQuery: Promise<{ data: CanteenToken[] | null }> = user?.id
        ? supabase
            .from('canteen_tokens')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', canteenDate)
            .limit(50) as unknown as Promise<{ data: CanteenToken[] | null }>
        : Promise.resolve({ data: [] });

      // Query 8: Bus subscription (if academic year exists)
      const busSubQuery: Promise<{ data: BusSubscription }> = academicYearId
        ? supabase
            .from('bus_subscriptions')
            .select('approval_status, routes:bus_routes(route_number, route_name), stops:bus_stops(stop_name)')
            .eq('student_id', student.id)
            .eq('academic_year_id', academicYearId)
            .maybeSingle() as unknown as Promise<{ data: BusSubscription }>
        : Promise.resolve({ data: null });

      // Query 9: Library issues (if user exists)
      const libraryQuery: Promise<{ data: BookIssue[] | null }> = user?.id
        ? supabase
            .from('book_issues')
            .select('status, fine_amount, fine_paid')
            .eq('user_id', user.id)
            .limit(50) as unknown as Promise<{ data: BookIssue[] | null }>
        : Promise.resolve({ data: [] });

      // Execute all queries in parallel with typed results
      const [
        timetableResult,
        attendanceAgg,
        assignmentsResult,
        noticesResult,
        marksResult,
        menuResult,
        tokensResult,
        busSubResult,
        libraryResult,
      ] = await Promise.all([
        timetableQuery,
        attendanceQuery,
        assignmentsQuery,
        noticesQuery,
        marksQuery,
        canteenMenuQuery,
        canteenTokensQuery,
        busSubQuery,
        libraryQuery,
      ]);

      // Process timetable with proper types
      const todayTimetable: TodayTimetableEntry[] = [];
      (timetableResult.data || []).forEach((row) => {
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

      const nextClass = computeNextClass(todayTimetable);

      // Process attendance
      const attendanceSummary: AttendanceSummaryCard = {
        percentage: attendanceAgg.percentage,
        present: attendanceAgg.present + attendanceAgg.late,
        total: attendanceAgg.total,
        status: attendanceAgg.percentage >= 80 ? 'good' : attendanceAgg.percentage >= 75 ? 'warning' : 'critical',
      };

      // Process assignments with proper types
      const upcomingAssignments: UpcomingAssignmentCard[] = [];
      (assignmentsResult.data || []).forEach((a) => {
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

      // Process notices - need a second query for read status
      const noticeIds: string[] = (noticesResult.data || []).map((n) => String(n.id)).filter(Boolean);
      const quickNoticesCount = noticeIds.length;
      let unreadNoticesCount = 0;

      if (noticeIds.length > 0 && user?.id) {
        const { data: reads } = await supabase
          .from('notice_reads')
          .select('notice_id')
          .eq('user_id', user.id)
          .in('notice_id', noticeIds) as { data: NoticeRead[] | null };

        const readSet = new Set<string>();
        (reads || []).forEach((r) => {
          if (r?.notice_id) readSet.add(String(r.notice_id));
        });

        unreadNoticesCount = noticeIds.filter((id: string) => !readSet.has(String(id))).length;
      }

      // Process marks with proper types
      let marksSnapshot: InternalMarksPreview | null = null;
      const marksRow = marksResult.data;
      if (marksRow?.marks_obtained != null) {
        const value = Number(marksRow.marks_obtained);
        marksSnapshot = {
          totalMarks: 100,
          obtainedMarks: value,
          percentage: Math.max(0, Math.min(100, value)),
          lastUpdated: String(marksRow.created_at || '').split('T')[0],
        };
      }

      // Process canteen data with proper types
      const menuRows = menuResult.data || [];
      const canteenMenuCount = menuRows.length;
      const canteenSoldOutCount = menuRows.filter((m) => Boolean(m?.is_sold_out)).length;
      const myCanteenTokensCount = (tokensResult.data || []).length;

      // Process bus subscription with proper types
      const sub = busSubResult.data;
      let busSubscriptionStatus: 'none' | 'pending' | 'approved' | 'rejected' = 'none';
      let busRouteLabel: string | null = null;
      let busStopLabel: string | null = null;
      if (sub) {
        const statusRaw = String(sub?.approval_status || 'none');
        if (statusRaw === 'pending' || statusRaw === 'approved' || statusRaw === 'rejected') {
          busSubscriptionStatus = statusRaw;
        }
        if (sub?.routes?.route_number || sub?.routes?.route_name) {
          busRouteLabel = `${sub.routes?.route_number || ''}${sub.routes?.route_name ? ` • ${sub.routes.route_name}` : ''}`.trim();
        }
        busStopLabel = sub?.stops?.stop_name ? String(sub.stops.stop_name) : null;
      }

      // Process library data with proper types
      const issueRows = libraryResult.data || [];
      const activeIssues = issueRows.filter((i) => String(i?.status || '').toLowerCase() !== 'returned');
      const libraryActiveIssuesCount = activeIssues.length;
      const libraryFineDue = activeIssues.reduce((sum: number, row) => {
        const fine = Number(row?.fine_amount || 0);
        const paid = Boolean(row?.fine_paid);
        return sum + (!paid ? fine : 0);
      }, 0);

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
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
      lastFetchedRef.current = Date.now();
    }
  }, [user, computeNextClass]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    lastFetchedRef.current = 0; // Force refetch on manual refresh
    await fetchDashboardData();
  }, [fetchDashboardData]);

  useFocusEffect(
    useCallback(() => {
      // Only refetch if data is stale (older than STALE_TIME_MS)
      const isStale = Date.now() - lastFetchedRef.current > STALE_TIME_MS;
      const hasNoData = !summary;
      
      if (isStale || hasNoData) {
        fetchDashboardData();
      }
    }, [fetchDashboardData, summary])
  );

  return {
    summary,
    loading,
    refreshing,
    error,
    refresh,
  };
};
