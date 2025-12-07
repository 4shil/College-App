import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AnimatedBackground, GlassCard } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { exportAuditLogs } from '../../../lib/export';

interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: any;
  ip_address: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: '#10B981',
  UPDATE: '#3B82F6',
  DELETE: '#EF4444',
  LOGIN: '#8B5CF6',
  LOGOUT: '#6B7280',
  APPROVE: '#059669',
  REJECT: '#DC2626',
};

export default function AuditLogsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');

  const actionTypes = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT'];
  const entityTypes = ['ALL', 'USER', 'STUDENT', 'TEACHER', 'COURSE', 'EXAM', 'NOTICE', 'FEE', 'BOOK'];

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        // Table might not exist yet - show empty state
        console.log('Audit logs table not found:', error.message);
        setLogs([]);
        return;
      }
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error fetching logs:', error.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.entity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchesEntity = selectedEntity === 'ALL' || log.entity_type === selectedEntity;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const exportToCSV = async () => {
    if (filteredLogs.length === 0) {
      alert('No logs to export');
      return;
    }
    try {
      await exportAuditLogs(filteredLogs, 'csv');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export logs');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Audit Logs</Text>
          <TouchableOpacity onPress={exportToCSV} style={styles.exportButton}>
            <FontAwesome5 name="file-export" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.searchContainer, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            borderColor: `${colors.primary}30`
          }]}>
            <FontAwesome5 name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search logs..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Filter Chips - Actions */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Action Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {actionTypes.map((action) => (
              <TouchableOpacity
                key={action}
                onPress={() => setSelectedAction(action)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedAction === action
                      ? colors.primary
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderColor: selectedAction === action ? colors.primary : `${colors.primary}30`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedAction === action ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {action}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Filter Chips - Entities */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Entity Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {entityTypes.map((entity) => (
              <TouchableOpacity
                key={entity}
                onPress={() => setSelectedEntity(entity)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selectedEntity === entity
                      ? colors.primary
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderColor: selectedEntity === entity ? colors.primary : `${colors.primary}30`,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: selectedEntity === entity ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {entity}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.statCard}>
            <GlassCard style={styles.statCardInner}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.primary}20` }]}>
                <FontAwesome5 name="list" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{filteredLogs.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Logs</Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.statCard}>
            <GlassCard style={styles.statCardInner}>
              <View style={[styles.statIcon, { backgroundColor: `${ACTION_COLORS.CREATE}20` }]}>
                <FontAwesome5 name="plus" size={20} color={ACTION_COLORS.CREATE} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {logs.filter(l => l.action === 'CREATE').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Created</Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.statCard}>
            <GlassCard style={styles.statCardInner}>
              <View style={[styles.statIcon, { backgroundColor: `${ACTION_COLORS.UPDATE}20` }]}>
                <FontAwesome5 name="edit" size={20} color={ACTION_COLORS.UPDATE} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {logs.filter(l => l.action === 'UPDATE').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Updated</Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.statCard}>
            <GlassCard style={styles.statCardInner}>
              <View style={[styles.statIcon, { backgroundColor: `${ACTION_COLORS.DELETE}20` }]}>
                <FontAwesome5 name="trash" size={20} color={ACTION_COLORS.DELETE} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {logs.filter(l => l.action === 'DELETE').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Deleted</Text>
            </GlassCard>
          </Animated.View>
        </View>

        {/* Logs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.logsList}>
            {filteredLogs.map((log, index) => (
              <Animated.View
                key={log.id}
                entering={FadeInDown.delay(100 * (index % 10)).springify()}
              >
                <GlassCard style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={[styles.actionBadge, { backgroundColor: `${ACTION_COLORS[log.action] || colors.primary}20` }]}>
                      <Text style={[styles.actionText, { color: ACTION_COLORS[log.action] || colors.primary }]}>
                        {log.action}
                      </Text>
                    </View>
                    <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                      {formatDate(log.created_at)}
                    </Text>
                  </View>
                  
                  <View style={styles.logBody}>
                    <Text style={[styles.logUser, { color: colors.textPrimary }]}>
                      <FontAwesome5 name="user" size={12} color={colors.textSecondary} /> {log.user_name}
                    </Text>
                    <Text style={[styles.logEntity, { color: colors.textSecondary }]}>
                      {log.entity_type} #{log.entity_id.substring(0, 8)}
                    </Text>
                  </View>

                  {log.changes && (
                    <View style={[styles.changesContainer, { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                    }]}>
                      <Text style={[styles.changesLabel, { color: colors.textSecondary }]}>Changes:</Text>
                      <Text style={[styles.changesText, { color: colors.textSecondary }]} numberOfLines={2}>
                        {JSON.stringify(log.changes)}
                      </Text>
                    </View>
                  )}

                  {log.ip_address && (
                    <Text style={[styles.ipAddress, { color: colors.textSecondary }]}>
                      IP: {log.ip_address}
                    </Text>
                  )}
                </GlassCard>
              </Animated.View>
            ))}

            {filteredLogs.length === 0 && (
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="inbox" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No audit logs found
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 16,
  },
  exportButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
  },
  statCardInner: {
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  logsList: {
    gap: 12,
  },
  logCard: {
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 12,
  },
  logBody: {
    marginBottom: 8,
  },
  logUser: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  logEntity: {
    fontSize: 13,
  },
  changesContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  changesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  changesText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  ipAddress: {
    fontSize: 11,
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
