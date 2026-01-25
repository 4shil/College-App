import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { toDateOnlyISO } from '../lib/dateUtils';
import { logger } from '../lib/logger';

// Default period timings - used as fallback if database fetch fails
const DEFAULT_PERIOD_TIMINGS = [
  { period: 1, start: '9:40', end: '10:35' },
  { period: 2, start: '10:50', end: '11:40' },
  { period: 3, start: '11:50', end: '12:45' },
  { period: 4, start: '13:25', end: '14:15' },
  { period: 5, start: '14:20', end: '15:10' },
];

// Cache for period timings from database
let cachedPeriodTimings: { period: number; start: string; end: string }[] | null = null;
let periodTimingsCacheTime = 0;
const PERIOD_TIMINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches period timings from database with caching
 * Falls back to default timings on error
 */
async function getPeriodTimings(departmentId?: string): Promise<{ period: number; start: string; end: string }[]> {
  // Check cache
  if (cachedPeriodTimings && Date.now() - periodTimingsCacheTime < PERIOD_TIMINGS_CACHE_TTL) {
    return cachedPeriodTimings;
  }

  try {
    const { data, error } = await supabase
      .rpc('get_period_timings', { p_department_id: departmentId || null });

    if (error || !data || data.length === 0) {
      logger.warn('Failed to fetch period timings from database, using defaults');
      return DEFAULT_PERIOD_TIMINGS;
    }

    // Transform database format to expected format
    const timings = data
      .filter((t: any) => !t.is_break) // Exclude breaks
      .map((t: any, idx: number) => ({
        period: idx + 1,
        start: t.start_time.substring(0, 5), // HH:MM from HH:MM:SS
        end: t.end_time.substring(0, 5),
      }));

    // Cache the result
    cachedPeriodTimings = timings.length > 0 ? timings : DEFAULT_PERIOD_TIMINGS;
    periodTimingsCacheTime = Date.now();

    return cachedPeriodTimings;
  } catch (err) {
    logger.error('Error fetching period timings:', err);
    return DEFAULT_PERIOD_TIMINGS;
  }
}

function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

function parseHmToMinutes(hm: string) {
  const [h, m] = hm.split(':').map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export type TodayClassStatus = 'Ongoing' | 'Attendance Pending' | 'Completed' | 'Upcoming';

export type TodayClassSummary = {
  entryId: string;
  period: number;
  timeLabel: string;
  subjectLabel: string;
  classLabel: string;
  roomLabel: string | null;
  status: TodayClassStatus;
  // minimal params needed to route to attendance mark screen
  routeParams?: {
    entryId: string;
    courseName: string;
    courseId: string;
    yearId: string;
    sectionId: string;
    programmeId: string;
    departmentId: string;
    period: string;
  };
};

export type NextClassPreview = {
  subjectLabel: string;
  classLabel: string;
  startsInMinutes: number;
  roomLabel: string | null;
  isLab: boolean;
};

export type DashboardAlertKind = 'attendance' | 'marks' | 'assignments';

export type DashboardAlert = {
  kind: DashboardAlertKind;
  title: string;
  ctaLabel: string;
};

export type ImportantNotice = {
  id: string;
  title: string;
  scope: string;
  createdAt: string;
};

export type TeacherDashboardSummary = {
  cachedAt: number;

  teacherName: string;

  todayClasses: TodayClassSummary[];
  nextClass: NextClassPreview | null;

  attendancePendingCount: number;

  assignmentsToEvaluateCount: number;
  assignmentEvaluationOverdue: boolean;

  internalMarksExamName: string | null;
  internalMarksPendingCount: number | null;
  internalMarksDeadlineToday: boolean;

  noticesUnreadCount: number | null;
  importantNotices: ImportantNotice[];

  criticalAlert: DashboardAlert | null;
};

const CACHE_TTL_MS = 60_000; // 1 min

function cacheKey(userId: string) {
  return `teacher.dashboard.summary.v1.${userId}`;
}

async function safeCountQuery(promise: Promise<{ count: number | null; error: any }>) {
  try {
    const res = await promise;
    if (res.error) return null;
    return res.count ?? 0;
  } catch {
    return null;
  }
}

export function useTeacherDashboardSummary() {
  const { user, profile, roles } = useAuthStore();

  const userId = user?.id || null;
  const profileId = profile?.id || user?.id || null;

  const [summary, setSummary] = useState<TeacherDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const inFlight = useRef<Promise<void> | null>(null);

  const teacherName = profile?.full_name || user?.email || 'Teacher';

  const isHoD = roles.includes('hod');

  const loadFromCache = useCallback(async () => {
    if (!userId) return;

    try {
      const raw = await AsyncStorage.getItem(cacheKey(userId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as TeacherDashboardSummary;
      if (!parsed?.cachedAt) return;

      const isFresh = Date.now() - parsed.cachedAt < CACHE_TTL_MS;
      setSummary(parsed);
      if (isFresh) setLoading(false);
    } catch {
      // ignore cache errors
    }
  }, [userId]);

  const persistCache = useCallback(
    async (next: TeacherDashboardSummary) => {
      if (!userId) return;
      try {
        await AsyncStorage.setItem(cacheKey(userId), JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    [userId]
  );

  const fetchSummary = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!userId) {
        setSummary(null);
        setLoading(false);
        return;
      }

      if (inFlight.current) {
        await inFlight.current;
        return;
      }

      const run = (async () => {
        const now = new Date();
        const dateStr = toDateOnlyISO(now);

        try {
          // Get teacher id
          const teacherRes = await supabase
            .from('teachers')
            .select('id')
            .eq('user_id', userId)
            .single();

          const teacherId = (teacherRes.data as any)?.id as string | undefined;

          // Get current academic year
          const yearRes = await supabase
            .from('academic_years')
            .select('id')
            .eq('is_current', true)
            .single();

          const academicYearId = (yearRes.data as any)?.id as string | undefined;

          // Today classes (timetable + attendance presence)
          const todayClassesPromise = (async () => {
            if (!teacherId || !academicYearId) {
              return [] as TodayClassSummary[];
            }

            let dayOfWeek = now.getDay();
            if (dayOfWeek === 0) dayOfWeek = 7;
            if (dayOfWeek > 5) return [] as TodayClassSummary[];

            const holidayRes = await supabase
              .from('holidays')
              .select('id')
              .eq('date', dateStr)
              .maybeSingle();
            if (holidayRes.data) return [] as TodayClassSummary[];

            const entriesRes = await supabase
              .from('timetable_entries')
              .select(
                `
                id,
                period,
                course_id,
                year_id,
                section_id,
                programme_id,
                room,
                is_lab,
                courses:courses!timetable_entries_course_id_fkey(code, name, short_name, department_id),
                years(name),
                sections:sections!timetable_entries_section_id_fkey(name)
              `
              )
              .eq('teacher_id', teacherId)
              .eq('day_of_week', dayOfWeek)
              .eq('academic_year_id', academicYearId)
              .eq('is_active', true)
              .order('period');

            const entries = (entriesRes.data || []) as any[];
            if (!Array.isArray(entries) || entries.length === 0) return [];

            const entryIds = entries.map((e) => e.id);

            // Fetch period timings (use first entry's department for department-specific timings)
            const firstDepartmentId = entries[0]?.courses?.department_id;
            const periodTimings = await getPeriodTimings(firstDepartmentId);

            const attendanceRes = await supabase
              .from('attendance')
              .select('id, timetable_entry_id')
              .eq('date', dateStr)
              .in('timetable_entry_id', entryIds);

            const attendanceByEntry = new Map<string, string>();
            (attendanceRes.data || []).forEach((a: any) => {
              if (a?.timetable_entry_id && a?.id) attendanceByEntry.set(a.timetable_entry_id, a.id);
            });

            const nowMin = minutesSinceMidnight(now);

            return entries
              .map((e) => {
                const timing = periodTimings.find((t) => t.period === e.period);
                const startMin = timing ? parseHmToMinutes(timing.start) : null;
                const endMin = timing ? parseHmToMinutes(timing.end) : null;

                const hasAttendance = attendanceByEntry.has(e.id);
                const isCurrent = startMin != null && endMin != null && nowMin >= startMin && nowMin <= endMin;
                const isPast = endMin != null && nowMin > endMin;
                const isFuture = startMin != null && nowMin < startMin;

                let status: TodayClassStatus = 'Upcoming';

                if (isCurrent && !hasAttendance) status = 'Attendance Pending';
                else if (isCurrent) status = 'Ongoing';
                else if (isPast && hasAttendance) status = 'Completed';
                else if (isPast && !hasAttendance) status = 'Attendance Pending';
                else if (isFuture) status = 'Upcoming';

                const timeLabel = timing ? `${timing.start}-${timing.end}` : `P${e.period}`;
                const subjectLabel = e.courses?.short_name || e.courses?.code || e.courses?.name || 'Subject';
                const classLabel = `${e.years?.name || 'Class'}${e.sections?.name ? ` • ${e.sections.name}` : ''}`;

                const routeParams =
                  status === 'Attendance Pending'
                    ? {
                        entryId: e.id as string,
                        courseName: (e.courses?.name || subjectLabel) as string,
                        courseId: (e.course_id || '') as string,
                        yearId: (e.year_id || '') as string,
                        sectionId: (e.section_id || '') as string,
                        programmeId: (e.programme_id || '') as string,
                        departmentId: (e.courses?.department_id || '') as string,
                        period: String(e.period),
                      }
                    : undefined;

                return {
                  entryId: e.id as string,
                  period: e.period as number,
                  timeLabel,
                  subjectLabel,
                  classLabel,
                  roomLabel: (e.room as string | null) || null,
                  status,
                  routeParams,
                } satisfies TodayClassSummary;
              })
              .sort((a, b) => a.period - b.period);
          })();

          const assignmentSummaryPromise = (async () => {
            if (!teacherId) {
              return {
                toEvaluate: null as number | null,
                overdue: false,
              };
            }

            const nowIso = now.toISOString();

            // Pending submissions count for this teacher
            const pendingCount = await safeCountQuery(
              supabase
                .from('assignment_submissions')
                .select('id, assignments!inner(teacher_id)', { count: 'exact', head: true })
                .is('marks_obtained', null)
                .eq('assignments.teacher_id', teacherId)
            );

            // Overdue evaluation = any submission ungraded where assignment due date < now
            const overdueCount = await safeCountQuery(
              supabase
                .from('assignment_submissions')
                .select('id, assignments!inner(teacher_id, due_date)', { count: 'exact', head: true })
                .is('marks_obtained', null)
                .eq('assignments.teacher_id', teacherId)
                .lt('assignments.due_date', nowIso)
            );

            return {
              toEvaluate: pendingCount,
              overdue: (overdueCount ?? 0) > 0,
            };
          })();

          const marksSummaryPromise = (async () => {
            if (!teacherId || !academicYearId) {
              return {
                examName: null as string | null,
                pending: null as number | null,
                deadlineToday: false,
              };
            }

            // Teacher course ids from timetable (current academic year)
            const tRes = await supabase
              .from('timetable_entries')
              .select('course_id')
              .eq('teacher_id', teacherId)
              .eq('academic_year_id', academicYearId)
              .eq('is_active', true);

            const courseIds = Array.from(
              new Set(
                (tRes.data || [])
                  .map((r: any) => r?.course_id as string | null)
                  .filter((x: string | null): x is string => Boolean(x))
              )
            );

            if (courseIds.length === 0) {
              return { examName: null, pending: 0, deadlineToday: false };
            }

            // Latest published internal/model exam
            const examRes = await supabase
              .from('exams')
              .select('id, name, exam_type, start_date')
              .eq('academic_year_id', academicYearId)
              .eq('is_published', true)
              .in('exam_type', ['internal', 'model'])
              .order('start_date', { ascending: false })
              .limit(1)
              .maybeSingle();

            const examId = (examRes.data as any)?.id as string | undefined;
            const examName = (examRes.data as any)?.name as string | undefined;

            if (!examId) {
              return { examName: null, pending: 0, deadlineToday: false };
            }

            const schedulesRes = await supabase
              .from('exam_schedules')
              .select('id, date, course_id')
              .eq('exam_id', examId)
              .in('course_id', courseIds)
              .order('date', { ascending: true });

            const schedules = (schedulesRes.data || []) as any[];
            if (schedules.length === 0) {
              return { examName: examName || null, pending: 0, deadlineToday: false };
            }

            const scheduleIds = schedules.map((s) => s.id as string);
            const locksRes = await supabase
              .from('exam_marks_locks')
              .select('exam_schedule_id')
              .in('exam_schedule_id', scheduleIds);

            const locked = new Set<string>((locksRes.data || []).map((r: any) => r.exam_schedule_id as string));

            const pendingSchedules = schedules.filter((s) => {
              const scheduleId = s.id as string;
              const scheduleDate = String(s.date || '');
              if (!scheduleId || !scheduleDate) return false;
              // due up to today (incl)
              const isDue = scheduleDate <= dateStr;
              return isDue && !locked.has(scheduleId);
            });

            const deadlineToday = schedules.some((s) => String(s.date || '') === dateStr && !locked.has(String(s.id)));

            return {
              examName: examName || null,
              pending: pendingSchedules.length,
              deadlineToday,
            };
          })();

          const noticesSummaryPromise = (async () => {
            if (!profileId) {
              return {
                unreadCount: null as number | null,
                important: [] as ImportantNotice[],
              };
            }

            // Important notices: exam/department/college only; HoD sees department-only.
            const scopes = isHoD ? (['department'] as const) : (['exam', 'department', 'college'] as const);

            const noticeRows: any[] = [];

            // College
            if (scopes.includes('college' as any)) {
              const college = await supabase
                .from('notices')
                .select('id, title, scope, created_at, publish_at')
                .eq('is_active', true)
                .eq('scope', 'college')
                .order('created_at', { ascending: false })
                .limit(25);
              if (!college.error) noticeRows.push(...(college.data || []));
            }

            // Exam
            if (scopes.includes('exam' as any)) {
              const exam = await supabase
                .from('notices')
                .select('id, title, scope, created_at, publish_at')
                .eq('is_active', true)
                .eq('scope', 'exam')
                .order('created_at', { ascending: false })
                .limit(25);
              if (!exam.error) noticeRows.push(...(exam.data || []));
            }

            // Department
            if (scopes.includes('department' as any)) {
              const deptQ = supabase
                .from('notices')
                .select('id, title, scope, created_at, publish_at, department_id')
                .eq('is_active', true)
                .eq('scope', 'department')
                .order('created_at', { ascending: false })
                .limit(25);

              const dept = profile?.department_id ? await deptQ.eq('department_id', profile.department_id) : await deptQ;
              if (!dept.error) noticeRows.push(...(dept.data || []));
            }

            const unique = new Map<string, any>();
            noticeRows.forEach((n) => unique.set(n.id, n));

            const merged = Array.from(unique.values()).sort(
              (a, b) => new Date(String(b.created_at || b.publish_at || '')).getTime() - new Date(String(a.created_at || a.publish_at || '')).getTime()
            );

            const topImportant = merged
              .slice(0, 2)
              .map((n) => ({
                id: String(n.id),
                title: String(n.title || 'Notice'),
                scope: String(n.scope || ''),
                createdAt: String(n.publish_at || n.created_at || ''),
              })) as ImportantNotice[];

            // Unread count (over last 50 relevant notices for performance)
            const recent = merged.slice(0, 50).map((n) => String(n.id)).filter(Boolean);
            if (recent.length === 0) {
              return { unreadCount: 0, important: topImportant };
            }

            const readsRes = await supabase
              .from('notice_reads')
              .select('notice_id')
              .eq('user_id', profileId)
              .in('notice_id', recent);

            const readSet = new Set<string>((readsRes.data || []).map((r: any) => String(r.notice_id)));
            const unreadCount = recent.filter((id) => !readSet.has(id)).length;

            return { unreadCount, important: topImportant };
          })();

          const [todayClasses, assignmentSummary, marksSummary, noticesSummary] = await Promise.all([
            todayClassesPromise,
            assignmentSummaryPromise,
            marksSummaryPromise,
            noticesSummaryPromise,
          ]);

          const attendancePendingCount = todayClasses.filter((c) => c.status === 'Attendance Pending').length;

          const nextUpcoming = todayClasses
            .filter((c) => c.status === 'Upcoming')
            .sort((a, b) => a.period - b.period)[0];

          // Get period timings for next class calculation (use cached value from todayClasses fetch)
          const periodTimings = await getPeriodTimings();
          
          const nextClass: NextClassPreview | null = (() => {
            if (!nextUpcoming) return null;
            const timing = periodTimings.find((t) => t.period === nextUpcoming.period);
            const startMin = timing ? parseHmToMinutes(timing.start) : null;
            if (startMin == null) return null;
            const mins = startMin - minutesSinceMidnight(now);
            if (!Number.isFinite(mins) || mins < 0) return null;
            return {
              subjectLabel: nextUpcoming.subjectLabel,
              classLabel: nextUpcoming.classLabel,
              startsInMinutes: Math.max(0, Math.round(mins)),
              roomLabel: nextUpcoming.roomLabel,
              isLab: false,
            };
          })();

          const assignmentsToEvaluateCount = assignmentSummary.toEvaluate;
          const assignmentEvaluationOverdue = assignmentSummary.overdue;

          const internalMarksExamName = marksSummary.examName;
          const internalMarksPendingCount = marksSummary.pending;
          const internalMarksDeadlineToday = marksSummary.deadlineToday;

          const noticesUnreadCount = noticesSummary.unreadCount;
          const importantNotices = noticesSummary.important;

          const criticalAlert: DashboardAlert | null = (() => {
            if (attendancePendingCount > 0) {
              return {
                kind: 'attendance',
                title: `Attendance pending today (${attendancePendingCount})`,
                ctaLabel: 'Mark Attendance',
              };
            }

            if (internalMarksDeadlineToday) {
              return {
                kind: 'marks',
                title: 'Internal marks due today',
                ctaLabel: 'Enter Marks',
              };
            }

            if (assignmentEvaluationOverdue) {
              return {
                kind: 'assignments',
                title: 'Assignment evaluation overdue',
                ctaLabel: 'Review Submissions',
              };
            }

            return null;
          })();

          const next: TeacherDashboardSummary = {
            cachedAt: Date.now(),
            teacherName,
            todayClasses,
            nextClass,
            attendancePendingCount,
            assignmentsToEvaluateCount: assignmentsToEvaluateCount ?? 0,
            assignmentEvaluationOverdue,
            internalMarksExamName,
            internalMarksPendingCount,
            internalMarksDeadlineToday,
            noticesUnreadCount,
            importantNotices,
            criticalAlert,
          };

          setSummary(next);
          setLoading(false);
          await persistCache(next);
        } catch (err) {
          logger.error('Teacher dashboard fetch error:', err);
          setLoading(false);
        }
      })();

      inFlight.current = run;
      try {
        await run;
      } finally {
        inFlight.current = null;
      }
    },
    [isHoD, persistCache, profile?.department_id, profileId, teacherName, userId]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSummary({ force: true });
    setRefreshing(false);
  }, [fetchSummary]);

  useEffect(() => {
    setLoading(true);
    loadFromCache().finally(() => {
      // Always try to refresh in background
      fetchSummary({ force: false }).finally(() => setLoading(false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      // On screen focus, refresh (fast queries + cache)
      fetchSummary({ force: false });
      return () => {};
    }, [fetchSummary])
  );

  const data = useMemo(() => {
    return {
      summary,
      loading,
      refreshing,
      refresh,
    };
  }, [loading, refresh, refreshing, summary]);

  return data;
}
