export type ThemeMode = 'light' | 'dark' | 'system';
export type UIStyle = 'glassmorphism';

// Theme capability flags are compile-time properties of a theme preset.
// UI/runtime logic should gate features using these flags (not theme id/name checks).
export interface ThemeCapabilities {
  /** Theme renders translucent “glass” surfaces (cards/panels). */
  supportsGlassSurfaces: boolean;
  /** Theme uses blur effects (e.g., BlurView). */
  supportsBlur: boolean;
  /** Theme supports animated glassmorphic backgrounds. */
  supportsAnimatedBackground: boolean;
}

// NOTE: This is the existing, production-used token surface that components rely on.
// It must remain stable for backward compatibility.
export interface ThemeColorsLegacy {
  // Background + glass
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  glassBackground: string;
  glassBackgroundStrong: string;
  glassBorder: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand + semantic
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;

  // Inputs
  inputBackground: string;
  inputBorder: string;
  inputFocusBorder: string;
  placeholder: string;

  // Cards
  cardBackground: string;
  cardBorder: string;

  // Geometry + effects
  shadowColor: string;
  borderRadius: number;
  borderWidth: number;
  shadowIntensity: number;
  blurIntensity: number;
}

// Normalized shape (domain-grouped). This is what future themes must implement.
// Values must be identical to legacy for the current preset.
export interface ThemeTokensNormalized {
  background: {
    base: string;
    gradientStart: string;
    gradientEnd: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  brand: {
    primary: {
      base: string;
      light: string;
      dark: string;
    };
    secondary: {
      base: string;
      light: string;
    };
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  input: {
    background: string;
    border: string;
    focusBorder: string;
    placeholder: string;
  };
  surface: {
    glass: {
      background: string;
      backgroundStrong: string;
      border: string;
    };
    card: {
      background: string;
      border: string;
    };
  };
  effects: {
    shadowColor: string;
    shadowIntensity: number;
    blurIntensity: number;
  };
  geometry: {
    borderRadius: number;
    borderWidth: number;
  };
}

export interface ThemeVariant {
  tokens: ThemeTokensNormalized;
}

export interface ThemePreset {
  id: string;
  name: string;
  // Which UI styles the theme can support (presently only glassmorphism exists).
  supportedUIStyles: UIStyle[];
  // Static metadata/capabilities (used for feature gating without theme name checks).
  capabilities: ThemeCapabilities;
  variants: {
    light: ThemeVariant;
    dark: ThemeVariant;
  };
}

export type ThemeRegistry = Record<string, ThemePreset>;

export interface ResolveThemeInput {
  registry: ThemeRegistry;
  activeThemeId: string;
  mode: ThemeMode;
  // For mode==='system': current resolved system darkness.
  // IMPORTANT: We intentionally do not read OS appearance here to preserve existing behavior.
  systemIsDark: boolean;
}

export interface ResolveThemeOutput {
  isDark: boolean;
  presetId: string;
  presetName: string;
  capabilities: ThemeCapabilities;
  tokens: ThemeTokensNormalized;
  colorsLegacy: ThemeColorsLegacy;
}
