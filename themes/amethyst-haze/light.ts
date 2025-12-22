import { ThemeTokensNormalized } from '../../theme/types';

// Amethyst Haze theme (LIGHT) — mapped from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const amethystHazeLightTokens: ThemeTokensNormalized = {
  background: {
    base: '#f8f7fa',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#f8f7fa',
    gradientEnd: '#f8f7fa',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#ffffff',
      backgroundStrong: '#ffffff',
      border: '#cec9d9',
    },
    card: {
      background: '#ffffff',
      border: '#cec9d9',
    },
  },

  text: {
    primary: '#3d3c4f',
    secondary: '#3d3c4f',
    muted: '#6b6880',
    // Matches --primary-foreground (used for text on primary surfaces).
    inverse: '#f8f7fa',
  },

  brand: {
    primary: {
      base: '#8a79ab',
      light: '#8a79ab',
      dark: '#8a79ab',
    },
    secondary: {
      base: '#dfd9ec',
      light: '#dcd9e3',
    },
  },

  semantic: {
    success: '#77b8a1',
    warning: '#f0c88d',
    error: '#d95c5c',
    info: '#a0bbe3',
  },

  input: {
    background: '#eae7f0',
    border: '#cec9d9',
    focusBorder: '#8a79ab',
    placeholder: '#6b6880',
  },

  effects: {
    // NOTE: This is intentionally kept verbatim (HSL), as provided.
    // React Native alpha utilities may not parse HSL strings; see README for limitations.
    shadowColor: 'hsl(0 0% 0%)',
    shadowIntensity: 0.06,
    // No blur for this theme.
    blurIntensity: 0,
  },

  geometry: {
    // 0.5rem * 16px/rem = 8px
    borderRadius: 8,
    // CSS variables do not specify border width; keep existing system default.
    borderWidth: 1.5,
  },
};
