# Neutral Solid Theme Preset

A neutral, high-contrast theme built on solid surfaces (no glass/blur/animated background).

## Identity
- **id**: `neutral-solid`
- **name**: Neutral Solid
- **philosophy**: Solid surfaces, minimal effects, clear contrast; intended to work without translucent layers.

## CSS → Token Mapping

### Mapped variables (light / `:root`)
- `--background` → `background.base`, `background.gradientStart`, `background.gradientEnd`
- `--foreground` → `text.primary`
- `--muted-foreground` → `text.secondary`, `input.placeholder`
- `--ring` → `text.muted`, `input.focusBorder`
- `--card` → `surface.card.background`
- `--border` → `surface.card.border`, `surface.glass.border`
- `--primary` → `brand.primary.base/light/dark` (same value; no variants provided)
- `--destructive` → `semantic.error`
- `--secondary` / `--muted` / `--accent` → `input.background`
- `--input` → `input.border`
- `--chart-1` / `--chart-2` / `--chart-3` → `brand.secondary.*` and non-error `semantic.*`
- `--radius` → `geometry.borderRadius` (0.625rem → 10)
- `--shadow-opacity` / `--shadow-color` → `effects.shadowIntensity` / `effects.shadowColor`

### Mapped variables (dark / `.dark`)
Same mapping rules as light, using the dark values.

### Intentionally ignored
These variables exist in the CSS input but are not representable in the current app theme token interface:
- `--font-sans`, `--font-serif`, `--font-mono` (no typography token group in `ThemeTokensNormalized`)
- `--shadow-x`, `--shadow-y`, `--shadow-blur`, `--shadow-spread` and the full `--shadow-*` strings (no per-component shadow token group in `ThemeTokensNormalized`)
- `--tracking-normal`, `--spacing` (no spacing/typography scales in `ThemeTokensNormalized`)
- Sidebar variables (`--sidebar*`) (no sidebar-specific token group in `ThemeTokensNormalized`)

### Adapted (and why)
- **Gradients**: no gradient variables were provided; `background.gradientStart/end` are set equal to `--background` (solid).
- **Semantic colors**: only `--destructive` is provided; other semantic slots (`success/warning/info`) are mapped from `--chart-*` to avoid inventing new colors.
- **Glass tokens**: required by the normalized interface, but this theme doesn’t support glass. We use solid fallbacks (card/background + border) so glass-only components degrade gracefully.

## Capabilities
This preset declares:
- `supportsGlassSurfaces: false`
- `supportsBlur: false`
- `supportsAnimatedBackground: false`

This enables capability-based gating (no theme-name checks):
- Background animation toggle should be hidden.
- Blur-based UI should run with `intensity=0`.
- Animated background should render minimal/static.
