# Globalized Theme System Architecture (Multi-Theme Ready, Zero-Visual-Change)

**Date:** 2025-12-20  
**Scope:** Structural refactor only (“globalize it”), **no design changes**, no token/value/color changes, no animation changes.

This document describes the architecture that makes the existing theme behave as the **default preset** inside a future multi-theme system.

---

## 1) Concept & Goals

### What “globalize” means (in this repo)
- The app currently assumes a single theme and reads a **flat** `colors.*` object everywhere.
- “Globalize” means introducing a **registry + resolver + preset** model so multiple themes can exist later **without touching components again**.

### Hard constraints
- **Zero visual change** today: the default preset must render identically to the old theme.
- **Backward compatibility**: existing imports and `colors.*` usages must keep working.
- **Future extensibility**: adding a new theme should be data-only (new preset files + registry entry) and should not require rewriting UI components.

---

## 2) Architecture Overview (High-Level)

The new theming system is split into three responsibilities:

1. **Preset data**: token values for each theme and variant (light/dark).  
2. **Resolver**: given `activeThemeId`, `mode`, and `systemIsDark`, compute the *resolved* theme.
3. **Runtime store**: global state for theme selection and toggles, persisted across launches.

The compatibility requirement is satisfied by always emitting the legacy flat token shape:
- `colors` (legacy flat shape) remains the stable API surface for components.

---

## 3) Theme Registry (Preset Discovery)

### What it is
A registry is a mapping:

- `themeId -> ThemePreset`

It is intentionally simple for now (static object), but can later become dynamic (remote presets, feature flags, etc.).

### Where it lives
- `theme/registry.ts`

### Why it exists
- Central place to add new themes.
- Prevents “scatter” where screens/components import theme data directly.

---

## 4) Token Normalization (Why We Introduced a Second Shape)

### The two shapes
1. **Normalized tokens** (`ThemeTokensNormalized`)
   - Grouped by domain (background/text/surface/semantic/effects/geometry/etc.).
   - Scales better for multiple UI styles and multiple themes.

2. **Legacy flat colors** (`ThemeColorsLegacy`)
   - Matches existing `store/themeStore.ts` public surface.
   - Keeps every existing `colors.someKey` usage working without edits.

### Why normalize at all?
- Flat token objects become fragile when adding themes because naming drifts and collisions grow.
- Normalization gives a stable “schema” for new theme presets.

---

## 5) Preset Extraction (Default Theme = One Preset)

### What changed
- The current app theme is now represented as a **preset** with `light` and `dark` variants.

### Where it lives
- `themes/default/light.ts`
- `themes/default/dark.ts`
- `themes/default/index.ts`

### Guarantee
- The values in `themes/default/*` are copied from the existing theme so visuals remain unchanged.

---

## 6) Resolution Pipeline (How Final Theme Is Computed)

### Inputs
- `registry`: available presets
- `activeThemeId`: which preset the user selected (defaults to `default`)
- `mode`: `light | dark | system`
- `systemIsDark`: boolean used only when `mode === 'system'`

### Outputs
- `isDark`: final boolean
- `tokens`: normalized resolved tokens for the active variant
- `colorsLegacy`: flattened legacy colors for compatibility

### Where it lives
- `theme/resolver.ts` (pure function)
- `theme/legacy.ts` (converter from normalized -> legacy)

### Why a pure resolver?
- Makes behavior deterministic and testable.
- Prevents “hidden” reads from OS state in random places.

---

## 7) Runtime Theme Store (Global, Persistent)

### What it stores
The new global store is a superset of the old one:
- `activeThemeId` (future-proof)
- `mode`, `isDark` (backward-compatible)
- `uiStyle` (existing concept)
- `animationsEnabled` and `effectsEnabled` (kept aligned)
- `colors` (legacy flat)
- `resolvedColors` (alias of the legacy flat colors)
- `resolvedTokens` (normalized tokens, currently kept as a future-facing field)

### Where it lives
- `theme/store.ts`

### Persistence
- Uses the same persistence mechanism as before (`persist` with AsyncStorage).

### Zero-visual-change behavior notes
- The store intentionally preserves previous semantics:
  - `toggleTheme()` toggles *dark <-> light*.
  - `setSystemTheme()` only updates when `mode === 'system'`.
  - We do **not** automatically wire OS appearance changes in this refactor (that would be behavior change).

---

## 8) Backward Compatibility Contract (No Component Changes)

### Stable imports
Existing component code continues to import from the old location:
- `store/themeStore.ts`

That file is now a **compatibility wrapper** that re-exports the new global store hook.

### Stable runtime shape
Components that do:
- `const { colors, isDark, mode, toggleTheme } = useThemeStore()`

…still receive the same keys.

### Compatibility layer
- Normalized tokens are converted to the old flat `colors` object via:
  - `theme/legacy.ts` (`legacyColorsFromNormalized()`)

---

## 9) Folder Structure (Source of Truth)

Current structure used by the refactor:

- `theme/`
  - `types.ts` (canonical types)
  - `legacy.ts` (normalized -> legacy)
  - `resolver.ts` (resolution pipeline)
  - `registry.ts` (preset registry)
  - `store.ts` (global theme store)
  - `index.ts` (barrel exports)

- `themes/`
  - `default/`
    - `light.ts`
    - `dark.ts`
    - `index.ts`

- `store/themeStore.ts`
  - Compatibility wrapper (public API)

Rule of thumb:
- **Presets live in** `themes/`
- **Logic and state live in** `theme/`
- **Legacy public entrypoint remains** `store/themeStore.ts`

---

## 10) Extension Rules + Migration Strategy

### Adding a new theme (future)
To add a new theme later without touching UI components:
1. Create `themes/<newThemeId>/light.ts` and `themes/<newThemeId>/dark.ts` exporting normalized tokens.
2. Create `themes/<newThemeId>/index.ts` exporting a `ThemePreset` as the default export.
3. Register it in `theme/registry.ts` (add `[preset.id]: preset`).

### Adding new tokens safely
- Add new token fields to `ThemeTokensNormalized`.
- Update `legacyColorsFromNormalized()` to map new tokens if components need them via `colors.*`.
- Prefer adding tokens in normalized space first, and only expose them in legacy space when necessary.

### Migration strategy (incremental, low-risk)
This refactor is designed so migration can happen gradually:
- Existing components keep reading `colors.*`.
- New components (later) may read from normalized tokens once a stable access pattern is introduced.
- Over time, hard-coded colors in screens can be replaced with tokens without changing the architecture again.

### Explicit non-goals (for this change)
- Automatically tracking OS theme changes for `mode === 'system'`.
- Removing hard-coded colors across screens.
- Changing BlurView tint behavior.

Those are valuable improvements, but they are **separate** changes because they can alter UI output.
