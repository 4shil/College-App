import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';

interface BusRoute {
  id: string;
  route_name: string;
  route_number: string;
  vehicle_number: string;
  driver_contact?: string;
  stops: string[];
  is_active: boolean;
  monthly_fee: number;
}

export default function BusRoutesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState<BusRoute | null>(null);
  
  // Form fields
  const [routeName, setRouteName] = useState('');
  const [routeNumber, setRouteNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverContact, setDriverContact] = useState('');
  const [stopsInput, setStopsInput] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_routes')
        .select('*')
        .order('route_number', { ascending: true });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (route: BusRoute) => {
    setEditingRoute(route);
    setRouteName(route.route_name);
    setRouteNumber(route.route_number);
    setVehicleNumber(route.vehicle_number);
    setDriverContact(route.driver_contact || '');
    setStopsInput(route.stops.join(', '));
    setMonthlyFee(route.monthly_fee.toString());
    setIsActive(route.is_active);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingRoute(null);
    setRouteName('');
    setRouteNumber('');
    setVehicleNumber('');
    setDriverContact('');
    setStopsInput('');
    setMonthlyFee('');
    setIsActive(true);
  };

  const handleSave = async () => {
    if (!routeName || !routeNumber || !vehicleNumber || !stopsInput || !monthlyFee) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    const stops = stopsInput.split(',').map(s => s.trim()).filter(s => s);
    
    const routeData = {
      route_name: routeName,
      route_number: routeNumber,
      vehicle_number: vehicleNumber,
      driver_contact: driverContact || null,
      stops,
      monthly_fee: parseFloat(monthlyFee),
      is_active: isActive,
    };

    try {
      if (editingRoute) {
        const { error } = await supabase
          .from('bus_routes')
          .update(routeData)
          .eq('id', editingRoute.id);
        
        if (error) throw error;
        Alert.alert('Success', 'Route updated successfully');
      } else {
        const { error } = await supabase
          .from('bus_routes')
          .insert([routeData]);
        
        if (error) throw error;
        Alert.alert('Success', 'Route created successfully');
      }
      
      setModalVisible(false);
      resetForm();
      fetchRoutes();
    } catch (error: any) {
      console.error('Error saving route:', error);
      Alert.alert('Error', error.message || 'Failed to save route');
    }
  };

  const handleDelete = async (route: BusRoute) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete route ${route.route_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bus_routes')
                .delete()
                .eq('id', route.id);
              
              if (error) throw error;
              Alert.alert('Success', 'Route deleted successfully');
              fetchRoutes();
            } catch (error: any) {
              console.error('Error deleting route:', error);
              Alert.alert('Error', error.message || 'Failed to delete route');
            }
          },
        },
      ]
    );
  };

  const toggleActive = async (route: BusRoute) => {
    try {
      const { error } = await supabase
        .from('bus_routes')
        .update({ is_active: !route.is_active })
        .eq('id', route.id);
      
      if (error) throw error;
      fetchRoutes();
    } catch (error: any) {
      console.error('Error toggling route status:', error);
      Alert.alert('Error', 'Failed to update route status');
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bus Routes</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Routes List */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          ) : routes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="bus" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No routes found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Tap the + button to add a route
              </Text>
            </View>
          ) : (
            routes.map((route, index) => (
              <Animated.View
                key={route.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <GlassCard style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <View style={styles.routeInfo}>
                      <View style={styles.routeTitleRow}>
                        <Text style={[styles.routeNumber, { color: colors.primary }]}>
                          {route.route_number}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: route.is_active ? `${colors.success}20` : `${colors.error}20` }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            { color: route.is_active ? colors.success : colors.error }
                          ]}>
                            {route.is_active ? 'Active' : 'Inactive'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.routeName, { color: colors.textPrimary }]}>
                        {route.route_name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeDetails}>
                    <View style={styles.detailRow}>
                      <FontAwesome5 name="bus" size={14} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {route.vehicle_number}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <FontAwesome5 name="map-marker-alt" size={14} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {route.stops.length} stops
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <FontAwesome5 name="rupee-sign" size={14} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        ₹{route.monthly_fee}/month
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: `${colors.primary}15` }]}
                      onPress={() => openEditModal(route)}
                    >
                      <FontAwesome5 name="edit" size={14} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: route.is_active ? `${colors.warning}15` : `${colors.success}15` }]}
                      onPress={() => toggleActive(route)}
                    >
                      <FontAwesome5 
                        name={route.is_active ? 'pause' : 'play'} 
                        size={14} 
                        color={route.is_active ? colors.warning : colors.success} 
                      />
                      <Text style={[styles.actionText, { color: route.is_active ? colors.warning : colors.success }]}>
                        {route.is_active ? 'Pause' : 'Activate'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: `${colors.error}15` }]}
                      onPress={() => handleDelete(route)}
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
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a2e' : '#ffffff' }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingRoute ? 'Edit Route' : 'Add Route'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <GlassInput
                  placeholder="Route Name (e.g., Kochi - College)"
                  value={routeName}
                  onChangeText={setRouteName}
                  style={styles.input}
                />
                <GlassInput
                  placeholder="Route Number (e.g., R1, R2)"
                  value={routeNumber}
                  onChangeText={setRouteNumber}
                  style={styles.input}
                />
                <GlassInput
                  placeholder="Vehicle Number (e.g., KL-01-AB-1234)"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  style={styles.input}
                />
                <GlassInput
                  placeholder="Driver Contact (Optional)"
                  value={driverContact}
                  onChangeText={setDriverContact}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                <GlassInput
                  placeholder="Stops (comma separated)"
                  value={stopsInput}
                  onChangeText={setStopsInput}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
                <GlassInput
                  placeholder="Monthly Fee (₹)"
                  value={monthlyFee}
                  onChangeText={setMonthlyFee}
                  keyboardType="numeric"
                  style={styles.input}
                />
                
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setIsActive(!isActive)}
                >
                  <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                    Route Active
                  </Text>
                  <View style={[
                    styles.toggle,
                    { backgroundColor: isActive ? colors.success : colors.textMuted }
                  ]}>
                    <View style={[
                      styles.toggleCircle,
                      { transform: [{ translateX: isActive ? 20 : 0 }] }
                    ]} />
                  </View>
                </TouchableOpacity>

                <PrimaryButton
                  title={editingRoute ? 'Update Route' : 'Create Route'}
                  onPress={handleSave}
                  style={styles.saveButton}
                />
              </ScrollView>
            </View>
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
    alignItems: 'flex-end',
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
    marginTop: 8,
  },
  routeCard: {
    padding: 16,
    marginBottom: 16,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  routeNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
  },
  routeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  input: {
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  saveButton: {
    marginBottom: 40,
  },
});
