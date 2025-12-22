import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: number | string;
  accentColor: string;
  icon: React.ReactNode;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  accentColor,
  icon,
  loading = false,
  onPress,
  style,
}) => {
  const { colors } = useThemeStore();

  const content = (
    <Card animated={false} style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: withAlpha(accentColor, 0.1) }]}>{icon}</View>
      {loading ? (
        <ActivityIndicator size="small" color={accentColor} style={{ marginVertical: 10 }} />
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
    borderRadius: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
