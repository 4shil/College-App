import { ThemeTokensNormalized } from '../../theme/types';

// Amber Minimal theme (LIGHT) — mapped from the provided CSS variables.
// IMPORTANT: Do not change any values.
export const amberMinimalLightTokens: ThemeTokensNormalized = {
  background: {
    base: '#ffffff',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#ffffff',
    gradientEnd: '#ffffff',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      background: '#ffffff',
      backgroundStrong: '#ffffff',
      border: '#e5e7eb',
    },
    card: {
      background: '#ffffff',
      border: '#e5e7eb',
    },
  },

  text: {
    primary: '#262626',
    secondary: '#4b5563',
    muted: '#6b7280',
    // Used for text on primary surfaces (e.g., PrimaryButton).
    inverse: '#000000',
  },

  brand: {
    primary: {
      base: '#f59e0b',
      // Light variant is not provided separately in :root; keep base.
      light: '#f59e0b',
      // Use the amber scale to provide a darker stop for gradients.
      dark: '#b45309',
    },
    secondary: {
      base: '#f3f4f6',
      light: '#f9fafb',
    },
  },

  semantic: {
    // Only destructive is explicitly provided; other semantic hues are sourced from the amber chart scale.
    success: '#d97706',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#92400e',
  },

  input: {
    background: '#f9fafb',
    border: '#e5e7eb',
    focusBorder: '#f59e0b',
    placeholder: '#6b7280',
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
