import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { FONTS } from '../../constants';

interface StylistFilterTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  variant?: 'default' | 'new-client' | 'regular' | 'transfer';
}

export default function StylistFilterTab({
  label,
  isActive,
  onPress,
  variant = 'default',
}: StylistFilterTabProps) {
  const getTabStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    };

    if (isActive) {
      switch (variant) {
        case 'new-client':
          return {
            ...baseStyle,
            backgroundColor: '#FEF3C7',
            borderColor: '#FDE68A',
          };
        case 'regular':
          return {
            ...baseStyle,
            backgroundColor: '#FCE7F3',
            borderColor: '#FBCFE8',
          };
        case 'transfer':
          return {
            ...baseStyle,
            backgroundColor: '#CCFBF1',
            borderColor: '#99F6E4',
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: '#E5E7EB',
            borderColor: '#D1D5DB',
          };
      }
    }

    return {
      ...baseStyle,
      backgroundColor: '#F3F4F6',
      borderColor: '#E5E7EB',
    };
  };

  return (
    <TouchableOpacity style={getTabStyle()} onPress={onPress} activeOpacity={0.7}>
      <Text
        style={[
          styles.tabText,
          isActive && styles.tabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabText: {
    fontSize: 13,
    color: '#374151',
    fontFamily: FONTS.medium,
  },
  tabTextActive: {
    fontFamily: FONTS.semiBold,
  },
});
