/**
 * Logger Utility
 * 
 * Provides conditional logging that automatically strips in production builds.
 * Use this instead of console.log throughout the app.
 * 
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('Debug message');
 *   logger.error('Error message');
 *   logger.warn('Warning message');
 */

const isDevelopment = __DEV__;

export const logger = {
  /**
   * Log general debug information (only in development)
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always logged, even in production)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Log informational messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Log debug messages with a prefix (only in development)
   */
  debug: (tag: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[${tag}]`, ...args);
    }
  },

  /**
   * Log success messages with emoji (only in development)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅', ...args);
    }
  },

  /**
   * Log API calls (only in development)
   */
  api: (method: string, endpoint: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🌐 [API ${method}]`, endpoint, data || '');
    }
  },

  /**
   * Log Firebase operations (only in development)
   */
  firebase: (operation: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`🔥 [Firebase ${operation}]`, ...args);
    }
  },

  /**
   * Log navigation events (only in development)
   */
  navigation: (screen: string, params?: any) => {
    if (isDevelopment) {
      console.log(`📱 [Navigation]`, screen, params || '');
    }
  },
};

export default logger;
