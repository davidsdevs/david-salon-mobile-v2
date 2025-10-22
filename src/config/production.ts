// Production Configuration
export const PRODUCTION_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env['EXPO_PUBLIC_API_URL'] || 'https://api.davidsalon.com',
  API_TIMEOUT: 30000, // 30 seconds
  
  // Error Reporting
  SENTRY_DSN: process.env['EXPO_PUBLIC_SENTRY_DSN'],
  LOG_LEVEL: 'error', // 'debug' | 'info' | 'warn' | 'error'
  
  // Performance
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_ANALYTICS: true,
  
  // Security
  ENABLE_BIOMETRIC_AUTH: true,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  
  // Caching
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Feature Flags
  FEATURES: {
    PUSH_NOTIFICATIONS: true,
    OFFLINE_MODE: true,
    DARK_MODE: true,
    MULTI_LANGUAGE: false,
    SOCIAL_LOGIN: false,
  },
  
  // Environment
  ENVIRONMENT: 'production',
  DEBUG_MODE: false,
  
  // Database
  DATABASE_VERSION: '1.0.0',
  MIGRATION_ENABLED: true,
  
  // Monitoring
  HEALTH_CHECK_INTERVAL: 60000, // 1 minute
  CRASH_REPORTING: true,
  PERFORMANCE_MONITORING: true,
};

// Development overrides
export const DEVELOPMENT_CONFIG = {
  ...PRODUCTION_CONFIG,
  API_BASE_URL: process.env['EXPO_PUBLIC_API_URL'] || 'http://localhost:3000',
  LOG_LEVEL: 'debug',
  DEBUG_MODE: true,
  ENVIRONMENT: 'development',
  FEATURES: {
    ...PRODUCTION_CONFIG.FEATURES,
    OFFLINE_MODE: false, // Disable offline mode in development
  },
};

// Get current configuration based on environment
export const getConfig = () => {
  const isDevelopment = __DEV__;
  return isDevelopment ? DEVELOPMENT_CONFIG : PRODUCTION_CONFIG;
};

export default getConfig();
