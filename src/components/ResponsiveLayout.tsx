import React from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from '../types';
import SidebarWithHeader from './SidebarWithHeader';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  currentScreen: keyof MainTabParamList | 'Booking';
}

const isWeb = Platform.OS === 'web';

export default function ResponsiveLayout({ children, currentScreen }: ResponsiveLayoutProps) {
  const getPageTitle = (screen: keyof MainTabParamList | 'Booking') => {
    const titles = {
      Dashboard: 'Dashboard',
      Appointments: 'Appointments',
      Products: 'Products',
      Rewards: 'Rewards',
      Profile: 'Profile',
      Notifications: 'Notifications',
      Booking: 'Book Appointment',
    };
    return titles[screen] || 'Dashboard';
  };

  // User info for the sidebar
  const userInfo = {
    name: "Claire Cruz",
    subtitle: "Member since 2022",
    profileImage: undefined, // Will use default logo
    badge: "Gold Member"
  };

  if (isWeb) {
    // Web Layout with Sidebar (matching salon-management-system exactly)
    // Map Booking to Appointments for sidebar navigation
    const sidebarScreen = currentScreen === 'Booking' ? 'Appointments' : currentScreen;
    
    return (
      <SidebarWithHeader
        userInfo={userInfo}
        pageTitle={getPageTitle(currentScreen)}
        currentScreen={sidebarScreen as keyof MainTabParamList}
        userType="client"
      >
        {children}
      </SidebarWithHeader>
    );
  }

  // Mobile Layout - just return children (bottom nav handled by MainTabNavigator)
  return <>{children}</>;
}

