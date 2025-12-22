# Amber Minimal

- **id**: `amber-minimal`
- **name**: Amber Minimal
- **description**: warm, minimal, neutral UI with amber accents

## 1) Capabilities

This preset explicitly declares:

- supportsGlassSurfaces: `false`
- supportsBlur: `false`
- supportsAnimatedBackground: `false`

## 2) CSS → App Token Mapping

The app’s theme engine currently consumes **ThemeTokensNormalized** (see `theme/types.ts`).
It does **not** have first-class tokens for popovers, sidebars, charts, spacing, or typography.

### Mapped (used by existing components)

**Core**
- `--background` → `background.base`, `background.gradientStart`, `background.gradientEnd`
- `--foreground` → `text.primary`
- `--secondary-foreground` → `text.secondary`
- `--muted-foreground` → `text.muted`
- `--primary-foreground` → `text.inverse` (used on PrimaryButton)

**Surfaces**
- `--card` → `surface.card.background`
- `--border` → `surface.card.border`, `surface.glass.border`

**Brand / semantic**
- `--primary` → `brand.primary.base`
- `--chart-1` / `--chart-2` / `--chart-3` / `--chart-4` / `--chart-5` → used to fill required `brand.primary.light|dark` and `semantic.*` where no dedicated colors exist in the app token interface.
- `--destructive` → `semantic.error`

**Inputs**
- `--muted` / `--sidebar` → `input.background` (per-variant)
- `--input` → `input.border`
- `--ring` → `input.focusBorder`

**Geometry & effects**
- `--radius` → `geometry.borderRadius` (0.375rem → 6)
- `--shadow-opacity` → `effects.shadowIntensity` (0.1)

### Ignored (no compatible token key exists today)

These variables are **not representable** in the current `ThemeTokensNormalized` shape without adding new tokens (which would require component changes):

- `--card-foreground`, `--popover`, `--popover-foreground`
- `--secondary`, `--muted`, `--accent`, `--accent-foreground` (as distinct semantic groups)
- All `--sidebar-*` (as distinct sidebar token group)
- All `--chart-*` as a dedicated chart palette (only used indirectly as noted above)
- `--font-sans`, `--font-serif`, `--font-mono`
- `--spacing`, `--tracking-normal`
- Detailed shadow strings (`--shadow-2xs` … `--shadow-2xl`, `--shadow-x/y/blur/spread/color`)

## 3) React Native limitations / notes

- The app’s `withAlpha()` helper only parses **hex** and **rgb/rgba** values.
  The CSS source defines `--shadow-color: hsl(0 0% 0%)`, so the theme uses the equivalent `#000000` for `effects.shadowColor` to keep alpha operations working.
- Typography variables are documented but **not currently wired** to any theme token interface in this codebase.

## 4) Files

- `themes/amber-minimal/light.ts`
- `themes/amber-minimal/dark.ts`
- `themes/amber-minimal/index.ts`
