import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '../../components/ui';
import { useThemeStore } from '../../store/themeStore';

export default function TeacherResultsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeStore();

  return (
    <AnimatedBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 100 },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Results Management</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage student results and grades
        </Text>
      </ScrollView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14 },
});
