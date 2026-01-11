import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from './Card';
import { useThemeStore } from '../../store/themeStore';

type RowAccessory =
  | { type: 'chevron' }
  | { type: 'switch'; value: boolean; onValueChange: (next: boolean) => void }
  | { type: 'text'; value: string };

export function SettingsHeader(props: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useThemeStore();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {props.onBack ? (
          <TouchableOpacity
            onPress={props.onBack}
            activeOpacity={0.85}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{props.title}</Text>
          {props.subtitle ? (
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{props.subtitle}</Text>
          ) : null}
        </View>
      </View>

      {props.right ? <View style={styles.headerRight}>{props.right}</View> : null}
    </View>
  );
}

export function SettingsSection(props: {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.section, props.style]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{props.title}</Text>
      <Card noPadding style={styles.sectionCard}>
        {props.children}
      </Card>
    </View>
  );
}

export function SettingsRow(props: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  destructive?: boolean;
  accessory?: RowAccessory;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const { colors } = useThemeStore();
  const accessory = props.accessory ?? { type: 'chevron' as const };

  const canPress = !!props.onPress && accessory.type !== 'switch' && !props.disabled;
  const tint = props.destructive ? colors.error : colors.textPrimary;

  return (
    <TouchableOpacity
      testID={props.testID}
      activeOpacity={canPress ? 0.75 : 1}
      onPress={canPress ? props.onPress : undefined}
      disabled={!canPress}
      style={[
        styles.row,
        {
          borderBottomColor: colors.cardBorder,
          borderBottomWidth: colors.borderWidth,
          opacity: props.disabled ? 0.55 : 1,
        },
      ]}
    >
      <View style={styles.rowLeft}>
        {props.icon ? (
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderWidth: colors.borderWidth,
              },
            ]}
          >
            <Ionicons name={props.icon} size={18} color={props.destructive ? colors.error : colors.primary} />
          </View>
        ) : null}

        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: tint }]}>{props.title}</Text>
          {props.subtitle ? (
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
              {props.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {accessory.type === 'switch' ? (
        <Switch
          value={accessory.value}
          onValueChange={accessory.onValueChange}
          trackColor={{ false: colors.inputBorder, true: colors.primary }}
          thumbColor={accessory.value ? colors.primary : colors.cardBackground}
        />
      ) : accessory.type === 'text' ? (
        <View style={styles.accessoryTextWrap}>
          <Text style={[styles.accessoryText, { color: colors.textMuted }]} numberOfLines={1}>
            {accessory.value}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '600' },
  headerRight: { alignItems: 'flex-end', justifyContent: 'center' },

  section: { marginTop: 12 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: 4,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontWeight: '800' },
  rowSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '600' },

  accessoryTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 160 },
  accessoryText: { fontSize: 12, fontWeight: '700' },
});
