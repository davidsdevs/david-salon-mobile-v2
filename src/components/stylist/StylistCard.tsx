import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

interface StylistCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function StylistCard({ children, style }: StylistCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'web' ? 0.25 : 0.1,
    shadowRadius: Platform.OS === 'web' ? 15 : 8,
    elevation: 3,
  },
});
