import { ThemeTokensNormalized } from '../../theme/types';

// Violet Bloom theme (LIGHT) — mapped from the provided CSS variables.
// IMPORTANT: Values are preserved verbatim; no redesign or stylistic changes.
export const violetBloomLightTokens: ThemeTokensNormalized = {
  background: {
    base: '#fdfdfd',
    // No gradient variables were provided; keep a solid background.
    gradientStart: '#fdfdfd',
    gradientEnd: '#fdfdfd',
  },

  surface: {
    // This theme does NOT support glass surfaces; these are solid fallbacks.
    glass: {
      // Mapped from `--popover`.
      background: '#fcfcfc',
      // No separate “strong” surface token exists in the source; keep it solid.
      backgroundStrong: '#fdfdfd',
      // Mapped from `--border`.
      border: '#e7e7ee',
    },
    card: {
      background: '#fdfdfd',
      border: '#e7e7ee',
    },
  },

  text: {
    primary: '#000000',
    // No dedicated “secondary text” token exists in the CSS source; use muted-foreground.
    secondary: '#525252',
    // Use chart-5 as a distinct muted step (provided by source CSS).
    muted: '#747474',
    // Used for text on primary surfaces (e.g., buttons).
    inverse: '#ffffff',
  },

  brand: {
    primary: {
      base: '#7033ff',
      // Extra stops are required by the token interface; source provides only one value.
      light: '#7033ff',
      dark: '#7033ff',
    },
    secondary: {
      base: '#edf0f4',
      // Source provides only one value.
      light: '#edf0f4',
    },
  },

  semantic: {
    // Source only provides `--destructive`; remaining semantic hues are mapped from chart colors.
    success: '#4ac885',
    warning: '#fd822b',
    error: '#e54b4f',
    info: '#3276e4',
  },

  input: {
    // Mapped from `--input`.
    background: '#ebebeb',
    // Mapped from `--border`.
    border: '#e7e7ee',
    // Mapped from `--ring`.
    focusBorder: '#000000',
    // Mapped from `--muted-foreground`.
    placeholder: '#525252',
  },

  effects: {
    // Source CSS uses `hsl(0 0% 0%)`. Use hex because the app's alpha helper expects hex/rgb.
    shadowColor: '#000000',
    // Mapped from `--shadow-opacity`.
    shadowIntensity: 0.16,
    // No blur for this theme.
    blurIntensity: 0,
  },

  geometry: {
    // `--radius: 1.4rem` → 1.4 * 16px/rem = 22.4
    borderRadius: 22.4,
    // CSS variables do not specify border width; keep existing system default.
    borderWidth: 1.5,
  },
};
