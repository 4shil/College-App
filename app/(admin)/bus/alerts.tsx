import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

export default function BusAlertsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);

  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    alert_type: 'general',
    title: '',
    message: '',
    target: 'all',
  });

  const alertTypes = [
    { id: 'general', label: 'General', icon: 'info-circle', color: colors.primary },
    { id: 'holiday', label: 'Holiday', icon: 'calendar-times', color: colors.warning },
    { id: 'payment', label: 'Payment', icon: 'rupee-sign', color: colors.error },
    { id: 'route', label: 'Route Change', icon: 'route', color: colors.info },
  ];

  const handleSendAlert = async () => {
    if (!formData.title || !formData.message) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      // In a real app, this would send notifications via a notification service
      // For now, we'll just show success
      Alert.alert(
        'Alert Sent',
        `Your ${formData.alert_type} alert has been sent to ${formData.target === 'all' ? 'all students' : 'selected routes'}.`,
        [{ text: 'OK', onPress: () => setModalVisible(false) }]
      );

      // Reset form
      setFormData({
        alert_type: 'general',
        title: '',
        message: '',
        target: 'all',
      });
    } catch (error: any) {
      console.error('Error sending alert:', error);
      Alert.alert('Error', error.message || 'Failed to send alert');
    }
  };

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bus Alerts</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Alert Types */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Alerts</Text>
          <View style={styles.alertTypesGrid}>
            {alertTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.alertTypeCard,
                  {
                    backgroundColor: withAlpha(type.color, isDark ? 0.082 : 0.063),
                    borderColor: withAlpha(type.color, 0.188),
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={() => {
                  setFormData({ ...formData, alert_type: type.id });
                  setModalVisible(true);
                }}
              >
                <FontAwesome5 name={type.icon} size={28} color={type.color} />
                <Text style={[styles.alertTypeLabel, { color: colors.textPrimary }]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Alerts */}
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>
            Recent Alerts
          </Text>
          
          <GlassCard style={styles.alertHistoryCard}>
            <View style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: withAlpha(colors.warning, 0.125) }]}>
                <FontAwesome5 name="calendar-times" size={18} color={colors.warning} />
              </View>
              <View style={styles.historyDetails}>
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                  Holiday Notice
                </Text>
                <Text style={[styles.historyMessage, { color: colors.textSecondary }]}>
                  Bus services will be suspended tomorrow
                </Text>
                <Text style={[styles.historyTime, { color: colors.textMuted }]}>2 hours ago</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.alertHistoryCard}>
            <View style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: withAlpha(colors.error, 0.125) }]}>
                <FontAwesome5 name="rupee-sign" size={18} color={colors.error} />
              </View>
              <View style={styles.historyDetails}>
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                  Payment Reminder
                </Text>
                <Text style={[styles.historyMessage, { color: colors.textSecondary }]}>
                  Monthly bus fee payment is due
                </Text>
                <Text style={[styles.historyTime, { color: colors.textMuted }]}>Yesterday</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.alertHistoryCard}>
            <View style={styles.historyItem}>
              <View style={[styles.historyIcon, { backgroundColor: withAlpha(colors.info, 0.125) }]}>
                <FontAwesome5 name="route" size={18} color={colors.info} />
              </View>
              <View style={styles.historyDetails}>
                <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>
                  Route Change
                </Text>
                <Text style={[styles.historyMessage, { color: colors.textSecondary }]}>
                  Route 5 diverted due to road work
                </Text>
                <Text style={[styles.historyTime, { color: colors.textMuted }]}>3 days ago</Text>
              </View>
            </View>
          </GlassCard>
        </ScrollView>

        {/* Create Alert Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
            <GlassCard style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Send Alert</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Alert Type</Text>
                  <View style={styles.typeButtonGroup}>
                    {alertTypes.map((type) => (
                      <TouchableOpacity
                        key={type.id}
                        style={[
                          styles.typeButton,
                          { borderColor: withAlpha(colors.primary, 0.188) },
                          formData.alert_type === type.id && { backgroundColor: withAlpha(type.color, 0.125) },
                        ]}
                        onPress={() => setFormData({ ...formData, alert_type: type.id })}
                      >
                        <FontAwesome5
                          name={type.icon}
                          size={16}
                          color={formData.alert_type === type.id ? type.color : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.typeText,
                            {
                              color: formData.alert_type === type.id ? type.color : colors.textSecondary,
                            },
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={[styles.label, { color: colors.textPrimary }]}>Title *</Text>
                <GlassInput
                  value={formData.title}
                  onChangeText={(text) => setFormData({ ...formData, title: text })}
                  placeholder="Enter alert title"
                />

                <Text style={[styles.label, { color: colors.textPrimary }]}>Message *</Text>
                <GlassInput
                  value={formData.message}
                  onChangeText={(text) => setFormData({ ...formData, message: text })}
                  placeholder="Enter alert message"
                  multiline
                  numberOfLines={4}
                />

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Send To</Text>
                  <View style={styles.targetButtons}>
                    <TouchableOpacity
                      style={[
                        styles.targetButton,
                        { borderColor: withAlpha(colors.primary, 0.188) },
                        formData.target === 'all' && { backgroundColor: withAlpha(colors.primary, 0.125) },
                      ]}
                      onPress={() => setFormData({ ...formData, target: 'all' })}
                    >
                      <Text
                        style={[
                          styles.targetText,
                          { color: formData.target === 'all' ? colors.primary : colors.textSecondary },
                        ]}
                      >
                        All Students
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.targetButton,
                        { borderColor: withAlpha(colors.primary, 0.188) },
                        formData.target === 'routes' && { backgroundColor: withAlpha(colors.primary, 0.125) },
                      ]}
                      onPress={() => setFormData({ ...formData, target: 'routes' })}
                    >
                      <Text
                        style={[
                          styles.targetText,
                          {
                            color:
                              formData.target === 'routes' ? colors.primary : colors.textSecondary,
                          },
                        ]}
                      >
                        Specific Routes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <PrimaryButton title="Send Alert" onPress={handleSendAlert} />
              </ScrollView>
            </GlassCard>
          </View>
        </Modal>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  alertTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  alertTypeCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 0,
    alignItems: 'center',
    gap: 12,
  },
  alertTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertHistoryCard: {
    padding: 16,
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyMessage: {
    fontSize: 13,
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  targetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  targetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  targetText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
