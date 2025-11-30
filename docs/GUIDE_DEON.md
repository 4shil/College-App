# 🔵 DEON's DEVELOPMENT GUIDE
## Role: Team Member / Student & Testing

---

## 🎯 YOUR RESPONSIBILITIES

1. **Student Module Screens** - Attendance, Assignments, Library, Bus, Feedback, Settings
2. **Teacher Module Screens** - Attendance Marking, Diary, Coordinator
3. **Admin Screens** - Exam Management, Settings, Bus Management
4. **Testing** - E2E tests, Integration tests

---

## 📅 YOUR TIMELINE

### PHASE 2-3 (Week 3-6): Admin Screens

#### Exam Management
**Create `app/(admin)/exams/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GlassCard, PrimaryButton } from '@/components/ui';

export default function ExamManagement() {
  return (
    <ScrollView style={styles.container}>
      <GlassCard style={styles.section}>
        <PrimaryButton
          title="Create Exam"
          onPress={() => router.push('/exams/create')}
        />
        <PrimaryButton
          title="View All Exams"
          onPress={() => router.push('/exams/list')}
          variant="outline"
        />
      </GlassCard>

      <GlassCard style={styles.section}>
        <PrimaryButton
          title="Exam Schedule"
          onPress={() => router.push('/exams/schedule')}
        />
        <PrimaryButton
          title="Room Allocation"
          onPress={() => router.push('/exams/rooms')}
          variant="secondary"
        />
      </GlassCard>

      <GlassCard style={styles.section}>
        <PrimaryButton
          title="Results Management"
          onPress={() => router.push('/exams/results')}
        />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 16, gap: 12 },
});
```

#### Create Exam Screen
**Create `app/(admin)/exams/create.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from 'urql';
import { GlassCard, GlassInput, PrimaryButton, DatePicker } from '@/components/ui';

const CREATE_EXAM = /* GraphQL */ `
  mutation CreateExam($object: exams_insert_input!) {
    insert_exams_one(object: $object) {
      id
      name
    }
  }
`;

export default function CreateExam() {
  const [form, setForm] = useState({
    name: '',
    type: 'internal',
    courseId: '',
    semesterNumber: 1,
    startDate: new Date(),
    endDate: new Date(),
  });

  const [, createExam] = useMutation(CREATE_EXAM);

  const handleSubmit = async () => {
    const result = await createExam({
      object: {
        name: form.name,
        type: form.type,
        course_id: form.courseId,
        semester_number: form.semesterNumber,
        start_date: form.startDate.toISOString().split('T')[0],
        end_date: form.endDate.toISOString().split('T')[0],
        status: 'draft',
      },
    });

    if (result.data) {
      Alert.alert('Success', 'Exam created');
      router.back();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <GlassCard>
        <GlassInput
          label="Exam Name"
          value={form.name}
          onChangeText={(name) => setForm((f) => ({ ...f, name }))}
          placeholder="e.g., Mid-Term Examination 2025"
        />
        {/* Course & Semester Dropdowns */}
        {/* Exam Type Selector */}
        <DatePicker
          label="Start Date"
          value={form.startDate}
          onChange={(d) => setForm((f) => ({ ...f, startDate: d }))}
        />
        <DatePicker
          label="End Date"
          value={form.endDate}
          onChange={(d) => setForm((f) => ({ ...f, endDate: d }))}
        />
        <PrimaryButton title="Create Exam" onPress={handleSubmit} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
```

#### Bus Management
**Create `app/(admin)/bus/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GlassCard, PrimaryButton } from '@/components/ui';

export default function BusManagement() {
  return (
    <ScrollView style={styles.container}>
      <GlassCard style={styles.section}>
        <PrimaryButton
          title="Routes"
          onPress={() => router.push('/bus/routes')}
        />
        <PrimaryButton
          title="Stops"
          onPress={() => router.push('/bus/stops')}
          variant="outline"
        />
      </GlassCard>

      <GlassCard style={styles.section}>
        <PrimaryButton
          title="Pending Subscriptions"
          onPress={() => router.push('/bus/subscriptions')}
        />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 16, gap: 12 },
});
```

#### Admin Settings
**Create `app/(admin)/settings/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet, Switch, Text } from 'react-native';
import { useQuery, useMutation } from 'urql';
import { GlassCard, GlassInput, PrimaryButton } from '@/components/ui';

const GET_SETTINGS = /* GraphQL */ `
  query GetSettings {
    app_settings {
      id
      key
      value
      category
    }
  }
`;

const UPDATE_SETTING = /* GraphQL */ `
  mutation UpdateSetting($id: uuid!, $value: jsonb!) {
    update_app_settings_by_pk(pk_columns: { id: $id }, _set: { value: $value }) {
      id
    }
  }
`;

export default function AdminSettings() {
  const [{ data }] = useQuery({ query: GET_SETTINGS });
  const [, updateSetting] = useMutation(UPDATE_SETTING);

  const settings = data?.app_settings || [];
  const grouped = settings.reduce((acc: any, s: any) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <ScrollView style={styles.container}>
      {Object.entries(grouped).map(([category, items]: [string, any]) => (
        <GlassCard key={category} style={styles.section}>
          <Text style={styles.category}>{category}</Text>
          {items.map((setting: any) => (
            <View key={setting.id} style={styles.settingRow}>
              <Text>{setting.key}</Text>
              {/* Render appropriate input based on value type */}
            </View>
          ))}
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 16, padding: 16 },
  category: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});
```

---

### PHASE 4-5 (Week 7-10): Teacher Screens

#### Attendance Marking
**Create `app/(teacher)/attendance/mark.tsx`:**
```typescript
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'urql';
import { GlassCard, PrimaryButton, Badge } from '@/components/ui';
import { useAttendanceStore } from '@/store/attendanceStore';

const GET_STUDENTS = /* GraphQL */ `
  query GetStudents($courseId: uuid!, $semester: Int!, $division: String!) {
    students(
      where: {
        course_id: { _eq: $courseId }
        current_semester: { _eq: $semester }
        division: { _eq: $division }
        status: { _eq: "active" }
      }
      order_by: { roll_number: asc }
    ) {
      id
      roll_number
      profile {
        full_name
        photo_url
      }
    }
  }
`;

export default function MarkAttendance() {
  const params = useLocalSearchParams();
  const { records, setStatus, markAllPresent, saveAttendance, saving } = useAttendanceStore();

  const [{ data }] = useQuery({
    query: GET_STUDENTS,
    variables: {
      courseId: params.courseId,
      semester: parseInt(params.semester as string),
      division: params.division,
    },
  });

  const students = data?.students || [];

  const handleSave = async () => {
    try {
      await saveAttendance();
      Alert.alert('Success', 'Attendance saved');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'P': return 'success';
      case 'A': return 'error';
      case 'L': return 'warning';
      default: return 'default';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PrimaryButton title="All Present" onPress={markAllPresent} size="small" />
        <PrimaryButton title="Save" onPress={handleSave} loading={saving} />
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const record = records.find((r) => r.studentId === item.id);
          const status = record?.status || 'P';

          return (
            <GlassCard style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.rollNo}>{item.roll_number}</Text>
                <Text style={styles.name}>{item.profile.full_name}</Text>
              </View>
              <View style={styles.statusButtons}>
                {['P', 'A', 'L'].map((s) => (
                  <Badge
                    key={s}
                    variant={status === s ? getStatusColor(s) : 'default'}
                    onPress={() => setStatus(item.id, s as 'P' | 'A' | 'L')}
                  >
                    {s}
                  </Badge>
                ))}
              </View>
            </GlassCard>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  studentCard: { marginBottom: 8, padding: 12, flexDirection: 'row', alignItems: 'center' },
  studentInfo: { flex: 1 },
  rollNo: { fontSize: 14, fontWeight: '700' },
  name: { fontSize: 13, color: '#6B7280' },
  statusButtons: { flexDirection: 'row', gap: 8 },
});
```

#### Teacher Diary
**Create `app/(teacher)/diary/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'urql';
import { GlassCard, PrimaryButton, FAB, DatePicker } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

const GET_DIARY_ENTRIES = /* GraphQL */ `
  query GetDiaryEntries($teacherId: uuid!, $date: date!) {
    teacher_diary(
      where: {
        teacher_id: { _eq: $teacherId }
        date: { _eq: $date }
      }
      order_by: { period_number: asc }
    ) {
      id
      period_number
      topic_covered
      homework_assigned
      remarks
      subject {
        name
        code
      }
    }
  }
`;

export default function TeacherDiary() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [{ data }] = useQuery({
    query: GET_DIARY_ENTRIES,
    variables: {
      teacherId: user?.teacherId,
      date: format(selectedDate, 'yyyy-MM-dd'),
    },
  });

  return (
    <View style={styles.container}>
      <DatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        label="Select Date"
      />

      <FlatList
        data={data?.teacher_diary || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.entryCard}>
            <View style={styles.header}>
              <Text style={styles.period}>Period {item.period_number}</Text>
              <Text style={styles.subject}>{item.subject.code}</Text>
            </View>
            <Text style={styles.topic}>{item.topic_covered}</Text>
            {item.homework_assigned && (
              <Text style={styles.homework}>HW: {item.homework_assigned}</Text>
            )}
          </GlassCard>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No entries for this date</Text>
        }
      />

      <FAB
        icon="add"
        onPress={() => router.push(`/diary/add?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  entryCard: { marginBottom: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  period: { fontWeight: '700' },
  subject: { color: '#6366F1' },
  topic: { fontSize: 15, marginBottom: 4 },
  homework: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },
  empty: { textAlign: 'center', marginTop: 40, color: '#9CA3AF' },
});
```

#### Coordinator Dashboard
**Create `app/(teacher)/coordinator/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useQuery } from 'urql';
import { GlassCard, PrimaryButton, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const GET_COORDINATOR_DATA = /* GraphQL */ `
  query GetCoordinatorData($departmentId: uuid!) {
    pending_approvals: exam_schedule_aggregate(
      where: {
        exam: { department_id: { _eq: $departmentId } }
        status: { _eq: "pending" }
      }
    ) {
      aggregate { count }
    }
    upcoming_exams: exams(
      where: {
        department_id: { _eq: $departmentId }
        start_date: { _gte: "now()" }
      }
      limit: 5
    ) {
      id
      name
      start_date
      status
    }
  }
`;

export default function CoordinatorDashboard() {
  const { user } = useAuthStore();

  const [{ data }] = useQuery({
    query: GET_COORDINATOR_DATA,
    variables: { departmentId: user?.departmentId },
  });

  return (
    <ScrollView style={styles.container}>
      <GlassCard style={styles.statsCard} color="primary">
        <Text style={styles.statLabel}>Pending Schedule Approvals</Text>
        <Text style={styles.statValue}>
          {data?.pending_approvals.aggregate.count || 0}
        </Text>
      </GlassCard>

      <Text style={styles.sectionTitle}>Upcoming Exams</Text>
      {data?.upcoming_exams.map((exam: any) => (
        <GlassCard key={exam.id} style={styles.examCard}>
          <Text style={styles.examName}>{exam.name}</Text>
          <Badge>{exam.status}</Badge>
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  statsCard: { marginBottom: 20, padding: 20, alignItems: 'center' },
  statLabel: { color: '#FFF', fontSize: 14 },
  statValue: { color: '#FFF', fontSize: 36, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  examCard: { marginBottom: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between' },
  examName: { fontSize: 15, fontWeight: '600' },
});
```

---

### PHASE 6-8 (Week 11-16): Student Module Screens

#### Attendance View
**Create `app/(student)/attendance/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useQuery } from 'urql';
import { GlassCard, ProgressBar, Tabs } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const GET_ATTENDANCE = /* GraphQL */ `
  query GetAttendance($studentId: uuid!) {
    attendance_summary: attendance_records_aggregate(
      where: { student_id: { _eq: $studentId } }
    ) {
      aggregate { count }
      nodes { status }
    }
    subject_attendance: attendance_records(
      where: { student_id: { _eq: $studentId } }
    ) {
      status
      session {
        subject {
          id
          name
          code
        }
      }
    }
  }
`;

export default function AttendanceScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const [{ data }] = useQuery({
    query: GET_ATTENDANCE,
    variables: { studentId: profile?.studentId },
  });

  const records = data?.attendance_summary?.nodes || [];
  const present = records.filter((r: any) => r.status === 'P').length;
  const total = records.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  // Calculate per-subject
  const subjectMap: Record<string, { present: number; total: number; name: string }> = {};
  (data?.subject_attendance || []).forEach((r: any) => {
    const subId = r.session.subject.id;
    if (!subjectMap[subId]) {
      subjectMap[subId] = { present: 0, total: 0, name: r.session.subject.name };
    }
    subjectMap[subId].total++;
    if (r.status === 'P') subjectMap[subId].present++;
  });

  return (
    <View style={styles.container}>
      <Tabs
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'subjects', label: 'By Subject' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'overview' ? (
        <GlassCard style={styles.overviewCard}>
          <Text style={styles.percentageLabel}>Overall Attendance</Text>
          <Text style={styles.percentage}>{percentage}%</Text>
          <ProgressBar value={percentage} color={percentage >= 75 ? 'success' : 'error'} />
          <Text style={styles.detail}>
            {present} present out of {total} classes
          </Text>
        </GlassCard>
      ) : (
        <ScrollView>
          {Object.entries(subjectMap).map(([id, data]) => {
            const pct = Math.round((data.present / data.total) * 100);
            return (
              <GlassCard key={id} style={styles.subjectCard}>
                <Text style={styles.subjectName}>{data.name}</Text>
                <ProgressBar value={pct} color={pct >= 75 ? 'success' : 'error'} />
                <Text style={styles.subjectDetail}>{pct}% ({data.present}/{data.total})</Text>
              </GlassCard>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  overviewCard: { alignItems: 'center', padding: 24 },
  percentageLabel: { fontSize: 14, color: '#6B7280' },
  percentage: { fontSize: 48, fontWeight: '700', color: '#6366F1' },
  detail: { marginTop: 8, color: '#6B7280' },
  subjectCard: { marginBottom: 12, padding: 16 },
  subjectName: { fontWeight: '600', marginBottom: 8 },
  subjectDetail: { marginTop: 4, fontSize: 12, color: '#6B7280' },
});
```

#### Assignments Screen
**Create `app/(student)/assignments/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'urql';
import { GlassCard, Badge, Tabs, PrimaryButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { format, isPast } from 'date-fns';

const GET_ASSIGNMENTS = /* GraphQL */ `
  query GetAssignments($studentId: uuid!, $courseId: uuid!, $semester: Int!) {
    assignments(
      where: {
        subject: {
          course_subjects: {
            course_id: { _eq: $courseId }
            semester_number: { _eq: $semester }
          }
        }
      }
      order_by: { due_date: asc }
    ) {
      id
      title
      description
      due_date
      max_marks
      subject { name code }
      submissions(where: { student_id: { _eq: $studentId } }) {
        id
        submitted_at
        marks_obtained
      }
    }
  }
`;

export default function AssignmentsScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('pending');

  const [{ data }] = useQuery({
    query: GET_ASSIGNMENTS,
    variables: {
      studentId: profile?.studentId,
      courseId: profile?.course?.id,
      semester: profile?.current_semester,
    },
  });

  const assignments = data?.assignments || [];
  const pending = assignments.filter((a: any) => a.submissions.length === 0 && !isPast(new Date(a.due_date)));
  const submitted = assignments.filter((a: any) => a.submissions.length > 0);
  const overdue = assignments.filter((a: any) => a.submissions.length === 0 && isPast(new Date(a.due_date)));

  const getList = () => {
    switch (activeTab) {
      case 'pending': return pending;
      case 'submitted': return submitted;
      case 'overdue': return overdue;
      default: return [];
    }
  };

  return (
    <View style={styles.container}>
      <Tabs
        tabs={[
          { key: 'pending', label: `Pending (${pending.length})` },
          { key: 'submitted', label: `Submitted (${submitted.length})` },
          { key: 'overdue', label: `Overdue (${overdue.length})` },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <FlatList
        data={getList()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Badge>{item.subject.code}</Badge>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.due}>Due: {format(new Date(item.due_date), 'MMM d, h:mm a')}</Text>
            {item.submissions.length > 0 ? (
              <Text style={styles.marks}>
                Marks: {item.submissions[0].marks_obtained ?? 'Pending'} / {item.max_marks}
              </Text>
            ) : (
              <PrimaryButton
                title="Submit"
                size="small"
                onPress={() => router.push(`/assignments/${item.id}/submit`)}
              />
            )}
          </GlassCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 12, padding: 16 },
  title: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  due: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  marks: { fontSize: 14, color: '#10B981' },
});
```

#### Library Screen
**Create `app/(student)/library/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useQuery } from 'urql';
import { GlassCard, SearchBar, Tabs, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const GET_LIBRARY_DATA = /* GraphQL */ `
  query GetLibraryData($studentId: uuid!, $search: String) {
    my_books: book_issues(
      where: { student_id: { _eq: $studentId } }
      order_by: { issue_date: desc }
    ) {
      id
      issue_date
      due_date
      return_date
      book { title author isbn }
    }
    catalog: books(
      where: { title: { _ilike: $search } }
      limit: 20
    ) {
      id
      title
      author
      available_copies
    }
  }
`;

export default function LibraryScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('mybooks');
  const [search, setSearch] = useState('');

  const [{ data }] = useQuery({
    query: GET_LIBRARY_DATA,
    variables: {
      studentId: profile?.studentId,
      search: `%${search}%`,
    },
  });

  return (
    <View style={styles.container}>
      <Tabs
        tabs={[
          { key: 'mybooks', label: 'My Books' },
          { key: 'catalog', label: 'Catalog' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'catalog' && (
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search books..." />
      )}

      <FlatList
        data={activeTab === 'mybooks' ? data?.my_books : data?.catalog}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            {activeTab === 'mybooks' ? (
              <>
                <Text style={styles.bookTitle}>{item.book.title}</Text>
                <Text style={styles.author}>{item.book.author}</Text>
                <Badge variant={item.return_date ? 'success' : 'warning'}>
                  {item.return_date ? 'Returned' : 'Borrowed'}
                </Badge>
              </>
            ) : (
              <>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.author}>{item.author}</Text>
                <Text>Available: {item.available_copies}</Text>
              </>
            )}
          </GlassCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 12, padding: 16 },
  bookTitle: { fontSize: 16, fontWeight: '600' },
  author: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
});
```

#### Bus Subscription
**Create `app/(student)/bus/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert } from 'react-native';
import { useQuery, useMutation } from 'urql';
import { GlassCard, PrimaryButton, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { Picker } from '@react-native-picker/picker';

const GET_BUS_DATA = /* GraphQL */ `
  query GetBusData($studentId: uuid!) {
    my_subscription: bus_subscriptions(
      where: { student_id: { _eq: $studentId }, status: { _neq: "cancelled" } }
      limit: 1
    ) {
      id
      status
      route { route_name }
      stop { stop_name }
    }
    routes: bus_routes(where: { is_active: { _eq: true } }) {
      id
      route_name
      stops { id stop_name fee }
    }
  }
`;

const SUBSCRIBE = /* GraphQL */ `
  mutation Subscribe($object: bus_subscriptions_insert_input!) {
    insert_bus_subscriptions_one(object: $object) { id }
  }
`;

export default function BusScreen() {
  const { profile } = useAuthStore();
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedStop, setSelectedStop] = useState('');

  const [{ data }, refetch] = useQuery({
    query: GET_BUS_DATA,
    variables: { studentId: profile?.studentId },
  });

  const [, subscribe] = useMutation(SUBSCRIBE);

  const subscription = data?.my_subscription?.[0];
  const routes = data?.routes || [];
  const stops = routes.find((r: any) => r.id === selectedRoute)?.stops || [];

  const handleSubscribe = async () => {
    const result = await subscribe({
      object: {
        student_id: profile?.studentId,
        route_id: selectedRoute,
        stop_id: selectedStop,
      },
    });
    if (result.data) {
      Alert.alert('Success', 'Subscription request submitted');
      refetch();
    }
  };

  return (
    <ScrollView style={styles.container}>
      {subscription ? (
        <GlassCard style={styles.subscriptionCard}>
          <Text style={styles.label}>Current Subscription</Text>
          <Text style={styles.value}>{subscription.route.route_name}</Text>
          <Text>Stop: {subscription.stop.stop_name}</Text>
          <Badge variant={subscription.status === 'approved' ? 'success' : 'warning'}>
            {subscription.status}
          </Badge>
        </GlassCard>
      ) : (
        <GlassCard>
          <Text style={styles.label}>Subscribe to Bus</Text>
          <Picker selectedValue={selectedRoute} onValueChange={setSelectedRoute}>
            <Picker.Item label="Select Route" value="" />
            {routes.map((r: any) => (
              <Picker.Item key={r.id} label={r.route_name} value={r.id} />
            ))}
          </Picker>
          {selectedRoute && (
            <Picker selectedValue={selectedStop} onValueChange={setSelectedStop}>
              <Picker.Item label="Select Stop" value="" />
              {stops.map((s: any) => (
                <Picker.Item key={s.id} label={`${s.stop_name} - ₹${s.fee}`} value={s.id} />
              ))}
            </Picker>
          )}
          <PrimaryButton
            title="Subscribe"
            onPress={handleSubscribe}
            disabled={!selectedRoute || !selectedStop}
          />
        </GlassCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  subscriptionCard: { padding: 20 },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
});
```

#### Feedback Screen
**Create `app/(student)/feedback/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text } from 'react-native';
import { useMutation, useQuery } from 'urql';
import { GlassCard, GlassInput, PrimaryButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { Picker } from '@react-native-picker/picker';

const SUBMIT_FEEDBACK = /* GraphQL */ `
  mutation SubmitFeedback($object: feedback_insert_input!) {
    insert_feedback_one(object: $object) { id }
  }
`;

export default function FeedbackScreen() {
  const { profile } = useAuthStore();
  const [form, setForm] = useState({
    category: 'general',
    subject: '',
    message: '',
    isAnonymous: false,
  });

  const [, submitFeedback] = useMutation(SUBMIT_FEEDBACK);

  const handleSubmit = async () => {
    if (!form.subject || !form.message) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const result = await submitFeedback({
      object: {
        student_id: form.isAnonymous ? null : profile?.studentId,
        category: form.category,
        subject: form.subject,
        message: form.message,
        is_anonymous: form.isAnonymous,
      },
    });

    if (result.data) {
      Alert.alert('Success', 'Feedback submitted');
      setForm({ category: 'general', subject: '', message: '', isAnonymous: false });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <GlassCard>
        <Picker
          selectedValue={form.category}
          onValueChange={(category) => setForm((f) => ({ ...f, category }))}
        >
          <Picker.Item label="General" value="general" />
          <Picker.Item label="Academic" value="academic" />
          <Picker.Item label="Infrastructure" value="infrastructure" />
          <Picker.Item label="Faculty" value="faculty" />
          <Picker.Item label="Suggestion" value="suggestion" />
        </Picker>

        <GlassInput
          label="Subject"
          value={form.subject}
          onChangeText={(subject) => setForm((f) => ({ ...f, subject }))}
        />

        <GlassInput
          label="Message"
          value={form.message}
          onChangeText={(message) => setForm((f) => ({ ...f, message }))}
          multiline
          numberOfLines={5}
        />

        <View style={styles.checkboxRow}>
          <Text>Submit Anonymously</Text>
          {/* Checkbox component */}
        </View>

        <PrimaryButton title="Submit Feedback" onPress={handleSubmit} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
});
```

#### Student Settings
**Create `app/(student)/settings/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet, Switch, Text, Alert } from 'react-native';
import { useQuery, useMutation } from 'urql';
import { GlassCard, PrimaryButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { supabase } from '@/lib/supabase';

const GET_SETTINGS = /* GraphQL */ `
  query GetSettings($studentId: uuid!) {
    student_settings(where: { student_id: { _eq: $studentId } }) {
      notification_attendance
      notification_assignments
      notification_exams
      notification_announcements
    }
  }
`;

const UPDATE_SETTINGS = /* GraphQL */ `
  mutation UpdateSettings($studentId: uuid!, $settings: student_settings_set_input!) {
    update_student_settings(where: { student_id: { _eq: $studentId } }, _set: $settings) {
      affected_rows
    }
  }
`;

export default function SettingsScreen() {
  const { profile, signOut } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const [{ data }, refetch] = useQuery({
    query: GET_SETTINGS,
    variables: { studentId: profile?.studentId },
  });

  const [, updateSettings] = useMutation(UPDATE_SETTINGS);

  const settings = data?.student_settings?.[0] || {};

  const handleToggle = async (key: string, value: boolean) => {
    await updateSettings({
      studentId: profile?.studentId,
      settings: { [key]: value },
    });
    refetch();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.row}>
          <Text>Dark Mode</Text>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text>Attendance Alerts</Text>
          <Switch
            value={settings.notification_attendance}
            onValueChange={(v) => handleToggle('notification_attendance', v)}
          />
        </View>
        <View style={styles.row}>
          <Text>Assignment Reminders</Text>
          <Switch
            value={settings.notification_assignments}
            onValueChange={(v) => handleToggle('notification_assignments', v)}
          />
        </View>
        <View style={styles.row}>
          <Text>Exam Alerts</Text>
          <Switch
            value={settings.notification_exams}
            onValueChange={(v) => handleToggle('notification_exams', v)}
          />
        </View>
      </GlassCard>

      <GlassCard style={styles.section}>
        <PrimaryButton title="Logout" onPress={handleLogout} variant="danger" />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});
```

---

### PHASE 9-10 (Week 17-20): Testing

#### E2E Test Setup
```bash
npm install --save-dev detox jest
```

#### Sample E2E Test
**Create `e2e/login.test.ts`:**
```typescript
import { device, element, by, expect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.text('Login'))).toBeVisible();
  });

  it('should login with valid credentials', async () => {
    await element(by.id('email-input')).typeText('student@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Dashboard'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@test.com');
    await element(by.id('password-input')).typeText('wrongpass');
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

---

## ✅ YOUR CHECKLIST

### Week 3-6: Admin Screens
- [ ] Exam management index
- [ ] Create exam screen
- [ ] Exam schedule builder
- [ ] Bus management
- [ ] Admin settings

### Week 7-10: Teacher Screens
- [ ] Attendance marking UI
- [ ] Teacher diary
- [ ] Coordinator dashboard

### Week 11-16: Student Module
- [ ] Attendance view
- [ ] Assignments list + submit
- [ ] Library (my books + catalog)
- [ ] Bus subscription
- [ ] Feedback form
- [ ] Student settings

### Week 17-20: Testing
- [ ] Detox setup
- [ ] Login flow tests
- [ ] Student flow tests
- [ ] Teacher flow tests
- [ ] Admin flow tests

---

## 🚨 CRITICAL REMINDERS

1. **Use Christo's components** - Import from `@/components/ui`
2. **Use Abin's stores** - Don't duplicate state logic
3. **Add testIDs** - All interactive elements need `testID`
4. **Test on device** - Especially attendance marking
5. **Coordinate on overlap** - Settings, feedback may overlap with Christo

---

*Guide for Deon - Last Updated: November 30, 2025*
