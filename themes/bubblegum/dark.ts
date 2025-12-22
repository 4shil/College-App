import { ThemeTokensNormalized } from '../../theme/types';

// Bubblegum theme (DARK) — mapped from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const bubblegumDarkTokens: ThemeTokensNormalized = {
  background: {
    base: '#12242e',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#12242e',
    gradientEnd: '#12242e',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#1c2e38',
      backgroundStrong: '#1c2e38',
      border: '#324859',
    },
    card: {
      background: '#1c2e38',
      border: '#324859',
    },
  },

  text: {
    primary: '#f3e3ea',
    secondary: '#f3e4f6',
    muted: '#e4a2b1',
    inverse: '#12242e',
  },

  brand: {
    primary: {
      base: '#fbe2a7',
      light: '#fbe2a7',
      dark: '#fbe2a7',
    },
    secondary: {
      base: '#e4a2b1',
      light: '#24272b',
    },
  },

  semantic: {
    success: '#50afb6',
    warning: '#e4a2b1',
    error: '#e35ea4',
    info: '#175c6c',
  },

  input: {
    background: '#20333d',
    border: '#324859',
    focusBorder: '#50afb6',
    placeholder: '#e4a2b1',
  },

  effects: {
    shadowColor: '#324859',
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
