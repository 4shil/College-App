import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

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
                ? [withAlpha(color, 0.5), withAlpha(color, 0.3), 'transparent']
                : [withAlpha(color, 0.35), withAlpha(color, 0.2), 'transparent']
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
              backgroundColor: colors.glassBackgroundStrong,
              borderColor: colors.glassBorder,
            },
          ]}
          tint={isDark ? 'dark' : 'light'}
        >
          {/* Inner gradient overlay */}
          <LinearGradient
            colors={
              isDark
                ? [withAlpha(color, 0.15), 'transparent', withAlpha(color, 0.1)]
                : [withAlpha(color, 0.1), 'transparent', withAlpha(color, 0.08)]
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
              backgroundColor: withAlpha(color, isDark ? 0.15 : 0.12),
              borderColor: colors.glassBorder,
            },
          ]}
        >
          {/* Inner gradient overlay */}
          <LinearGradient
            colors={
              isDark
                ? [withAlpha(color, 0.2), 'transparent', withAlpha(color, 0.15)]
                : [withAlpha(color, 0.15), 'transparent', withAlpha(color, 0.1)]
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
            ? [withAlpha(colors.glassBackgroundStrong, 0.15), withAlpha(colors.glassBackgroundStrong, 0.03), 'transparent']
            : [withAlpha(colors.glassBackgroundStrong, 0.95), withAlpha(colors.glassBackgroundStrong, 0.5), 'transparent']
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
