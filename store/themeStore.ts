import { createStore, persist } from './createStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type UIStyle = 
  | 'glassmorphism'
  | 'neumorphism'
  | 'claymorphism'
  | 'skeuomorphism'
  | 'papercraft'
  | 'y2k'
  | 'pixel'
  | 'terminal'
  | 'synthwave'
  | 'cyberpunk'
  | 'material'
  | 'fluent'
  | 'saas'
  | 'minimalist'
  | 'neobrutalism'
  | 'bauhaus'
  | 'swiss'
  | 'popart'
  | 'memphis'
  | 'industrial'
  | 'sketch'
  | 'blueprint'
  | 'magazine'
  | 'artdeco'
  | 'aurora';

// Light theme colors - Clean white with blue accents
const lightColors = {
  // Backgrounds - pure white
  background: '#FFFFFF',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#EFF6FF',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.95)',
  
  // Text - darker for better contrast
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#ffffff',
  
  // Primary accent - blue
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  
  // Secondary - sky blue
  secondary: '#0EA5E9',
  secondaryLight: '#38BDF8',
  
  // Status colors
  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#0891B2',
  
  // Input
  inputBackground: 'rgba(0, 0, 0, 0.03)',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputFocusBorder: '#3B82F6',
  placeholder: '#9CA3AF',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  
  // Shadows
  shadowColor: '#000000',
  
  // Style-specific properties
  borderRadius: 16,
  borderWidth: 0,
  shadowIntensity: 0.1,
  blurIntensity: 20,
};

// Dark theme colors - Purple/Blue with glowing effects
const darkColors = {
  // Backgrounds
  background: '#0F0F1A',
  backgroundGradientStart: '#0F0F1A',
  backgroundGradientEnd: '#1A1A2E',
  
  // Glass effects
  glassBackground: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBackgroundStrong: 'rgba(255, 255, 255, 0.1)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B2',
  textMuted: '#6B6B80',
  textInverse: '#0F0F1A',
  
  // Primary accent - Purple Glow
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  // Secondary - Cyan
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  
  // Status colors
  success: '#4ADE80',
  warning: '#FACC15',
  error: '#F87171',
  info: '#22D3EE',
  
  // Input
  inputBackground: 'rgba(255, 255, 255, 0.04)',
  inputBorder: 'rgba(139, 92, 246, 0.25)',
  inputFocusBorder: '#8B5CF6',
  placeholder: '#6B6B80',
  
  // Card
  cardBackground: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',
  
  // Shadows
  shadowColor: '#8B5CF6',
  
  // Style-specific properties
  borderRadius: 16,
  borderWidth: 0,
  shadowIntensity: 0.3,
  blurIntensity: 20,
};

// UI Style Presets - Light and Dark mode versions
const lightStylePresets: Record<UIStyle, Partial<typeof lightColors>> = {
  // 1. Glassmorphism (Default - no overrides needed)
  glassmorphism: {},

  // 2. Neumorphism - Soft shadows, monochrome (LIGHT)
  neumorphism: {
    background: '#E6E6EB',
    backgroundGradientStart: '#E6E6EB',
    backgroundGradientEnd: '#E6E6EB',
    glassBackground: 'rgba(230, 230, 235, 1)',
    glassBorder: 'transparent',
    cardBackground: 'rgba(230, 230, 235, 1)',
    cardBorder: 'transparent',
    borderRadius: 20,
    shadowIntensity: 0.15,
    blurIntensity: 0,
    textPrimary: '#5A5A6B',
    textSecondary: '#8A8A9B',
  },

  // 3. Claymorphism - Puffy, colorful 3D (LIGHT)
  claymorphism: {
    background: '#FFF5F7',
    backgroundGradientStart: '#FFF5F7',
    backgroundGradientEnd: '#FFF0E6',
    borderRadius: 24,
    shadowIntensity: 0.25,
    borderWidth: 0,
    primary: '#FF6B9D',
    secondary: '#FEC368',
    glassBackground: 'rgba(255, 245, 247, 0.95)',
    cardBackground: 'rgba(255, 240, 230, 0.95)',
    blurIntensity: 10,
    textPrimary: '#8B4565',
    textSecondary: '#A0665D',
  },

  // 4. Skeuomorphism - Realistic textures (LIGHT)
  skeuomorphism: {
    background: '#F5E6D3',
    backgroundGradientStart: '#F5E6D3',
    backgroundGradientEnd: '#EDD5B8',
    borderRadius: 8,
    shadowIntensity: 0.4,
    glassBackground: 'rgba(139, 69, 19, 0.15)',
    glassBorder: 'rgba(139, 69, 19, 0.3)',
    cardBackground: 'rgba(205, 133, 63, 0.15)',
    primary: '#8B4513',
    secondary: '#CD853F',
    textPrimary: '#3D1F0A',
    textSecondary: '#6B3610',
    borderWidth: 1,
    blurIntensity: 0,
  },

  // 5. Papercraft - Stacked paper (LIGHT)
  papercraft: {
    background: '#FAFAFA',
    backgroundGradientStart: '#FAFAFA',
    backgroundGradientEnd: '#F0F0F0',
    borderRadius: 2,
    shadowIntensity: 0.2,
    glassBackground: 'rgba(255, 255, 255, 1)',
    cardBackground: 'rgba(255, 255, 255, 1)',
    glassBorder: 'rgba(0, 0, 0, 0.05)',
    textPrimary: '#212121',
    textSecondary: '#616161',
    borderWidth: 1,
    blurIntensity: 0,
  },

  // 6. Y2K / 90s OS (LIGHT)
  y2k: {
    background: '#C0C0C0',
    backgroundGradientStart: '#C0C0C0',
    backgroundGradientEnd: '#C0C0C0',
    glassBackground: 'rgba(192, 192, 192, 1)',
    cardBackground: 'rgba(192, 192, 192, 1)',
    glassBorder: 'rgba(255, 255, 255, 1)',
    borderRadius: 0,
    borderWidth: 2,
    primary: '#000080',
    secondary: '#008080',
    textPrimary: '#000000',
    textSecondary: '#000000',
    shadowIntensity: 0.1,
    blurIntensity: 0,
  },

  // 7. Pixel Art - 8-bit blocky (LIGHT)
  pixel: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 3,
    glassBorder: 'rgba(0, 0, 0, 1)',
    glassBackground: 'rgba(74, 222, 128, 1)',
    cardBackground: 'rgba(251, 191, 36, 1)',
    primary: '#EF4444',
    secondary: '#3B82F6',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 8. Terminal - CLI aesthetic (LIGHT - Inverted terminal)
  terminal: {
    background: '#F0F0E8',
    backgroundGradientStart: '#F0F0E8',
    backgroundGradientEnd: '#E8E8D8',
    glassBackground: 'rgba(0, 100, 0, 0.05)',
    glassBorder: 'rgba(0, 100, 0, 0.3)',
    cardBackground: 'rgba(248, 248, 240, 0.9)',
    textPrimary: '#006600',
    textSecondary: '#008800',
    textMuted: '#00AA00',
    primary: '#008800',
    secondary: '#CC8800',
    borderRadius: 0,
    borderWidth: 1,
    blurIntensity: 0,
    shadowIntensity: 0,
  },

  // 9. Synthwave - 80s neon sunset (LIGHT - Pastel version)
  synthwave: {
    background: '#FFF0FF',
    backgroundGradientStart: '#FFF0FF',
    backgroundGradientEnd: '#FFE6FF',
    glassBackground: 'rgba(255, 192, 255, 0.3)',
    glassBorder: 'rgba(192, 255, 255, 0.5)',
    cardBackground: 'rgba(255, 224, 255, 0.5)',
    primary: '#C850C8',
    secondary: '#50C8C8',
    textPrimary: '#8B008B',
    textSecondary: '#A020A0',
    borderRadius: 8,
    shadowIntensity: 0.3,
    shadowColor: '#C850C8',
    blurIntensity: 20,
  },

  // 10. Cyberpunk - Neon on black (LIGHT - Bright neon)
  cyberpunk: {
    background: '#F0FFFF',
    backgroundGradientStart: '#F0FFFF',
    backgroundGradientEnd: '#F0F0FF',
    glassBackground: 'rgba(0, 200, 200, 0.15)',
    glassBorder: 'rgba(0, 200, 200, 0.4)',
    cardBorder: 'rgba(200, 200, 0, 0.4)',
    cardBackground: 'rgba(0, 255, 255, 0.08)',
    primary: '#00B8B8',
    secondary: '#B8B800',
    textPrimary: '#006666',
    textSecondary: '#008888',
    borderRadius: 0,
    borderWidth: 2,
    shadowIntensity: 0.2,
    shadowColor: '#00B8B8',
    blurIntensity: 0,
  },

  // 11. Material Design (LIGHT)
  material: {
    background: '#FAFAFA',
    backgroundGradientStart: '#FAFAFA',
    backgroundGradientEnd: '#F5F5F5',
    borderRadius: 4,
    shadowIntensity: 0.2,
    glassBackground: 'rgba(255, 255, 255, 1)',
    cardBackground: 'rgba(255, 255, 255, 1)',
    glassBorder: 'transparent',
    primary: '#6200EE',
    secondary: '#03DAC6',
    textPrimary: '#000000',
    textSecondary: '#5F6368',
    blurIntensity: 0,
    borderWidth: 0,
  },

  // 12. Fluent Design (LIGHT)
  fluent: {
    background: '#F3F3F3',
    backgroundGradientStart: '#F3F3F3',
    backgroundGradientEnd: '#E8E8E8',
    borderRadius: 8,
    shadowIntensity: 0.1,
    blurIntensity: 40,
    glassBackground: 'rgba(249, 249, 249, 0.7)',
    glassBorder: 'rgba(0, 0, 0, 0.05)',
    primary: '#0078D4',
    secondary: '#00A4EF',
    textPrimary: '#1F1F1F',
    textSecondary: '#605E5C',
    borderWidth: 0,
  },

  // 13. SaaS / Corporate (LIGHT)
  saas: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#F9FAFB',
    borderRadius: 12,
    shadowIntensity: 0.08,
    glassBackground: 'rgba(255, 255, 255, 1)',
    cardBackground: 'rgba(255, 255, 255, 1)',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    primary: '#635BFF',
    secondary: '#00D4FF',
    textPrimary: '#0A2540',
    textSecondary: '#425466',
    blurIntensity: 0,
    borderWidth: 0,
  },

  // 14. Minimalist - B&W (LIGHT)
  minimalist: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    glassBackground: 'rgba(255, 255, 255, 1)',
    cardBackground: 'rgba(255, 255, 255, 1)',
    glassBorder: 'rgba(0, 0, 0, 1)',
    primary: '#000000',
    secondary: '#666666',
    textPrimary: '#000000',
    textSecondary: '#666666',
    borderRadius: 0,
    borderWidth: 1,
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 15. Neo-Brutalism - Raw, hard (LIGHT)
  neobrutalism: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 4,
    glassBorder: 'rgba(0, 0, 0, 1)',
    glassBackground: 'rgba(255, 255, 0, 1)',
    cardBackground: 'rgba(255, 0, 255, 1)',
    primary: '#FF0000',
    secondary: '#0000FF',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 16. Bauhaus - Geometric primary (LIGHT)
  bauhaus: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 3,
    glassBackground: 'rgba(255, 255, 255, 1)',
    cardBackground: 'rgba(255, 220, 0, 1)',
    glassBorder: 'rgba(0, 0, 0, 1)',
    primary: '#E30613',
    secondary: '#0057B8',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 17. Swiss Style - Typography focused (LIGHT)
  swiss: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 0,
    glassBackground: 'rgba(255, 255, 255, 1)',
    cardBackground: 'rgba(255, 255, 255, 1)',
    glassBorder: 'transparent',
    primary: '#000000',
    secondary: '#FF0000',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 18. Pop Art - Comic book (LIGHT)
  popart: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 5,
    glassBorder: 'rgba(0, 0, 0, 1)',
    glassBackground: 'rgba(255, 237, 0, 1)',
    cardBackground: 'rgba(255, 0, 110, 1)',
    primary: '#FF6EC7',
    secondary: '#00D9FF',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 19. Memphis - 80s chaos (LIGHT)
  memphis: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    glassBorder: 'rgba(0, 0, 0, 1)',
    glassBackground: 'rgba(255, 195, 0, 1)',
    cardBackground: 'rgba(0, 230, 255, 1)',
    primary: '#FF0080',
    secondary: '#00FF85',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 20. Industrial - Metallic utility (LIGHT)
  industrial: {
    background: '#E0E0E0',
    backgroundGradientStart: '#E0E0E0',
    backgroundGradientEnd: '#BDBDBD',
    borderRadius: 0,
    borderWidth: 2,
    glassBorder: 'rgba(255, 193, 7, 1)',
    glassBackground: 'rgba(224, 224, 224, 1)',
    cardBackground: 'rgba(189, 189, 189, 1)',
    primary: '#F57C00',
    secondary: '#757575',
    textPrimary: '#212121',
    textSecondary: '#424242',
    shadowIntensity: 0.3,
    blurIntensity: 0,
  },

  // 21. Sketch - Hand-drawn (LIGHT)
  sketch: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    glassBorder: 'rgba(0, 0, 0, 0.6)',
    glassBackground: 'rgba(255, 255, 255, 0.95)',
    cardBackground: 'rgba(255, 255, 255, 0.95)',
    primary: '#4A5568',
    secondary: '#718096',
    textPrimary: '#1A202C',
    textSecondary: '#4A5568',
    shadowIntensity: 0.1,
    blurIntensity: 0,
  },

  // 22. Blueprint - Technical schematic (LIGHT - Inverted to white on blue)
  blueprint: {
    background: '#E3F2FD',
    backgroundGradientStart: '#E3F2FD',
    backgroundGradientEnd: '#BBDEFB',
    borderRadius: 0,
    borderWidth: 1,
    glassBorder: 'rgba(13, 71, 161, 0.4)',
    glassBackground: 'rgba(227, 242, 253, 0.9)',
    cardBackground: 'rgba(227, 242, 253, 0.9)',
    primary: '#0D47A1',
    secondary: '#1976D2',
    textPrimary: '#0D47A1',
    textSecondary: '#1565C0',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 23. Magazine - Editorial (LIGHT)
  magazine: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#F5F5F5',
    borderRadius: 0,
    borderWidth: 0,
    glassBackground: 'rgba(255, 255, 255, 1)',
    cardBackground: 'rgba(255, 255, 255, 1)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    primary: '#1A1A1A',
    secondary: '#8B0000',
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    shadowIntensity: 0.05,
    blurIntensity: 0,
  },

  // 24. Art Deco - Gold luxury (LIGHT - Cream/Gold)
  artdeco: {
    background: '#FFF8DC',
    backgroundGradientStart: '#FFF8DC',
    backgroundGradientEnd: '#F5E6C8',
    borderRadius: 0,
    borderWidth: 2,
    glassBorder: 'rgba(139, 115, 35, 1)',
    glassBackground: 'rgba(255, 248, 220, 0.95)',
    cardBackground: 'rgba(245, 230, 200, 0.95)',
    primary: '#B8860B',
    secondary: '#DAA520',
    textPrimary: '#6B5A0F',
    textSecondary: '#8B7313',
    shadowIntensity: 0.2,
    shadowColor: '#B8860B',
    blurIntensity: 0,
  },

  // 25. Aurora - Mesh gradients (LIGHT)
  aurora: {
    background: '#FFFFFF',
    backgroundGradientStart: '#FFFFFF',
    backgroundGradientEnd: '#F8F9FA',
    borderRadius: 24,
    borderWidth: 0,
    blurIntensity: 60,
    glassBackground: 'rgba(255, 255, 255, 0.6)',
    glassBorder: 'rgba(167, 139, 250, 0.3)',
    cardBackground: 'rgba(255, 255, 255, 0.6)',
    primary: '#8B5CF6',
    secondary: '#F59E0B',
    textPrimary: '#4C1D95',
    textSecondary: '#6D28D9',
    shadowIntensity: 0.15,
  },
};

// Dark mode style presets
const darkStylePresets: Record<UIStyle, Partial<typeof lightColors>> = {
  // 1. Glassmorphism (Default - no overrides needed)
  glassmorphism: {},

  // 2. Neumorphism - Soft shadows, monochrome (DARK)
  neumorphism: {
    background: '#2A2A35',
    backgroundGradientStart: '#2A2A35',
    backgroundGradientEnd: '#2A2A35',
    glassBackground: 'rgba(42, 42, 53, 1)',
    glassBorder: 'transparent',
    cardBackground: 'rgba(42, 42, 53, 1)',
    cardBorder: 'transparent',
    borderRadius: 20,
    shadowIntensity: 0.4,
    blurIntensity: 0,
    textPrimary: '#E0E0EB',
    textSecondary: '#A0A0B2',
  },

  // 3. Claymorphism - Puffy, colorful 3D (DARK)
  claymorphism: {
    background: '#1A0A0F',
    backgroundGradientStart: '#1A0A0F',
    backgroundGradientEnd: '#1F0E14',
    borderRadius: 24,
    shadowIntensity: 0.35,
    borderWidth: 0,
    primary: '#FF6B9D',
    secondary: '#FEC368',
    glassBackground: 'rgba(255, 107, 157, 0.2)',
    cardBackground: 'rgba(254, 195, 104, 0.2)',
    blurIntensity: 15,
    textPrimary: '#FFB3D1',
    textSecondary: '#FFD9A3',
  },

  // 4. Skeuomorphism - Realistic textures (DARK)
  skeuomorphism: {
    background: '#1A0F0A',
    backgroundGradientStart: '#1A0F0A',
    backgroundGradientEnd: '#24150F',
    borderRadius: 8,
    shadowIntensity: 0.5,
    glassBackground: 'rgba(139, 69, 19, 0.25)',
    glassBorder: 'rgba(205, 133, 63, 0.4)',
    cardBackground: 'rgba(139, 69, 19, 0.15)',
    primary: '#CD853F',
    secondary: '#DEB887',
    textPrimary: '#F5DEB3',
    textSecondary: '#D2B48C',
    borderWidth: 1,
    blurIntensity: 0,
  },

  // 5. Papercraft - Stacked paper (DARK)
  papercraft: {
    background: '#121212',
    backgroundGradientStart: '#121212',
    backgroundGradientEnd: '#1E1E1E',
    borderRadius: 2,
    shadowIntensity: 0.3,
    glassBackground: 'rgba(30, 30, 30, 1)',
    cardBackground: 'rgba(30, 30, 30, 1)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#E0E0E0',
    textSecondary: '#B0B0B0',
    borderWidth: 1,
    blurIntensity: 0,
  },

  // 6. Y2K / 90s OS (DARK)
  y2k: {
    background: '#000080',
    backgroundGradientStart: '#000080',
    backgroundGradientEnd: '#000080',
    glassBackground: 'rgba(0, 0, 128, 1)',
    cardBackground: 'rgba(0, 0, 128, 1)',
    glassBorder: 'rgba(192, 192, 192, 1)',
    borderRadius: 0,
    borderWidth: 2,
    primary: '#00FFFF',
    secondary: '#FFFF00',
    textPrimary: '#FFFFFF',
    textSecondary: '#C0C0C0',
    shadowIntensity: 0.2,
    blurIntensity: 0,
  },

  // 7. Pixel Art - 8-bit blocky (DARK)
  pixel: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    borderRadius: 0,
    borderWidth: 3,
    glassBorder: 'rgba(255, 255, 255, 1)',
    glassBackground: 'rgba(34, 139, 34, 1)',
    cardBackground: 'rgba(184, 134, 11, 1)',
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    textPrimary: '#FFFFFF',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 8. Terminal - CLI aesthetic (DARK - Classic green terminal)
  terminal: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#001100',
    glassBackground: 'rgba(0, 255, 0, 0.1)',
    glassBorder: 'rgba(0, 255, 0, 0.3)',
    cardBackground: 'rgba(0, 0, 0, 0.9)',
    textPrimary: '#00FF00',
    textSecondary: '#00CC00',
    textMuted: '#008800',
    primary: '#00FF00',
    secondary: '#FFAA00',
    borderRadius: 0,
    borderWidth: 1,
    blurIntensity: 0,
    shadowIntensity: 0,
  },

  // 9. Synthwave - 80s neon sunset (DARK)
  synthwave: {
    background: '#1A0033',
    backgroundGradientStart: '#1A0033',
    backgroundGradientEnd: '#330066',
    glassBackground: 'rgba(255, 0, 255, 0.15)',
    glassBorder: 'rgba(0, 255, 255, 0.5)',
    cardBackground: 'rgba(51, 0, 102, 0.5)',
    primary: '#FF00FF',
    secondary: '#00FFFF',
    textPrimary: '#FF00FF',
    textSecondary: '#FF66FF',
    borderRadius: 0,
    shadowIntensity: 0.5,
    shadowColor: '#FF00FF',
    blurIntensity: 20,
  },

  // 10. Cyberpunk - Neon on black (DARK)
  cyberpunk: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#0A0A0A',
    glassBackground: 'rgba(0, 255, 255, 0.1)',
    glassBorder: 'rgba(0, 255, 255, 0.6)',
    cardBorder: 'rgba(255, 255, 0, 0.6)',
    cardBackground: 'rgba(0, 255, 255, 0.05)',
    primary: '#00FFFF',
    secondary: '#FFFF00',
    textPrimary: '#00FFFF',
    textSecondary: '#00CCCC',
    borderRadius: 0,
    borderWidth: 2,
    shadowIntensity: 0.4,
    shadowColor: '#00FFFF',
    blurIntensity: 0,
  },

  // 11. Material Design (DARK)
  material: {
    background: '#121212',
    backgroundGradientStart: '#121212',
    backgroundGradientEnd: '#1E1E1E',
    borderRadius: 4,
    shadowIntensity: 0.3,
    glassBackground: 'rgba(30, 30, 30, 1)',
    cardBackground: 'rgba(30, 30, 30, 1)',
    glassBorder: 'transparent',
    primary: '#BB86FC',
    secondary: '#03DAC6',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    blurIntensity: 0,
    borderWidth: 0,
  },

  // 12. Fluent Design (DARK)
  fluent: {
    background: '#1F1F1F',
    backgroundGradientStart: '#1F1F1F',
    backgroundGradientEnd: '#2D2D2D',
    borderRadius: 8,
    shadowIntensity: 0.2,
    blurIntensity: 40,
    glassBackground: 'rgba(45, 45, 45, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    primary: '#60CDFF',
    secondary: '#00A4EF',
    textPrimary: '#FFFFFF',
    textSecondary: '#C8C8C8',
    borderWidth: 0,
  },

  // 13. SaaS / Corporate (DARK)
  saas: {
    background: '#0A0A0F',
    backgroundGradientStart: '#0A0A0F',
    backgroundGradientEnd: '#12121A',
    borderRadius: 12,
    shadowIntensity: 0.15,
    glassBackground: 'rgba(18, 18, 26, 0.9)',
    cardBackground: 'rgba(18, 18, 26, 0.9)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    primary: '#7A73FF',
    secondary: '#00D4FF',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0B0',
    blurIntensity: 0,
    borderWidth: 0,
  },

  // 14. Minimalist - B&W (DARK)
  minimalist: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    glassBackground: 'rgba(0, 0, 0, 1)',
    cardBackground: 'rgba(0, 0, 0, 1)',
    glassBorder: 'rgba(255, 255, 255, 1)',
    primary: '#FFFFFF',
    secondary: '#999999',
    textPrimary: '#FFFFFF',
    textSecondary: '#999999',
    borderRadius: 0,
    borderWidth: 1,
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 15. Neo-Brutalism - Raw, hard (DARK)
  neobrutalism: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    borderRadius: 0,
    borderWidth: 4,
    glassBorder: 'rgba(255, 255, 255, 1)',
    glassBackground: 'rgba(0, 255, 255, 1)',
    cardBackground: 'rgba(255, 0, 255, 1)',
    primary: '#FF00FF',
    secondary: '#00FFFF',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 16. Bauhaus - Geometric primary (DARK)
  bauhaus: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    borderRadius: 0,
    borderWidth: 3,
    glassBackground: 'rgba(0, 0, 0, 1)',
    cardBackground: 'rgba(204, 176, 0, 1)',
    glassBorder: 'rgba(255, 255, 255, 1)',
    primary: '#FF3347',
    secondary: '#4169E1',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 17. Swiss Style - Typography focused (DARK)
  swiss: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    borderRadius: 0,
    borderWidth: 0,
    glassBackground: 'rgba(0, 0, 0, 1)',
    cardBackground: 'rgba(0, 0, 0, 1)',
    glassBorder: 'transparent',
    primary: '#FFFFFF',
    secondary: '#FF0000',
    textPrimary: '#FFFFFF',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 18. Pop Art - Comic book (DARK)
  popart: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    borderRadius: 0,
    borderWidth: 5,
    glassBorder: 'rgba(255, 255, 255, 1)',
    glassBackground: 'rgba(204, 189, 0, 1)',
    cardBackground: 'rgba(204, 0, 88, 1)',
    primary: '#FF69B4',
    secondary: '#00CED1',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 19. Memphis - 80s chaos (DARK)
  memphis: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#000000',
    borderRadius: 20,
    borderWidth: 3,
    glassBorder: 'rgba(255, 255, 255, 1)',
    glassBackground: 'rgba(204, 156, 0, 1)',
    cardBackground: 'rgba(0, 184, 204, 1)',
    primary: '#FF1493',
    secondary: '#00FF7F',
    textPrimary: '#000000',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 20. Industrial - Metallic utility (DARK)
  industrial: {
    background: '#424242',
    backgroundGradientStart: '#424242',
    backgroundGradientEnd: '#616161',
    borderRadius: 0,
    borderWidth: 2,
    glassBorder: 'rgba(255, 193, 7, 1)',
    glassBackground: 'rgba(66, 66, 66, 1)',
    cardBackground: 'rgba(97, 97, 97, 1)',
    primary: '#FFEB3B',
    secondary: '#9E9E9E',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E0E0',
    shadowIntensity: 0.3,
    blurIntensity: 0,
  },

  // 21. Sketch - Hand-drawn (DARK)
  sketch: {
    background: '#1A1A1A',
    backgroundGradientStart: '#1A1A1A',
    backgroundGradientEnd: '#2A2A2A',
    borderRadius: 8,
    borderWidth: 2,
    glassBorder: 'rgba(255, 255, 255, 0.4)',
    glassBackground: 'rgba(30, 30, 30, 0.95)',
    cardBackground: 'rgba(30, 30, 30, 0.95)',
    primary: '#A0AEC0',
    secondary: '#CBD5E0',
    textPrimary: '#E2E8F0',
    textSecondary: '#A0AEC0',
    shadowIntensity: 0.2,
    blurIntensity: 0,
  },

  // 22. Blueprint - Technical schematic (DARK)
  blueprint: {
    background: '#0C4A6E',
    backgroundGradientStart: '#0C4A6E',
    backgroundGradientEnd: '#075985',
    borderRadius: 0,
    borderWidth: 1,
    glassBorder: 'rgba(255, 255, 255, 0.4)',
    glassBackground: 'rgba(12, 74, 110, 0.8)',
    cardBackground: 'rgba(12, 74, 110, 0.8)',
    primary: '#FFFFFF',
    secondary: '#38BDF8',
    textPrimary: '#FFFFFF',
    textSecondary: '#BAE6FD',
    shadowIntensity: 0,
    blurIntensity: 0,
  },

  // 23. Magazine - Editorial (DARK)
  magazine: {
    background: '#1A1A1A',
    backgroundGradientStart: '#1A1A1A',
    backgroundGradientEnd: '#0F0F0F',
    borderRadius: 0,
    borderWidth: 0,
    glassBackground: 'rgba(26, 26, 26, 1)',
    cardBackground: 'rgba(26, 26, 26, 1)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    primary: '#FFFFFF',
    secondary: '#DC143C',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0',
    shadowIntensity: 0.1,
    blurIntensity: 0,
  },

  // 24. Art Deco - Gold luxury (DARK)
  artdeco: {
    background: '#000000',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#1A1A00',
    borderRadius: 0,
    borderWidth: 2,
    glassBorder: 'rgba(212, 175, 55, 1)',
    glassBackground: 'rgba(0, 0, 0, 0.9)',
    cardBackground: 'rgba(26, 26, 0, 0.9)',
    primary: '#D4AF37',
    secondary: '#C9A960',
    textPrimary: '#D4AF37',
    textSecondary: '#C9A960',
    shadowIntensity: 0.3,
    shadowColor: '#D4AF37',
    blurIntensity: 0,
  },

  // 25. Aurora - Mesh gradients (DARK)
  aurora: {
    background: '#0F0F1A',
    backgroundGradientStart: '#0F0F1A',
    backgroundGradientEnd: '#1A1A2E',
    borderRadius: 24,
    borderWidth: 0,
    blurIntensity: 60,
    glassBackground: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    cardBackground: 'rgba(255, 255, 255, 0.1)',
    primary: '#A78BFA',
    secondary: '#FB923C',
    textPrimary: '#E9D5FF',
    textSecondary: '#C4B5FD',
    shadowIntensity: 0.2,
  },
};

// Style metadata for UI
export const styleMetadata: Record<UIStyle, { name: string; description: string; category: string }> = {
  glassmorphism: { name: 'Glassmorphism', description: 'Translucent blur effects', category: 'Depth & Texture' },
  neumorphism: { name: 'Neumorphism', description: 'Soft UI with subtle shadows', category: 'Depth & Texture' },
  claymorphism: { name: 'Claymorphism', description: 'Puffy 3D shapes', category: 'Depth & Texture' },
  skeuomorphism: { name: 'Skeuomorphism', description: 'Realistic textures', category: 'Depth & Texture' },
  papercraft: { name: 'Papercraft', description: 'Stacked paper layers', category: 'Depth & Texture' },
  y2k: { name: 'Y2K / 90s OS', description: 'Windows 95 aesthetic', category: 'Retro & Nostalgia' },
  pixel: { name: 'Pixel Art', description: '8-bit blocky style', category: 'Retro & Nostalgia' },
  terminal: { name: 'Terminal', description: 'Command-line interface', category: 'Retro & Nostalgia' },
  synthwave: { name: 'Synthwave', description: '80s neon sunset', category: 'Retro & Nostalgia' },
  cyberpunk: { name: 'Cyberpunk', description: 'High tech neon', category: 'Retro & Nostalgia' },
  material: { name: 'Material Design', description: 'Google design system', category: 'Clean & Corporate' },
  fluent: { name: 'Fluent Design', description: 'Microsoft design system', category: 'Clean & Corporate' },
  saas: { name: 'SaaS / Corporate', description: 'Clean and trustworthy', category: 'Clean & Corporate' },
  minimalist: { name: 'Minimalist', description: 'Black and white simplicity', category: 'Clean & Corporate' },
  neobrutalism: { name: 'Neo-Brutalism', description: 'Raw hard shadows', category: 'High Contrast & Bold' },
  bauhaus: { name: 'Bauhaus', description: 'Geometric primary colors', category: 'High Contrast & Bold' },
  swiss: { name: 'Swiss Style', description: 'Typography focused', category: 'High Contrast & Bold' },
  popart: { name: 'Pop Art', description: 'Comic book aesthetic', category: 'High Contrast & Bold' },
  memphis: { name: 'Memphis', description: '80s chaos and squiggles', category: 'High Contrast & Bold' },
  industrial: { name: 'Industrial', description: 'Metallic utility', category: 'High Contrast & Bold' },
  sketch: { name: 'Sketch', description: 'Hand-drawn lines', category: 'Artistic & Niche' },
  blueprint: { name: 'Blueprint', description: 'Technical schematic', category: 'Artistic & Niche' },
  magazine: { name: 'Magazine', description: 'Editorial serif style', category: 'Artistic & Niche' },
  artdeco: { name: 'Art Deco', description: 'Gold on black luxury', category: 'Artistic & Niche' },
  aurora: { name: 'Aurora', description: 'Organic mesh gradients', category: 'Artistic & Niche' },
};

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  uiStyle: UIStyle;
  colors: typeof lightColors;
  animationsEnabled: boolean;
  
  // Actions
  setMode: (mode: ThemeMode) => void;
  setUIStyle: (style: UIStyle) => void;
  toggleTheme: () => void;
  toggleAnimations: () => void;
  setSystemTheme: (isDark: boolean) => void;
}

const applyStylePreset = (baseColors: typeof lightColors, style: UIStyle, isDark: boolean): typeof lightColors => {
  const preset = isDark ? darkStylePresets[style] : lightStylePresets[style];
  return { ...baseColors, ...preset };
};

export const useThemeStore = createStore<ThemeState>(
  persist(
    (set, get) => ({
      mode: 'dark' as ThemeMode,
      isDark: true,
      uiStyle: 'glassmorphism' as UIStyle,
      colors: applyStylePreset(darkColors, 'glassmorphism', true),
      animationsEnabled: true,

      setMode: (mode: ThemeMode) => {
        const isDark = mode === 'dark' || (mode === 'system' && get().isDark);
        const baseColors = isDark ? darkColors : lightColors;
        set({
          mode,
          isDark,
          colors: applyStylePreset(baseColors, get().uiStyle, isDark),
        });
      },

      setUIStyle: (style: UIStyle) => {
        const isDark = get().isDark;
        const baseColors = isDark ? darkColors : lightColors;
        set({
          uiStyle: style,
          colors: applyStylePreset(baseColors, style, isDark),
        });
      },

      toggleTheme: () => {
        const currentMode = get().mode;
        const newMode = currentMode === 'dark' ? 'light' : 'dark';
        const isDark = newMode === 'dark';
        const baseColors = isDark ? darkColors : lightColors;
        set({
          mode: newMode,
          isDark,
          colors: applyStylePreset(baseColors, get().uiStyle, isDark),
        });
      },

      toggleAnimations: () => {
        set({ animationsEnabled: !get().animationsEnabled });
      },

      setSystemTheme: (systemIsDark: boolean) => {
        const mode = get().mode;
        if (mode === 'system') {
          const baseColors = systemIsDark ? darkColors : lightColors;
          set({
            isDark: systemIsDark,
            colors: applyStylePreset(baseColors, get().uiStyle, systemIsDark),
          });
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: AsyncStorage,
    }
  )
);

// Export color types for TypeScript
export type ThemeColors = typeof lightColors;
export { lightColors, darkColors };
