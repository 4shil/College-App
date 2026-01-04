import { ThemeTokensNormalized } from '../../theme/types';

// Glassmorphism theme (DARK).
// NOTE: Background gradient tuned for a bluish→pinkish look.
export const defaultDarkTokens: ThemeTokensNormalized = {
  background: {
    base: '#0F0F1A',
    gradientStart: '#101A33',
    gradientEnd: '#2A1030',
  },

  surface: {
    glass: {
      background: 'rgba(255, 255, 255, 0.06)',
      backgroundStrong: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
    card: {
      background: 'rgba(255, 255, 255, 0.06)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#A0A0B2',
    muted: '#6B6B80',
    inverse: '#0F0F1A',
  },

  brand: {
    primary: {
      base: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
    },
    secondary: {
      base: '#06B6D4',
      light: '#22D3EE',
    },
  },

  semantic: {
    success: '#4ADE80',
    warning: '#FACC15',
    error: '#F87171',
    info: '#22D3EE',
  },

  input: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(139, 92, 246, 0.25)',
    focusBorder: '#8B5CF6',
    placeholder: '#6B6B80',
  },

  effects: {
    shadowColor: '#8B5CF6',
    shadowIntensity: 0.3,
    blurIntensity: 20,
  },

  geometry: {
    borderRadius: 16,
    borderWidth: 1.5,
  },
};
