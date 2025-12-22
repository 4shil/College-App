import { ThemePreset } from '../../theme/types';
import { amethystHazeDarkTokens } from './dark';
import { amethystHazeLightTokens } from './light';

const amethystHazeTheme: ThemePreset = {
  id: 'amethyst-haze',
  name: 'Amethyst Haze',
  supportedUIStyles: ['glassmorphism'],
  capabilities: {
    supportsGlassSurfaces: false,
    supportsBlur: false,
    supportsAnimatedBackground: false,
  },
  variants: {
    light: { tokens: amethystHazeLightTokens },
    dark: { tokens: amethystHazeDarkTokens },
  },
};

export default amethystHazeTheme;
export { amethystHazeLightTokens, amethystHazeDarkTokens };
