import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeStore } from '../../store/themeStore';
import NoisyGradientBackground from './NoisyGradientBackground';

// Legacy exports for backwards compatibility with older imports.
export const FloatingBlob: React.FC<any> = () => null;
export const GlowOrb: React.FC<any> = () => null;

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'minimal';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children, variant = 'default' }) => {
  const { colors, animationsEnabled } = useThemeStore();

  const isMinimal = variant === 'minimal';
  const shouldAnimate = animationsEnabled && !isMinimal;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isMinimal && <NoisyGradientBackground animated={shouldAnimate} />}

      {/* No bottom tint/glow/vignette overlays */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AnimatedBackground;
