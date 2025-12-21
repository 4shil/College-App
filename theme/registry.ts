import type { ThemeRegistry } from './types';
import defaultPreset from '../themes/default/index';
import neutralSolidPreset from '../themes/neutral-solid/index';

/**
 * Theme preset registry.
 *
 * Add new themes here (or in a future dynamic loader) without changing any components.
 */
export const themeRegistry: ThemeRegistry = {
  [defaultPreset.id]: defaultPreset,
  [neutralSolidPreset.id]: neutralSolidPreset,
  // Backward-compat alias for older persisted `activeThemeId` values.
  default: defaultPreset,
};
