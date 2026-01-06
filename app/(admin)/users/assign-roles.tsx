import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, GlassCard, GlassInput, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS, ADMIN_ROLES } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

interface User {
  id: string;
  full_name: string;
  email: string;
  primary_role: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string;
  is_active?: boolean;
  roles: {
    id: string;
    name: string;
    display_name: string;
  };
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
}

interface UserWithRoles extends User {
  user_roles: UserRole[];
  assignedRoles: string[];
}

export default function AssignRolesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('display_name');

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      Alert.alert('Error', 'Failed to load roles');
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          primary_role,
          user_roles (
            id,
            user_id,
            role_id,
            assigned_at,
            assigned_by,
            is_active,
            roles (
              id,
              name,
              display_name
            )
          )
        `)
        .eq('user_roles.is_active', true)
        .order('full_name');

      if (error) throw error;

      const usersWithRoles: UserWithRoles[] = (data || []).map((user: any) => ({
        ...user,
        assignedRoles: user.user_roles.map((ur: UserRole) => ur.roles.display_name),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', error.message || 'Failed to load users');
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchRoles(), fetchUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Realtime: keep role assignments and profiles in sync
  useEffect(() => {
    const rolesChannel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('assign-roles-profiles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(rolesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [fetchUsers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) {
      Alert.alert('Validation Error', 'Please select a role');
      return;
    }

    // Check if role already assigned
    const alreadyHasRole = selectedUser.user_roles.some(
      ur => ur.role_id === selectedRoleId
    );

    if (alreadyHasRole) {
      Alert.alert('Info', 'User already has this role');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: {
          action: 'assign_role',
          target_user_id: selectedUser.id,
          role_id: selectedRoleId,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error('Failed to assign role');

      Alert.alert('Success', 'Role assigned successfully');
      setModalVisible(false);
      setSelectedRoleId('');
      await fetchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      Alert.alert('Error', error.message || 'Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeRole = async (userId: string, roleId: string, roleName: string) => {
    Alert.alert(
      'Revoke Role',
      `Are you sure you want to revoke the "${roleName}" role from this user?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const { data, error } = await supabase.functions.invoke('admin-manage-user', {
                body: {
                  action: 'revoke_role',
                  target_user_id: userId,
                  role_id: roleId,
                },
              });

              if (error) throw error;
              if (!data?.ok) throw new Error('Failed to revoke role');

              Alert.alert('Success', 'Role revoked successfully');
              await fetchUsers();
            } catch (error: any) {
              console.error('Error revoking role:', error);
              Alert.alert('Error', error.message || 'Failed to revoke role');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter((user: UserWithRoles) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterRole === 'all') return matchesSearch;
    if (filterRole === 'no-roles') return matchesSearch && user.user_roles.length === 0;
    
    return matchesSearch && user.user_roles.some(ur => ur.role_id === filterRole);
  });

  const getRoleColor = (roleName: string): string => {
    switch (roleName) {
      case 'super_admin':
        return colors.error;
      case 'principal':
        return colors.primary;
      case 'department_admin':
        return colors.info;
      case 'hod':
        return colors.success;
      case 'exam_cell_admin':
        return colors.warning;
      case 'library_admin':
        return colors.primary;
      case 'finance_admin':
        return colors.success;
      case 'bus_admin':
        return colors.error;
      case 'canteen_admin':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top + 20, paddingHorizontal: 20 }]}>
          <LoadingIndicator size="large" color={colors.primary} />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <Restricted permissions={PERMISSIONS.CREATE_DELETE_ADMINS} showDeniedMessage={true}>
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 110, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Role Management</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Assign and manage admin roles
          </Text>
        </View>

        {/* Search and Filter */}
        <GlassCard intensity={35} style={styles.filterCard}>
          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
            <View style={{ flex: 1 }}>
              <GlassInput
                placeholder="Search by name or email…"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={[styles.pickerContainer, { borderColor: colors.glassBorder }]}>
            <Picker
              selectedValue={filterRole}
              onValueChange={setFilterRole}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textPrimary}
            >
              <Picker.Item label="All Users" value="all" />
              <Picker.Item label="Users without Roles" value="no-roles" />
              {roles.map(role => (
                <Picker.Item key={role.id} label={role.display_name} value={role.id} />
              ))}
            </Picker>
          </View>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard intensity={35} style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{users.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Users</Text>
          </GlassCard>
          <GlassCard intensity={35} style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {users.filter(u => u.user_roles.length > 0).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>With Roles</Text>
          </GlassCard>
          <GlassCard intensity={35} style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {users.filter(u => u.user_roles.length === 0).length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>No Roles</Text>
          </GlassCard>
        </View>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <GlassCard intensity={35} style={styles.emptyCard}>
            <FontAwesome5 name="users" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No users found' : 'No users available'}
            </Text>
          </GlassCard>
        ) : (
          filteredUsers.map((user, index) => (
            <Animated.View
              key={user.id}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <GlassCard intensity={35} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>
                      {user.full_name}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                      {user.email}
                    </Text>
                    <View style={styles.primaryRoleBadge}>
                      <Text style={[styles.primaryRoleText, { color: colors.textSecondary }]}>
                        Primary: {user.primary_role}
                      </Text>
                    </View>
                  </View>
                  <SolidButton
                    onPress={() => {
                      setSelectedUser(user);
                      setModalVisible(true);
                    }}
                    style={[styles.assignButton, { backgroundColor: colors.primary }]}
                  >
                    <FontAwesome5 name="plus" size={14} color={colors.textInverse} />
                    <Text style={[styles.assignButtonText, { color: colors.textInverse }]}>Assign</Text>
                  </SolidButton>
                </View>

                {/* Assigned Roles */}
                {user.user_roles.length > 0 && (
                  <View style={[styles.rolesSection, { borderColor: colors.cardBorder }]}>
                    <Text style={[styles.rolesSectionTitle, { color: colors.textSecondary }]}>
                      Admin Roles:
                    </Text>
                    <View style={styles.rolesContainer}>
                      {user.user_roles.map(userRole => (
                        (() => {
                          const roleColor = getRoleColor(userRole.roles.name);
                          return (
                        <View
                          key={userRole.id}
                          style={[
                            styles.roleBadge,
                            {
                              backgroundColor: colors.inputBackground,
                              borderWidth: colors.borderWidth,
                              borderColor: roleColor,
                            }
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              { color: roleColor }
                            ]}
                          >
                            {userRole.roles.display_name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRevokeRole(user.id, userRole.role_id, userRole.roles.display_name)}
                            style={styles.revokeButton}
                          >
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color={roleColor}
                            />
                          </TouchableOpacity>
                        </View>
                          );
                        })()
                      ))}
                    </View>
                  </View>
                )}
              </GlassCard>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Assign Role Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: modalBackdropColor }]}>
          <GlassCard intensity={40} noPadding style={styles.modalContent}>
            <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Assign Role
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalUserName, { color: colors.textPrimary }]}>
                  {selectedUser.full_name}
                </Text>
                <Text style={[styles.modalUserEmail, { color: colors.textSecondary }]}>
                  {selectedUser.email}
                </Text>

                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  Select Role to Assign
                </Text>
                <View style={[styles.pickerContainer, { borderColor: colors.glassBorder }]}>
                  <Picker
                    selectedValue={selectedRoleId}
                    onValueChange={setSelectedRoleId}
                    style={[styles.picker, { color: colors.textPrimary }]}
                    dropdownIconColor={colors.textPrimary}
                  >
                    <Picker.Item label="Select a role..." value="" />
                    {roles
                      .filter(role => !selectedUser.user_roles.some(ur => ur.role_id === role.id))
                      .map(role => (
                        <Picker.Item
                          key={role.id}
                          label={role.display_name}
                          value={role.id}
                        />
                      ))}
                  </Picker>
                </View>

                <PrimaryButton
                  title="Assign Role"
                  onPress={handleAssignRole}
                  loading={saving}
                  disabled={saving || !selectedRoleId}
                  style={styles.saveButton}
                />
              </View>
            )}
            </View>
          </GlassCard>
        </View>
      </Modal>
    </AnimatedBackground>
    </Restricted>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16 },
  filterCard: { padding: 16, marginBottom: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  searchIcon: { marginRight: 12 },
  pickerContainer: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  picker: { height: 50 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12 },
  userCard: { padding: 16, marginBottom: 12 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flex: 1, marginRight: 12 },
  userName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 6 },
  primaryRoleBadge: { marginTop: 4 },
  primaryRoleText: { fontSize: 12, fontStyle: 'italic' },
  assignButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  assignButtonText: { fontSize: 14, fontWeight: '600' },
  rolesSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: 'transparent' },
  rolesSectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  rolesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  roleBadgeText: { fontSize: 13, fontWeight: '600' },
  revokeButton: { marginLeft: 4 },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, marginTop: 12 },
  modalContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalInner: { padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  modalBody: { paddingBottom: 20 },
  modalUserName: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  modalUserEmail: { fontSize: 14, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  saveButton: { marginTop: 20, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
});
