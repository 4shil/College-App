import { createStore, persist } from '../store/createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeRegistry } from './registry';
import { resolveTheme } from './resolver';
import type { ThemeColorsLegacy, ThemeMode, UIStyle } from './types';

export const uiStyleInfo = {
  glassmorphism: { name: 'Glassmorphism', description: 'Translucent blur effects', category: 'Modern' },
} as const;

export interface GlobalThemeState {
  // New (future-proof)
  activeThemeId: string;
  activeThemeName: string;
  capabilities: {
    supportsGlassSurfaces: boolean;
    supportsBlur: boolean;
    supportsAnimatedBackground: boolean;
  };
  supportsAnimatedBackground: boolean;
  canAnimateBackground: boolean;
  effectsEnabled: boolean;
  resolvedColors: ThemeColorsLegacy;
  resolvedTokens: unknown;

  // Existing API surface (must remain stable)
  mode: ThemeMode;
  isDark: boolean;
  uiStyle: UIStyle;
  colors: ThemeColorsLegacy;
  animationsEnabled: boolean;

  setMode: (mode: ThemeMode) => void;
  setUIStyle: (style: UIStyle) => void;
  setActiveThemeId: (id: string) => void;
  toggleTheme: () => void;
  toggleAnimations: () => void;
  setSystemTheme: (isDark: boolean) => void;
}

// Default resolved state (identical to previous defaults)
const DEFAULT_MODE: ThemeMode = 'dark';
const DEFAULT_IS_DARK = true;
const DEFAULT_UI_STYLE: UIStyle = 'glassmorphism';
const DEFAULT_THEME_ID = 'neutral-solid';

const initialResolved = resolveTheme({
  registry: themeRegistry,
  activeThemeId: DEFAULT_THEME_ID,
  mode: DEFAULT_MODE,
  systemIsDark: DEFAULT_IS_DARK,
});

// Rollback-safe switch:
// - true: animated backgrounds are allowed for every theme
// - false: animated backgrounds are gated by theme capabilities
const ALLOW_ANIMATED_BACKGROUND_FOR_ALL_THEMES = false;

// Rollback-safe switch:
// - true: blur effects are allowed for every theme
// - false: blur effects are gated by theme capabilities
const ALLOW_BLUR_FOR_ALL_THEMES = true;

const initialSupportsAnimatedBackground = ALLOW_ANIMATED_BACKGROUND_FOR_ALL_THEMES
  ? true
  : !!initialResolved.capabilities.supportsAnimatedBackground;
const INITIAL_ANIMATIONS_ENABLED = true;
const initialCanAnimateBackground = INITIAL_ANIMATIONS_ENABLED && initialSupportsAnimatedBackground && (!initialResolved.isDark || initialResolved.presetId === 'glassmorphism');

const initialCapabilities = {
  ...initialResolved.capabilities,
  supportsBlur: ALLOW_BLUR_FOR_ALL_THEMES ? true : initialResolved.capabilities.supportsBlur,
};

export const useGlobalThemeStore = createStore<GlobalThemeState>(
  persist(
    (set, get) => ({
      activeThemeId: DEFAULT_THEME_ID,
      activeThemeName: initialResolved.presetName,
      capabilities: initialCapabilities,
      supportsAnimatedBackground: initialSupportsAnimatedBackground,
      canAnimateBackground: initialCanAnimateBackground,
      effectsEnabled: true,
      resolvedColors: initialResolved.colorsLegacy,
      resolvedTokens: initialResolved.tokens,

      mode: DEFAULT_MODE,
      isDark: DEFAULT_IS_DARK,
      uiStyle: DEFAULT_UI_STYLE,
      colors: initialResolved.colorsLegacy,
      animationsEnabled: INITIAL_ANIMATIONS_ENABLED,

      setMode: (mode: ThemeMode) => {
        // Preserve existing behavior: when switching to system, we do NOT read OS appearance.
        const current = get();
        const nextResolved = resolveTheme({
          registry: themeRegistry,
          activeThemeId: current.activeThemeId,
          mode,
          systemIsDark: current.isDark,
        });

        const supportsAnimatedBackground = ALLOW_ANIMATED_BACKGROUND_FOR_ALL_THEMES
          ? true
          : !!nextResolved.capabilities.supportsAnimatedBackground;
        const canAnimateBackground = current.animationsEnabled && supportsAnimatedBackground && (!nextResolved.isDark || nextResolved.presetId === 'glassmorphism');

        const capabilities = {
          ...nextResolved.capabilities,
          supportsBlur: ALLOW_BLUR_FOR_ALL_THEMES ? true : nextResolved.capabilities.supportsBlur,
        };
        set({
          mode,
          isDark: nextResolved.isDark,
          activeThemeName: nextResolved.presetName,
          capabilities,
          supportsAnimatedBackground,
          canAnimateBackground,
          colors: nextResolved.colorsLegacy,
          resolvedColors: nextResolved.colorsLegacy,
          resolvedTokens: nextResolved.tokens,
        });
      },

      setUIStyle: (style: UIStyle) => {
        set({ uiStyle: style });
      },

      setActiveThemeId: (id: string) => {
        const current = get();
        const nextResolved = resolveTheme({
          registry: themeRegistry,
          activeThemeId: id,
          mode: current.mode,
          systemIsDark: current.isDark,
        });

        const supportsAnimatedBackground = ALLOW_ANIMATED_BACKGROUND_FOR_ALL_THEMES
          ? true
          : !!nextResolved.capabilities.supportsAnimatedBackground;
        const canAnimateBackground = current.animationsEnabled && supportsAnimatedBackground && (!nextResolved.isDark || nextResolved.presetId === 'glassmorphism');

        const capabilities = {
          ...nextResolved.capabilities,
          supportsBlur: ALLOW_BLUR_FOR_ALL_THEMES ? true : nextResolved.capabilities.supportsBlur,
        };
        set({
          activeThemeId: id,
          activeThemeName: nextResolved.presetName,
          capabilities,
          supportsAnimatedBackground,
          canAnimateBackground,
          isDark: nextResolved.isDark,
          colors: nextResolved.colorsLegacy,
          resolvedColors: nextResolved.colorsLegacy,
          resolvedTokens: nextResolved.tokens,
        });
      },

      toggleTheme: () => {
        // Preserve existing behavior: toggles only between dark/light.
        const current = get();
        const newMode: ThemeMode = current.mode === 'dark' ? 'light' : 'dark';
        const nextResolved = resolveTheme({
          registry: themeRegistry,
          activeThemeId: current.activeThemeId,
          mode: newMode,
          systemIsDark: current.isDark,
        });

        const supportsAnimatedBackground = ALLOW_ANIMATED_BACKGROUND_FOR_ALL_THEMES
          ? true
          : !!nextResolved.capabilities.supportsAnimatedBackground;
        const canAnimateBackground = current.animationsEnabled && supportsAnimatedBackground && (!nextResolved.isDark || nextResolved.presetId === 'glassmorphism');

        const capabilities = {
          ...nextResolved.capabilities,
          supportsBlur: ALLOW_BLUR_FOR_ALL_THEMES ? true : nextResolved.capabilities.supportsBlur,
        };
        set({
          mode: newMode,
          isDark: nextResolved.isDark,
          activeThemeName: nextResolved.presetName,
          capabilities,
          supportsAnimatedBackground,
          canAnimateBackground,
          colors: nextResolved.colorsLegacy,
          resolvedColors: nextResolved.colorsLegacy,
          resolvedTokens: nextResolved.tokens,
        });
      },

      toggleAnimations: () => {
        const next = !get().animationsEnabled;
        const supportsAnimatedBackground = !!get().supportsAnimatedBackground;
        const canAnimateBackground = next && supportsAnimatedBackground && (!get().isDark || get().activeThemeId === 'default' || get().activeThemeId === 'glassmorphism');
        // Keep effectsEnabled and animationsEnabled aligned (backward-compatible alias).
        set({ animationsEnabled: next, effectsEnabled: next, canAnimateBackground });
      },

      setSystemTheme: (systemIsDark: boolean) => {
        // Preserve existing behavior: only applies when mode === 'system'.
        const current = get();
        if (current.mode !== 'system') return;

        const nextResolved = resolveTheme({
          registry: themeRegistry,
          activeThemeId: current.activeThemeId,
          mode: 'system',
          systemIsDark,
        });

        const supportsAnimatedBackground = ALLOW_ANIMATED_BACKGROUND_FOR_ALL_THEMES
          ? true
          : !!nextResolved.capabilities.supportsAnimatedBackground;
        const canAnimateBackground = current.animationsEnabled && supportsAnimatedBackground && (!nextResolved.isDark || nextResolved.presetId === 'glassmorphism');

        const capabilities = {
          ...nextResolved.capabilities,
          supportsBlur: ALLOW_BLUR_FOR_ALL_THEMES ? true : nextResolved.capabilities.supportsBlur,
        };

        set({
          isDark: nextResolved.isDark,
          activeThemeName: nextResolved.presetName,
          capabilities,
          supportsAnimatedBackground,
          canAnimateBackground,
          colors: nextResolved.colorsLegacy,
          resolvedColors: nextResolved.colorsLegacy,
          resolvedTokens: nextResolved.tokens,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: AsyncStorage,
      merge: (persisted, current) => {
        const persistedObj = (persisted && typeof persisted === 'object') ? persisted : {};

        const activeThemeId = typeof persistedObj.activeThemeId === 'string' ? persistedObj.activeThemeId : current.activeThemeId;
        const mode: ThemeMode = (persistedObj.mode === 'light' || persistedObj.mode === 'dark' || persistedObj.mode === 'system')
          ? persistedObj.mode
          : current.mode;

        // Preserve previous preference when present; otherwise default to true.
        const animationsEnabled = typeof persistedObj.animationsEnabled === 'boolean'
          ? persistedObj.animationsEnabled
          : true;
        const effectsEnabled = typeof persistedObj.effectsEnabled === 'boolean'
          ? persistedObj.effectsEnabled
          : animationsEnabled;

        const uiStyle: UIStyle = persistedObj.uiStyle === 'glassmorphism' ? persistedObj.uiStyle : current.uiStyle;

        // Preserve existing semantics: for mode==='system', treat persisted isDark as the last-known system value.
        const systemIsDark = typeof persistedObj.isDark === 'boolean' ? persistedObj.isDark : current.isDark;

        const nextResolved = resolveTheme({
          registry: themeRegistry,
          activeThemeId,
          mode,
          systemIsDark,
        });

        const capabilities = {
          ...nextResolved.capabilities,
          supportsBlur: ALLOW_BLUR_FOR_ALL_THEMES ? true : nextResolved.capabilities.supportsBlur,
        };

        const supportsAnimatedBackground = ALLOW_ANIMATED_BACKGROUND_FOR_ALL_THEMES
          ? true
          : !!nextResolved.capabilities.supportsAnimatedBackground;
        const canAnimateBackground = animationsEnabled && supportsAnimatedBackground && (!nextResolved.isDark || nextResolved.presetId === 'glassmorphism');

        return {
          ...persistedObj,
          activeThemeId,
          mode,
          uiStyle,
          animationsEnabled,
          effectsEnabled,
          activeThemeName: nextResolved.presetName,
          capabilities,
          supportsAnimatedBackground,
          canAnimateBackground,
          isDark: nextResolved.isDark,
          colors: nextResolved.colorsLegacy,
          resolvedColors: nextResolved.colorsLegacy,
          resolvedTokens: nextResolved.tokens,
        } as Partial<GlobalThemeState>;
      },
    }
  )
);
