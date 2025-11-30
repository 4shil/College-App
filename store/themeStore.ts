import { createStore, persist } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

// Light theme colors - Clean white with blue accents
const lightColors = {
  // Backgrounds - pure white
  background: '#FFFFFF',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#EFF6FF',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.95)',
  
  // Text - darker for better contrast
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#ffffff',
  
  // Primary accent - blue
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  // Secondary - sky blue
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  
  // Status colors
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#0891B2',
  
  // Input
  inputBackground: 'rgba(0, 0, 0, 0.03)',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputFocusBorder: '#3B82F6',
  placeholder: '#9CA3AF',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  
  // Shadows
  shadowColor: '#000000',
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
  animationsEnabled: boolean;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  toggleAnimations: () => void;
  setSystemTheme: (isDark: boolean) => void;
}

export const useThemeStore = createStore<ThemeState>(
  persist(
    (set, get) => ({
      mode: 'dark' as ThemeMode,
      isDark: true,
      colors: darkColors,
      animationsEnabled: true,

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

      toggleAnimations: () => {
        set({ animationsEnabled: !get().animationsEnabled });
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
