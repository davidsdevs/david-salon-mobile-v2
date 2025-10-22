import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import StylistResponsiveLayout from '../components/StylistResponsiveLayout';
import { StylistTabParamList } from '../types';

// Import stylist screens
import StylistDashboardScreen from '../screens/stylist/StylistDashboardScreen';
import StylistAppointmentsScreen from '../screens/stylist/StylistAppointmentsScreen';
import StylistClientsScreen from '../screens/stylist/StylistClientsScreen';
import StylistScheduleScreen from '../screens/stylist/StylistScheduleScreen';
import StylistPortfolioScreen from '../screens/stylist/StylistPortfolioScreen';

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
      <Stack.Screen name="StylistClients">
        {() => (
          <ScreenWrapper screenName="StylistClients">
            <StylistClientsScreen />
          </ScreenWrapper>
        )}
      </Stack.Screen>
      <Stack.Screen name="StylistSchedule">
        {() => (
          <ScreenWrapper screenName="StylistSchedule">
            <StylistScheduleScreen />
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
    </Stack.Navigator>
  );
}
