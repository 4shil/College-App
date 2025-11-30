# 🟢 CHRISTO's DEVELOPMENT GUIDE
## Role: Team Member / UI & Student Module

---

## 🎯 YOUR RESPONSIBILITIES

1. **UI Component Library** - All reusable components
2. **Student Module Screens** - Profile, Materials, Exams, Canteen, Events, Honors
3. **Teacher Module Screens** - Planner, Mentor, Materials
4. **Admin Screens** - Academic Management, Library Management
5. **Design System** - Consistent glassmorphic theme

---

## 📅 YOUR TIMELINE

### PHASE 2 (Week 3-4): Core UI Components

**Build these in `components/ui/`:**

#### GlassCard.tsx (Enhanced)
```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/themeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'low' | 'medium' | 'high';
  borderGlow?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const intensityValues = { low: 20, medium: 40, high: 60 };

const colorMap = {
  primary: ['rgba(99, 102, 241, 0.3)', 'rgba(139, 92, 246, 0.2)'],
  success: ['rgba(34, 197, 94, 0.3)', 'rgba(16, 185, 129, 0.2)'],
  warning: ['rgba(245, 158, 11, 0.3)', 'rgba(251, 191, 36, 0.2)'],
  error: ['rgba(239, 68, 68, 0.3)', 'rgba(248, 113, 113, 0.2)'],
  info: ['rgba(59, 130, 246, 0.3)', 'rgba(96, 165, 250, 0.2)'],
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 'medium',
  borderGlow = false,
  color,
}) => {
  const { isDark } = useThemeStore();

  return (
    <View style={[styles.container, borderGlow && styles.glow, style]}>
      <BlurView
        intensity={intensityValues[intensity]}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {color && (
        <LinearGradient
          colors={colorMap[color] as [string, string]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    padding: 16,
  },
});
```

#### GlassInput.tsx
```typescript
import React, { useState } from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  StyleSheet, 
  TextInputProps,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '@/store/themeStore';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}) => {
  const { isDark } = useThemeStore();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, isDark && styles.labelDark]}>
          {label}
        </Text>
      )}
      <View 
        style={[
          styles.container, 
          isFocused && styles.focused,
          error && styles.error
        ]}
      >
        <BlurView
          intensity={30}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isDark ? '#9CA3AF' : '#6B7280'}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            isDark && styles.inputDark,
            icon && styles.inputWithIcon,
            style,
          ]}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  labelDark: { color: '#D1D5DB' },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  focused: {
    borderColor: '#6366F1',
  },
  error: {
    borderColor: '#EF4444',
  },
  icon: { marginLeft: 12 },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  inputDark: { color: '#F9FAFB' },
  inputWithIcon: { paddingLeft: 8 },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
});
```

#### PrimaryButton.tsx
```typescript
import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const gradients = {
  primary: ['#6366F1', '#8B5CF6'],
  secondary: ['#3B82F6', '#06B6D4'],
  outline: ['transparent', 'transparent'],
  danger: ['#EF4444', '#DC2626'],
};

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 16 },
    medium: { paddingVertical: 14, paddingHorizontal: 24 },
    large: { paddingVertical: 18, paddingHorizontal: 32 },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={gradients[variant] as [string, string]}
        style={[styles.gradient, sizeStyles[size]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text 
            style={[
              styles.text, 
              variant === 'outline' && styles.outlineText
            ]}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabled: { opacity: 0.5 },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: '#6366F1',
  },
});
```

#### More Components to Build
```typescript
// components/ui/Badge.tsx
// components/ui/Avatar.tsx
// components/ui/EmptyState.tsx
// components/ui/LoadingSpinner.tsx
// components/ui/BottomSheet.tsx
// components/ui/Modal.tsx
// components/ui/Tabs.tsx
// components/ui/SearchBar.tsx
// components/ui/ListItem.tsx
// components/ui/DatePicker.tsx
// components/ui/ProgressBar.tsx
// components/ui/FAB.tsx (Floating Action Button)
```

---

### PHASE 3 (Week 5-6): Admin Academic Screens

#### Academic Management Screen
**Create `app/(admin)/academic/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GlassCard, PrimaryButton } from '@/components/ui';

const academicSections = [
  { title: 'Departments', route: '/academic/departments', icon: 'business' },
  { title: 'Courses', route: '/academic/courses', icon: 'school' },
  { title: 'Subjects', route: '/academic/subjects', icon: 'book' },
  { title: 'Semesters', route: '/academic/semesters', icon: 'calendar' },
  { title: 'Timetable', route: '/academic/timetable', icon: 'time' },
  { title: 'Academic Calendar', route: '/academic/calendar', icon: 'calendar-outline' },
];

export default function AcademicManagement() {
  return (
    <ScrollView style={styles.container}>
      {academicSections.map((section) => (
        <GlassCard key={section.route} style={styles.card}>
          <PrimaryButton
            title={section.title}
            onPress={() => router.push(section.route as any)}
            variant="outline"
          />
        </GlassCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 12 },
});
```

#### Departments CRUD
**Create `app/(admin)/academic/departments.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation } from 'urql';
import { GlassCard, GlassInput, PrimaryButton, Modal } from '@/components/ui';

const GET_DEPARTMENTS = /* GraphQL */ `
  query GetDepartments {
    departments(order_by: { name: asc }) {
      id
      name
      short_name
      hod {
        full_name
      }
      courses_aggregate {
        aggregate { count }
      }
    }
  }
`;

const CREATE_DEPARTMENT = /* GraphQL */ `
  mutation CreateDepartment($name: String!, $shortName: String!, $hodId: uuid) {
    insert_departments_one(object: { 
      name: $name, 
      short_name: $shortName, 
      hod_id: $hodId 
    }) {
      id
    }
  }
`;

export default function DepartmentsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', shortName: '' });
  
  const [{ data, fetching }, refetch] = useQuery({ query: GET_DEPARTMENTS });
  const [, createDept] = useMutation(CREATE_DEPARTMENT);

  const handleCreate = async () => {
    const result = await createDept({
      name: formData.name,
      shortName: formData.shortName,
    });
    
    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else {
      setShowModal(false);
      setFormData({ name: '', shortName: '' });
      refetch();
    }
  };

  return (
    <View style={styles.container}>
      <PrimaryButton 
        title="Add Department" 
        onPress={() => setShowModal(true)} 
      />
      
      <FlatList
        data={data?.departments || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            {/* Department details */}
          </GlassCard>
        )}
      />

      {/* Create Modal */}
      <Modal visible={showModal} onClose={() => setShowModal(false)}>
        <GlassInput
          label="Department Name"
          value={formData.name}
          onChangeText={(name) => setFormData((f) => ({ ...f, name }))}
        />
        <GlassInput
          label="Short Name"
          value={formData.shortName}
          onChangeText={(shortName) => setFormData((f) => ({ ...f, shortName }))}
        />
        <PrimaryButton title="Create" onPress={handleCreate} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginTop: 12, padding: 16 },
});
```

#### Similar screens to build:
- `courses.tsx` - Course management
- `subjects.tsx` - Subject management  
- `timetable.tsx` - Timetable builder
- `calendar.tsx` - Academic calendar

---

### PHASE 4 (Week 7-8): Library Admin

**Create `app/(admin)/library/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { GlassCard, PrimaryButton } from '@/components/ui';

export default function LibraryAdmin() {
  return (
    <ScrollView style={styles.container}>
      <GlassCard style={styles.section}>
        {/* Add Book */}
        <PrimaryButton 
          title="Add Book" 
          onPress={() => router.push('/library/add-book')} 
        />
      </GlassCard>

      <GlassCard style={styles.section}>
        {/* Issue/Return */}
        <PrimaryButton 
          title="Issue Book" 
          onPress={() => router.push('/library/issue')} 
        />
        <PrimaryButton 
          title="Return Book" 
          onPress={() => router.push('/library/return')} 
          variant="secondary"
        />
      </GlassCard>

      <GlassCard style={styles.section}>
        {/* Overdue Books */}
        <PrimaryButton 
          title="View Overdue" 
          onPress={() => router.push('/library/overdue')} 
          variant="danger"
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

---

### PHASE 5-6 (Week 9-12): Teacher Screens

#### Teacher Planner
**Create `app/(teacher)/planner/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useMutation, useQuery } from 'urql';
import { GlassCard, GlassInput, PrimaryButton, DatePicker } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const CREATE_LESSON_PLAN = /* GraphQL */ `
  mutation CreateLessonPlan($object: lesson_plans_insert_input!) {
    insert_lesson_plans_one(object: $object) {
      id
    }
  }
`;

export default function TeacherPlanner() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    subjectId: '',
    topic: '',
    objectives: '',
    content: '',
    plannedDate: new Date(),
  });

  const [, createPlan] = useMutation(CREATE_LESSON_PLAN);

  const handleSubmit = async () => {
    await createPlan({
      object: {
        teacher_id: user?.teacherId,
        subject_id: formData.subjectId,
        topic: formData.topic,
        objectives: formData.objectives,
        content_outline: formData.content,
        planned_date: formData.plannedDate.toISOString().split('T')[0],
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <GlassCard>
        {/* Subject selector dropdown */}
        <GlassInput
          label="Topic"
          value={formData.topic}
          onChangeText={(topic) => setFormData((f) => ({ ...f, topic }))}
        />
        <GlassInput
          label="Learning Objectives"
          value={formData.objectives}
          onChangeText={(objectives) => setFormData((f) => ({ ...f, objectives }))}
          multiline
          numberOfLines={3}
        />
        <GlassInput
          label="Content Outline"
          value={formData.content}
          onChangeText={(content) => setFormData((f) => ({ ...f, content }))}
          multiline
          numberOfLines={5}
        />
        <DatePicker
          label="Planned Date"
          value={formData.plannedDate}
          onChange={(date) => setFormData((f) => ({ ...f, plannedDate: date }))}
        />
        <PrimaryButton title="Create Plan" onPress={handleSubmit} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
```

#### Teaching Materials Upload
**Create `app/(teacher)/materials/upload.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from 'urql';
import { supabase } from '@/lib/supabase';
import { GlassCard, GlassInput, PrimaryButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const CREATE_MATERIAL = /* GraphQL */ `
  mutation CreateMaterial($object: teaching_materials_insert_input!) {
    insert_teaching_materials_one(object: $object) {
      id
    }
  }
`;

export default function UploadMaterial() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    file: null as any,
  });
  const [uploading, setUploading] = useState(false);

  const [, createMaterial] = useMutation(CREATE_MATERIAL);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'application/vnd.ms-powerpoint'],
    });
    
    if (!result.canceled) {
      setFormData((f) => ({ ...f, file: result.assets[0] }));
    }
  };

  const handleUpload = async () => {
    if (!formData.file) {
      Alert.alert('Error', 'Please select a file');
      return;
    }

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${formData.file.name}`;
      const { data, error } = await supabase.storage
        .from('teaching-materials')
        .upload(fileName, formData.file.file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('teaching-materials')
        .getPublicUrl(fileName);

      // Create database record
      await createMaterial({
        object: {
          teacher_id: user?.teacherId,
          subject_id: formData.subjectId,
          title: formData.title,
          description: formData.description,
          file_url: urlData.publicUrl,
          file_type: formData.file.mimeType,
        },
      });

      Alert.alert('Success', 'Material uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard>
        {/* Subject selector */}
        <GlassInput
          label="Title"
          value={formData.title}
          onChangeText={(title) => setFormData((f) => ({ ...f, title }))}
        />
        <GlassInput
          label="Description"
          value={formData.description}
          onChangeText={(description) => setFormData((f) => ({ ...f, description }))}
          multiline
        />
        <PrimaryButton
          title={formData.file ? formData.file.name : 'Select File'}
          onPress={pickDocument}
          variant="secondary"
        />
        <PrimaryButton
          title="Upload"
          onPress={handleUpload}
          loading={uploading}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
```

---

### PHASE 7-8 (Week 13-16): Student Module Screens

#### Student Profile
**Create `app/(student)/profile/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'urql';
import { supabase } from '@/lib/supabase';
import { GlassCard, GlassInput, PrimaryButton, Avatar } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const UPDATE_PROFILE_PHOTO = /* GraphQL */ `
  mutation UpdateProfilePhoto($id: uuid!, $photoUrl: String!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: { photo_url: $photoUrl }) {
      id
      photo_url
    }
  }
`;

export default function StudentProfile() {
  const { user, profile } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [, updatePhoto] = useMutation(UPDATE_PROFILE_PHOTO);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera roll access is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    try {
      const fileName = `${user?.id}_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);

      const { error } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, formData);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      await updatePhoto({
        id: user?.id,
        photoUrl: urlData.publicUrl,
      });

      Alert.alert('Success', 'Profile photo updated');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <GlassCard style={styles.photoSection}>
        <Avatar
          size={120}
          source={profile?.photo_url}
          name={profile?.full_name}
        />
        <PrimaryButton
          title={uploading ? 'Uploading...' : 'Change Photo'}
          onPress={pickImage}
          loading={uploading}
          size="small"
        />
      </GlassCard>

      <GlassCard style={styles.infoSection}>
        <InfoRow label="Name" value={profile?.full_name} />
        <InfoRow label="Email" value={profile?.email} />
        <InfoRow label="Enrollment" value={profile?.enrollment_number} />
        <InfoRow label="Course" value={profile?.course?.name} />
        <InfoRow label="Semester" value={`Semester ${profile?.current_semester}`} />
        <InfoRow label="Division" value={profile?.division} />
      </GlassCard>
    </ScrollView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  photoSection: { alignItems: 'center', marginBottom: 16, gap: 16 },
  infoSection: { gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: '#6B7280', fontSize: 14 },
  value: { color: '#1F2937', fontSize: 14, fontWeight: '500' },
});
```

#### Study Materials List
**Create `app/(student)/materials/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useQuery } from 'urql';
import { router } from 'expo-router';
import { GlassCard, SearchBar, Tabs, EmptyState } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const GET_MATERIALS = /* GraphQL */ `
  query GetMaterials($courseId: uuid!, $semester: Int!) {
    teaching_materials(
      where: {
        subject: {
          course_subjects: {
            course_id: { _eq: $courseId }
            semester_number: { _eq: $semester }
          }
        }
        is_published: { _eq: true }
      }
      order_by: { created_at: desc }
    ) {
      id
      title
      description
      file_url
      file_type
      created_at
      subject {
        name
        code
      }
      teacher {
        profile {
          full_name
        }
      }
    }
  }
`;

export default function MaterialsList() {
  const { profile } = useAuthStore();
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  const [{ data, fetching }] = useQuery({
    query: GET_MATERIALS,
    variables: {
      courseId: profile?.course?.id,
      semester: profile?.current_semester,
    },
  });

  const materials = data?.teaching_materials || [];
  const filtered = materials.filter((m: any) => 
    m.title.toLowerCase().includes(search.toLowerCase()) &&
    (selectedSubject === 'all' || m.subject.id === selectedSubject)
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search materials..."
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subject}>{item.subject.code}</Text>
            <Text style={styles.teacher}>by {item.teacher.profile.full_name}</Text>
            <PrimaryButton
              title="View"
              size="small"
              onPress={() => router.push(`/materials/${item.id}`)}
            />
          </GlassCard>
        )}
        ListEmptyComponent={
          <EmptyState 
            icon="document-outline" 
            title="No Materials" 
            message="No study materials available yet"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 12, padding: 16 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  subject: { color: '#6366F1', fontSize: 12, marginBottom: 2 },
  teacher: { color: '#6B7280', fontSize: 12, marginBottom: 8 },
});
```

#### Exam Schedule View
**Create `app/(student)/exams/index.tsx`:**
```typescript
import React from 'react';
import { View, SectionList, StyleSheet, Text } from 'react-native';
import { useQuery } from 'urql';
import { GlassCard, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

const GET_EXAM_SCHEDULE = /* GraphQL */ `
  query GetExamSchedule($courseId: uuid!, $semester: Int!) {
    exam_schedule(
      where: {
        exam: {
          course_id: { _eq: $courseId }
          semester_number: { _eq: $semester }
          status: { _eq: "published" }
        }
      }
      order_by: { exam_date: asc }
    ) {
      id
      exam_date
      start_time
      end_time
      room
      exam {
        name
        type
      }
      subject {
        name
        code
      }
    }
  }
`;

export default function ExamSchedule() {
  const { profile } = useAuthStore();

  const [{ data }] = useQuery({
    query: GET_EXAM_SCHEDULE,
    variables: {
      courseId: profile?.course?.id,
      semester: profile?.current_semester,
    },
  });

  // Group by exam name
  const grouped = (data?.exam_schedule || []).reduce((acc: any, item: any) => {
    const examName = item.exam.name;
    if (!acc[examName]) acc[examName] = [];
    acc[examName].push(item);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([title, data]) => ({
    title,
    data: data as any[],
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.subject}>{item.subject.name}</Text>
            <Badge>{item.subject.code}</Badge>
          </View>
          <Text style={styles.date}>
            {format(new Date(item.exam_date), 'EEE, MMM d, yyyy')}
          </Text>
          <Text style={styles.time}>
            {item.start_time} - {item.end_time} | Room: {item.room || 'TBA'}
          </Text>
        </GlassCard>
      )}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionHeader: { 
    backgroundColor: 'transparent', 
    paddingVertical: 8,
    marginTop: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#6366F1' },
  card: { marginBottom: 12, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  subject: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 14, color: '#374151' },
  time: { fontSize: 13, color: '#6B7280' },
});
```

#### Canteen Token System
**Create `app/(student)/canteen/index.tsx`:**
```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation } from 'urql';
import { GlassCard, PrimaryButton, Badge, Tabs } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const GET_MENU_ITEMS = /* GraphQL */ `
  query GetMenuItems($day: String!) {
    canteen_menu_items(
      where: { 
        is_available: { _eq: true }
        available_days: { _has_key: $day }
      }
    ) {
      id
      name
      category
      price
      available_quantity
    }
  }
`;

const GET_MY_TOKENS = /* GraphQL */ `
  query GetMyTokens($studentId: uuid!) {
    canteen_tokens(
      where: { student_id: { _eq: $studentId } }
      order_by: { created_at: desc }
      limit: 10
    ) {
      id
      token_number
      status
      total_amount
      created_at
      token_items {
        quantity
        menu_item {
          name
          price
        }
      }
    }
  }
`;

const CREATE_TOKEN = /* GraphQL */ `
  mutation CreateToken($object: canteen_tokens_insert_input!) {
    insert_canteen_tokens_one(object: $object) {
      id
      token_number
    }
  }
`;

export default function CanteenScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('order');
  const [cart, setCart] = useState<Record<string, number>>({});
  
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  const [{ data: menuData }] = useQuery({
    query: GET_MENU_ITEMS,
    variables: { day: today },
  });

  const [{ data: tokensData }, refetchTokens] = useQuery({
    query: GET_MY_TOKENS,
    variables: { studentId: profile?.studentId },
  });

  const [, createToken] = useMutation(CREATE_TOKEN);

  const addToCart = (itemId: string) => {
    setCart((c) => ({ ...c, [itemId]: (c[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: string) => {
    setCart((c) => {
      const newCart = { ...c };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [itemId, qty]) => {
      const item = menuData?.canteen_menu_items.find((i: any) => i.id === itemId);
      return total + (item?.price || 0) * qty;
    }, 0);
  };

  const handlePlaceOrder = async () => {
    const items = Object.entries(cart).map(([itemId, qty]) => ({
      menu_item_id: itemId,
      quantity: qty,
    }));

    const result = await createToken({
      object: {
        student_id: profile?.studentId,
        total_amount: calculateTotal(),
        token_items: { data: items },
      },
    });

    if (result.data) {
      Alert.alert(
        'Token Created!',
        `Your token number is: ${result.data.insert_canteen_tokens_one.token_number}`,
        [{ text: 'OK', onPress: () => {
          setCart({});
          refetchTokens();
        }}]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Tabs
        tabs={[
          { key: 'order', label: 'Order' },
          { key: 'tokens', label: 'My Tokens' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'order' ? (
        <ScrollView>
          {/* Menu Items */}
          {menuData?.canteen_menu_items.map((item: any) => (
            <GlassCard key={item.id} style={styles.menuItem}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Badge>{item.category}</Badge>
                </View>
                <View style={styles.itemActions}>
                  <Text style={styles.price}>₹{item.price}</Text>
                  {cart[item.id] ? (
                    <View style={styles.qtyControl}>
                      <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                        <Text>-</Text>
                      </TouchableOpacity>
                      <Text>{cart[item.id]}</Text>
                      <TouchableOpacity onPress={() => addToCart(item.id)}>
                        <Text>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <PrimaryButton
                      title="Add"
                      size="small"
                      onPress={() => addToCart(item.id)}
                    />
                  )}
                </View>
              </View>
            </GlassCard>
          ))}

          {/* Cart Summary */}
          {Object.keys(cart).length > 0 && (
            <GlassCard style={styles.cartSummary} color="primary">
              <Text style={styles.totalLabel}>Total: ₹{calculateTotal()}</Text>
              <PrimaryButton title="Place Order" onPress={handlePlaceOrder} />
            </GlassCard>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={tokensData?.canteen_tokens || []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GlassCard style={styles.tokenCard}>
              <View style={styles.tokenHeader}>
                <Text style={styles.tokenNumber}>#{item.token_number}</Text>
                <Badge 
                  variant={
                    item.status === 'ready' ? 'success' : 
                    item.status === 'preparing' ? 'warning' : 'default'
                  }
                >
                  {item.status}
                </Badge>
              </View>
              {item.token_items.map((ti: any, idx: number) => (
                <Text key={idx}>
                  {ti.quantity}x {ti.menu_item.name}
                </Text>
              ))}
              <Text style={styles.tokenTotal}>₹{item.total_amount}</Text>
            </GlassCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  menuItem: { marginBottom: 12, padding: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemActions: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '700', color: '#6366F1', marginBottom: 8 },
  qtyControl: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  cartSummary: { marginTop: 16, padding: 20 },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 12 },
  tokenCard: { marginBottom: 12, padding: 16 },
  tokenHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tokenNumber: { fontSize: 20, fontWeight: '700' },
  tokenTotal: { marginTop: 8, fontSize: 16, fontWeight: '600' },
});
```

#### Events Screen
**Create `app/(student)/events/index.tsx`:**
```typescript
import React from 'react';
import { View, FlatList, StyleSheet, Linking, Text } from 'react-native';
import { useQuery } from 'urql';
import { GlassCard, PrimaryButton, Badge, EmptyState } from '@/components/ui';
import { format } from 'date-fns';

const GET_EVENTS = /* GraphQL */ `
  query GetEvents {
    events(
      where: { 
        status: { _eq: "published" }
        end_date: { _gte: "now()" }
      }
      order_by: { start_date: asc }
    ) {
      id
      title
      description
      event_type
      start_date
      end_date
      venue
      external_link
      organizer
    }
  }
`;

export default function EventsScreen() {
  const [{ data, fetching }] = useQuery({ query: GET_EVENTS });

  const openExternalLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.events || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GlassCard style={styles.eventCard}>
            <View style={styles.header}>
              <Badge variant={item.event_type === 'cultural' ? 'primary' : 'secondary'}>
                {item.event_type}
              </Badge>
              <Text style={styles.date}>
                {format(new Date(item.start_date), 'MMM d, yyyy')}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.meta}>
              <Text style={styles.venue}>📍 {item.venue}</Text>
              <Text style={styles.organizer}>by {item.organizer}</Text>
            </View>
            {item.external_link && (
              <PrimaryButton
                title="Learn More / Register"
                onPress={() => openExternalLink(item.external_link)}
                variant="outline"
                size="small"
              />
            )}
          </GlassCard>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="No Upcoming Events"
            message="Check back later for events"
          />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  eventCard: { marginBottom: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  date: { fontSize: 12, color: '#6B7280' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 14, color: '#4B5563', marginBottom: 12, lineHeight: 20 },
  meta: { marginBottom: 12 },
  venue: { fontSize: 13, color: '#6B7280' },
  organizer: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
});
```

#### Honors/Minor Programs
**Create `app/(student)/honors/index.tsx`:**
```typescript
import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useQuery, useMutation } from 'urql';
import { GlassCard, PrimaryButton, Badge, Tabs } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const GET_AVAILABLE_PROGRAMS = /* GraphQL */ `
  query GetPrograms($courseId: uuid!) {
    honors_minor_programs(
      where: { 
        status: { _eq: "active" }
        is_accepting_applications: { _eq: true }
      }
    ) {
      id
      title
      type
      description
      department {
        name
      }
      eligibility_criteria
      total_seats
      filled_seats
    }
  }
`;

const GET_MY_ENROLLMENTS = /* GraphQL */ `
  query GetMyEnrollments($studentId: uuid!) {
    honors_minor_enrollments(
      where: { student_id: { _eq: $studentId } }
    ) {
      id
      status
      enrolled_at
      program {
        title
        type
      }
    }
  }
`;

const APPLY_PROGRAM = /* GraphQL */ `
  mutation ApplyProgram($object: honors_minor_enrollments_insert_input!) {
    insert_honors_minor_enrollments_one(object: $object) {
      id
    }
  }
`;

export default function HonorsMinorScreen() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('available');

  const [{ data: programsData }] = useQuery({ 
    query: GET_AVAILABLE_PROGRAMS,
    variables: { courseId: profile?.course?.id },
  });

  const [{ data: enrollmentsData }, refetchEnrollments] = useQuery({
    query: GET_MY_ENROLLMENTS,
    variables: { studentId: profile?.studentId },
  });

  const [, applyProgram] = useMutation(APPLY_PROGRAM);

  const handleApply = async (programId: string) => {
    const result = await applyProgram({
      object: {
        student_id: profile?.studentId,
        program_id: programId,
      },
    });

    if (result.data) {
      Alert.alert('Success', 'Application submitted!');
      refetchEnrollments();
    }
  };

  return (
    <View style={styles.container}>
      <Tabs
        tabs={[
          { key: 'available', label: 'Available Programs' },
          { key: 'enrolled', label: 'My Enrollments' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <ScrollView>
        {activeTab === 'available' ? (
          programsData?.honors_minor_programs.map((program: any) => (
            <GlassCard key={program.id} style={styles.programCard}>
              <View style={styles.header}>
                <Badge variant={program.type === 'honors' ? 'primary' : 'secondary'}>
                  {program.type}
                </Badge>
                <Text style={styles.seats}>
                  {program.filled_seats}/{program.total_seats} seats
                </Text>
              </View>
              <Text style={styles.title}>{program.title}</Text>
              <Text style={styles.department}>{program.department.name}</Text>
              <Text style={styles.description}>{program.description}</Text>
              <Text style={styles.eligibility}>
                Eligibility: {program.eligibility_criteria}
              </Text>
              <PrimaryButton
                title="Apply"
                onPress={() => handleApply(program.id)}
                disabled={program.filled_seats >= program.total_seats}
              />
            </GlassCard>
          ))
        ) : (
          enrollmentsData?.honors_minor_enrollments.map((enrollment: any) => (
            <GlassCard key={enrollment.id} style={styles.enrollmentCard}>
              <Badge variant={enrollment.status === 'approved' ? 'success' : 'warning'}>
                {enrollment.status}
              </Badge>
              <Text style={styles.title}>{enrollment.program.title}</Text>
              <Text>{enrollment.program.type}</Text>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  programCard: { marginBottom: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  seats: { fontSize: 12, color: '#6B7280' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  department: { fontSize: 13, color: '#6366F1', marginBottom: 8 },
  description: { fontSize: 14, color: '#4B5563', marginBottom: 8 },
  eligibility: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  enrollmentCard: { marginBottom: 12, padding: 16 },
});
```

---

## ✅ YOUR CHECKLIST

### Week 3-4: Core UI Components
- [ ] GlassCard (enhanced with variants)
- [ ] GlassInput (with icons, validation)
- [ ] PrimaryButton (variants, sizes)
- [ ] Avatar
- [ ] Badge
- [ ] EmptyState
- [ ] LoadingSpinner
- [ ] Modal / BottomSheet
- [ ] Tabs
- [ ] SearchBar
- [ ] ListItem
- [ ] DatePicker
- [ ] ProgressBar
- [ ] FAB

### Week 5-6: Admin Academic
- [ ] Academic management index
- [ ] Departments CRUD
- [ ] Courses CRUD
- [ ] Subjects CRUD
- [ ] Timetable builder
- [ ] Academic calendar

### Week 7-8: Admin Library
- [ ] Library dashboard
- [ ] Add/Edit book
- [ ] Issue book screen
- [ ] Return book screen
- [ ] Overdue list

### Week 9-12: Teacher Screens
- [ ] Lesson planner
- [ ] Material upload
- [ ] Material list/management
- [ ] Mentor dashboard
- [ ] Mentee list

### Week 13-16: Student Module
- [ ] Profile with photo upload
- [ ] Study materials list + detail
- [ ] Exam schedule view
- [ ] External marks upload
- [ ] Canteen token system
- [ ] Events list
- [ ] Honors/Minor programs

---

## 🚨 CRITICAL REMINDERS

1. **Follow design system** - Keep glassmorphic theme consistent
2. **Reuse components** - Don't duplicate UI code
3. **Test on both platforms** - iOS & Android
4. **Coordinate with Deon** - Share UI components, avoid overlap
5. **Photo upload** - Use Supabase Storage correctly

---

*Guide for Christo - Last Updated: November 30, 2025*
