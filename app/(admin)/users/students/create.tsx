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

interface Program {
  id: string;
  name: string;
  code: string;
}

interface Year {
  id: string;
  name: string;
  year_number: number;
}

interface Section {
  id: string;
  name: string;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  department_id: string;
  program_id: string;
  year_id: string;
  section_id: string;
  registration_number: string;
  roll_number: string;
  admission_year: string;
}

export default function CreateStudentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    department_id: '',
    program_id: '',
    year_id: '',
    section_id: '',
    registration_number: '',
    roll_number: '',
    admission_year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      fetchPrograms(formData.department_id);
    }
  }, [formData.department_id]);

  useEffect(() => {
    if (formData.program_id && formData.year_id) {
      fetchSections(formData.program_id, formData.year_id);
    }
  }, [formData.program_id, formData.year_id]);

  const fetchInitialData = async () => {
    try {
      const [deptsRes, yearsRes] = await Promise.all([
        supabase.from('departments').select('id, name, code').eq('is_active', true).order('name'),
        supabase.from('years').select('id, name, year_number').order('year_number'),
      ]);

      setDepartments(deptsRes.data || []);
      setYears(yearsRes.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchPrograms = async (deptId: string) => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('id, name, code')
        .eq('department_id', deptId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSections = async (programId: string, yearId: string) => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('id, name')
        .eq('program_id', programId)
        .eq('year_id', yearId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
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
    if (!formData.program_id) {
      Alert.alert('Validation Error', 'Please select a program');
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
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
            role: 'student',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          primary_role: 'student',
          status: 'active',
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Create student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          department_id: formData.department_id,
          program_id: formData.program_id,
          year_id: formData.year_id,
          section_id: formData.section_id || null,
          registration_number: formData.registration_number.trim() || null,
          roll_number: formData.roll_number.trim() || null,
          admission_year: parseInt(formData.admission_year) || new Date().getFullYear(),
          current_status: 'active',
          is_active: true,
        });

      if (studentError) throw studentError;

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
      
      const rows = csvText.split('\n').map(row => 
        row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );
      
      if (rows.length < 2) {
        Alert.alert('Error', 'CSV file is empty or has no data rows');
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase());
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.length > 0));

      // Expected headers: full_name, email, phone, registration_number, roll_number
      const requiredHeaders = ['full_name', 'email'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        Alert.alert('Error', `Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }

      Alert.alert(
        'Confirm Import',
        `Found ${dataRows.length} students to import. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: () => processImport(headers, dataRows),
          },
        ]
      );
    } catch (error) {
      console.error('Error reading file:', error);
      Alert.alert('Error', 'Failed to read the CSV file');
    }
  };

  const processImport = async (headers: string[], dataRows: string[][]) => {
    if (!formData.department_id || !formData.program_id || !formData.year_id) {
      Alert.alert('Error', 'Please select department, program, and year before importing');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: dataRows.length });

    let successCount = 0;
    let failedRows: { row: number; email: string; error: string }[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const data: Record<string, string> = {};
      
      headers.forEach((header, idx) => {
        data[header] = row[idx] || '';
      });

      setImportProgress({ current: i + 1, total: dataRows.length });

      if (!data.full_name || !data.email) {
        failedRows.push({ row: i + 2, email: data.email || 'N/A', error: 'Missing name or email' });
        continue;
      }

      try {
        // Generate a random password for bulk import
        const password = `Student@${Math.random().toString(36).substring(2, 8)}`;

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email.trim(),
          password,
          options: {
            data: {
              full_name: data.full_name.trim(),
              role: 'student',
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // Update profile
        await supabase
          .from('profiles')
          .update({
            full_name: data.full_name.trim(),
            phone: data.phone?.trim() || null,
            primary_role: 'student',
            status: 'active',
          })
          .eq('id', authData.user.id);

        // Create student record
        await supabase
          .from('students')
          .insert({
            user_id: authData.user.id,
            department_id: formData.department_id,
            program_id: formData.program_id,
            year_id: formData.year_id,
            section_id: formData.section_id || null,
            registration_number: data.registration_number?.trim() || null,
            roll_number: data.roll_number?.trim() || null,
            admission_year: parseInt(formData.admission_year) || new Date().getFullYear(),
            current_status: 'active',
            is_active: true,
          });

        successCount++;
      } catch (error: any) {
        failedRows.push({ row: i + 2, email: data.email, error: error.message || 'Unknown error' });
      }
    }

    setImporting(false);

    if (failedRows.length > 0) {
      const failedSummary = failedRows.slice(0, 5).map(f => `Row ${f.row}: ${f.email} - ${f.error}`).join('\n');
      Alert.alert(
        'Import Complete',
        `Imported: ${successCount}\nFailed: ${failedRows.length}\n\n${failedSummary}${failedRows.length > 5 ? '\n...' : ''}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert('Success', `Successfully imported ${successCount} students!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <AnimatedBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Add Student</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Add single or bulk students
              </Text>
            </View>
          </Animated.View>

          {/* Tab Switcher */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'single' && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab('single')}
            >
              <FontAwesome5 name="user-plus" size={14} color={activeTab === 'single' ? '#fff' : colors.textMuted} />
              <Text style={[styles.tabText, { color: activeTab === 'single' ? '#fff' : colors.textMuted }]}>
                Single
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'bulk' && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab('bulk')}
            >
              <FontAwesome5 name="file-csv" size={14} color={activeTab === 'bulk' ? '#fff' : colors.textMuted} />
              <Text style={[styles.tabText, { color: activeTab === 'bulk' ? '#fff' : colors.textMuted }]}>
                Bulk Import
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'single' ? (
              // Single Student Form
              <>
                <Card style={styles.formCard}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    <FontAwesome5 name="user" size={14} color={colors.primary} /> Personal Info
                  </Text>

                  <GlassInput
                    placeholder="Full Name *"
                    value={formData.full_name}
                    onChangeText={(v) => updateFormData('full_name', v)}
                  />
                  <GlassInput
                    placeholder="Email Address *"
                    value={formData.email}
                    onChangeText={(v) => updateFormData('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <GlassInput
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChangeText={(v) => updateFormData('phone', v)}
                    keyboardType="phone-pad"
                  />
                  <GlassInput
                    placeholder="Password *"
                    value={formData.password}
                    onChangeText={(v) => updateFormData('password', v)}
                    secureTextEntry
                  />
                </Card>

                <Card style={styles.formCard}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    <FontAwesome5 name="graduation-cap" size={14} color={colors.primary} /> Academic Info
                  </Text>

                  <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker
                      selectedValue={formData.department_id}
                      onValueChange={(v) => updateFormData('department_id', v)}
                      style={{ color: colors.textPrimary }}
                    >
                      <Picker.Item label="Select Department *" value="" />
                      {departments.map(d => (
                        <Picker.Item key={d.id} label={`${d.code} - ${d.name}`} value={d.id} />
                      ))}
                    </Picker>
                  </View>

                  <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker
                      selectedValue={formData.program_id}
                      onValueChange={(v) => updateFormData('program_id', v)}
                      style={{ color: colors.textPrimary }}
                      enabled={programs.length > 0}
                    >
                      <Picker.Item label={programs.length > 0 ? "Select Program *" : "Select department first"} value="" />
                      {programs.map(p => (
                        <Picker.Item key={p.id} label={`${p.code} - ${p.name}`} value={p.id} />
                      ))}
                    </Picker>
                  </View>

                  <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker
                      selectedValue={formData.year_id}
                      onValueChange={(v) => updateFormData('year_id', v)}
                      style={{ color: colors.textPrimary }}
                    >
                      <Picker.Item label="Select Year *" value="" />
                      {years.map(y => (
                        <Picker.Item key={y.id} label={y.name} value={y.id} />
                      ))}
                    </Picker>
                  </View>

                  {sections.length > 0 && (
                    <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Picker
                        selectedValue={formData.section_id}
                        onValueChange={(v) => updateFormData('section_id', v)}
                        style={{ color: colors.textPrimary }}
                      >
                        <Picker.Item label="Select Section" value="" />
                        {sections.map(s => (
                          <Picker.Item key={s.id} label={s.name} value={s.id} />
                        ))}
                      </Picker>
                    </View>
                  )}

                  <GlassInput
                    placeholder="Registration Number"
                    value={formData.registration_number}
                    onChangeText={(v) => updateFormData('registration_number', v)}
                  />
                  <GlassInput
                    placeholder="Roll Number"
                    value={formData.roll_number}
                    onChangeText={(v) => updateFormData('roll_number', v)}
                  />
                  <GlassInput
                    placeholder="Admission Year"
                    value={formData.admission_year}
                    onChangeText={(v) => updateFormData('admission_year', v)}
                    keyboardType="numeric"
                  />
                </Card>

                <PrimaryButton
                  title={loading ? 'Creating...' : 'Create Student'}
                  onPress={handleCreateStudent}
                  disabled={loading}
                  style={styles.submitBtn}
                />
              </>
            ) : (
              // Bulk Import
              <>
                <Card style={styles.formCard}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    <FontAwesome5 name="file-csv" size={14} color={colors.primary} /> Bulk Import Settings
                  </Text>
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                    Select the department, program, and year for all imported students.
                  </Text>

                  <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker
                      selectedValue={formData.department_id}
                      onValueChange={(v) => updateFormData('department_id', v)}
                      style={{ color: colors.textPrimary }}
                    >
                      <Picker.Item label="Select Department *" value="" />
                      {departments.map(d => (
                        <Picker.Item key={d.id} label={`${d.code} - ${d.name}`} value={d.id} />
                      ))}
                    </Picker>
                  </View>

                  <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker
                      selectedValue={formData.program_id}
                      onValueChange={(v) => updateFormData('program_id', v)}
                      style={{ color: colors.textPrimary }}
                      enabled={programs.length > 0}
                    >
                      <Picker.Item label={programs.length > 0 ? "Select Program *" : "Select department first"} value="" />
                      {programs.map(p => (
                        <Picker.Item key={p.id} label={`${p.code} - ${p.name}`} value={p.id} />
                      ))}
                    </Picker>
                  </View>

                  <View style={[styles.pickerWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <Picker
                      selectedValue={formData.year_id}
                      onValueChange={(v) => updateFormData('year_id', v)}
                      style={{ color: colors.textPrimary }}
                    >
                      <Picker.Item label="Select Year *" value="" />
                      {years.map(y => (
                        <Picker.Item key={y.id} label={y.name} value={y.id} />
                      ))}
                    </Picker>
                  </View>
                </Card>

                <Card style={styles.formCard}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    <FontAwesome5 name="info-circle" size={14} color={colors.primary} /> CSV Format
                  </Text>
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                    Your CSV file should have the following columns:{'\n'}
                    • full_name (required){'\n'}
                    • email (required){'\n'}
                    • phone (optional){'\n'}
                    • registration_number (optional){'\n'}
                    • roll_number (optional)
                  </Text>

                  <View style={[styles.sampleCsv, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                    <Text style={[styles.csvCode, { color: colors.textMuted }]}>
                      full_name,email,phone,registration_number,roll_number{'\n'}
                      John Doe,john@email.com,9876543210,REG001,101{'\n'}
                      Jane Smith,jane@email.com,9876543211,REG002,102
                    </Text>
                  </View>
                </Card>

                {importing && (
                  <Card style={styles.progressCard}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.progressText, { color: colors.textPrimary }]}>
                      Importing students...
                    </Text>
                    <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
                      {importProgress.current} / {importProgress.total}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            backgroundColor: colors.primary,
                            width: `${(importProgress.current / importProgress.total) * 100}%`,
                          }
                        ]} 
                      />
                    </View>
                  </Card>
                )}

                <TouchableOpacity
                  style={[
                    styles.importBtn,
                    { 
                      backgroundColor: colors.primary,
                      opacity: !formData.department_id || !formData.program_id || !formData.year_id || importing ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleBulkImport}
                  disabled={!formData.department_id || !formData.program_id || !formData.year_id || importing}
                >
                  <FontAwesome5 name="file-upload" size={18} color="#fff" />
                  <Text style={styles.importBtnText}>Select CSV File</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: { padding: 8, marginRight: 12 },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  
  formCard: { padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  helpText: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  
  pickerWrapper: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  
  submitBtn: { marginTop: 8 },
  
  sampleCsv: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  csvCode: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 14,
    marginTop: 8,
  },
  importBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  progressCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  progressCount: { fontSize: 14, marginTop: 4 },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
});
