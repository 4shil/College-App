import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { AnimatedBackground, Card, PrimaryButton, LoadingIndicator, SolidButton } from '../../components/ui';
import { Restricted } from '../../components/Restricted';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';
import { withAlpha } from '../../theme/colorUtils';

type NoticeType = 'general' | 'academic' | 'exam' | 'event' | 'urgent';
type NoticeTab = 'all' | 'active' | 'inactive';

type NoticeScope =
  | 'college'
  | 'department'
  | 'class'
  | 'exam'
  | 'event'
  | 'library'
  | 'bus'
  | 'canteen'
  | 'fee';

type NoticePriority = 'low' | 'normal' | 'high' | 'urgent';

interface Notice {
  id: string;
  title: string;
  content: string;
  scope: NoticeScope;
  priority: NoticePriority;
  is_active: boolean;
  publish_at: string | null;
  expires_at: string | null;
  created_at: string;
  author: {
    full_name: string;
  } | null;
}

const noticeTypeConfig: Record<NoticeType, { icon: string; colorKey: 'info' | 'success' | 'warning' | 'primary' | 'error'; label: string }> = {
  general: { icon: 'info-circle', colorKey: 'info', label: 'General' },
  academic: { icon: 'graduation-cap', colorKey: 'success', label: 'Academic' },
  exam: { icon: 'file-alt', colorKey: 'warning', label: 'Exam' },
  event: { icon: 'calendar-alt', colorKey: 'primary', label: 'Event' },
  urgent: { icon: 'exclamation-triangle', colorKey: 'error', label: 'Urgent' },
};

export default function NoticesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user, profile } = useAuthStore();
  const { hasPermission } = useRBAC();

  const modalBackdropColor = isDark
    ? withAlpha(colors.background, 0.75)
    : withAlpha(colors.textPrimary, 0.5);

  const typeColorByKey = {
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    primary: colors.primary,
    error: colors.error,
  } as const;

  const canPostGlobalNotices = hasPermission(PERMISSIONS.POST_GLOBAL_NOTICES);
  const canPostDeptNotices = hasPermission(PERMISSIONS.POST_DEPT_NOTICES);
  const canManageNotices = canPostGlobalNotices || canPostDeptNotices;

  const [activeTab, setActiveTab] = useState<NoticeTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [tableMissing, setTableMissing] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>('general');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const deriveDisplayType = (notice: Pick<Notice, 'scope' | 'priority'>): NoticeType => {
    if (notice.priority === 'urgent') return 'urgent';
    if (notice.scope === 'exam') return 'exam';
    if (notice.scope === 'event') return 'event';
    if (notice.scope === 'department') return 'academic';
    return 'general';
  };

  const mapTypeToScopeAndPriority = (type: NoticeType): { scope: NoticeScope; priority: NoticePriority } => {
    switch (type) {
      case 'academic':
        return { scope: 'department', priority: 'normal' };
      case 'exam':
        return { scope: 'exam', priority: 'normal' };
      case 'event':
        return { scope: 'event', priority: 'normal' };
      case 'urgent':
        return { scope: 'college', priority: 'urgent' };
      case 'general':
      default:
        return { scope: 'college', priority: 'normal' };
    }
  };

  const fetchNotices = async () => {
    try {
      setErrorText(null);
      setTableMissing(false);
      let query = supabase
        .from('notices')
        .select(`
          id,
          title,
          content,
          scope,
          priority,
          is_active,
          publish_at,
          expires_at,
          created_at,
          author:profiles!notices_author_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'active') {
        query = query.eq('is_active', true);
      } else if (activeTab === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;
      if (error) {
        // Table might not exist yet - show empty state
        if (error.code === 'PGRST205') {
          console.log('Notices table not found - showing empty state');
          setTableMissing(true);
          setNotices([]);
          return;
        }
        throw error;
      }
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setNotices([]);
      setErrorText('Unable to load notices. Pull to refresh or retry.');
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await fetchNotices();
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const onRefresh = async () => {
    setRefreshing(true);
    setErrorText(null);
    await fetchNotices();
    setRefreshing(false);
  };

  const handleCreateNotice = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!canManageNotices) {
      Alert.alert('Access denied', 'You do not have permission to create notices.');
      return;
    }

    setSaving(true);
    try {
      const { scope, priority } = mapTypeToScopeAndPriority(noticeType);

      // Enforce scope based on permission
      const effectiveScope: NoticeScope = scope === 'college' && !canPostGlobalNotices ? 'department' : scope;
      if (effectiveScope === 'college' && !canPostGlobalNotices) {
        Alert.alert('Access denied', 'You do not have permission to post global notices.');
        return;
      }

      const { error } = await supabase.from('notices').insert({
        title: title.trim(),
        content: content.trim(),
        scope: effectiveScope,
        priority,
        is_active: isPublished,
        publish_at: isPublished ? new Date().toISOString() : null,
        department_id: effectiveScope === 'department' ? (profile as any)?.department_id ?? null : null,
        author_id: user?.id,
      });

      if (error) throw error;

      Alert.alert('Success', 'Notice created successfully');
      setShowModal(false);
      resetForm();
      await fetchNotices();
    } catch (error) {
      console.error('Error creating notice:', error);
      Alert.alert('Error', 'Failed to create notice');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    Alert.alert(
      'Delete Notice',
      'Are you sure you want to delete this notice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notices')
                .delete()
                .eq('id', noticeId);

              if (error) throw error;
              Alert.alert('Success', 'Notice deleted');
              await fetchNotices();
            } catch (error) {
              console.error('Error deleting notice:', error);
              Alert.alert('Error', 'Failed to delete notice');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublish = async (notice: Notice) => {
    if (!canManageNotices) {
      Alert.alert('Access denied', 'You do not have permission to update notices.');
      return;
    }

    try {
      const { error } = await supabase
        .from('notices')
        .update({
          is_active: !notice.is_active,
          publish_at: !notice.is_active ? new Date().toISOString() : null,
        })
        .eq('id', notice.id);

      if (error) throw error;
      await fetchNotices();
    } catch (error) {
      console.error('Error toggling publish:', error);
      Alert.alert('Error', 'Failed to update notice');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setNoticeType('general');
    setIsPublished(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const tabs = [
    { key: 'all' as NoticeTab, label: 'All', count: notices.length },
    { key: 'active' as NoticeTab, label: 'Active', count: notices.filter(n => n.is_active).length },
    { key: 'inactive' as NoticeTab, label: 'Inactive', count: notices.filter(n => !n.is_active).length },
  ];

  const renderNoticeCard = (notice: Notice, index: number) => {
    const displayType = deriveDisplayType(notice);
    const config = noticeTypeConfig[displayType] || noticeTypeConfig.general;
    const typeColor = typeColorByKey[config.colorKey];

    return (
      <Animated.View
        key={notice.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <Card style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <View style={[styles.typeIcon, { backgroundColor: withAlpha(typeColor, 0.125) }]}>
              <FontAwesome5 name={config.icon} size={16} color={typeColor} />
            </View>
            <View style={styles.noticeInfo}>
              <Text style={[styles.noticeTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {notice.title}
              </Text>
              <View style={styles.noticeMeta}>
                <View style={[styles.typeBadge, { backgroundColor: withAlpha(typeColor, 0.08) }]}>
                  <Text style={[styles.typeText, { color: typeColor }]}>{config.label}</Text>
                </View>
                {!notice.is_active && (
                  <View style={[styles.draftBadge, { backgroundColor: withAlpha(colors.textMuted, 0.125) }]}>
                    <Text style={[styles.draftText, { color: colors.textMuted }]}>Draft</Text>
                  </View>
                )}
              </View>
            </View>
            <Restricted
              permissions={[PERMISSIONS.POST_GLOBAL_NOTICES, PERMISSIONS.POST_DEPT_NOTICES]}
              fallback={<View />}
            >
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={() => handleDeleteNotice(notice.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </Restricted>
          </View>

          <Text style={[styles.noticeContent, { color: colors.textSecondary }]} numberOfLines={3}>
            {notice.content}
          </Text>

          <View style={[styles.noticeFooter, { borderTopColor: withAlpha(colors.textPrimary, 0.05) }]}>
            <View style={styles.footerLeft}>
              <FontAwesome5 name="calendar" size={11} color={colors.textMuted} />
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                {formatDate(notice.created_at)}
              </Text>
            </View>
            <Restricted
              permissions={[PERMISSIONS.POST_GLOBAL_NOTICES, PERMISSIONS.POST_DEPT_NOTICES]}
              fallback={<View />}
            >
              <TouchableOpacity
                style={[
                  styles.publishToggle,
                  {
                    backgroundColor: notice.is_active
                      ? withAlpha(colors.success, 0.08)
                      : withAlpha(colors.warning, 0.08),
                  },
                ]}
                onPress={() => handleTogglePublish(notice)}
              >
                <Ionicons
                  name={notice.is_active ? 'eye' : 'eye-off'}
                  size={14}
                  color={notice.is_active ? colors.success : colors.warning}
                />
                <Text
                  style={[
                    styles.publishText,
                    { color: notice.is_active ? colors.success : colors.warning },
                  ]}
                >
                  {notice.is_active ? 'Active' : 'Inactive'}
                </Text>
              </TouchableOpacity>
            </Restricted>
          </View>
        </Card>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome5 name="bell-slash" size={48} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No Notices</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        Create your first notice to get started
      </Text>
    </View>
  );

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Notices</Text>
          <Restricted
            permissions={[PERMISSIONS.POST_GLOBAL_NOTICES, PERMISSIONS.POST_DEPT_NOTICES]}
            fallback={<View />}
          >
            <SolidButton
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add" size={22} color={colors.textInverse} />
            </SolidButton>
          </Restricted>
        </Animated.View>

        {/* Tab Bar */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: withAlpha(colors.primary, 0.125) },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab.key ? colors.primary : colors.textMuted },
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      activeTab === tab.key
                        ? colors.primary
                        : withAlpha(colors.textMuted, 0.19),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    { color: activeTab === tab.key ? colors.textInverse : colors.textSecondary },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator size="large" color={colors.primary} />
            </View>
          ) : errorText ? (
            <Card style={styles.stateCard}>
              <View style={styles.stateHeader}>
                <Ionicons name="warning-outline" size={18} color={colors.warning} />
                <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>Couldn’t load notices</Text>
              </View>
              <Text style={[styles.stateBody, { color: colors.textSecondary }]}>{errorText}</Text>
              <SolidButton
                style={[styles.stateAction, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  setLoading(true);
                  try {
                    await fetchNotices();
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <Ionicons name="refresh" size={18} color={colors.textInverse} />
                <Text style={[styles.stateActionText, { color: colors.textInverse }]}>Retry</Text>
              </SolidButton>
            </Card>
          ) : tableMissing ? (
            <Card style={styles.stateCard}>
              <View style={styles.stateHeader}>
                <Ionicons name="information-circle-outline" size={18} color={colors.info} />
                <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>Notices table not found</Text>
              </View>
              <Text style={[styles.stateBody, { color: colors.textSecondary }]}
              >
                The database table `notices` is missing (or not exposed). Create/apply migrations then refresh.
              </Text>
            </Card>
          ) : notices.length > 0 ? (
            notices.map((n, i) => renderNoticeCard(n, i))
          ) : (
            renderEmptyState()
          )}
        </ScrollView>

        {/* Create Notice Modal */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={[styles.modalOverlay, { backgroundColor: modalBackdropColor }]}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.cardBorder, borderBottomWidth: colors.borderWidth },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Create Notice
                </Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title *</Text>
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
                  placeholder="Enter notice title"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Content *</Text>
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
                  placeholder="Enter notice content"
                  placeholderTextColor={colors.textMuted}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
                <View style={styles.typeGrid}>
                  {Object.entries(noticeTypeConfig).map(([key, config]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.typeOption,
                        {
                          backgroundColor:
                            noticeType === key
                              ? withAlpha(typeColorByKey[config.colorKey], 0.125)
                              : 'transparent',
                          borderColor:
                            noticeType === key
                              ? typeColorByKey[config.colorKey]
                              : withAlpha(colors.textMuted, 0.19),
                        },
                      ]}
                      onPress={() => setNoticeType(key as NoticeType)}
                    >
                      <FontAwesome5
                        name={config.icon}
                        size={14}
                        color={noticeType === key ? typeColorByKey[config.colorKey] : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          {
                            color:
                              noticeType === key
                                ? typeColorByKey[config.colorKey]
                                : colors.textMuted,
                          },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.publishRow,
                    { borderTopColor: colors.cardBorder, borderTopWidth: colors.borderWidth },
                  ]}
                  onPress={() => setIsPublished(!isPublished)}
                >
                  <View>
                    <Text style={[styles.publishLabel, { color: colors.textPrimary }]}>
                      Publish immediately
                    </Text>
                    <Text style={[styles.publishHint, { color: colors.textMuted }]}>
                      Make this notice visible to all users
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggle,
                      {
                        backgroundColor: isPublished
                          ? colors.primary
                          : withAlpha(colors.textMuted, 0.19),
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        {
                          backgroundColor: colors.textInverse,
                          transform: [{ translateX: isPublished ? 20 : 2 }],
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalFooter}>
                <PrimaryButton
                  title={saving ? 'Creating...' : 'Create Notice'}
                  onPress={handleCreateNotice}
                  disabled={saving || !title.trim() || !content.trim()}
                />
              </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 22,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  cardWrapper: {
    marginBottom: 14,
  },
  noticeCard: {
    padding: 16,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeInfo: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  noticeMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  draftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  draftText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moreBtn: {
    padding: 6,
  },
  noticeContent: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
  },
  publishToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  publishText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  stateCard: {
    padding: 16,
    marginTop: 12,
  },
  stateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  stateBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  stateAction: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  stateActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  publishRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  publishLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  publishHint: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 40,
  },
});
