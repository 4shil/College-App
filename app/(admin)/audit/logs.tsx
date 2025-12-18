import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
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
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

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
        setLogs([]);
        return;
      }
      setLogs(data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.user_name.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity_type.toLowerCase().includes(q);

    return (
      matchesSearch &&
      (selectedAction === 'ALL' || log.action === selectedAction) &&
      (selectedEntity === 'ALL' || log.entity_type === selectedEntity)
    );
  });

  const exportToCSV = async () => {
    if (!filteredLogs.length) return alert('No logs to export');
    await exportAuditLogs(filteredLogs, 'csv');
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <FontAwesome5 name="arrow-left" size={18} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Audit Logs</Text>

          <TouchableOpacity style={styles.iconBtn} onPress={exportToCSV}>
            <FontAwesome5 name="file-export" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderColor: `${colors.primary}30`,
            },
          ]}
        >
          <FontAwesome5 name="search" size={14} color={colors.textSecondary} />
          <TextInput
            placeholder="Search logs..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>

        {/* Filters */}
        {[
          { label: 'Action Type', data: actionTypes, value: selectedAction, set: setSelectedAction },
          { label: 'Entity Type', data: entityTypes, value: selectedEntity, set: setSelectedEntity },
        ].map((f, i) => (
          <View key={i}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{f.label}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {f.data.map(item => (
                <TouchableOpacity
                  key={item}
                  onPress={() => f.set(item)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor:
                        f.value === item ? colors.primary : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      borderColor: f.value === item ? colors.primary : `${colors.primary}30`,
                    },
                  ]}
                >
                  <Text style={{ color: f.value === item ? '#fff' : colors.textSecondary, fontWeight: '600' }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Logs', value: logs.length, icon: 'list', color: '#3B82F6' },
            { label: 'Created', value: logs.filter(l => l.action === 'CREATE').length, icon: 'plus-circle', color: '#10B981' },
            { label: 'Updated', value: logs.filter(l => l.action === 'UPDATE').length, icon: 'edit', color: '#F59E0B' },
            { label: 'Deleted', value: logs.filter(l => l.action === 'DELETE').length, icon: 'trash', color: '#EF4444' },
          ].map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <FontAwesome5 name={stat.icon} size={16} color={stat.color} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Logs */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Activity Log ({filteredLogs.length})
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filteredLogs.length ? (
          <View style={styles.logsList}>
            {filteredLogs.map((log, index) => (
              <Animated.View
                key={log.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <View style={[styles.logCard, { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                  borderLeftColor: ACTION_COLORS[log.action] || colors.primary,
                  borderLeftWidth: 4,
                }]}>
                  {/* Header with Action Badge and Time */}
                  <View style={styles.logHeader}>
                    <View style={[styles.badge, { 
                      backgroundColor: `${ACTION_COLORS[log.action] || colors.primary}20`,
                      borderColor: ACTION_COLORS[log.action] || colors.primary,
                    }]}>
                      <Text style={{ 
                        color: ACTION_COLORS[log.action] || colors.primary, 
                        fontWeight: '700', 
                        fontSize: 11,
                        letterSpacing: 0.5,
                      }}>
                        {log.action}
                      </Text>
                    </View>
                    <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                      {formatDate(log.created_at)}
                    </Text>
                  </View>

                  {/* User and Entity Info */}
                  <View style={styles.logContent}>
                    <View style={styles.logRow}>
                      <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
                        <FontAwesome5 name="user" size={11} color={colors.primary} />
                      </View>
                      <Text style={[styles.logUser, { color: colors.textPrimary }]}>
                        {log.user_name}
                      </Text>
                    </View>

                    <View style={styles.logRow}>
                      <View style={[styles.iconCircle, { backgroundColor: `${colors.textSecondary}15` }]}>
                        <FontAwesome5 name="database" size={10} color={colors.textSecondary} />
                      </View>
                      <Text style={[styles.logEntity, { color: colors.textSecondary }]}>
                        {log.entity_type} <Text style={{ opacity: 0.6 }}>#{log.entity_id?.slice(0, 8)}</Text>
                      </Text>
                    </View>

                    {/* Changes */}
                    {log.changes && (
                      <View style={[styles.changes, { 
                        backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
                        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                      }]}>
                        <FontAwesome5 name="code" size={10} color={colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={[styles.changesText, { color: colors.textSecondary }]} numberOfLines={2}>
                          {JSON.stringify(log.changes)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <FontAwesome5 name="inbox" size={48} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, marginTop: 16, fontSize: 15 }}>No audit logs found</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 8, fontSize: 13 }}>Try adjusting your filters</Text>
          </View>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  searchBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },

  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    marginRight: 10,
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 10,
  },

  statItem: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },

  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },

  statCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },

  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
  },

  logsList: {
    marginBottom: 20,
  },

  logCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },

  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  logTime: {
    fontSize: 11,
    fontWeight: '500',
  },

  logContent: {
    gap: 8,
  },

  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logUser: {
    fontSize: 14,
    fontWeight: '600',
  },

  logEntity: {
    fontSize: 13,
    fontWeight: '500',
  },

  changes: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  changesText: {
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1,
    lineHeight: 16,
  },

  empty: {
    paddingVertical: 6
  },

  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },

  logCard: {
    padding: 16,
    marginBottom: 12,
  },

  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  logUser: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },

  changes: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  changesText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#A1A1AA',
  },

  empty: {
    paddingVertical: 80,
    alignItems: 'center',
  },
});
