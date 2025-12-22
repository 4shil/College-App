# Violet Bloom Theme Mapping (CSS → React Native Tokens)

This document maps the provided **violet-bloom** CSS variables (single source of truth) into the app’s existing `ThemePreset` / `ThemeTokensNormalized` structure.

## 1) Theme Identity

- **id**: `violet-bloom`
- **name**: `Violet Bloom`
- **description**: clean, modern UI with violet accents, rounded surfaces, subtle shadows, and slightly tight letter-spacing

Files:
- `themes/violet-bloom/light.ts`
- `themes/violet-bloom/dark.ts`
- `themes/violet-bloom/index.ts`

## 2) What Was Mapped (Light)

Source: `:root { ... }`

### Background & Surface
- `--background` → `tokens.background.base`, `tokens.background.gradientStart`, `tokens.background.gradientEnd`
- `--card` → `tokens.surface.card.background`
- `--border` → `tokens.surface.card.border`
- `--popover` → `tokens.surface.glass.background`
- `--card` → `tokens.surface.glass.backgroundStrong` (no separate strong token in CSS)
- `--border` → `tokens.surface.glass.border`

### Text
- `--foreground` → `tokens.text.primary`
- `--muted-foreground` → `tokens.text.secondary`
- `--chart-5` → `tokens.text.muted` (used as the distinct muted step)
- `--primary-foreground` → `tokens.text.inverse`

### Brand
- `--primary` → `tokens.brand.primary.base`
- `--primary` → `tokens.brand.primary.light`
- `--primary` → `tokens.brand.primary.dark`
- `--secondary` → `tokens.brand.secondary.base`
- `--secondary` → `tokens.brand.secondary.light`

### Semantic
- `--destructive` → `tokens.semantic.error`
- `--chart-1` → `tokens.semantic.success`
- `--chart-3` → `tokens.semantic.warning`
- `--chart-4` → `tokens.semantic.info`

### Input
- `--input` → `tokens.input.background`
- `--border` → `tokens.input.border`
- `--ring` → `tokens.input.focusBorder`
- `--muted-foreground` → `tokens.input.placeholder`

### Radius & Effects
- `--radius: 1.4rem` → `tokens.geometry.borderRadius: 22.4` (assumes 16px per rem, consistent with existing themes)
- `--shadow-opacity: 0.16` → `tokens.effects.shadowIntensity: 0.16`
- `--shadow-color: hsl(0 0% 0%)` → `tokens.effects.shadowColor: #000000`
- Blur is disabled → `tokens.effects.blurIntensity: 0`

## 3) What Was Mapped (Dark)

Source: `.dark { ... }`

Mapped identically by semantic role:
- `--background` → `tokens.background.*`
- `--card` / `--border` → `tokens.surface.card.*`
- `--popover` / `--border` → `tokens.surface.glass.*` (solid fallbacks)
- `--foreground`, `--muted-foreground`, `--chart-5`, `--primary-foreground` → `tokens.text.*`
- `--primary`, `--secondary` → `tokens.brand.*`
- `--destructive`, `--chart-1`, `--chart-3`, `--chart-4` → `tokens.semantic.*`
- `--input`, `--border`, `--ring`, `--muted-foreground` → `tokens.input.*`
- `--radius`, `--shadow-opacity`, `--shadow-color` → `tokens.geometry` / `tokens.effects`

## 4) CSS Variables Ignored (and why)

These variables exist in the provided CSS but are **not representable** in the current app’s `ThemeTokensNormalized` interface without changing the architecture (not allowed for this task):

### Sidebar tokens (no matching keys)
- `--sidebar`
- `--sidebar-foreground`
- `--sidebar-primary`
- `--sidebar-primary-foreground`
- `--sidebar-accent`
- `--sidebar-accent-foreground`
- `--sidebar-border`
- `--sidebar-ring`

### Additional semantic tokens not present in normalized interface
- `--primary-foreground` (only used for `text.inverse`)
- `--secondary-foreground`
- `--accent`
- `--accent-foreground`
- `--muted`
- `--muted-foreground` (only mapped where an equivalent exists)
- `--ring` (only mapped where an equivalent exists)

### Full shadow preset strings (RN cannot consume CSS shadow strings)
- `--shadow-x`, `--shadow-y`, `--shadow-blur`, `--shadow-spread`
- `--shadow-2xs`, `--shadow-xs`, `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-2xl`

Reason: React Native uses platform-specific shadow properties (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) and Android uses `elevation`. This app’s normalized tokens only expose `shadowColor` + `shadowIntensity`.

### Spacing
- `--spacing`

Reason: current theme tokens do not include spacing scale keys.

### Fonts & tracking
- `--font-sans`, `--font-serif`, `--font-mono`
- `--tracking-normal`

Reason: current theme tokens do not include typography / font-family / tracking fields.

## 5) React Native Limitations (Unavoidable)

- **Font families**: React Native cannot reliably use web font stacks like `Plus Jakarta Sans, sans-serif` unless the font is bundled and registered. Because the current theme token interface has no font fields, this theme does not set fonts. If you want true font + tracking support, the app will need an explicit typography token surface and component consumption updates.
- **Letter-spacing**: The provided `body { letter-spacing: var(--tracking-normal); }` is a web construct. Existing components may already set `letterSpacing` in specific places (e.g., buttons). This theme does not change any component behavior.
- **CSS shadows**: CSS shadow strings are not directly supported. Only `shadowColor` + `shadowIntensity` are expressed through the current token interface.

## 6) Theme Capabilities

Declared explicitly in `themes/violet-bloom/index.ts`:
- `supportsGlassSurfaces: false`
- `supportsBlur: false`
- `supportsAnimatedBackground: false`

Additionally, `tokens.effects.blurIntensity` is set to `0` in both variants.

## 7) Registration

Registered in the global theme registry:
- `theme/registry.ts`

## 8) Validation Checklist

- Switch to **Violet Bloom** in theme selector
- Verify **Light mode**:
  - Background is `#fdfdfd`, primary accent is `#7033ff`
  - Text uses `#000000` / muted steps
  - Card background/border match `--card` / `--border`
- Verify **Dark mode**:
  - Background is `#1a1b1e`, primary accent is `#8c5cff`
  - Cards/popovers are `#222327`
  - Borders/inputs are `#33353a`
- Confirm **no blur / no glass / no animated background** rendering
- Confirm charts use `--chart-*` colors (where chart components rely on existing semantic tokens)
- Confirm there are **no type errors** (`npm run typecheck`)
- Smoke test theme switching: existing themes unchanged
