import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform } from 'react-native';
import { BookingStackParamList } from '../../types';

// Import booking screens
import BranchSelectionScreen from '../../screens/client/BranchSelectionScreen';
import DateTimeSelectionScreen from '../../screens/client/DateTimeSelectionScreen';
import ServiceStylistSelectionScreen from '../../screens/client/ServiceStylistSelectionScreen';
import BookingSummaryScreen from '../../screens/client/BookingSummaryScreen';

const Stack = createStackNavigator<BookingStackParamList>();

export default function BookingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen 
        name="BranchSelection" 
        component={BranchSelectionScreen}
        options={{
          title: 'Select Branch',
        }}
      />
      <Stack.Screen 
        name="DateTimeSelection" 
        component={DateTimeSelectionScreen}
        options={{
          title: 'Select Date & Time',
        }}
      />
      <Stack.Screen 
        name="ServiceStylistSelection" 
        component={ServiceStylistSelectionScreen}
        options={{
          title: 'Select Services & Stylist',
        }}
      />
      <Stack.Screen 
        name="BookingSummary" 
        component={BookingSummaryScreen}
        options={{
          title: 'Review & Confirm',
        }}
      />
    </Stack.Navigator>
  );
}
