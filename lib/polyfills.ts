// Polyfill for import.meta.env in non-ESM environments
const _global = globalThis as unknown as Record<string, unknown>;
if (typeof globalThis !== 'undefined' && !_global.importMetaEnv) {
  // Create a mock import.meta.env
  _global.importMetaEnv = {
    MODE: __DEV__ ? 'development' : 'production',
    DEV: __DEV__,
    PROD: !__DEV__,
  };
}

// For web environments
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  window.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
}
