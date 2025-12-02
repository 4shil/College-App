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

import { AnimatedBackground, Card, GlassInput, PrimaryButton } from '../../../../components/ui';
import { useThemeStore } from '../../../../store/themeStore';
import { supabase } from '../../../../lib/supabase';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  department_id: string;
  designation: string;
  qualification: string;
  employee_id: string;
}

export default function CreateTeacherScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    department_id: '',
    designation: '',
    qualification: '',
    employee_id: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, code')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
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
    return true;
  };

  const handleCreateTeacher = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Step 1: Create auth user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            primary_role: 'teacher',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Step 2: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          primary_role: 'teacher',
          status: 'active',
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Step 3: Create teacher record
      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: authData.user.id,
          department_id: formData.department_id,
          employee_id: formData.employee_id || null,
          designation: formData.designation || null,
          qualification: formData.qualification || null,
        });

      if (teacherError) throw teacherError;

      // Step 4: Assign teacher role
      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'teacher')
        .single();

      if (roleData) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role_id: roleData.id,
          });
      }

      Alert.alert('Success', 'Teacher created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating teacher:', error);
      Alert.alert('Error', error.message || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Add Teacher
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Create a new teacher account
              </Text>
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Personal Info Section */}
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <Card style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="user" size={14} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Personal Information
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Full Name *
                  </Text>
                  <GlassInput
                    placeholder="Enter full name"
                    value={formData.full_name}
                    onChangeText={(value) => updateFormData('full_name', value)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Email Address *
                  </Text>
                  <GlassInput
                    placeholder="teacher@jpmcollege.edu"
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Phone Number
                  </Text>
                  <GlassInput
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChangeText={(value) => updateFormData('phone', value)}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Password *
                  </Text>
                  <GlassInput
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    secureTextEntry
                  />
                </View>
              </Card>
            </Animated.View>

            {/* Professional Info Section */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Card style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="briefcase" size={14} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Professional Information
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Department *
                  </Text>
                  <View style={[styles.pickerContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker
                      selectedValue={formData.department_id}
                      onValueChange={(value) => updateFormData('department_id', value)}
                      style={{ color: colors.textPrimary }}
                      dropdownIconColor={colors.textMuted}
                    >
                      <Picker.Item label="Select Department" value="" />
                      {departments.map((dept) => (
                        <Picker.Item
                          key={dept.id}
                          label={`${dept.name} (${dept.code})`}
                          value={dept.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Employee ID
                  </Text>
                  <GlassInput
                    placeholder="EMP-2024-001"
                    value={formData.employee_id}
                    onChangeText={(value) => updateFormData('employee_id', value)}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Designation
                  </Text>
                  <GlassInput
                    placeholder="Assistant Professor"
                    value={formData.designation}
                    onChangeText={(value) => updateFormData('designation', value)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Qualification
                  </Text>
                  <GlassInput
                    placeholder="M.Tech, Ph.D"
                    value={formData.qualification}
                    onChangeText={(value) => updateFormData('qualification', value)}
                    autoCapitalize="words"
                  />
                </View>
              </Card>
            </Animated.View>

            {/* Submit Button */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)}>
              <PrimaryButton
                title={loading ? 'Creating...' : 'Create Teacher'}
                onPress={handleCreateTeacher}
                disabled={loading}
                style={styles.submitBtn}
              />
            </Animated.View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  formSection: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  pickerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitBtn: {
    marginTop: 8,
  },
});
