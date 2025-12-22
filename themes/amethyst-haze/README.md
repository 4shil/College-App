# Amethyst Haze

- **id**: `amethyst-haze`
- **name**: Amethyst Haze
- **description**: soft, pastel, lavender-toned, low-contrast UI

## 1) Capabilities

This preset explicitly declares:

- supportsGlassSurfaces: `false`
- supportsBlur: `false`
- supportsAnimatedBackground: `false`

## 2) CSS → App Token Mapping

The app’s theme engine consumes **ThemeTokensNormalized** (see `theme/types.ts`).
That interface does **not** currently provide first-class tokens for:
- popovers
- sidebar
- chart palettes
- typography
- spacing / tracking
- per-size radii
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
- `--muted-foreground` → `text.muted`
- `--primary-foreground` → `text.inverse`

**Brand / semantic**
- `--primary` → `brand.primary.base|light|dark`
- `--secondary` → `brand.secondary.base`
- `--muted` → `brand.secondary.light`
- `--destructive` → `semantic.error`
- `--chart-3` → `semantic.success`
- `--chart-4` → `semantic.warning`
- `--chart-5` → `semantic.info`

**Inputs**
- `--input` → `input.background`
- `--border` → `input.border`
- `--ring` → `input.focusBorder`
- `--muted-foreground` → `input.placeholder`

**Geometry & effects**
- `--radius` → `geometry.borderRadius` (`0.5rem` → `8`)
- `--shadow-opacity` → `effects.shadowIntensity` (`0.06`)
- `--shadow-color` → `effects.shadowColor` (kept verbatim as `hsl(0 0% 0%)`)

### Ignored (no compatible token key exists today)

These variables can’t be represented in the current `ThemeTokensNormalized` shape without introducing new tokens (which would require component changes):

- `--card-foreground`, `--popover`, `--popover-foreground`
- `--accent`, `--accent-foreground` (as a dedicated accent group)
- all `--sidebar-*`
- `--chart-1`..`--chart-5` as a dedicated chart palette (only some are used indirectly)
- `--font-sans`, `--font-serif`, `--font-mono`
- `--spacing`, `--tracking-normal`
- detailed shadow strings (`--shadow-2xs` … `--shadow-2xl`, and x/y/blur/spread)

## 3) React Native limitations

- The codebase alpha helper `withAlpha()` only parses hex/rgb/rgba. This theme keeps `--shadow-color` as **HSL** exactly (`hsl(0 0% 0%)`), so if any component applies alpha to `colors.shadowColor`, it may not change the value. This is documented here rather than altering color values.
- Typography variables are documented but **not currently wired** into the theme token interface.

## 4) Files

- `themes/amethyst-haze/light.ts`
- `themes/amethyst-haze/dark.ts`
- `themes/amethyst-haze/index.ts`
