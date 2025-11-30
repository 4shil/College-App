import { createStore, persist } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

// Light theme colors
const lightColors = {
  // Backgrounds
  background: '#f8fafc',
  backgroundGradientStart: '#e0e7ff',
  backgroundGradientEnd: '#f8fafc',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.8)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.85)',
  
  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',
  
  // Primary accent
  primary: '#6366f1',
  primaryLight: '#818cf8',
  primaryDark: '#4f46e5',
  
  // Secondary
  secondary: '#3b82f6',
  secondaryLight: '#60a5fa',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.6)',
  inputBorder: 'rgba(148, 163, 184, 0.4)',
  inputFocusBorder: '#6366f1',
  placeholder: '#94a3b8',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.9)',
  
  // Shadows
  shadowColor: '#000000',
};

// Dark theme colors
const darkColors = {
  // Backgrounds
  background: '#0f172a',
  backgroundGradientStart: '#0f172a',
  backgroundGradientEnd: '#1e1b4b',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.08)',
  
  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textInverse: '#0f172a',
  
  // Primary accent
  primary: '#818cf8',
  primaryLight: '#a5b4fc',
  primaryDark: '#6366f1',
  
  // Secondary
  secondary: '#60a5fa',
  secondaryLight: '#93c5fd',
  
  // Status colors
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  inputFocusBorder: '#818cf8',
  placeholder: '#64748b',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Shadows
  shadowColor: '#000000',
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
