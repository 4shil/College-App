import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeStore } from '../../store/themeStore';
import Silk from './Silk';

// Legacy exports for backwards compatibility with older imports.
export const FloatingBlob: React.FC<any> = () => null;
export const GlowOrb: React.FC<any> = () => null;

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  variant?: 'default' | 'auth' | 'minimal';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ children, variant = 'default' }) => {
  const { activeThemeId, colors, isDark, animationsEnabled } = useThemeStore();

  const isMinimal = variant === 'minimal' || !animationsEnabled;
  const showSilk = !isMinimal && isDark && activeThemeId === 'glassmorphism';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showSilk && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <Silk speed={10.4} scale={0.3} color="#21005eff" noiseIntensity={1.5} rotation={0.7} />
        </View>
      )}

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
