# 🟢 CHRISTO's VIBE GUIDE
## Role: UI Lead / Student Module
## Target: 4-5 screens per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **UI Component Library** - All reusable components
2. **Auth Screens** - Login, Register, Forgot, OTP
3. **Admin Screens** - Dashboard, Academic, Library, Canteen, Honors
4. **Student Screens** - Profile, Attendance, Assignments, Exams, Results

---

# WEEK 1: COMPONENTS + AUTH + ADMIN

## Day 1 - Core Components + Login
```typescript
// components/ui/GlassCard.tsx
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  delay?: number;
}

export function GlassCard({ children, style, intensity = 20, delay = 0, ...props }: GlassCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[styles.container, style]} {...props}>
      <BlurView intensity={intensity} style={styles.blur}>
        {children}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  blur: { padding: 20 },
});

// components/ui/GlassInput.tsx
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function GlassInput({ label, icon, error, ...props }) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.error]}>
        {icon && <Ionicons name={icon} size={20} color="#9CA3AF" />}
        <TextInput style={styles.input} placeholderTextColor="#6B7280" {...props} />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// components/ui/PrimaryButton.tsx
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary', size = 'medium' }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.button, styles[variant], styles[size], disabled && styles.disabled]}
        onPress={onPress}
        disabled={loading || disabled}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
      >
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.text}>{title}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// components/ui/Badge.tsx
export function Badge({ children, variant = 'default', onPress }) {
  const colors = { default: '#6B7280', success: '#10B981', warning: '#F59E0B', error: '#EF4444', primary: '#6366F1' };
  return (
    <TouchableOpacity onPress={onPress} style={[styles.badge, { backgroundColor: colors[variant] }]}>
      <Text style={styles.badgeText}>{children}</Text>
    </TouchableOpacity>
  );
}

// components/ui/Avatar.tsx
export function Avatar({ source, name, size = 40 }) {
  if (source) return <Image source={{ uri: source }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#FFF', fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

// components/ui/Modal.tsx
export function Modal({ visible, onClose, title, children }) {
  return (
    <RNModal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <GlassCard style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
          </View>
          {children}
        </GlassCard>
      </View>
    </RNModal>
  );
}

// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { GlassCard, GlassInput, PrimaryButton, AnimatedBackground } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <Text style={styles.logo}>JPM College</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <GlassInput label="Email" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <GlassInput label="Password" icon="lock-closed" value={password} onChangeText={setPassword} secureTextEntry />
          {error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton title="Login" onPress={handleLogin} loading={loading} />
          <Text style={styles.link} onPress={() => router.push('/forgot-password')}>Forgot Password?</Text>
          <Text style={styles.link} onPress={() => router.push('/register')}>Create Account</Text>
        </GlassCard>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}
```

## Day 2 - More Auth + Admin Layout
```typescript
// app/(auth)/register.tsx - Deon does this
// app/(auth)/forgot-password.tsx
export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    await supabase.auth.resetPasswordForEmail(email);
    setSent(true);
  };

  return (
    <AnimatedBackground>
      <GlassCard>
        {sent ? (
          <>
            <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            <Text>Check your email for reset link</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <GlassInput label="Email" value={email} onChangeText={setEmail} />
            <PrimaryButton title="Send Reset Link" onPress={handleReset} />
          </>
        )}
      </GlassCard>
    </AnimatedBackground>
  );
}

// components/ui/AnimatedBackground.tsx
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

export function AnimatedBackground({ children }) {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 20000 }), -1);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0F23', '#1A1A3E', '#0F0F23']} style={StyleSheet.absoluteFill} />
      {/* Animated orbs */}
      {children}
    </View>
  );
}

// app/(admin)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ tabBarStyle: { backgroundColor: '#1A1A2E' }, tabBarActiveTintColor: '#6366F1' }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} /> }} />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} /> }} />
      <Tabs.Screen name="academic" options={{ title: 'Academic', tabBarIcon: ({ color }) => <Ionicons name="school" size={24} color={color} /> }} />
      <Tabs.Screen name="notices" options={{ title: 'Notices', tabBarIcon: ({ color }) => <Ionicons name="megaphone" size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} /> }} />
    </Tabs>
  );
}

// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
```

## Day 3 - Admin Dashboard + Users
```typescript
// components/ui/StatCard.tsx
export function StatCard({ title, value, icon, color = '#6366F1', trend }) {
  return (
    <GlassCard style={styles.stat}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {trend && <Badge variant={trend > 0 ? 'success' : 'error'}>{trend > 0 ? '+' : ''}{trend}%</Badge>}
    </GlassCard>
  );
}

// components/ui/QuickActions.tsx
export function QuickActions({ actions }) {
  return (
    <View style={styles.grid}>
      {actions.map(action => (
        <TouchableOpacity key={action.id} style={styles.action} onPress={action.onPress}>
          <Ionicons name={action.icon} size={28} color="#6366F1" />
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// app/(admin)/dashboard.tsx
export default function AdminDashboard() {
  const { data } = useQuery({ query: GET_ADMIN_STATS });
  const stats = data?.dashboard_stats || {};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Welcome, Admin</Text>
      
      <View style={styles.statsRow}>
        <StatCard title="Students" value={stats.students || 0} icon="people" color="#6366F1" />
        <StatCard title="Teachers" value={stats.teachers || 0} icon="school" color="#10B981" />
      </View>
      <View style={styles.statsRow}>
        <StatCard title="Departments" value={stats.departments || 0} icon="business" color="#F59E0B" />
        <StatCard title="Courses" value={stats.courses || 0} icon="book" color="#EF4444" />
      </View>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <QuickActions actions={[
          { id: 1, label: 'Add Student', icon: 'person-add', onPress: () => router.push('/users/add?type=student') },
          { id: 2, label: 'Add Teacher', icon: 'person-add', onPress: () => router.push('/users/add?type=teacher') },
          { id: 3, label: 'Create Notice', icon: 'megaphone', onPress: () => router.push('/notices/create') },
          { id: 4, label: 'Create Event', icon: 'calendar', onPress: () => router.push('/events/create') },
        ]} />
      </GlassCard>

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {/* Activity list */}
      </GlassCard>
    </ScrollView>
  );
}

// app/(admin)/users.tsx
export default function UsersScreen() {
  const { students, teachers, fetchStudents, fetchTeachers, loading } = useUserManagementStore();
  const [tab, setTab] = useState('students');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { tab === 'students' ? fetchStudents() : fetchTeachers(); }, [tab]);

  return (
    <View style={styles.container}>
      <Tabs tabs={[{ key: 'students', label: 'Students' }, { key: 'teachers', label: 'Teachers' }]} activeTab={tab} onChange={setTab} />
      
      <FlatList
        data={tab === 'students' ? students : teachers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.userCard}>
            <Avatar source={item.profile.photo_url} name={item.profile.full_name} />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.profile.full_name}</Text>
              <Text style={styles.email}>{item.profile.email}</Text>
            </View>
            <Badge variant={item.status === 'active' ? 'success' : 'error'}>{item.status}</Badge>
          </GlassCard>
        )}
        refreshing={loading}
        onRefresh={() => tab === 'students' ? fetchStudents() : fetchTeachers()}
      />

      <FAB icon="add" onPress={() => setModalVisible(true)} />
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Add User">
        {/* Add user form */}
      </Modal>
    </View>
  );
}

// User detail modal, Add/Edit user - similar pattern
```

## Day 4 - Academic CRUD + Notices + Events
```typescript
// app/(admin)/academic/index.tsx
export default function AcademicIndex() {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.card} onPress={() => router.push('/academic/departments')}>
        <Ionicons name="business" size={32} color="#6366F1" />
        <Text style={styles.cardTitle}>Departments</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push('/academic/courses')}>
        <Ionicons name="book" size={32} color="#10B981" />
        <Text style={styles.cardTitle}>Courses</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push('/academic/subjects')}>
        <Ionicons name="library" size={32} color="#F59E0B" />
        <Text style={styles.cardTitle}>Subjects</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.card} onPress={() => router.push('/academic/semesters')}>
        <Ionicons name="calendar" size={32} color="#EF4444" />
        <Text style={styles.cardTitle}>Semesters</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// app/(admin)/academic/departments.tsx
export default function DepartmentsScreen() {
  const { departments, fetchDepartments, createDepartment, updateDepartment, deleteDepartment } = useAcademicStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchDepartments(); }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={departments}
        renderItem={({ item }) => (
          <GlassCard style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.short}>{item.short_name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setEditing(item); setModalVisible(true); }}>
                <Ionicons name="pencil" size={20} color="#F59E0B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteDepartment(item.id)}>
                <Ionicons name="trash" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}
      />
      <FAB icon="add" onPress={() => { setEditing(null); setModalVisible(true); }} />
      {/* Modal with form */}
    </View>
  );
}

// Similar for courses.tsx, subjects.tsx, semesters.tsx

// Notices CRUD - app/(admin)/notices.tsx
export default function NoticesScreen() {
  const { notices, fetchNotices, createNotice, publishNotice, deleteNotice } = useNoticeStore();
  // FlatList with create modal, publish/delete actions
}

// Events CRUD - app/(admin)/events.tsx  
export default function EventsScreen() {
  const { events, fetchEvents, createEvent, updateEvent, deleteEvent } = useEventStore();
  // Similar pattern
}
```

## Day 5 - Library + Room Allocation
```typescript
// app/(admin)/library/index.tsx
export default function LibraryAdmin() {
  const { books, issues, fetchBooks, addBook, issueBook, returnBook, getOverdueBooks } = useLibraryStore();
  const [tab, setTab] = useState('catalog');

  return (
    <View style={styles.container}>
      <Tabs tabs={[
        { key: 'catalog', label: 'Catalog' },
        { key: 'issued', label: 'Issued' },
        { key: 'overdue', label: 'Overdue' },
      ]} activeTab={tab} onChange={setTab} />

      {tab === 'catalog' && (
        <>
          <SearchBar placeholder="Search books..." onSearch={fetchBooks} />
          <FlatList data={books} renderItem={({ item }) => (
            <GlassCard>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.author}>{item.author}</Text>
              <Text>Available: {item.available_copies}/{item.total_copies}</Text>
            </GlassCard>
          )} />
          <FAB icon="add" onPress={() => {/* show add modal */}} />
        </>
      )}

      {tab === 'issued' && (
        <FlatList data={issues.filter(i => !i.return_date)} renderItem={({ item }) => (
          <GlassCard>
            <Text>{item.book.title}</Text>
            <Text>To: {item.student.profile.full_name}</Text>
            <Text>Due: {format(new Date(item.due_date), 'MMM d')}</Text>
            <PrimaryButton title="Return" size="small" onPress={() => returnBook(item.id)} />
          </GlassCard>
        )} />
      )}

      {tab === 'overdue' && (
        <FlatList data={issues.filter(i => !i.return_date && isPast(new Date(i.due_date)))} renderItem={({ item }) => (
          <GlassCard>
            <Text>{item.book.title}</Text>
            <Badge variant="error">Overdue {differenceInDays(new Date(), new Date(item.due_date))} days</Badge>
          </GlassCard>
        )} />
      )}
    </View>
  );
}

// Issue book modal
// Return book action
// Add book modal

// Exam room allocation - app/(admin)/exams/rooms.tsx
export default function RoomAllocation() {
  // Drag and drop or picker to assign rooms to exam schedules
}
```

---

# WEEK 2: CANTEEN + TEACHER SCREENS

## Day 6 - Canteen Admin
```typescript
// app/(admin)/canteen/index.tsx
export default function CanteenAdmin() {
  const { menuItems, tokens, fetchMenu, addMenuItem, updateAvailability, updateTokenStatus, getDailySales } = useCanteenAdminStore();
  const [tab, setTab] = useState('menu');

  return (
    <View>
      <Tabs tabs={[{ key: 'menu', label: 'Menu' }, { key: 'tokens', label: 'Tokens' }, { key: 'sales', label: 'Sales' }]} activeTab={tab} onChange={setTab} />

      {tab === 'menu' && <MenuList items={menuItems} onToggle={updateAvailability} onAdd={() => {}} />}
      {tab === 'tokens' && <TokenList tokens={tokens} onStatusChange={updateTokenStatus} />}
      {tab === 'sales' && <SalesSummary data={getDailySales(new Date())} />}
    </View>
  );
}
```

## Day 7 - Honors Admin + Teacher Layout
```typescript
// app/(admin)/honors/index.tsx - Programs CRUD
// app/(admin)/honors/enrollments.tsx - Enrollment management

// app/(teacher)/_layout.tsx
export default function TeacherLayout() {
  return (
    <Tabs screenOptions={{ tabBarStyle: { backgroundColor: '#1A1A2E' }, tabBarActiveTintColor: '#10B981' }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={24} color={color} /> }} />
      <Tabs.Screen name="marks" options={{ title: 'Marks', tabBarIcon: ({ color }) => <Ionicons name="create" size={24} color={color} /> }} />
      <Tabs.Screen name="assignments" options={{ title: 'Assignments', tabBarIcon: ({ color }) => <Ionicons name="document" size={24} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ color }) => <Ionicons name="ellipsis-horizontal" size={24} color={color} /> }} />
    </Tabs>
  );
}
```

## Day 8 - Teacher Attendance
```typescript
// app/(teacher)/attendance/index.tsx - Class selection
// app/(teacher)/attendance/mark.tsx - Mark attendance
// app/(teacher)/attendance/history.tsx - View history
```

## Day 9 - Assignments (Teacher)
```typescript
// app/(teacher)/assignments/create.tsx
// app/(teacher)/assignments/index.tsx
// app/(teacher)/assignments/submissions.tsx
// app/(teacher)/assignments/grade.tsx
```

## Day 10 - Planner + Diary
```typescript
// app/(teacher)/planner/index.tsx - Calendar view
// app/(teacher)/planner/create.tsx - Create plan
// app/(teacher)/diary/index.tsx - View entries
// app/(teacher)/diary/add.tsx - Add entry
```

---

# WEEK 3-4: STUDENT MODULE

## Day 11-12 - HoD + Student Foundation
```typescript
// HoD screens
// Student layout, dashboard, profile
```

## Day 13-15 - Student Academic
```typescript
// Attendance (view), Timetable, Materials, Assignments
```

## Day 16-18 - Student Exams + Services
```typescript
// Exams, Marks, Results, Library, Bus, Canteen
```

## Day 19-20 - Finish Student
```typescript
// Events, Honors, Feedback, Settings
```

---

# ✅ DAILY CHECKLIST

- [ ] 4-5 screens completed
- [ ] Use stores from Abin
- [ ] Consistent styling
- [ ] Add testIDs for testing
- [ ] Commit with clear messages

---

*Vibe Coder Christo - Ship 4-5 screens daily! 🚀*
