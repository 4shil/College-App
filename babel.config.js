module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['.'],
        alias: {
          '@': '.',
          '@components': './components',
          '@lib': './lib',
          '@hooks': './hooks',
          '@store': './store',
          '@theme': './theme',
          '@types': './types',
        },
      }],
      ['react-native-reanimated/plugin', {
        globals: ['__scanCodes'],
      }],
    ],
  };
};
