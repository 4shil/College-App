import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AnimatedBackground, Card } from '../../../components/ui';
import { useThemeStore } from '../../../store/themeStore';

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeStore();

  return (
    <AnimatedBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Events</Text>
          <View style={{ width: 28 }} />
        </View>

        <Card style={styles.placeholder}>
          <Ionicons name="calendar" size={64} color={colors.textMuted} />
          <Text style={[styles.placeholderTitle, { color: colors.textPrimary }]}>Events Module</Text>
          <Text style={[styles.placeholderSubtitle, { color: colors.textSecondary }]}>
            Discover college events and activities
          </Text>
          <Text style={[styles.placeholderDetails, { color: colors.textMuted }]}>
            Features: Upcoming events, Event details, External registration links, Certificate downloads
          </Text>
        </Card>
      </View>
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
  placeholder: {
    alignItems: 'center',
    paddingVertical: 48,
    marginTop: 32,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderDetails: {
    fontSize: 12,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
});
