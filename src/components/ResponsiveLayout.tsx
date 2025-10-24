import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentScreen: string;
}

export default function ResponsiveLayout({ children, currentScreen }: ResponsiveLayoutProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        {children}
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
  },
});


