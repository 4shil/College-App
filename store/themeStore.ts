import { createStore, persist } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

// Light theme colors - Warm and beautiful
const lightColors = {
  // Backgrounds
  background: '#FFFBF5',
  backgroundGradientStart: '#FFF8F0',
  backgroundGradientEnd: '#FFE4D6',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.85)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.88)',
  
  // Text
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  textInverse: '#ffffff',
  
  // Primary accent - Warm Orange
  primary: '#EA580C',
  primaryLight: '#FB923C',
  primaryDark: '#C2410C',
  
  // Secondary - Amber
  secondary: '#D97706',
  secondaryLight: '#FBBF24',
  
  // Status colors
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#0891B2',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.65)',
  inputBorder: 'rgba(234, 88, 12, 0.2)',
  inputFocusBorder: '#EA580C',
  placeholder: '#A8A29E',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.78)',
  cardBorder: 'rgba(255, 255, 255, 0.9)',
  
  // Shadows
  shadowColor: '#EA580C',
};

// Dark theme colors - Deep warm tones with glowing effects
const darkColors = {
  // Backgrounds
  background: '#0C0A09',
  backgroundGradientStart: '#0C0A09',
  backgroundGradientEnd: '#1C1410',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.1)',
  
  // Text
  textPrimary: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textMuted: '#78716C',
  textInverse: '#0C0A09',
  
  // Primary accent - Warm Orange Glow
  primary: '#FB923C',
  primaryLight: '#FDBA74',
  primaryDark: '#EA580C',
  
  // Secondary - Golden Amber
  secondary: '#FBBF24',
  secondaryLight: '#FDE68A',
  
  // Status colors
  success: '#4ADE80',
  warning: '#FACC15',
  error: '#F87171',
  info: '#22D3EE',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(251, 146, 60, 0.25)',
  inputFocusBorder: '#FB923C',
  placeholder: '#78716C',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Shadows
  shadowColor: '#EA580C',
};

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  colors: typeof lightColors;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setSystemTheme: (isDark: boolean) => void;
}

export const useThemeStore = createStore<ThemeState>(
  persist(
    (set, get) => ({
      mode: 'dark' as ThemeMode,
      isDark: true,
      colors: darkColors,

      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'dark' || (mode === 'system' && get().isDark);
        set({
          mode,
          isDark,
          colors: isDark ? darkColors : lightColors,
        });
      },

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        set({
          mode: newMode,
          isDark: newMode === 'dark',
          colors: newMode === 'dark' ? darkColors : lightColors,
        });
      },

      setSystemTheme: (systemIsDark: boolean) => {
        const mode = get().mode;
        if (mode === 'system') {
          set({
            isDark: systemIsDark,
            colors: systemIsDark ? darkColors : lightColors,
          });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: AsyncStorage,
    }
  )
);

// Export color types for TypeScript
export type ThemeColors = typeof lightColors;
export { lightColors, darkColors };
