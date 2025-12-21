import { ThemeColorsLegacy, ThemeTokensNormalized } from './types';

export function legacyColorsFromNormalized(tokens: ThemeTokensNormalized): ThemeColorsLegacy {
  return {
    background: tokens.background.base,
    backgroundGradientStart: tokens.background.gradientStart,
    backgroundGradientEnd: tokens.background.gradientEnd,

    glassBackground: tokens.surface.glass.background,
    glassBorder: tokens.surface.glass.border,
    glassBackgroundStrong: tokens.surface.glass.backgroundStrong,

    textPrimary: tokens.text.primary,
    textSecondary: tokens.text.secondary,
    textMuted: tokens.text.muted,
    textInverse: tokens.text.inverse,

    primary: tokens.brand.primary.base,
    primaryLight: tokens.brand.primary.light,
    primaryDark: tokens.brand.primary.dark,

    secondary: tokens.brand.secondary.base,
    secondaryLight: tokens.brand.secondary.light,

    success: tokens.semantic.success,
    warning: tokens.semantic.warning,
    error: tokens.semantic.error,
    info: tokens.semantic.info,

    inputBackground: tokens.input.background,
    inputBorder: tokens.input.border,
    inputFocusBorder: tokens.input.focusBorder,
    placeholder: tokens.input.placeholder,

    cardBackground: tokens.surface.card.background,
    cardBorder: tokens.surface.card.border,

    shadowColor: tokens.effects.shadowColor,
    borderRadius: tokens.geometry.borderRadius,
    borderWidth: tokens.geometry.borderWidth,
    shadowIntensity: tokens.effects.shadowIntensity,
    blurIntensity: tokens.effects.blurIntensity,
  };
}
