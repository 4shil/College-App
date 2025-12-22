# Bubblegum

- **id**: `bubblegum`
- **name**: Bubblegum
- **description**: playful, pastel, high-contrast UI with bold accent colors

## 1) Capabilities

This preset explicitly declares:

- supportsGlassSurfaces: `false`
- supportsBlur: `false`
- supportsAnimatedBackground: `false`

## 2) CSS → App Token Mapping

The app’s theme engine consumes **ThemeTokensNormalized** (see `theme/types.ts`).
That interface does **not** currently provide first-class tokens for:
- popovers
- sidebars
- chart palettes (as a grouped palette)
- typography
- spacing / tracking
- detailed per-size radii
- detailed shadow stacks

So this preset maps what can be represented **without changing the token interface or components**, and documents the rest.

### Mapped (ThemeTokensNormalized)

**Background**
- `--background` → `background.base`, `background.gradientStart`, `background.gradientEnd`

**Surfaces**
- `--card` → `surface.card.background`
- `--border` → `surface.card.border` and `surface.glass.border` (solid fallback)

**Text**
- `--foreground` → `text.primary`
- `--secondary-foreground` → `text.secondary`
- `--muted-foreground` → `text.muted` and `input.placeholder`
- `--primary-foreground` → `text.inverse`

**Brand / semantic**
- `--primary` → `brand.primary.base`
- `--ring` → `brand.primary.light` (and `input.focusBorder`)
- `--chart-5` → `brand.primary.dark`
- `--secondary` → `brand.secondary.base`
- `--muted` → `brand.secondary.light`
- `--destructive` → `semantic.error`
- `--chart-2` → `semantic.success`
- `--chart-3` → `semantic.warning`
- `--chart-4` → `semantic.info`

**Inputs**
- `--input` → `input.background`
- `--border` → `input.border`

**Geometry & effects**
- `--radius` → `geometry.borderRadius` (`0.4rem` → `6.4`)
- `--shadow-opacity` → `effects.shadowIntensity` (`1.0`)
- `--shadow-color` → `effects.shadowColor` (kept verbatim)

### Ignored (no compatible token key exists today)

These variables can’t be represented in the current `ThemeTokensNormalized` shape without introducing new tokens (which would require component changes):

- `--card-foreground`, `--popover`, `--popover-foreground`
- `--accent`, `--accent-foreground` (as a dedicated accent group)
- all `--sidebar-*`
- `--chart-1`..`--chart-5` as a dedicated chart palette (some are used indirectly above)
- `--font-sans`, `--font-serif`, `--font-mono`
- `--spacing`, `--tracking-normal`
- detailed shadow strings (`--shadow-2xs` … `--shadow-2xl`, and x/y/blur/spread)

## 3) React Native limitations

- The codebase alpha helper `withAlpha()` only parses hex/rgb/rgba. This theme keeps the light `--shadow-color` as **HSL** exactly (`hsl(325.78 58.18% 56.86% / 0.5)`), so if a component applies alpha to `colors.shadowColor`, it may not change the value.
- The CSS shadow stack (hard offset style) cannot be expressed exactly through the current theme token interface; only `shadowColor` and `shadowIntensity` are available. Preserving the full offset mechanics would require new tokens + component updates.

## 4) Files

- `themes/bubblegum/light.ts`
- `themes/bubblegum/dark.ts`
- `themes/bubblegum/index.ts`
