import { ThemePreset } from '../../theme/types';
import { defaultDarkTokens } from './dark';
import { defaultLightTokens } from './light';

const defaultTheme: ThemePreset = {
  id: 'glassmorphism',
  name: 'Glassmorphism',
  supportedUIStyles: ['glassmorphism'],
  capabilities: {
    supportsGlassSurfaces: true,
    supportsBlur: true,
    supportsAnimatedBackground: true,
  },
  variants: {
    light: { tokens: defaultLightTokens },
    dark: { tokens: defaultDarkTokens },
  },
};

export default defaultTheme;
export { defaultLightTokens, defaultDarkTokens };
