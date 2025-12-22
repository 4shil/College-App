# College App Theme System (Reverse‑Engineered)

This document is reverse-engineered from the **actual implementation** in the app codebase. It is intended to act as an internal design system reference: tokens, visual language, motion, component specs, navigation theming, and known inconsistencies.

**Primary sources (read the code):**
- Theme state + tokens: `store/themeStore.ts`
- UI primitives: `components/ui/index.ts`, `components/ui/AnimatedBackground.tsx`, `components/ui/Card.tsx`, `components/ui/GlassInput.tsx`, `components/ui/PrimaryButton.tsx`, `components/ui/ThemeToggle.tsx`, `components/ui/BottomNav.tsx`, `components/ui/GlassIcon.tsx`
- Navigation layouts: `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(admin)/_layout.tsx`, `app/(student)/_layout.tsx`, `app/(teacher)/_layout.tsx`
- Example screens using theme: `app/(admin)/analytics/index.tsx`, `app/(admin)/dashboard.tsx`, `app/(admin)/settings/appearance.tsx`, `app/(auth)/login.tsx`, `app/(student)/dashboard.tsx`, `app/(teacher)/dashboard.tsx`

---

## 1) System Overview (What the “theme system” actually is)

The theme system is a **single persisted store** that exposes:
- `mode`: `'light' | 'dark' | 'system'`
- `isDark`: boolean
- `colors`: a token object (shape shared by light/dark)
- `uiStyle`: currently only `'glassmorphism'` (present for future extensibility)
- `animationsEnabled`: boolean

The app visual language is **glassmorphism-first**:
- Backgrounds are nearly always an `AnimatedBackground` (gradient + optional animated layers).
- Foreground “cards” and “surfaces” are translucent/blurred (`Card`/`GlassCard`, blur headers, nav bars).
- Motion is enabled by default and implemented with **react-native-reanimated**.

**Important:** the app does not use a central typography scale / spacing scale / elevation scale. Those are implied by repeated numeric constants.

---

## 2) Theme State + Persistence (Architecture)

**Implementation:** `store/themeStore.ts`

- Store is created with `createStore` + `persist` and uses `@react-native-async-storage/async-storage`.
- Storage key: `theme-storage`
- Defaults on first launch:
  - `mode: 'dark'`
  - `isDark: true`
  - `uiStyle: 'glassmorphism'`
  - `animationsEnabled: true`

**APIs exposed by store:**
- `setMode(mode)`
  - Updates `mode`, recalculates `isDark`, swaps `colors` between light/dark.
- `toggleTheme()`
  - Only toggles between dark/light (does not set `'system'`).
- `toggleAnimations()`
  - Flips `animationsEnabled`.
- `setSystemTheme(systemIsDark)`
  - Only applies if current `mode === 'system'`.

**Known gap:** there is **no OS appearance listener** wired up (no `Appearance.addChangeListener`, no `useColorScheme`, no call sites for `setSystemTheme`). That means `mode: 'system'` is selectable in UI, but won’t automatically react to device theme changes unless added.

---

## 3) Design Tokens (Canonical Token Set)

**Source of truth:** `store/themeStore.ts`

Tokens are stored as `lightColors` / `darkColors` objects.

### Token keys

Background + surfaces
- `background`
- `backgroundGradientStart`
- `backgroundGradientEnd`
- `glassBackground`
- `glassBackgroundStrong`
- `glassBorder`
- `cardBackground`
- `cardBorder`

Text
- `textPrimary`
- `textSecondary`
- `textMuted`
- `textInverse`

Brand + semantic
- `primary`, `primaryLight`, `primaryDark`
- `secondary`, `secondaryLight`
- `success`, `warning`, `error`, `info`

Inputs
- `inputBackground`
- `inputBorder`
- `inputFocusBorder`
- `placeholder`

Geometry + effects
- `shadowColor`
- `borderRadius`
- `borderWidth`
- `shadowIntensity`
- `blurIntensity`

### Light palette (exact values)

```ts
const lightColors = {
  background: '#FFFFFF',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#EFF6FF',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.95)',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#ffffff',
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#0891B2',
  inputBackground: 'rgba(0, 0, 0, 0.03)',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputFocusBorder: '#3B82F6',
  placeholder: '#9CA3AF',
  cardBackground: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  shadowColor: '#000000',
  borderRadius: 16,
  borderWidth: 1.5,
  shadowIntensity: 0.1,
  blurIntensity: 20,
};
```

### Dark palette (exact values)

```ts
const darkColors = {
  background: '#0F0F1A',
  backgroundGradientStart: '#0F0F1A',
  backgroundGradientEnd: '#1A1A2E',
  glassBackground: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.1)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B2',
  textMuted: '#6B6B80',
  textInverse: '#0F0F1A',
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  success: '#4ADE80',
  warning: '#FACC15',
  error: '#F87171',
  info: '#22D3EE',
  inputBackground: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(139, 92, 246, 0.25)',
  inputFocusBorder: '#8B5CF6',
  placeholder: '#6B6B80',
  cardBackground: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  shadowColor: '#8B5CF6',
  borderRadius: 16,
  borderWidth: 1.5,
  shadowIntensity: 0.3,
  blurIntensity: 20,
};
```

**Token behavior notes:**
- `borderWidth` is **1.5** in the default presets, so borders are token-driven and consistent across cards/inputs.
- `shadowIntensity` is used by `AnimatedBackground` only for the vignette toggle (non-zero => draw vignette). It is not consistently wired into all shadows.

---

## 4) Background System (AnimatedBackground)

**Implementation:** `components/ui/AnimatedBackground.tsx`

This is the default page backdrop. Its behavior is:

### 4.1 Base layer (always on)
- A full-screen `LinearGradient` using:
  - `colors.backgroundGradientStart`
  - `colors.backgroundGradientEnd`
  - `colors.background`
- The container view also sets `backgroundColor: colors.background`.

### 4.2 Animated layers (conditional)
Animated layers render only if:
- `variant !== 'minimal'`
- `animationsEnabled === true`
- `colors.blurIntensity > 0`

Additionally, on Android it uses a **reduced layer set** for performance.

Layer stack inside the animated container:
- `GradientMesh` (opacity-only animation)
- `AuroraWave` 1 (always)
- `AuroraWave` 2 (skipped on Android reduced mode)
- `AuroraWave` 3 (skipped on Android reduced mode)
- `BreathingGlow` top + bottom (skipped on Android reduced mode)
- `ShimmerOverlay` (skipped on Android completely)

### 4.3 Static glow overlays (always on)
- Top glow: gradient `[primary 0x1F, secondary 0x10, transparent]` with height ~35% screen.
- Bottom glow: gradient `[transparent, secondary 0x14, primary 0x1F]` with height ~30% screen.

### 4.4 Vignette (conditional)
- Renders only when `colors.shadowIntensity > 0`.
- Vertical gradient uses `colors.shadowColor` (with alpha) at top/bottom.

### 4.5 Motion constants (exact)
- Component fade-in: `withTiming(1, duration: 800, easing: out(cubic))`
- `AuroraWave`
  - opacity fades to 1 over 1500ms
  - translateX repeats linearly; typical durations passed from main: 12000 / 14000 / 16000ms
- `ShimmerOverlay`
  - sweep: 6000ms linear, then 2000ms delay, repeat
- `BreathingGlow`
  - opacity oscillates 0.3 → 0.7 → 0.3; each leg 4000ms linear
- `GradientMesh`
  - single opacity cycle 0→1→0 using 8000ms per leg (sequence)

**Note:** `uiStyle` is read from store but currently doesn’t change behavior (background colors always come from theme tokens).

---

## 5) Glassmorphism Rules (Blur, translucency, borders)

There are two different “glass” approaches:

### 5.1 Card/GlassCard surface glass
**Implementation:** `components/ui/Card.tsx` (+ alias export `GlassCard`)
- iOS:
  - Uses `BlurView` if `blurAmount > 0`.
  - `intensity` defaults to `colors.blurIntensity` (20).
  - `tint`: `dark` if `isDark`, else `light`.
  - `BlurView` also has a background color: `colors.glassBackground`.
- Android:
  - No blur; uses a translucent fill (`colors.glassBackground`).

Border + radius:
- `borderRadius` uses token `colors.borderRadius` (16).
- `borderWidth` uses token (0) → typically no border.
- Border color uses `colors.glassBorder`.

Layout defaults:
- Padding default: 18px unless `noPadding`.
- Enter animation (if animations enabled): translateY 16 → 0, opacity 0 → 1 using spring and interpolation.

### 5.2 Screen headers & nav glass
Many screens implement headers with `BlurView` directly (not via a shared component). Common settings:
- `tint="dark"` for glass headers even in light mode (example: appearance settings header uses `tint="dark"`).
- Intensities commonly 60–80.

This means some header glass may be visually biased “dark glass” even in light theme.

---

## 6) Typography System (What exists today)

There is **no centralized typography token scale**. Typography is expressed directly in style objects.

Common patterns observed:
- Headings: font size ~24–32, weight 700.
- Section titles: size ~18–20, weight 700.
- Body: size ~14–16.
- Secondary labels/captions: size ~12–13.

Letter spacing is used sparingly:
- Buttons (`PrimaryButton`): `letterSpacing: 0.4` (primary) and `0.3` (outline/ghost).
- Inputs (`GlassInput`): `letterSpacing: 0.2`.
- Several screens use **negative letterSpacing** for big titles (e.g. `-0.5`).

Font family:
- Default platform font almost everywhere.
- Some “log/code” areas use `fontFamily: 'monospace'`.
- One auth screen uses `fontFamily: 'inherit'` (this is likely web-oriented and may not behave on native).

---

## 7) Spacing + Layout System (Implied scale)

There is no exported spacing scale, but constants repeat frequently:
- 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 26

Common layout patterns:
- Horizontal page padding: often 16 or 20.
- Card padding: 16–20 (tokenized default for `Card` is 18).
- Rounded corners:
  - Core token: 16
  - Many local styles: 12 / 14 / 28 (nav)

Safe area:
- Many screens use `useSafeAreaInsets()` and add `paddingTop: insets.top + ...`.
- Student/Teacher bottom nav adds `paddingBottom: max(insets.bottom, 16)`.

---

## 8) Elevation + Shadow System

Shadows are not centralized; they are implemented per-component.

### 8.1 PrimaryButton shadow
**Implementation:** `components/ui/PrimaryButton.tsx`
- iOS:
  - `shadowOffset: {0, 6}`
  - `shadowRadius: 12`
  - `shadowOpacity: 0.35` (animated via `glowOpacity` when glowing)
- Android:
  - `elevation: 6`
- `shadowColor` is hard-coded depending on `isDark`:
  - dark: `#8B5CF6`
  - light: `#6D28D9`

### 8.2 BottomNav shadow
**Implementation:** `components/ui/BottomNav.tsx`
- Outer shadow is iOS-only:
  - `shadowOffset: {0, 8}`
  - `shadowOpacity: 0.25`
  - `shadowRadius: 16`
- Wrapper shadow:
  - iOS: `shadowOpacity: 0.15`, radius 8
  - Android: `elevation: 8`

### 8.3 AnimatedBackground vignette
Uses `colors.shadowColor` and `colors.shadowIntensity > 0` as a “vignette on/off” gate.

**System note:** token `shadowIntensity` is not used to scale all shadows; it’s effectively a feature flag in background.

---

## 9) Gradient Language (Brand look)

Gradients are a key part of identity and are frequently **hard-coded** rather than derived from tokens.

### 9.1 PrimaryButton gradients
**Implementation:** `components/ui/PrimaryButton.tsx`
- Primary variant:
  - dark: `['#8B5CF6', '#7C3AED', '#6D28D9']`
  - light: `['#7C3AED', '#6D28D9', '#5B21B6']`
- Secondary variant:
  - dark: `['#06B6D4', '#0891B2', '#0E7490']`
  - light: `['#0891B2', '#0E7490', '#155E75']`

The gradient colors match the “feel” of the token palette but are not actually referencing `colors.primary` etc.

### 9.2 BottomNav gradients
- Active glow gradient uses blue/purple translucent colors.
- Top highlight gradients simulate a glossy top edge.

### 9.3 AnimatedBackground
Uses token-derived colors with alpha appended (e.g. `${colors.primary}33`).

---

## 10) Iconography System

Icons are provided via:
- `@expo/vector-icons` (Ionicons, FontAwesome5, MaterialCommunityIcons)

### 10.1 GlassIcon
**Implementation:** `components/ui/GlassIcon.tsx`

A reusable glass icon container with:
- Optional outer glow (gradient)
- iOS blur container (`BlurView` intensity 40–50 based on `isDark`)
- Android fallback to translucent fill based on the passed icon `color`
- Always renders a top highlight gradient

Geometry:
- Container size = `size * 2`
- Border radius is hard-coded 16 in the styles (not the theme token).

---

## 11) Core Components: Cards

### 11.1 Card / GlassCard
**Implementation:** `components/ui/Card.tsx` and `components/ui/GlassCard.tsx`

They are functionally the same; `components/ui/index.ts` exports:
- `Card` from `Card.tsx`
- `GlassCard` as an alias from `Card.tsx` (backwards compatibility)

Key spec:
- Default padding: 18
- Default radius: `colors.borderRadius` (16)
- Default blur: `colors.blurIntensity` (20)
- Border uses `colors.glassBorder`, but border width is typically 0 (token)
- Enter animation uses spring + opacity interpolation when `animationsEnabled` true

**Usage note:** Some screens additionally set padding/radius in their own `style` prop.

---

## 12) Core Components: Inputs + Buttons

### 12.1 GlassInput
**Implementation:** `components/ui/GlassInput.tsx`

Spec:
- Height: 52
- Horizontal padding: 16
- Icon size: 20
- Border:
  - Focus animation interpolates border color from `inputBorder` → `inputFocusBorder`.
  - If `colors.borderWidth` is 0, it forces borderWidth = 1.
- Focus scale: 1 → 1.01 spring.
- Password mode:
  - Eye icon toggles `secureTextEntry`.
  - Eye button hitSlop: 10 on all sides.

### 12.2 PrimaryButton
**Implementation:** `components/ui/PrimaryButton.tsx`

Variants:
- `primary` (gradient, optional glow/shimmer)
- `secondary` (gradient)
- `outline` (transparent bg, colored border)
- `ghost` (filled with `colors.cardBackground`)

Sizes:
- small: height 42, font 13
- medium: height 50, font 14
- large: height 56, font 15

Motion:
- Press in: scale 1 → 0.965 (spring), brightness 1 → 0.92
- Press out: scale back to 1
- Glow + shimmer runs only when:
  - `animationsEnabled && glowing && variant === 'primary' && !disabled`
  - Glow opacity oscillates 0.2–0.5 (2500ms each)
  - Shimmer animates over 3000ms

**Inconsistency:** outline/ghost label color in dark mode is hard-coded to `#FB923C` (orange), which is not part of theme tokens.

---

## 13) Navigation Theming (Layouts + Bottom bars)

There are two nav paradigms:

### 13.1 Root stack
**Implementation:** `app/_layout.tsx`
- Uses `Stack` with `animation: 'fade'` and `headerShown: false`.
- Sets `contentStyle.backgroundColor: 'transparent'`.
- Status bar style depends on `isDark`.

**Notable hard-codes:** initial splash placeholder uses background `#0a0a18` and spinner color `#8B5CF6` (not sourced from theme tokens).

### 13.2 Student/Teacher bottom nav
**Implementation:** `app/(student)/_layout.tsx`, `app/(teacher)/_layout.tsx`, and `components/ui/BottomNav.tsx`

- Student/Teacher layouts infer active tab by substring checks on `pathname`.
- BottomNav styling is mostly hard-coded and depends on `isDark` rather than token palette.

BottomNav visuals:
- iOS: BlurView intensity 60, tint `dark|light`.
- Android: opaque fallback background:
  - dark: `rgba(20, 20, 35, 0.95)`
  - light: `rgba(255, 255, 255, 0.95)`

Active colors:
- active: dark `#60A5FA`, light `#3B82F6`
- inactive: dark `rgba(156,163,175,0.8)`, light `rgba(107,114,128,0.8)`

### 13.3 Admin “GlassDock”
**Implementation:** `app/(admin)/_layout.tsx`

Admin navigation is a custom dock that expands/collapses.
- Uses theme tokens for:
  - border radius (`colors.borderRadius` multiplied)
  - blur intensity (`colors.blurIntensity` when `animationsEnabled`)
  - border color (`colors.glassBorder`)
- But active/inactive icon colors are hard-coded:
  - active: `#fff`
  - inactive: `rgba(255,255,255,0.4)`

Behavior:
- Collapsed mode shows a single item (effectively) by translating the row so active icon is visible.
- Tap in collapsed mode expands.
- Tap in expanded mode navigates and collapses.

---

## 14) Motion System (Reanimated conventions)

The motion system is **component-local**, but consistent in feel:

### 14.1 Common easing + spring settings
- Springs are used for:
  - Press feedback (scale)
  - Enter transitions (translateY)
  - Nav icon scaling
- Timings with linear easing are used for ambient loops:
  - background waves
  - shimmer sweeps
  - glow breathing

### 14.2 Global “animationsEnabled” behavior
- Some components disable blur when animations are off by setting intensity to 0 (example: Admin GlassDock uses `intensity={animationsEnabled ? colors.blurIntensity : 0}`).
- `AnimatedBackground` disables animated layers when animations are off, but the base gradient remains.
- Cards disable enter animation if animations are off.

**Note:** “animationsEnabled” is used as a general effects toggle, not strictly motion.

---

## 15) Accessibility + Known Issues + Improvement Roadmap

### 15.1 Accessibility status
- No explicit `accessibilityLabel`, `accessibilityRole`, or font scaling strategy is standardized.
- Contrast is generally good in dark mode due to bright text, but:
  - Hard-coded translucent overlays and blur can reduce contrast.
  - Some hard-coded colors (e.g. orange button label in dark outline mode) may not meet contrast expectations on every background.

### 15.2 Technical gaps / inconsistencies (from code)
- `mode: 'system'` is selectable but not wired to OS changes (no `setSystemTheme` usage).
- Multiple components hard-code colors instead of using tokens:
  - `PrimaryButton` gradients and outline label
  - `BottomNav` palette
  - Root loading screen
  - Admin dock icon colors
- Token `borderWidth` is 0, but some screens assume borders exist and hard-code their own border widths.
- `uiStyle` exists but is not used to switch implementations.

### 15.3 Suggested improvements (minimal, non-UI-expanding)
If you want the theme system to become “complete” and consistent without changing UX:
1. Wire system theme:
   - Add an OS theme listener and call `setSystemTheme()` when `mode === 'system'`.
2. Centralize hard-coded palettes:
   - Move gradient ramps and nav colors into tokens (e.g. `primaryRamp`, `secondaryRamp`, `navActive`, `navInactive`).
3. Decide what `borderWidth` means:
   - Either set it to 1 in tokens, or remove token usage and let components own borders.
4. Standardize typography:
   - Create a small typography map (`title`, `h1`, `h2`, `body`, `caption`) and reuse.

---

## Appendix A: Example `theme.ts` (Type shape aligned to current implementation)

This is a reference shape that mirrors the current store and token objects.

```ts
export type ThemeMode = 'light' | 'dark' | 'system';
export type UIStyle = 'glassmorphism';

export interface ThemeColors {
  // Background + glass
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  glassBackground: string;
  glassBackgroundStrong: string;
  glassBorder: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand + semantic
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;

  // Inputs
  inputBackground: string;
  inputBorder: string;
  inputFocusBorder: string;
  placeholder: string;

  // Cards
  cardBackground: string;
  cardBorder: string;

  // Geometry + effects
  shadowColor: string;
  borderRadius: number;
  borderWidth: number;
  shadowIntensity: number;
  blurIntensity: number;
}

export interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  uiStyle: UIStyle;
  colors: ThemeColors;
  animationsEnabled: boolean;
}
```
