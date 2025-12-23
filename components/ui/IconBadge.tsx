import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

export type IconBadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type IconBadgeFamily = 'fa5' | 'ion' | 'mci';

interface IconBadgeProps {
  family: IconBadgeFamily;
  name: string;
  tone?: IconBadgeTone;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const IconBadge: React.FC<IconBadgeProps> = ({
  family,
  name,
  tone = 'neutral',
  size = 20,
  style,
}) => {
  const { colors, isDark } = useThemeStore();

  const toneColor =
    tone === 'primary'
      ? colors.primary
      : tone === 'success'
      ? colors.success
      : tone === 'warning'
      ? colors.warning
      : tone === 'error'
      ? colors.error
      : tone === 'info'
      ? colors.info
      : colors.textMuted;

  const backgroundColor =
    tone === 'neutral'
      ? withAlpha(colors.textMuted, isDark ? 0.14 : 0.1)
      : withAlpha(toneColor, isDark ? 0.14 : 0.1);

  const IconComponent = family === 'fa5' ? FontAwesome5 : family === 'ion' ? Ionicons : MaterialCommunityIcons;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor: colors.cardBorder,
          borderWidth: colors.borderWidth,
          borderRadius: Math.max(12, Math.round(colors.borderRadius * 0.75)),
        },
        style,
      ]}
    >
      <IconComponent name={name as any} size={size} color={tone === 'neutral' ? colors.textPrimary : toneColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconBadge;
