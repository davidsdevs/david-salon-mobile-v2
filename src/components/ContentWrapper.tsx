import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const ContentWrapper = ({ children, className }: ContentWrapperProps) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // space-y-6 equivalent - 24px gap between children
    gap: 24,
    flexGrow: 1, // Ensure it takes up available space for proper scrolling
  },
});

export default ContentWrapper;
