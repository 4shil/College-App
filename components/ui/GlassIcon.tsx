import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface GlassIconProps {
  name: string;
  size?: number;
  color: string;
  iconType?: 'fa5' | 'ion' | 'mci';
  style?: StyleProp<ViewStyle>;
  withGlow?: boolean;
}

export const GlassIcon: React.FC<GlassIconProps> = ({
  name,
  size = 24,
  color,
  iconType = 'fa5',
  style,
  withGlow = true,
}) => {
  const { isDark, colors, capabilities } = useThemeStore();
  const supportsGlass = capabilities.supportsGlassSurfaces;
  const supportsBlur = capabilities.supportsBlur;

  const iconContainerSize = size * 2;

  const IconComponent = 
    iconType === 'ion' ? Ionicons :
    iconType === 'mci' ? MaterialCommunityIcons :
    FontAwesome5;

  if (!supportsGlass) {
    return (
      <View style={[styles.container, { width: iconContainerSize, height: iconContainerSize }, style]}>
        <View
          style={[
            styles.glassContainer,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
              borderWidth: Math.max(colors.borderWidth, 1),
            },
          ]}
        >
          <IconComponent name={name as any} size={size} color={color} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: iconContainerSize, height: iconContainerSize }, style]}>
      {/* Outer Glow */}
      {withGlow && (
        <View style={[styles.glowContainer, { width: iconContainerSize, height: iconContainerSize }]}>
          <LinearGradient
            colors={
              isDark
                ? [`${color}50`, `${color}30`, 'transparent']
                : [`${color}35`, `${color}20`, 'transparent']
            }
            style={styles.glowGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
      )}

      {/* Main Glass Container */}
      {Platform.OS === 'ios' && supportsBlur ? (
        <BlurView
          intensity={isDark ? 40 : 50}
          style={[
            styles.glassContainer,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.6)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.8)',
            },
          ]}
          tint={isDark ? 'dark' : 'light'}
        >
          {/* Inner gradient overlay */}
          <LinearGradient
            colors={
              isDark
                ? [`${color}15`, 'transparent', `${color}10`]
                : [`${color}10`, 'transparent', `${color}08`]
            }
            style={styles.innerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Icon */}
          <IconComponent name={name as any} size={size} color={color} />
        </BlurView>
      ) : (
        <View
          style={[
            styles.glassContainer,
            {
              backgroundColor: isDark
                ? `${color}15`
                : `${color}12`,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(255, 255, 255, 0.8)',
            },
          ]}
        >
          {/* Inner gradient overlay */}
          <LinearGradient
            colors={
              isDark
                ? [`${color}20`, 'transparent', `${color}15`]
                : [`${color}15`, 'transparent', `${color}10`]
            }
            style={styles.innerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Icon */}
          <IconComponent name={name as any} size={size} color={color} />
        </View>
      )}

      {/* Top highlight */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.03)', 'transparent']
            : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.5)', 'transparent']
        }
        style={styles.topHighlight}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  glassContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  innerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    pointerEvents: 'none',
  },
});

export default GlassIcon;
