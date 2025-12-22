import { ThemeTokensNormalized } from '../../theme/types';

// Amethyst Haze theme (DARK) — mapped from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const amethystHazeDarkTokens: ThemeTokensNormalized = {
  background: {
    base: '#1a1823',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#1a1823',
    gradientEnd: '#1a1823',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#232030',
      backgroundStrong: '#232030',
      border: '#302c40',
    },
    card: {
      background: '#232030',
      border: '#302c40',
    },
  },

  text: {
    primary: '#e0ddef',
    secondary: '#e0ddef',
    muted: '#a09aad',
    // Matches --primary-foreground (used for text on primary surfaces).
    inverse: '#1a1823',
  },

  brand: {
    primary: {
      base: '#a995c9',
      light: '#a995c9',
      dark: '#a995c9',
    },
    secondary: {
      base: '#5a5370',
      light: '#242031',
    },
  },

  semantic: {
    success: '#77b8a1',
    warning: '#f0c88d',
    error: '#e57373',
    info: '#a0bbe3',
  },

  input: {
    background: '#2a273a',
    border: '#302c40',
    focusBorder: '#a995c9',
    placeholder: '#a09aad',
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
