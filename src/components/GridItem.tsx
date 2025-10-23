import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface GridItemProps {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4;
  className?: string;
  style?: any;
}

const GridItem = ({ children, span = 1, className, style }: GridItemProps) => {
  const getItemStyle = () => {
    const baseWidth = 100 / 4; // Assuming 4-column grid as base
    const width = (baseWidth * span) - 2; // Subtract 2% for gap compensation
    
    return {
      width: `${width}%`,
    };
  };

  return (
    <View style={[getItemStyle(), style]}>
      {children}
    </View>
  );
};

export default GridItem;
