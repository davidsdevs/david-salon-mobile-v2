import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_CONFIG, SCREEN_DIMENSIONS } from '../constants';
import Header from './Header';

interface ScreenWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showNotification?: boolean;
  scrollable?: boolean;
  showBackButton?: boolean;
  userType?: 'client' | 'stylist';
}

const isIPhone = Platform.OS === 'ios';

export default function ScreenWrapper({
  children,
  title,
  subtitle,
  showNotification = true,
  scrollable = true,
  showBackButton = false,
  userType = 'client',
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();
  const content = scrollable ? (
    <ScrollView 
      style={[styles.scrollContainer, { paddingTop: insets.top + 80 }]} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, { 
      paddingTop: insets.top + 90,
      paddingBottom: insets.bottom + 80 
    }]}>
      {children}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Header
        title={title}
        subtitle={subtitle}
        showNotification={showNotification}
        showBackButton={showBackButton}
        userType={userType}
      />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: APP_CONFIG.backgroundColor,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
});
