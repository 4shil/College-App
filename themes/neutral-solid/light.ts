import { ThemeTokensNormalized } from '../../theme/types';

// Neutral Solid theme (LIGHT) — mapped 1:1 from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const neutralSolidLightTokens: ThemeTokensNormalized = {
  background: {
    base: '#ffffff',
    // No gradient was defined in the CSS variables; keep a solid background.
    gradientStart: '#ffffff',
    gradientEnd: '#ffffff',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#ffffff',
      backgroundStrong: '#ffffff',
      border: '#e5e5e5',
    },
    card: {
      background: '#ffffff',
      border: '#e5e5e5',
    },
  },

  text: {
    primary: '#0a0a0a',
    secondary: '#737373',
    muted: '#a1a1a1',
    inverse: '#ffffff',
  },

  brand: {
    primary: {
      base: '#171717',
      light: '#171717',
      dark: '#171717',
    },
    secondary: {
      base: '#3a81f6',
      light: '#91c5ff',
    },
  },

  semantic: {
    // CSS only provides a destructive color; other semantic hues are sourced from chart colors.
    success: '#3a81f6',
    warning: '#2563ef',
    error: '#e7000b',
    info: '#91c5ff',
  },

  input: {
    background: '#f5f5f5',
    border: '#e5e5e5',
    focusBorder: '#a1a1a1',
    placeholder: '#737373',
  },

  effects: {
    shadowColor: '#000000',
    shadowIntensity: 0.1,
    // No blur for this theme.
    blurIntensity: 0,
  },

  geometry: {
    // 0.625rem * 16px/rem = 10px
    borderRadius: 10,
    // CSS variables do not specify border width; keep existing system default.
    borderWidth: 1.5,
  },
};
