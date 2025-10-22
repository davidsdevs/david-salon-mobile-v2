import { FONT_FAMILIES } from '../constants';

// Font configuration for local Poppins fonts (Android compatible)
export const fontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium', 
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

// Fallback fonts for better compatibility
export const getFontFamily = (weight: 'regular' | 'medium' | 'semiBold' | 'bold' = 'regular') => {
  return fontFamily[weight];
};

// Get font family with system fallbacks (for web compatibility)
export const getFontFamilyWithFallback = (weight: 'regular' | 'medium' | 'semiBold' | 'bold' = 'regular') => {
  return FONT_FAMILIES[weight];
};
