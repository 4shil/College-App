import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  capacity: number;
  condition: string;
  route_id?: string;
  created_at: string;
}

export default function VehiclesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_type: 'Bus',
    capacity: '',
    condition: 'good',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      Alert.alert('Error', 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      vehicle_number: '',
      vehicle_type: 'Bus',
      capacity: '',
      condition: 'good',
    });
    setModalVisible(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_number: vehicle.vehicle_number,
      vehicle_type: vehicle.vehicle_type,
      capacity: vehicle.capacity.toString(),
      condition: vehicle.condition,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.vehicle_number || !formData.capacity) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const vehicleData = {
        vehicle_number: formData.vehicle_number,
        vehicle_type: formData.vehicle_type,
        capacity: parseInt(formData.capacity),
        condition: formData.condition,
      };

      if (editingVehicle) {
        const { error } = await supabase
          .from('bus_vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (error) throw error;
        Alert.alert('Success', 'Vehicle updated successfully');
      } else {
        const { error } = await supabase
          .from('bus_vehicles')
          .insert([vehicleData]);

        if (error) throw error;
        Alert.alert('Success', 'Vehicle added successfully');
      }

      setModalVisible(false);
      fetchVehicles();
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', error.message || 'Failed to save vehicle');
    }
  };

  const handleDelete = (vehicle: Vehicle) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete vehicle ${vehicle.vehicle_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bus_vehicles')
                .delete()
                .eq('id', vehicle.id);

              if (error) throw error;
              Alert.alert('Success', 'Vehicle deleted successfully');
              fetchVehicles();
            } catch (error: any) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', error.message || 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'fair': return colors.warning;
      case 'poor': return colors.error;
      default: return colors.textSecondary;
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Vehicles</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Vehicles List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="bus" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No vehicles found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Tap + to add a vehicle
              </Text>
            </View>
          ) : (
            vehicles.map((vehicle, index) => (
              <Animated.View
                key={vehicle.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <GlassCard style={styles.vehicleCard}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.vehicleIcon, { backgroundColor: `${colors.primary}15` }]}>
                      <FontAwesome5 name="bus" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.vehicleDetails}>
                      <Text style={[styles.vehicleNumber, { color: colors.textPrimary }]}>
                        {vehicle.vehicle_number}
                      </Text>
                      <Text style={[styles.vehicleType, { color: colors.textSecondary }]}>
                        {vehicle.vehicle_type}
                      </Text>
                    </View>
                    <View style={[
                      styles.conditionBadge,
                      { backgroundColor: `${getConditionColor(vehicle.condition)}20` }
                    ]}>
                      <Text style={[
                        styles.conditionText,
                        { color: getConditionColor(vehicle.condition) }
                      ]}>
                        {vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <FontAwesome5 name="users" size={14} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      Capacity: {vehicle.capacity} passengers
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
                      onPress={() => openEditModal(vehicle)}
                    >
                      <FontAwesome5 name="edit" size={14} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: `${colors.error}15` }]}
                      onPress={() => handleDelete(vehicle)}
                    >
                      <FontAwesome5 name="trash" size={14} color={colors.error} />
                      <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </Animated.View>
            ))
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Vehicle Number *</Text>
                <GlassInput
                  value={formData.vehicle_number}
                  onChangeText={(text) => setFormData({ ...formData, vehicle_number: text })}
                  placeholder="e.g., DL-1234"
                />

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Vehicle Type *</Text>
                  <View style={styles.buttonGroup}>
                    {['Bus', 'Mini Bus', 'Van'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeButton,
                          { borderColor: `${colors.primary}30` },
                          formData.vehicle_type === type && { backgroundColor: `${colors.primary}20` },
                        ]}
                        onPress={() => setFormData({ ...formData, vehicle_type: type })}
                      >
                        <Text
                          style={[
                            styles.typeText,
                            { color: formData.vehicle_type === type ? colors.primary : colors.textSecondary },
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={[styles.label, { color: colors.textPrimary }]}>Capacity *</Text>
                <GlassInput
                  value={formData.capacity}
                  onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                  placeholder="e.g., 50"
                  keyboardType="numeric"
                />

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Condition</Text>
                  <View style={styles.buttonGroup}>
                    {['excellent', 'good', 'fair', 'poor'].map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        style={[
                          styles.condButton,
                          { borderColor: `${colors.primary}30` },
                          formData.condition === cond && { backgroundColor: `${getConditionColor(cond)}20` },
                        ]}
                        onPress={() => setFormData({ ...formData, condition: cond })}
                      >
                        <Text
                          style={[
                            styles.condText,
                            { color: formData.condition === cond ? getConditionColor(cond) : colors.textSecondary },
                          ]}
                        >
                          {cond.charAt(0).toUpperCase() + cond.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <PrimaryButton title={editingVehicle ? 'Update Vehicle' : 'Add Vehicle'} onPress={handleSave} />
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  vehicleCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  vehicleType: {
    fontSize: 13,
  },
  conditionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  condButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  condText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
