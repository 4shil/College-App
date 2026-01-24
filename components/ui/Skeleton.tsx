import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { withAlpha } from '../../theme/colorUtils';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { colors, isDark, animationsEnabled } = useThemeStore();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (animationsEnabled) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    }
  }, [shimmer, animationsEnabled]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  const baseColor = isDark 
    ? withAlpha(colors.textPrimary, 0.08) 
    : withAlpha(colors.textPrimary, 0.06);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

// Pre-built skeleton layouts for common use cases
interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  lines = 3,
  showAvatar = false,
  style,
}) => {
  const { colors, isDark } = useThemeStore();
  
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? withAlpha(colors.cardBackground, 0.6)
            : colors.cardBackground,
          borderColor: withAlpha(colors.textPrimary, isDark ? 0.08 : 0.05),
        },
        style,
      ]}
    >
      {showAvatar && (
        <View style={styles.avatarRow}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.avatarContent}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
          </View>
        </View>
      )}
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={index === 0 ? 16 : 14}
          style={{ marginTop: index === 0 && !showAvatar ? 0 : 10 }}
        />
      ))}
    </View>
  );
};

interface SkeletonListProps {
  count?: number;
  showAvatar?: boolean;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  showAvatar = true,
}) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} showAvatar={showAvatar} lines={2} />
      ))}
    </View>
  );
};

interface SkeletonStatGridProps {
  count?: number;
}

export const SkeletonStatGrid: React.FC<SkeletonStatGridProps> = ({ count = 4 }) => {
  const { colors, isDark } = useThemeStore();
  
  return (
    <View style={styles.statGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.statCard,
            {
              backgroundColor: isDark
                ? withAlpha(colors.cardBackground, 0.6)
                : colors.cardBackground,
            },
          ]}
        >
          <Skeleton width={32} height={32} borderRadius={8} />
          <Skeleton width="80%" height={20} style={{ marginTop: 12 }} />
          <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContent: {
    flex: 1,
    marginLeft: 12,
  },
  list: {
    gap: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
});

export default Skeleton;
