import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
  style?: any;
}

const Grid = ({ children, cols = 1, gap = 24, className, style }: GridProps) => {
  const getGridStyle = () => {
    switch (cols) {
      case 1:
        return styles.grid1;
      case 2:
        return styles.grid2;
      case 3:
        return styles.grid3;
      case 4:
        return styles.grid4;
      default:
        return styles.grid1;
    }
  };

  return (
    <View style={[getGridStyle(), { gap }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  grid1: {
    flexDirection: 'column',
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  grid4: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default Grid;
