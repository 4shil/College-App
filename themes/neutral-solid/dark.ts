import { ThemeTokensNormalized } from '../../theme/types';

// Neutral Solid theme (DARK) — mapped 1:1 from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const neutralSolidDarkTokens: ThemeTokensNormalized = {
  background: {
    base: '#0a0a0a',
    // No gradient was defined in the CSS variables; keep a solid background.
    gradientStart: '#0a0a0a',
    gradientEnd: '#0a0a0a',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#171717',
      backgroundStrong: '#171717',
      border: '#282828',
    },
    card: {
      background: '#171717',
      border: '#282828',
    },
  },

  text: {
    primary: '#fafafa',
    secondary: '#a1a1a1',
    muted: '#867a7aff',
    inverse: '#0a0a0a',
  },

  brand: {
    primary: {
      base: '#e5e5e5',
      light: '#e5e5e5',
      dark: '#e5e5e5',
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
    error: '#ffffffff',
    info: '#91c5ff',
  },

  input: {
    background: '#262626',
    border: '#343434',
    focusBorder: '#737373',
    placeholder: '#a1a1a1',
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
    borderWidth: 0,
  },
};
