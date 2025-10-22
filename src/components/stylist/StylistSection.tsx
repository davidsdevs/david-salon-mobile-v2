import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

interface StylistSectionProps {
  children: React.ReactNode;
  isTitle?: boolean;
  style?: ViewStyle;
}

export default function StylistSection({ children, isTitle = false, style }: StylistSectionProps) {
  return <View style={[isTitle ? styles.titleSection : styles.section, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: 8,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 16 : 12,
  },
  titleSection: {
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginBottom: 8,
    paddingTop: Platform.OS === 'web' ? 0 : Platform.OS === 'android' ? 24 : 20,
  },
});
