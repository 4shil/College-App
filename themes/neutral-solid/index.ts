import { ThemePreset } from '../../theme/types';
import { neutralSolidDarkTokens } from './dark';
import { neutralSolidLightTokens } from './light';

const neutralSolidTheme: ThemePreset = {
  id: 'neutral-solid',
  name: 'Neutral Solid',
  supportedUIStyles: ['glassmorphism'],
  capabilities: {
    supportsGlassSurfaces: false,
    supportsBlur: false,
    supportsAnimatedBackground: false,
  },
  variants: {
    light: { tokens: neutralSolidLightTokens },
    dark: { tokens: neutralSolidDarkTokens },
  },
};

export default neutralSolidTheme;
export { neutralSolidLightTokens, neutralSolidDarkTokens };
