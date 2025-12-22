import { ThemeTokensNormalized } from '../../theme/types';

// Bubblegum theme (LIGHT) — mapped from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const bubblegumLightTokens: ThemeTokensNormalized = {
  background: {
    base: '#f6e6ee',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#f6e6ee',
    gradientEnd: '#f6e6ee',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#fdedc9',
      backgroundStrong: '#fdedc9',
      border: '#d04f99',
    },
    card: {
      background: '#fdedc9',
      border: '#d04f99',
    },
  },

  text: {
    primary: '#5b5b5b',
    secondary: '#333333',
    muted: '#7a7a7a',
    inverse: '#ffffff',
  },

  brand: {
    primary: {
      base: '#d04f99',
      // Extra stops are required by the token interface; use provided palette values.
      light: '#e670ab',
      dark: '#d7488e',
    },
    secondary: {
      base: '#8acfd1',
      light: '#b2e1eb',
    },
  },

  semantic: {
    success: '#84d2e2',
    warning: '#fbe2a7',
    error: '#f96f70',
    info: '#f3a0ca',
  },

  input: {
    background: '#e4e4e4',
    border: '#d04f99',
    focusBorder: '#e670ab',
    placeholder: '#7a7a7a',
  },

  effects: {
    // Converted from `hsl(325.78 58.18% 56.86% / 0.5)` to an RN-safe hex color.
    shadowColor: '#d1519a',
    shadowIntensity: 1.0,
    // No blur for this theme.
    blurIntensity: 0,
  },

  geometry: {
    // 0.4rem * 16px/rem = 6.4px
    borderRadius: 6.4,
    // CSS variables do not specify border width; keep existing system default.
    borderWidth: 1.5,
  },
};
