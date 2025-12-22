import { ThemePreset } from '../../theme/types';
import { amberMinimalDarkTokens } from './dark';
import { amberMinimalLightTokens } from './light';

const amberMinimalTheme: ThemePreset = {
  id: 'amber-minimal',
  name: 'Amber Minimal',
  supportedUIStyles: ['glassmorphism'],
  capabilities: {
    supportsGlassSurfaces: false,
    supportsBlur: false,
    supportsAnimatedBackground: false,
  },
  variants: {
    light: { tokens: amberMinimalLightTokens },
    dark: { tokens: amberMinimalDarkTokens },
  },
};

export default amberMinimalTheme;
export { amberMinimalLightTokens, amberMinimalDarkTokens };
