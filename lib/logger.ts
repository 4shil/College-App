/**
 * Development-only logging utility
 * Logs are stripped in production builds for performance and security
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
    // In production, you could send to error tracking service like Sentry
    // Example: Sentry.captureException(args[0]);
  },
  
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
  
  /**
   * Log with a specific tag for easier filtering
   */
  tagged: (tag: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[${tag}]`, ...args);
    }
  },
};

export default logger;
