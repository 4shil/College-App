// Compatibility theme store.
//
// IMPORTANT:
// - Keep exports and runtime behavior identical for existing components.
// - Treat current theme as the `default` preset in a global registry.

export type { ThemeMode, UIStyle, ThemeColorsLegacy as ThemeColors } from '../theme/types';
export { uiStyleInfo, useGlobalThemeStore as useThemeStore } from '../theme/store';

// Backward-compatible token exports (exact values).
// These remain the legacy flat token shape used widely across the codebase.
export { defaultLightTokens, defaultDarkTokens } from '../themes/default';

import { legacyColorsFromNormalized } from '../theme/legacy';
import { defaultLightTokens, defaultDarkTokens } from '../themes/default';

export const lightColors = legacyColorsFromNormalized(defaultLightTokens);
export const darkColors = legacyColorsFromNormalized(defaultDarkTokens);
