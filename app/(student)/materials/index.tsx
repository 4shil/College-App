import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedBackground, Card, LoadingIndicator } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';
import { withAlpha } from '../../../theme/colorUtils';
import { useAuthStore } from '../../../store/authStore';
import { supabase } from '../../../lib/supabase';
import { getStudentByUserId } from '../../../lib/database';
import { useRouter } from 'expo-router';

export default function MaterialsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    if (!user) return;

    try {
      setError(null);
      const student = await getStudentByUserId(user.id);
      if (!student) {
        setError('Student record not found');
        return;
      }

      // Fetch teaching materials for student's section
      const { data, error: fetchError } = await supabase
        .from('teaching_materials')
        .select(`
          *,
          courses(name, code),
          teachers(full_name)
        `)
        .eq('section_id', student.section_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMaterials();
  };

  const filteredMaterials = materials.filter((m) =>
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.courses?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        alert('Cannot open this material');
      });
    }
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <LoadingIndicator />
        </View>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Materials</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <View style={[styles.searchBar, { borderColor: colors.border, backgroundColor: withAlpha(colors.textPrimary, 0.05) }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <Text
              placeholder="Search materials..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
          </View>
        </Animated.View>

        {/* Materials List */}
        {filteredMaterials.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
              Available Materials ({filteredMaterials.length})
            </Text>
            <Card>
              {filteredMaterials.map((material: any, index) => (
                <TouchableOpacity
                  key={material.id}
                  onPress={() => handleDownload(material.file_url)}
                  style={[styles.materialItem, { borderBottomColor: colors.border }, index < filteredMaterials.length - 1 && { borderBottomWidth: 1 }]}
                >
                  <View style={[styles.fileIcon, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
                    <Ionicons
                      name={material.file_type === 'pdf' ? 'document' : 'image'}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.materialInfo}>
                    <Text style={[styles.materialTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                      {material.title}
                    </Text>
                    <Text style={[styles.materialCourse, { color: colors.textSecondary }]} numberOfLines={1}>
                      {material.courses?.name || 'Unknown Course'}
                    </Text>
                    <Text style={[styles.materialTeacher, { color: colors.textMuted }]} numberOfLines={1}>
                      {material.teachers?.full_name || 'Unknown'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </Card>
          </Animated.View>
        ) : (
          <Card style={{ marginTop: 20, alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="document-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.noMaterialText, { color: colors.textSecondary, marginTop: 12 }]}>
              {searchQuery ? 'No materials found' : 'No materials available'}
            </Text>
          </Card>
        )}

        {error && (
          <Card style={{ marginTop: 16, backgroundColor: withAlpha(colors.danger || '#ef4444', 0.1) }}>
            <Text style={{ color: colors.danger || '#ef4444', fontSize: 14 }}>{error}</Text>
          </Card>
        )}
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  materialCourse: {
    fontSize: 12,
    marginBottom: 2,
  },
  materialTeacher: {
    fontSize: 11,
  },
  noMaterialText: {
    fontSize: 14,
  },
});
