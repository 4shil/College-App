import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  short_name: string | null;
  program_level: string | null;
  duration_years: number | null;
  total_semesters: number | null;
  is_degree_program: boolean;
  department_id: string;
}

interface Year {
  id: string;
  year_number: number;
  name: string;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  department_id: string;
  course_id: string;
  year_id: string;
  roll_number: string;
  registration_number: string;
  admission_year: string;
}

type TabType = 'manual' | 'bulk';

export default function CreateStudentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [activeTab, setActiveTab] = useState<TabType>('manual');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [filteredYears, setFilteredYears] = useState<Year[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    department_id: '',
    course_id: '',
    year_id: '',
    roll_number: '',
    registration_number: '',
    admission_year: new Date().getFullYear().toString(),
  });

  // Bulk import state
  const [bulkStudents, setBulkStudents] = useState<any[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filter courses when department changes (only degree programs)
  useEffect(() => {
    if (formData.department_id) {
      const deptCourses = courses.filter(c => c.department_id === formData.department_id && c.is_degree_program);
      setFilteredCourses(deptCourses);
      // Reset course selection if current course is not in filtered list
      if (!deptCourses.find(c => c.id === formData.course_id)) {
        setFormData(prev => ({ ...prev, course_id: '' }));
      }
    } else {
      setFilteredCourses([]);
    }
  }, [formData.department_id, courses]);

  // Filter years when course changes
  useEffect(() => {
    if (formData.course_id) {
      const course = courses.find(c => c.id === formData.course_id);
      if (course && course.duration_years) {
        // Filter years based on course duration
        const courseYears = years.filter(y => y.year_number <= (course.duration_years || 4));
        setFilteredYears(courseYears);
        // Reset year selection if current year exceeds course duration
        const currentYear = years.find(y => y.id === formData.year_id);
        if (currentYear && course.duration_years && currentYear.year_number > course.duration_years) {
          setFormData(prev => ({ ...prev, year_id: '' }));
        }
      }
    } else {
      setFilteredYears(years);
    }
  }, [formData.course_id, courses, years]);

  const fetchInitialData = async () => {
    try {
      const [deptsRes, coursesRes, yearsRes] = await Promise.all([
        supabase.from('departments').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('courses').select('*').eq('is_degree_program', true).eq('is_active', true).order('name'),
        supabase.from('years').select('*').eq('is_active', true).order('year_number'),
      ]);

      if (deptsRes.error) throw deptsRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (yearsRes.error) throw yearsRes.error;

      setDepartments(deptsRes.data || []);
      setCourses(coursesRes.data || []);
      setYears(yearsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load form data');
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.full_name.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }
    if (!formData.department_id) {
      Alert.alert('Validation Error', 'Please select a department');
      return false;
    }
    if (!formData.course_id) {
      Alert.alert('Validation Error', 'Please select a course');
      return false;
    }
    if (!formData.year_id) {
      Alert.alert('Validation Error', 'Please select a year');
      return false;
    }
    return true;
  };

  const handleCreateStudent = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get current academic year
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      // Get semester based on year
      const selectedYear = years.find(y => y.id === formData.year_id);
      const semesterNumber = selectedYear ? (selectedYear.year_number - 1) * 2 + 1 : 1;
      
      const { data: semester } = await supabase
        .from('semesters')
        .select('id')
        .eq('semester_number', semesterNumber)
        .single();

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: 'student',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          primary_role: 'student',
          status: 'active',
        });

      if (profileError) throw profileError;

      // Create student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          department_id: formData.department_id,
          course_id: formData.course_id,
          year_id: formData.year_id,
          semester_id: semester?.id,
          academic_year_id: academicYear?.id,
          roll_number: formData.roll_number || null,
          registration_number: formData.registration_number || `JPM${formData.admission_year}${Date.now().toString().slice(-4)}`,
          admission_year: parseInt(formData.admission_year),
          current_status: 'active',
        });

      if (studentError) throw studentError;

      // Assign student role
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single();

      if (roleData) {
        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role_id: roleData.id,
          department_id: formData.department_id,
          is_active: true,
        });
      }

      Alert.alert('Success', 'Student created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating student:', error);
      Alert.alert('Error', error.message || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file.uri) {
        Alert.alert('Error', 'Could not read the file');
        return;
      }

      // Read and parse CSV
      const response = await fetch(file.uri);
      const csvText = await response.text();
      
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        Alert.alert('Error', 'CSV file must have header row and at least one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['full_name', 'email', 'password'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        Alert.alert('Error', `Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      const students: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const student: any = {};
        headers.forEach((header, index) => {
          student[header] = values[index] || '';
        });
        if (student.full_name && student.email && student.password) {
          students.push(student);
        }
      }

      if (students.length === 0) {
        Alert.alert('Error', 'No valid student records found in CSV');
        return;
      }

      setBulkStudents(students);
      Alert.alert(
        'Confirm Import',
        `Found ${students.length} student(s) to import. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Import', onPress: () => processBulkImport(students) },
        ]
      );
    } catch (error: any) {
      console.error('Error reading CSV:', error);
      Alert.alert('Error', 'Failed to read CSV file');
    }
  };

  const processBulkImport = async (students: any[]) => {
    if (!formData.department_id || !formData.course_id || !formData.year_id) {
      Alert.alert('Error', 'Please select Department, Course, and Year before bulk import');
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ current: 0, total: students.length });

    let successCount = 0;
    let failedStudents: string[] = [];

    // Get academic year and semester
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    const selectedYear = years.find(y => y.id === formData.year_id);
    const semesterNumber = selectedYear ? (selectedYear.year_number - 1) * 2 + 1 : 1;
    
    const { data: semester } = await supabase
      .from('semesters')
      .select('id')
      .eq('semester_number', semesterNumber)
      .single();

    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'student')
      .single();

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      setBulkProgress({ current: i + 1, total: students.length });

      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: student.email,
          password: student.password,
          options: {
            data: {
              full_name: student.full_name,
              role: 'student',
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('User creation failed');

        // Create profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email: student.email,
          full_name: student.full_name,
          phone: student.phone || null,
          primary_role: 'student',
          status: 'active',
        });

        // Create student record
        await supabase.from('students').insert({
          user_id: authData.user.id,
          department_id: formData.department_id,
          course_id: formData.course_id,
          year_id: formData.year_id,
          semester_id: semester?.id,
          academic_year_id: academicYear?.id,
          roll_number: student.roll_number || null,
          registration_number: student.registration_number || `JPM${formData.admission_year}${Date.now().toString().slice(-6)}`,
          admission_year: parseInt(formData.admission_year),
          current_status: 'active',
        });

        // Assign role
        if (roleData) {
          await supabase.from('user_roles').insert({
            user_id: authData.user.id,
            role_id: roleData.id,
            department_id: formData.department_id,
            is_active: true,
          });
        }

        successCount++;
      } catch (error: any) {
        console.error(`Failed to create ${student.email}:`, error);
        failedStudents.push(`${student.full_name} (${student.email}): ${error.message}`);
      }
    }

    setBulkLoading(false);
    setBulkStudents([]);

    if (failedStudents.length > 0) {
      Alert.alert(
        'Import Completed with Errors',
        `Successfully imported: ${successCount}\nFailed: ${failedStudents.length}\n\nFailed students:\n${failedStudents.slice(0, 3).join('\n')}${failedStudents.length > 3 ? `\n...and ${failedStudents.length - 3} more` : ''}`
      );
    } else {
      Alert.alert('Success', `All ${successCount} students imported successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const renderManualForm = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          <FontAwesome5 name="user" size={14} color={colors.primary} /> Personal Info
        </Text>
        
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Full Name *</Text>
          <GlassInput
            placeholder="Enter full name"
            value={formData.full_name}
            onChangeText={(v) => updateFormData('full_name', v)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Email *</Text>
          <GlassInput
            placeholder="student@email.com"
            value={formData.email}
            onChangeText={(v) => updateFormData('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Phone</Text>
          <GlassInput
            placeholder="Phone number"
            value={formData.phone}
            onChangeText={(v) => updateFormData('phone', v)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Password *</Text>
          <GlassInput
            placeholder="Minimum 6 characters"
            value={formData.password}
            onChangeText={(v) => updateFormData('password', v)}
            secureTextEntry
          />
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          <FontAwesome5 name="graduation-cap" size={14} color={colors.primary} /> Academic Info
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Department *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Picker
              selectedValue={formData.department_id}
              onValueChange={(v) => updateFormData('department_id', v)}
              style={{ color: colors.textPrimary }}
            >
              <Picker.Item label="Select Department" value="" />
              {departments.map((dept) => (
                <Picker.Item key={dept.id} label={`${dept.name} (${dept.code})`} value={dept.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Course *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Picker
              selectedValue={formData.course_id}
              onValueChange={(v) => updateFormData('course_id', v)}
              style={{ color: colors.textPrimary }}
              enabled={filteredCourses.length > 0}
            >
              <Picker.Item label={filteredCourses.length > 0 ? "Select Course" : "Select Department first"} value="" />
              {filteredCourses.map((course) => (
                <Picker.Item key={course.id} label={`${course.name} (${course.code})`} value={course.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Year *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Picker
              selectedValue={formData.year_id}
              onValueChange={(v) => updateFormData('year_id', v)}
              style={{ color: colors.textPrimary }}
              enabled={filteredYears.length > 0}
            >
              <Picker.Item label={filteredYears.length > 0 ? "Select Year" : "Select Course first"} value="" />
              {filteredYears.map((year) => (
                <Picker.Item key={year.id} label={year.name} value={year.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Roll Number</Text>
            <GlassInput
              placeholder="e.g., 23BCA001"
              value={formData.roll_number}
              onChangeText={(v) => updateFormData('roll_number', v)}
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Admission Year</Text>
            <GlassInput
              placeholder="2024"
              value={formData.admission_year}
              onChangeText={(v) => updateFormData('admission_year', v)}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={loading ? 'Creating...' : 'Create Student'}
          onPress={handleCreateStudent}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );

  const renderBulkImport = () => (
    <View style={styles.bulkContainer}>
      <Card style={styles.bulkCard}>
        <FontAwesome5 name="file-csv" size={48} color={colors.primary} style={styles.bulkIcon} />
        <Text style={[styles.bulkTitle, { color: colors.textPrimary }]}>Bulk Import Students</Text>
        <Text style={[styles.bulkSubtitle, { color: colors.textSecondary }]}>
          Upload a CSV file with student data
        </Text>

        <View style={styles.csvInfo}>
          <Text style={[styles.csvInfoTitle, { color: colors.textPrimary }]}>Required CSV columns:</Text>
          <Text style={[styles.csvInfoText, { color: colors.textMuted }]}>
            • full_name (required){'\n'}
            • email (required){'\n'}
            • password (required){'\n'}
            • phone (optional){'\n'}
            • roll_number (optional){'\n'}
            • registration_number (optional)
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Class for Import</Text>
          
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Department *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Picker
                selectedValue={formData.department_id}
                onValueChange={(v) => updateFormData('department_id', v)}
                style={{ color: colors.textPrimary }}
              >
                <Picker.Item label="Select Department" value="" />
                {departments.map((dept) => (
                  <Picker.Item key={dept.id} label={`${dept.name}`} value={dept.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Course *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Picker
                selectedValue={formData.course_id}
                onValueChange={(v) => updateFormData('course_id', v)}
                style={{ color: colors.textPrimary }}
                enabled={filteredCourses.length > 0}
              >
                <Picker.Item label={filteredCourses.length > 0 ? "Select Course" : "Select Dept first"} value="" />
                {filteredCourses.map((course) => (
                  <Picker.Item key={course.id} label={`${course.name} (${course.code})`} value={course.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Year *</Text>
            <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Picker
                selectedValue={formData.year_id}
                onValueChange={(v) => updateFormData('year_id', v)}
                style={{ color: colors.textPrimary }}
                enabled={filteredYears.length > 0}
              >
                <Picker.Item label={filteredYears.length > 0 ? "Select Year" : "Select Course first"} value="" />
                {filteredYears.map((year) => (
                  <Picker.Item key={year.id} label={year.name} value={year.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {bulkLoading ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              Importing {bulkProgress.current} of {bulkProgress.total}...
            </Text>
          </View>
        ) : (
          <PrimaryButton
            title="Select CSV File"
            onPress={handleBulkImport}
            style={styles.uploadBtn}
          />
        )}
      </Card>
    </View>
  );

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top }]}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Add Student</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create new student account</Text>
            </View>
          </Animated.View>

          {/* Tabs */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'manual' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setActiveTab('manual')}
            >
              <FontAwesome5
                name="user-plus"
                size={14}
                color={activeTab === 'manual' ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'manual' ? '#fff' : colors.textSecondary },
                ]}
              >
                Manual Entry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'bulk' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setActiveTab('bulk')}
            >
              <FontAwesome5
                name="file-upload"
                size={14}
                color={activeTab === 'bulk' ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'bulk' ? '#fff' : colors.textSecondary },
                ]}
              >
                Bulk Import
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Content */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.formContainer}>
            {activeTab === 'manual' ? renderManualForm() : renderBulkImport()}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  formContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  formScroll: { flex: 1 },
  formSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 12 },
  pickerContainer: { borderRadius: 12, overflow: 'hidden' },
  buttonContainer: { paddingVertical: 20 },
  bulkContainer: { flex: 1 },
  bulkCard: { padding: 24, alignItems: 'center' },
  bulkIcon: { marginBottom: 16 },
  bulkTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  bulkSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  csvInfo: { width: '100%', padding: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 12, marginBottom: 24 },
  csvInfoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  csvInfoText: { fontSize: 13, lineHeight: 22 },
  uploadBtn: { width: '100%' },
  progressContainer: { alignItems: 'center', paddingVertical: 24 },
  progressText: { marginTop: 16, fontSize: 14 },
});
