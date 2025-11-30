# 🟡 ABIN's VIBE GUIDE
## Role: Assistant Lead / GraphQL & State
## Target: 2-3 stores + full API per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **Hasura Configuration** - Track tables, relationships, permissions
2. **GraphQL Layer** - All queries, mutations, subscriptions
3. **State Management** - All Zustand stores
4. **Code Review** - GraphQL, stores, API integration

---

# WEEK 1: FOUNDATION BLITZ

## Day 1 - Hasura + Auth Store
```typescript
// 1. Setup Hasura (after Ash creates tables)
// Track: profiles, roles, user_roles, departments, courses

// 2. lib/graphql/client.ts
import { createClient, cacheExchange, fetchExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';
import { supabase } from '../supabase';

const getAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

export const graphqlClient = createClient({
  url: process.env.EXPO_PUBLIC_HASURA_ENDPOINT!,
  exchanges: [
    cacheExchange,
    authExchange(async (utils) => {
      let token = await getAuth();
      return {
        addAuthToOperation: (op) => token ? utils.appendHeaders(op, { Authorization: `Bearer ${token}` }) : op,
        didAuthError: (error) => error.graphQLErrors.some(e => e.extensions?.code === 'invalid-jwt'),
        refreshAuth: async () => { token = await getAuth(); },
      };
    }),
    fetchExchange,
  ],
});

// 3. store/authStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: any;
  profile: any;
  roles: string[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  roles: [],
  loading: true,

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user });
    await get().loadProfile();
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (error) throw error;
    set({ user: data.user });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, roles: [] });
  },

  loadProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Fetch profile with roles via GraphQL
    const result = await graphqlClient.query(GET_PROFILE_WITH_ROLES, { id: user.id }).toPromise();
    set({ 
      user,
      profile: result.data?.profiles_by_pk,
      roles: result.data?.profiles_by_pk?.user_roles?.map((ur: any) => ur.role.name) || [],
      loading: false 
    });
  },
}));

// 4. store/themeStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
    }),
    { name: 'theme', storage: createJSONStorage(() => AsyncStorage) }
  )
);
```

## Day 2 - Auth Queries + Navigation
```typescript
// lib/graphql/queries.ts
import { gql } from 'urql';

export const GET_PROFILE_WITH_ROLES = gql`
  query GetProfile($id: uuid!) {
    profiles_by_pk(id: $id) {
      id email full_name phone photo_url
      user_roles { role { name category } department_id }
      student { id enrollment_number current_semester course { name } }
      teacher { id employee_id department { name } }
    }
  }
`;

// lib/graphql/mutations.ts
export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($id: uuid!, $data: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $data) { id }
  }
`;

// Navigation guard logic
export const getInitialRoute = (roles: string[]) => {
  if (roles.some(r => ['super_admin', 'principal', 'department_admin'].includes(r))) return '/(admin)/dashboard';
  if (roles.some(r => ['teacher', 'hod', 'coordinator', 'class_teacher', 'mentor'].includes(r))) return '/(teacher)/dashboard';
  return '/(student)/dashboard';
};
```

## Day 3 - User Management + Academic Stores
```typescript
// store/userManagementStore.ts
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql/client';

export const GET_STUDENTS = gql`
  query GetStudents($limit: Int = 20, $offset: Int = 0, $where: students_bool_exp = {}) {
    students(limit: $limit, offset: $offset, where: $where, order_by: { created_at: desc }) {
      id enrollment_number roll_number division current_semester status
      profile { id full_name email phone photo_url }
      department { short_name }
      course { short_name }
    }
    students_aggregate(where: $where) { aggregate { count } }
  }
`;

export const GET_TEACHERS = gql`
  query GetTeachers($limit: Int = 20, $offset: Int = 0) {
    teachers(limit: $limit, offset: $offset, order_by: { created_at: desc }) {
      id employee_id designation status
      profile { id full_name email phone photo_url }
      department { name short_name }
    }
  }
`;

interface UserManagementState {
  students: any[];
  teachers: any[];
  totalStudents: number;
  loading: boolean;
  fetchStudents: (filters?: any) => Promise<void>;
  fetchTeachers: (filters?: any) => Promise<void>;
  toggleStudentBlock: (id: string, blocked: boolean) => Promise<void>;
}

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  students: [], teachers: [], totalStudents: 0, loading: false,

  fetchStudents: async (filters = {}) => {
    set({ loading: true });
    const result = await graphqlClient.query(GET_STUDENTS, { limit: 20, offset: 0, where: filters }).toPromise();
    set({ students: result.data?.students || [], totalStudents: result.data?.students_aggregate?.aggregate?.count || 0, loading: false });
  },

  fetchTeachers: async () => {
    set({ loading: true });
    const result = await graphqlClient.query(GET_TEACHERS, {}).toPromise();
    set({ teachers: result.data?.teachers || [], loading: false });
  },

  toggleStudentBlock: async (id, blocked) => {
    await graphqlClient.mutation(UPDATE_STUDENT_STATUS, { id, status: blocked ? 'blocked' : 'active' }).toPromise();
    get().fetchStudents();
  },
}));

// store/academicStore.ts
export const useAcademicStore = create((set) => ({
  departments: [], courses: [], subjects: [],
  fetchDepartments: async () => { /* query */ },
  fetchCourses: async () => { /* query */ },
  createDepartment: async (data) => { /* mutation */ },
  updateDepartment: async (id, data) => { /* mutation */ },
  deleteDepartment: async (id) => { /* mutation */ },
  // Similar for courses, subjects
}));
```

## Day 4 - Notice + Event + Exam Stores
```typescript
// store/noticeStore.ts
export const useNoticeStore = create((set, get) => ({
  notices: [],
  fetchNotices: async () => { /* GET_NOTICES query */ },
  createNotice: async (data) => { /* CREATE_NOTICE mutation */ },
  publishNotice: async (id) => { /* UPDATE status */ },
  deleteNotice: async (id) => { /* DELETE mutation */ },
}));

// store/eventStore.ts
export const useEventStore = create((set) => ({
  events: [],
  fetchEvents: async () => {},
  createEvent: async (data) => {},
  updateEvent: async (id, data) => {},
  deleteEvent: async (id) => {},
}));

// store/examAdminStore.ts
export const useExamAdminStore = create((set) => ({
  exams: [],
  schedules: [],
  fetchExams: async () => {},
  createExam: async (data) => {},
  createSchedule: async (examId, schedules) => {},
  publishExam: async (id) => {},
}));

// Timetable queries
export const GET_TIMETABLE = gql`
  query GetTimetable($courseId: uuid!, $semester: Int!, $division: String!) {
    timetable_master(where: { course_id: { _eq: $courseId }, semester_number: { _eq: $semester }, division: { _eq: $division }, is_active: { _eq: true } }) {
      id
      periods(order_by: [{ day_of_week: asc }, { period_number: asc }]) {
        id day_of_week period_number start_time end_time room
        subject { name code }
        teacher { profile { full_name } }
      }
    }
  }
`;
```

## Day 5 - Library + Bus + Exam Stores
```typescript
// store/libraryStore.ts
export const useLibraryStore = create((set) => ({
  books: [],
  issues: [],
  fetchBooks: async (search?: string) => {},
  addBook: async (data) => {},
  issueBook: async (bookId, studentId, dueDate) => {},
  returnBook: async (issueId) => {},
  getOverdueBooks: async () => {},
}));

// store/busStore.ts
export const useBusStore = create((set) => ({
  routes: [],
  subscriptions: [],
  fetchRoutes: async () => {},
  createRoute: async (data) => {},
  createStop: async (routeId, data) => {},
  approveSubscription: async (id, approved) => {},
}));
```

---

# WEEK 2: TEACHER + CANTEEN + FEES

## Day 6 - Canteen + Fees + Settings
```typescript
// store/canteenAdminStore.ts
export const useCanteenAdminStore = create((set) => ({
  menuItems: [],
  tokens: [],
  fetchMenu: async () => {},
  addMenuItem: async (data) => {},
  updateAvailability: async (id, available) => {},
  updateTokenStatus: async (id, status) => {},
  getDailySales: async (date) => {},
}));

// store/feesStore.ts
export const useFeesStore = create((set) => ({
  structure: [],
  payments: [],
  fetchStructure: async (courseId) => {},
  addFeeStructure: async (data) => {},
  recordPayment: async (data) => {},
  getStudentPayments: async (studentId) => {},
}));

// store/settingsStore.ts
export const useSettingsStore = create((set) => ({
  settings: {},
  fetchSettings: async () => {},
  updateSetting: async (key, value) => {},
}));
```

## Day 7 - Teacher Dashboard Store
```typescript
// store/teacherDashboardStore.ts
export const GET_TEACHER_DASHBOARD = gql`
  query GetTeacherDashboard($teacherId: uuid!) {
    teachers_by_pk(id: $teacherId) {
      id profile { full_name } department { name }
      teacher_subjects { subject { id name code } }
      teacher_classes { course { short_name } semester_number division }
    }
    todays_periods: periods(where: { teacher_id: { _eq: $teacherId }, day_of_week: { _eq: $today } }, order_by: { period_number: asc }) {
      id period_number start_time end_time subject { name code } room
    }
    pending_submissions: submissions_aggregate(where: { assignment: { teacher_id: { _eq: $teacherId } }, marks_obtained: { _is_null: true } }) {
      aggregate { count }
    }
  }
`;

export const useTeacherDashboardStore = create((set) => ({
  teacher: null,
  todaysPeriods: [],
  pendingCount: 0,
  loading: false,
  fetchDashboard: async (teacherId) => { /* query */ },
}));
```

## Day 8 - Attendance + Marks Stores
```typescript
// store/attendanceStore.ts
export const useAttendanceStore = create((set, get) => ({
  sessionId: null,
  students: [],
  records: [],
  saving: false,

  startSession: async (periodId, subjectId, courseId, semester, division) => {
    // Create session, load students
    const students = await graphqlClient.query(GET_CLASS_STUDENTS, { courseId, semester, division }).toPromise();
    set({ students: students.data.students, records: students.data.students.map(s => ({ studentId: s.id, status: 'P' })) });
  },

  setStatus: (studentId, status) => {
    set(state => ({
      records: state.records.map(r => r.studentId === studentId ? { ...r, status } : r)
    }));
  },

  markAllPresent: () => {
    set(state => ({ records: state.records.map(r => ({ ...r, status: 'P' })) }));
  },

  saveAttendance: async () => {
    set({ saving: true });
    const { sessionId, records } = get();
    await graphqlClient.mutation(MARK_ATTENDANCE, {
      objects: records.map(r => ({ session_id: sessionId, student_id: r.studentId, status: r.status }))
    }).toPromise();
    set({ saving: false });
  },
}));

// store/marksStore.ts - with CSV support
export const useMarksStore = create((set, get) => ({
  examScheduleId: null,
  entries: [],
  maxMarks: 100,
  saving: false,

  loadStudents: async (examScheduleId) => { /* load students for exam */ },

  setMarks: (studentId, marks) => {
    set(state => ({
      entries: state.entries.map(e => e.studentId === studentId ? { ...e, marks, isAbsent: false } : e)
    }));
  },

  setAbsent: (studentId, absent) => {
    set(state => ({
      entries: state.entries.map(e => e.studentId === studentId ? { ...e, isAbsent: absent, marks: null } : e)
    }));
  },

  parseCSV: (csvContent) => {
    const lines = csvContent.split('\n');
    // Parse and match to students by enrollment number
    return lines.slice(1).map(line => {
      const [enrollment, marks] = line.split(',');
      return { enrollment: enrollment.trim(), marks: parseFloat(marks) };
    });
  },

  submitMarks: async (teacherId) => {
    set({ saving: true });
    const { examScheduleId, entries } = get();
    await graphqlClient.mutation(SUBMIT_MARKS, {
      objects: entries.map(e => ({
        exam_schedule_id: examScheduleId,
        student_id: e.studentId,
        teacher_id: teacherId,
        marks_obtained: e.marks,
        is_absent: e.isAbsent,
      }))
    }).toPromise();
    set({ saving: false });
  },
}));
```

## Day 9 - Assignment + Materials Stores
```typescript
// store/assignmentStore.ts
export const useAssignmentStore = create((set) => ({
  assignments: [],
  submissions: [],
  fetchMyAssignments: async (teacherId) => {},
  createAssignment: async (data) => {},
  fetchSubmissions: async (assignmentId) => {},
  gradeSubmission: async (submissionId, marks, feedback) => {},
}));

// store/materialsStore.ts
export const useMaterialsStore = create((set) => ({
  materials: [],
  fetchMyMaterials: async (teacherId) => {},
  uploadMaterial: async (data, file) => {},
  publishMaterial: async (id) => {},
  deleteMaterial: async (id) => {},
}));
```

## Day 10 - Planner + Diary + Mentor
```typescript
// store/plannerStore.ts
export const usePlannerStore = create((set) => ({
  plans: [],
  fetchPlans: async (teacherId, month) => {},
  createPlan: async (data) => {},
  updatePlan: async (id, data) => {},
  markCompleted: async (id, actualDate) => {},
}));

// store/diaryStore.ts
export const useDiaryStore = create((set) => ({
  entries: [],
  fetchEntries: async (teacherId, date) => {},
  addEntry: async (data) => {},
  updateEntry: async (id, data) => {},
}));

// Mentor queries
export const GET_MENTEES = gql`
  query GetMentees($mentorId: uuid!) {
    teacher_classes(where: { teacher_id: { _eq: $mentorId }, role: { _eq: "mentor" } }) {
      students: course { students(where: { current_semester: { _eq: $semester } }) {
        id enrollment_number profile { full_name email phone }
        attendance_records_aggregate { aggregate { count } }
      }}
    }
  }
`;
```

---

# WEEK 3: ROLE STORES + STUDENT

## Day 11 - HoD + Coordinator Stores
```typescript
// store/hodStore.ts
export const useHodStore = create((set) => ({
  departmentStats: null,
  pendingMarks: [],
  fetchStats: async (departmentId) => {},
  fetchPendingMarks: async (departmentId) => {},
  verifyMarks: async (markId, approved) => {},
}));

// store/coordinatorStore.ts
export const useCoordinatorStore = create((set) => ({
  pendingSchedules: [],
  fetchPendingSchedules: async () => {},
  approveSchedule: async (id, approved) => {},
}));
```

## Day 12-15 - Student Stores
```typescript
// store/studentDashboardStore.ts
export const useStudentDashboardStore = create((set) => ({
  student: null,
  attendancePercentage: 0,
  pendingAssignments: [],
  fetchDashboard: async (studentId) => {},
}));

// store/assignmentStudentStore.ts
// store/examStudentStore.ts
// store/externalMarksStore.ts
// store/libraryStudentStore.ts
// store/busStudentStore.ts
// store/canteenStudentStore.ts (with realtime)
// store/honorsStore.ts
```

---

# WEEK 4-5: INTEGRATION

## Day 16-20 - Finish All Stores
- Complete any remaining stores
- Add realtime subscriptions for tokens
- Add optimistic updates

## Day 21-25 - Polish
- Query optimization
- Error handling
- Caching strategies

---

# ✅ DAILY CHECKLIST

## Each Day
- [ ] Track new tables in Hasura (after Ash creates)
- [ ] Set up relationships
- [ ] Create queries/mutations
- [ ] Create Zustand store
- [ ] Test with UI (coordinate with Christo/Deon)
- [ ] Commit and push

## Hasura Permissions
- Admin: Full access
- Teacher: Own data + assigned classes
- Student: Own data only

---

*Vibe Coder Abin - Ship 2-3 stores daily! 🚀*
