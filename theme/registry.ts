import type { ThemeRegistry } from './types';
import defaultPreset from '../themes/default/index';
import neutralSolidPreset from '../themes/neutral-solid/index';
import amberMinimalPreset from '../themes/amber-minimal/index';
import amethystHazePreset from '../themes/amethyst-haze/index';
import bubblegumPreset from '../themes/bubblegum/index';
import violetBloomPreset from '../themes/violet-bloom/index';

/**
 * Theme preset registry.
 *
 * Add new themes here (or in a future dynamic loader) without changing any components.
 */
export const themeRegistry: ThemeRegistry = {
  [defaultPreset.id]: defaultPreset,
  [neutralSolidPreset.id]: neutralSolidPreset,
  [amberMinimalPreset.id]: amberMinimalPreset,
  [amethystHazePreset.id]: amethystHazePreset,
  [bubblegumPreset.id]: bubblegumPreset,
  [violetBloomPreset.id]: violetBloomPreset,
  // Backward-compat alias for older persisted `activeThemeId` values.
  default: defaultPreset,
};
