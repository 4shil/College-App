import { ThemePreset } from '../../theme/types';
import { violetBloomDarkTokens } from './dark';
import { violetBloomLightTokens } from './light';

const violetBloomTheme: ThemePreset = {
  id: 'violet-bloom',
  name: 'Violet Bloom',
  supportedUIStyles: ['glassmorphism'],
  capabilities: {
    supportsGlassSurfaces: false,
    supportsBlur: false,
    supportsAnimatedBackground: false,
  },
  variants: {
    light: { tokens: violetBloomLightTokens },
    dark: { tokens: violetBloomDarkTokens },
  },
};

export default violetBloomTheme;
export { violetBloomLightTokens, violetBloomDarkTokens };
