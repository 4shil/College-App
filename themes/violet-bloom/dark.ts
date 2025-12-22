import { ThemeTokensNormalized } from '../../theme/types';

// Violet Bloom theme (DARK) — mapped from the provided CSS variables.
// IMPORTANT: Values are preserved verbatim; no redesign or stylistic changes.
export const violetBloomDarkTokens: ThemeTokensNormalized = {
  background: {
    base: '#1a1b1e',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#1a1b1e',
    gradientEnd: '#1a1b1e',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      // Mapped from `--popover`.
      background: '#222327',
      // No separate “strong” surface token exists in the source; keep it solid.
      backgroundStrong: '#222327',
      // Mapped from `--border`.
      border: '#33353a',
    },
    card: {
      background: '#222327',
      border: '#33353a',
    },
  },

  text: {
    primary: '#f0f0f0',
    // Use muted-foreground as the generic secondary text step.
    secondary: '#a0a0a0',
    // Use chart-5 as a distinct muted step (provided by source CSS).
    muted: '#a0a0a0',
    // Used for text on primary surfaces (e.g., buttons).
    inverse: '#ffffff',
  },

  brand: {
    primary: {
      base: '#8c5cff',
      // Extra stops are required by the token interface; source provides only one value.
      light: '#8c5cff',
      dark: '#8c5cff',
    },
    secondary: {
      base: '#2a2c33',
      // Source provides only one value.
      light: '#2a2c33',
    },
  },

  semantic: {
    // Source only provides `--destructive`; remaining semantic hues are mapped from chart colors.
    success: '#4ade80',
    warning: '#fca5a5',
    error: '#f87171',
    info: '#5993f4',
  },

  input: {
    background: '#33353a',
    border: '#33353a',
    focusBorder: '#8c5cff',
    placeholder: '#a0a0a0',
  },

  effects: {
    shadowColor: '#000000',
    shadowIntensity: 0.16,
    // No blur for this theme.
    blurIntensity: 0,
  },

  geometry: {
    // `--radius: 1.4rem` → 1.4 * 16px/rem = 22.4
    borderRadius: 22.4,
    borderWidth: 1.5,
  },
};
