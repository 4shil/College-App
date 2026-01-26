# 🔧 JPM College App - Technical Documentation

## Complete Technical Architecture & Implementation Guide

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Architecture](#database-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [State Management](#state-management)
7. [Routing & Navigation](#routing--navigation)
8. [UI Components & Theming](#ui-components--theming)
9. [API Layer](#api-layer)
10. [Security Implementation](#security-implementation)
11. [Performance Optimizations](#performance-optimizations)
12. [Build & Deployment](#build--deployment)
13. [Monitoring & Logging](#monitoring--logging)
14. [Development Guide](#development-guide)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │
│  │   iOS App   │  │ Android App │  │   Web App   │                          │
│  │   (Expo)    │  │   (Expo)    │  │   (Expo)    │                          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                          │
│         │                │                │                                  │
│         └────────────────┼────────────────┘                                  │
│                          │                                                   │
│         ┌────────────────▼────────────────┐                                  │
│         │      React Native + Expo        │                                  │
│         │   (Shared Codebase - TypeScript)│                                  │
│         └────────────────┬────────────────┘                                  │
└──────────────────────────┼──────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         SUPABASE                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   Auth       │  │  Database    │  │   Storage    │               │    │
│  │  │  (GoTrue)    │  │ (PostgreSQL) │  │   (S3-like)  │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │ Edge         │  │  Realtime    │  │   RLS        │               │    │
│  │  │ Functions    │  │ (WebSockets) │  │  Policies    │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Action → Component → Hook → Supabase Client → PostgreSQL
     ▲                                                 │
     │                                                 │
     └─────────────── Response ◄───────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React Native** | 0.79.6 | Cross-platform mobile framework |
| **Expo** | 53.0.0 | Development platform & build tools |
| **Expo Router** | 5.1.8 | File-based routing |
| **TypeScript** | 5.9.2 | Type safety |
| **React Native Reanimated** | 3.17.4 | Animations |
| **React Native Gesture Handler** | 2.24.0 | Touch handling |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| **PostgreSQL** | Primary database |
| **GoTrue** | Authentication |
| **PostgREST** | Auto-generated REST API |
| **Realtime** | WebSocket subscriptions |
| **Storage** | File storage (avatars, documents) |
| **Edge Functions** | Serverless functions |

### State Management

| Library | Purpose |
|---------|---------|
| **Zustand** | Global state management (stores) |
| **React Hooks** | Local component state |
| **AsyncStorage** | Persistent local storage |
| **SecureStore** | Encrypted storage for tokens |

---

## Project Structure

```
college-app/
├── app/                          # Expo Router pages (file-based routing)
│   ├── _layout.tsx               # Root layout
│   ├── index.tsx                 # Entry point (redirect)
│   ├── (auth)/                   # Authentication routes
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (student)/                # Student module routes
│   │   ├── _layout.tsx           # Student layout with dock
│   │   ├── dashboard.tsx
│   │   ├── modules.tsx
│   │   ├── profile.tsx
│   │   ├── attendance/
│   │   ├── assignments/
│   │   ├── fees/
│   │   └── ...
│   ├── (teacher)/                # Teacher module routes
│   │   ├── _layout.tsx           # Teacher layout with dock
│   │   ├── dashboard.tsx
│   │   ├── attendance/
│   │   ├── assignments/
│   │   └── ...
│   └── (admin)/                  # Admin module routes
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── users/
│       ├── academic/
│       └── ...
│
├── components/                    # Reusable components
│   ├── ui/                       # UI components
│   │   ├── AnimatedBackground.tsx
│   │   ├── GlassCard.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── LoadingIndicator.tsx
│   │   └── index.ts              # Barrel export
│   ├── HallTicket.tsx
│   ├── Restricted.tsx
│   └── registration/
│
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication hook
│   ├── useRBAC.ts                # Role-based access control
│   ├── useStudentDashboard.ts    # Student data hook
│   └── useTeacherDashboardSummary.ts
│
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Supabase client initialization
│   ├── database.ts               # Database helper functions
│   ├── validation.ts             # Input validation
│   ├── sanitization.ts           # Data sanitization
│   ├── secureStorage.ts          # Encrypted storage
│   ├── routes.ts                 # Route constants
│   ├── rbac.ts                   # RBAC utilities
│   ├── gradeCalculator.ts        # SGPA/CGPA calculations
│   ├── dateUtils.ts              # Date formatting
│   ├── networkUtils.ts           # Network status
│   ├── queryUtils.ts             # Query builders
│   └── themedAlert.ts            # Themed alerts
│
├── store/                        # Zustand stores
│   ├── authStore.ts              # Authentication state
│   ├── themeStore.ts             # Theme preferences
│   └── appSettingsStore.ts       # App settings
│
├── theme/                        # Theme configuration
│   └── themes.ts                 # Color schemes
│
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database types
│
├── database/                     # SQL schema files
│   └── schema.sql                # Core database schema
│
├── supabase/                     # Supabase configuration
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge functions
│   └── seed.sql                  # Seed data
│
├── scripts/                      # Utility scripts
│   ├── seed-full-testing-data.js
│   ├── verify-full-testing-seed.js
│   └── ...
│
├── docs/                         # Documentation
│
├── assets/                       # Static assets (images, fonts)
│
├── android/                      # Android native code
├── ios/                          # iOS native code (generated)
│
├── app.config.js                 # Expo configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── babel.config.js               # Babel configuration
└── metro.config.js               # Metro bundler configuration
```

---

## Database Architecture

### Entity Relationship Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  auth.users  │────▶│   profiles   │────▶│    roles     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                     │
                            │                     │
              ┌─────────────┼─────────────┐      │
              ▼             ▼             ▼      ▼
        ┌──────────┐  ┌──────────┐  ┌──────────────┐
        │ students │  │ teachers │  │  user_roles  │
        └──────────┘  └──────────┘  └──────────────┘
              │             │
              ▼             ▼
        ┌──────────────────────────┐
        │    Academic Structure     │
        │ (departments, courses,    │
        │  sections, semesters)     │
        └──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │    Operational Data       │
        │ (attendance, assignments, │
        │  exams, fees, library)    │
        └──────────────────────────┘
```

### Core Tables (64 Total)

#### User Management
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Extended user info | id, email, full_name, primary_role, status |
| `roles` | Role definitions | name, category, permissions |
| `user_roles` | Role assignments | user_id, role_id, department_id |

#### Academic Structure
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `departments` | College departments | code, name, hod_user_id |
| `academic_years` | Academic years | name, is_current, start_date |
| `years` | Year levels (1-4) | year_number, name |
| `semesters` | Semester terms | semester_number, year_id |
| `sections` | Class sections | name, department_id, year_id |
| `courses` | Subject catalog | code, name, semester_id |

#### People
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `students` | Student records | user_id, registration_number, semester_id |
| `teachers` | Teacher records | user_id, employee_id, designation |
| `teacher_courses` | Teaching assignments | teacher_id, course_id, section_id |
| `mentor_assignments` | Mentor-mentee | mentor_id, student_id |

#### Operational
| Table | Purpose |
|-------|---------|
| `attendance` | Attendance sessions |
| `attendance_records` | Individual attendance |
| `assignments` | Assignment definitions |
| `assignment_submissions` | Student submissions |
| `exams` | Exam schedules |
| `exam_marks` | Internal marks |
| `notices` | Announcements |
| `books` | Library catalog |
| `fee_structures` | Fee definitions |
| `student_fees` | Student fee records |

### Database Types (Enums)

```typescript
// User status
type user_status = 'active' | 'inactive' | 'suspended' | 'graduated' | 'dropout' | 'pending';

// Gender
type gender_type = 'male' | 'female' | 'other';

// Teacher types
type teacher_type = 'full_time' | 'part_time' | 'visiting' | 'guest' | 'lab_assistant';
type teacher_designation = 'professor' | 'associate_professor' | 'assistant_professor' | 'lecturer';

// Course type
type course_type = 'core' | 'elective' | 'open_elective' | 'lab' | 'mandatory' | 'major' | 'minor';
```

### Key SQL Functions

| Function | Purpose |
|----------|---------|
| `is_admin()` | Check if current user is admin |
| `is_teacher()` | Check if current user is teacher |
| `has_permission(permission)` | Check specific permission |
| `can_access_module(module)` | Check module access |
| `get_user_permissions()` | Get all user permissions |
| `get_current_academic_year()` | Get active academic year |

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Supabase   │────▶│  Validate   │
│   Screen    │     │    Auth     │     │ Credentials │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                           ┌───────────────────┴───────────────────┐
                           │                                       │
                           ▼                                       ▼
                    ┌─────────────┐                         ┌─────────────┐
                    │   Success   │                         │   Failure   │
                    │  (JWT Token)│                         │  (Error)    │
                    └──────┬──────┘                         └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Fetch User  │
                    │   Profile   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Redirect to │
                    │  Dashboard  │
                    └─────────────┘
```

### Supabase Client Initialization

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { secureStorage } from './secureStorage';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: secureStorage,      // Encrypted token storage
      autoRefreshToken: true,      // Auto-refresh JWT
      persistSession: true,        // Persist session
      detectSessionInUrl: false,   // Mobile app
    },
  }
);
```

### RBAC Implementation

#### Permission Hierarchy

```
super_admin (Full Access)
    │
    ├── principal
    │
    ├── hod (Department Level)
    │   ├── class_teacher
    │   ├── mentor
    │   └── coordinator
    │
    ├── subject_teacher
    │
    └── student
```

#### RBAC Hook Usage

```typescript
// hooks/useRBAC.ts
export function useRBAC() {
  const { user, profile, roles } = useAuthStore();
  
  const hasPermission = (permission: string): boolean => {
    return roles.some(role => 
      role.permissions[permission] === true
    );
  };
  
  const canAccessModule = (module: string): boolean => {
    const modulePermissions = {
      attendance: ['mark_attendance', 'view_attendance'],
      assignments: ['create_assignment', 'grade_assignment'],
      // ...
    };
    return modulePermissions[module]?.some(hasPermission);
  };
  
  return { hasPermission, canAccessModule, isAdmin, isTeacher };
}
```

### Row Level Security (RLS)

```sql
-- Students can only view their own record
CREATE POLICY "Students can view own record" ON students
    FOR SELECT USING (user_id = auth.uid());

-- Teachers can view their assigned students
CREATE POLICY "Teachers view assigned students" ON students
    FOR SELECT USING (
        section_id IN (
            SELECT section_id FROM teacher_courses
            WHERE teacher_id = (
                SELECT id FROM teachers WHERE user_id = auth.uid()
            )
        )
    );

-- Admins have full access
CREATE POLICY "Admins have full access" ON students
    FOR ALL USING (is_admin());
```

---

## State Management

### Store Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       ZUSTAND STORES                         │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   authStore     │  │   themeStore    │  │ appSettings │  │
│  │                 │  │                 │  │             │  │
│  │ - user          │  │ - isDark        │  │ - language  │  │
│  │ - profile       │  │ - colors        │  │ - notifs    │  │
│  │ - roles         │  │ - preset        │  │ - haptics   │  │
│  │ - session       │  │ - animations    │  │             │  │
│  │                 │  │                 │  │             │  │
│  │ + login()       │  │ + setTheme()    │  │ + update()  │  │
│  │ + logout()      │  │ + toggleDark()  │  │             │  │
│  │ + refresh()     │  │                 │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Auth Store Example

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      roles: [],
      isLoading: true,
      
      setUser: (user) => set({ user }),
      
      login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        set({ user: data.user });
        // Fetch profile and roles...
      },
      
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, roles: [] });
      },
    }),
    {
      name: 'auth-storage',
      storage: AsyncStorage,
    }
  )
);
```

### Theme Store Example

```typescript
// store/themeStore.ts
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      preset: 'default',
      animationsEnabled: true,
      isDark: false,
      colors: defaultColors,
      
      setMode: (mode) => {
        const isDark = mode === 'dark' || 
          (mode === 'system' && systemColorScheme === 'dark');
        set({ mode, isDark, colors: getColors(isDark) });
      },
      
      setPreset: (preset) => {
        set({ preset, colors: presets[preset][get().isDark ? 'dark' : 'light'] });
      },
    }),
    { name: 'theme-storage' }
  )
);
```

---

## Routing & Navigation

### File-Based Routing (Expo Router)

```
app/
├── _layout.tsx           → RootLayout (providers, auth check)
├── index.tsx             → Entry redirect
├── (auth)/
│   ├── _layout.tsx       → AuthLayout (no header)
│   ├── login.tsx         → /login
│   └── register.tsx      → /register
├── (student)/
│   ├── _layout.tsx       → StudentLayout (with dock)
│   ├── dashboard.tsx     → /(student)/dashboard
│   ├── modules.tsx       → /(student)/modules
│   ├── attendance/
│   │   ├── index.tsx     → /(student)/attendance
│   │   └── leave.tsx     → /(student)/attendance/leave
│   └── assignments/
│       ├── index.tsx     → /(student)/assignments
│       └── [id].tsx      → /(student)/assignments/123
```

### Navigation Patterns

```typescript
// Programmatic navigation
import { useRouter } from 'expo-router';

function Component() {
  const router = useRouter();
  
  // Navigate to route
  router.push('/(student)/attendance');
  
  // Navigate with params
  router.push({
    pathname: '/(student)/assignments/[id]',
    params: { id: '123' },
  });
  
  // Go back
  router.back();
  
  // Replace (no back)
  router.replace('/(auth)/login');
}
```

### Route Protection

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const { user, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoading) return;
    
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to appropriate dashboard based on role
      router.replace(getHomePage(user.primary_role));
    }
  }, [user, isLoading]);
  
  return <Stack />;
}
```

---

## UI Components & Theming

### Core UI Components

#### AnimatedBackground
```typescript
// Gradient background with optional animations
<AnimatedBackground>
  {children}
</AnimatedBackground>
```

#### GlassCard
```typescript
// Glassmorphism card with blur effect
<GlassCard style={styles.card}>
  <Text>Content</Text>
</GlassCard>
```

#### PrimaryButton
```typescript
// Themed button with loading state
<PrimaryButton 
  title="Submit" 
  onPress={handleSubmit}
  loading={isSubmitting}
/>
```

### Theme System

#### Color Structure
```typescript
interface ThemeColors {
  // Backgrounds
  background: string;
  cardBackground: string;
  cardBorder: string;
  glassBg: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Accent
  accent: string;
  accentLight: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  
  // Input
  inputBackground: string;
  inputBorder: string;
}
```

#### Theme Presets
| Preset | Description |
|--------|-------------|
| `default` | Blue accent, clean look |
| `violet-bloom` | Purple gradient |
| `ocean` | Teal/cyan tones |
| `sunset` | Orange/warm tones |
| `forest` | Green nature theme |

### Glass Dock Component

```typescript
// Custom animated dock navigation
const GlassDock = ({ items, activeRoute, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Animated.View style={[styles.dock, { width: dockWidth }]}>
      <BlurView intensity={80} style={styles.blur}>
        {items.map((item, index) => (
          <DockItem
            key={item.id}
            item={item}
            isActive={isCurrentRoute(item.route, activeRoute)}
            onPress={() => handleNavigate(item.route)}
          />
        ))}
      </BlurView>
    </Animated.View>
  );
};
```

---

## API Layer

### Supabase Query Patterns

#### Basic Queries
```typescript
// Fetch list
const { data, error } = await supabase
  .from('students')
  .select('*')
  .eq('current_status', 'active')
  .order('full_name');

// Fetch with joins
const { data } = await supabase
  .from('students')
  .select(`
    *,
    profile:profiles(*),
    department:departments(name),
    section:sections(name)
  `)
  .eq('id', studentId)
  .single();
```

#### Insert/Update
```typescript
// Insert
const { data, error } = await supabase
  .from('assignments')
  .insert({
    title,
    description,
    due_date,
    course_id,
  })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('attendance_records')
  .update({ status: 'present' })
  .eq('id', recordId);
```

#### Realtime Subscriptions
```typescript
// Subscribe to changes
const subscription = supabase
  .channel('notices')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notices',
  }, (payload) => {
    setNotices(prev => [payload.new, ...prev]);
  })
  .subscribe();

// Cleanup
return () => {
  subscription.unsubscribe();
};
```

### Custom Hooks for Data

```typescript
// hooks/useStudentDashboard.ts
export function useStudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      
      // Parallel queries for performance
      const [studentRes, attendanceRes, assignmentsRes] = await Promise.all([
        supabase.from('students').select('*').eq('user_id', user.id).single(),
        supabase.from('attendance_records').select('*').eq('student_id', studentId),
        supabase.from('assignments').select('*').eq('is_active', true),
      ]);
      
      setData({
        student: studentRes.data,
        attendancePercentage: calculateAttendance(attendanceRes.data),
        pendingAssignments: assignmentsRes.data.length,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchDashboard(); }, []);
  
  return { data, loading, refresh: fetchDashboard };
}
```

---

## Security Implementation

### Token Storage

```typescript
// lib/secureStorage.ts
import * as SecureStore from 'expo-secure-store';

export const secureStorage = {
  getItem: async (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};
```

### Input Validation

```typescript
// lib/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  return { valid: true };
};
```

### Data Sanitization

```typescript
// lib/sanitization.ts
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '');
};
```

### Security Headers (Edge Functions)

```typescript
// supabase/functions/secure-function/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000',
};
```

---

## Performance Optimizations

### List Optimization

```typescript
// Use FlatList for large lists
<FlatList
  data={students}
  renderItem={({ item }) => <StudentCard student={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
/>
```

### Image Optimization

```typescript
// Lazy load images
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  placeholder={require('./placeholder.png')}
  transition={200}
/>
```

### Query Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_timetable_teacher_day ON timetable_entries(teacher_id, day_of_week);
```

### Caching

```typescript
// Simple memory cache
const cache = new Map();

export async function getCachedData(key: string, fetcher: () => Promise<any>, ttl = 60000) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

## Build & Deployment

### Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

### Environment Variables

```bash
# .env (development)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx

# Never expose in client:
# SUPABASE_SERVICE_ROLE_KEY (use only in Edge Functions)
```

### Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### EAS Configuration

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

---

## Monitoring & Logging

### Error Logging

```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error?: Error, context?: object) => {
    console.error(`[ERROR] ${message}`, error, context);
    // Send to monitoring service (Sentry, etc.)
  },
  
  warn: (message: string, context?: object) => {
    console.warn(`[WARN] ${message}`, context);
  },
  
  info: (message: string, context?: object) => {
    if (__DEV__) {
      console.log(`[INFO] ${message}`, context);
    }
  },
};
```

### Performance Monitoring

```typescript
// Track screen load times
const trackScreenLoad = (screenName: string, loadTime: number) => {
  logger.info(`Screen loaded: ${screenName}`, { loadTime });
  // Send to analytics
};
```

### Audit Logging (Database)

```sql
-- Automatic audit trail
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Development Guide

### Code Style

```typescript
// Use TypeScript strict mode
// Prefer async/await over .then()
// Use meaningful variable names
// Comment complex logic

// Good
const fetchStudentAttendance = async (studentId: string): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('student_id', studentId);
    
  if (error) throw error;
  return data || [];
};

// Bad
const getData = async (id) => {
  return supabase.from('attendance_records').select('*').eq('student_id', id).then(r => r.data);
};
```

### Testing

```bash
# Type checking
npm run typecheck

# Run seed data
npm run seed:full

# Verify seed
npm run seed:verify
```

### Common Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Run on web |
| `npm run typecheck` | TypeScript validation |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Metro bundler error | Clear cache: `npx expo start -c` |
| Supabase connection failed | Check env variables |
| Type errors | Run `npm run typecheck` |
| Build failed | Check EAS logs |

---

## Appendix

### A. Key Libraries Reference

| Package | Documentation |
|---------|---------------|
| Expo Router | https://docs.expo.dev/router/ |
| Supabase JS | https://supabase.com/docs/reference/javascript |
| React Native Reanimated | https://docs.swmansion.com/react-native-reanimated/ |
| Zustand | https://zustand-demo.pmnd.rs/ |

### B. API Rate Limits (Supabase)

| Tier | Requests/sec | Realtime connections |
|------|-------------|---------------------|
| Free | 100 | 200 |
| Pro | 1000 | 500 |

### C. Support Resources

- Supabase Discord: https://discord.supabase.com
- Expo Discord: https://chat.expo.dev
- React Native Docs: https://reactnative.dev

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: Development Team*
