import { ThemePreset } from '../../theme/types';
import { bubblegumDarkTokens } from './dark';
import { bubblegumLightTokens } from './light';

const bubblegumTheme: ThemePreset = {
  id: 'bubblegum',
  name: 'Bubblegum',
  supportedUIStyles: ['glassmorphism'],
  capabilities: {
    supportsGlassSurfaces: false,
    supportsBlur: false,
    supportsAnimatedBackground: false,
  },
  variants: {
    light: { tokens: bubblegumLightTokens },
    dark: { tokens: bubblegumDarkTokens },
  },
};

export default bubblegumTheme;
export { bubblegumLightTokens, bubblegumDarkTokens };
