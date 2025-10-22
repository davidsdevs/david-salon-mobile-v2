import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import ResponsiveLayout from '../components/ResponsiveLayout';
import { MainTabParamList } from '../types';

// Import screens
import DashboardScreen from '../screens/client/DashboardScreen';
import AppointmentsScreen from '../screens/client/AppointmentsScreen';
import ProductsScreen from '../screens/client/ProductsScreen';
import RewardsScreen from '../screens/client/RewardsScreen';
import ProfileScreen from '../screens/client/ProfileScreen';

const Stack = createStackNavigator<MainTabParamList>();

// Wrapper component for each screen with responsive layout
const ScreenWrapper = ({ 
  children, 
  screenName 
}: { 
  children: React.ReactNode; 
  screenName: keyof MainTabParamList;
}) => {
  if (Platform.OS === 'web') {
    return (
      <ResponsiveLayout currentScreen={screenName}>
        {children}
      </ResponsiveLayout>
    );
  }
  return <>{children}</>;
};

export default function WebNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard">
        {() => (
          <ScreenWrapper screenName="Dashboard">
            <DashboardScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="Appointments">
        {() => (
          <ScreenWrapper screenName="Appointments">
            <AppointmentsScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="Products">
        {() => (
          <ScreenWrapper screenName="Products">
            <ProductsScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="Rewards">
        {() => (
          <ScreenWrapper screenName="Rewards">
            <RewardsScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="Profile">
        {() => (
          <ScreenWrapper screenName="Profile">
            <ProfileScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
