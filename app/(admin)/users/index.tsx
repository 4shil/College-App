import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, SlideInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

import { AnimatedBackground, Card, GlassCard, GlassInput, IconBadge, PrimaryButton, LoadingIndicator, SolidButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { PERMISSIONS, useRBAC } from '../../../hooks/useRBAC';
import { withAlpha } from '../../../theme/colorUtils';

type UserTab = 'teachers' | 'students' | 'admins' | 'pending';
type UserStatus = 'active' | 'suspended' | 'inactive' | 'pending';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: UserStatus;
  primary_role: string | null;
  department_id: string | null;
  created_at: string;
  avatar_url: string | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Role {
  id: string;
  name: string;
  display_name: string;
  category: string;
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const modalBackdropColor = isDark ? withAlpha(colors.background, 0.75) : withAlpha(colors.textPrimary, 0.5);
  const profile = useAuthStore(s => s.profile);
  const { hasPermission, loading: rbacLoading } = useRBAC();

  const canViewAllUsers = hasPermission(PERMISSIONS.VIEW_ALL_USERS);
  const canViewDeptUsers = hasPermission(PERMISSIONS.VIEW_DEPT_USERS);
  const canBlockAllUsers = hasPermission(PERMISSIONS.BLOCK_UNBLOCK_USERS);
  const canBlockDeptUsers = hasPermission(PERMISSIONS.BLOCK_DEPT_USERS);
  const canCreateDeleteUsers = hasPermission(PERMISSIONS.CREATE_DELETE_ADMINS);

  const viewerDepartmentId = profile?.department_id ?? null;
  const viewerScope: 'all' | 'department' | 'none' = canViewAllUsers
    ? 'all'
    : canViewDeptUsers
      ? 'department'
      : 'none';

  const canManageTargetUser = (target: User, action: 'view' | 'block' | 'delete' | 'role' | 'approve') => {
    if (action === 'view') {
      if (canViewAllUsers) return true;
      if (canViewDeptUsers) return !!viewerDepartmentId && target.department_id === viewerDepartmentId;
      return false;
    }

    if (action === 'block' || action === 'approve') {
      if (canBlockAllUsers) return true;
      if (canBlockDeptUsers) return !!viewerDepartmentId && target.department_id === viewerDepartmentId;
      return false;
    }

    if (action === 'delete' || action === 'role') {
      // Currently modeled as an admin-only capability.
      if (!canCreateDeleteUsers) return false;
      if (canViewAllUsers) return true;
      if (canViewDeptUsers) return !!viewerDepartmentId && target.department_id === viewerDepartmentId;
      return false;
    }

    return false;
  };

  const [activeTab, setActiveTab] = useState<UserTab>('teachers');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states for adding user
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDepartment, setFormDepartment] = useState('');

  // Stats
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    admins: 0,
    pending: 0,
  });

  const tabs = React.useMemo(
    () => [
      { key: 'teachers' as UserTab, label: 'Teachers', icon: 'chalkboard-teacher' },
      { key: 'students' as UserTab, label: 'Students', icon: 'user-graduate' },
      { key: 'admins' as UserTab, label: 'Admins', icon: 'user-shield' },
      { key: 'pending' as UserTab, label: 'Pending', icon: 'user-clock' },
    ],
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setErrorText(null);
      if (rbacLoading) return;
      if (viewerScope === 'none') {
        setUsers([]);
        setStats({ teachers: 0, students: 0, admins: 0, pending: 0 });
        return;
      }
      if (viewerScope === 'department' && !viewerDepartmentId) {
        setUsers([]);
        setStats({ teachers: 0, students: 0, admins: 0, pending: 0 });
        return;
      }

      // Fetch users based on tab
      let roleFilter: string[] = [];
      let statusFilter: string = 'active';

      switch (activeTab) {
        case 'teachers':
          roleFilter = ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod'];
          break;
        case 'students':
          roleFilter = ['student'];
          break;
        case 'admins':
          roleFilter = ['super_admin', 'principal', 'department_admin', 'exam_cell_admin', 'library_admin', 'bus_admin', 'canteen_admin', 'finance_admin'];
          break;
        case 'pending':
          statusFilter = 'pending';
          break;
      }

      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (viewerScope === 'department' && viewerDepartmentId) {
        query = query.eq('department_id', viewerDepartmentId);
      }

      if (activeTab === 'pending') {
        query = query.eq('status', 'pending');
      } else {
        query = query.in('primary_role', roleFilter).neq('status', 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter((u: User) =>
          u.full_name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search)
        );
      }

      setUsers(filtered);

      // Fetch stats
      const baseStatsFilter = (q: any) => {
        if (viewerScope === 'department' && viewerDepartmentId) {
          return q.eq('department_id', viewerDepartmentId);
        }
        return q;
      };

      const [teachersRes, studentsRes, adminsRes, pendingRes] = await Promise.all([
        baseStatsFilter(
          supabase.from('profiles').select('id', { count: 'exact', head: true }).in('primary_role', ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod']).neq('status', 'pending')
        ),
        baseStatsFilter(
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('primary_role', 'student').neq('status', 'pending')
        ),
        baseStatsFilter(
          supabase.from('profiles').select('id', { count: 'exact', head: true }).in('primary_role', ['super_admin', 'principal', 'department_admin', 'exam_cell_admin', 'library_admin', 'bus_admin', 'canteen_admin', 'finance_admin']).neq('status', 'pending')
        ),
        baseStatsFilter(
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ),
      ]);

      setStats({
        teachers: teachersRes.count || 0,
        students: studentsRes.count || 0,
        admins: adminsRes.count || 0,
        pending: pendingRes.count || 0,
      });

      // Fetch departments and roles
      const [deptsRes, rolesRes] = await Promise.all([
        supabase.from('departments').select('id, name, code').eq('is_active', true),
        supabase.from('roles').select('id, name, display_name, category').eq('is_active', true),
      ]);

      setDepartments(deptsRes.data || []);
      setRoles(rolesRes.data || []);

    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setErrorText('Unable to load users right now. Pull to refresh or retry.');
    }
  }, [activeTab, searchQuery, rbacLoading, viewerScope, viewerDepartmentId]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Real-time subscription for user updates
  useEffect(() => {
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Profile change:', payload.eventType);
          fetchData();
        }
      )
      .subscribe();

    const rolesChannel = supabase
      .channel('user-roles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
        },
        (payload) => {
          console.log('User roles change:', payload.eventType);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(rolesChannel);
    };
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSuspendUser = async (user: User) => {
    if (!canManageTargetUser(user, 'block')) {
      Alert.alert('Access denied', 'You do not have permission to suspend this user.');
      return;
    }
    Alert.alert(
      'Suspend User',
      `Are you sure you want to suspend ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await supabase.functions.invoke('admin-manage-user', {
                body: {
                  action: 'set_status',
                  target_user_id: user.id,
                  status: 'suspended',
                },
              });
              if (error) throw error;
              if (!data?.ok) throw new Error('Failed to suspend user');
              Alert.alert('Success', 'User suspended successfully');
              fetchData();
            } catch (error) {
              console.error('Error suspending user:', error);
              Alert.alert('Error', 'Failed to suspend user');
            }
          },
        },
      ]
    );
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const target = users.find(u => u.id === userId);
      if (target && !canManageTargetUser(target, 'block')) {
        Alert.alert('Access denied', 'You do not have permission to activate this user.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: {
          action: 'set_status',
          target_user_id: userId,
          status: 'active',
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error('Failed to activate user');
      Alert.alert('Success', 'User activated successfully');
      fetchData();
    } catch (error) {
      console.error('Error activating user:', error);
      Alert.alert('Error', 'Failed to activate user');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!canManageTargetUser(user, 'delete')) {
      Alert.alert('Access denied', 'You do not have permission to delete this user.');
      return;
    }
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${user.full_name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete via privileged function (deletes auth user; profile cascades)
              const { data, error } = await supabase.functions.invoke('admin-manage-user', {
                body: {
                  action: 'delete_user',
                  target_user_id: user.id,
                },
              });
              if (error) throw error;
              if (!data?.ok) throw new Error('Failed to delete user');
              Alert.alert('Success', 'User deleted successfully');
              fetchData();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleApproveUser = async (user: User) => {
    try {
      if (!canManageTargetUser(user, 'approve')) {
        Alert.alert('Access denied', 'You do not have permission to approve this user.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: {
          action: 'set_status',
          target_user_id: user.id,
          status: 'active',
        },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error('Failed to approve user');
      Alert.alert('Success', 'User approved successfully');
      fetchData();
    } catch (error) {
      console.error('Error approving user:', error);
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const handleRejectUser = async (user: User) => {
    if (!canManageTargetUser(user, 'approve')) {
      Alert.alert('Access denied', 'You do not have permission to reject this user.');
      return;
    }
    Alert.alert(
      'Reject User',
      `Are you sure you want to reject ${user.full_name}'s registration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await supabase.functions.invoke('admin-manage-user', {
                body: {
                  action: 'set_status',
                  target_user_id: user.id,
                  status: 'inactive',
                },
              });
              if (error) throw error;
              if (!data?.ok) throw new Error('Failed to reject user');
              Alert.alert('Success', 'Registration rejected');
              fetchData();
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const target = users.find(u => u.id === userId);
      if (target && !canManageTargetUser(target, 'role')) {
        Alert.alert('Access denied', 'You do not have permission to change roles.');
        return;
      }
      setSaving(true);
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: {
          action: 'set_role',
          target_user_id: userId,
          primary_role: newRole,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error('Failed to update role');

      Alert.alert('Success', 'Role updated successfully');
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const openRoleModal = (user: User) => {
    if (!canManageTargetUser(user, 'role')) {
      Alert.alert('Access denied', 'You do not have permission to change roles.');
      return;
    }
    setSelectedUser(user);
    setFormRole(user.primary_role || '');
    setShowRoleModal(true);
  };

  const openAddUserModal = () => {
    if (!canCreateDeleteUsers) {
      Alert.alert('Access denied', 'You do not have permission to create users.');
      return;
    }
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormRole('');
    setFormDepartment('');
    setShowAddModal(true);
  };

  const handleCreateUser = async () => {
    if (!canCreateDeleteUsers) {
      Alert.alert('Access denied', 'You do not have permission to create users.');
      return;
    }
    if (!formName.trim() || !formEmail.trim() || !formRole || !formPassword) {
      Alert.alert('Validation Error', 'Name, email, password, and role are required');
      return;
    }
    if (formPassword.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formEmail.trim(),
          password: formPassword,
          full_name: formName.trim(),
          phone: formPhone.trim() || null,
          primary_role: formRole,
          department_id: formDepartment || null,
        },
      });

      if (error) throw error;
      if (!data?.user_id) throw new Error('User creation failed');

      Alert.alert('Success', 'User created successfully');
      setShowAddModal(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      Alert.alert('Error', error.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return colors.success;
      case 'suspended': return colors.error;
      case 'inactive': return colors.textMuted;
      case 'pending': return colors.warning;
      default: return colors.warning;
    }
  };

  const renderUserCard = (user: User, index: number) => (
    <Animated.View
      key={user.id}
      entering={FadeInRight.delay(100 + index * 50).duration(300)}
      style={styles.userCardWrapper}
    >
      <Card style={styles.userCard}>
        <View style={styles.userHeader}>
          <IconBadge family="fa5" name="user" tone="primary" size={18} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>
              {user.full_name || 'No Name'}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(user.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
              {user.status}
            </Text>
          </View>
        </View>

        <View style={styles.userMeta}>
          <View style={styles.metaItem}>
            <FontAwesome5 name="id-badge" size={12} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {user.primary_role?.replace('_', ' ') || 'No role'}
            </Text>
          </View>
          {user.phone && (
            <View style={styles.metaItem}>
              <FontAwesome5 name="phone" size={12} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{user.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          {activeTab === 'pending' ? (
            <>
              {canManageTargetUser(user, 'approve') && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    onPress={() => handleApproveUser(user)}
                  >
                    <FontAwesome5 name="check" size={14} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    onPress={() => handleRejectUser(user)}
                  >
                    <FontAwesome5 name="times" size={14} color={colors.error} />
                    <Text style={[styles.actionText, { color: colors.error }]}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <>
              {activeTab === 'teachers' && canManageTargetUser(user, 'role') && (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  onPress={() => openRoleModal(user)}
                >
                  <FontAwesome5 name="user-tag" size={14} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Role</Text>
                </TouchableOpacity>
              )}
              {canManageTargetUser(user, 'block') && (
                user.status === 'active' ? (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    onPress={() => handleSuspendUser(user)}
                  >
                    <FontAwesome5 name="ban" size={14} color={colors.warning} />
                    <Text style={[styles.actionText, { color: colors.warning }]}>Suspend</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        borderWidth: colors.borderWidth,
                      },
                    ]}
                    onPress={() => handleActivateUser(user.id)}
                  >
                    <FontAwesome5 name="check-circle" size={14} color={colors.success} />
                    <Text style={[styles.actionText, { color: colors.success }]}>Activate</Text>
                  </TouchableOpacity>
                )
              )}
              {canManageTargetUser(user, 'delete') && (
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  onPress={() => handleDeleteUser(user)}
                >
                  <FontAwesome5 name="trash" size={14} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </Card>
    </Animated.View>
  );

  const renderRoleModal = () => (
    <Modal visible={showRoleModal} transparent animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
        <GlassCard intensity={40} style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            Change Role for {selectedUser?.full_name}
          </Text>
          
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Picker
              selectedValue={formRole}
              onValueChange={setFormRole}
              style={{ color: colors.textPrimary }}
              dropdownIconColor={colors.textMuted}
            >
              <Picker.Item label="Select Role" value="" />
              {roles.filter(r => r.category === 'teacher' || r.category === 'admin').map(role => (
                <Picker.Item key={role.id} label={role.display_name} value={role.name} />
              ))}
            </Picker>
          </View>

          <View style={styles.modalActions}>
            <PrimaryButton
              title="Cancel"
              onPress={() => { setShowRoleModal(false); setSelectedUser(null); }}
              variant="outline"
              size="medium"
              style={{ flex: 1 }}
            />
            <PrimaryButton
              title="Save"
              onPress={() => selectedUser && handleChangeRole(selectedUser.id, formRole)}
              loading={saving}
              disabled={saving || !formRole}
              size="medium"
              style={{ flex: 1 }}
            />
          </View>
        </GlassCard>
      </View>
    </Modal>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>User Management</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Manage all users in the system
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {canCreateDeleteUsers && (
              <>
                <TouchableOpacity
                  style={[
                    styles.roleBtn,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                      borderWidth: colors.borderWidth,
                      marginRight: 8,
                    },
                  ]}
                  onPress={() => router.push('/(admin)/users/assign-roles')}
                >
                  <FontAwesome5 name="user-shield" size={18} color={colors.primary} />
                </TouchableOpacity>
                <SolidButton
                  style={[styles.addBtn, { backgroundColor: colors.primary }]}
                  onPress={openAddUserModal}
                >
                  <Ionicons name="add" size={22} color={colors.textInverse} />
                </SolidButton>
              </>
            )}
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const accentColor = isActive ? colors.primary : colors.textMuted;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: isActive ? colors.primary : colors.inputBorder,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <FontAwesome5 name={tab.icon} size={18} color={accentColor} />
                  <Text style={[styles.statValue, { color: accentColor }]}>{stats[tab.key]}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.searchContainer}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search users..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Users List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {loading ? (
            <LoadingIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : errorText ? (
            <Card style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Couldn’t load users</Text>
              </View>
              <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{errorText}</Text>
              <SolidButton
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  setLoading(true);
                  try {
                    await fetchData();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Ionicons name="refresh" size={18} color={colors.textInverse} />
                <Text style={[styles.retryText, { color: colors.textInverse }]}>Retry</Text>
              </SolidButton>
            </Card>
          ) : users.length === 0 ? (
            <View style={styles.emptyState}>
              <IconBadge family="fa5" name="users-slash" tone="primary" size={34} style={styles.emptyIcon} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Users Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {viewerScope === 'none'
                  ? 'You do not have access to view users.'
                  : viewerScope === 'department' && !viewerDepartmentId
                    ? 'Your profile is missing a department. Set a department then retry.'
                    : searchQuery
                      ? 'Try a different search term.'
                      : activeTab === 'pending'
                        ? 'No pending approvals.'
                        : 'No users in this category yet.'}
              </Text>
            </View>
          ) : (
            users.map((user, index) => renderUserCard(user, index))
          )}
        </ScrollView>

        {renderRoleModal()}

        {/* Add User Modal */}
        <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
          <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
            <GlassCard intensity={40} style={styles.modalContent}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Create New User</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={[{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }]}>Full Name *</Text>
                    <GlassInput
                      placeholder="Enter full name"
                      value={formName}
                      onChangeText={setFormName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View>
                    <Text style={[{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }]}>Email *</Text>
                    <GlassInput
                      placeholder="user@example.com"
                      value={formEmail}
                      onChangeText={setFormEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text style={[{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }]}>Password *</Text>
                    <GlassInput
                      placeholder="Enter password"
                      value={formPassword}
                      onChangeText={setFormPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>

                  <View>
                    <Text style={[{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }]}>Phone</Text>
                    <GlassInput
                      placeholder="1234567890"
                      value={formPhone}
                      onChangeText={setFormPhone}
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View>
                    <Text style={[{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }]}>Role *</Text>
                    <View
                      style={[
                        styles.pickerContainer,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.inputBorder,
                          borderWidth: colors.borderWidth,
                        },
                      ]}
                    >
                      <Picker
                        selectedValue={formRole}
                        onValueChange={setFormRole}
                        style={{ color: colors.textPrimary }}
                        dropdownIconColor={colors.textMuted}
                      >
                        <Picker.Item label="Select Role" value="" />
                        {roles.map(role => (
                          <Picker.Item key={role.id} label={role.display_name} value={role.name} />
                        ))}
                      </Picker>
                    </View>
                  </View>

                  {(formRole === 'student' || ['subject_teacher', 'class_teacher', 'mentor', 'coordinator', 'hod'].includes(formRole)) && (
                    <View>
                      <Text style={[{ color: colors.textSecondary, fontSize: 13, marginBottom: 6 }]}>Department</Text>
                      <View
                        style={[
                          styles.pickerContainer,
                          {
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.inputBorder,
                            borderWidth: colors.borderWidth,
                          },
                        ]}
                      >
                        <Picker
                          selectedValue={formDepartment}
                          onValueChange={setFormDepartment}
                          style={{ color: colors.textPrimary }}
                          dropdownIconColor={colors.textMuted}
                        >
                          <Picker.Item label="Select Department" value="" />
                          {departments.map(dept => (
                            <Picker.Item key={dept.id} label={`${dept.name} (${dept.code})`} value={dept.id} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <PrimaryButton
                  title="Cancel"
                  onPress={() => setShowAddModal(false)}
                  variant="outline"
                  size="medium"
                  style={{ flex: 1 }}
                />
                <PrimaryButton
                  title="Create"
                  onPress={handleCreateUser}
                  loading={saving}
                  disabled={saving}
                  size="medium"
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          </View>
        </Modal>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { padding: 8, marginRight: 12 },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  roleBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerContent: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  statsContainer: { marginBottom: 16 },
  statsScroll: { paddingHorizontal: 20, gap: 10 },
  statCard: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 0, minWidth: 85 },
  statValue: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  statLabel: { fontSize: 11, marginTop: 2 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, gap: 12, borderWidth: 1, borderColor: 'transparent' },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  userCardWrapper: { marginBottom: 14 },
  userCard: { padding: 16, borderRadius: 16 },
  userHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  userMeta: { flexDirection: 'row', marginTop: 12, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12 },
  actionRow: { flexDirection: 'row', marginTop: 14, gap: 8, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, gap: 6 },
  actionText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 18 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 13, marginTop: 4 },
  errorCard: { marginTop: 18 },
  errorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorTitle: { fontSize: 16, fontWeight: '700' },
  errorSubtitle: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  retryBtn: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 8 },
  retryText: { fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 24 },
  modalContent: { padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  pickerContainer: { borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '600' },
});
