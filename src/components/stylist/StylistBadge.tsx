import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FONTS } from '../../constants';

interface StylistBadgeProps {
  label: string;
  variant?: 'new-client' | 'regular' | 'transfer' | 'confirmed' | 'pending' | 'cancelled' | 'scheduled' | 'in-service' | 'completed' | 'default';
  size?: 'small' | 'medium';
}

export default function StylistBadge({ label, variant = 'default', size = 'medium' }: StylistBadgeProps) {
  const getBadgeColors = () => {
    switch (variant) {
      case 'new-client':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }; // Yellow
      case 'regular':
        return { bg: '#FCE7F3', text: '#9F1239', border: '#FBCFE8' }; // Pink
      case 'transfer':
        return { bg: '#CCFBF1', text: '#115E59', border: '#99F6E4' }; // Teal
      case 'confirmed':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }; // Green
      case 'pending':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' }; // Yellow
      case 'scheduled':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' }; // Blue
      case 'in-service':
        return { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' }; // Indigo
      case 'completed':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' }; // Green (same as confirmed)
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' }; // Red
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' }; // Gray
    }
  };

  const colors = getBadgeColors();

  const badgeStyle: ViewStyle = {
    paddingHorizontal: size === 'small' ? 6 : 8,
    paddingVertical: size === 'small' ? 2 : 4,
    borderRadius: size === 'small' ? 10 : 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  };

  const textStyle: TextStyle = {
    fontSize: size === 'small' ? 10 : 11,
    color: colors.text,
    fontFamily: FONTS.medium,
  };

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
