import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { RootStackParamList } from '../types';

// Import screens
import OnboardingScreen from '../screens/shared/OnboardingScreen';
import LoginPageScreen from '../screens/shared/LoginPageScreen';
import MainTabNavigator from './client/MainTabNavigator';
import StylistTabNavigator from './stylist/StylistTabNavigator';
import WebNavigator from './WebNavigator';
import StylistWebNavigator from './StylistWebNavigator';
import BookingNavigator from './client/BookingNavigator';
import NotificationsScreen from '../screens/client/NotificationsScreen';
import StylistNotificationsScreen from '../screens/stylist/StylistNotificationsScreen';
import StylistTransactionDetailsScreen from '../screens/stylist/StylistTransactionDetailsScreen';
import StylistServicesScreen from '../screens/stylist/StylistServicesScreen';
import StylistPortfolioScreen from '../screens/stylist/StylistPortfolioScreen';
import StylistEarningsScreen from '../screens/stylist/StylistEarningsScreen';
import StylistProfileScreen from '../screens/stylist/StylistProfileScreen';
import StylistEditProfileScreen from '../screens/stylist/StylistEditProfileScreen';
import StylistChangePasswordScreen from '../screens/stylist/StylistChangePasswordScreen';
import StylistNotificationSettingsScreen from '../screens/stylist/StylistNotificationSettingsScreen';
import SettingsScreen from '../screens/shared/SettingsScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isOnboardingComplete: boolean;
  isLoggedIn: boolean;
  userType?: 'client' | 'stylist';
}

export default function RootNavigator({ isOnboardingComplete, isLoggedIn, userType = 'client' }: RootNavigatorProps) {
  console.log('🧭 RootNavigator received props:', { isOnboardingComplete, isLoggedIn, userType });
  console.log('🧭 RootNavigator - isOnboardingComplete type:', typeof isOnboardingComplete);
  console.log('🧭 RootNavigator - isOnboardingComplete value:', isOnboardingComplete);
  
  // Choose the appropriate navigator based on platform and user type
  const getMainNavigator = () => {
    console.log('🧭 getMainNavigator - userType:', userType, 'Platform:', Platform.OS);
    if (Platform.OS === 'web') {
      const navigator = userType === 'stylist' ? StylistWebNavigator : WebNavigator;
      console.log('🧭 getMainNavigator - Web navigator:', navigator.name);
      return navigator;
    }
    const navigator = userType === 'stylist' ? StylistTabNavigator : MainTabNavigator;
    console.log('🧭 getMainNavigator - Mobile navigator:', navigator.name);
    return navigator;
  };

  const MainNavigator = getMainNavigator();

  console.log('🧭 RootNavigator - Determining current screen:', { isOnboardingComplete, isLoggedIn, userType });

  // Show onboarding if not complete
  if (!isOnboardingComplete) {
    console.log('🧭 Showing: Onboarding');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show login if not authenticated
  if (!isLoggedIn) {
    console.log('🧭 Showing: LoginPage');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginPageScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // Show main app if authenticated
  console.log('🧭 Showing: MainApp with navigator:', MainNavigator.name);
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="Booking" component={BookingNavigator} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="StylistNotifications" component={StylistNotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="StylistProfile" component={StylistProfileScreen} />
        <Stack.Screen name="StylistServiceHistory" component={StylistServicesScreen} />
        <Stack.Screen name="StylistPortfolio" component={StylistPortfolioScreen} />
        <Stack.Screen name="StylistEarnings" component={StylistEarningsScreen} />
        <Stack.Screen name="StylistEditProfile" component={StylistEditProfileScreen} />
        <Stack.Screen name="StylistChangePassword" component={StylistChangePasswordScreen} />
        <Stack.Screen name="StylistNotificationSettings" component={StylistNotificationSettingsScreen} />
        <Stack.Screen name="StylistTransactionDetails" component={StylistTransactionDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

