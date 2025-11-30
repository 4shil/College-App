import { createStore, persist } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

// Light theme colors - Clean and minimal
const lightColors = {
  // Backgrounds
  background: '#f8fafc',
  backgroundGradientStart: '#f1f5f9',
  backgroundGradientEnd: '#e0e7ff',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.85)',
  
  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',
  
  // Primary accent - Purple
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  
  // Secondary - Indigo
  secondary: '#6366F1',
  secondaryLight: '#818CF8',
  
  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.7)',
  inputBorder: 'rgba(124, 58, 237, 0.2)',
  inputFocusBorder: '#7C3AED',
  placeholder: '#94a3b8',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  cardBorder: 'rgba(255, 255, 255, 0.9)',
  
  // Shadows
  shadowColor: '#7C3AED',
};

// Dark theme colors - Deep blue-purple with glowing effects
const darkColors = {
  // Backgrounds
  background: '#0a0a1a',
  backgroundGradientStart: '#0a0a1a',
  backgroundGradientEnd: '#1a1040',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.08)',
  
  // Text
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textInverse: '#0f172a',
  
  // Primary accent - Vibrant Purple
  primary: '#A78BFA',
  primaryLight: '#C4B5FD',
  primaryDark: '#8B5CF6',
  
  // Secondary - Bright Indigo
  secondary: '#818CF8',
  secondaryLight: '#A5B4FC',
  
  // Status colors
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.03)',
  inputBorder: 'rgba(139, 92, 246, 0.2)',
  inputFocusBorder: '#A78BFA',
  placeholder: '#64748b',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.05)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  
  // Shadows
  shadowColor: '#8B5CF6',
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
