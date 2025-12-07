import { createStore, persist } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type UIStyle = 'glassmorphism';

const lightColors = {
  background: '#FFFFFF',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#EFF6FF',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.95)',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#ffffff',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#0891B2',
  inputBackground: 'rgba(0, 0, 0, 0.03)',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputFocusBorder: '#3B82F6',
  placeholder: '#9CA3AF',
  cardBackground: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  shadowColor: '#000000',
  borderRadius: 16,
  borderWidth: 0,
  shadowIntensity: 0.1,
  blurIntensity: 20,
};

const darkColors = {
  background: '#0F0F1A',
  backgroundGradientStart: '#0F0F1A',
  backgroundGradientEnd: '#1A1A2E',
  glassBackground: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B2',
  textMuted: '#6B6B80',
  textInverse: '#0F0F1A',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  success: '#4ADE80',
  warning: '#FACC15',
  error: '#F87171',
  info: '#22D3EE',
  inputBackground: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(139, 92, 246, 0.25)',
  inputFocusBorder: '#8B5CF6',
  placeholder: '#6B6B80',
  cardBackground: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  shadowColor: '#8B5CF6',
  borderRadius: 16,
  borderWidth: 0,
  shadowIntensity: 0.3,
  blurIntensity: 20,
};

export const uiStyleInfo = {
  glassmorphism: { name: 'Glassmorphism', description: 'Translucent blur effects', category: 'Modern' },
};

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  uiStyle: UIStyle;
  colors: typeof lightColors;
  animationsEnabled: boolean;
  setMode: (mode: ThemeMode) => void;
  setUIStyle: (style: UIStyle) => void;
  toggleTheme: () => void;
  toggleAnimations: () => void;
  setSystemTheme: (isDark: boolean) => void;
}

export const useThemeStore = createStore<ThemeState>(
  persist(
    (set, get) => ({
      mode: 'dark' as ThemeMode,
      isDark: true,
      uiStyle: 'glassmorphism' as UIStyle,
      colors: darkColors,
      animationsEnabled: true,
      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'dark' || (mode === 'system' && get().isDark);
        set({ mode, isDark, colors: isDark ? darkColors : lightColors });
      },
      setUIStyle: (style: UIStyle) => {
        set({ uiStyle: style });
      },
      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        const isDark = newMode === 'dark';
        set({ mode: newMode, isDark, colors: isDark ? darkColors : lightColors });
      },
      toggleAnimations: () => {
        set({ animationsEnabled: !get().animationsEnabled });
      },
      setSystemTheme: (systemIsDark: boolean) => {
        const mode = get().mode;
        if (mode === 'system') {
          set({ isDark: systemIsDark, colors: systemIsDark ? darkColors : lightColors });
        }
      },
    }),
    { name: 'theme-storage', storage: AsyncStorage }
  )
);

export type ThemeColors = typeof lightColors;
export { lightColors, darkColors };
