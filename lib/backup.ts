// Backup and Restore utility for database
import { Alert } from 'react-native';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

interface BackupData {
  version: string;
  timestamp: string;
  tables: {
    [tableName: string]: any[];
  };
  metadata: {
    totalRecords: number;
    createdBy?: string;
    createdAt: string;
  };
}

const BACKUP_VERSION = '1.0.0';

// Tables to include in backup
const BACKUP_TABLES = [
  'departments',
  'courses',
  'profiles',
  'students',
  'teachers',
  'notices',
  'academic_years',
  'timetable_entries',
  'attendance',
  'exams',
  'fee_payments',
  'assignments',
  'books',
  'book_issues',
  'bus_routes',
  'canteen_menu_items',
];

/**
 * Create a full database backup
 */
export const createBackup = async (userId?: string): Promise<string | null> => {
  try {
    const startTime = Date.now();
    const backupData: BackupData = {
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      tables: {},
      metadata: {
        totalRecords: 0,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      },
    };

    console.log('Starting backup...');
    let totalRecords = 0;

    // Fetch data from all tables
    for (const tableName of BACKUP_TABLES) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          console.warn(`Warning: Could not backup ${tableName}:`, error.message);
          backupData.tables[tableName] = [];
        } else {
          backupData.tables[tableName] = data || [];
          totalRecords += data?.length || 0;
          console.log(`✓ Backed up ${tableName}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.warn(`Warning: Error backing up ${tableName}:`, err);
        backupData.tables[tableName] = [];
      }
    }

    backupData.metadata.totalRecords = totalRecords;
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Convert to JSON
    const jsonString = JSON.stringify(backupData, null, 2);
    const filename = `college_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    console.log('Backup created successfully');
    console.log(`Filename: ${filename}`);
    console.log(`Size: ${(jsonString.length / 1024).toFixed(2)} KB`);
    console.log(`Time: ${elapsedTime}s`);
    
    Alert.alert(
      'Backup Created',
      `Backup created successfully!\n\nSize: ${(jsonString.length / 1024).toFixed(2)} KB\nTables: ${Object.keys(backupData.tables).length}\nTotal Records: ${totalRecords}\nTime: ${elapsedTime}s`,
      [
        { text: 'OK' }
      ]
    );

    return jsonString;
  } catch (error: any) {
    console.error('Error creating backup:', error);
    Alert.alert('Backup Error', error.message || 'Failed to create backup');
    return null;
  }
};

/**
 * Restore database from backup
 */
export const restoreBackup = async (backupJson: string): Promise<boolean> => {
  try {
    const backupData: BackupData = JSON.parse(backupJson);

    // Validate backup format
    if (!backupData.version || !backupData.timestamp || !backupData.tables) {
      Alert.alert('Invalid Backup', 'The backup file format is invalid');
      return false;
    }

    // Confirm with user
    const totalRecords = Object.values(backupData.tables).reduce((sum, arr) => sum + arr.length, 0);
    
    return new Promise((resolve) => {
      Alert.alert(
        'Restore Backup',
        `This will restore ${totalRecords} records from ${Object.keys(backupData.tables).length} tables.\n\nBackup Date: ${new Date(backupData.timestamp).toLocaleString()}\n\nWarning: This may overwrite existing data!`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                let successCount = 0;
                let errorCount = 0;

                for (const [tableName, records] of Object.entries(backupData.tables)) {
                  if (records.length === 0) continue;

                  try {
                    // Insert records (use upsert to handle duplicates)
                    const { error } = await supabase
                      .from(tableName)
                      .upsert(records, { onConflict: 'id' });

                    if (error) {
                      console.error(`Error restoring ${tableName}:`, error.message);
                      errorCount++;
                    } else {
                      console.log(`✓ Restored ${tableName}: ${records.length} records`);
                      successCount++;
                    }
                  } catch (err) {
                    console.error(`Error restoring ${tableName}:`, err);
                    errorCount++;
                  }
                }

                Alert.alert(
                  'Restore Complete',
                  `Successfully restored ${successCount} tables.\n${errorCount > 0 ? `Errors: ${errorCount} tables` : 'No errors!'}`
                );

                resolve(true);
              } catch (error: any) {
                console.error('Error restoring backup:', error);
                Alert.alert('Restore Error', error.message || 'Failed to restore backup');
                resolve(false);
              }
            },
          },
        ]
      );
    });
  } catch (error: any) {
    console.error('Error parsing backup:', error);
    Alert.alert('Invalid Backup', 'Could not parse backup file');
    return false;
  }
};

/**
 * Export backup to file with sharing
 */
export const exportBackupToFile = async (userId?: string): Promise<boolean> => {
  try {
    const backupJson = await createBackup(userId);
    if (!backupJson) return false;

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        'Export Unavailable',
        'File sharing is not available on this device. The backup data is ready but cannot be exported.',
        [
          {
            text: 'Copy to Console',
            onPress: () => {
              console.log('=== BACKUP DATA ===' );
              console.log(backupJson);
              console.log('=== END BACKUP DATA ===');
              Alert.alert('Success', 'Backup data logged to console');
            }
          },
          { text: 'OK' }
        ]
      );
      return false;
    }

    // Save to file system
    const filename = `college_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const fileUri = (FileSystem.cacheDirectory || '') + filename;
    
    await FileSystem.writeAsStringAsync(fileUri, backupJson);

    console.log('Backup file created:', fileUri);

    // Share the file
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Database Backup',
      UTI: 'public.json',
    });

    return true;
  } catch (error: any) {
    console.error('Error exporting backup:', error);
    Alert.alert(
      'Export Error',
      `Failed to export backup: ${error.message}\n\nTry using the Copy option instead.`
    );
    return false;
  }
};

/**
 * Import backup from file with document picker
 */
export const importBackupFromFile = async (): Promise<boolean> => {
  try {
    // Pick a document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return false;
    }

    // Read the file content
    const fileUri = result.assets?.[0]?.uri;
    if (!fileUri) {
      throw new Error('No file selected');
    }

    const fileContent = await FileSystem.readAsStringAsync(fileUri);

    // Restore from the backup
    const success = await restoreBackup(fileContent);
    return success;
  } catch (error: any) {
    console.error('Error importing backup:', error);
    Alert.alert(
      'Import Error',
      `Failed to import backup file: ${error.message}\n\nYou can try pasting the backup JSON manually instead.`
    );
    return false;
  }
};

/**
 * Schedule automatic backups
 */
export const scheduleBackup = async (frequency: 'daily' | 'weekly' | 'monthly') => {
  // TODO: Implement with background tasks
  Alert.alert(
    'Scheduled Backups',
    `Automatic ${frequency} backups will be implemented in a future update.`,
    [{ text: 'OK' }]
  );
};

/**
 * Create a quick backup with minimal UI
 */
export const quickBackup = async (userId?: string): Promise<string | null> => {
  try {
    const backupJson = await createBackup(userId);
    if (backupJson) {
      // Silently save to device storage
      const filename = `quick_backup_${Date.now()}.json`;
      const fileUri = (FileSystem.cacheDirectory || '') + filename;
      await FileSystem.writeAsStringAsync(fileUri, backupJson);
      console.log('Quick backup saved:', fileUri);
      return fileUri;
    }
    return null;
  } catch (error) {
    console.error('Quick backup failed:', error);
    return null;
  }
};

/**
 * List available backup files
 */
export const listBackups = async (): Promise<string[]> => {
  try {
    const cacheDir = FileSystem.cacheDirectory;
    if (!cacheDir) return [];
    
    const files = await FileSystem.readDirectoryAsync(cacheDir);
    const backupFiles = files
      .filter((f: string) => f.includes('backup') && f.endsWith('.json'))
      .map((f: string) => f);
    return backupFiles;
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
};

/**
 * Delete a backup file
 */
export const deleteBackup = async (filename: string): Promise<boolean> => {
  try {
    const fileUri = (FileSystem.cacheDirectory || '') + filename;
    await FileSystem.deleteAsync(fileUri);
    return true;
  } catch (error) {
    console.error('Error deleting backup:', error);
    return false;
  }
};
/**
 * Get backup statistics
 */
export const getBackupStats = async () => {
  try {
    const stats: { [key: string]: number } = {};

    for (const tableName of BACKUP_TABLES) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        stats[tableName] = error ? 0 : (count || 0);
      } catch {
        stats[tableName] = 0;
      }
    }

    return stats;
  } catch (error) {
    console.error('Error getting backup stats:', error);
    return {};
  }
};
