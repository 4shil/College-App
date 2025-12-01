import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { AnimatedBackground, GlassCard, PrimaryButton } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

type NoticeType = 'general' | 'academic' | 'exam' | 'event' | 'urgent';
type NoticeTab = 'all' | 'published' | 'draft';

interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: NoticeType;
  priority: number;
  is_published: boolean;
  publish_date: string | null;
  expiry_date: string | null;
  target_audience: string[];
  created_at: string;
  created_by: {
    full_name: string;
  } | null;
}

const noticeTypeConfig: Record<NoticeType, { icon: string; color: string; label: string }> = {
  general: { icon: 'info-circle', color: '#6366f1', label: 'General' },
  academic: { icon: 'graduation-cap', color: '#10b981', label: 'Academic' },
  exam: { icon: 'file-alt', color: '#f59e0b', label: 'Exam' },
  event: { icon: 'calendar-alt', color: '#8b5cf6', label: 'Event' },
  urgent: { icon: 'exclamation-triangle', color: '#ef4444', label: 'Urgent' },
};

export default function NoticesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();
  const { user, profile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<NoticeTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType>('general');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotices = async () => {
    try {
      let query = supabase
        .from('notices')
        .select(`
          *,
          created_by:profiles!notices_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'published') {
        query = query.eq('is_published', true);
      } else if (activeTab === 'draft') {
        query = query.eq('is_published', false);
      }

      const { data, error } = await query;
      if (error) {
        // Table might not exist yet - show empty state
        if (error.code === 'PGRST205') {
          console.log('Notices table not found - showing empty state');
          setNotices([]);
          return;
        }
        throw error;
      }
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setNotices([]);
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
    await fetchNotices();
    setRefreshing(false);
  };

  const handleCreateNotice = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('notices').insert({
        title: title.trim(),
        content: content.trim(),
        notice_type: noticeType,
        is_published: isPublished,
        publish_date: isPublished ? new Date().toISOString() : null,
        target_audience: ['all'],
        created_by: user?.id,
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
    try {
      const { error } = await supabase
        .from('notices')
        .update({
          is_published: !notice.is_published,
          publish_date: !notice.is_published ? new Date().toISOString() : null,
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
    { key: 'published' as NoticeTab, label: 'Published', count: notices.filter(n => n.is_published).length },
    { key: 'draft' as NoticeTab, label: 'Drafts', count: notices.filter(n => !n.is_published).length },
  ];

  const renderNoticeCard = (notice: Notice, index: number) => {
    const config = noticeTypeConfig[notice.notice_type] || noticeTypeConfig.general;

    return (
      <Animated.View
        key={notice.id}
        entering={FadeInRight.delay(100 + index * 50).duration(300)}
        style={styles.cardWrapper}
      >
        <GlassCard style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <View style={[styles.typeIcon, { backgroundColor: config.color + '20' }]}>
              <FontAwesome5 name={config.icon} size={16} color={config.color} />
            </View>
            <View style={styles.noticeInfo}>
              <Text style={[styles.noticeTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {notice.title}
              </Text>
              <View style={styles.noticeMeta}>
                <View style={[styles.typeBadge, { backgroundColor: config.color + '15' }]}>
                  <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
                </View>
                {!notice.is_published && (
                  <View style={[styles.draftBadge, { backgroundColor: '#64748b20' }]}>
                    <Text style={[styles.draftText, { color: '#64748b' }]}>Draft</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => handleDeleteNotice(notice.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.noticeContent, { color: colors.textSecondary }]} numberOfLines={3}>
            {notice.content}
          </Text>

          <View style={styles.noticeFooter}>
            <View style={styles.footerLeft}>
              <FontAwesome5 name="calendar" size={11} color={colors.textMuted} />
              <Text style={[styles.footerText, { color: colors.textMuted }]}>
                {formatDate(notice.created_at)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.publishToggle,
                { backgroundColor: notice.is_published ? '#10b98115' : '#f59e0b15' },
              ]}
              onPress={() => handleTogglePublish(notice)}
            >
              <Ionicons
                name={notice.is_published ? 'eye' : 'eye-off'}
                size={14}
                color={notice.is_published ? '#10b981' : '#f59e0b'}
              />
              <Text
                style={[
                  styles.publishText,
                  { color: notice.is_published ? '#10b981' : '#f59e0b' },
                ]}
              >
                {notice.is_published ? 'Published' : 'Unpublished'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
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
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Tab Bar */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: colors.primary + '20' },
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
                      activeTab === tab.key ? colors.primary : colors.textMuted + '30',
                  },
                ]}
              >
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
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
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : notices.length > 0 ? (
            notices.map((n, i) => renderNoticeCard(n, i))
          ) : (
            renderEmptyState()
          )}
        </ScrollView>

        {/* Create Notice Modal */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? '#1a1a2e' : '#fff' },
              ]}
            >
              <View style={styles.modalHeader}>
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
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      color: colors.textPrimary,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      color: colors.textPrimary,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
                            noticeType === key ? config.color + '20' : 'transparent',
                          borderColor: noticeType === key ? config.color : colors.textMuted + '30',
                        },
                      ]}
                      onPress={() => setNoticeType(key as NoticeType)}
                    >
                      <FontAwesome5
                        name={config.icon}
                        size={14}
                        color={noticeType === key ? config.color : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          { color: noticeType === key ? config.color : colors.textMuted },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.publishRow}
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
                        backgroundColor: isPublished ? colors.primary : colors.textMuted + '30',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleKnob,
                        { transform: [{ translateX: isPublished ? 20 : 2 }] },
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
    color: '#fff',
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
    borderTopColor: 'rgba(255,255,255,0.05)',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    borderTopColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: '#fff',
  },
  modalFooter: {
    padding: 20,
    paddingBottom: 40,
  },
});
