// App configuration
export const APP_CONFIG = {
  name: "David's Salon",
  version: "1.0.0",
  primaryColor: "#160B53", // Custom navy blue
  secondaryColor: "#1A0F5C", // Darker navy
  accentColor: "#2D1B69", // Lighter navy
  backgroundColor: "#F8FAFC",
  surfaceColor: "#FFFFFF",
  textColor: "#1F2937",
  lightTextColor: "#6B7280",
  borderColor: "#E5E7EB",
  successColor: "#10B981",
  warningColor: "#F59E0B",
  errorColor: "#EF4444",
};

// Font families with local Poppins fonts (Android compatible)
export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

// Font families with system fallbacks for better compatibility
export const FONT_FAMILIES = {
  regular: 'Poppins-Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  medium: 'Poppins-Medium, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  semiBold: 'Poppins-SemiBold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  bold: 'Poppins-Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

// Typography - Consistent font sizes across the app
export const TYPOGRAPHY = {
  // Headings
  h1: 24,
  h2: 20,
  h3: 18,
  h4: 16,
  
  // Body text
  body: 15,
  bodySmall: 14,
  
  // Labels and captions
  label: 12,
  caption: 11,
  tiny: 10,
  
  // Special
  button: 15,
  input: 15,
} as const;

// Spacing - Consistent spacing values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// Border radius values
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Screen dimensions
export const SCREEN_DIMENSIONS = {
  padding: 16,
  borderRadius: 12,
  headerHeight: 60,
  tabBarHeight: 60,
} as const;

// API endpoints (when implemented)
export const API_ENDPOINTS = {
  baseUrl: process.env['EXPO_PUBLIC_API_URL'] || 'https://api.davidssalon.com',
  auth: '/auth',
  appointments: '/appointments',
  products: '/products',
  rewards: '/rewards',
  profile: '/profile',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  userToken: 'user_token',
  userData: 'user_data',
  onboardingComplete: 'onboarding_complete',
  rememberMe: 'remember_me',
} as const;

// Export stylist-specific styles for consistency
export * from './stylistStyles';
