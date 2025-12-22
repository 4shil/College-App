import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useThemeStore } from '../../store/themeStore';
import { Card } from './Card';
import { IconBadge, IconBadgeFamily, IconBadgeTone } from './IconBadge';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: {
    family: IconBadgeFamily;
    name: string;
  };
  tone?: IconBadgeTone;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  tone = 'primary',
  loading = false,
  onPress,
  style,
}) => {
  const { colors } = useThemeStore();

  const content = (
    <Card animated={false} style={[styles.card, style]}>
      <IconBadge
        family={icon.family}
        name={icon.name}
        tone={tone}
        style={styles.iconContainer}
      />
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 10 }} />
      ) : (
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      )}
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
    </Card>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    // Card already applies theme radius; keep StatCard itself neutral.
  },
  iconContainer: {
    marginBottom: 14,
  },
  value: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 13,
    marginTop: 5,
    fontWeight: '500',
  },
});

export default StatCard;
