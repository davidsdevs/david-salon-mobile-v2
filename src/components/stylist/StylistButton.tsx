import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants';

interface StylistButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'secondary';
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function StylistButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  iconSize = 16,
  disabled = false,
  style,
}: StylistButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
      paddingVertical: Platform.OS === 'web' ? 12 : 10,
      borderRadius: 8,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#9CA3AF' : '#160B53',
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: disabled ? '#9CA3AF' : '#160B53',
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: disabled ? '#E5E7EB' : '#F3F4F6',
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: Platform.OS === 'web' ? 14 : 13,
      fontFamily: FONTS.semiBold,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          color: '#FFFFFF',
        };
      case 'outline':
        return {
          ...baseStyle,
          color: disabled ? '#9CA3AF' : '#160B53',
        };
      case 'secondary':
        return {
          ...baseStyle,
          color: disabled ? '#9CA3AF' : '#160B53',
        };
      default:
        return baseStyle;
    }
  };

  const getIconColor = (): string => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'outline':
        return disabled ? '#9CA3AF' : '#160B53';
      case 'secondary':
        return disabled ? '#9CA3AF' : '#160B53';
      default:
        return '#160B53';
    }
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && <Ionicons name={icon} size={iconSize} color={getIconColor()} />}
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  );
}
