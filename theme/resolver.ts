import { legacyColorsFromNormalized } from './legacy';
import { ResolveThemeInput, ResolveThemeOutput, ThemePreset, ThemeTokensNormalized } from './types';

function getPresetOrDefault(registry: ResolveThemeInput['registry'], id: string): ThemePreset {
  return registry[id] ?? registry['default'] ?? Object.values(registry)[0];
}

export function resolveTheme(input: ResolveThemeInput): ResolveThemeOutput {
  const preset = getPresetOrDefault(input.registry, input.activeThemeId);

  // Resolution order:
  // 1) Active theme preset
  // 2) User-selected mode
  // 3) OS appearance (only if mode==='system')
  // 4) Final resolved token object
  const isDark =
    input.mode === 'dark' ? true :
    input.mode === 'light' ? false :
    input.systemIsDark;

  const tokens: ThemeTokensNormalized = isDark ? preset.variants.dark.tokens : preset.variants.light.tokens;
  const colorsLegacy = legacyColorsFromNormalized(tokens);

  return {
    isDark,
    presetId: preset.id,
    presetName: preset.name,
    capabilities: preset.capabilities,
    tokens,
    colorsLegacy,
  };
}
