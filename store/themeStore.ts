import { createStore, persist } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

// Light theme colors - Purple/Blue theme
const lightColors = {
  // Backgrounds
  background: '#F8FAFC',
  backgroundGradientStart: '#F8FAFC',
  backgroundGradientEnd: '#E0E7FF',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.85)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.88)',
  
  // Text
  textPrimary: '#1E1E2E',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#ffffff',
  
  // Primary accent - Purple
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#6D28D9',
  
  // Secondary - Cyan
  secondary: '#0891B2',
  secondaryLight: '#06B6D4',
  
  // Status colors
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#0891B2',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.65)',
  inputBorder: 'rgba(124, 58, 237, 0.2)',
  inputFocusBorder: '#7C3AED',
  placeholder: '#94A3B8',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.78)',
  cardBorder: 'rgba(255, 255, 255, 0.9)',
  
  // Shadows
  shadowColor: '#8B5CF6',
};

// Dark theme colors - Purple/Blue with glowing effects
const darkColors = {
  // Backgrounds
  background: '#0F0F1A',
  backgroundGradientStart: '#0F0F1A',
  backgroundGradientEnd: '#1A1A2E',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.1)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B2',
  textMuted: '#6B6B80',
  textInverse: '#0F0F1A',
  
  // Primary accent - Purple Glow
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  // Secondary - Cyan
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  
  // Status colors
  success: '#4ADE80',
  warning: '#FACC15',
  error: '#F87171',
  info: '#22D3EE',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(139, 92, 246, 0.25)',
  inputFocusBorder: '#8B5CF6',
  placeholder: '#6B6B80',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  
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
