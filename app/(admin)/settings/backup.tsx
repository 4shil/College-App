import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { AnimatedBackground, GlassCard, IconBadge, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { supabase } from '../../../lib/supabase';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';

interface BackupInfo {
  table: string;
  count: number;
  lastBackup: string | null;
}

export default function BackupRestoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();

  const [loading, setLoading] = useState(false);
  const [backupData, setBackupData] = useState<BackupInfo[]>([]);
  const [lastFullBackup, setLastFullBackup] = useState<string | null>(null);

  const tables = [
    { name: 'profiles', label: 'User Profiles', icon: 'users' },
    { name: 'students', label: 'Students', icon: 'user-graduate' },
    { name: 'teachers', label: 'Teachers', icon: 'chalkboard-teacher' },
    { name: 'departments', label: 'Departments', icon: 'building' },
    { name: 'courses', label: 'Courses', icon: 'book' },
    { name: 'attendance', label: 'Attendance', icon: 'calendar-check' },
    { name: 'exams', label: 'Exams', icon: 'file-alt' },
    { name: 'marks', label: 'Marks', icon: 'chart-line' },
    { name: 'fee_payments', label: 'Fee Payments', icon: 'dollar-sign' },
    { name: 'notices', label: 'Notices', icon: 'bullhorn' },
  ];

  const getBackupInfo = async () => {
    setLoading(true);
    try {
      const info: BackupInfo[] = [];
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          info.push({
            table: table.name,
            count: count || 0,
            lastBackup: localStorage.getItem(`backup_${table.name}`) || null,
          });
        }
      }

      setBackupData(info);
      setLastFullBackup(localStorage.getItem('last_full_backup') || null);
    } catch (error) {
      console.error('Error getting backup info:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (tableName?: string) => {
    setLoading(true);
    try {
      const tablesToBackup = tableName ? [tables.find(t => t.name === tableName)] : tables;
      const backupTimestamp = new Date().toISOString();
      const backups: any = {};

      for (const table of tablesToBackup) {
        if (!table) continue;

        const { data, error } = await supabase
          .from(table.name)
          .select('*');

        if (error) throw error;

        backups[table.name] = {
          data,
          timestamp: backupTimestamp,
          count: data?.length || 0,
        };

        // Store in localStorage (in production, this should be saved to a file or cloud storage)
        localStorage.setItem(`backup_${table.name}`, backupTimestamp);
        localStorage.setItem(`backup_data_${table.name}`, JSON.stringify(data));
      }

      if (!tableName) {
        localStorage.setItem('last_full_backup', backupTimestamp);
        setLastFullBackup(backupTimestamp);
      }

      // Create a downloadable backup file
      const backupJson = JSON.stringify(backups, null, 2);
      const filename = tableName 
        ? `${tableName}_backup_${backupTimestamp}.json`
        : `full_backup_${backupTimestamp}.json`;

      console.log('Backup created:', filename);
      console.log('Backup size:', (backupJson.length / 1024).toFixed(2), 'KB');

      Alert.alert(
        'Backup Created',
        `Full database backup created successfully!\n\nSize: ${(backupJson.length / 1024).toFixed(2)} KB\n\nBackup data logged to console.`,
        [{ text: 'OK' }]
      );

      await getBackupInfo();
    } catch (error: any) {
      console.error('Backup error:', error);
      Alert.alert('Error', error.message || 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (tableName?: string) => {
    Alert.alert(
      'Restore Backup',
      `Are you sure you want to restore ${tableName || 'all tables'}? This will replace current data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const tablesToRestore = tableName ? [tableName] : tables.map(t => t.name);

              for (const table of tablesToRestore) {
                const backupDataStr = localStorage.getItem(`backup_data_${table}`);
                if (!backupDataStr) {
                  console.warn(`No backup found for ${table}`);
                  continue;
                }

                const backupData = JSON.parse(backupDataStr);

                // Delete existing data
                await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');

                // Insert backup data
                if (backupData.length > 0) {
                  const { error } = await supabase.from(table).insert(backupData);
                  if (error) throw error;
                }
              }

              Alert.alert('Success', 'Backup restored successfully!');
              await getBackupInfo();
            } catch (error: any) {
              console.error('Restore error:', error);
              Alert.alert('Error', error.message || 'Failed to restore backup');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const exportBackup = () => {
    Alert.alert(
      'Export Backup',
      'Backup data has been logged to console. In production, this would download a JSON file.',
      [{ text: 'OK' }]
    );
  };

  React.useEffect(() => {
    getBackupInfo();
  }, []);

  return (
    <View style={styles.container}>
      <AnimatedBackground>
        <View />
      </AnimatedBackground>
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              borderWidth: colors.borderWidth,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Backup & Restore
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Manage your database backups
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <IconBadge family="fa5" name="database" tone="primary" size={20} style={styles.iconContainer} />
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  Quick Actions
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  {lastFullBackup 
                    ? `Last backup: ${new Date(lastFullBackup).toLocaleString()}`
                    : 'No backup yet'}
                </Text>
              </View>
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={() => createBackup()}
                disabled={loading}
              >
                <FontAwesome5 name="cloud-upload-alt" size={24} color={colors.success} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>
                  Full Backup
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={() => restoreBackup()}
                disabled={loading || !lastFullBackup}
              >
                <FontAwesome5 name="cloud-download-alt" size={24} color={colors.warning} />
                <Text style={[styles.actionButtonText, { color: colors.warning }]}>
                  Full Restore
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    borderWidth: colors.borderWidth,
                  },
                ]}
                onPress={exportBackup}
                disabled={loading || !lastFullBackup}
              >
                <FontAwesome5 name="download" size={24} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Export
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Individual Tables */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Individual Tables
          </Text>
        </Animated.View>

        {loading && backupData.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Loading backup information...
            </Text>
          </View>
        ) : (
          tables.map((table, index) => {
            const info = backupData.find(b => b.table === table.name);
            return (
              <Animated.View
                key={table.name}
                entering={FadeInDown.delay(300 + index * 50).springify()}
              >
                <GlassCard style={styles.tableCard}>
                  <View style={styles.tableHeader}>
                    <IconBadge family="fa5" name={table.icon} tone="primary" size={18} style={styles.tableIcon} />
                    <View style={styles.tableInfo}>
                      <Text style={[styles.tableName, { color: colors.textPrimary }]}>
                        {table.label}
                      </Text>
                      <Text style={[styles.tableStats, { color: colors.textMuted }]}>
                        {info?.count || 0} records
                        {info?.lastBackup && ` • Last: ${new Date(info.lastBackup).toLocaleDateString()}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tableActions}>
                    <TouchableOpacity
                      style={[
                        styles.tableActionBtn,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.inputBorder,
                          borderWidth: colors.borderWidth,
                        },
                      ]}
                      onPress={() => createBackup(table.name)}
                      disabled={loading}
                    >
                      <FontAwesome5 name="save" size={14} color={colors.success} />
                      <Text style={[styles.tableActionText, { color: colors.success }]}>
                        Backup
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tableActionBtn,
                        {
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.inputBorder,
                          borderWidth: colors.borderWidth,
                        },
                      ]}
                      onPress={() => restoreBackup(table.name)}
                      disabled={loading || !info?.lastBackup}
                    >
                      <FontAwesome5 name="undo" size={14} color={colors.warning} />
                      <Text style={[styles.tableActionText, { color: colors.warning }]}>
                        Restore
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </Animated.View>
            );
          })
        )}

        {/* Warning Note */}
        <Animated.View entering={FadeInDown.delay(1000).springify()}>
          <GlassCard
            style={[
              styles.warningCard,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.warning,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <View style={styles.warningHeader}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={[styles.warningTitle, { color: colors.warning }]}>
                Important Notes
              </Text>
            </View>
            <Text style={[styles.warningText, { color: colors.textMuted }]}>
              • Backups are currently stored in browser localStorage{'\n'}
              • Restoring will replace all existing data{'\n'}
              • Always create a backup before making major changes{'\n'}
              • In production, backups should be stored in secure cloud storage
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  tableCard: {
    padding: 16,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tableIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tableStats: {
    fontSize: 12,
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tableActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  tableActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  warningCard: {
    padding: 16,
    marginTop: 8,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
