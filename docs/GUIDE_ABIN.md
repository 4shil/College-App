# 🟡 ABIN's DEVELOPMENT GUIDE
## Role: Assistant Lead / GraphQL & State

---

## 🎯 YOUR RESPONSIBILITIES

1. **Hasura Configuration** - Track tables, relationships, permissions
2. **GraphQL Layer** - Queries, mutations, subscriptions
3. **State Management** - All Zustand stores
4. **Admin Module Screens** - Dashboard, Analytics, Verification
5. **Teacher Dashboard & HoD** - Dashboard, approval screens
6. **Code Review** - GraphQL, stores, API integration

---

## 📅 YOUR TIMELINE

### PHASE 2 (Week 3-4): Hasura & Admin Foundation

#### Week 3: Hasura Setup

**After Ash creates tables, track them in Hasura:**

1. Open Hasura Console: `npx hasura console`
2. Track all tables in Data tab
3. Set up relationships

**Relationships to configure:**
```
profiles
  → user_roles (array, profile.id = user_roles.user_id)
  → students (object, profile.id = students.profile_id)
  → teachers (object, profile.id = teachers.profile_id)

user_roles
  → profile (object, user_roles.user_id = profiles.id)
  → role (object, user_roles.role_id = roles.id)

students
  → profile (object, students.profile_id = profiles.id)
  → department (object, students.department_id = departments.id)
  → course (object, students.course_id = courses.id)

teachers
  → profile (object, teachers.profile_id = profiles.id)
  → department (object, teachers.department_id = departments.id)
  → teacher_subjects (array)
  → teacher_classes (array)

departments
  → courses (array)
  → subjects (array)
  → hod (object, departments.hod_id = profiles.id)

courses
  → department (object)
  → subjects (array)
  → students (array)

timetable_master
  → periods (array)
  → course (object)
  → semester (object)

periods
  → timetable (object)
  → subject (object)
  → teacher (object)
  → room (object)
```

**Hasura Permissions (Role-based):**

```yaml
# Admin permissions (super_admin, principal)
tables:
  - profiles: select, insert, update, delete
  - students: select, insert, update, delete
  - teachers: select, insert, update, delete
  - departments: all
  - courses: all

# Teacher permissions
tables:
  - profiles: select own
  - students: select (assigned classes only)
  - attendance_records: insert, update (own sessions)
  - teaching_materials: all (own)
  - assignments: all (own)

# Student permissions
tables:
  - profiles: select own, update own (limited fields)
  - attendance_records: select own
  - assignments: select
  - submissions: insert, update own
```

#### Week 3-4: GraphQL Setup

**Create `lib/graphql/client.ts`:**
```typescript
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
        addAuthToOperation: (operation) => {
          if (!token) return operation;
          return utils.appendHeaders(operation, {
            Authorization: `Bearer ${token}`,
          });
        },
        willAuthError: () => false,
        didAuthError: (error) => {
          return error.graphQLErrors.some(
            e => e.extensions?.code === 'invalid-jwt'
          );
        },
        refreshAuth: async () => {
          token = await getAuth();
        },
      };
    }),
    fetchExchange,
  ],
});
```

**Create `lib/graphql/queries.ts`:**
```typescript
import { gql } from 'urql';

// ============ PROFILE QUERIES ============
export const GET_PROFILE = gql`
  query GetProfile($id: uuid!) {
    profiles_by_pk(id: $id) {
      id
      email
      full_name
      phone
      photo_url
      user_roles {
        role {
          name
          category
        }
      }
    }
  }
`;

export const GET_USER_ROLES = gql`
  query GetUserRoles($userId: uuid!) {
    user_roles(where: { user_id: { _eq: $userId } }) {
      role {
        name
        category
        permissions
      }
      department_id
    }
  }
`;

// ============ ADMIN QUERIES ============
export const GET_STUDENTS_LIST = gql`
  query GetStudentsList(
    $limit: Int = 20
    $offset: Int = 0
    $where: students_bool_exp = {}
    $orderBy: [students_order_by!] = { created_at: desc }
  ) {
    students(
      limit: $limit
      offset: $offset
      where: $where
      order_by: $orderBy
    ) {
      id
      enrollment_number
      roll_number
      division
      current_semester
      status
      profile {
        id
        full_name
        email
        phone
        photo_url
      }
      department {
        short_name
      }
      course {
        short_name
      }
    }
    students_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TEACHERS_LIST = gql`
  query GetTeachersList(
    $limit: Int = 20
    $offset: Int = 0
    $where: teachers_bool_exp = {}
  ) {
    teachers(
      limit: $limit
      offset: $offset
      where: $where
      order_by: { created_at: desc }
    ) {
      id
      employee_id
      designation
      status
      profile {
        id
        full_name
        email
        phone
        photo_url
        user_roles {
          role {
            name
          }
        }
      }
      department {
        name
        short_name
      }
    }
    teachers_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_PENDING_APPROVALS = gql`
  query GetPendingApprovals {
    external_uploads(where: { status: { _eq: "pending" } }) {
      id
      file_url
      created_at
      student {
        profile {
          full_name
        }
        enrollment_number
      }
      subject {
        name
      }
    }
    bus_subscriptions(where: { status: { _eq: "pending" } }) {
      id
      created_at
      student {
        profile {
          full_name
        }
      }
      route {
        route_name
      }
      stop {
        stop_name
      }
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    students_aggregate {
      aggregate {
        count
      }
    }
    teachers_aggregate {
      aggregate {
        count
      }
    }
    departments_aggregate {
      aggregate {
        count
      }
    }
    pending_external: external_uploads_aggregate(
      where: { status: { _eq: "pending" } }
    ) {
      aggregate {
        count
      }
    }
    pending_bus: bus_subscriptions_aggregate(
      where: { status: { _eq: "pending" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// ============ TEACHER QUERIES ============
export const GET_TEACHER_DASHBOARD = gql`
  query GetTeacherDashboard($teacherId: uuid!, $today: date!) {
    teachers_by_pk(id: $teacherId) {
      id
      profile {
        full_name
      }
      department {
        name
      }
      teacher_subjects {
        subject {
          id
          name
          code
        }
      }
      teacher_classes {
        course {
          short_name
        }
        semester_number
        division
      }
    }
    todays_periods: periods(
      where: {
        teacher_id: { _eq: $teacherId }
        day_of_week: { _eq: 1 } # Replace with actual day
      }
      order_by: { period_number: asc }
    ) {
      id
      period_number
      start_time
      end_time
      subject {
        name
        code
      }
      room {
        name
      }
    }
    pending_assignments: submissions_aggregate(
      where: {
        assignment: { teacher_id: { _eq: $teacherId } }
        marks_obtained: { _is_null: true }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_INTERNAL_MARKS_FOR_VERIFICATION = gql`
  query GetInternalMarksForVerification($examId: uuid) {
    internal_marks(
      where: {
        is_verified: { _eq: false }
        exam_schedule: { exam_id: { _eq: $examId } }
      }
    ) {
      id
      marks_obtained
      is_absent
      student {
        profile {
          full_name
        }
        enrollment_number
      }
      exam_schedule {
        subject {
          name
        }
        max_marks
      }
    }
  }
`;

// ============ STUDENT QUERIES ============
export const GET_STUDENT_DASHBOARD = gql`
  query GetStudentDashboard($studentId: uuid!, $today: date!) {
    students_by_pk(id: $studentId) {
      id
      enrollment_number
      current_semester
      division
      profile {
        full_name
        photo_url
      }
      course {
        name
        short_name
      }
      department {
        name
      }
    }
    attendance_percentage: attendance_records_aggregate(
      where: { student_id: { _eq: $studentId } }
    ) {
      aggregate {
        count
      }
      nodes {
        status
      }
    }
    pending_assignments: assignments(
      where: {
        due_date: { _gte: $today }
        submissions: {
          _not: { student_id: { _eq: $studentId } }
        }
      }
    ) {
      id
      title
      due_date
      subject {
        name
      }
    }
  }
`;
```

**Create `lib/graphql/mutations.ts`:**
```typescript
import { gql } from 'urql';

// ============ ADMIN MUTATIONS ============
export const UPDATE_STUDENT_STATUS = gql`
  mutation UpdateStudentStatus($id: uuid!, $status: String!) {
    update_students_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
    }
  }
`;

export const VERIFY_EXTERNAL_UPLOAD = gql`
  mutation VerifyExternalUpload(
    $id: uuid!
    $status: String!
    $marks: numeric
    $rejectionReason: String
    $verifiedBy: uuid!
  ) {
    update_external_uploads_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        marks_obtained: $marks
        rejection_reason: $rejectionReason
        verified_by: $verifiedBy
        verified_at: "now()"
      }
    ) {
      id
      status
    }
  }
`;

export const APPROVE_BUS_SUBSCRIPTION = gql`
  mutation ApproveBusSubscription(
    $id: uuid!
    $status: String!
    $approvedBy: uuid!
  ) {
    update_bus_subscriptions_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        approved_by: $approvedBy
        approved_at: "now()"
      }
    ) {
      id
      status
    }
  }
`;

// ============ TEACHER MUTATIONS ============
export const MARK_ATTENDANCE = gql`
  mutation MarkAttendance($objects: [attendance_records_insert_input!]!) {
    insert_attendance_records(
      objects: $objects
      on_conflict: {
        constraint: attendance_records_session_id_student_id_key
        update_columns: [status, updated_at]
      }
    ) {
      affected_rows
    }
  }
`;

export const CREATE_ASSIGNMENT = gql`
  mutation CreateAssignment($object: assignments_insert_input!) {
    insert_assignments_one(object: $object) {
      id
      title
    }
  }
`;

export const GRADE_SUBMISSION = gql`
  mutation GradeSubmission(
    $id: uuid!
    $marks: numeric!
    $feedback: String
    $gradedBy: uuid!
  ) {
    update_submissions_by_pk(
      pk_columns: { id: $id }
      _set: {
        marks_obtained: $marks
        feedback: $feedback
        graded_by: $gradedBy
        graded_at: "now()"
      }
    ) {
      id
    }
  }
`;

export const SUBMIT_INTERNAL_MARKS = gql`
  mutation SubmitInternalMarks($objects: [internal_marks_insert_input!]!) {
    insert_internal_marks(
      objects: $objects
      on_conflict: {
        constraint: internal_marks_exam_schedule_id_student_id_key
        update_columns: [marks_obtained, is_absent, updated_at]
      }
    ) {
      affected_rows
    }
  }
`;

// ============ STUDENT MUTATIONS ============
export const SUBMIT_ASSIGNMENT = gql`
  mutation SubmitAssignment($object: submissions_insert_input!) {
    insert_submissions_one(object: $object) {
      id
      submitted_at
    }
  }
`;

export const UPLOAD_EXTERNAL_MARKS = gql`
  mutation UploadExternalMarks($object: external_uploads_insert_input!) {
    insert_external_uploads_one(object: $object) {
      id
      status
    }
  }
`;

export const UPDATE_STUDENT_SETTINGS = gql`
  mutation UpdateStudentSettings(
    $studentId: uuid!
    $settings: student_settings_set_input!
  ) {
    update_student_settings(
      where: { student_id: { _eq: $studentId } }
      _set: $settings
    ) {
      affected_rows
    }
  }
`;
```

#### Week 4: Zustand Stores

**Create `store/userManagementStore.ts`:**
```typescript
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql/client';
import { 
  GET_STUDENTS_LIST, 
  GET_TEACHERS_LIST,
  GET_PENDING_APPROVALS 
} from '@/lib/graphql/queries';
import { 
  UPDATE_STUDENT_STATUS,
  VERIFY_EXTERNAL_UPLOAD,
  APPROVE_BUS_SUBSCRIPTION 
} from '@/lib/graphql/mutations';

interface Student {
  id: string;
  enrollment_number: string;
  roll_number: string;
  division: string;
  current_semester: number;
  status: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    photo_url: string;
  };
  department: { short_name: string };
  course: { short_name: string };
}

interface UserManagementState {
  students: Student[];
  teachers: any[];
  pendingApprovals: {
    externalUploads: any[];
    busSubscriptions: any[];
  };
  totalStudents: number;
  totalTeachers: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchStudents: (filters?: any) => Promise<void>;
  fetchTeachers: (filters?: any) => Promise<void>;
  fetchPendingApprovals: () => Promise<void>;
  toggleStudentBlock: (id: string, blocked: boolean) => Promise<void>;
  verifyExternalUpload: (id: string, status: string, marks?: number) => Promise<void>;
  approveBusSubscription: (id: string, approved: boolean) => Promise<void>;
}

export const useUserManagementStore = create<UserManagementState>((set, get) => ({
  students: [],
  teachers: [],
  pendingApprovals: { externalUploads: [], busSubscriptions: [] },
  totalStudents: 0,
  totalTeachers: 0,
  loading: false,
  error: null,

  fetchStudents: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await graphqlClient.query(GET_STUDENTS_LIST, {
        limit: 20,
        offset: 0,
        where: filters,
      }).toPromise();
      
      if (result.error) throw result.error;
      
      set({
        students: result.data.students,
        totalStudents: result.data.students_aggregate.aggregate.count,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTeachers: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const result = await graphqlClient.query(GET_TEACHERS_LIST, {
        limit: 20,
        offset: 0,
        where: filters,
      }).toPromise();
      
      if (result.error) throw result.error;
      
      set({
        teachers: result.data.teachers,
        totalTeachers: result.data.teachers_aggregate.aggregate.count,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPendingApprovals: async () => {
    set({ loading: true });
    try {
      const result = await graphqlClient.query(GET_PENDING_APPROVALS, {}).toPromise();
      if (result.error) throw result.error;
      
      set({
        pendingApprovals: {
          externalUploads: result.data.external_uploads,
          busSubscriptions: result.data.bus_subscriptions,
        },
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  toggleStudentBlock: async (id, blocked) => {
    try {
      await graphqlClient.mutation(UPDATE_STUDENT_STATUS, {
        id,
        status: blocked ? 'blocked' : 'active',
      }).toPromise();
      
      // Refresh list
      get().fetchStudents();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  verifyExternalUpload: async (id, status, marks) => {
    try {
      await graphqlClient.mutation(VERIFY_EXTERNAL_UPLOAD, {
        id,
        status,
        marks,
        verifiedBy: 'current-user-id', // Get from auth store
      }).toPromise();
      
      get().fetchPendingApprovals();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  approveBusSubscription: async (id, approved) => {
    try {
      await graphqlClient.mutation(APPROVE_BUS_SUBSCRIPTION, {
        id,
        status: approved ? 'approved' : 'rejected',
        approvedBy: 'current-user-id',
      }).toPromise();
      
      get().fetchPendingApprovals();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
```

---

### PHASE 3 (Week 5-6): Admin Complete

#### Admin Dashboard Screen
**Create `app/(admin)/dashboard.tsx`:**
```typescript
import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useQuery } from 'urql';
import { GET_DASHBOARD_STATS } from '@/lib/graphql/queries';
import { GlassCard } from '@/components/ui';
import { useThemeStore } from '@/store/themeStore';

// Components you'll need (work with Christo/Deon)
import { StatCard } from '@/components/admin/StatCard';
import { QuickActions } from '@/components/admin/QuickActions';
import { PendingApprovals } from '@/components/admin/PendingApprovals';
import { RecentActivity } from '@/components/admin/RecentActivity';

export default function AdminDashboard() {
  const { isDark } = useThemeStore();
  const [result, reexecute] = useQuery({ query: GET_DASHBOARD_STATS });
  
  const { data, fetching, error } = result;
  
  const stats = data ? {
    students: data.students_aggregate.aggregate.count,
    teachers: data.teachers_aggregate.aggregate.count,
    departments: data.departments_aggregate.aggregate.count,
    pendingApprovals: 
      data.pending_external.aggregate.count + 
      data.pending_bus.aggregate.count,
  } : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={fetching} onRefresh={reexecute} />
      }
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard 
          title="Students" 
          value={stats?.students || 0} 
          icon="people"
          color="#6366F1"
        />
        <StatCard 
          title="Teachers" 
          value={stats?.teachers || 0} 
          icon="school"
          color="#8B5CF6"
        />
        <StatCard 
          title="Departments" 
          value={stats?.departments || 0} 
          icon="business"
          color="#EC4899"
        />
        <StatCard 
          title="Pending" 
          value={stats?.pendingApprovals || 0} 
          icon="hourglass"
          color="#F59E0B"
        />
      </View>

      {/* Quick Actions */}
      <QuickActions />

      {/* Pending Approvals Summary */}
      <PendingApprovals limit={5} />

      {/* Recent Activity */}
      <RecentActivity limit={10} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
});
```

#### Marks Verification Screen
**Create `app/(admin)/exams/verify-internal.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation } from 'urql';
import { GET_INTERNAL_MARKS_FOR_VERIFICATION } from '@/lib/graphql/queries';
import { GlassCard, PrimaryButton } from '@/components/ui';

export default function VerifyInternalMarks() {
  const [selectedExam, setSelectedExam] = useState(null);
  
  const [result] = useQuery({
    query: GET_INTERNAL_MARKS_FOR_VERIFICATION,
    variables: { examId: selectedExam },
    pause: !selectedExam,
  });

  const handleVerify = async (markId: string, approved: boolean) => {
    // Mutation to verify
    Alert.alert(
      approved ? 'Verified' : 'Rejected',
      'Mark verification updated'
    );
  };

  return (
    <View style={styles.container}>
      {/* Exam selector */}
      {/* Marks list with verify/reject buttons */}
      <FlatList
        data={result.data?.internal_marks || []}
        renderItem={({ item }) => (
          <GlassCard style={styles.markCard}>
            {/* Student info, marks, verify/reject buttons */}
          </GlassCard>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  markCard: { marginBottom: 12, padding: 16 },
});
```

---

### PHASE 4-5 (Week 7-10): Teacher Module

**Create `store/teacherDashboardStore.ts`:**
```typescript
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql/client';
import { GET_TEACHER_DASHBOARD } from '@/lib/graphql/queries';

interface TeacherDashboardState {
  teacher: any;
  todaysPeriods: any[];
  pendingSubmissions: number;
  loading: boolean;
  
  fetchDashboard: (teacherId: string) => Promise<void>;
}

export const useTeacherDashboardStore = create<TeacherDashboardState>((set) => ({
  teacher: null,
  todaysPeriods: [],
  pendingSubmissions: 0,
  loading: false,

  fetchDashboard: async (teacherId) => {
    set({ loading: true });
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await graphqlClient.query(GET_TEACHER_DASHBOARD, {
        teacherId,
        today,
      }).toPromise();

      if (result.data) {
        set({
          teacher: result.data.teachers_by_pk,
          todaysPeriods: result.data.todays_periods,
          pendingSubmissions: result.data.pending_assignments.aggregate.count,
          loading: false,
        });
      }
    } catch (error) {
      set({ loading: false });
    }
  },
}));
```

**Create `store/attendanceStore.ts`:**
```typescript
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql/client';
import { MARK_ATTENDANCE } from '@/lib/graphql/mutations';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: 'P' | 'A' | 'L';
}

interface AttendanceState {
  sessionId: string | null;
  records: AttendanceRecord[];
  saving: boolean;
  
  startSession: (periodId: string, subjectId: string) => Promise<string>;
  setStatus: (studentId: string, status: 'P' | 'A' | 'L') => void;
  markAllPresent: () => void;
  saveAttendance: () => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  sessionId: null,
  records: [],
  saving: false,

  startSession: async (periodId, subjectId) => {
    // Create attendance session, load students
    // Return session ID
    return 'session-id';
  },

  setStatus: (studentId, status) => {
    set((state) => ({
      records: state.records.map((r) =>
        r.studentId === studentId ? { ...r, status } : r
      ),
    }));
  },

  markAllPresent: () => {
    set((state) => ({
      records: state.records.map((r) => ({ ...r, status: 'P' })),
    }));
  },

  saveAttendance: async () => {
    set({ saving: true });
    const { sessionId, records } = get();
    
    try {
      await graphqlClient.mutation(MARK_ATTENDANCE, {
        objects: records.map((r) => ({
          session_id: sessionId,
          student_id: r.studentId,
          status: r.status,
        })),
      }).toPromise();
      
      set({ saving: false });
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },
}));
```

**Create `store/marksStore.ts`:**
```typescript
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql/client';
import { SUBMIT_INTERNAL_MARKS } from '@/lib/graphql/mutations';

interface MarksEntry {
  studentId: string;
  studentName: string;
  enrollmentNumber: string;
  marks: number | null;
  isAbsent: boolean;
}

interface MarksState {
  examScheduleId: string | null;
  entries: MarksEntry[];
  maxMarks: number;
  saving: boolean;
  
  loadExamStudents: (examScheduleId: string) => Promise<void>;
  setMarks: (studentId: string, marks: number | null) => void;
  setAbsent: (studentId: string, absent: boolean) => void;
  submitMarks: (teacherId: string) => Promise<void>;
  parseCSV: (csvContent: string) => MarksEntry[];
  uploadFromCSV: (entries: MarksEntry[]) => void;
}

export const useMarksStore = create<MarksState>((set, get) => ({
  examScheduleId: null,
  entries: [],
  maxMarks: 100,
  saving: false,

  loadExamStudents: async (examScheduleId) => {
    // Load students for the exam
    set({ examScheduleId });
  },

  setMarks: (studentId, marks) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.studentId === studentId ? { ...e, marks, isAbsent: false } : e
      ),
    }));
  },

  setAbsent: (studentId, absent) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.studentId === studentId ? { ...e, isAbsent: absent, marks: null } : e
      ),
    }));
  },

  submitMarks: async (teacherId) => {
    set({ saving: true });
    const { examScheduleId, entries } = get();

    try {
      await graphqlClient.mutation(SUBMIT_INTERNAL_MARKS, {
        objects: entries.map((e) => ({
          exam_schedule_id: examScheduleId,
          student_id: e.studentId,
          teacher_id: teacherId,
          marks_obtained: e.marks,
          is_absent: e.isAbsent,
        })),
      }).toPromise();

      set({ saving: false });
    } catch (error) {
      set({ saving: false });
      throw error;
    }
  },

  parseCSV: (csvContent) => {
    // Parse CSV and match to students
    const lines = csvContent.split('\n');
    // Return parsed entries
    return [];
  },

  uploadFromCSV: (entries) => {
    set({ entries });
  },
}));
```

---

### PHASE 6-8 (Week 11-16): Student Module Stores

**Create `store/studentDashboardStore.ts`:**
```typescript
import { create } from 'zustand';
import { graphqlClient } from '@/lib/graphql/client';
import { GET_STUDENT_DASHBOARD } from '@/lib/graphql/queries';

interface StudentDashboardState {
  student: any;
  attendancePercentage: number;
  pendingAssignments: any[];
  loading: boolean;
  
  fetchDashboard: (studentId: string) => Promise<void>;
}

export const useStudentDashboardStore = create<StudentDashboardState>((set) => ({
  student: null,
  attendancePercentage: 0,
  pendingAssignments: [],
  loading: false,

  fetchDashboard: async (studentId) => {
    set({ loading: true });
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await graphqlClient.query(GET_STUDENT_DASHBOARD, {
        studentId,
        today,
      }).toPromise();

      if (result.data) {
        const records = result.data.attendance_percentage.nodes;
        const present = records.filter((r: any) => r.status === 'P').length;
        const percentage = records.length > 0 
          ? Math.round((present / records.length) * 100) 
          : 0;

        set({
          student: result.data.students_by_pk,
          attendancePercentage: percentage,
          pendingAssignments: result.data.pending_assignments,
          loading: false,
        });
      }
    } catch (error) {
      set({ loading: false });
    }
  },
}));
```

---

## ✅ YOUR CHECKLIST

### Week 3-4: Hasura + Admin Foundation
- [ ] Track all core tables in Hasura
- [ ] Set up all relationships
- [ ] Configure role permissions
- [ ] Create graphql client
- [ ] Create queries.ts with admin queries
- [ ] Create mutations.ts with admin mutations
- [ ] Create userManagementStore.ts
- [ ] Build Admin Dashboard (enhanced)

### Week 5-6: Admin Complete
- [ ] Analytics queries
- [ ] Exam verification screens
- [ ] analyticsStore.ts
- [ ] examAdminStore.ts
- [ ] noticeAdminStore.ts
- [ ] settingsAdminStore.ts

### Week 7-10: Teacher Module
- [ ] Teacher GraphQL queries
- [ ] teacherDashboardStore.ts
- [ ] attendanceStore.ts
- [ ] marksStore.ts (with CSV support)
- [ ] assignmentStore.ts
- [ ] plannerStore.ts
- [ ] diaryStore.ts
- [ ] HoD approval screens
- [ ] hodStore.ts

### Week 11-16: Student Module
- [ ] Student GraphQL queries
- [ ] studentDashboardStore.ts
- [ ] All student stores
- [ ] Admin utility screens (library, bus, canteen, fees)

### Week 17-20: Polish
- [ ] React Query caching (optional upgrade)
- [ ] Store unit tests
- [ ] API documentation

---

## 🚨 CRITICAL REMINDERS

1. **Coordinate with Ash** - Wait for migrations before tracking tables
2. **Test permissions** - Verify role-based access works
3. **Generate types** - After any schema change
4. **Review screen PRs** - Ensure proper store usage
5. **Keep stores small** - One store per feature domain

---

*Guide for Abin - Last Updated: November 30, 2025*
