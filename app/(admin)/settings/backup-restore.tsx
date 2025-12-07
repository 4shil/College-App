import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AnimatedBackground, GlassCard, PrimaryButton } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { 
  createBackup, 
  restoreBackup, 
  getBackupStats, 
  exportBackupToFile, 
  importBackupFromFile,
  listBackups,
  deleteBackup,
  scheduleBackup
} from '../../../lib/backup';
import { Restricted } from '../../../components/Restricted';
import { PERMISSIONS } from '../../../hooks/useRBAC';
import { useAuthStore } from '../../../store/authStore';

export default function BackupRestoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<{ [key: string]: number }>({});
  const [restoreJson, setRestoreJson] = useState('');
  const [showRestoreInput, setShowRestoreInput] = useState(false);
  const [backupFiles, setBackupFiles] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    loadBackupFiles();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const backupStats = await getBackupStats();
    setStats(backupStats);
    setLoading(false);
  };

  const loadBackupFiles = async () => {
    const files = await listBackups();
    setBackupFiles(files);
  };

  const handleCreateBackup = async () => {
    setProcessing(true);
    await createBackup(user?.id);
    await loadBackupFiles();
    setProcessing(false);
  };

  const handleExportBackup = async () => {
    setProcessing(true);
    const success = await exportBackupToFile(user?.id);
    if (success) {
      await loadBackupFiles();
    }
    setProcessing(false);
  };

  const handleImportBackup = async () => {
    setProcessing(true);
    const success = await importBackupFromFile();
    if (success) {
      await loadStats();
      await loadBackupFiles();
    }
    setProcessing(false);
  };

  const handleRestoreBackup = async () => {
    if (!restoreJson.trim()) {
      Alert.alert('Error', 'Please paste backup JSON data');
      return;
    }

    setProcessing(true);
    const success = await restoreBackup(restoreJson);
    setProcessing(false);

    if (success) {
      setRestoreJson('');
      setShowRestoreInput(false);
      await loadStats();
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    Alert.alert(
      'Delete Backup',
      `Are you sure you want to delete ${filename}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteBackup(filename);
            if (success) {
              await loadBackupFiles();
              Alert.alert('Success', 'Backup deleted successfully');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadBackupFiles()]);
    setRefreshing(false);
  };

  const totalRecords = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <Restricted permissions={[PERMISSIONS.MANAGE_GLOBAL_SETTINGS]}>
      <AnimatedBackground>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <FontAwesome5 name="arrow-left" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Backup & Restore</Text>
            <TouchableOpacity 
              onPress={handleRefresh} 
              style={styles.refreshButton}
              disabled={refreshing}
            >
              <FontAwesome5 
                name="sync-alt" 
                size={16} 
                color={colors.textSecondary} 
                style={refreshing ? { opacity: 0.5 } : {}}
              />
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassCard style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <View style={[styles.statsIcon, { backgroundColor: `${colors.primary}20` }]}>
                  <FontAwesome5 name="database" size={24} color={colors.primary} />
                </View>
                <View style={styles.statsContent}>
                  <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>
                    Database Statistics
                  </Text>
                  <Text style={[styles.statsSubtitle, { color: colors.textSecondary }]}>
                    Current data in system
                  </Text>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
              ) : (
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>
                      {totalRecords}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      Total Records
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                      {Object.keys(stats).length}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Tables</Text>
                  </View>
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* Backup Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Create Backup
            </Text>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#3B82F620' }]}>
                  <FontAwesome5 name="cloud-download-alt" size={20} color="#3B82F6" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    Backup Database
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    Create a complete backup of all data
                  </Text>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title={processing ? 'Creating...' : 'Quick Backup'}
                    onPress={handleCreateBackup}
                    disabled={processing}
                    style={styles.actionButton}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title={processing ? 'Exporting...' : 'Export & Share'}
                    onPress={handleExportBackup}
                    disabled={processing}
                    style={styles.actionButtonGreen}
                  />
                </View>
              </View>

              <View style={styles.infoBox}>
                <FontAwesome5 name="info-circle" size={14} color={colors.textMuted} />
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Backup includes all tables: students, teachers, courses, departments, attendance,
                  exams, fees, and more. Quick Backup saves to device, Export allows sharing.
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Backup Files List */}
          {backupFiles.length > 0 && (
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Saved Backups ({backupFiles.length})
              </Text>
              <GlassCard style={styles.filesCard}>
                {backupFiles.map((file, index) => (
                  <View
                    key={file}
                    style={[
                      styles.fileRow,
                      index < backupFiles.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  >
                    <View style={styles.fileInfo}>
                      <FontAwesome5 name="file-archive" size={16} color={colors.primary} />
                      <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {file}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteBackup(file)}
                      style={styles.deleteButton}
                    >
                      <FontAwesome5 name="trash" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}

          {/* Restore Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Restore Backup
            </Text>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#EF444420' }]}>
                  <FontAwesome5 name="cloud-upload-alt" size={20} color="#EF4444" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    Restore from Backup
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    Restore data from a previous backup
                  </Text>
                </View>
              </View>

              {!showRestoreInput ? (
                <View style={styles.buttonGroup}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Import from File"
                      onPress={handleImportBackup}
                      disabled={processing}
                      style={styles.actionButtonOrange}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Paste JSON"
                      onPress={() => setShowRestoreInput(true)}
                      disabled={processing}
                      style={styles.actionButtonRed}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.restoreForm}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Paste Backup JSON
                  </Text>
                  <TextInput
                    style={[
                      styles.jsonInput,
                      {
                        color: colors.textPrimary,
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.05)',
                        borderColor: `${colors.primary}30`,
                      },
                    ]}
                    placeholder="Paste backup JSON here..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={6}
                    value={restoreJson}
                    onChangeText={setRestoreJson}
                  />

                  <View style={styles.restoreButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowRestoreInput(false);
                        setRestoreJson('');
                      }}
                      style={[styles.cancelButton, { borderColor: `${colors.textMuted}40` }]}
                      disabled={processing}
                    >
                      <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleRestoreBackup}
                      style={[styles.restoreButton, { backgroundColor: '#EF4444' }]}
                      disabled={processing || !restoreJson.trim()}
                    >
                      {processing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.restoreButtonText}>Restore Now</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={[styles.warningBox, { backgroundColor: '#EF444415' }]}>
                <FontAwesome5 name="exclamation-triangle" size={14} color="#EF4444" />
                <Text style={[styles.warningText, { color: '#EF4444' }]}>
                  Warning: Restoring a backup may overwrite existing data. Please ensure you have a
                  recent backup before proceeding.
                </Text>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Scheduled Backups */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Automated Backups
            </Text>
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#8B5CF620' }]}>
                  <FontAwesome5 name="clock" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                    Schedule Backups
                  </Text>
                  <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                    Set up automatic backup schedules
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleButtons}>
                <TouchableOpacity
                  onPress={() => scheduleBackup('daily')}
                  style={[styles.scheduleButton, { backgroundColor: `${colors.primary}15` }]}
                >
                  <FontAwesome5 name="calendar-day" size={16} color={colors.primary} />
                  <Text style={[styles.scheduleButtonText, { color: colors.textPrimary }]}>
                    Daily
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => scheduleBackup('weekly')}
                  style={[styles.scheduleButton, { backgroundColor: '#10B98115' }]}
                >
                  <FontAwesome5 name="calendar-week" size={16} color="#10B981" />
                  <Text style={[styles.scheduleButtonText, { color: colors.textPrimary }]}>
                    Weekly
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => scheduleBackup('monthly')}
                  style={[styles.scheduleButton, { backgroundColor: '#F59E0B15' }]}
                >
                  <FontAwesome5 name="calendar-alt" size={16} color="#F59E0B" />
                  <Text style={[styles.scheduleButtonText, { color: colors.textPrimary }]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Table Stats */}
          {!loading && Object.keys(stats).length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Table Statistics
              </Text>
              <GlassCard style={styles.tableCard}>
                {Object.entries(stats).map(([table, count], index) => (
                  <View
                    key={table}
                    style={[
                      styles.tableRow,
                      index < Object.keys(stats).length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: isDark
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  >
                    <Text style={[styles.tableName, { color: colors.textSecondary }]}>
                      {table}
                    </Text>
                    <Text style={[styles.tableCount, { color: colors.primary }]}>{count}</Text>
                  </View>
                ))}
              </GlassCard>
            </Animated.View>
          )}
        </ScrollView>
      </AnimatedBackground>
    </Restricted>
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
    marginLeft: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  statsCard: {
    padding: 20,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 16,
  },
  actionButtonGreen: {
    marginBottom: 16,
    backgroundColor: '#10B981',
  },
  actionButtonOrange: {
    marginBottom: 16,
    backgroundColor: '#F59E0B',
  },
  actionButtonRed: {
    marginBottom: 16,
    backgroundColor: '#EF4444',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  restoreForm: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  jsonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  restoreButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  restoreButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  restoreButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  filesCard: {
    padding: 16,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
  },
  scheduleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableCard: {
    padding: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tableName: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  tableCount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
