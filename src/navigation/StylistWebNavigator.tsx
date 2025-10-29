import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import StylistResponsiveLayout from '../components/StylistResponsiveLayout';
import { StylistTabParamList } from '../types';

// Import stylist screens
import StylistDashboardScreen from '../screens/stylist/StylistDashboardScreen';
import StylistAppointmentsScreen from '../screens/stylist/StylistAppointmentsScreen';
import StylistServicesScreen from '../screens/stylist/StylistServicesScreen';
import StylistPortfolioScreen from '../screens/stylist/StylistPortfolioScreen';
import StylistEarningsScreen from '../screens/stylist/StylistEarningsScreen';
import StylistProfileScreen from '../screens/stylist/StylistProfileScreen';

const Stack = createStackNavigator<StylistTabParamList>();

// Wrapper component for each screen with responsive layout
const ScreenWrapper = ({ 
  children, 
  screenName 
}: { 
  children: React.ReactNode; 
  screenName: keyof StylistTabParamList;
}) => {
  if (Platform.OS === 'web') {
    return (
      <StylistResponsiveLayout currentScreen={screenName}>
        {children}
      </StylistResponsiveLayout>
    );
  }
  return <>{children}</>;
};

export default function StylistWebNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="StylistDashboard"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StylistDashboard">
        {() => (
          <ScreenWrapper screenName="StylistDashboard">
            <StylistDashboardScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="StylistAppointments">
        {() => (
          <ScreenWrapper screenName="StylistAppointments">
            <StylistAppointmentsScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="StylistServiceHistory">
        {() => (
          <ScreenWrapper screenName="StylistServiceHistory">
            <StylistServicesScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="StylistPortfolio">
        {() => (
          <ScreenWrapper screenName="StylistPortfolio">
            <StylistPortfolioScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="StylistEarnings">
        {() => (
          <ScreenWrapper screenName="StylistEarnings">
            <StylistEarningsScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="StylistProfile">
        {() => (
          <ScreenWrapper screenName="StylistProfile">
            <StylistProfileScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
