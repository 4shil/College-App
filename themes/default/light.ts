import { ThemeTokensNormalized } from '../../theme/types';

// Default theme (LIGHT) — extracted 1:1 from the previous `store/themeStore.ts` lightColors.
// IMPORTANT: Do not change any values.
export const defaultLightTokens: ThemeTokensNormalized = {
  background: {
    base: '#FFFFFF',
    gradientStart: '#FFFFFF',
    gradientEnd: '#EFF6FF',
  },

  surface: {
    glass: {
      background: 'rgba(255, 255, 255, 0.85)',
      backgroundStrong: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(0, 0, 0, 0.08)',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(0, 0, 0, 0.06)',
    },
  },

  text: {
    primary: '#1F2937',
    secondary: '#4B5563',
    muted: '#9CA3AF',
    inverse: '#ffffff',
  },

  brand: {
    primary: {
      base: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    secondary: {
      base: '#0EA5E9',
      light: '#38BDF8',
    },
  },

  semantic: {
    success: '#16A34A',
    warning: '#EAB308',
    error: '#DC2626',
    info: '#0891B2',
  },

  input: {
    background: 'rgba(0, 0, 0, 0.03)',
    border: 'rgba(0, 0, 0, 0.1)',
    focusBorder: '#3B82F6',
    placeholder: '#9CA3AF',
  },

  effects: {
    shadowColor: '#000000',
    shadowIntensity: 0.1,
    blurIntensity: 20,
  },

  geometry: {
    borderRadius: 16,
    borderWidth: 1.5,
  },
};
