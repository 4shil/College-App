import { ThemeTokensNormalized } from '../../theme/types';

// Amber Minimal theme (DARK) — mapped from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const amberMinimalDarkTokens: ThemeTokensNormalized = {
  background: {
    base: '#171717',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#171717',
    gradientEnd: '#171717',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#262626',
      backgroundStrong: '#262626',
      border: '#404040',
    },
    card: {
      background: '#262626',
      border: '#404040',
    },
  },

  text: {
    primary: '#e5e5e5',
    secondary: '#e5e5e5',
    muted: '#a3a3a3',
    // Used for text on primary surfaces (e.g., PrimaryButton).
    inverse: '#000000',
  },

  brand: {
    primary: {
      base: '#f59e0b',
      // Use a lighter amber for the gradient top stop in dark mode.
      light: '#fbbf24',
      dark: '#92400e',
    },
    secondary: {
      base: '#262626',
      light: '#1f1f1f',
    },
  },

  semantic: {
    success: '#d97706',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#b45309',
  },

  input: {
    background: '#1f1f1f',
    border: '#404040',
    focusBorder: '#f59e0b',
    placeholder: '#a3a3a3',
  },

  effects: {
    // Source CSS uses hsl(0 0% 0%). We use hex here because the app's withAlpha() helper only parses hex/rgb.
    shadowColor: '#000000',
    shadowIntensity: 0.1,
    // No blur for this theme.
    blurIntensity: 0,
  },

  geometry: {
    // 0.375rem * 16px/rem = 6px
    borderRadius: 6,
    // CSS variables do not specify border width; keep existing system default.
    borderWidth: 1.5,
  },
};
