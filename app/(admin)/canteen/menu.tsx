import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { withAlpha } from '../../../theme/colorUtils';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  is_veg: boolean;
  image_url?: string;
}

export default function CanteenMenuScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const modalBackdropColor = isDark ? withAlpha(colors.background, 0.75) : withAlpha(colors.textPrimary, 0.5);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Breakfast',
    is_veg: true,
  });

  const categories = ['all', 'Breakfast', 'Lunch', 'Snacks', 'Beverages'];

  useEffect(() => {
    fetchMenuItems();
  }, [filter]);

  const fetchMenuItems = async () => {
    try {
      let query = supabase
        .from('canteen_menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      Alert.alert('Error', 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Breakfast',
      is_veg: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      is_veg: item.is_veg,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        is_veg: formData.is_veg,
        is_available: true,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('canteen_menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        Alert.alert('Success', 'Menu item updated successfully');
      } else {
        const { error } = await supabase
          .from('canteen_menu_items')
          .insert([itemData]);

        if (error) throw error;
        Alert.alert('Success', 'Menu item added successfully');
      }

      setModalVisible(false);
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      Alert.alert('Error', error.message || 'Failed to save menu item');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from('canteen_menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;
      fetchMenuItems();
    } catch (error: any) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', error.message || 'Failed to update availability');
    }
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('canteen_menu_items')
                .delete()
                .eq('id', item.id);

              if (error) throw error;
              Alert.alert('Success', 'Menu item deleted successfully');
              fetchMenuItems();
            } catch (error: any) {
              console.error('Error deleting menu item:', error);
              Alert.alert('Error', error.message || 'Failed to delete menu item');
            }
          },
        },
      ]
    );
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Breakfast': return colors.warning;
      case 'Lunch': return colors.success;
      case 'Snacks': return colors.info;
      case 'Beverages': return colors.primary;
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Menu Management</Text>
          <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterTab,
                  filter === cat && { backgroundColor: withAlpha(colors.primary, 0.125) },
                ]}
                onPress={() => setFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === cat ? colors.primary : colors.textSecondary },
                    filter === cat && { fontWeight: '700' },
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Menu Items */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
          ) : menuItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="utensils" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No menu items found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Tap + to add items
              </Text>
            </View>
          ) : (
            menuItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <GlassCard style={styles.menuCard}>
                  <View style={styles.cardContent}>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemHeader}>
                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                          {item.name}
                        </Text>
                        <View style={styles.badges}>
                          <View
                            style={[
                              styles.vegBadge,
                              {
                                backgroundColor: item.is_veg
                                  ? withAlpha(colors.success, 0.125)
                                  : withAlpha(colors.error, 0.125),
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.vegDot,
                                { backgroundColor: item.is_veg ? colors.success : colors.error },
                              ]}
                            />
                          </View>
                          <View
                            style={[
                              styles.categoryBadge,
                              { backgroundColor: withAlpha(getCategoryColor(item.category), 0.125) },
                            ]}
                          >
                            <Text
                              style={[
                                styles.categoryText,
                                { color: getCategoryColor(item.category) },
                              ]}
                            >
                              {item.category}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {item.description && (
                        <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
                          {item.description}
                        </Text>
                      )}
                      <Text style={[styles.itemPrice, { color: colors.primary }]}>
                        ₹{item.price}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: item.is_available
                            ? withAlpha(colors.success, 0.082)
                            : withAlpha(colors.error, 0.082),
                        },
                      ]}
                      onPress={() => toggleAvailability(item)}
                    >
                      <FontAwesome5
                        name={item.is_available ? 'check-circle' : 'times-circle'}
                        size={14}
                        color={item.is_available ? colors.success : colors.error}
                      />
                      <Text
                        style={[
                          styles.actionText,
                          { color: item.is_available ? colors.success : colors.error },
                        ]}
                      >
                        {item.is_available ? 'Available' : 'Sold Out'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: withAlpha(colors.primary, 0.082) }]}
                      onPress={() => openEditModal(item)}
                    >
                      <FontAwesome5 name="edit" size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: withAlpha(colors.error, 0.082) }]}
                      onPress={() => handleDelete(item)}
                    >
                      <FontAwesome5 name="trash" size={14} color={colors.error} />
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
          <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
            <GlassCard style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingItem ? 'Edit Item' : 'Add Menu Item'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Item Name *</Text>
                <GlassInput
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Masala Dosa"
                />

                <Text style={[styles.label, { color: colors.textPrimary }]}>Description</Text>
                <GlassInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Brief description"
                  multiline
                  numberOfLines={2}
                />

                <Text style={[styles.label, { color: colors.textPrimary }]}>Price (₹) *</Text>
                <GlassInput
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="e.g., 50"
                  keyboardType="numeric"
                />

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Category *</Text>
                  <View style={styles.buttonGroup}>
                    {['Breakfast', 'Lunch', 'Snacks', 'Beverages'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryButton,
                          { borderColor: withAlpha(colors.primary, 0.188) },
                          formData.category === cat && {
                            backgroundColor: withAlpha(getCategoryColor(cat), 0.125),
                          },
                        ]}
                        onPress={() => setFormData({ ...formData, category: cat })}
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            {
                              color:
                                formData.category === cat
                                  ? getCategoryColor(cat)
                                  : colors.textSecondary,
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>Type</Text>
                  <View style={styles.vegToggle}>
                    <TouchableOpacity
                      style={[
                        styles.vegButton,
                        { borderColor: withAlpha(colors.primary, 0.188) },
                        formData.is_veg && { backgroundColor: withAlpha(colors.success, 0.125) },
                      ]}
                      onPress={() => setFormData({ ...formData, is_veg: true })}
                    >
                      <View
                        style={[
                          styles.vegIndicator,
                          { borderColor: formData.is_veg ? colors.success : colors.textSecondary },
                        ]}
                      >
                        <View
                          style={[
                            styles.vegDot,
                            { backgroundColor: formData.is_veg ? colors.success : colors.textSecondary },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.vegText,
                          { color: formData.is_veg ? colors.success : colors.textSecondary },
                        ]}
                      >
                        Veg
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.vegButton,
                        { borderColor: withAlpha(colors.primary, 0.188) },
                        !formData.is_veg && { backgroundColor: withAlpha(colors.error, 0.125) },
                      ]}
                      onPress={() => setFormData({ ...formData, is_veg: false })}
                    >
                      <View
                        style={[
                          styles.vegIndicator,
                          { borderColor: !formData.is_veg ? colors.error : colors.textSecondary },
                        ]}
                      >
                        <View
                          style={[
                            styles.vegDot,
                            { backgroundColor: !formData.is_veg ? colors.error : colors.textSecondary },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.vegText,
                          { color: !formData.is_veg ? colors.error : colors.textSecondary },
                        ]}
                      >
                        Non-Veg
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <PrimaryButton
                  title={editingItem ? 'Update Item' : 'Add Item'}
                  onPress={handleSave}
                />
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
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
  menuCard: {
    padding: 16,
    marginBottom: 16,
  },
  cardContent: {
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  vegBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '700',
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
    padding: 10,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    maxHeight: '85%',
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
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  vegToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  vegButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  vegIndicator: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
