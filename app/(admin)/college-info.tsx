import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AnimatedBackground, Card, PrimaryButton } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { withAlpha } from '../../theme/colorUtils';
import type { CollegeInfo } from '../../types/database';

export default function CollegeInfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { primaryRole } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState<CollegeInfo | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    website: '',
    established_year: '',
    affiliation: '',
    principal_name: '',
    principal_email: '',
    motto: '',
  });

  useEffect(() => {
    fetchCollegeInfo();
  }, []);

  const fetchCollegeInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('college_info')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCollegeInfo(data);
        setFormData({
          name: data.name,
          short_name: data.short_name,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          phone: data.phone,
          email: data.email,
          website: data.website || '',
          established_year: data.established_year.toString(),
          affiliation: data.affiliation || '',
          principal_name: data.principal_name,
          principal_email: data.principal_email,
          motto: data.motto || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching college info:', error);
      Alert.alert('Error', 'Failed to load college information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'College name is required');
      return;
    }
    if (!formData.short_name.trim()) {
      Alert.alert('Error', 'Short name is required');
      return;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return;
    }
    if (!formData.state.trim()) {
      Alert.alert('Error', 'State is required');
      return;
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
      Alert.alert('Error', 'Valid 6-digit pincode is required');
      return;
    }
    if (!formData.phone.trim() || !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      Alert.alert('Error', 'Valid phone number is required');
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Error', 'Valid email is required');
      return;
    }
    if (!formData.established_year.trim() || !/^\d{4}$/.test(formData.established_year)) {
      Alert.alert('Error', 'Valid 4-digit year is required');
      return;
    }
    if (!formData.principal_name.trim()) {
      Alert.alert('Error', 'Principal name is required');
      return;
    }
    if (!formData.principal_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.principal_email)) {
      Alert.alert('Error', 'Valid principal email is required');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        name: formData.name.trim(),
        short_name: formData.short_name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website: formData.website.trim() || null,
        established_year: parseInt(formData.established_year),
        affiliation: formData.affiliation.trim() || null,
        principal_name: formData.principal_name.trim(),
        principal_email: formData.principal_email.trim(),
        motto: formData.motto.trim() || null,
      };

      let error;
      if (collegeInfo) {
        // Update existing
        const result = await supabase
          .from('college_info')
          .update(dataToSave)
          .eq('id', collegeInfo.id);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('college_info')
          .insert(dataToSave);
        error = result.error;
      }

      if (error) throw error;

      Alert.alert('Success', 'College information saved successfully');
      setEditing(false);
      await fetchCollegeInfo();
    } catch (error: any) {
      console.error('Error saving college info:', error);
      Alert.alert('Error', 'Failed to save college information: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (collegeInfo) {
      // Reset form to original data
      setFormData({
        name: collegeInfo.name,
        short_name: collegeInfo.short_name,
        address: collegeInfo.address,
        city: collegeInfo.city,
        state: collegeInfo.state,
        pincode: collegeInfo.pincode,
        phone: collegeInfo.phone,
        email: collegeInfo.email,
        website: collegeInfo.website || '',
        established_year: collegeInfo.established_year.toString(),
        affiliation: collegeInfo.affiliation || '',
        principal_name: collegeInfo.principal_name,
        principal_email: collegeInfo.principal_email,
        motto: collegeInfo.motto || '',
      });
    }
    setEditing(false);
  };

  const canEdit = primaryRole === 'super_admin' || primaryRole === 'principal';

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading college information...</Text>
          </View>
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              College Information
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {editing ? 'Edit details' : 'View details'}
            </Text>
          </View>
          {canEdit && !editing && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditing(true)}
            >
              <FontAwesome5 name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Information */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <FontAwesome5 name="university" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Basic Information</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>College Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter full college name"
                  placeholderTextColor={colors.textSecondary}
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Short Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.short_name}
                  onChangeText={(text) => setFormData({ ...formData, short_name: text })}
                  placeholder="e.g., JPM College"
                  placeholderTextColor={colors.textSecondary}
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Established Year *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.established_year}
                  onChangeText={(text) => setFormData({ ...formData, established_year: text })}
                  placeholder="e.g., 1995"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Affiliation</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.affiliation}
                  onChangeText={(text) => setFormData({ ...formData, affiliation: text })}
                  placeholder="e.g., Kannur University"
                  placeholderTextColor={colors.textSecondary}
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Motto</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.motto}
                  onChangeText={(text) => setFormData({ ...formData, motto: text })}
                  placeholder="College motto or tagline"
                  placeholderTextColor={colors.textSecondary}
                  editable={editing}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Contact Information */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <FontAwesome5 name="map-marked-alt" size={20} color={colors.success} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Contact Information</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Address *</Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter complete address"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  editable={editing}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>City *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    placeholder="City"
                    placeholderTextColor={colors.textSecondary}
                    editable={editing}
                  />
                </View>

                <View style={[styles.formGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>State *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.inputBackground,
                        color: colors.textPrimary,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    value={formData.state}
                    onChangeText={(text) => setFormData({ ...formData, state: text })}
                    placeholder="State"
                    placeholderTextColor={colors.textSecondary}
                    editable={editing}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Pincode *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.pincode}
                  onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                  placeholder="6-digit pincode"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="e.g., +91 4994 250330"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="college@example.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Website</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.website}
                  onChangeText={(text) => setFormData({ ...formData, website: text })}
                  placeholder="https://example.edu"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                  editable={editing}
                />
              </View>
            </Card>
          </Animated.View>

          {/* Principal Information */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <FontAwesome5 name="user-tie" size={20} color={colors.warning} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Principal Information</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Principal Name *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.principal_name}
                  onChangeText={(text) => setFormData({ ...formData, principal_name: text })}
                  placeholder="Principal's full name"
                  placeholderTextColor={colors.textSecondary}
                  editable={editing}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Principal Email *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textPrimary,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  value={formData.principal_email}
                  onChangeText={(text) => setFormData({ ...formData, principal_email: text })}
                  placeholder="principal@example.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={editing}
                />
              </View>
            </Card>
          </Animated.View>
        </ScrollView>

        {/* Action Buttons */}
        {editing && (
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={[
              styles.footer,
              {
                paddingBottom: insets.bottom + 20,
                backgroundColor: withAlpha(colors.cardBackground, 0.8),
                borderTopColor: colors.cardBorder,
                borderTopWidth: colors.borderWidth,
              },
            ]}
          >
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <PrimaryButton
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleSave}
                loading={saving}
                disabled={saving}
                style={styles.saveButton}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
  },
});
