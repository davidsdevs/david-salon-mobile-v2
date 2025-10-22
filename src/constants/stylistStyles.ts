import { Platform, StyleSheet } from 'react-native';

// Import FONTS directly to avoid circular dependency
const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

/**
 * Shared styling constants for Stylist screens
 * Ensures consistency across all stylist pages
 */

export const STYLIST_COLORS = {
  // Primary colors
  primary: '#160B53',
  secondary: '#2D1B69',
  accent: '#4A2C8A',
  
  // Background colors
  background: '#F5F5F5',
  webBackground: '#F9FAFB',
  surface: '#FFFFFF',
  
  // Text colors
  textPrimary: '#160B53',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  // Status colors
  confirmed: '#4CAF50',
  pending: '#FF9800',
  cancelled: '#F44336',
  
  // Client type badge colors
  newClient: {
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  },
  regular: {
    bg: '#FCE7F3',
    text: '#9F1239',
    border: '#FBCFE8',
  },
  transfer: {
    bg: '#CCFBF1',
    text: '#115E59',
    border: '#99F6E4',
  },
} as const;

export const STYLIST_SPACING = {
  // Section spacing
  sectionPaddingHorizontal: Platform.OS === 'web' ? 0 : 16,
  sectionPaddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 20 : 10,
  sectionMarginBottom: Platform.OS === 'web' ? 24 : 20,
  
  // Card spacing
  cardPadding: 16,
  cardMarginBottom: 12,
  cardBorderRadius: 12,
  
  // Element spacing
  elementGap: 8,
  smallGap: 4,
  largeGap: 16,
} as const;

export const STYLIST_TYPOGRAPHY = {
  // Page titles
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 25 : Platform.OS === 'ios' ? 18 : 16,
    color: STYLIST_COLORS.textPrimary,
    fontFamily: FONTS.bold,
    marginBottom: Platform.OS === 'web' ? 16 : 12,
  },
  
  // Section titles
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 16 : Platform.OS === 'ios' ? 15 : 14,
    color: STYLIST_COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
  },
  
  // Card titles
  cardTitle: {
    fontSize: Platform.OS === 'web' ? 16 : 15,
    color: STYLIST_COLORS.textPrimary,
    fontFamily: FONTS.semiBold,
  },
  
  // Body text
  bodyText: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: STYLIST_COLORS.textSecondary,
    fontFamily: FONTS.regular,
  },
  
  // Small text
  smallText: {
    fontSize: Platform.OS === 'web' ? 13 : 12,
    color: STYLIST_COLORS.textTertiary,
    fontFamily: FONTS.regular,
  },
} as const;

export const STYLIST_SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  webCard: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 0,
  },
} as const;

/**
 * Common card style for all stylist screens
 */
export const createCardStyle = () => ({
  backgroundColor: STYLIST_COLORS.surface,
  borderRadius: STYLIST_SPACING.cardBorderRadius,
  padding: STYLIST_SPACING.cardPadding,
  marginBottom: STYLIST_SPACING.cardMarginBottom,
  ...(Platform.OS === 'web' ? STYLIST_SHADOWS.webCard : STYLIST_SHADOWS.card),
});

/**
 * Common section style for all stylist screens
 */
export const createSectionStyle = () => ({
  paddingHorizontal: STYLIST_SPACING.sectionPaddingHorizontal,
  paddingTop: STYLIST_SPACING.sectionPaddingTop,
  marginBottom: STYLIST_SPACING.sectionMarginBottom,
});

/**
 * Common button styles
 */
export const STYLIST_BUTTONS = {
  primary: {
    backgroundColor: STYLIST_COLORS.primary,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  outline: {
    backgroundColor: STYLIST_COLORS.surface,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: STYLIST_COLORS.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'web' ? 13 : 12,
    fontFamily: FONTS.semiBold,
  },
  outlineText: {
    color: STYLIST_COLORS.primary,
    fontSize: Platform.OS === 'web' ? 13 : 12,
    fontFamily: FONTS.semiBold,
  },
} as const;

/**
 * Client type badge helper
 */
export const getClientTypeBadgeColors = (type: string) => {
  switch (type) {
    case 'X - New Client':
      return STYLIST_COLORS.newClient;
    case 'R - Regular':
      return STYLIST_COLORS.regular;
    case 'TR - Transfer':
      return STYLIST_COLORS.transfer;
    default:
      return {
        bg: '#F3F4F6',
        text: '#374151',
        border: '#E5E7EB',
      };
  }
};

/**
 * Status badge helper
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return STYLIST_COLORS.confirmed;
    case 'pending':
      return STYLIST_COLORS.pending;
    case 'cancelled':
      return STYLIST_COLORS.cancelled;
    default:
      return '#9E9E9E';
  }
};
