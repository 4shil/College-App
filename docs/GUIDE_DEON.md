# 🟣 DEON's VIBE GUIDE
## Role: Student Features + Testing Lead
## Target: 3-4 screens + tests per day

---

## 🎯 YOUR RESPONSIBILITIES

1. **Student Screens** - Attendance, Library, Bus, Feedback, Settings
2. **Teacher Screens** - Coordinator, Mentor views
3. **Admin Screens** - Exam management, Bus, Reports
4. **Testing** - E2E + Component testing for all modules

---

# WEEK 1: AUTH + STUDENT FOUNDATION

## Day 1 - Register + OTP Screens
```typescript
// app/(auth)/register.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { GlassCard, GlassInput, PrimaryButton, AnimatedBackground } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

export default function Register() {
  const { role } = useLocalSearchParams<{ role?: 'student' | 'teacher' }>();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Student specific
    admissionNumber: '',
    // Teacher specific
    employeeId: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthStore();

  const validate = () => {
    const errs = {};
    if (!formData.fullName) errs.fullName = 'Name is required';
    if (!formData.email) errs.email = 'Email is required';
    if (!formData.email.includes('@')) errs.email = 'Invalid email';
    if (formData.password.length < 6) errs.password = 'Min 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        role: role || 'student',
        admission_number: formData.admissionNumber,
        employee_id: formData.employeeId,
      });
      router.push({ pathname: '/verify-otp', params: { email: formData.email } });
    } catch (e: any) {
      setErrors({ general: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <GlassCard>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>{role === 'teacher' ? 'Teacher Registration' : 'Student Registration'}</Text>
          
          <GlassInput label="Full Name" icon="person" value={formData.fullName} onChangeText={(v) => setFormData({ ...formData, fullName: v })} error={errors.fullName} testID="input-fullname" />
          <GlassInput label="Email" icon="mail" keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(v) => setFormData({ ...formData, email: v })} error={errors.email} testID="input-email" />
          <GlassInput label="Phone" icon="call" keyboardType="phone-pad" value={formData.phone} onChangeText={(v) => setFormData({ ...formData, phone: v })} testID="input-phone" />
          <GlassInput label="Password" icon="lock-closed" secureTextEntry value={formData.password} onChangeText={(v) => setFormData({ ...formData, password: v })} error={errors.password} testID="input-password" />
          <GlassInput label="Confirm Password" icon="lock-closed" secureTextEntry value={formData.confirmPassword} onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })} error={errors.confirmPassword} testID="input-confirm-password" />
          
          {role !== 'teacher' && (
            <GlassInput label="Admission Number" icon="card" value={formData.admissionNumber} onChangeText={(v) => setFormData({ ...formData, admissionNumber: v })} testID="input-admission" />
          )}
          {role === 'teacher' && (
            <GlassInput label="Employee ID" icon="card" value={formData.employeeId} onChangeText={(v) => setFormData({ ...formData, employeeId: v })} testID="input-employee" />
          )}
          
          {errors.general && <Text style={styles.error}>{errors.general}</Text>}
          
          <PrimaryButton title="Register" onPress={handleRegister} loading={loading} testID="btn-register" />
          <Text style={styles.link} onPress={() => router.push('/login')}>Already have an account? Login</Text>
        </GlassCard>
      </ScrollView>
    </AnimatedBackground>
  );
}

// app/(auth)/verify-otp.tsx
export default function VerifyOTP() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef([]);
  const { verifyOtp, resendOtp } = useAuthStore();

  useEffect(() => {
    const timer = countdown > 0 && setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      await verifyOtp(email, otp.join(''));
      router.replace('/');
    } catch (e) {
      // show error
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    await resendOtp(email);
    setResending(false);
    setCountdown(60);
  };

  return (
    <AnimatedBackground>
      <GlassCard>
        <Ionicons name="mail-open" size={60} color="#6366F1" style={styles.icon} />
        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
        
        <View style={styles.otpContainer}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={el => inputs.current[i] = el}
              style={styles.otpInput}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              testID={`otp-input-${i}`}
            />
          ))}
        </View>
        
        <PrimaryButton title="Verify" onPress={handleVerify} loading={loading} disabled={otp.some(d => !d)} testID="btn-verify" />
        
        <TouchableOpacity onPress={handleResend} disabled={countdown > 0 || resending}>
          <Text style={styles.resend}>
            {countdown > 0 ? `Resend in ${countdown}s` : resending ? 'Sending...' : 'Resend Code'}
          </Text>
        </TouchableOpacity>
      </GlassCard>
    </AnimatedBackground>
  );
}
```

## Day 2 - Student Layout + Dashboard
```typescript
// app/(student)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function StudentLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: { backgroundColor: '#1A1A2E', borderTopColor: 'rgba(255,255,255,0.1)' },
      tabBarActiveTintColor: '#6366F1',
      headerStyle: { backgroundColor: '#1A1A2E' },
      headerTintColor: '#FFF',
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance', tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={24} color={color} /> }} />
      <Tabs.Screen name="academics" options={{ title: 'Academics', tabBarIcon: ({ color }) => <Ionicons name="school" size={24} color={color} /> }} />
      <Tabs.Screen name="services" options={{ title: 'Services', tabBarIcon: ({ color }) => <Ionicons name="apps" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
    </Tabs>
  );
}

// app/(student)/dashboard.tsx
export default function StudentDashboard() {
  const { user, profile } = useAuthStore();
  const { attendance, todayClasses, assignments, notices } = useStudentDashboardStore();

  useEffect(() => {
    // Fetch dashboard data
  }, []);

  return (
    <ScrollView style={styles.container}>
      <GlassCard>
        <View style={styles.header}>
          <Avatar source={profile?.photo_url} name={profile?.full_name} size={50} />
          <View>
            <Text style={styles.greeting}>Hello, {profile?.full_name?.split(' ')[0]}</Text>
            <Text style={styles.subtitle}>{profile?.course?.name} - Sem {profile?.current_semester}</Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.attendanceCard}>
        <Text style={styles.cardTitle}>Attendance</Text>
        <CircularProgress percentage={attendance?.overall || 0} />
        <Text style={styles.attendanceText}>{attendance?.overall}%</Text>
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Today's Classes</Text>
        {todayClasses.map(cls => (
          <View key={cls.id} style={styles.classItem}>
            <Text style={styles.classTime}>{format(new Date(cls.start_time), 'HH:mm')}</Text>
            <Text style={styles.className}>{cls.subject?.name}</Text>
            <Text style={styles.classTeacher}>{cls.teacher?.profile?.full_name}</Text>
          </View>
        ))}
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Pending Assignments</Text>
        {assignments.filter(a => a.status === 'pending').slice(0, 3).map(a => (
          <View key={a.id} style={styles.assignmentItem}>
            <Text style={styles.assignmentTitle}>{a.title}</Text>
            <Badge variant={isPast(new Date(a.due_date)) ? 'error' : 'warning'}>
              Due {format(new Date(a.due_date), 'MMM d')}
            </Badge>
          </View>
        ))}
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Latest Notices</Text>
        {notices.slice(0, 3).map(n => (
          <TouchableOpacity key={n.id} onPress={() => router.push(`/notices/${n.id}`)}>
            <Text style={styles.noticeTitle}>{n.title}</Text>
            <Text style={styles.noticeDate}>{format(new Date(n.published_at), 'MMM d')}</Text>
          </TouchableOpacity>
        ))}
      </GlassCard>
    </ScrollView>
  );
}
```

## Day 3 - Student Attendance + Profile
```typescript
// app/(student)/attendance/index.tsx
export default function StudentAttendance() {
  const { attendance, monthlyAttendance, fetchAttendance } = useStudentAttendanceStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => { fetchAttendance(selectedMonth); }, [selectedMonth]);

  return (
    <ScrollView>
      <GlassCard>
        <Text style={styles.title}>Overall Attendance</Text>
        <CircularProgress percentage={attendance?.overall || 0} size={120} />
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{attendance?.present || 0}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{attendance?.absent || 0}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{attendance?.late || 0}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard>
        <View style={styles.monthPicker}>
          <TouchableOpacity onPress={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{format(selectedMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setSelectedMonth(addMonths(selectedMonth, 1))}>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        
        <Calendar
          current={format(selectedMonth, 'yyyy-MM-dd')}
          markedDates={monthlyAttendance.reduce((acc, day) => ({
            ...acc,
            [day.date]: { marked: true, dotColor: day.status === 'present' ? '#10B981' : day.status === 'absent' ? '#EF4444' : '#F59E0B' }
          }), {})}
        />
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Subject-wise Attendance</Text>
        {attendance?.bySubject?.map(sub => (
          <View key={sub.subject_id} style={styles.subjectRow}>
            <Text style={styles.subjectName}>{sub.subject_name}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${sub.percentage}%` }]} />
            </View>
            <Text style={styles.percentage}>{sub.percentage}%</Text>
          </View>
        ))}
      </GlassCard>
    </ScrollView>
  );
}

// app/(student)/profile/index.tsx
export default function StudentProfile() {
  const { profile, updateProfile, uploadPhoto } = useStudentProfileStore();
  const [editing, setEditing] = useState(false);

  return (
    <ScrollView>
      <GlassCard style={styles.header}>
        <TouchableOpacity onPress={uploadPhoto}>
          <Avatar source={profile?.photo_url} name={profile?.full_name} size={100} />
          <View style={styles.editIcon}><Ionicons name="camera" size={20} color="#FFF" /></View>
        </TouchableOpacity>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </GlassCard>

      <GlassCard>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <InfoRow label="Admission No" value={profile?.admission_number} />
        <InfoRow label="Date of Birth" value={format(new Date(profile?.dob), 'MMM d, yyyy')} />
        <InfoRow label="Phone" value={profile?.phone} />
        <InfoRow label="Blood Group" value={profile?.blood_group} />
      </GlassCard>

      <GlassCard>
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <InfoRow label="Course" value={profile?.course?.name} />
        <InfoRow label="Department" value={profile?.department?.name} />
        <InfoRow label="Semester" value={profile?.current_semester} />
        <InfoRow label="Section" value={profile?.section} />
        <InfoRow label="Batch" value={`${profile?.batch_start} - ${profile?.batch_end}`} />
      </GlassCard>

      <GlassCard>
        <Text style={styles.sectionTitle}>Guardian Information</Text>
        <InfoRow label="Name" value={profile?.guardian_name} />
        <InfoRow label="Phone" value={profile?.guardian_phone} />
        <InfoRow label="Relation" value={profile?.guardian_relation} />
      </GlassCard>

      <PrimaryButton title="Edit Profile" onPress={() => setEditing(true)} />
    </ScrollView>
  );
}
```

## Day 4 - Library + Bus Screens
```typescript
// app/(student)/services/library.tsx
export default function StudentLibrary() {
  const { borrowedBooks, searchBooks, reserveBook, renewBook } = useStudentLibraryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleSearch = async () => {
    const results = await searchBooks(searchQuery);
    setSearchResults(results);
  };

  return (
    <View style={styles.container}>
      <GlassCard>
        <Text style={styles.cardTitle}>My Books</Text>
        {borrowedBooks.length === 0 ? (
          <Text style={styles.empty}>No books borrowed</Text>
        ) : (
          borrowedBooks.map(book => (
            <View key={book.id} style={styles.bookItem}>
              <View>
                <Text style={styles.bookTitle}>{book.book.title}</Text>
                <Text style={styles.bookAuthor}>{book.book.author}</Text>
                <Badge variant={isPast(new Date(book.due_date)) ? 'error' : 'default'}>
                  Due: {format(new Date(book.due_date), 'MMM d')}
                </Badge>
              </View>
              {!isPast(new Date(book.due_date)) && book.renewals_left > 0 && (
                <PrimaryButton title="Renew" size="small" onPress={() => renewBook(book.id)} />
              )}
            </View>
          ))
        )}
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Search Books</Text>
        <View style={styles.searchRow}>
          <GlassInput placeholder="Search by title, author, ISBN..." value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} />
          <PrimaryButton title="Search" onPress={handleSearch} size="small" />
        </View>
        
        {searchResults.map(book => (
          <View key={book.id} style={styles.bookItem}>
            <View>
              <Text style={styles.bookTitle}>{book.title}</Text>
              <Text style={styles.bookAuthor}>{book.author}</Text>
              <Badge variant={book.available_copies > 0 ? 'success' : 'error'}>
                {book.available_copies > 0 ? `${book.available_copies} available` : 'Not available'}
              </Badge>
            </View>
            {book.available_copies > 0 && (
              <PrimaryButton title="Reserve" size="small" onPress={() => reserveBook(book.id)} />
            )}
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

// app/(student)/services/bus.tsx
export default function StudentBus() {
  const { busPass, routes, applyForPass, trackBus } = useBusStore();
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [busLocation, setBusLocation] = useState(null);

  useEffect(() => {
    if (busPass?.route_id) {
      const unsubscribe = trackBus(busPass.route_id, setBusLocation);
      return () => unsubscribe?.();
    }
  }, [busPass]);

  return (
    <ScrollView>
      {busPass ? (
        <>
          <GlassCard>
            <Text style={styles.cardTitle}>My Bus Pass</Text>
            <View style={styles.passCard}>
              <Text style={styles.passRoute}>{busPass.route.name}</Text>
              <Text style={styles.passStops}>{busPass.route.start_point} → {busPass.route.end_point}</Text>
              <Badge variant={busPass.status === 'active' ? 'success' : 'error'}>{busPass.status}</Badge>
              <Text style={styles.validity}>Valid till: {format(new Date(busPass.valid_till), 'MMM d, yyyy')}</Text>
            </View>
          </GlassCard>

          <GlassCard>
            <Text style={styles.cardTitle}>Track Bus</Text>
            <MapView style={styles.map} initialRegion={{ latitude: 10.0, longitude: 76.0, latitudeDelta: 0.05, longitudeDelta: 0.05 }}>
              {busLocation && <Marker coordinate={busLocation} title="Bus" />}
              {busPass.route.stops.map(stop => <Marker key={stop.id} coordinate={{ latitude: stop.lat, longitude: stop.lng }} title={stop.name} />)}
            </MapView>
            <Text style={styles.eta}>ETA: ~{busLocation?.eta || '--'} mins</Text>
          </GlassCard>

          <GlassCard>
            <Text style={styles.cardTitle}>Route Stops</Text>
            {busPass.route.stops.map((stop, i) => (
              <View key={stop.id} style={styles.stopItem}>
                <View style={[styles.dot, i === 0 && styles.firstDot, i === busPass.route.stops.length - 1 && styles.lastDot]} />
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopTime}>{stop.arrival_time}</Text>
              </View>
            ))}
          </GlassCard>
        </>
      ) : (
        <GlassCard>
          <Text style={styles.cardTitle}>Apply for Bus Pass</Text>
          <Picker selectedValue={selectedRoute} onValueChange={setSelectedRoute}>
            {routes.map(r => <Picker.Item key={r.id} label={r.name} value={r.id} />)}
          </Picker>
          <PrimaryButton title="Apply" onPress={() => applyForPass(selectedRoute)} disabled={!selectedRoute} />
        </GlassCard>
      )}
    </ScrollView>
  );
}
```

## Day 5 - Feedback + Settings
```typescript
// app/(student)/services/feedback.tsx
export default function StudentFeedback() {
  const { activeFeedbacks, submitFeedback, getPendingFeedbacks } = useFeedbackStore();
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  return (
    <ScrollView>
      <GlassCard>
        <Text style={styles.cardTitle}>Active Feedback Forms</Text>
        {activeFeedbacks.map(fb => (
          <TouchableOpacity key={fb.id} style={styles.feedbackItem} onPress={() => setSelectedFeedback(fb)}>
            <Text style={styles.feedbackTitle}>{fb.title}</Text>
            <Text style={styles.feedbackDate}>Deadline: {format(new Date(fb.deadline), 'MMM d')}</Text>
            <Badge variant={fb.submitted ? 'success' : 'warning'}>{fb.submitted ? 'Submitted' : 'Pending'}</Badge>
          </TouchableOpacity>
        ))}
      </GlassCard>

      {selectedFeedback && !selectedFeedback.submitted && (
        <Modal visible={true} onClose={() => setSelectedFeedback(null)} title={selectedFeedback.title}>
          <ScrollView>
            {selectedFeedback.questions.map(q => (
              <View key={q.id} style={styles.question}>
                <Text style={styles.questionText}>{q.question}</Text>
                {q.type === 'rating' && (
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <TouchableOpacity key={n} onPress={() => setRatings({ ...ratings, [q.id]: n })}>
                        <Ionicons name={ratings[q.id] >= n ? 'star' : 'star-outline'} size={30} color="#F59E0B" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {q.type === 'text' && (
                  <GlassInput multiline value={comments[q.id] || ''} onChangeText={(v) => setComments({ ...comments, [q.id]: v })} />
                )}
              </View>
            ))}
            <PrimaryButton title="Submit Feedback" onPress={() => submitFeedback(selectedFeedback.id, { ratings, comments })} />
          </ScrollView>
        </Modal>
      )}
    </ScrollView>
  );
}

// app/(student)/profile/settings.tsx
export default function StudentSettings() {
  const { theme, toggleTheme } = useThemeStore();
  const { notifications, updateNotifications } = useSettingsStore();
  const { signOut } = useAuthStore();

  return (
    <ScrollView>
      <GlassCard>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <SettingRow label="Dark Mode" value={theme === 'dark'} onToggle={toggleTheme} />
      </GlassCard>

      <GlassCard>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingRow label="Push Notifications" value={notifications.push} onToggle={(v) => updateNotifications({ push: v })} />
        <SettingRow label="Email Notifications" value={notifications.email} onToggle={(v) => updateNotifications({ email: v })} />
        <SettingRow label="Assignment Reminders" value={notifications.assignments} onToggle={(v) => updateNotifications({ assignments: v })} />
        <SettingRow label="Exam Reminders" value={notifications.exams} onToggle={(v) => updateNotifications({ exams: v })} />
      </GlassCard>

      <GlassCard>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.settingButton} onPress={() => router.push('/change-password')}>
          <Text style={styles.settingLabel}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </GlassCard>

      <GlassCard>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.settingButton} onPress={() => router.push('/help')}>
          <Text style={styles.settingLabel}>Help & FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton} onPress={() => router.push('/contact')}>
          <Text style={styles.settingLabel}>Contact Support</Text>
        </TouchableOpacity>
      </GlassCard>

      <PrimaryButton title="Logout" variant="outline" onPress={signOut} />
    </ScrollView>
  );
}
```

---

# WEEK 2: TEACHER SCREENS + ADMIN

## Day 6-7 - Coordinator + Mentor
```typescript
// app/(teacher)/coordinator/index.tsx
// app/(teacher)/coordinator/sections.tsx
// app/(teacher)/coordinator/reports.tsx
// app/(teacher)/mentor/index.tsx - Mentee list
// app/(teacher)/mentor/mentee.tsx - Individual mentee view
```

## Day 8-9 - Admin Exams + Bus
```typescript
// app/(admin)/exams/index.tsx - Exam list
// app/(admin)/exams/schedule.tsx - Create/edit schedule
// app/(admin)/exams/rooms.tsx - Room allocation
// app/(admin)/bus/index.tsx - Routes management
// app/(admin)/bus/passes.tsx - Pass approvals
// app/(admin)/bus/tracking.tsx - Fleet tracking
```

## Day 10 - Admin Reports
```typescript
// app/(admin)/reports/index.tsx
// app/(admin)/reports/attendance.tsx
// app/(admin)/reports/exams.tsx
// app/(admin)/reports/fees.tsx
```

---

# WEEK 3-4: TESTING

## Day 11-15 - E2E Setup + Auth Tests
```typescript
// Install Detox
// npm install -D detox @types/detox jest

// detox.config.js
module.exports = {
  testRunner: { args: { $0: 'jest', config: 'e2e/jest.config.js' }, jest: { setupTimeout: 120000 } },
  apps: {
    'android.debug': { type: 'android.apk', build: 'cd android && ./gradlew assembleDebug', binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk' },
    'ios.debug': { type: 'ios.app', build: 'xcodebuild...', binaryPath: '...' },
  },
  devices: {
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_4_API_30' } },
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 14' } },
  },
  configurations: {
    'android.debug': { device: 'emulator', app: 'android.debug' },
    'ios.debug': { device: 'simulator', app: 'ios.debug' },
  },
};

// e2e/auth.test.ts
describe('Authentication', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.text('Welcome Back'))).toBeVisible();
    await expect(element(by.id('input-email'))).toBeVisible();
    await expect(element(by.id('input-password'))).toBeVisible();
  });

  it('should show validation errors for empty fields', async () => {
    await element(by.id('btn-login')).tap();
    await expect(element(by.text('Email is required'))).toBeVisible();
  });

  it('should login successfully with valid credentials', async () => {
    await element(by.id('input-email')).typeText('test@jpmcollege.edu');
    await element(by.id('input-password')).typeText('password123');
    await element(by.id('btn-login')).tap();
    await waitFor(element(by.text('Dashboard'))).toBeVisible().withTimeout(5000);
  });

  it('should show error for invalid credentials', async () => {
    await element(by.id('input-email')).typeText('wrong@email.com');
    await element(by.id('input-password')).typeText('wrongpassword');
    await element(by.id('btn-login')).tap();
    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });

  it('should navigate to register screen', async () => {
    await element(by.text('Create Account')).tap();
    await expect(element(by.text('Register'))).toBeVisible();
  });

  it('should navigate to forgot password', async () => {
    await element(by.text('Forgot Password?')).tap();
    await expect(element(by.text('Reset Password'))).toBeVisible();
  });
});

// e2e/register.test.ts
describe('Registration', () => {
  it('should register new student', async () => {
    await element(by.text('Create Account')).tap();
    await element(by.id('input-fullname')).typeText('Test Student');
    await element(by.id('input-email')).typeText('newstudent@email.com');
    await element(by.id('input-phone')).typeText('9876543210');
    await element(by.id('input-password')).typeText('password123');
    await element(by.id('input-confirm-password')).typeText('password123');
    await element(by.id('input-admission')).typeText('2024001');
    await element(by.id('btn-register')).tap();
    await waitFor(element(by.text('Verify Email'))).toBeVisible().withTimeout(5000);
  });

  it('should show password mismatch error', async () => {
    await element(by.text('Create Account')).tap();
    await element(by.id('input-password')).typeText('password123');
    await element(by.id('input-confirm-password')).typeText('password456');
    await element(by.id('btn-register')).tap();
    await expect(element(by.text('Passwords do not match'))).toBeVisible();
  });
});
```

## Day 16-20 - Student Module Tests
```typescript
// e2e/student/dashboard.test.ts
describe('Student Dashboard', () => {
  beforeAll(async () => {
    await device.launchApp();
    await loginAs('student@test.com', 'password123');
  });

  it('should display student info', async () => {
    await expect(element(by.id('student-name'))).toBeVisible();
    await expect(element(by.id('attendance-percentage'))).toBeVisible();
  });

  it('should show today classes', async () => {
    await expect(element(by.id('today-classes'))).toBeVisible();
  });

  it('should navigate to attendance', async () => {
    await element(by.id('tab-attendance')).tap();
    await expect(element(by.text('Overall Attendance'))).toBeVisible();
  });
});

// e2e/student/attendance.test.ts
describe('Student Attendance', () => {
  it('should display attendance calendar', async () => {
    await element(by.id('tab-attendance')).tap();
    await expect(element(by.id('attendance-calendar'))).toBeVisible();
  });

  it('should navigate between months', async () => {
    await element(by.id('btn-prev-month')).tap();
    // Verify month changed
    await element(by.id('btn-next-month')).tap();
  });

  it('should show subject-wise attendance', async () => {
    await expect(element(by.id('subject-attendance-list'))).toBeVisible();
  });
});

// e2e/student/library.test.ts
describe('Student Library', () => {
  it('should search for books', async () => {
    await element(by.id('tab-services')).tap();
    await element(by.text('Library')).tap();
    await element(by.id('search-input')).typeText('computer');
    await element(by.id('btn-search')).tap();
    await waitFor(element(by.id('search-results'))).toBeVisible().withTimeout(3000);
  });

  it('should reserve available book', async () => {
    // After search
    await element(by.id('btn-reserve-0')).tap();
    await expect(element(by.text('Book reserved successfully'))).toBeVisible();
  });
});

// e2e/student/bus.test.ts
describe('Student Bus', () => {
  it('should display bus pass if exists', async () => {
    await element(by.id('tab-services')).tap();
    await element(by.text('Bus')).tap();
    // Check if pass exists or show apply form
  });

  it('should show route stops', async () => {
    await expect(element(by.id('route-stops'))).toBeVisible();
  });
});
```

## Day 21-25 - Teacher & Admin Tests
```typescript
// e2e/teacher/attendance.test.ts
describe('Teacher Attendance', () => {
  beforeAll(async () => {
    await loginAs('teacher@test.com', 'password123');
  });

  it('should select class and date', async () => {
    await element(by.id('tab-attendance')).tap();
    await element(by.id('class-picker')).tap();
    await element(by.text('CS101 - Section A')).tap();
  });

  it('should mark attendance', async () => {
    await element(by.id('student-row-0')).tap(); // Toggle present/absent
    await element(by.id('btn-submit-attendance')).tap();
    await expect(element(by.text('Attendance saved'))).toBeVisible();
  });
});

// e2e/admin/users.test.ts
describe('Admin Users', () => {
  beforeAll(async () => {
    await loginAs('admin@test.com', 'password123');
  });

  it('should list students', async () => {
    await element(by.id('tab-users')).tap();
    await expect(element(by.id('users-list'))).toBeVisible();
  });

  it('should add new student', async () => {
    await element(by.id('fab-add')).tap();
    // Fill form
    await element(by.id('btn-save')).tap();
    await expect(element(by.text('User created'))).toBeVisible();
  });
});
```

## Day 26-30 - Component Tests
```typescript
// __tests__/components/GlassCard.test.tsx
import { render } from '@testing-library/react-native';
import { GlassCard } from '@/components/ui/GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(<GlassCard><Text>Hello</Text></GlassCard>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('applies custom style', () => {
    const { getByTestId } = render(<GlassCard style={{ padding: 50 }} testID="card"><Text>Test</Text></GlassCard>);
    // Check style applied
  });
});

// __tests__/components/PrimaryButton.test.tsx
describe('PrimaryButton', () => {
  it('shows loading indicator', () => {
    const { getByTestId } = render(<PrimaryButton title="Submit" loading testID="btn" onPress={() => {}} />);
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<PrimaryButton title="Submit" disabled onPress={onPress} testID="btn" />);
    fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});

// __tests__/store/authStore.test.ts
describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('should sign in user', async () => {
    await useAuthStore.getState().signIn('test@email.com', 'password');
    expect(useAuthStore.getState().user).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should sign out user', async () => {
    await useAuthStore.getState().signIn('test@email.com', 'password');
    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
```

---

# ✅ DAILY CHECKLIST

- [ ] 3-4 screens completed
- [ ] Add testIDs to all interactive elements
- [ ] Write tests for completed features
- [ ] Check console for errors
- [ ] Commit with clear messages

---

*Vibe Coder Deon - Test Everything, Trust Nothing! 🧪*
